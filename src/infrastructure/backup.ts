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

    for (let i = 0; i < compressed.length; i += CHUNK_SIZE) {
      chunks[`backup_${i / CHUNK_SIZE}`] = compressed.slice(i, i + CHUNK_SIZE);
    }

    chunks["backup_meta"] = JSON.stringify({
      timestamp: Date.now(),
      totalChunks: Object.keys(chunks).length - 1,
    });

    await chrome.storage.sync.set(chunks);
    console.info("[BackupService] Backup saved to Chrome Sync");
  }

  async loadBackup(): Promise<void> {
    const items = await chrome.storage.sync.get(null);
    if (!items["backup_meta"]) throw new Error("No backup found");

    const meta = JSON.parse(items["backup_meta"]);
    let compressed = "";

    for (let i = 0; i < meta.totalChunks; i++) {
      compressed += items[`backup_${i}`];
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
