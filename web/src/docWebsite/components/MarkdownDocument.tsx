import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

type MarkdownDocumentProps = {
  content: string
}

const markdownComponents: Components = {
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !match

    if (isInline) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }

    return (
      <SyntaxHighlighter
        language={match[1]}
        style={oneDark}
        PreTag="div"
        className="!my-5 !rounded-lg !text-sm !leading-7"
        customStyle={{ margin: 0 }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    )
  },
  table: ({ node, ...props }) => {
    void node
    return (
      <div className="my-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse" {...props} />
      </div>
    )
  },
}

export default function MarkdownDocument({ content }: MarkdownDocumentProps) {
  return (
    <article className="max-w-none text-[15px] leading-8 text-admin-ink [&_a]:font-semibold [&_a]:text-admin-accent [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-5 [&_blockquote]:border-s-4 [&_blockquote]:border-admin-accent [&_blockquote]:bg-admin-bg [&_blockquote]:px-5 [&_blockquote]:py-2 [&_blockquote]:text-admin-muted [&_code]:rounded [&_code]:bg-admin-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_h1]:mb-6 [&_h1]:mt-0 [&_h1]:border-b [&_h1]:border-admin-border [&_h1]:pb-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-bold [&_h5]:mb-2 [&_h5]:mt-5 [&_h5]:text-base [&_h5]:font-bold [&_h6]:mb-2 [&_h6]:mt-4 [&_h6]:text-sm [&_h6]:font-bold [&_hr]:my-8 [&_hr]:border-admin-border [&_img]:my-5 [&_img]:h-auto [&_img]:max-w-full [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-4 [&_strong]:font-bold [&_td]:border [&_td]:border-admin-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:border-admin-border [&_th]:bg-admin-bg [&_th]:px-3 [&_th]:py-2 [&_th]:align-top [&_th]:font-bold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
