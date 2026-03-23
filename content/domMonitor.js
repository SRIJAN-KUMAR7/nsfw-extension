'use strict';

const DEBOUNCE_MS = 300;

/** --- DOM Monitoring class --- **/
class DOMMonitor {
    constructor(onElements) {
        this._onElements = onElements;
        this._pendingElements = new Set();
        this._debounceTimer = null;
        this._mutationObserver = null;
        this._intersectionObserver = null;
        this._processed = new WeakSet();
    }

    observe() {
        this._setupIntersectionObserver();
        this._setupMutationObserver();
        this._scanExisting();
    }

    disconnect() {
        if (this._mutationObserver) this._mutationObserver.disconnect();
        if (this._intersectionObserver) this._intersectionObserver.disconnect();
        clearTimeout(this._debounceTimer);
        this._pendingElements.clear();
    }

    _scanExisting() {
        document.querySelectorAll('img, video').forEach(el => this._enqueue(el));
    }

    _setupMutationObserver() {
        this._mutationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;
                        if (node.tagName === 'IMG' || node.tagName === 'VIDEO') this._enqueue(node);
                        node.querySelectorAll('img, video').forEach(el => this._enqueue(el));
                    }
                } else if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    const el = mutation.target;
                    if (el.tagName === 'IMG' || el.tagName === 'VIDEO') {
                        // Re-enqueue if src changed, bypassing the _processed check if needed
                        // Actually, processImage handles caching by src, so we can just enqueue.
                        this._processed.delete(el);
                        this._enqueue(el);
                    }
                }
            }
        });
        this._mutationObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src']
        });
    }

    _setupIntersectionObserver() {
        this._intersectionObserver = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    this._intersectionObserver.unobserve(entry.target);
                    this._enqueue(entry.target);
                }
            }
        }, { threshold: 0.1 });
    }

    _enqueue(el) {
        if (this._processed.has(el)) return;
        if (el.tagName === 'IMG' && !this._isVisible(el)) {
            if (this._intersectionObserver) this._intersectionObserver.observe(el);
            return;
        }
        this._pendingElements.add(el);
        this._scheduleFlusher();
    }

    _scheduleFlusher() {
        if (this._debounceTimer !== null) return;
        this._debounceTimer = setTimeout(() => {
            this._flush();
            this._debounceTimer = null;
        }, DEBOUNCE_MS);
    }

    _flush() {
        if (this._pendingElements.size === 0) return;
        const batch = Array.from(this._pendingElements);
        this._pendingElements.clear();
        batch.forEach(el => this._processed.add(el));
        this._onElements(batch);
    }

    _isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
    }
}

window.DOMMonitor = DOMMonitor;
