import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IndexedDBRepository } from "@/infrastructure/indexeddb-repository";

const sampleBookmark = {
  url: "https://example.com",
  title: "Example",
  note: "Sample",
  tags: ["test"],
};

describe("IndexedDBRepository", () => {
  let repo: IndexedDBRepository;

  beforeEach(() => {
    repo = new IndexedDBRepository();
  });

  afterEach(async () => {
    await (repo as any).db.delete();
  });

  it("creates and retrieves a bookmark", async () => {
    const created = await repo.create(sampleBookmark);
    const fetched = await repo.findById(created.id);
    expect(fetched?.url).toBe(sampleBookmark.url);
  });

  it("deletes a bookmark", async () => {
    const created = await repo.create(sampleBookmark);
    await repo.delete(created.id);
    const fetched = await repo.findById(created.id);
    expect(fetched).toBeUndefined();
  });
});
