import React from 'react'

// Style options are stored with each sign so JSON imports retain their exact appearance.
const OptionControl = ({ label, name, value, onChange, options }) => (
  <div className="style-control">
    <span className="style-control__label">{label}</span>
    <div className="style-options">
      {options.map(option => (
        <label key={option.value} className={`style-option ${value === option.value ? 'active' : ''}`}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(event) => onChange(event.target.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  </div>
)

export const SignStyleControls = ({
  headlineWeight,
  onHeadlineWeightChange,
  roomNameStyle,
  onRoomNameStyleChange,
  positionLayout,
  onPositionLayoutChange,
  positionSize,
  onPositionSizeChange,
  designationLayout,
  onDesignationLayoutChange,
  twoPersonSpacing,
  onTwoPersonSpacingChange,
  contentSize,
  onContentSizeChange,
  contentSpacing,
  onContentSpacingChange,
  contentWidth,
  onContentWidthChange,
  textAlignment,
  onTextAlignmentChange,
  contactLayout,
  onContactLayoutChange,
  contactSize,
  onContactSizeChange,
  bodyTextMode,
  onBodyTextModeChange,
  roomContactGrouping,
  onRoomContactGroupingChange,
  organizationLogo,
  onOrganizationLogoChange,
  hasSecondOccupant,
  hasDesignations,
  isRoomType
}) => (
  <div className="sign-style-section">
    <OptionControl
      label="Headline Weight"
      name="headlineWeight"
      value={headlineWeight}
      onChange={onHeadlineWeightChange}
      options={[
        { value: 'regular', label: 'Regular' },
        { value: 'bold', label: 'Bold' },
        { value: 'black', label: 'Black' }
      ]}
    />
    <OptionControl
      label="Content Size"
      name="contentSize"
      value={contentSize}
      onChange={onContentSizeChange}
      options={[
        { value: 'standard', label: 'Standard' },
        { value: 'large', label: 'Larger' },
        { value: 'largest', label: 'Largest' }
      ]}
    />
    <OptionControl
      label="Vertical Spacing"
      name="contentSpacing"
      value={contentSpacing}
      onChange={onContentSpacingChange}
      options={[{ value: 'standard', label: 'Standard' }, { value: 'compact', label: 'Compact' }]}
    />
    <OptionControl
      label="Content Width"
      name="contentWidth"
      value={contentWidth}
      onChange={onContentWidthChange}
      options={[{ value: 'standard', label: 'Standard' }, { value: 'wide', label: 'Wide' }]}
    />
    <OptionControl
      label="Text Alignment"
      name="textAlignment"
      value={textAlignment}
      onChange={onTextAlignmentChange}
      options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centered' }]}
    />
    <OptionControl
      label="Contact Layout"
      name="contactLayout"
      value={contactLayout}
      onChange={onContactLayoutChange}
      options={[{ value: 'stacked', label: 'Stacked' }, { value: 'inline', label: 'One line' }]}
    />
    <OptionControl
      label="Contact Size"
      name="contactSize"
      value={contactSize}
      onChange={onContactSizeChange}
      options={[{ value: 'standard', label: 'Standard' }, { value: 'large', label: 'Larger' }]}
    />

    {!isRoomType && (
      <>
        <OptionControl
          label="Body Text Sizing"
          name="bodyTextMode"
          value={bodyTextMode}
          onChange={onBodyTextModeChange}
          options={[{ value: 'hierarchy', label: 'Hierarchy' }, { value: 'uniform', label: 'Uniform' }]}
        />
        <OptionControl
          label="Position Layout"
          name="positionLayout"
          value={positionLayout}
          onChange={onPositionLayoutChange}
          options={[{ value: 'stacked', label: 'Stacked' }, { value: 'inline', label: 'Inline / pipe' }]}
        />
        <OptionControl
          label="Position Size"
          name="positionSize"
          value={positionSize}
          onChange={onPositionSizeChange}
          options={[{ value: 'standard', label: 'Standard' }, { value: 'large', label: 'Larger' }]}
        />
      </>
    )}

    {!isRoomType && hasDesignations && (
      <OptionControl
        label="Designation Placement"
        name="designationLayout"
        value={designationLayout}
        onChange={onDesignationLayoutChange}
        options={[{ value: 'inline', label: 'Beside name' }, { value: 'below', label: 'Below name' }]}
      />
    )}

    {!isRoomType && hasSecondOccupant && (
      <OptionControl
        label="Two-person Spacing"
        name="twoPersonSpacing"
        value={twoPersonSpacing}
        onChange={onTwoPersonSpacingChange}
        options={[{ value: 'compact', label: 'Compact' }, { value: 'relaxed', label: 'Relaxed' }]}
      />
    )}

    {isRoomType && hasSecondOccupant && (
      <OptionControl
        label="Multiple-contact Grouping"
        name="roomContactGrouping"
        value={roomContactGrouping}
        onChange={onRoomContactGroupingChange}
        options={[{ value: 'by-person', label: 'By person' }, { value: 'by-field', label: 'Emails, then phones' }]}
      />
    )}

    {isRoomType && (
      <>
        <OptionControl
          label="Room Name Style"
          name="roomNameStyle"
          value={roomNameStyle}
          onChange={onRoomNameStyleChange}
          options={[{ value: 'standard', label: 'Bold' }, { value: 'italic', label: 'Italic' }]}
        />
        <OptionControl
          label="Organization Logo"
          name="organizationLogo"
          value={organizationLogo}
          onChange={onOrganizationLogoChange}
          options={[{ value: 'none', label: 'None' }, { value: 'ctaan', label: 'CTAAN' }]}
        />
      </>
    )}
  </div>
)
