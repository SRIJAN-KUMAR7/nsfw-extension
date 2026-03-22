'use strict';

const BLUR_CLASS = 'nsfw-blur';

/** --- Blur Manager class --- **/
class BlurManager {
    constructor() {
        this._blurred = new WeakSet();
    }

    blurElement(el) {
        if (this._blurred.has(el)) return;
        this._blurred.add(el);
        el.classList.add(BLUR_CLASS);
        const parent = el.parentElement;
        if (parent && getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
    }

    unblurElement(el) {
        el.classList.remove(BLUR_CLASS);
    }

    isBlurred(el) {
        return el.classList.contains(BLUR_CLASS);
    }

    blurAll(elements) { elements.forEach(el => this.blurElement(el)); }
    unblurAll(elements) { elements.forEach(el => this.unblurElement(el)); }
    hasBeenBlurred(el) { return this._blurred.has(el); }
}

window.BlurManager = BlurManager;
window.BLUR_CLASS = BLUR_CLASS;
