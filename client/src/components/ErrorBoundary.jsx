import React from 'react';
import * as Sentry from '@sentry/react';
import { logger } from '../utils/logger';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('Error Boundary caught an error:', {
            error: error.toString(),
            componentStack: errorInfo.componentStack
        });

        this.setState({ errorInfo });

        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack
                }
            },
            tags: {
                boundary: this.props.name || 'root'
            }
        });
    }

    handleReset = () => {
        const { retryCount } = this.state;

        if (retryCount >= 3) {
            window.location.href = '/';
            return;
        }

        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: retryCount + 1
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        const { hasError, error, errorInfo, retryCount } = this.state;
        const { fallback, name = 'Application' } = this.props;

        if (hasError) {
            if (fallback) {
                return fallback({ error, reset: this.handleReset, goHome: this.handleGoHome });
            }

            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <h1 style={styles.title}>Something went wrong</h1>
                        <p style={styles.message}>
                            {name !== 'Application'
                                ? `The ${name} section stopped working. Try loading it again, or return to the home page.`
                                : 'This page stopped working. Try again, or return to the home page.'
                            }
                        </p>

                        {import.meta.env.MODE === 'development' && error && (
                            <details style={styles.errorDetailsContainer}>
                                <summary style={styles.errorSummary}>Error Details (Dev Only)</summary>
                                <pre style={styles.errorDetails}>
                                    <strong>Error:</strong> {error.toString()}
                                    {errorInfo && (
                                        <>
                                            {'\n\n'}
                                            <strong>Component Stack:</strong>
                                            {errorInfo.componentStack}
                                        </>
                                    )}
                                </pre>
                            </details>
                        )}

                        <div style={styles.buttonGroup}>
                            {retryCount < 3 && (
                                <button onClick={this.handleReset} style={styles.buttonPrimary}>
                                    Try Again {retryCount > 0 && `(${3 - retryCount} attempts left)`}
                                </button>
                            )}
                            <button onClick={this.handleGoHome} style={styles.buttonSecondary}>
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--fr-surface, #ffffff)',
        padding: '20px'
    },
    card: {
        background: 'var(--fr-surface, #ffffff)',
        border: '1px solid var(--fr-line, #e5e5e5)',
        borderRadius: 'var(--fr-r-panel, 16px)',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
    },
    title: {
        fontSize: 'var(--fr-fs-headline)',
        fontWeight: 'var(--fr-fw-bold)',
        lineHeight: 'var(--fr-lh-tight)',
        letterSpacing: 'var(--fr-track-headline)',
        marginBottom: '20px',
        color: 'var(--fr-text, #1a1a1a)',
        fontFamily: 'var(--fr-font-display)'
    },
    message: {
        fontSize: 'var(--fr-fs-body)',
        fontWeight: 'var(--fr-fw-regular)',
        lineHeight: 'var(--fr-lh-normal)',
        color: 'var(--fr-text-2, #666666)',
        marginBottom: '30px'
    },
    errorDetailsContainer: {
        marginBottom: '30px',
        textAlign: 'left'
    },
    errorSummary: {
        cursor: 'pointer',
        padding: '10px',
        background: '#f5f5f5',
        borderRadius: '8px',
        fontSize: 'var(--fr-fs-control)',
        fontWeight: 'var(--fr-fw-medium)',
        lineHeight: 'var(--fr-lh-control)',
        userSelect: 'none'
    },
    errorDetails: {
        background: '#fff3cd',
        border: '1px solid #ffc107',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'var(--fr-font-mono)',
        fontSize: 'var(--fr-fs-label)',
        lineHeight: 'var(--fr-lh-snug)',
        color: '#856404',
        textAlign: 'left',
        overflow: 'auto',
        maxHeight: '300px',
        marginTop: '10px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    },
    buttonGroup: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    buttonPrimary: {
        background: 'var(--fr-brand, #1a1a1a)',
        color: 'var(--fr-on-brand, #ffffff)',
        border: '1px solid transparent',
        minHeight: '44px',
        padding: '12px 28px',
        borderRadius: 'var(--fr-r-control, 8px)',
        fontFamily: 'var(--fr-font-sans)',
        fontSize: 'var(--fr-fs-control)',
        fontWeight: 'var(--fr-fw-medium)',
        lineHeight: 'var(--fr-lh-control)',
        cursor: 'pointer'
    },
    buttonSecondary: {
        background: 'transparent',
        color: 'var(--fr-text, #1a1a1a)',
        border: '1px solid var(--fr-line, #1a1a1a)',
        minHeight: '44px',
        padding: '12px 28px',
        borderRadius: 'var(--fr-r-control, 8px)',
        fontFamily: 'var(--fr-font-sans)',
        fontSize: 'var(--fr-fs-control)',
        fontWeight: 'var(--fr-fw-medium)',
        lineHeight: 'var(--fr-lh-control)',
        cursor: 'pointer'
    }
};

export default ErrorBoundary;
