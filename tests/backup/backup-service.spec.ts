import { beforeEach, describe, expect, it, vi } from "vitest";
import { compressJSON } from "@/utils/json-compress";

const exportAllMock = vi.fn();
const importAllMock = vi.fn();
const healthCheckMock = vi.fn();

vi.mock("@/infrastructure/indexeddb-repository", () => ({
  IndexedDBRepository: vi.fn().mockImplementation(() => ({
    exportAll: exportAllMock,
    importAll: importAllMock,
    healthCheck: healthCheckMock,
  })),
}));

import { BackupService } from "@/infrastructure/backup";

describe("BackupService", () => {
  const backup = new BackupService();

  beforeEach(() => {
    vi.clearAllMocks();
    exportAllMock.mockResolvedValue("[]");
    importAllMock.mockResolvedValue(undefined);
    healthCheckMock.mockResolvedValue(true);
  });

  it("saves compressed data via chrome.storage.sync", async () => {
    await backup.saveBackup();
    expect(chrome.storage.sync.set).toHaveBeenCalled();
    const payload = (chrome.storage.sync.set as any).mock.calls[0][0];
    const chunkKeys = Object.keys(payload).filter((key) =>
      key.startsWith("backup_") && key !== "backup_meta"
    );
    expect(chunkKeys.length).toBeGreaterThan(0);
    expect(payload["backup_meta"]).toBeDefined();
    const meta = JSON.parse(payload["backup_meta"]);
    expect(meta.totalChunks).toBe(chunkKeys.length);
  });

  it("loads backup data and restores repository", async () => {
    const data = JSON.stringify([{ id: "1" }]);
    const compressed = await compressJSON(data);
    chrome.storage.sync.get = vi.fn(async () => ({
      backup_0: compressed,
      backup_meta: JSON.stringify({ totalChunks: 1, timestamp: Date.now() }),
    }));

    await backup.loadBackup();
    expect(importAllMock).toHaveBeenCalledWith(data);
  });
});
