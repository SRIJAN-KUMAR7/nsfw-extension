'use strict';

const OVERLAY_ID = 'nsfw-shield-overlay';
const COUNTDOWN_SECONDS = 3;

/** --- Overlay Manager class --- **/
class OverlayManager {
    constructor() {
        this._overlay = null;
        this._countdownTimer = null;
        this._currentCount = COUNTDOWN_SECONDS;
        this._visible = false;
    }

    show(reason = 'Explicit Content') {
        if (this._visible) {
            this._resetCountdown();
            return;
        }
        this._createOverlay(reason);
        document.body.appendChild(this._overlay);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            if (this._overlay) this._overlay.classList.add('nsfw-overlay--visible');
        });
        this._visible = true;
        this._startCountdown();
    }

    dismiss() {
        this._clearCountdown();
        this._removeOverlay();
    }

    isVisible() { return this._visible; }

    /** --- Private Methods --- **/
    _createOverlay(reason) {
        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.className = 'nsfw-overlay';
        overlay.innerHTML = `
      <div class="nsfw-overlay__panel">
        <div class="nsfw-overlay__icon">⚠️</div>
        <h1 class="nsfw-overlay__title">NSFW Content Detected</h1>
        <p class="nsfw-overlay__reason">Category: <strong>${this._escapeHtml(reason)}</strong></p>
        <p class="nsfw-overlay__message">Page contains explicit content. Tab closing automatically.</p>
        <div class="nsfw-overlay__timer-ring">
          <svg class="nsfw-timer-svg" viewBox="0 0 60 60">
            <circle class="nsfw-timer-bg" cx="30" cy="30" r="26"/>
            <circle class="nsfw-timer-progress" id="nsfw-timer-circle" cx="30" cy="30" r="26" stroke-dasharray="163.36" stroke-dashoffset="0"/>
          </svg>
          <span class="nsfw-overlay__count" id="nsfw-countdown">${COUNTDOWN_SECONDS}</span>
        </div>
        <p class="nsfw-overlay__closing-text">Closing tab in <span id="nsfw-countdown-text">${COUNTDOWN_SECONDS}</span>s…</p>
        <button class="nsfw-overlay__close-btn" id="nsfw-close-btn">✕ Cancel</button>
      </div>
    `;
        overlay.querySelector('#nsfw-close-btn').addEventListener('click', () => this.dismiss());
        this._overlay = overlay;
    }

    _startCountdown() {
        this._currentCount = COUNTDOWN_SECONDS;
        this._updateCountdownDisplay();
        this._countdownTimer = setInterval(() => {
            this._currentCount -= 1;
            this._updateCountdownDisplay();
            if (this._currentCount <= 0) {
                this._clearCountdown();
                this._closeTab();
            }
        }, 1000);
    }

    _resetCountdown() { this._clearCountdown(); this._startCountdown(); }
    _clearCountdown() { if (this._countdownTimer) clearInterval(this._countdownTimer); this._countdownTimer = null; }

    _updateCountdownDisplay() {
        const countEl = document.getElementById('nsfw-countdown');
        const textEl = document.getElementById('nsfw-countdown-text');
        const circleEl = document.getElementById('nsfw-timer-circle');
        if (countEl) countEl.textContent = Math.max(0, this._currentCount);
        if (textEl) textEl.textContent = Math.max(0, this._currentCount);
        if (circleEl) {
            const circ = 163.36;
            circleEl.style.strokeDashoffset = circ * (1 - (this._currentCount / COUNTDOWN_SECONDS));
        }
    }

    _removeOverlay() {
        this._visible = false;
        document.body.style.overflow = '';
        if (this._overlay) {
            this._overlay.classList.remove('nsfw-overlay--visible');
            setTimeout(() => {
                if (this._overlay?.parentNode) this._overlay.parentNode.removeChild(this._overlay);
                this._overlay = null;
            }, 400);
        }
    }

    _closeTab() {
        this._removeOverlay();
        if (typeof chrome !== 'undefined' && chrome.runtime) chrome.runtime.sendMessage({ action: 'CLOSE_TAB' });
    }

    _escapeHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
}

window.OverlayManager = OverlayManager;
