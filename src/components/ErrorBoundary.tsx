import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-bg px-6 text-center text-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Plast's Run</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold">Algo travou nesta tela</h1>
        <p className="mt-3 max-w-md text-sm text-sand">{this.state.error.message}</p>
        <button
          type="button"
          className="mt-6 rounded-xl bg-ember px-5 py-3 text-sm font-bold text-on-accent"
          onClick={() => window.location.reload()}
        >
          Recarregar
        </button>
      </div>
    )
  }
}
