// Allowlist sanitizer for the small set of tags our WYSIWYG editor produces.
//
// Safe by construction rather than by trying to spot bad markup: the only
// things that can appear in the output are the exact, attribute-free tags
// below, and every other "<" and ">" is escaped to text. So scripts, event
// handlers, styles, links, images and half-broken tags all come out as inert
// text no matter how they are written.

const ALLOWED = ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "h3", "h4", "blockquote", "div", "span"];

// An allowed tag, with or without attributes. [^<>]* can't cross another tag,
// so a match never swallows more than the one tag it names.
const ALLOWED_TAG = new RegExp(`<(/?)(${ALLOWED.join("|")})(?:\\s[^<>]*)?/?>`, "gi");

const escapeAngles = (text: string) => text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function sanitizeRichText(html: string): string {
  if (!html) return "";
  // Drop script/style blocks outright (their contents are never useful text).
  const input = html.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "").replace(/<!--[\s\S]*?-->/g, "").slice(0, 20000);

  let out = "";
  let last = 0;
  for (const match of input.matchAll(ALLOWED_TAG)) {
    out += escapeAngles(input.slice(last, match.index));
    const [, closing, name] = match;
    const tag = name.toLowerCase();
    out += tag === "br" ? "<br/>" : `<${closing}${tag}>`;
    last = match.index + match[0].length;
  }
  return out + escapeAngles(input.slice(last));
}

/** Strips all tags to plain text (for previews / length checks). */
export function htmlToText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
