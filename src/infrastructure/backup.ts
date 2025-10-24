import { IndexedDBRepository } from "@/infrastructure/indexeddb-repository";
import { compressJSON, decompressJSON } from "@/utils/json-compress";

const CHUNK_SIZE = 7000;

export class BackupService {
  private repo: IndexedDBRepository;

  constructor() {
    this.repo = new IndexedDBRepository();
  }

  async saveBackup(): Promise<void> {
    const json = await this.repo.exportAll();
    const compressed = await compressJSON(json);
    const chunks: Record<string, string> = {};
    let chunkCount = 0;

    for (let i = 0; i < compressed.length; i += CHUNK_SIZE) {
      const key = `backup_${chunkCount}`;
      chunks[key] = compressed.slice(i, i + CHUNK_SIZE);
      chunkCount += 1;
    }

    chunks["backup_meta"] = JSON.stringify({
      timestamp: Date.now(),
      totalChunks: chunkCount,
    });

    await chrome.storage.sync.set(chunks);
    console.info("[BackupService] Backup saved to Chrome Sync");
  }

  async loadBackup(): Promise<void> {
    const items = await chrome.storage.sync.get(null);
    if (!items["backup_meta"]) throw new Error("No backup found");

    const meta = JSON.parse(items["backup_meta"]);
    const totalChunks = Number(meta.totalChunks ?? 0);
    if (!Number.isInteger(totalChunks) || totalChunks < 0) {
      throw new Error("Invalid backup metadata");
    }
    let compressed = "";

    for (let i = 0; i < totalChunks; i++) {
      const chunk = items[`backup_${i}`];
      if (typeof chunk !== "string") {
        throw new Error(`Missing backup chunk: ${i}`);
      }
      compressed += chunk;
    }

    const json = await decompressJSON(compressed);
    await this.repo.importAll(json);
    console.info("[BackupService] Backup restored successfully");
  }

  async verifyIntegrity(): Promise<boolean> {
    return await this.repo.healthCheck();
  }

  async recoverIfBroken(): Promise<void> {
    const healthy = await this.verifyIntegrity();
    if (healthy) return;

    const ok = confirm("データベースが破損しています。バックアップから復旧しますか？");
    if (ok) {
      try {
        await this.loadBackup();
        alert("復旧が完了しました。");
      } catch (err) {
        console.error("[BackupService] Recovery failed:", err);
        alert("復旧に失敗しました。手動バックアップをご確認ください。");
      }
    }
  }
}
