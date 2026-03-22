/** --- Global Jest Mocks --- **/
global.chrome = {
    runtime: {
        getURL: (path) => `chrome-extension://test-id/${path}`,
        sendMessage: jest.fn(),
        onMessage: { addListener: jest.fn() },
        lastError: null,
    },
    storage: {
        sync: { get: jest.fn((k, cb) => cb({})), set: jest.fn() },
        session: { get: jest.fn((k, cb) => cb({})), set: jest.fn().mockResolvedValue() },
    },
    tabs: {
        query: jest.fn((q, cb) => cb([{ id: 1 }])),
        sendMessage: jest.fn().mockResolvedValue({}),
        remove: jest.fn(),
        onUpdated: { addListener: jest.fn() },
    },
    action: { setBadgeText: jest.fn().mockResolvedValue(), setBadgeBackgroundColor: jest.fn() },
};

global.OffscreenCanvas = class {
    constructor(w, h) { this.width = w; this.height = h; }
    getContext() { return { drawImage: jest.fn(), getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(this.width * this.height * 4), width: this.width, height: this.height })) }; }
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.IntersectionObserver = class { constructor(cb) { this._cb = cb; } observe() { } unobserve() { } disconnect() { } };
global.MutationObserver = jest.fn().mockImplementation(function (cb) { this._cb = cb; this.observe = jest.fn(); this.disconnect = jest.fn(); });
