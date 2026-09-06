import { Navigate, useParams } from 'react-router-dom'

import MarkdownDocument from '../../components/MarkdownDocument'
import {
  defaultDocumentationPath,
  getDocumentationBySlug,
} from '../../utils/documentationRegistry'

export default function DocumentationPage() {
  const { documentSlug } = useParams()
  const document = documentSlug
    ? getDocumentationBySlug(documentSlug)
    : undefined

  if (!document) {
    return <Navigate to={defaultDocumentationPath} replace />
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <MarkdownDocument content={document.content} />
    </div>
  )
}