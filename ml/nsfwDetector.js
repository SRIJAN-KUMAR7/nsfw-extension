'use strict';

const LABELS = ['Neutral', 'Drawing', 'Hentai', 'Porn', 'Sexy'];
const NSFW_THRESHOLDS = { Porn: 0.65, Hentai: 0.70, Sexy: 0.60 };
const SENSITIVITY_MAP = { low: 1.3, medium: 1.0, high: 0.75 };

let _model = null;
let _loadPromise = null;
let _sensitivity = 'medium';

/** --- Get Model URL --- **/
function getModelUrl() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL('models/model.tflite');
    }
    return 'models/model.tflite';
}

// Initialize Wasm Path synchronously to prevent origin CSP issues
const TF_WASM_PATH = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
    ? chrome.runtime.getURL('lib/')
    : 'lib/';

if (typeof tflite !== 'undefined') {
    tflite.setWasmPath(TF_WASM_PATH);
}
// Double check it on window for visibility
window.TF_WASM_PATH = TF_WASM_PATH;

/** --- Load Model --- **/
async function loadModel() {
    if (_model) return _model;
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
        const modelUrl = getModelUrl();
        if (typeof tflite === 'undefined') throw new Error('TFLite API not loaded');
        _model = await tflite.loadTFLiteModel(modelUrl);
        return _model;
    })();

    return _loadPromise;
}

/** --- Set Sensitivity --- **/
function setSensitivity(level) {
    if (SENSITIVITY_MAP[level] !== undefined) _sensitivity = level;
}

/** --- Preprocess Image --- **/
function preprocessImageData(imageData, targetSize = 224) {
    return tf.tidy(() => {
        return tf.browser
            .fromPixels(imageData)
            .resizeBilinear([targetSize, targetSize])
            .toFloat()
            .div(tf.scalar(255.0))
            .expandDims(0);
    });
}

/** --- Classify Frame --- **/
async function classify(imageData) {
    const model = await loadModel();
    const tensor = preprocessImageData(imageData);
    let predictions;

    try {
        const output = await model.predict(tensor);
        const raw = Array.isArray(output) ? output[0] : output;
        predictions = await raw.data();
        // Check if raw needs disposal (tf-tflite tensors return data)
        if (typeof raw.dispose === 'function') raw.dispose();
    } finally {
        tensor.dispose();
    }

    return LABELS.map((label, i) => ({
        label,
        score: predictions[i],
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
