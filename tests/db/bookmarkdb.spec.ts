import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { BookmarkDB } from "@/infrastructure/db";

describe("BookmarkDB", () => {
  let db: BookmarkDB;

  beforeEach(() => {
    db = new BookmarkDB();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("creates database schema with bookmarks store", async () => {
    const stores = db.tables.map((table) => table.name);
    expect(stores).toContain("bookmarks");
  });

  it("adds and retrieves bookmark records", async () => {
    const now = new Date().toISOString();
    await db.bookmarks.add({
      id: "1",
      url: "https://example.com",
      title: "Example",
      note: "Test",
      tags: ["tag1"],
      created_at: now,
      updated_at: now,
      is_archived: false,
    });

    const result = await db.bookmarks.get("1");
    expect(result?.title).toBe("Example");
  });
});
