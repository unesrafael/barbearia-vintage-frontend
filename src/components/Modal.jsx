import { useEffect, useRef } from 'react';

export function Modal({ title, onClose, children, maxWidth }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    boxRef.current?.querySelector('input, select, textarea, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={boxRef}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/** Confirmação que diz exatamente o que sera removido. */
export function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose, busy }) {
  return (
    <Modal title={title} onClose={onClose} maxWidth="440px">
      <p style={{ color: 'var(--muted)' }}>{message}</p>
      <div className="form-actions" style={{ marginTop: 22 }}>
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Removendo...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
