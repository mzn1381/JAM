import { Navigate, Route, Routes } from 'react-router-dom'

import DocumentationLayout from '../layouts/DocumentationLayout'
import DocumentationPage from '../pages/DocumentationPage/DocumentationPage'
import { defaultDocumentationPath } from '../utils/documentationRegistry'

export default function DocumentationRouter() {
  return (
    <Routes>
      <Route element={<DocumentationLayout />}>
        <Route index element={<Navigate to={defaultDocumentationPath} replace />} />
        <Route path=":documentSlug" element={<DocumentationPage />} />
        <Route path="*" element={<Navigate to={defaultDocumentationPath} replace />} />
      </Route>
    </Routes>
  )
}