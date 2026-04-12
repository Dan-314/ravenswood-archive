import Markdown from 'react-markdown'

export function MarkdownDescription({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert prose-p:text-muted-foreground prose-headings:text-muted-foreground prose-strong:text-muted-foreground prose-a:text-muted-foreground prose-li:text-muted-foreground mt-1 max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <Markdown>{content}</Markdown>
    </div>
  )
}
