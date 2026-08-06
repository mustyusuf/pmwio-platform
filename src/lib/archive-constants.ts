// Client-safe constants/types for the Archive feature — no server-only
// imports (no prisma) so client components can import this directly without
// pulling Node-only code (better-sqlite3) into the browser bundle.

export const CATEGORY_LABEL: Record<string, string> = {
  LECTURE: "Lecture",
  SERMON: "Sermon",
  EVENT: "Past event",
  OTHER: "Other",
};

export const MEDIA_TYPE_LABEL: Record<string, string> = {
  VIDEO_LINK: "Video link",
  AUDIO_LINK: "Audio link",
  AUDIO_FILE: "Audio file",
};

export type ArchiveItemDTO = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  mediaType: string;
  url: string | null;
  audioSrc: string | null; // /api/archive/[id]/audio, for AUDIO_FILE items
  embedUrl: string | null; // resolved iframe URL for a recognized video link
  eventDate: string | null; // ISO date, formatted in the UI
};
