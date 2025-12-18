import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, AlignLeft, Paperclip } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  onAttach?: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, minLength = 50, onAttach }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const getTextLength = () => {
    return editorRef.current?.innerText?.length || 0;
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-surface rounded-t-md border border-border border-b-0">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-surface-hover rounded transition-colors"
          title="Bold"
        >
          <Bold size={16} className="text-on-surface-secondary" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-surface-hover rounded transition-colors"
          title="Italic"
        >
          <Italic size={16} className="text-on-surface-secondary" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-surface-hover rounded transition-colors"
          title="Underline"
        >
          <Underline size={16} className="text-on-surface-secondary" />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-surface-hover rounded transition-colors"
          title="Bullet List"
        >
          <List size={16} className="text-on-surface-secondary" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 hover:bg-surface-hover rounded transition-colors"
          title="Align Left"
        >
          <AlignLeft size={16} className="text-on-surface-secondary" />
        </button>
        {onAttach && (
          <>
            <div className="w-px h-6 bg-border mx-1"></div>
            <button
              type="button"
              onClick={onAttach}
              className="p-2 hover:bg-surface-hover rounded transition-colors"
              title="Attach Files"
            >
              <Paperclip size={16} className="text-on-surface-secondary" />
            </button>
          </>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          handleInput();
        }}
        className="min-h-[200px] bg-surface border border-border rounded-b-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />

      {/* Character count */}
      <p className="text-xs text-on-surface-secondary text-right">
        {getTextLength()} / {minLength} characters minimum
      </p>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

