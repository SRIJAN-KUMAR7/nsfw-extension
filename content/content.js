'use strict';

const STORAGE_KEY_ENABLED = 'nsfw_shield_enabled';
const STORAGE_KEY_SENSITIVITY = 'nsfw_shield_sensitivity';
const STAT_SCANNED_KEY = 'nsfw_stat_scanned';
const STAT_BLOCKED_KEY = 'nsfw_stat_blocked';

let isEnabled = true;
let overlayShown = false;
const videoCleanups = new WeakMap();

let blurMgr = null;
let overlayMgr = null;
let stats = { scanned: 0, blocked: 0 };

/** --- Initialization --- **/
async function init() {
    // Sanity checks 
    if (!window.BlurManager || !window.OverlayManager) {
        console.error('NSFW Shield core components NOT loaded correctly. Check manifest load order and file integrity.');
        return;
    }

    blurMgr = new window.BlurManager();
    overlayMgr = new window.OverlayManager();

    const stored = await getStoredSettings();
    isEnabled = stored.enabled ?? true;
    if (window.nsfwDetector) window.nsfwDetector.setSensitivity(stored.sensitivity ?? 'medium');
    if (!isEnabled) return;
    if (window.nsfwDetector) window.nsfwDetector.loadModel().catch(() => { });
    const domMonitor = new window.DOMMonitor(handleElementBatch);
    domMonitor.observe();
    chrome.runtime.onMessage.addListener(onMessage);
}

/** --- Event Batch Handler --- **/
async function handleElementBatch(elements) {
    if (!isEnabled) return;
    for (const el of elements) {
        if (el.tagName === 'IMG') await processImage(el);
        else if (el.tagName === 'VIDEO') processVideo(el);
    }
}

/** --- Image Pipeline --- **/
async function processImage(imgEl) {
    const src = imgEl.src || imgEl.dataset.src;
    if (!src) return;
    const cache = window.nsfwCache?.resultCache;
    if (cache?.has(src)) {
        const cached = cache.get(src);
        if (cached.isNSFW) applyNSFW(imgEl, cached.reason);
        return;
    }
    const imageData = window.frameExtractor?.extractFromImage(imgEl);
    if (!imageData) return;
    stats.scanned++;
    updateStats();
    try {
        const result = await window.nsfwDetector.detectNSFW(imageData);
        if (cache) cache.set(src, result);
        if (result.isNSFW) {
            stats.blocked++;
            updateStats();
            applyNSFW(imgEl, result.reason);
        }
    } catch (err) { }
}

/** --- Video Pipeline --- **/
function processVideo(videoEl) {
    if (videoCleanups.has(videoEl)) return;
    const stop = window.frameExtractor?.watchVideo(videoEl, async (imageData) => {
        if (!isEnabled) return;
        stats.scanned++;
        updateStats();
        try {
            const result = await window.nsfwDetector.detectNSFW(imageData);
            if (result.isNSFW) {
                stats.blocked++;
                updateStats();
                applyNSFW(videoEl, result.reason);
            }
        } catch (err) { }
    }, 2000);
    if (stop) videoCleanups.set(videoEl, stop);
}

/** --- NSFW Application --- **/
function applyNSFW(el, reason) {
    blurMgr.blurElement(el);
    if (!overlayShown) {
        overlayShown = true;
        overlayMgr.show(reason);
    }
}

/** --- Storage & Messages --- **/
function getStoredSettings() {
    return new Promise(res => chrome.storage.sync.get([STORAGE_KEY_ENABLED, STORAGE_KEY_SENSITIVITY], res));
}

function updateStats() {
    chrome.storage.session?.set({ [STAT_SCANNED_KEY]: stats.scanned, [STAT_BLOCKED_KEY]: stats.blocked }).catch(() => { });
}

function onMessage(msg) {
    if (msg.action === 'SET_ENABLED') {
        isEnabled = msg.value;
        if (!isEnabled) {
            document.querySelectorAll('.nsfw-blur').forEach(el => blurMgr.unblurElement(el));
            if (overlayMgr.isVisible()) overlayMgr.dismiss();
        }
    }
    if (msg.action === 'SET_SENSITIVITY') window.nsfwDetector?.setSensitivity(msg.value);
    if (msg.action === 'GET_STATS') return { scanned: stats.scanned, blocked: stats.blocked };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
