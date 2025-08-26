'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChartErrorBoundary에서 오류 발생:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-80 flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="lg font-semibold text-red-800 mb-2">
              차트 로드 실패
            </h3>
            <p className="text-red-600 text-sm mb-4 max-w-md">
              차트를 표시하는 중 오류가 발생했습니다.
              이는 일시적인 문제일 수 있습니다.
            </p>

            {this.state.error && (
              <details className="text-xs text-red-500 mb-4 text-left max-w-md mx-auto">
                <summary className="cursor-pointer hover:text-red-700">
                  오류 상세 정보
                </summary>
                <div className="mt-2 p-2 bg-red-100 rounded text-left">
                  <p><strong>오류:</strong> {this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <p><strong>컴포넌트:</strong> {this.state.errorInfo.componentStack}</p>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}