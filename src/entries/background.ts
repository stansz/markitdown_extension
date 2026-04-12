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
  // Open side panel first so it's ready to receive the message
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }

  // Small delay to let the side panel initialize
  await new Promise(resolve => setTimeout(resolve, 300));

  if (info.menuItemId === 'convert-link-to-markdown' && info.linkUrl) {
    try {
      const response = await fetch(info.linkUrl);
      const contentType = response.headers.get('content-type') || '';
      const arrayBuffer = await response.arrayBuffer();

      const fileName = info.linkUrl.split('/').pop() || 'document.html';
      chrome.runtime.sendMessage({
        type: 'convert-file',
        fileData: arrayBuffer,
        fileName,
        mimeType: contentType,
      });
    } catch (err) {
      console.error('[MarkItDown] Failed to fetch link:', err);
    }
  }

  if (info.menuItemId === 'convert-page-to-markdown' && tab?.id) {
    try {
      // Execute script to get the page's HTML content
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.documentElement.outerHTML,
      });

      const html = results[0]?.result;
      if (html) {
        const encoder = new TextEncoder();
        const arrayBuffer = encoder.encode(html).buffer;
        const fileName = (tab.title || 'page').replace(/[^a-zA-Z0-9._-]/g, '_') + '.html';

        chrome.runtime.sendMessage({
          type: 'convert-file',
          fileData: arrayBuffer,
          fileName,
          mimeType: 'text/html',
        });
      }
    } catch (err) {
      console.error('[MarkItDown] Failed to get page content:', err);
    }
  }
});
