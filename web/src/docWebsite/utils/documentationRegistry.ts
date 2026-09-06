import chatApiDocumentation from '../markdown/ai-as-a-service-chat-api-in-web.md?raw'

export type DocumentationEntry = {
  slug: string
  labelKey: string
  content: string
}

export const documentationEntries: DocumentationEntry[] = [
  {
    slug: 'ai-as-a-service-chat-api-in-web',
    labelKey: 'documentation.pages.chatApiWeb',
    content: chatApiDocumentation,
  },
]

export const defaultDocumentationPath = `/docs/${documentationEntries[0].slug}`

export function getDocumentationBySlug(slug: string) {
  return documentationEntries.find((document) => document.slug === slug)
}