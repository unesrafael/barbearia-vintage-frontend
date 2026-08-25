import { useId } from 'react';

export function Field({ label, error, hint, children }) {
  const id = useId();
  const child = typeof children === 'function' ? children(id, Boolean(error)) : children;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {child}
      {error ? (
        <span className="error">{error}</span>
      ) : (
        hint && <span className="hint">{hint}</span>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, ...props }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id, invalid) => <input id={id} aria-invalid={invalid} {...props} />}
    </Field>
  );
}

export function SelectField({ label, error, hint, children, ...props }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id, invalid) => (
        <select id={id} aria-invalid={invalid} {...props}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function TextAreaField({ label, error, hint, ...props }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id, invalid) => <textarea id={id} aria-invalid={invalid} {...props} />}
    </Field>
  );
}
