import { useEffect, useRef, useState } from 'react';
import { STATUS, STATUS_KEYS } from '../lib/format.js';

/** Pilula de status que vira menu ao ser clicada — um clique troca o status. */
export function StatusPill({ status, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const badge = <span className={`pill pill-${status}`}>{STATUS[status].label}</span>;

  if (disabled || !onChange) return badge;

  return (
    <div className="status-menu" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status: ${STATUS[status].label}. Clique para alterar.`}
      >
        {badge}
      </button>

      {open && (
        <div className="status-list" role="menu">
          {STATUS_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              aria-current={key === status}
              onClick={() => {
                setOpen(false);
                if (key !== status) onChange(key);
              }}
            >
              <span className="dot" style={{ background: STATUS[key].color }} />
              {STATUS[key].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
