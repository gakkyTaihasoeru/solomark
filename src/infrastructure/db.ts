import Dexie, { Table } from "dexie";
import type { Bookmark } from "@/domain/bookmark";

export class BookmarkDB extends Dexie {
  bookmarks!: Table<Bookmark, string>;

  constructor() {
    super("SoloMarkDB");

    // v1: base schema
    this.version(1).stores({
      bookmarks: "++id,url,*tags,created_at"
    });

    // v2: add updated_at
    this.version(2)
      .stores({
        bookmarks: "++id,url,*tags,created_at,updated_at"
      })
      .upgrade(async (tx) => {
        await tx.table<Bookmark>("bookmarks").toCollection().modify((b) => {
          b.updated_at = b.created_at;
        });
      });

    // v3: add is_archived flag
    this.version(3)
      .stores({
        bookmarks: "++id,url,*tags,created_at,updated_at,is_archived"
      })
      .upgrade(async (tx) => {
        await tx.table<any>("bookmarks").toCollection().modify((b) => {
          b.is_archived = false;
        });
      });

    // optional health check
    this.on("ready", async () => {
      const count = await this.bookmarks.count();
      console.info(`[SoloMarkDB] Loaded ${count} bookmarks`);
    });
  }
}
