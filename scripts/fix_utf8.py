import codecs

def fix_file(path):
    with open(path, 'rb') as f:
        data = f.read()

    # Chrome complains if a file isn't UTF-8 encoded.
    # It rejects files that contain invalid utf-8 byte sequences or a BOM it doesn't like.
    
    # Strip BOM if present
    if data.startswith(codecs.BOM_UTF8):
        data = data[len(codecs.BOM_UTF8):]
    
    # Decode and strictly encode using 'replace' to turn any malformed bytes into valid utf-8 specifier chars (?)
    text = data.decode('utf-8', errors='replace')
    
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)

fix_file('lib/tf-tflite.min.js')
fix_file('lib/tf.min.js')
fix_file('lib/tflite_web_api_client.js')
print("Successfully forced pure UTF-8 encoding on all library files.")
