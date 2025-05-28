import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Process content to handle newlines and remove trailing whitespace
  const processedContent = content
    .replace(/\r\n?/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Limit to max 2 consecutive newlines
    .replace(/\n+$/, ''); // Remove trailing newlines at the end
  
  return (
    <div className={cn("max-w-none", className)}>
      <ReactMarkdown
        className="outline-markdown break-words"
        components={{
          p: ({ node, ...props }) => (
            <p className="mb-3 mt-0 last:mb-0" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-lg md:text-xl font-bold mt-6 mb-4 first:mt-0 last:mb-0" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-base md:text-lg font-bold mt-5 mb-3 first:mt-0 last:mb-0" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-sm md:text-base font-semibold mt-4 mb-2 first:mt-0 last:mb-0" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-sm md:text-base font-semibold mt-3 mb-2 first:mt-0 last:mb-0" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm md:text-base font-medium mt-3 mb-1 first:mt-0 last:mb-0" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm md:text-base font-medium mt-3 mb-1 first:mt-0 last:mb-0" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-4 pl-6 list-disc list-outside last:mb-0" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-4 pl-6 list-decimal list-outside last:mb-0" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1 ml-2 leading-relaxed last:mb-0" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold" {...props} />
          ),
          code: ({ node, ...props }) => (
            <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props} />
          ),
          pre: ({ node, ...props }) => (
            <pre className="my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto last:mb-0" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-3 border-gray-300 dark:border-gray-600 pl-4 my-4 italic last:mb-0" {...props} />
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
} 