import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './index.css';

const rootEl = document.getElementById('root');

// Surface uncaught errors / rejections so production issues are visible
// instead of failing silently into a blank screen.
window.addEventListener('error', (e) => {
  console.error('[HeatPath] Global error:', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[HeatPath] Unhandled promise rejection:', e.reason);
});

if (!rootEl) {
  // Extremely defensive: index.html should always contain #root.
  document.body.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:#e2e8f0;background:#0b1220;font-family:sans-serif">Unable to mount HeatPath AI: missing #root element.</div>';
} else {
  // React is about to mount — cancel the "failed to load" fallback timer.
  if (window.__APP_BOOT_TIMER__) {
    clearTimeout(window.__APP_BOOT_TIMER__);
    window.__APP_BOOT_TIMER__ = null;
  }
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
