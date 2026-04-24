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
                        <h1 style={styles.title}>😵 Oops! Something went wrong</h1>
                        <p style={styles.message}>
                            {name !== 'Application'
                                ? `The ${name} section encountered an error. You can try refreshing this section or return to the home page.`
                                : "We're sorry for the inconvenience. The app encountered an unexpected error."
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
    },
    card: {
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    title: {
        fontSize: '2rem',
        marginBottom: '20px',
        color: '#1a1a1a',
        fontFamily: 'Playfair Display, serif'
    },
    message: {
        fontSize: '1rem',
        color: '#666',
        marginBottom: '30px',
        lineHeight: '1.6'
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
        fontSize: '0.9rem',
        fontWeight: 'bold',
        userSelect: 'none'
    },
    errorDetails: {
        background: '#fff3cd',
        border: '1px solid #ffc107',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '0.75rem',
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
        background: '#1a1a1a',
        color: 'white',
        border: 'none',
        padding: '15px 30px',
        borderRadius: '30px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    buttonSecondary: {
        background: 'transparent',
        color: '#1a1a1a',
        border: '2px solid #1a1a1a',
        padding: '15px 30px',
        borderRadius: '30px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default ErrorBoundary;
