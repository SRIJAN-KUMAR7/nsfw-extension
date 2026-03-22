const fs = require('fs');

function fixFile(path) {
    try {
        let text = fs.readFileSync(path, 'utf8');
        // Ensure no BOM is present at the beginning
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        fs.writeFileSync(path, text, 'utf8');
        console.log('Fixed', path);
    } catch(e) {
        console.error('Error on', path, e.message);
    }
}

fixFile('lib/tf-tflite.min.js');
fixFile('lib/tf.min.js');
fixFile('lib/tflite_web_api_client.js');
