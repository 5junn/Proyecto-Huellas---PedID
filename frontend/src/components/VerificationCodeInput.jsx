export default function VerificationCodeInput({ id = 'codigo', value, onChange, disabled }) {
  const currentSlot = Math.min(value.length, 5);

  return (
    <div className="form-group">
      <label htmlFor={id}>Código de seis dígitos</label>
      <div className="auth-code-field">
        <div className="auth-code-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className={`auth-code-cell${index === currentSlot ? ' current' : ''}`}>
              {value[index]}
            </span>
          ))}
        </div>
        <input
          id={id}
          name="codigo"
          className="auth-code-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
}
