import sys, types, os, subprocess
from pathlib import Path

# --- Mocking Block (Prevents 'estimator' crash) ---
mock_hub = types.ModuleType('tensorflow_hub')
sys.modules['tensorflow_hub'] = mock_hub
sys.modules['tensorflow_hub.estimator'] = types.ModuleType('tensorflow_hub.estimator')

# --- Compatibility Block (Numpy crash fix) ---
import numpy as np
if not hasattr(np, 'object'): np.object = object

ROOT = Path(__file__).parent.parent
INPUT = ROOT / "models" / "model.tflite"
OUTPUT = ROOT / "models" / "tfjs_model"

def convert():
    if not INPUT.exists():
        print(f"Error: {INPUT} not found")
        sys.exit(1)
    OUTPUT.mkdir(parents=True, exist_ok=True)

    print("Checking for TFLite conversion module...")
    try:
        from tensorflowjs.converters import tflite_converter
    except ImportError:
        print("Required module missing. Attempting to locate tflite converter...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflowjs>=3.18.0"])
            from tensorflowjs.converters import tflite_converter
        except:
            print("Failed to load tflite_converter. Please run: pip install tensorflowjs --upgrade")
            sys.exit(1)

    print("Converting TFLite → TFJS GraphModel...")
    try:
        tflite_converter.convert_tflite_to_graph_model(str(INPUT), str(OUTPUT))
        print(f"Done! Created model files in: {OUTPUT}")
    except Exception as e:
        print(f"Conversion failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    convert()
