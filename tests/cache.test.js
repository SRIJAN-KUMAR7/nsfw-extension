const { LRUCache } = require('../ml/cache');

describe('LRUCache', () => {
    let cache;
    beforeEach(() => { cache = new LRUCache(5, 60000); });

    /** --- Basic Ops --- **/
    test('get/set works', () => {
        cache.set('k1', 'v1');
        expect(cache.get('k1')).toBe('v1');
    });

    /** --- Eviction --- **/
    test('evicts LRU', () => {
        for (let i = 1; i <= 5; i++) cache.set(`k${i}`, i);
        cache.get('k1');
        cache.set('k6', 6);
        expect(cache.has('k2')).toBe(false);
        expect(cache.has('k1')).toBe(true);
    });

    /** --- TTL --- **/
    test('expires items', () => {
        jest.useFakeTimers();
        const c = new LRUCache(10, 5000);
        c.set('ex', 'val');
        jest.advanceTimersByTime(5001);
        expect(c.get('ex')).toBeUndefined();
        jest.useRealTimers();
    });
});
