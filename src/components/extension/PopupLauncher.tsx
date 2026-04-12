/// <reference types="chrome" />

export function PopupLauncher() {
  const openSidePanel = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
        window.close();
      }
    } catch (err) {
      console.error('Failed to open side panel:', err);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', minWidth: '220px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '12px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <p style={{ fontWeight: 600, marginBottom: '8px' }}>Opening MarkItDown...</p>
      <button
        onClick={openSidePanel}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: '#f5f5f5',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Open Side Panel
      </button>
    </div>
  );
}
