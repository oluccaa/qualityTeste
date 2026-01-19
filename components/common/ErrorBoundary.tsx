import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Boundary de Erros do Sistema
 * Refatorado para garantir a correta detecção de herança da classe base Component.
 */
// Fix: Import Component explicitly to help TypeScript resolve base class members and avoid detection issues
export class ErrorBoundary extends Component<Props, State> {
  
  // Fix: Initialized state without the override modifier which was triggering base class resolution errors
  public state: State = {
    hasError: false
  };

  constructor(props: Props) {
    super(props);
  }

  // Mandatory static method for error boundaries to update state
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Catching errors for logging and analytics
  // Fix: Removed override keyword to resolve compilation errors where base class methods were not correctly detected
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Critical System Error]', error, errorInfo);
  }

  // Handler to reset error state and reload the application
  private handleReset = () => {
    // Fix: setState is now correctly accessible through inheritance from Component
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  // Fix: Removed override modifier and ensured proper access to this.state and this.props from base Component
  public render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-red-100 p-10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <AlertOctagon size={40} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-3">Erro de Camada Crítica</h1>
          <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">
            Ocorreu uma exceção no processamento da interface. Se você for um desenvolvedor, verifique o console do navegador.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-98 shadow-xl"
            >
              <RefreshCw size={16} /> Reiniciar Aplicação
            </button>
          </div>
        </div>
      </div>
    );
  }
}
