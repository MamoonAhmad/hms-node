import { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function exec(command, value) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({ value = '', onChange, placeholder, className, id }) {
  const editorRef = useRef(null);
  const lastHtml = useRef(value);

  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastHtml.current) {
      editorRef.current.innerHTML = value || '';
      lastHtml.current = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    lastHtml.current = html;
    onChange?.(html);
  }, [onChange]);

  const toolbarButton = (label, icon, command, commandValue) => (
    <Button
      key={label}
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        editorRef.current?.focus();
        exec(command, commandValue);
        handleInput();
      }}
    >
      {icon}
    </Button>
  );

  return (
    <div className={cn('rounded-lg border bg-background overflow-hidden', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
        {toolbarButton('Bold', <Bold className="h-4 w-4" />, 'bold')}
        {toolbarButton('Italic', <Italic className="h-4 w-4" />, 'italic')}
        {toolbarButton('Underline', <Underline className="h-4 w-4" />, 'underline')}
        {toolbarButton('Bullet list', <List className="h-4 w-4" />, 'insertUnorderedList')}
        {toolbarButton('Numbered list', <ListOrdered className="h-4 w-4" />, 'insertOrderedList')}
      </div>
      <div
        id={id}
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder || 'Rich text editor'}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[180px] max-h-[320px] overflow-y-auto px-3 py-2 text-sm focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        data-placeholder={placeholder}
        onInput={handleInput}
      />
    </div>
  );
}
