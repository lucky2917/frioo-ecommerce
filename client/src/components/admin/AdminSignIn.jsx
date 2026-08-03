import { useState } from 'react';
import { useAuth } from '../../context/auth-context';

export default function AdminSignIn({ reason }) {
  const { signInWithGoogle, signOut, user } = useAuth();
  const [busy, setBusy] = useState(false);

  const notAuthorized = reason === 'not-admin';

  const handleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    await signInWithGoogle('/admin');
    setBusy(false);
  };

  return (
    <div className="adm-gate">
      <div className="adm-gate-card">
        <div className="adm-gate-mark" aria-hidden="true">F</div>
        <p className="adm-gate-eyebrow">Frioo Admin</p>

        {notAuthorized ? (
          <>
            <h1 className="adm-gate-title">This account cannot open the panel</h1>
            <p className="adm-gate-text">
              {user?.email ? `${user.email} is not an admin account.` : 'This account is not an admin account.'}
              {' '}Sign in with an admin account to continue.
            </p>
            <button type="button" className="adm-gate-btn" onClick={signOut}>Sign in with a different account</button>
          </>
        ) : (
          <>
            <h1 className="adm-gate-title">Sign in to continue</h1>
            <p className="adm-gate-text">Use the Google account registered as a Frioo admin.</p>
            <button type="button" className="adm-gate-btn" onClick={handleSignIn} disabled={busy} aria-busy={busy}>
              {busy ? 'Opening Google…' : 'Continue with Google'}
            </button>
          </>
        )}

        <a className="adm-gate-link" href="https://frioo.in">Go to the Frioo storefront</a>
      </div>

      <style>{`
        .adm-gate { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; padding-bottom: max(24px, env(safe-area-inset-bottom)); background: var(--adm-canvas, #F4F6F5); font-family: var(--fr-font-sans); }
        .adm-gate-card { width: 100%; max-width: 380px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding: 40px 28px; background: var(--adm-surface, #fff); border: 1px solid var(--adm-line, #e2e8e5); border-radius: 16px; }
        .adm-gate-mark { width: 56px; height: 56px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #16211B; color: #A8D5B5; font-family: var(--fr-font-display); font-size: 1.6rem; font-weight: 700; margin-bottom: 6px; }
        .adm-gate-eyebrow { font-family: var(--fr-font-mono); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--adm-text-2, #55635c); margin: 0; }
        .adm-gate-title { font-family: var(--fr-font-display); font-size: 1.375rem; font-weight: 700; line-height: 1.25; color: var(--adm-text, #16211b); margin: 0; }
        .adm-gate-text { font-size: 0.875rem; font-weight: 500; line-height: 1.55; color: var(--adm-text-2, #55635c); margin: 0 0 10px; }
        .adm-gate-btn { width: 100%; min-height: 48px; padding: 0 20px; background: #1B4D3E; color: #fff; border: none; border-radius: 6px; font-family: inherit; font-size: 0.9375rem; font-weight: 700; cursor: pointer; transition: background 180ms cubic-bezier(0.2,0,0,1); }
        .adm-gate-btn:hover:not(:disabled) { background: #123A2E; }
        .adm-gate-btn:disabled { opacity: 0.7; cursor: default; }
        .adm-gate-btn:focus-visible { outline: 2px solid #1B4D3E; outline-offset: 3px; }
        .adm-gate-link { margin-top: 6px; font-size: 0.8125rem; font-weight: 600; color: var(--adm-text-2, #55635c); text-decoration: none; }
        .adm-gate-link:hover { color: #1B4D3E; text-decoration: underline; }
        .adm-gate-link:focus-visible { outline: 2px solid #1B4D3E; outline-offset: 3px; border-radius: 4px; }
        @media (prefers-reduced-motion: reduce) { .adm-gate-btn { transition: none; } }
      `}</style>
    </div>
  );
}
