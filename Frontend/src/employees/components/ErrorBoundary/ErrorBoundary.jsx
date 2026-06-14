import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Unhandled UI error:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return fallback || (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            background: '#F8FAFC',
            color: '#0F172A',
          }}
        >
          <div
            style={{
              width: 'min(100%, 480px)',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
            }}
          >
            <h1 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Something went wrong</h1>
            <p style={{ marginBottom: '16px', lineHeight: 1.5, color: '#475569' }}>
              The page hit an unexpected problem. Refresh the screen and try again.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                border: 'none',
                borderRadius: '999px',
                background: '#0F172A',
                color: '#FFFFFF',
                padding: '10px 16px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;