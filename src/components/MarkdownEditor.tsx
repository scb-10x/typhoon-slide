'use client';

import React from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ClipboardIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import CodeMirror from '@uiw/react-codemirror';
import { markdown as markdownExtension } from '@codemirror/lang-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();

  // Log when the value prop changes
  React.useEffect(() => {
    console.log("MarkdownEditor: Value prop updated:", value.substring(0, 50) + "...");
  }, [value]);

  const handleChange = (newValue: string) => {
    console.log("MarkdownEditor: Change detected, notifying parent");
    onChange(newValue);
  };

  const showToast = (message: string) => {
    toast.success(message);
  };

  const downloadMdxFile = () => {
    try {
      // Create a blob from the markdown content
      const blob = new Blob([value], { type: 'text/markdown' });

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = 'presentation.mdx';

      // Programmatically click the anchor to trigger the download
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('MDX file downloaded');
    } catch (err) {
      console.error('Failed to download file:', err);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm" id="markdown-editor-container">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 bg-gray-50">
        <div className="font-medium text-sm text-gray-600">Markdown</div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Download MDX file"
            onClick={downloadMdxFile}
            id="editor-download-button"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Copy markdown"
            onClick={() => {
              navigator.clipboard.writeText(value);
              showToast('Copied to clipboard!');
            }}
            id="editor-copy-button"
          >
            <ClipboardIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex-grow overflow-auto" id="editor-content-area">
        <CodeMirror
          value={value}
          onChange={handleChange}
          height="100%"
          theme={resolvedTheme === 'dark' ? undefined : undefined}
          extensions={[markdownExtension()]}
          className="text-sm h-full"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
          }}
        />
      </div>
    </div>
  );
} 