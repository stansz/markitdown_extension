// --- Extension icon click → open side panel ---
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// --- Context menus ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'convert-link-to-markdown',
    title: 'Convert this link to Markdown',
    contexts: ['link'],
    documentUrlPatterns: ['<all_urls>'],
  });

  chrome.contextMenus.create({
    id: 'convert-page-to-markdown',
    title: 'Convert this page to Markdown',
    contexts: ['page'],
    documentUrlPatterns: ['<all_urls>'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }

  if (info.menuItemId === 'convert-link-to-markdown' && info.linkUrl) {
    chrome.runtime.sendMessage({ type: 'convert-url', url: info.linkUrl });
  }

  if (info.menuItemId === 'convert-page-to-markdown' && tab?.id) {
    chrome.runtime.sendMessage({ type: 'convert-page', tabId: tab.id });
  }
});
