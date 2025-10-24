import { SearchIndexService } from "@/services/search-index";

const searchService = new SearchIndexService();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case "SEARCH_INIT":
          await searchService.init();
          sendResponse({ ok: true });
          break;

        case "SEARCH_QUERY":
          const results = await searchService.search(message.query);
          sendResponse({ results });
          break;

        case "SEARCH_ADD":
          await searchService.add(message.bookmark);
          sendResponse({ ok: true });
          break;

        case "SEARCH_REMOVE":
          await searchService.remove(message.id);
          sendResponse({ ok: true });
          break;

        default:
          console.warn("[ServiceWorker] Unknown message type:", message.type);
          sendResponse({ ok: false, error: "Unknown message" });
      }
    } catch (err) {
      console.error("[ServiceWorker] Error:", err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();

  return true;
});
