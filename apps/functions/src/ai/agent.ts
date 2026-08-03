/**
 * ServeSA AI Agent - Core AI Assistant System
 * Handles natural language processing, case analysis, and intelligent assistance
 */

import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

const db = getFirestore()
const auth = getAuth()

// AI Agent Configuration
interface AIAgentConfig {
  model: 'gpt-4' | 'claude-3' | 'local'
  maxTokens: number
  temperature: number
  systemPrompt: string
  contextWindow: number
}

// AI Agent Response Types
interface AIResponse {
  type: 'text' | 'action' | 'data' | 'error'
  content: string
  confidence: number
  actions?: AIAction[]
  data?: any
  metadata?: {
    processingTime: number
    tokensUsed: number
    model: string
  }
}

interface AIAction {
  type: 'create_case' | 'update_case' | 'search_cases' | 'analyze_image' | 'predict_failure' | 'send_notification'
  parameters: any
  confidence: number
}

interface ConversationContext {
  userId: string
  sessionId: string
  messages: ConversationMessage[]
  userProfile: any
  municipalityContext: any
  lastActivity: Date
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: any
}

// AI Agent Core Class
export class ServeSAAIAgent {
  private config: AIAgentConfig
  private context: ConversationContext | null = null

  constructor(config?: Partial<AIAgentConfig>) {
    this.config = {
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
      systemPrompt: this.getSystemPrompt(),
      contextWindow: 10,
      ...config
    }
  }

  /**
   * Main AI Agent entry point
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId: string,
    context?: any
  ): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Load or create conversation context
      await this.loadContext(userId, sessionId)

      // Add user message to context
      this.addMessage('user', message)

      // Analyze the message intent
      const intent = await this.analyzeIntent(message)

      // Process based on intent
      let response: AIResponse

      switch (intent.type) {
        case 'case_report':
          response = await this.handleCaseReport(message, intent)
          break
        case 'case_inquiry':
          response = await this.handleCaseInquiry(message, intent)
          break
        case 'image_analysis':
          response = await this.handleImageAnalysis(message, intent)
          break
        case 'predictive_analysis':
          response = await this.handlePredictiveAnalysis(message, intent)
          break
        case 'general_help':
          response = await this.handleGeneralHelp(message, intent)
          break
        case 'municipality_info':
          response = await this.handleMunicipalityInfo(message, intent)
          break
        default:
          response = await this.handleGeneralQuery(message, intent)
      }

      // Add assistant response to context
      this.addMessage('assistant', response.content)

      // Save conversation context
      await this.saveContext()

      // Add metadata
      response.metadata = {
        processingTime: Date.now() - startTime,
        tokensUsed: this.estimateTokens(message + response.content),
        model: this.config.model
      }

      return response

    } catch (error) {
      console.error('AI Agent error:', error)
      return {
        type: 'error',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        confidence: 0,
        metadata: {
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          model: this.config.model
        }
      }
    }
  }

  /**
   * Analyze user intent from message
   */
  private async analyzeIntent(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase()

    // Intent detection patterns
    const intents = [
      {
        type: 'case_report',
        patterns: ['report', 'issue', 'problem', 'broken', 'damaged', 'leak', 'outage'],
        confidence: 0.8
      },
      {
        type: 'case_inquiry',
        patterns: ['status', 'update', 'progress', 'when', 'how long', 'track'],
        confidence: 0.8
      },
      {
        type: 'image_analysis',
        patterns: ['analyze', 'what is this', 'identify', 'photo', 'image', 'picture'],
        confidence: 0.7
      },
      {
        type: 'predictive_analysis',
        patterns: ['predict', 'forecast', 'when will', 'likely to', 'risk'],
        confidence: 0.7
      },
      {
        type: 'municipality_info',
        patterns: ['municipality', 'ward', 'local', 'area', 'neighborhood'],
        confidence: 0.6
      },
      {
        type: 'general_help',
        patterns: ['help', 'how to', 'guide', 'tutorial', 'support'],
        confidence: 0.6
      }
    ]

    // Find best matching intent
    let bestIntent = { type: 'general_query', confidence: 0.3 }
    
    for (const intent of intents) {
      const matches = intent.patterns.filter(pattern => 
        lowerMessage.includes(pattern)
      ).length
      
      if (matches > 0) {
        const confidence = Math.min(0.9, intent.confidence + (matches * 0.1))
        if (confidence > bestIntent.confidence) {
          bestIntent = { type: intent.type, confidence }
        }
      }
    }

    return bestIntent
  }

  /**
   * Handle case reporting intent
   */
  private async handleCaseReport(message: string, intent: any): Promise<AIResponse> {
    try {
      // Extract case information from message
      const caseInfo = await this.extractCaseInfo(message)
      
      // Validate case information
      const validation = await this.validateCaseInfo(caseInfo)
      
      if (!validation.valid) {
        return {
          type: 'text',
          content: `I'd be happy to help you report an issue. However, I need a bit more information: ${validation.missing.join(', ')}. Could you please provide these details?`,
          confidence: 0.8
        }
      }

      // Create case action
      const action: AIAction = {
        type: 'create_case',
        parameters: {
          title: caseInfo.title,
          description: caseInfo.description,
          category: caseInfo.category,
          priority: caseInfo.priority,
          location: caseInfo.location,
          contactInfo: caseInfo.contactInfo
        },
        confidence: 0.9
      }

      return {
        type: 'action',
        content: `I understand you want to report a ${caseInfo.category} issue. I can help you create this case. Would you like me to proceed with creating the case with the information you've provided?`,
        confidence: 0.9,
        actions: [action]
      }

    } catch (error) {
      return {
        type: 'text',
        content: 'I can help you report an issue. Could you please describe what problem you\'re experiencing and where it\'s located?',
        confidence: 0.7
      }
    }
  }

  /**
   * Handle case inquiry intent
   */
  private async handleCaseInquiry(message: string, intent: any): Promise<AIResponse> {
    try {
      // Extract case ID or search terms
      const searchTerms = await this.extractSearchTerms(message)
      
      // Search for cases
      const cases = await this.searchCases(searchTerms)
      
      if (cases.length === 0) {
        return {
          type: 'text',
          content: 'I couldn\'t find any cases matching your search. Could you provide more specific details or a case number?',
          confidence: 0.8
        }
      }

      // Format case information
      const caseInfo = cases.map(c => 
        `Case #${c.id}: ${c.title} - Status: ${c.status} (${c.updatedAt})`
      ).join('\n')

      return {
        type: 'data',
        content: `I found ${cases.length} case(s) matching your search:\n\n${caseInfo}\n\nWould you like more details about any specific case?`,
        confidence: 0.9,
        data: cases
      }

    } catch (error) {
      return {
        type: 'text',
        content: 'I can help you check the status of your cases. Could you provide a case number or describe what you\'re looking for?',
        confidence: 0.7
      }
    }
  }

  /**
   * Handle image analysis intent
   */
  private async handleImageAnalysis(message: string, intent: any): Promise<AIResponse> {
    try {
      // Extract image URL or reference
      const imageUrl = await this.extractImageUrl(message)
      
      if (!imageUrl) {
        return {
          type: 'text',
          content: 'I can analyze images to help identify issues. Please provide an image URL or upload a photo.',
          confidence: 0.7
        }
      }

      // Create image analysis action
      const action: AIAction = {
        type: 'analyze_image',
        parameters: {
          imageUrl: imageUrl,
          context: message
        },
        confidence: 0.8
      }

      return {
        type: 'action',
        content: 'I can analyze the image you\'ve provided to identify the issue type, severity, and provide recommendations. Would you like me to proceed with the analysis?',
        confidence: 0.8,
        actions: [action]
      }

    } catch (error) {
      return {
        type: 'text',
        content: 'I can help analyze images to identify infrastructure issues. Please provide an image for analysis.',
        confidence: 0.7
      }
    }
  }

  /**
   * Handle predictive analysis intent
   */
  private async handlePredictiveAnalysis(message: string, intent: any): Promise<AIResponse> {
    try {
      // Extract location and analysis type
      const analysisRequest = await this.extractAnalysisRequest(message)
      
      // Create predictive analysis action
      const action: AIAction = {
        type: 'predict_failure',
        parameters: {
          location: analysisRequest.location,
          analysisType: analysisRequest.type,
          timeframe: analysisRequest.timeframe
        },
        confidence: 0.8
      }

      return {
        type: 'action',
        content: `I can provide predictive analysis for ${analysisRequest.type} in your area. This will help identify potential issues before they become problems. Would you like me to run this analysis?`,
        confidence: 0.8,
        actions: [action]
      }

    } catch (error) {
      return {
        type: 'text',
        content: 'I can provide predictive analysis for infrastructure issues in your area. What type of analysis would you like me to perform?',
        confidence: 0.7
      }
    }
  }

  /**
   * Handle municipality information intent
   */
  private async handleMunicipalityInfo(message: string, intent: any): Promise<AIResponse> {
    try {
      // Get user's municipality context
      const municipality = this.context?.municipalityContext
      
      if (!municipality) {
        return {
          type: 'text',
          content: 'I can provide information about your municipality. Could you tell me which municipality you\'re interested in?',
          confidence: 0.7
        }
      }

      // Get municipality information
      const municipalityInfo = await this.getMunicipalityInfo(municipality.code)
      
      return {
        type: 'data',
        content: `Here's information about ${municipality.name}:\n\n${municipalityInfo.summary}\n\nKey services: ${municipalityInfo.services.join(', ')}\n\nRecent activity: ${municipalityInfo.recentActivity}`,
        confidence: 0.9,
        data: municipalityInfo
      }

    } catch (error) {
      return {
        type: 'text',
        content: 'I can provide information about your municipality and local services. What would you like to know?',
        confidence: 0.7
      }
    }
  }

  /**
   * Handle general help intent
   */
  private async handleGeneralHelp(message: string, intent: any): Promise<AIResponse> {
    const helpTopics = [
      'How to report an issue',
      'How to track your cases',
      'How to upload photos',
      'How to contact your municipality',
      'How to use the community features',
      'How to access help resources'
    ]

    return {
      type: 'text',
      content: `I'm here to help you with ServeSA! Here are some things I can assist you with:\n\n${helpTopics.map(topic => `• ${topic}`).join('\n')}\n\nWhat would you like help with?`,
      confidence: 0.9
    }
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(message: string, intent: any): Promise<AIResponse> {
    return {
      type: 'text',
      content: 'I\'m the ServeSA AI assistant, here to help you with municipal service delivery issues. You can ask me to help report issues, check case status, analyze photos, or get information about your municipality. What can I help you with today?',
      confidence: 0.8
    }
  }

  /**
   * Extract case information from message
   */
  private async extractCaseInfo(message: string): Promise<any> {
    // Simple extraction logic - in production, use more sophisticated NLP
    const words = message.toLowerCase().split(' ')
    
    // Extract category
    const categories = ['water', 'electricity', 'roads', 'waste', 'internet', 'emergency']
    const category = categories.find(cat => words.includes(cat)) || 'general'
    
    // Extract priority
    const priorityWords = ['emergency', 'urgent', 'high', 'medium', 'low']
    const priority = priorityWords.find(pri => words.includes(pri)) || 'medium'
    
    return {
      title: this.generateTitle(message),
      description: message,
      category: category,
      priority: priority,
      location: await this.extractLocation(message),
      contactInfo: this.context?.userProfile?.phone ? { phone: this.context.userProfile.phone } : undefined
    }
  }

  /**
   * Validate case information
   */
  private async validateCaseInfo(caseInfo: any): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = []
    
    if (!caseInfo.title || caseInfo.title.length < 5) {
      missing.push('a clear title for the issue')
    }
    
    if (!caseInfo.description || caseInfo.description.length < 10) {
      missing.push('a detailed description')
    }
    
    if (!caseInfo.location) {
      missing.push('the location of the issue')
    }
    
    return {
      valid: missing.length === 0,
      missing: missing
    }
  }

  /**
   * Extract search terms from message
   */
  private async extractSearchTerms(message: string): Promise<any> {
    // Extract case numbers, keywords, etc.
    const caseNumberMatch = message.match(/#?(\d+)/)
    const caseNumber = caseNumberMatch ? caseNumberMatch[1] : null
    
    return {
      caseNumber: caseNumber,
      keywords: message.split(' ').filter(word => word.length > 3),
      userId: this.context?.userId
    }
  }

  /**
   * Search for cases
   */
  private async searchCases(searchTerms: any): Promise<any[]> {
    try {
      let query = db.collection('cases')
      
      if (searchTerms.caseNumber) {
        query = query.where('caseId', '==', searchTerms.caseNumber)
      } else if (searchTerms.userId) {
        query = query.where('reporterUid', '==', searchTerms.userId)
      }
      
      const snapshot = await query.limit(10).get()
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error searching cases:', error)
      return []
    }
  }

  /**
   * Extract image URL from message
   */
  private async extractImageUrl(message: string): Promise<string | null> {
    const urlMatch = message.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i)
    return urlMatch ? urlMatch[1] : null
  }

  /**
   * Extract analysis request from message
   */
  private async extractAnalysisRequest(message: string): Promise<any> {
    const analysisTypes = ['water', 'electricity', 'roads', 'waste', 'infrastructure']
    const timeframes = ['week', 'month', 'quarter', 'year']
    
    const type = analysisTypes.find(t => message.toLowerCase().includes(t)) || 'infrastructure'
    const timeframe = timeframes.find(t => message.toLowerCase().includes(t)) || 'month'
    
    return {
      type: type,
      timeframe: timeframe,
      location: this.context?.municipalityContext?.code || 'unknown'
    }
  }

  /**
   * Get municipality information
   */
  private async getMunicipalityInfo(municipalityCode: string): Promise<any> {
    try {
      const doc = await db.collection('municipalities').doc(municipalityCode).get()
      if (doc.exists) {
        return doc.data()
      }
      
      // Fallback to basic info
      return {
        name: 'Your Municipality',
        summary: 'Local government services and information',
        services: ['Water', 'Electricity', 'Roads', 'Waste Management'],
        recentActivity: 'Active case management and community engagement'
      }
    } catch (error) {
      console.error('Error getting municipality info:', error)
      return {
        name: 'Your Municipality',
        summary: 'Local government services and information',
        services: ['Water', 'Electricity', 'Roads', 'Waste Management'],
        recentActivity: 'Active case management and community engagement'
      }
    }
  }

  /**
   * Generate title from message
   */
  private generateTitle(message: string): string {
    const words = message.split(' ').slice(0, 8)
    return words.join(' ') + (message.split(' ').length > 8 ? '...' : '')
  }

  /**
   * Extract location from message
   */
  private async extractLocation(message: string): Promise<any> {
    // Simple location extraction - in production, use geocoding
    return {
      address: message,
      lat: 0,
      lng: 0
    }
  }

  /**
   * Load conversation context
   */
  private async loadContext(userId: string, sessionId: string): Promise<void> {
    try {
      const doc = await db.collection('ai_conversations').doc(sessionId).get()
      
      if (doc.exists) {
        const data = doc.data()
        this.context = {
          userId: data.userId,
          sessionId: data.sessionId,
          messages: data.messages || [],
          userProfile: data.userProfile,
          municipalityContext: data.municipalityContext,
          lastActivity: data.lastActivity?.toDate() || new Date()
        }
      } else {
        // Create new context
        this.context = {
          userId: userId,
          sessionId: sessionId,
          messages: [],
          userProfile: await this.getUserProfile(userId),
          municipalityContext: await this.getMunicipalityContext(userId),
          lastActivity: new Date()
        }
      }
    } catch (error) {
      console.error('Error loading context:', error)
      this.context = {
        userId: userId,
        sessionId: sessionId,
        messages: [],
        userProfile: null,
        municipalityContext: null,
        lastActivity: new Date()
      }
    }
  }

  /**
   * Save conversation context
   */
  private async saveContext(): Promise<void> {
    if (!this.context) return
    
    try {
      await db.collection('ai_conversations').doc(this.context.sessionId).set({
        ...this.context,
        lastActivity: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error saving context:', error)
    }
  }

  /**
   * Add message to context
   */
  private addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    if (!this.context) return
    
    this.context.messages.push({
      role: role,
      content: content,
      timestamp: new Date()
    })
    
    // Keep only recent messages
    if (this.context.messages.length > this.config.contextWindow) {
      this.context.messages = this.context.messages.slice(-this.config.contextWindow)
    }
  }

  /**
   * Get user profile
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const doc = await db.collection('users').doc(userId).get()
      return doc.exists ? doc.data() : null
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  /**
   * Get municipality context
   */
  private async getMunicipalityContext(userId: string): Promise<any> {
    try {
      const userDoc = await db.collection('users').doc(userId).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        if (userData.municipalityCode) {
          const muniDoc = await db.collection('municipalities').doc(userData.municipalityCode).get()
          return muniDoc.exists ? muniDoc.data() : null
        }
      }
      return null
    } catch (error) {
      console.error('Error getting municipality context:', error)
      return null
    }
  }

  /**
   * Get system prompt
   */
  private getSystemPrompt(): string {
    return `You are the ServeSA AI Assistant, a helpful AI agent for South African municipal service delivery. 

Your role is to:
1. Help citizens report municipal issues (water, electricity, roads, waste, etc.)
2. Provide case status updates and tracking information
3. Analyze images to identify infrastructure problems
4. Offer predictive insights about potential issues
5. Provide information about local municipalities and services
6. Assist with general platform navigation and help

You should:
- Be friendly, helpful, and professional
- Use clear, simple language
- Provide accurate information about South African municipalities
- Respect user privacy and data protection
- Escalate complex issues to human support when needed
- Be culturally sensitive to South African context

Always prioritize user safety and provide helpful, actionable responses.`
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4) // Rough estimation
  }
}

// Export AI Agent instance
export const aiAgent = new ServeSAAIAgent()

// Export Cloud Function
export const aiAgentFunction = async (data: any, context: any) => {
  try {
    const { message, sessionId } = data
    
    if (!message || !sessionId) {
      throw new Error('Message and sessionId are required')
    }
    
    const userId = context.auth?.uid
    if (!userId) {
      throw new Error('User must be authenticated')
    }
    
    const response = await aiAgent.processMessage(message, userId, sessionId)
    
    return {
      success: true,
      response: response
    }
    
  } catch (error) {
    console.error('AI Agent function error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

