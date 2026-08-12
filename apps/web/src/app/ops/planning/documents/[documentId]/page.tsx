import ReviewPlanningDocumentClient from './ReviewPlanningDocumentClient'

export function generateStaticParams() {
  return [{ documentId: '_' }]
}

export default function ReviewPlanningDocumentPage() {
  return <ReviewPlanningDocumentClient />
}
