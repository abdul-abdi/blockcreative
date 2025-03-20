'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // You can also send this to a logging service like Sentry
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/errors/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name
            },
            errorInfo: {
              componentStack: errorInfo.componentStack
            },
            url: window.location.href,
            timestamp: new Date().toISOString()
          }),
        }).catch(e => {
          console.error('Failed to log error:', e);
        });
      } catch (e) {
        console.error('Failed to send error to logging endpoint:', e);
      }
    }
    
    // Update state with error details
    this.setState({
      errorInfo
    });
  }
  
  // Allows manually clearing the error state
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="p-6 max-w-xl mx-auto my-8 bg-zinc-900/50 backdrop-blur-lg rounded-xl shadow-xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
          <div className="mb-4">
            <p className="text-gray-400 mb-2">
              An error occurred in this component. The rest of the application should still work.
            </p>
          </div>
          <div className="mb-4">
            <p className="text-sm text-red-400 font-mono mb-1">
              {this.state.error?.name}: {this.state.error?.message}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2">
                <summary className="text-sm text-gray-400 cursor-pointer">Stack trace</summary>
                <pre className="mt-2 p-2 bg-black/50 rounded text-xs text-gray-400 overflow-auto max-h-60">
                  {this.state.error?.stack}
                </pre>
                <div className="mt-4">
                  <p className="text-sm text-gray-400">Component Stack:</p>
                  <pre className="mt-1 p-2 bg-black/50 rounded text-xs text-gray-400 overflow-auto max-h-60">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 