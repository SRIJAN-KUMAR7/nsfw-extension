const { DOMMonitor, DEBOUNCE_MS } = require('../content/domMonitor');

describe('DOMMonitor', () => {
    let mon, cb;
    beforeEach(() => { jest.useFakeTimers(); cb = jest.fn(); mon = new DOMMonitor(cb); });
    afterEach(() => { mon.disconnect(); jest.useRealTimers(); });

    /** --- Debounce --- **/
    test('batches changes', () => {
        mon.observe();
        const obs = global.MutationObserver.mock.instances[0];
        obs._cb([{ addedNodes: [{ nodeType: 1, tagName: 'IMG', getBoundingClientRect: () => ({ width: 100, height: 100, top: 0, bottom: 100 }), querySelectorAll: () => [] }] }]);
        jest.advanceTimersByTime(DEBOUNCE_MS + 10);
        expect(cb).toHaveBeenCalled();
    });

    /** --- Visibility --- **/
    test('isVisible checks bounds', () => {
        const el = { getBoundingClientRect: () => ({ width: 0, height: 0 }) };
        expect(mon._isVisible(el)).toBe(false);
    });
});
