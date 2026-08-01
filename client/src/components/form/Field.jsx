import { useId } from 'react';

export default function Field({ label, hint, error, required, children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="fr-field">
      <label className="fr-field-label" htmlFor={id}>
        {label}
        {required && <span className="fr-field-required" aria-hidden="true"> *</span>}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {hint && !error && <p className="fr-field-hint" id={hintId}>{hint}</p>}

      {error && (
        <p className="fr-field-error" id={errorId}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12" y2="16.5" /></svg>
          {error}
        </p>
      )}

      <style>{`
        .fr-field { display: flex; flex-direction: column; gap: var(--fr-s2); }
        .fr-field-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); color: var(--fr-text); }
        .fr-field-required { color: var(--fr-danger); }
        .fr-field-hint { margin: 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }
        .fr-field-error { display: flex; align-items: flex-start; gap: var(--fr-s2); margin: 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-danger); }
        .fr-field-error svg { flex-shrink: 0; margin-top: 3px; }
        .fr-field [aria-invalid="true"] { border-color: var(--fr-danger); }
        .fr-field [aria-invalid="true"]:focus { border-color: var(--fr-danger); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fr-danger) 16%, transparent); }
      `}</style>
    </div>
  );
}
