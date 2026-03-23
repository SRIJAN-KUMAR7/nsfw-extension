const fs = require('fs');
const files = ['lib/tf.min.js', 'lib/nsfwjs.min.js'];

files.forEach(f => {
    try {
        if (!fs.existsSync(f)) {
            console.log('Skipping non-existent file:', f);
            return;
        }
        let c = fs.readFileSync(f, 'utf8');
        let patched = false;

        // 1. Unified return this global access
        const globalTarget1 = 'Function("return this")()';
        if (c.includes(globalTarget1)) {
            c = c.split(globalTarget1).join('globalThis');
            patched = true;
        }
        const globalTarget2 = "new Function('return this')()";
        if (c.includes(globalTarget2)) {
            c = c.split(globalTarget2).join('globalThis');
            patched = true;
        }

        // 2. regenerator-runtime eval
        // We replace with a direct function that uses globalThis.
        const regeneratorTarget1 = 'Function("r","regeneratorRuntime = r")';
        if (c.includes(regeneratorTarget1)) {
            c = c.split(regeneratorTarget1).join('(function(r){globalThis.regeneratorRuntime = r})');
            patched = true;
        }
        const regeneratorTarget2 = "new Function('r','regeneratorRuntime = r')";
        if (c.includes(regeneratorTarget2)) {
            c = c.split(regeneratorTarget2).join('(function(r){globalThis.regeneratorRuntime = r})');
            patched = true;
        }

        // 3. require eval for regenerator runtime and others
        const requireTarget1 = 'Function(\'return require("\'+e+\'")\')';
        if (c.includes(requireTarget1)) {
            c = c.split(requireTarget1).join('(function(){try{return require(e)}catch(e){}})');
            patched = true;
        }

        // 4. Direct regeneratorRuntime assignments that cause ReferenceError in strict mode
        // Note: we use a negative lookbehind for "globalThis." to avoid double-patching.
        if (c.includes('regeneratorRuntime')) {
            const newC = c.replace(/(?<!(?:var|let|const|function|class|globalThis)\.?\s*)\bregeneratorRuntime\s*=\s*/g, 'globalThis.regeneratorRuntime = ');
            if (newC !== c) {
                c = newC;
                patched = true;
            }
        }

        if (patched) {
            fs.writeFileSync(f, c);
            console.log('Patched', f);
        } else {
            console.log('No additional patch needed for', f);
        }
    } catch (e) {
        console.error('Error processing', f, e);
    }
});
