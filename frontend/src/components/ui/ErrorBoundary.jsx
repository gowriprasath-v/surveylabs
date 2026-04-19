import React from 'react';
import EmptyState from './EmptyState';
import { AlertCircle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base p-6">
          <EmptyState 
            icon={<AlertCircle className="w-10 h-10 text-danger" />}
            title="Something went wrong"
            description={this.state.error?.message || "An unexpected error occurred in this view."}
            action={
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-surface-2 border border-white/10 rounded-lg text-text-1 hover:bg-white/10 transition-colors"
              >
                Reload Application
              </button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
