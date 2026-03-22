const fs = require('fs');

const filesToPatch = [
    'lib/tf.min.js',
    'lib/tf-tflite.min.js',
    'lib/tflite_web_api_client.js',
    'lib/tflite_web_api_cc.js',
    'lib/tflite_web_api_cc_simd.js'
];

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log('File not found, skipping:', file);
        return;
    }

    console.log('Processing:', file);
    let content = fs.readFileSync(file, 'utf8');
    let originalLength = content.length;

    // 1. Replace Function("return this") with globalThis (common environment probe)
    content = content.replace(/Function\(['"]return this['"]\)\(\)/g, 'globalThis');
    content = content.replace(/new Function\(['"]return this['"]\)\(\)/g, 'globalThis');
    content = content.replace(/Function\(['"]return this['"]\)/g, '(function(){return globalThis})');
    content = content.replace(/new Function\(['"]return this['"]\)/g, '(function(){return globalThis})');

    // 2. Patch Closure Library globalEval
    content = content.replace(/goog\.globalEval\s*=\s*function\(e\)\{\(0,eval\)\(e\)\}/g, 'goog.globalEval=function(e){console.warn("eval blocked",e)}');
    content = content.replace(/goog\.globalEval\s*=\s*function\(a\)\{\(0,eval\)\(a\)\}/g, 'goog.globalEval=function(a){console.warn("eval blocked",a)}');

    // 3. Selective Function(...) calls often found in core-js
    content = content.replace(/function\(\)\{return this\}\(\)\|\|Function\("return this"\)\(\)/g, 'globalThis');

    // 4. Emscripten legal function name wrapper
    const emscriptenRegex = /return new Function\("body","return function "\+name\+"\(\)\{return body\.apply\(this,arguments\)\}"\)/g;
    content = content.replace(emscriptenRegex, 'return function(){return body.apply(this,arguments)}');

    if (content.length !== originalLength || content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('  Successfully patched:', file);
    } else {
        console.log('  No changes needed for:', file);
    }
});
