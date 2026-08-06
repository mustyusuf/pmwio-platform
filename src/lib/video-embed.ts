export type VideoProvider = "youtube" | "vimeo" | "facebook" | null;
export type VideoEmbed = { provider: VideoProvider; embedUrl: string | null };

const YOUTUBE_ID_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/;
const VIMEO_ID_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

/**
 * Detects a YouTube/Vimeo/Facebook video URL and returns an iframe-ready
 * embed URL. Anything unrecognized returns { provider: null, embedUrl: null }
 * — the caller falls back to a plain "Watch ↗" link, no embed attempted.
 */
export function parseVideoEmbed(url: string): VideoEmbed {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\./, "");
  } catch {
    return { provider: null, embedUrl: null };
  }

  if (host === "youtube.com" || host === "youtu.be") {
    const match = url.match(YOUTUBE_ID_RE);
    if (match) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${match[1]}` };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = url.match(VIMEO_ID_RE);
    if (match) return { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${match[1]}` };
  }

  if (host === "facebook.com" || host === "fb.watch") {
    return { provider: "facebook", embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false` };
  }

  return { provider: null, embedUrl: null };
}
