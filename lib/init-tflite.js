// This script MUST run before tf-tflite.min.js or nsfwDetector.js
// It establishes the WASM resolution path for Chrome Extension context
(function () {
    const libPath = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('lib/')
        : 'lib/';

    // Create a global nsfwConfig if needed
    window.TF_WASM_PATH = libPath;

    // We will set tflite.setWasmPath when tflite becomes available
    const setPath = () => {
        if (window.tflite) {
            window.tflite.setWasmPath(libPath);
            console.log('TFLite WASM Path set to:', libPath);
        } else {
            // Check again in a bit
            setTimeout(setPath, 50);
        }
    };
    setPath();
})();
