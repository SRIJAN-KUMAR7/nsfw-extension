'use strict';

const DEFAULT_MAX_SIZE = 200;
const DEFAULT_TTL_MS = 300000;

/** --- LRU Cache class --- **/
class LRUCache {
    constructor(maxSize = DEFAULT_MAX_SIZE, ttlMs = DEFAULT_TTL_MS) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
        this._store = new Map();
    }

    get(key) {
        if (!this._store.has(key)) return undefined;
        const entry = this._store.get(key);
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this._store.delete(key);
            return undefined;
        }
        this._store.delete(key);
        this._store.set(key, entry);
        return entry.value;
    }

    set(key, value) {
        if (this._store.has(key)) this._store.delete(key);
        this._store.set(key, { value, timestamp: Date.now() });
        if (this._store.size > this.maxSize) {
            const firstKey = this._store.keys().next().value;
            this._store.delete(firstKey);
        }
    }

    has(key) {
        if (!this._store.has(key)) return false;
        const entry = this._store.get(key);
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this._store.delete(key);
            return false;
        }
        return true;
    }

    delete(key) { this._store.delete(key); }
    clear() { this._store.clear(); }
    get size() { return this._store.size; }

    purgeExpired() {
        const now = Date.now();
        for (const [key, entry] of this._store.entries()) {
            if (now - entry.timestamp > this.ttlMs) this._store.delete(key);
        }
    }
}

const resultCache = new LRUCache();

window.nsfwCache = { LRUCache, resultCache };
