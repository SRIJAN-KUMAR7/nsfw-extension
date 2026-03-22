# NSFW Shield — Setup & Running Strategy

## 🛠️ Setup

1. **Activate Virtual Environment (venv)**
   Run all setup commands inside a Python virtual environment to keep dependencies isolated:
   ```powershell
   python -m venv venv

   .\venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Download TFLite Dependencies**
   Instead of converting the `.tflite` model, this extension runs it directly in the browser via WebAssembly. Run the setup script to download the required WebAssembly SDK into your extension map:
   ```bash
   python scripts/setup_tflite.py
   ```

## 🚀 Running the Extension (Development Mode)

Unlike traditional React apps, Chrome Extensions don't have a `localhost` dev server. You test them by loading them directly into the browser.

1. **Load into Chrome**
   - Open Google Chrome and type `chrome://extensions/` in the URL bar.
   - Toggle on **Developer mode** in the top-right corner.
   - Click the **Load unpacked** plugin button and select your complete `nsfw-extension` directory.

2. **Live Reloading**
   - If you make changes to the code (`content.js`, `nsfwDetector.js`, etc.), those changes won't be applied immediately. 
   - You must go back to `chrome://extensions/` and click the **Refresh** icon 🔄 specifically on the NSFW Shield card to inject the new code.
   - Then, refresh your target test website.

3. **Running Tests in Watch Mode**
   If you are actively modifying the JavaScript files, you can watch for changes and auto-run unit tests:
   ```bash
   npm run test:watch
   ```
