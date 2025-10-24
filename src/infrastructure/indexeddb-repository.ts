import { Bookmark, BookmarkCreate, BookmarkUpdate } from "@/domain/bookmark";
import { IBookmarkRepository } from "@/application/repository";
import { BookmarkDB } from "@/infrastructure/db";

export class IndexedDBRepository implements IBookmarkRepository {
  private db: BookmarkDB;

  constructor() {
    this.db = new BookmarkDB();
  }

  async findAll(): Promise<Bookmark[]> {
    return this.db.bookmarks.orderBy("created_at").reverse().toArray();
  }

  async findById(id: string): Promise<Bookmark | undefined> {
    return this.db.bookmarks.get(id);
  }

  async search(query: string): Promise<Bookmark[]> {
    const lower = query.toLowerCase();
    return this.db.bookmarks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(lower) ||
          b.note.toLowerCase().includes(lower) ||
          b.tags.some((t) => t.toLowerCase().includes(lower))
      )
      .toArray();
  }

  async create(data: BookmarkCreate): Promise<Bookmark> {
    const now = new Date().toISOString();
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      is_archived: false,
      ...data,
    };
    await this.db.bookmarks.add(bookmark);
    return bookmark;
  }

  async update(id: string, data: BookmarkUpdate): Promise<void> {
    await this.db.bookmarks.update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.bookmarks.delete(id);
  }

  async exportAll(): Promise<string> {
    const bookmarks = await this.db.bookmarks.toArray();
    return JSON.stringify(bookmarks, null, 2);
  }

  async importAll(json: string): Promise<void> {
    const data: Bookmark[] = JSON.parse(json);
    await this.db.bookmarks.clear();
    await this.db.bookmarks.bulkAdd(data);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.bookmarks.count();
      return true;
    } catch (err) {
      console.error("[IndexedDBRepository] DB health check failed:", err);
      return false;
    }
  }
}
