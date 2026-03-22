'use strict';

const MIN_DIMENSION = 64;

/** --- Size Check --- **/
function isSizeable(el) {
    const w = el.naturalWidth || el.videoWidth || el.width || el.offsetWidth;
    const h = el.naturalHeight || el.videoHeight || el.height || el.offsetHeight;
    return w >= MIN_DIMENSION && h >= MIN_DIMENSION;
}

/** --- Draw to Canvas --- **/
function drawToCanvas(source, width, height) {
    let canvas, ctx;
    if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(width, height);
        ctx = canvas.getContext('2d');
    } else {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');
    }
    ctx.drawImage(source, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
}

/** --- Extract Image Frame --- **/
function extractFromImage(imgEl) {
    if (!isSizeable(imgEl)) return null;
    if (!imgEl.crossOrigin) imgEl.crossOrigin = 'anonymous';
    const width = imgEl.naturalWidth || imgEl.width;
    const height = imgEl.naturalHeight || imgEl.height;
    try {
        return drawToCanvas(imgEl, width, height);
    } catch (err) {
        return null;
    }
}

/** --- Extract Video Frame --- **/
function extractFrameFromVideo(videoEl) {
    if (!isSizeable(videoEl)) return null;
    if (videoEl.readyState < 2) return null;
    const width = videoEl.videoWidth;
    const height = videoEl.videoHeight;
    try {
        return drawToCanvas(videoEl, width, height);
    } catch (err) {
        return null;
    }
}

/** --- Video Frame Watcher --- **/
function watchVideo(videoEl, onFrame, intervalMs = 2000) {
    let timerId = null;
    const sample = () => {
        if (videoEl.paused || videoEl.ended) return;
        const imageData = extractFrameFromVideo(videoEl);
        if (imageData) onFrame(imageData);
    };
    const start = () => {
        if (timerId !== null) return;
        timerId = setInterval(sample, intervalMs);
        sample();
    };
    const stop = () => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    };
    videoEl.addEventListener('play', start);
    videoEl.addEventListener('pause', stop);
    videoEl.addEventListener('ended', stop);
    if (!videoEl.paused) start();
    return stop;
}

window.frameExtractor = { extractFromImage, extractFrameFromVideo, watchVideo, isSizeable };
