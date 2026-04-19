import React, { useState } from 'react';

export default function Input({ label, type = 'text', id, className = '', ...props }) {
  const [focused, setFocused] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasValue = props.value !== undefined ? props.value !== '' : false;
  
  const floating = focused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        id={inputId}
        onFocus={(e) => {
          setFocused(true);
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          if (props.onBlur) props.onBlur(e);
        }}
        className="block w-full px-4 pb-2.5 pt-5 text-sm text-[var(--text-primary)] bg-surface-2 border border-[var(--border)] rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-[var(--brand)] transition-colors peer"
        placeholder=" "
        {...props}
      />
      {label && (
        <label
          htmlFor={inputId}
          className={`absolute text-sm duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-focus:text-[var(--brand)]
            ${floating ? 'text-[var(--text-secondary)] -translate-y-4 scale-75' : 'text-[var(--text-muted)] translate-y-0 scale-100 peer-focus:-translate-y-4 peer-focus:scale-75'}`}
        >
          {label}
        </label>
      )}
    </div>
  );
}
