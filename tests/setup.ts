import { Buffer } from "node:buffer";
import "fake-indexeddb/auto";
import { vi } from "vitest";

if (!("btoa" in globalThis)) {
  (globalThis as any).btoa = (data: string) => Buffer.from(data, "binary").toString("base64");
}

if (!("atob" in globalThis)) {
  (globalThis as any).atob = (data: string) => Buffer.from(data, "base64").toString("binary");
}

(globalThis as any).chrome = {
  storage: {
    sync: {
      set: vi.fn(async () => ({})),
      get: vi.fn(async () => ({})),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
    lastError: null,
  },
};
