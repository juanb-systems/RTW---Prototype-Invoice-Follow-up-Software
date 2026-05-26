import type { DataStore } from "./types";
import { initStore } from "./seed-loader";

// Module-level singleton — persists for the lifetime of the dev server process.
// Data resets on server restart (correct for prototype).
let _db: DataStore | null = null;

export function getDb(): DataStore {
  if (!_db) {
    _db = initStore();
  }
  return _db;
}

// Convenience alias used throughout API routes
export { getDb as db };
