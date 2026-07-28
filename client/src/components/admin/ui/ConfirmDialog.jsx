import AdminModal from './AdminModal';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <AdminModal
      open={open}
      onClose={loading ? () => {} : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button className="adm-btn adm-btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className={`adm-btn ${tone === 'danger' ? 'adm-btn-danger' : 'adm-btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && <span className="adm-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="adm-confirm-msg">{message}</p>
    </AdminModal>
  );
}
