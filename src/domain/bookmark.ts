export interface Bookmark {
  id: string;
  url: string;
  title: string;
  note: string;
  tags: string[];
  created_at: string; // ISO8601 UTC
  updated_at: string; // ISO8601 UTC
  is_archived: boolean;
}

export type BookmarkCreate = Omit<Bookmark, "id" | "created_at" | "updated_at" | "is_archived">;
export type BookmarkUpdate = Partial<Omit<Bookmark, "id" | "created_at">>;
