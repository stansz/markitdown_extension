/// <reference types="chrome" />

/**
 * Open the full converter experience in a popup window.
 */
export async function openPopupWindow() {
  if (typeof chrome !== 'undefined' && chrome.windows) {
    chrome.windows.create({
      type: 'popup',
      url: chrome.runtime.getURL('window.html'),
      width: 1200,
      height: 800,
    });
  }
}

/**
 * Check if we're running inside a Chrome extension context.
 */
export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}
