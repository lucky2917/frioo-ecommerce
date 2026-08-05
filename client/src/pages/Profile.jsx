import React, { useState, useEffect, useRef } from 'react';
import { useCommitFeedback } from '../hooks/useCommitFeedback';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabaseClient';
import { notify } from '../lib/feedbackStore';
import { logger } from '../utils/logger';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ProfileCreditsCard from '../components/profile/ProfileCreditsCard';

const getInitials = (name, email) => {
  const source = (name || '').trim();
  if (source) {
    const parts = source.split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
};

const autoGrow = (el) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

const ProfileSkeleton = () => (
  <div className="fr-pf-skel" aria-hidden="true">
    <div className="fr-pf-skel-head">
      <div className="fr-pf-skel-avatar" />
      <div className="fr-pf-skel-lines">
        <div className="fr-pf-skel-line fr-pf-skel-lg" />
        <div className="fr-pf-skel-line fr-pf-skel-sm" />
      </div>
    </div>
    <div className="fr-pf-skel-card">
      <div className="fr-pf-skel-line" />
      <div className="fr-pf-skel-line fr-pf-skel-short" />
      <div className="fr-pf-skel-line" />
    </div>
  </div>
);

export default function Profile() {
  const { profile, user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const { committed, commit } = useCommitFeedback();

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    address: profile?.address || ''
  });

  const nameRef = useRef(null);
  const addressRef = useRef(null);
  const editButtonRef = useRef(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (editing) {
      nameRef.current?.focus();
      autoGrow(addressRef.current);
    } else if (wasEditing.current) {
      editButtonRef.current?.focus();
    }
    wasEditing.current = editing;
  }, [editing]);

  const handleUpdate = async () => {
    if (!user?.id) {
      notify.error('Please login to update profile');
      return;
    }

    setLoading(true);
    setSaveError(null);
    try {
      const updates = {
        id: user.id,
        full_name: form.full_name,
        phone_number: form.phone_number,
        address: form.address,
        updated_at: new Date(),
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      commit();
      setEditing(false);
    } catch (error) {
      setSaveError('We could not save your changes. Check your connection and try again.');
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      address: profile?.address || ''
    });
    setEditing(false);
  };

  const renderBody = () => {
    if (authLoading) return <ProfileSkeleton />;

    if (!user) {
      return (
        <div className="fr-pf-state">
          <div className="fr-pf-state-avatar" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <h1 className="fr-pf-state-title">Sign in to manage your profile</h1>
          <p className="fr-pf-state-text">Your account details and delivery address live here.</p>
          <button className="fr-pf-primary" onClick={signInWithGoogle}>Sign in</button>
        </div>
      );
    }

    const fullName = profile?.full_name;
    const email = user?.email || profile?.email;
    const displayName = fullName?.split(' ')[0] || 'there';

    return (
      <>
        <header className="fr-pf-header">
          <div className="fr-pf-avatar">
            {profile?.avatar_url ? (
              <img loading="lazy" decoding="async" src={profile.avatar_url} alt={fullName ? `${fullName}'s avatar` : 'Your avatar'} className="fr-pf-avatar-img" />
            ) : (
              <span className="fr-pf-avatar-initials" role="img" aria-label={fullName || email || 'Account'}>
                {getInitials(fullName, email)}
              </span>
            )}
          </div>
          <div className="fr-pf-identity">
            <h1 className="fr-pf-hello">Hello, {displayName}</h1>
            {email && <p className="fr-pf-email">{email}</p>}
          </div>
        </header>

        <section className="fr-pf-card" aria-label="Account details">
          <div className="fr-pf-card-head">
            <h2 className="fr-pf-card-title">Account details</h2>
            {!editing && (
              <button className="fr-pf-edit" onClick={() => setEditing(true)} ref={editButtonRef}>
                Edit profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="fr-pf-form">
              <div className="fr-pf-field">
                <label htmlFor="pf-name">Full name</label>
                <input
                  id="pf-name"
                  ref={nameRef}
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="fr-pf-input"
                  autoComplete="name"
                />
              </div>

              <div className="fr-pf-field">
                <label htmlFor="pf-phone">Phone</label>
                <input
                  id="pf-phone"
                  type="tel"
                  value={form.phone_number}
                  onChange={e => setForm({ ...form, phone_number: e.target.value })}
                  className="fr-pf-input"
                  autoComplete="tel"
                />
              </div>

              <div className="fr-pf-field">
                <label htmlFor="pf-address">Address</label>
                <textarea
                  id="pf-address"
                  ref={addressRef}
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  onInput={e => autoGrow(e.target)}
                  className="fr-pf-input fr-pf-textarea"
                  rows={2}
                  autoComplete="street-address"
                />
              </div>

              {saveError && <p className="fr-pf-save-error" role="alert">{saveError}</p>}

              <div className="fr-pf-actions">
                <button onClick={handleUpdate} disabled={loading} aria-busy={loading} className={`fr-pf-primary${committed ? ' fr-pf-primary-done' : ''}`}>
                  {loading && <span className="fr-pf-spin" aria-hidden="true" />}
                  {committed && !loading && (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  )}
                  {loading ? 'Saving' : committed ? 'Saved' : 'Save changes'}
                </button>
                <button onClick={handleCancel} disabled={loading} className="fr-pf-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <dl className="fr-pf-readout">
              <div className="fr-pf-row">
                <dt>Full name</dt>
                <dd>{fullName || <span className="fr-pf-empty">Not added yet</span>}</dd>
              </div>
              <div className="fr-pf-row">
                <dt>Email</dt>
                <dd>{email || <span className="fr-pf-empty">Not available</span>} <span className="fr-pf-readonly">Read-only</span></dd>
              </div>
              <div className="fr-pf-row">
                <dt>Phone</dt>
                <dd>{profile?.phone_number || <span className="fr-pf-empty">Not added yet</span>}</dd>
              </div>
              <div className="fr-pf-row">
                <dt>Address</dt>
                <dd>{profile?.address || <span className="fr-pf-empty">Not added yet</span>}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="fr-pf-actions-card" aria-label="Quick actions">
          <Link to="/orders" className="fr-pf-action-link">
            <span>Your orders</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <button className="fr-pf-action-link fr-pf-signout" onClick={signOut}>
            <span>Sign out</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </section>
      </>
    );
  };

  return (
    <div className="fr-pf-page">
      <SEO title="My Account" description="Manage your Frioo account details and delivery address." />

      <div className="fr-pf-container">
        {user && <ProfileCreditsCard />}
        {renderBody()}
      </div>

      <style>{`
        .fr-pf-page {
          background: var(--fr-canvas);
          min-height: 100vh;
          padding-bottom: var(--fr-s10);
        }

        .fr-pf-container {
          max-width: 640px;
          margin: 0 auto;
          padding: calc(var(--navbar-height-mobile) + var(--fr-s6)) var(--fr-s4) var(--fr-s6);
        }

        @media (min-width: 900px) {
          .fr-pf-container { padding-top: calc(var(--navbar-height-desktop) + var(--fr-s7)); }
        }

        .fr-pf-header {
          display: flex;
          align-items: center;
          gap: var(--fr-s4);
          margin-bottom: var(--fr-s7);
        }

        .fr-pf-avatar {
          width: 72px;
          height: 72px;
          flex-shrink: 0;
          border-radius: 50%;
          overflow: hidden;
          background: var(--fr-brand-tint);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fr-pf-avatar-img { width: 100%; height: 100%; object-fit: cover; }

        .fr-pf-avatar-initials {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          color: var(--fr-brand);
        }

        .fr-pf-identity { min-width: 0; }

        .fr-pf-hello {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-headline);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-tight);
          letter-spacing: var(--fr-track-headline);
          color: var(--fr-text);
          margin: 0 0 2px;
        }

        .fr-pf-email {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text-2);
          margin: 0;
          overflow-wrap: anywhere;
        }

        .fr-pf-card {
          background: var(--fr-surface);
          border: 1px solid var(--fr-line);
          border-radius: var(--fr-r-surface);
          box-shadow: var(--fr-elev-1);
          padding: var(--fr-s5);
          margin-bottom: var(--fr-s5);
        }

        .fr-pf-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--fr-s4);
          margin-bottom: var(--fr-s4);
        }

        .fr-pf-card-title {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          letter-spacing: var(--fr-track-headline);
          line-height: var(--fr-lh-snug);
          color: var(--fr-text);
          margin: 0;
        }

        .fr-pf-edit {
          background: var(--fr-surface);
          border: 1px solid var(--fr-line-strong);
          color: var(--fr-brand);
          padding: var(--fr-s2) var(--fr-s4);
          border-radius: var(--fr-r-control);
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          cursor: pointer;
          transition: background var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-pf-edit:hover { background: var(--fr-brand-tint); border-color: var(--fr-brand); }

        .fr-pf-readout { margin: 0; }

        .fr-pf-row {
          display: flex;
          justify-content: space-between;
          gap: var(--fr-s4);
          padding: var(--fr-s3) 0;
          border-bottom: 1px solid var(--fr-line);
        }

        .fr-pf-row:last-child { border-bottom: none; }

        .fr-pf-row dt {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text-2);
          flex-shrink: 0;
        }

        .fr-pf-row dd {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text);
          margin: 0;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .fr-pf-empty { color: var(--fr-text-3); }

        .fr-pf-readonly {
          display: inline-block;
          margin-left: var(--fr-s2);
          font-size: var(--fr-fs-label);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-snug);
          text-transform: uppercase;
          color: var(--fr-text-3);
          border: 1px solid var(--fr-line);
          border-radius: var(--fr-r-pill);
          padding: 1px var(--fr-s2);
          vertical-align: middle;
        }

        .fr-pf-form { display: flex; flex-direction: column; gap: var(--fr-s4); }

        .fr-pf-field { display: flex; flex-direction: column; gap: var(--fr-s2); }

        .fr-pf-field label {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text-2);
        }

        .fr-pf-input {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-control);
          color: var(--fr-text);
          background: var(--fr-surface);
          border: 1px solid var(--fr-line-strong);
          border-radius: var(--fr-r-control);
          padding: var(--fr-s3);
          width: 100%;
          box-sizing: border-box;
          transition: border-color var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-pf-input:focus {
          outline: none;
          border-color: var(--fr-brand);
          box-shadow: 0 0 0 3px var(--fr-brand-tint);
        }

        .fr-pf-textarea { resize: vertical; min-height: 2.75rem; line-height: var(--fr-lh-normal); overflow: hidden; }

        .fr-pf-actions { display: flex; align-items: center; gap: var(--fr-s3); margin-top: var(--fr-s2); }

        .fr-pf-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--fr-s2);
          background: var(--fr-brand);
          color: var(--fr-on-brand);
          border: none;
          padding: var(--fr-s3) var(--fr-s6);
          border-radius: var(--fr-r-control);
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          cursor: pointer;
          transition: background var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-pf-primary { display: inline-flex; align-items: center; justify-content: center; gap: var(--fr-s2); }
        .fr-pf-primary:hover { background: var(--fr-brand-press); }
        .fr-pf-primary-done { background: var(--fr-success); }
        .fr-pf-save-error { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-danger); margin: 0 0 var(--fr-s3); }
        .fr-pf-primary:disabled { opacity: 0.7; cursor: default; }

        .fr-pf-secondary {
          background: none;
          border: none;
          color: var(--fr-text-2);
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          cursor: pointer;
          padding: var(--fr-s3);
        }

        .fr-pf-secondary:hover { color: var(--fr-text); }

        .fr-pf-spin {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: var(--fr-on-brand);
          border-radius: 50%;
        }

        @media (prefers-reduced-motion: no-preference) {
          .fr-pf-spin { animation: fr-pf-spin 0.7s linear infinite; }
        }

        @keyframes fr-pf-spin { to { transform: rotate(360deg); } }

        .fr-pf-actions-card {
          background: var(--fr-surface);
          border: 1px solid var(--fr-line);
          border-radius: var(--fr-r-surface);
          box-shadow: var(--fr-elev-1);
          overflow: hidden;
        }

        .fr-pf-action-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: var(--fr-s4) var(--fr-s5);
          background: var(--fr-surface);
          border: none;
          border-bottom: 1px solid var(--fr-line);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-control);
          color: var(--fr-text);
          text-decoration: none;
          cursor: pointer;
          transition: background var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-pf-action-link:last-child { border-bottom: none; }
        .fr-pf-action-link:hover { background: var(--fr-surface-2); }
        .fr-pf-action-link svg { color: var(--fr-text-3); }
        .fr-pf-signout { color: var(--fr-danger); }
        .fr-pf-signout svg { color: var(--fr-danger); }

        .fr-pf-state {
          text-align: center;
          padding: var(--fr-s9) var(--fr-s4);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .fr-pf-state-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--fr-brand-tint);
          color: var(--fr-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--fr-s5);
        }

        .fr-pf-state-title {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          letter-spacing: var(--fr-track-headline);
          line-height: var(--fr-lh-snug);
          color: var(--fr-text);
          margin: 0 0 var(--fr-s2);
        }

        .fr-pf-state-text {
          font-family: var(--fr-font-sans);
          color: var(--fr-text-2);
          margin: 0 0 var(--fr-s6);
          max-width: 320px;
        }

        .fr-pf-skel { display: flex; flex-direction: column; gap: var(--fr-s7); }

        .fr-pf-skel-head { display: flex; align-items: center; gap: var(--fr-s4); }

        .fr-pf-skel-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--fr-surface-2);
          flex-shrink: 0;
        }

        .fr-pf-skel-lines { flex: 1; display: flex; flex-direction: column; gap: var(--fr-s3); }

        .fr-pf-skel-card {
          background: var(--fr-surface);
          border: 1px solid var(--fr-line);
          border-radius: var(--fr-r-surface);
          padding: var(--fr-s5);
          display: flex;
          flex-direction: column;
          gap: var(--fr-s4);
        }

        .fr-pf-skel-line {
          height: 14px;
          background: var(--fr-surface-2);
          border-radius: var(--fr-r-control);
        }

        .fr-pf-skel-lg { width: 60%; height: 20px; }
        .fr-pf-skel-sm { width: 45%; }
        .fr-pf-skel-short { width: 70%; }

        @media (prefers-reduced-motion: no-preference) {
          .fr-pf-skel-line, .fr-pf-skel-avatar { animation: fr-pf-shimmer 1.4s var(--fr-ease-standard) infinite; }
        }

        @keyframes fr-pf-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

        @media (max-width: 560px) {

          .fr-pf-row { flex-direction: column; gap: var(--fr-s1); }
          .fr-pf-row dd { text-align: left; }
        }
      `}</style>
    </div>
  );
}
