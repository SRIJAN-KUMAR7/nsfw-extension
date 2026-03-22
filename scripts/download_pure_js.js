const https = require('https');
const fs = require('fs');

// The pristine URLs of the packages
const files = {
    'tf.min.js': 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js',
    'tf-tflite.min.js': 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite/dist/tf-tflite.min.js',
    'tflite_web_api_client.js': 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite/dist/tflite_web_api_client.js'
};

Object.keys(files).forEach(filename => {
    const filePath = `lib/${filename}`;
    const file = fs.createWriteStream(filePath);
    https.get(files[filename], function (response) {
        // Pipe the exact binary data straight to disk, preventing ANY encoding conversion issues
        response.pipe(file);
        file.on('finish', function () {
            file.close();
            console.log('Successfully re-downloaded perfectly encoded ' + filename);
        });
    }).on('error', function (err) {
        console.error('Error downloading ' + filename + ': ' + err.message);
    });
});
