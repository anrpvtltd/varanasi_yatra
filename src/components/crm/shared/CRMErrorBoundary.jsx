import React from 'react';

/**
 * CRM Resilient Error Boundary
 * 
 * Invariants:
 * 1. Prevents unhandled component exceptions from collapsing the entire React DOM into a blank white screen.
 * 2. Keeps app shell (sidebar, navigation, headers) intact.
 * 3. Provides explicit [Retry Component] and [Return to Dashboard] actions.
 * 4. Logs exact exception to console for developer diagnostics without leaking tokens/secrets to end-users.
 */
export default class CRMErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Technical error logging (development/audit)
        console.error('🚨 [CRM Error Boundary Caught Exception]:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    };

    handleResetToDashboard = () => {
        try {
            sessionStorage.setItem('crm_active_nav', 'DASHBOARD');
        } catch {}
        if (this.props.onReset) {
            this.props.onReset('DASHBOARD');
        } else if (typeof window !== 'undefined') {
            window.location.href = '/crm';
        }
    };

    render() {
        if (this.state.hasError) {
            const componentName = this.props.name || 'Workspace Component';
            const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';

            return (
                <div className="p-6 my-4 bg-white border border-rose-200/80 rounded-2xl shadow-xs text-left max-w-4xl mx-auto space-y-4 animate-fadeIn">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-xl shrink-0">
                            ⚠️
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                    {componentName} Interrupted
                                </h3>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    Recoverable State
                                </span>
                            </div>
                            <p className="text-xs text-slate-600">
                                An unexpected issue occurred while rendering this section. Navigation remains fully operational.
                            </p>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all">
                        <strong>Error:</strong> {errorMessage}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={this.handleRetry}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🔄</span>
                            <span>Retry Component</span>
                        </button>

                        <button
                            type="button"
                            onClick={this.handleResetToDashboard}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🏠</span>
                            <span>Return to Dashboard</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
