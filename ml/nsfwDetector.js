'use strict';

// NSFWJS labels: Neutral, Drawing, Hentai, Porn, Sexy
const LABELS = ['Neutral', 'Drawing', 'Hentai', 'Porn', 'Sexy'];
const NSFW_THRESHOLDS = { Porn: 0.65, Hentai: 0.70, Sexy: 0.60 };
const SENSITIVITY_MAP = { low: 1.3, medium: 1.0, high: 0.75 };

let _model = null;
let _loadPromise = null;
let _sensitivity = 'medium';

/** --- Get Model URL --- **/
function getModelUrl() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        // NSFWJS expects the directory containing model.json
        return chrome.runtime.getURL('models/nsfwjs/');
    }
    return 'models/nsfwjs/';
}

/** --- Load Model --- **/
async function loadModel() {
    if (_model) return _model;
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
        const modelUrl = getModelUrl();
        if (typeof nsfwjs === 'undefined') throw new Error('NSFWJS API not loaded');

        // Force CPU backend for stability in content scripts
        // WebGL often fails with 'producer' errors due to CSP or environment limits
        try {
            if (nsfwjs.tf && nsfwjs.tf.setBackend) {
                await nsfwjs.tf.setBackend('cpu');
                console.log('[NSFW Detector] Forced CPU backend');
            }
        } catch (e) {
            console.warn('[NSFW Detector] Failed to set CPU backend, falling back to default');
        }

        // Load the model from the local directory
        // nsfwjs.load(basePath, options)
        _model = await nsfwjs.load(modelUrl, { type: 'graph' });
        console.log('[NSFW Detector] Model loaded from:', modelUrl);
        return _model;
    })();

    return _loadPromise;
}

/** --- Set Sensitivity --- **/
function setSensitivity(level) {
    if (SENSITIVITY_MAP[level] !== undefined) _sensitivity = level;
}

/** --- Classify Frame --- **/
async function classify(imageData) {
    const model = await loadModel();

    // nsfwjs.classify(img, topk)
    // Works with HTMLImageElement, HTMLVideoElement, HTMLCanvasElement, or ImageData
    const rawPredictions = await model.classify(imageData);

    // Map NSFWJS format to our internal format {label, score}
    return rawPredictions.map(p => ({
        label: p.className,
        score: p.probability
    })).sort((a, b) => b.score - a.score);
}

/** --- NSFW Decision Logic --- **/
function isNSFW(predictions) {
    const multiplier = SENSITIVITY_MAP[_sensitivity] ?? 1.0;
    for (const { label, score } of predictions) {
        const baseThreshold = NSFW_THRESHOLDS[label];
        if (baseThreshold !== undefined) {
            const effectiveThreshold = baseThreshold * multiplier;
            if (score >= effectiveThreshold) {
                return { isNSFW: true, reason: label, topLabel: predictions[0].label, score };
            }
        }
    }
    return { isNSFW: false, reason: null, topLabel: predictions[0]?.label };
}

/** --- Detect NSFW (Wrapper) --- **/
async function detectNSFW(imageData) {
    const predictions = await classify(imageData);
    const result = isNSFW(predictions);
    return { ...result, predictions };
}

function _reset() {
    _model = null;
    _loadPromise = null;
    _sensitivity = 'medium';
}

window.nsfwDetector = { loadModel, classify, isNSFW, detectNSFW, setSensitivity, LABELS, NSFW_THRESHOLDS };
