import { Component, type ReactNode } from "react";

import { CrashView } from "./pages/crash-view";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override render(): ReactNode {
    if (this.state.error) return <CrashView error={this.state.error} />;
    return this.props.children;
  }
}
