import { DEDUP_WINDOW_MS } from '../constants/config';

export class DedupBuffer {
  private entries: Map<string, number> = new Map();

  has(key: string): boolean {
    const timestamp = this.entries.get(key);
    if (timestamp === undefined) {
      return false;
    }
    const now = Date.now();
    if (now - timestamp > DEDUP_WINDOW_MS) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  add(key: string): void {
    this.entries.set(key, Date.now());
    this.prune();
  }

  clear(): void {
    this.entries.clear();
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.entries.entries()) {
      if (now - timestamp > DEDUP_WINDOW_MS) {
        this.entries.delete(key);
      }
    }
  }
}
