'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import TextareaAutosize from 'react-textarea-autosize';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = 'Enter text... (Markdown supported)',
  className = '',
  textColor = '#000',
  backgroundColor = '#fff',
  borderColor = '#ddd'
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor }}>
        <button
          onClick={() => setShowPreview(false)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            !showPreview ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            showPreview ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👁️ Preview
        </button>
      </div>

      {/* Editor or Preview */}
      {!showPreview ? (
        <div>
          <TextareaAutosize
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            style={{
              color: textColor,
              backgroundColor,
              borderColor
            }}
            minRows={3}
            maxRows={10}
            autoFocus
          />
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <p>💡 Markdown supported: **bold**, *italic*, [link](url), `code`, - lists</p>
            <p className="text-gray-400">⌘/Ctrl+Enter to save • Esc to cancel</p>
          </div>
        </div>
      ) : (
        <div
          className="px-3 py-2 text-sm rounded-lg border min-h-[80px] prose prose-sm max-w-none"
          style={{
            color: textColor,
            backgroundColor,
            borderColor
          }}
        >
          {value.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                // Style links
                a: ({ node, ...props }) => (
                  <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
                ),
                // Style code
                code: ({ node, inline, ...props }: any) => (
                  inline ? (
                    <code {...props} className="bg-gray-200 px-1 py-0.5 rounded text-xs" />
                  ) : (
                    <code {...props} className="block bg-gray-200 p-2 rounded text-xs my-2 overflow-x-auto" />
                  )
                ),
                // Style lists
                ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside space-y-1" />,
                ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside space-y-1" />,
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">Preview will appear here...</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!value.trim()}
          className="px-3 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
