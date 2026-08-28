import React from 'react';

/**
 * Global error boundary.
 * Prevents the entire app tree from unmounting into a blank white screen
 * when a render-time error is thrown (a common production-only failure).
 * Renders a visible, themed fallback UI with recovery + error details instead.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface the error so it's visible in production logs/consoles.
    console.error('[HeatPath] Uncaught render error:', error, info);
    this.setState({ info });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, info } = this.state;
    const message = (error && (error.message || String(error))) || 'An unexpected error occurred.';
    const stack = (info && info.componentStack) || (error && error.stack) || '';

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0b1220',
          color: '#e2e8f0',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            background: '#111a2e',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '12px' }} aria-hidden="true">
            🔥
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 8px', color: '#f8fafc' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#94a3b8', margin: '0 0 20px' }}>
            HeatPath AI hit an unexpected error while rendering this view. Your data is safe — try
            reloading. If the problem continues, the details below can help diagnose it.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button
              onClick={this.handleReload}
              style={{
                background: '#f97316',
                color: '#0b1220',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reload app
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, info: null })}
              style={{
                background: 'transparent',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>

          <details style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <summary style={{ cursor: 'pointer', color: '#94a3b8', marginBottom: '8px' }}>
              Error details
            </summary>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#0b1220',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px',
                maxHeight: '220px',
                overflow: 'auto',
                margin: 0,
              }}
            >
              {message}
              {stack ? `\n\n${stack}` : ''}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
