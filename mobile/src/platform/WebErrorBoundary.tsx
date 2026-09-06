/**
 * Web-only error boundary.
 *
 * Native-module calls that slip through (or any render error) are caught here
 * and reported to Sentry so a single failure never blanks out the browser app.
 * The fallback message is Persian-first, matching the rest of the UI.
 */
import React from 'react';
import * as Sentry from './sentry.web';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class WebErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    try {
      Sentry.captureException(error, { extra: { ...info } });
    } catch {
      // ignore reporting failures
    }
    // eslint-disable-next-line no-console
    console.error('[WebErrorBoundary]', error, info);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        dir="rtl"
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          fontFamily: "'Vazirmatn-Regular', 'Vazirmatn', sans-serif",
          color: '#fff',
          backgroundColor: '#111',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>مشکلی پیش آمد</div>
        <div style={{ fontSize: 15, opacity: 0.8, maxWidth: 420 }}>
          متأسفانه در نمایش این بخش خطایی رخ داد. لطفاً دوباره تلاش کنید.
        </div>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: 8,
            padding: '10px 24px',
            fontSize: 15,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#6c5ce7',
            color: '#fff',
            fontFamily: 'inherit',
          }}
        >
          تلاش دوباره
        </button>
      </div>
    );
  }
}

export default WebErrorBoundary;
