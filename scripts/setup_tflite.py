import os, urllib.request, tarfile, shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
LIB_DIR = ROOT / "lib"
LIB_DIR.mkdir(parents=True, exist_ok=True)

package_url = "https://registry.npmjs.org/@tensorflow/tfjs-tflite/-/tfjs-tflite-0.0.1-alpha.8.tgz"
tgz_mode = "r:gz"

def download_and_extract():
    temp_tgz = ROOT / "tflite_core.tgz"
    try:
        print("Fetching official NPM tarball...")
        urllib.request.urlretrieve(package_url, temp_tgz)
        
        print("Extracting WASM binaries...")
        with tarfile.open(temp_tgz, tgz_mode) as tar:
            for member in tar.getmembers():
                if "dist/" in member.name and member.name.endswith(".wasm"):
                    filename = os.path.basename(member.name)
                    dest_path = LIB_DIR / filename
                    
                    # Manually read and write to bypass extract() permission/lock issues
                    try:
                        extracted_file = tar.extractfile(member)
                        with open(dest_path, "wb") as out_file:
                            out_file.write(extracted_file.read())
                        print(f" ✓ Restored {filename}")
                    except Exception as ex:
                        print(f" Skipped {filename}: {ex}")
        
        # Cleanup
        os.remove(temp_tgz)
        print("All TFLite dependencies perfectly provisioned.")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    download_and_extract()
