import React from 'react'

// On/off switch drawn over a real checkbox, so it keeps native keyboard and form behaviour.
export const Switch = ({ id, name, checked, onChange, children, className = '', ...inputProps }) => (
  <label className={`switch ${className}`.trim()}>
    <input
      type="checkbox"
      id={id}
      name={name}
      checked={checked}
      onChange={onChange}
      {...inputProps}
    />
    <span className="switch__track" aria-hidden="true" />
    {children && <span className="switch__text">{children}</span>}
  </label>
)
