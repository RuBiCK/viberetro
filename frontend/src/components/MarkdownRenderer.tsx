'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  textColor?: string;
}

export default function MarkdownRenderer({
  content,
  className = '',
  textColor = '#000'
}: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      style={{ color: textColor }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Style links
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-blue-600 hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          // Style code
          code: ({ node, inline, ...props }: any) => (
            inline ? (
              <code {...props} className="bg-black bg-opacity-10 px-1 py-0.5 rounded text-xs font-mono" />
            ) : (
              <code {...props} className="block bg-black bg-opacity-10 p-2 rounded text-xs my-2 overflow-x-auto font-mono" />
            )
          ),
          // Style lists
          ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside space-y-0.5 my-1" />,
          ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside space-y-0.5 my-1" />,
          li: ({ node, ...props }) => <li {...props} className="text-sm" />,
          // Style paragraphs
          p: ({ node, ...props }) => <p {...props} className="my-1" />,
          // Style headings
          h1: ({ node, ...props }) => <h1 {...props} className="text-base font-bold my-1" />,
          h2: ({ node, ...props }) => <h2 {...props} className="text-sm font-bold my-1" />,
          h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-semibold my-1" />,
          // Style strong/em
          strong: ({ node, ...props }) => <strong {...props} className="font-bold" />,
          em: ({ node, ...props }) => <em {...props} className="italic" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
