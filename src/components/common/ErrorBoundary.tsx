import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                OmorfiHub encountered an unexpected error loading this section. Your account and data are safe.
              </p>
            </div>

            {this.state.error && process.env.NODE_ENV !== 'production' && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-left text-xs font-mono text-red-700 dark:text-red-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition duration-150 shadow-md shadow-emerald-600/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition duration-150"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-6">
            OmorfiHub is a product of Omorfi Limited
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
