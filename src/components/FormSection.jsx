import React, { useId } from 'react'

// One titled card in the editor column. `action` sits at the right of the header (typically a
// switch that turns the whole section on); `children` is omitted while that switch is off.
export const FormSection = ({ title, description, action, children, className = '' }) => {
  const titleId = useId()

  return (
    <section className={`form-section ${className}`.trim()} aria-labelledby={titleId}>
      <header className="form-section__header">
        <div className="form-section__heading">
          <h2 className="form-section__title" id={titleId}>{title}</h2>
          {description && <p className="form-section__description">{description}</p>}
        </div>
        {action && <div className="form-section__action">{action}</div>}
      </header>
      {children && <div className="form-section__body">{children}</div>}
    </section>
  )
}
