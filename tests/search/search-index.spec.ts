import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Bookmark } from "@/domain/bookmark";

const findAllMock = vi.fn<[], Promise<Bookmark[]>>();

vi.mock("@/infrastructure/indexeddb-repository", () => ({
  IndexedDBRepository: vi.fn().mockImplementation(() => ({
    findAll: findAllMock,
  })),
}));

import { SearchIndexService } from "@/services/search-index";

describe("SearchIndexService", () => {
  let service: SearchIndexService;

  beforeEach(async () => {
    findAllMock.mockResolvedValue([]);
    service = new SearchIndexService();
    await service.init();
  });

  it("initializes search index and returns results array", async () => {
    findAllMock.mockResolvedValueOnce([
      {
        id: "seed",
        url: "https://example.com",
        title: "Example Seed",
        note: "Seed data",
        tags: ["example"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false,
      },
    ]);
    service = new SearchIndexService();
    await service.init();
    const results = await service.search("Example");
    expect(Array.isArray(results)).toBe(true);
  });

  it("adds and removes bookmarks from the index", async () => {
    const bookmark: Bookmark = {
      id: "123",
      url: "https://example.com",
      title: "Example title",
      note: "Example note",
      tags: ["demo"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_archived: false,
    };

    await service.add(bookmark);
    const res1 = await service.search("Example");
    expect(res1.some((r) => r.id === bookmark.id)).toBe(true);

    await service.remove(bookmark.id);
    const res2 = await service.search("Example");
    expect(res2.some((r) => r.id === bookmark.id)).toBe(false);
  });
});
