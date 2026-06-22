"use client";

import { useRef } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";

const TOOLS = [
  { cmd: "bold", title: "Bold", Icon: Bold },
  { cmd: "italic", title: "Italic", Icon: Italic },
  { cmd: "underline", title: "Underline", Icon: Underline },
  { cmd: "insertUnorderedList", title: "Bullet list", Icon: List },
  { cmd: "insertOrderedList", title: "Numbered list", Icon: ListOrdered },
];

/**
 * A lightweight WYSIWYG editor. Produces simple HTML (bold/italic/underline/
 * lists) into a hidden input named `name`; the server sanitizes it on save.
 */
export function RichTextEditor({
  name,
  placeholder,
  defaultHTML = "",
  minHeight = 120,
}: {
  name: string;
  placeholder?: string;
  defaultHTML?: string;
  minHeight?: number;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);

  const sync = () => {
    if (inputRef.current) inputRef.current.value = editorRef.current?.innerHTML ?? "";
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const exec = (cmd: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(cmd, false);
    sync();
    saveSelection();
  };

  return (
    <div className="mt-1.5 rounded-xl border border-brand-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
      <div className="flex flex-wrap gap-1 border-b border-brand-100 p-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.title}
            aria-label={t.title}
            onMouseDown={(e) => { e.preventDefault(); exec(t.cmd); }}
            className="grid h-8 w-8 place-items-center rounded text-brand-800 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <t.Icon className="h-4 w-4" aria-hidden />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={() => {
          saveSelection();
          sync();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        data-placeholder={placeholder}
        className="rte max-w-none px-4 py-3 text-sm text-brand-950 outline-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: defaultHTML }}
      />
      <input ref={inputRef} type="hidden" name={name} defaultValue={defaultHTML} />
    </div>
  );
}
