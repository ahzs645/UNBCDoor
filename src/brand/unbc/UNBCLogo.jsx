import React, { useEffect, useRef, useState } from 'react'
import { getAssetPath, updateUnbcLogoDepartmentText } from './unbcLogoEngine'

export const UNBCLogo = ({ departmentText }) => {
  const logoRef = useRef(null)
  const [svgContent, setSvgContent] = useState('')

  useEffect(() => {
    const loadSVG = async () => {
      try {
        const response = await fetch(getAssetPath('components/unbc-logo.svg'))
        const svgText = await response.text()
        setSvgContent(svgText)
      } catch (error) {
        console.error('Error loading UNBC logo SVG:', error)
      }
    }

    loadSVG()
  }, [])

  useEffect(() => {
    if (!svgContent) {
      return
    }

    const timer = window.setTimeout(() => {
      updateUnbcLogoDepartmentText(logoRef.current, departmentText)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [departmentText, svgContent])

  return (
    <div
      ref={logoRef}
      className="unbc-logo"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
