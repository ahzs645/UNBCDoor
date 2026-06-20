import React from 'react'

// Style options that affect the artwork rendering: the headline weight (Bold / Black) and,
// for room-type signs, whether the room name renders bold or italic.
export const SignStyleControls = ({
  headlineWeight,
  onHeadlineWeightChange,
  roomNameStyle,
  onRoomNameStyleChange,
  isRoomType
}) => (
  <div className="sign-style-section">
    <div className="style-control">
      <span className="style-control__label">Headline Weight</span>
      <div className="style-options">
        <label className={`style-option ${headlineWeight === 'bold' ? 'active' : ''}`}>
          <input
            type="radio"
            name="headlineWeight"
            value="bold"
            checked={headlineWeight === 'bold'}
            onChange={(e) => onHeadlineWeightChange(e.target.value)}
          />
          Bold
        </label>
        <label className={`style-option ${headlineWeight === 'black' ? 'active' : ''}`}>
          <input
            type="radio"
            name="headlineWeight"
            value="black"
            checked={headlineWeight === 'black'}
            onChange={(e) => onHeadlineWeightChange(e.target.value)}
          />
          Black
        </label>
      </div>
    </div>

    {isRoomType && (
      <div className="style-control">
        <span className="style-control__label">Room Name Style</span>
        <div className="style-options">
          <label className={`style-option ${roomNameStyle === 'standard' ? 'active' : ''}`}>
            <input
              type="radio"
              name="roomNameStyle"
              value="standard"
              checked={roomNameStyle === 'standard'}
              onChange={(e) => onRoomNameStyleChange(e.target.value)}
            />
            Bold
          </label>
          <label className={`style-option ${roomNameStyle === 'italic' ? 'active' : ''}`}>
            <input
              type="radio"
              name="roomNameStyle"
              value="italic"
              checked={roomNameStyle === 'italic'}
              onChange={(e) => onRoomNameStyleChange(e.target.value)}
            />
            Italic
          </label>
        </div>
      </div>
    )}
  </div>
)
