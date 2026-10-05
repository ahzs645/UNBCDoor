import React from 'react'

// A row of mutually exclusive options. Each segment is a <label> over a visually hidden radio,
// so arrow keys move between options and the group submits like any radio set.
export const SegmentedControl = ({
  name,
  options,
  value,
  onChange,
  className = '',
  ...groupProps
}) => (
  <div className={`segmented ${className}`.trim()} role="radiogroup" {...groupProps}>
    {options.map((option) => (
      <label
        key={option.value}
        className={`segmented__option ${value === option.value ? 'active' : ''}`}
      >
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
        />
        {option.label}
      </label>
    ))}
  </div>
)
