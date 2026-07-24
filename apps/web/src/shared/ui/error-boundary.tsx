import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './error-state';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Application error"
          description="An unexpected UI error occurred."
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
