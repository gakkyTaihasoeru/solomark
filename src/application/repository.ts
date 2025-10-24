import type { Bookmark, BookmarkCreate, BookmarkUpdate } from "@/domain/bookmark";

export interface IBookmarkRepository {
  findAll(): Promise<Bookmark[]>;
  findById(id: string): Promise<Bookmark | null>;
  search(query: string): Promise<Bookmark[]>;
  create(data: BookmarkCreate): Promise<Bookmark>;
  update(id: string, data: BookmarkUpdate): Promise<void>;
  delete(id: string): Promise<void>;
  exportAll(): Promise<string>;
  importAll(json: string): Promise<void>;
  onError?(error: unknown): void;
}
