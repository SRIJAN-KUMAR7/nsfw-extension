import urllib.request
import os
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
LIB_DIR = ROOT / "lib"

JS_FILES = {
    "tf.min.js": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js",
    "tf-tflite.min.js": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.8/dist/tf-tflite.min.js",
    "tflite_web_api_client.js": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.8/dist/tflite_web_api_client.js",
}

def fix():
    print("Fetching raw, exact JS binaries to fix Chrome encoding validation...")
    for filename, url in JS_FILES.items():
        dest = LIB_DIR / filename
        temp_dest = LIB_DIR / (filename + ".tmp")
        try:
            # Fetch directly to a temporary file 
            urllib.request.urlretrieve(url, temp_dest)
            
            # Remove existing file if present and replace
            if dest.exists():
                try:
                    os.remove(dest)
                except:
                    pass
            os.replace(temp_dest, dest)
            print(f" ✓ Master copy restored: {filename}")
        except Exception as e:
            print(f" ✗ Error {filename}: {e}")

if __name__ == "__main__":
    fix()
