import { Bookmark } from "@/domain/bookmark";
import { BookmarkDB } from "@/infrastructure/db";

const db = new BookmarkDB();

export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SEARCH_QUERY", query },
      async (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        if (!response?.results) {
          resolve([]);
          return;
        }

        const ids = response.results.map((r: { id: string }) => r.id);
        const bookmarks = await db.bookmarks.where("id").anyOf(ids).toArray();
        resolve(bookmarks);
      }
    );
  });
}
