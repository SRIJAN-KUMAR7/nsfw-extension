'use strict';

const KEY_ENABLED = 'nsfw_shield_enabled';
const KEY_SENSITIVITY = 'nsfw_shield_sensitivity';

const enableToggle = document.getElementById('enable-toggle');
const toggleHint = document.getElementById('toggle-hint');
const statusDot = document.getElementById('status-dot');
const statScanned = document.getElementById('stat-scanned');
const statBlocked = document.getElementById('stat-blocked');
const sensBtns = document.querySelectorAll('.sens-btn');

/** --- Load Settings --- **/
chrome.storage.sync.get([KEY_ENABLED, KEY_SENSITIVITY], (res) => {
    const enabled = res[KEY_ENABLED] ?? true;
    const sens = res[KEY_SENSITIVITY] ?? 'medium';
    enableToggle.checked = enabled;
    updateToggleUI(enabled);
    activateSensBtn(sens);
});

/** --- Load Stats --- **/
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.storage.session.get(['nsfw_stat_scanned', 'nsfw_stat_blocked'], (res) => {
        statScanned.textContent = res.nsfw_stat_scanned ?? 0;
        statBlocked.textContent = res.nsfw_stat_blocked ?? 0;
    });
});

/** --- Toggle Event --- **/
enableToggle.addEventListener('change', () => {
    const enabled = enableToggle.checked;
    chrome.storage.sync.set({ [KEY_ENABLED]: enabled });
    updateToggleUI(enabled);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { action: 'SET_ENABLED', value: enabled }).catch(() => { });
    });
});

/** --- Sensitivity Event --- **/
sensBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const level = btn.dataset.level;
        activateSensBtn(level);
        chrome.storage.sync.set({ [KEY_SENSITIVITY]: level });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { action: 'SET_SENSITIVITY', value: level }).catch(() => { });
        });
    });
});

/** --- UI Helpers --- **/
function updateToggleUI(enabled) {
    statusDot.className = `popup__status-dot ${enabled ? 'popup__status-dot--active' : 'popup__status-dot--inactive'}`;
    toggleHint.textContent = enabled ? 'Active on this tab' : 'Disabled on this tab';
}

function activateSensBtn(level) {
    sensBtns.forEach(btn => btn.classList.toggle('sens-btn--active', btn.dataset.level === level));
}
