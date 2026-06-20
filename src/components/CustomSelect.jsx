import React, { useEffect, useId, useRef, useState } from 'react'

/**
 * Fully styled (non-native) dropdown. Renders a button trigger and our own
 * listbox panel instead of an OS-drawn <select> popup, so the open menu matches
 * the branded form on every platform (and in dark mode).
 *
 * Props:
 *   - options: array of { value, label }
 *   - value: currently selected value
 *   - onChange: (value) => void
 *   - placeholder: text shown when no value is selected
 *   - id / name: forwarded for label association + form semantics
 */
export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  id,
  name,
  ariaLabel
}) => {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const reactId = useId()
  const baseId = id || `custom-select-${reactId}`

  const selectedIndex = options.findIndex((opt) => opt.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null

  const openMenu = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const closeMenu = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const commit = (index) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    closeMenu()
  }

  // Close when clicking/tapping outside the component.
  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open])

  // Keep the active option scrolled into view while navigating with the keyboard.
  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return
    const node = listRef.current.children[activeIndex]
    if (node) node.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) {
          openMenu()
        } else {
          setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) {
          openMenu()
        } else {
          setActiveIndex((i) => Math.max(i - 1, 0))
        }
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setActiveIndex(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setActiveIndex(options.length - 1)
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) {
          commit(activeIndex)
        } else {
          openMenu()
        }
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          closeMenu()
        }
        break
      case 'Tab':
        if (open) closeMenu()
        break
      default:
        break
    }
  }

  return (
    <div
      className={`custom-select ${open ? 'custom-select--open' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        id={baseId}
        className="custom-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-listbox` : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined
        }
        aria-label={ariaLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span
          className={`custom-select__value ${selectedOption ? '' : 'custom-select__value--placeholder'}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      {/* Hidden field keeps the value available to plain form serialization. */}
      <input type="hidden" name={name} value={value ?? ''} />

      {open && (
        <ul
          className="custom-select__panel"
          id={`${baseId}-listbox`}
          role="listbox"
          ref={listRef}
          aria-labelledby={baseId}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isActive = index === activeIndex
            return (
              <li
                key={option.value === '' ? `__placeholder-${index}` : option.value}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                className={`custom-select__option ${isActive ? 'custom-select__option--active' : ''} ${isSelected ? 'custom-select__option--selected' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => {
                  // Prevent the trigger from losing focus before we commit.
                  e.preventDefault()
                  commit(index)
                }}
              >
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
