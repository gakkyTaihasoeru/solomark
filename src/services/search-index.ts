import MiniSearch from "minisearch";
import { Bookmark } from "@/domain/bookmark";
import { IndexedDBRepository } from "@/infrastructure/indexeddb-repository";

export class SearchIndexService {
  private index: MiniSearch<Bookmark> | null = null;
  private repo = new IndexedDBRepository();

  async init(): Promise<void> {
    const bookmarks = await this.repo.findAll();
    this.index = new MiniSearch({
      fields: ["title", "note", "tags"],
      storeFields: ["id", "title"],
      searchOptions: { prefix: true, fuzzy: 0.2 },
    });
    this.index.addAll(bookmarks);
    console.info(`[SearchIndex] Initialized with ${bookmarks.length} bookmarks`);
  }

  async search(query: string): Promise<{ id: string; score: number }[]> {
    if (!this.index) {
      await this.init();
    }
    const results = this.index!.search(query);
    return results.map((r) => ({ id: r.id as string, score: r.score }));
  }

  async add(bookmark: Bookmark): Promise<void> {
    if (!this.index) await this.init();
    this.index!.add(bookmark);
  }

  async remove(id: string): Promise<void> {
    if (!this.index) {
      await this.init();
    }
    if (this.index?.has(id)) {
      this.index.remove({ id } as any);
    }
  }
}
