import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { clearSession } from '../lib/auth'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught a render crash:', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  private handleLogout = () => {
    clearSession()
    window.location.href = '/login'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="max-w-md text-sm text-slate-600">
            An unexpected error occurred while rendering this page. You can try again or return to the login screen.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try Again
            </button>
            <button
              onClick={this.handleLogout}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Login
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
