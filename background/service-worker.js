'use strict';

/** --- Message Listener --- **/
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'CLOSE_TAB') {
        const tabId = sender.tab?.id;
        if (tabId !== undefined) {
            setTimeout(() => {
                chrome.tabs.remove(tabId, () => {
                    if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError.message);
                });
            }, 400);
        }
        sendResponse({ ok: true });
        return true;
    }
    if (msg.action === 'SET_ENABLED' || msg.action === 'SET_SENSITIVITY') {
        const tabId = sender.tab?.id;
        if (tabId) chrome.tabs.sendMessage(tabId, msg).catch(() => { });
        sendResponse({ ok: true });
        return true;
    }
});

/** --- Lifecycle Events --- **/
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.storage.sync.set({ nsfw_shield_enabled: true, nsfw_shield_sensitivity: 'medium' });
    }
});

/** --- Badge Updates --- **/
chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.action === 'UPDATE_BADGE') {
        const tabId = sender.tab?.id;
        if (tabId) {
            chrome.action.setBadgeText({ tabId, text: msg.count > 0 ? String(msg.count) : '' });
            chrome.action.setBadgeBackgroundColor({ tabId, color: '#FF5252' });
        }
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') chrome.action.setBadgeText({ tabId, text: '' }).catch(() => { });
});
