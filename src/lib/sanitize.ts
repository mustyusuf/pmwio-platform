// Conservative allowlist sanitizer for the small set of tags our WYSIWYG editor
// produces. ALL attributes are stripped, and disallowed tags are removed while
// keeping their inner text — so no scripts, event handlers, styles or links.

const ALLOWED = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "h3", "h4", "blockquote", "div", "span",
]);

export function sanitizeRichText(html: string): string {
  if (!html) return "";
  let out = html;
  out = out.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\/?([a-zA-Z0-9]+)[^>]*?(\/?)>/g, (_m, tag: string, selfClose: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED.has(name)) return "";
    if (_m.startsWith("</")) return `</${name}>`;
    if (name === "br") return "<br/>";
    return selfClose ? `<${name}/>` : `<${name}>`;
  });
  return out.slice(0, 20000);
}

/** Strips all tags to plain text (for previews / length checks). */
export function htmlToText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
