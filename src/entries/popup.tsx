import { createRoot } from 'react-dom/client';

function PopupLauncher() {
  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  return (
    <div style={{ padding: '16px', textAlign: 'center', minWidth: '200px' }}>
      <p>Opening MarkItDown...</p>
      <button onClick={openSidePanel}>Open Side Panel</button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupLauncher />);
