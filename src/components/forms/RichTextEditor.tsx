"use client";

import { useRef, useState } from "react";

const TOOLS: { cmd: string; label: string; cls?: string; title: string }[] = [
  { cmd: "bold", label: "B", cls: "font-bold", title: "Bold" },
  { cmd: "italic", label: "I", cls: "italic", title: "Italic" },
  { cmd: "underline", label: "U", cls: "underline", title: "Underline" },
  { cmd: "insertUnorderedList", label: "• List", title: "Bullet list" },
  { cmd: "insertOrderedList", label: "1. List", title: "Numbered list" },
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
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultHTML);

  const sync = () => setHtml(ref.current?.innerHTML ?? "");
  const exec = (cmd: string) => {
    document.execCommand(cmd, false);
    ref.current?.focus();
    sync();
  };

  return (
    <div className="mt-1.5 rounded-xl border border-brand-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
      <div className="flex flex-wrap gap-1 border-b border-brand-100 p-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.title}
            onMouseDown={(e) => { e.preventDefault(); exec(t.cmd); }}
            className={`min-w-8 rounded px-2.5 py-1 text-sm text-brand-800 transition hover:bg-brand-100 ${t.cls ?? ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        data-placeholder={placeholder}
        className="rte max-w-none px-4 py-3 text-sm text-brand-950 outline-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: defaultHTML }}
      />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
