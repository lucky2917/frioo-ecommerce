const STYLE_ID = 'admin-ui-styles';

const CSS = `
.adm-page { font-family: var(--fr-font-sans); color: var(--adm-text); padding-bottom: var(--fr-s9); }

.adm-page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--fr-s4);
  margin-bottom: var(--fr-s5);
  flex-wrap: wrap;
}

.adm-page-title {
  font-family: var(--fr-font-sans);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--adm-text);
  margin: 0 0 2px;
  letter-spacing: -0.01em;
}

.adm-page-subtitle { font-size: 0.9rem; color: var(--adm-text-2); margin: 0; }
.adm-page-actions { display: flex; gap: var(--fr-s2); flex-shrink: 0; }

.adm-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: var(--fr-s4);
  margin-bottom: var(--fr-s5);
}

.adm-metric {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--fr-r-card);
  padding: var(--fr-s4) var(--fr-s5);
}

.adm-metric-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--fr-s2); }
.adm-metric-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--adm-text-3); }
.adm-metric-icon { color: var(--adm-text-3); display: flex; line-height: 0; }
.adm-metric-value { font-size: 1.6rem; font-weight: 700; color: var(--adm-text); letter-spacing: -0.01em; }
.adm-metric-sub { font-size: 0.78rem; color: var(--adm-text-3); margin-top: 2px; }
.adm-metric--brand { border-top: 2px solid var(--fr-brand); }
.adm-metric--warm .adm-metric-value { color: var(--fr-warm); }
.adm-metric--info .adm-metric-value { color: var(--fr-info); }
.adm-metric--success .adm-metric-value { color: var(--fr-success); }

.adm-toolbar { display: flex; gap: var(--fr-s3); flex-wrap: wrap; align-items: center; margin-bottom: var(--fr-s4); }

.adm-card {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--fr-r-surface);
  padding: var(--fr-s5);
}

.adm-search { position: relative; flex: 1; min-width: 200px; }
.adm-search .adm-input { padding-left: var(--fr-s7); }
.adm-search-icon { position: absolute; left: var(--fr-s3); top: 50%; transform: translateY(-50%); color: var(--adm-text-3); pointer-events: none; line-height: 0; }

.adm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--fr-s2);
  font-family: var(--fr-font-sans);
  font-weight: 600;
  font-size: 0.875rem;
  padding: var(--fr-s2) var(--fr-s4);
  border-radius: var(--fr-r-control);
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard);
}

.adm-btn:disabled { opacity: 0.6; cursor: default; }
.adm-btn-sm { padding: var(--fr-s1) var(--fr-s3); font-size: 0.8rem; }
.adm-btn-primary { background: var(--fr-brand); color: var(--fr-on-brand); }
.adm-btn-primary:hover:not(:disabled) { background: var(--fr-brand-press); }
.adm-btn-secondary { background: var(--adm-surface); border-color: var(--adm-border-strong); color: var(--adm-text); }
.adm-btn-secondary:hover:not(:disabled) { background: var(--adm-surface-2); }
.adm-btn-danger { background: var(--fr-danger); color: #fff; }
.adm-btn-danger:hover:not(:disabled) { background: #972f25; }
.adm-btn-ghost { background: none; color: var(--adm-text-2); }
.adm-btn-ghost:hover:not(:disabled) { background: var(--adm-surface-2); color: var(--adm-text); }

.adm-btn:focus-visible,
.adm-input:focus-visible,
.adm-select:focus-visible,
.adm-icon-btn:focus-visible {
  outline: 2px solid var(--fr-brand);
  outline-offset: 2px;
}

.adm-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--fr-r-control);
  color: var(--adm-text-2);
  cursor: pointer;
  padding: var(--fr-s2);
  line-height: 0;
  transition: background var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard);
}

.adm-icon-btn:hover { background: var(--adm-surface-2); color: var(--adm-text); }
.adm-icon-btn--danger:hover { background: var(--fr-warm-tint); color: var(--fr-danger); }

.adm-field { display: flex; flex-direction: column; gap: var(--fr-s2); }
.adm-label { font-size: 0.8rem; font-weight: 600; color: var(--adm-text-2); }

.adm-input, .adm-select, .adm-textarea {
  font-family: var(--fr-font-sans);
  font-size: 0.9rem;
  color: var(--adm-text);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border-strong);
  border-radius: var(--fr-r-control);
  padding: var(--fr-s2) var(--fr-s3);
  width: 100%;
  box-sizing: border-box;
  transition: border-color var(--fr-dur-quick) var(--fr-ease-standard);
}

.adm-textarea { resize: vertical; min-height: 3rem; line-height: 1.4; }

.adm-input:focus, .adm-select:focus, .adm-textarea:focus {
  outline: none;
  border-color: var(--fr-brand);
  box-shadow: 0 0 0 3px var(--fr-brand-tint);
}

.adm-table-wrap {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--fr-r-surface);
  overflow-x: auto;
}

.adm-table { width: 100%; border-collapse: collapse; font-family: var(--fr-font-sans); }

.adm-table th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--adm-text-3);
  padding: var(--fr-s3) var(--fr-s4);
  border-bottom: 1px solid var(--adm-border);
  white-space: nowrap;
  background: var(--adm-surface);
}

.adm-table td {
  padding: var(--fr-s3) var(--fr-s4);
  border-bottom: 1px solid var(--adm-surface-2);
  font-size: 0.875rem;
  color: var(--adm-text);
  vertical-align: middle;
}

.adm-table tbody tr:last-child td { border-bottom: none; }
.adm-table tbody tr:hover { background: var(--adm-surface-2); }
.adm-mono { font-family: var(--fr-font-mono); font-size: 0.8rem; color: var(--adm-text-2); }
.adm-table-empty { padding: var(--fr-s8); text-align: center; color: var(--adm-text-3); font-size: 0.9rem; }

.adm-chip {
  display: inline-block;
  padding: var(--fr-s1) var(--fr-s3);
  border-radius: var(--fr-r-pill);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.adm-chip--info { background: #E3EDF3; color: var(--fr-info); }
.adm-chip--brand { background: var(--fr-brand-tint); color: var(--fr-brand); }
.adm-chip--success { background: var(--fr-brand-tint); color: var(--fr-success); }
.adm-chip--danger { background: var(--fr-warm-tint); color: var(--fr-danger); }

.adm-overlay {
  position: fixed;
  inset: 0;
  background: var(--fr-scrim);
  z-index: var(--fr-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--fr-s5);
}

.adm-dialog {
  background: var(--adm-surface);
  width: 100%;
  border-radius: var(--fr-r-surface);
  box-shadow: var(--fr-elev-3);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.adm-dialog--sm { max-width: 420px; }
.adm-dialog--md { max-width: 560px; }
.adm-dialog--lg { max-width: 780px; }

@media (prefers-reduced-motion: no-preference) {
  .adm-dialog { animation: adm-rise var(--fr-dur-base) var(--fr-ease-settle); }
}

@keyframes adm-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.adm-dialog-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--fr-s4);
  padding: var(--fr-s5);
  border-bottom: 1px solid var(--adm-border);
}

.adm-dialog-title { font-size: 1.1rem; font-weight: 700; color: var(--adm-text); margin: 0; }
.adm-dialog-body { padding: var(--fr-s5); overflow-y: auto; }
.adm-dialog-foot { display: flex; justify-content: flex-end; gap: var(--fr-s3); padding: var(--fr-s4) var(--fr-s5); border-top: 1px solid var(--adm-border); }
.adm-confirm-msg { margin: 0; color: var(--adm-text-2); font-size: 0.95rem; line-height: 1.5; }

.adm-spin {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .adm-spin { animation: adm-spin 0.7s linear infinite; }
}

@keyframes adm-spin { to { transform: rotate(360deg); } }

.adm-skel-line { height: 14px; background: var(--adm-surface-2); border-radius: var(--fr-r-control); }

@media (prefers-reduced-motion: no-preference) {
  .adm-skel-line { animation: adm-shimmer 1.4s var(--fr-ease-standard) infinite; }
}

@keyframes adm-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

.adm-state { text-align: center; padding: var(--fr-s8) var(--fr-s5); }
.adm-state-title { font-size: 1.05rem; font-weight: 700; color: var(--adm-text); margin: 0 0 var(--fr-s2); }
.adm-state-text { font-size: 0.9rem; color: var(--adm-text-2); margin: 0 0 var(--fr-s4); }
`;

if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
