'use client'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { storage } from '@/lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Camera, Mic, MicOff, Video, Upload, FileText, Brain, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface EvidenceItem {
  id: string
  type: 'photo' | 'video' | 'audio' | 'document'
  file: File
  url: string
  downloadURL?: string
  aiAnalysis?: {
    category: string
    confidence: number
    description: string
    severity: 'low' | 'medium' | 'high'
    tags: string[]
  }
  transcription?: string
  metadata: {
    size: number
    duration?: number
    location?: { lat: number; lng: number }
    timestamp: Date
  }
}

export function EnhancedEvidenceCollection() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('')
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileUpload = async (files: FileList | null, type: 'photo' | 'video' | 'document') => {
    if (!files || !user) return
    
    setIsUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        const evidenceItem: EvidenceItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type,
          file,
          url: URL.createObjectURL(file),
          metadata: {
            size: file.size,
            timestamp: new Date()
          }
        }
        
        setEvidence(prev => [...prev, evidenceItem])
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, `evidence/${user.uid}/${Date.now()}_${file.name}`)
        const uploadTask = uploadBytesResumable(storageRef, file)
        
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadProgress(progress)
          },
          (error) => {
            console.error('Upload error:', error)
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              
              // Update evidence item with download URL
              setEvidence(prev => prev.map(item => 
                item.id === evidenceItem.id 
                  ? { ...item, downloadURL }
                  : item
              ))
              
              // Save to Firestore
              await addDoc(collection(db, 'evidenceFiles'), {
                type,
                fileName: file.name,
                fileSize: file.size,
                downloadURL,
                uploadedBy: user.uid,
                createdAt: serverTimestamp(),
                metadata: evidenceItem.metadata
              })
              
              // Trigger AI analysis for images and videos
              if (type === 'photo' || type === 'video') {
                analyzeEvidence(evidenceItem)
              }
            } catch (error) {
              console.error('Error getting download URL:', error)
            }
          }
        )
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })
        
        const evidenceItem: EvidenceItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: 'audio',
          file: audioFile,
          url: URL.createObjectURL(audioBlob),
          metadata: {
            size: audioFile.size,
            duration: recordingTime,
            timestamp: new Date()
          }
        }
        
        setEvidence(prev => [...prev, evidenceItem])
        
        // Upload audio file to Firebase Storage
        if (user) {
          const storageRef = ref(storage, `evidence/${user.uid}/audio/${Date.now()}_${audioFile.name}`)
          const uploadTask = uploadBytesResumable(storageRef, audioFile)
          
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(progress)
            },
            (error) => {
              console.error('Upload error:', error)
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                
                // Update evidence item with download URL
                setEvidence(prev => prev.map(item => 
                  item.id === evidenceItem.id 
                    ? { ...item, downloadURL }
                    : item
                ))
                
                // Save to Firestore
                await addDoc(collection(db, 'evidenceFiles'), {
                  type: 'audio',
                  fileName: audioFile.name,
                  fileSize: audioFile.size,
                  downloadURL,
                  uploadedBy: user.uid,
                  createdAt: serverTimestamp(),
                  metadata: evidenceItem.metadata
                })
                
                transcribeAudio(evidenceItem)
              } catch (error) {
                console.error('Error getting download URL:', error)
              }
            }
          )
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const analyzeEvidence = async (evidenceItem: EvidenceItem) => {
    setIsAnalyzing(true)
    setCurrentAnalysis('Analyzing evidence...')
    
    try {
      // Mock AI analysis - in real app this would call a cloud function
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockAnalysis = {
        category: evidenceItem.type === 'photo' ? 'Infrastructure' : 'General',
        confidence: 0.85,
        description: 'Detected potential service delivery issue',
        severity: 'medium' as const,
        tags: ['infrastructure', 'maintenance', 'public-safety']
      }
      
      setEvidence(prev => prev.map(item => 
        item.id === evidenceItem.id 
          ? { ...item, aiAnalysis: mockAnalysis }
          : item
      ))
      
      setCurrentAnalysis('Analysis complete!')
    } catch (error) {
      console.error('Error analyzing evidence:', error)
      setCurrentAnalysis('Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const transcribeAudio = async (evidenceItem: EvidenceItem) => {
    setIsAnalyzing(true)
    setCurrentAnalysis('Transcribing audio...')
    
    try {
      // Mock transcription - in real app this would use speech-to-text API
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockTranscription = 'This is a mock transcription of the audio recording. In a real implementation, this would be generated using speech-to-text services.'
      
      setEvidence(prev => prev.map(item => 
        item.id === evidenceItem.id 
          ? { ...item, transcription: mockTranscription }
          : item
      ))
      
      setCurrentAnalysis('Transcription complete!')
    } catch (error) {
      console.error('Error transcribing audio:', error)
      setCurrentAnalysis('Transcription failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeEvidence = (id: string) => {
    setEvidence(prev => prev.filter(item => item.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('evidence.title')}</h2>
        <p className="text-muted-foreground">{t('evidence.description')}</p>
      </div>

      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="photos">{t('evidence.photos')}</TabsTrigger>
          <TabsTrigger value="videos">{t('evidence.videos')}</TabsTrigger>
          <TabsTrigger value="audio">{t('evidence.audio')}</TabsTrigger>
          <TabsTrigger value="documents">{t('evidence.documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t('evidence.uploadPhotos')}
              </CardTitle>
              <CardDescription>
                {t('evidence.photoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">{t('evidence.dragDropPhotos')}</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, 'photo')}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button asChild>
                    <span>{t('evidence.selectPhotos')}</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {t('evidence.uploadVideos')}
              </CardTitle>
              <CardDescription>
                {t('evidence.videoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">{t('evidence.dragDropVideos')}</p>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, 'video')}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload">
                  <Button asChild>
                    <span>{t('evidence.selectVideos')}</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                {t('evidence.recordAudio')}
              </CardTitle>
              <CardDescription>
                {t('evidence.audioDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                {!isRecording ? (
                  <Button onClick={startRecording} size="lg">
                    <Mic className="h-5 w-5 mr-2" />
                    {t('evidence.startRecording')}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-2xl font-mono">
                      {formatDuration(recordingTime)}
                    </div>
                    <Button onClick={stopRecording} variant="destructive" size="lg">
                      <MicOff className="h-5 w-5 mr-2" />
                      {t('evidence.stopRecording')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('evidence.uploadDocuments')}
              </CardTitle>
              <CardDescription>
                {t('evidence.documentDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">{t('evidence.dragDropDocuments')}</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, 'document')}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload">
                  <Button asChild>
                    <span>{t('evidence.selectDocuments')}</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('evidence.uploading')}</span>
                <span className="text-sm text-muted-foreground">{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Status */}
      {isAnalyzing && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            {currentAnalysis}
            <Loader2 className="h-4 w-4 ml-2 animate-spin inline" />
          </AlertDescription>
        </Alert>
      )}

      {/* Evidence List */}
      {evidence.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('evidence.uploadedFiles')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidence.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{item.type}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvidence(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>{item.file.name}</p>
                      <p>{formatFileSize(item.metadata.size)}</p>
                      {item.metadata.duration && (
                        <p>{formatDuration(item.metadata.duration)}</p>
                      )}
                    </div>

                    {item.type === 'photo' && (
                      <img
                        src={item.url}
                        alt={item.file.name}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}

                    {item.type === 'video' && (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-32 object-cover rounded"
                      />
                    )}

                    {item.type === 'audio' && (
                      <audio
                        src={item.url}
                        controls
                        className="w-full"
                      />
                    )}

                    {item.aiAnalysis && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">AI Analysis</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p><strong>Category:</strong> {item.aiAnalysis.category}</p>
                          <p><strong>Confidence:</strong> {(item.aiAnalysis.confidence * 100).toFixed(0)}%</p>
                          <p><strong>Severity:</strong> {item.aiAnalysis.severity}</p>
                          <p><strong>Description:</strong> {item.aiAnalysis.description}</p>
                        </div>
                      </div>
                    )}

                    {item.transcription && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Transcription</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.transcription}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}