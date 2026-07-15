import React, { forwardRef } from 'react'
import { UnbcLogoMark, AlumniCrest } from '../unbc'
import { splitDepartmentText } from '../unbc/logo/logoText'
import { PT_PER_INCH, DEFAULT_INSERT_SIZE } from './signConstants'
import ctaanLogo from '../assets/ctaan-logo.png'

export const ARTWORK_FONT = "'HelveticaNeueUNBC', 'Helvetica Neue', Helvetica, Arial, sans-serif"

const readBrandVar = (name, fallback) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback
  }
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value || fallback
  } catch (error) {
    return fallback
  }
}

// Shared offscreen context for measuring/wrapping text in the SVG coordinate space.
let measureContext
const getMeasureContext = () => {
  if (!measureContext && typeof document !== 'undefined') {
    measureContext = document.createElement('canvas').getContext('2d')
  }
  return measureContext
}

const wrapText = (text, { weight, style, size, family, maxWidth }) => {
  const value = (text || '').toString().trim()
  if (!value) return []

  const ctx = getMeasureContext()
  const paragraphs = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (!ctx) return paragraphs

  ctx.font = `${style} ${weight} ${size}px ${family}`
  const lines = []
  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/)
    let current = ''
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word
      if (ctx.measureText(candidate).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = candidate
      }
    })
    if (current) lines.push(current)
  })
  return lines
}

// Block sizes are fractions of the viewable height, matched against the production
// Illustrator files: names ≈ 10% H, positions ≈ 5% H, contact lines ≈ 4.6% H.
const buildBlocks = (content, { H, nameColor, secondaryColor }) => {
  const blocks = []
  const isRoom = content.signType === 'lab' || content.signType === 'general-room' || content.signType === 'custodian-closet'
  const compactTwoPerson = !isRoom && content.showSecondOccupant && content.name2 && content.twoPersonSpacing !== 'relaxed'
  const contentScale = content.contentSize === 'largest' ? 1.55 : content.contentSize === 'large' ? 1.2 : 1
  const compactContent = content.contentSpacing === 'compact'
  const spacingScale = compactContent ? 0.48 : 1
  const contactScale = content.contactSize === 'large' ? 1.25 : 1
  const uniformBodyText = content.bodyTextMode === 'uniform'
  const headlineWeight = content.headlineWeight === 'black' ? 900 : content.headlineWeight === 'bold' ? 700 : 400
  const gap = value => value * spacingScale
  const contactTextSize = H * 0.046 * contentScale * contactScale
  const contactLineHeight = compactContent ? 1.12 : 1.32
  const contactLine = (label, value) => {
    if (!value) return ''
    const cleanLabel = (label || '').trim().replace(/:\s*$/, '')
    return cleanLabel ? `${cleanLabel}: ${value}` : value
  }
  const contactLinesFor = (group) => {
    const lines = [
      group.email ? contactLine(content.emailLabel, group.email) : '',
      group.phone ? contactLine(content.phoneLabel, group.phone) : '',
      group.cellPhone ? contactLine(content.cellPhoneLabel, group.cellPhone) : ''
    ].filter(Boolean)
    return content.contactLayout === 'inline' && lines.length > 1 ? [lines.join(' · ')] : lines
  }

  const pushContactLines = (lines, gapBefore, options = {}) => {
    lines.filter(Boolean).forEach((line, index) => {
      blocks.push({
        text: line,
        size: options.compact && !uniformBodyText ? H * 0.06 * contentScale * contactScale : contactTextSize,
        weight: 400,
        style: 'italic',
        fill: secondaryColor,
        lineHeightRatio: options.compact && !uniformBodyText ? 1.12 : contactLineHeight,
        gapBefore: index === 0 ? gapBefore : 0,
        wrap: true
      })
    })
  }

  // Room signs: big room name, optionally followed by a contact line ("Contact: …" or a
  // PI's name, rendered as typed) and Email / Phone lines — the dominant lab pattern in
  // the production archive. The headline drops a step when a contact block shares the card.
  const pushRoomGroup = (group, gapBefore, options = {}) => {
    if (!group.roomName) return
    const italic = content.roomNameStyle === 'italic'
    const hasDetails = options.hasDetails ?? Boolean(group.contactName || group.email || group.phone)
    blocks.push({
      text: group.roomName,
      size: (italic ? H * 0.1 : (hasDetails ? H * 0.105 : H * 0.135)) * contentScale,
      weight: italic ? 400 : headlineWeight,
      style: italic ? 'italic' : 'normal',
      fill: nameColor,
      lineHeightRatio: 1.05,
      gapBefore,
      wrap: true
    })
    if (group.contactName) {
      blocks.push({
        text: group.contactName,
        size: H * 0.05 * contentScale,
        weight: 500,
        style: 'normal',
        fill: secondaryColor,
        lineHeightRatio: 1.3,
        gapBefore: gap(H * 0.045),
        wrap: true
      })
    }
    if (!options.headlineOnly) {
      pushContactLines(contactLinesFor(group), gap(H * 0.035))
    }
  }

  // Some room signs have multiple people attached to one room (for example, The Co-Lab
  // has a primary contact and a research manager). Keep these as contact blocks instead of
  // incorrectly promoting the second person to another room headline.
  const pushAdditionalRoomContact = (group, gapBefore) => {
    if (!group.contactName && !group.email && !group.phone) return

    if (group.contactName) {
      blocks.push({
        text: group.contactName,
        size: H * 0.05 * contentScale,
        weight: 500,
        style: 'normal',
        fill: secondaryColor,
        lineHeightRatio: 1.3,
        gapBefore: gap(gapBefore),
        wrap: true
      })
    }
    pushContactLines(contactLinesFor(group), group.contactName ? gap(H * 0.035) : gap(gapBefore))
  }

  // Person (faculty / staff / student) group: name + credentials, wrapped position,
  // optional italic tagline, then Email / Phone / Cell lines.
  const pushPersonGroup = (group, gapBefore) => {
    if (!group.name) return
    blocks.push({
      text: group.name + (group.credentials
        ? content.designationLayout === 'below' ? ',' : `, (${group.credentials})`
        : ''),
      size: H * (compactTwoPerson ? 0.115 : 0.1) * contentScale,
      weight: headlineWeight,
      style: 'normal',
      fill: nameColor,
      lineHeightRatio: compactTwoPerson || compactContent ? 1.02 : 1.12,
      gapBefore,
      wrap: true
    })
    if (group.credentials && content.designationLayout === 'below') {
      blocks.push({
        text: `(${group.credentials})`,
        size: H * (compactTwoPerson ? 0.08 : 0.075) * contentScale,
        weight: headlineWeight,
        style: 'normal',
        fill: nameColor,
        lineHeightRatio: 1.05,
        gapBefore: 0,
        wrap: true
      })
    }
    if (group.position) {
      const positions = content.positionLayout === 'inline'
        ? [group.position]
        : group.position.split(/\s*(?:\r?\n|[·•|;])\s*/).filter(Boolean)

      positions.forEach((position, index) => {
        blocks.push({
          text: position,
          size: uniformBodyText
            ? contactTextSize
            : H * (compactTwoPerson ? 0.065 : content.positionSize === 'large' ? 0.065 : 0.05) * contentScale,
          weight: 400,
          style: 'normal',
          fill: secondaryColor,
          lineHeightRatio: uniformBodyText ? contactLineHeight : compactTwoPerson || compactContent ? 1.08 : 1.3,
          gapBefore: index === 0 ? (compactContent ? 0 : gap(H * (compactTwoPerson ? 0.01 : 0.03))) : 0,
          wrap: true
        })
      })
    }
    if (group.tagline) {
      blocks.push({
        text: group.tagline,
        size: uniformBodyText ? contactTextSize : H * 0.046 * contentScale,
        weight: 400,
        style: 'italic',
        fill: secondaryColor,
        lineHeightRatio: uniformBodyText ? contactLineHeight : 1.32,
        gapBefore: gap(H * 0.03),
        wrap: true
      })
    }
    const contactLines = compactTwoPerson
      ? [group.email, group.phone, group.cellPhone].filter(Boolean)
      : contactLinesFor(group)
    pushContactLines(contactLines, uniformBodyText ? 0 : gap(H * (compactTwoPerson ? 0.012 : 0.035)), { compact: compactTwoPerson })
  }

  const groupGap = gap(H * (compactTwoPerson ? 0.045 : 0.07))

  if (isRoom) {
    if (content.roomContactGrouping === 'by-field' && content.showSecondOccupant && content.secondaryEntryType === 'contact') {
      const primaryEmail = content.showEmail ? content.email : ''
      const secondaryEmail = content.showEmail2 ? content.email2 : ''
      const primaryPhone = content.showPhone ? content.phone : ''
      const secondaryPhone = content.showPhone2 ? content.phone2 : ''
      pushRoomGroup({ roomName: content.roomName }, 0, { headlineOnly: true, hasDetails: true })
      pushContactLines([
        primaryEmail ? contactLine(content.emailLabel, primaryEmail) : '',
        secondaryEmail
      ], gap(H * 0.045))
      pushContactLines([
        primaryPhone ? `${contactLine(content.phoneLabel, primaryPhone)}${content.contactName ? ` (${content.contactName})` : ''}` : '',
        secondaryPhone ? `${secondaryPhone}${content.contactName2 ? ` (${content.contactName2})` : ''}` : ''
      ], gap(H * 0.025))
      if (content.organizationLogo === 'ctaan') {
        blocks.push({ kind: 'logo', gapBefore: gap(H * 0.04), height: H * 0.23 })
      }
      return blocks
    }
    pushRoomGroup({
      roomName: content.roomName,
      contactName: content.contactName,
      email: content.showEmail ? content.email : '',
      phone: content.showPhone ? content.phone : ''
    }, 0)
    if (content.showSecondOccupant) {
      const secondaryGroup = {
        roomName: content.roomName2,
        contactName: content.contactName2,
        email: content.showEmail2 ? content.email2 : '',
        phone: content.showPhone2 ? content.phone2 : ''
      }
      if (content.secondaryEntryType === 'contact') {
        pushAdditionalRoomContact(secondaryGroup, blocks.length ? groupGap : 0)
      } else {
        pushRoomGroup(secondaryGroup, blocks.length ? groupGap : 0)
      }
    }
    if (content.organizationLogo === 'ctaan') {
      blocks.push({ kind: 'logo', gapBefore: gap(H * 0.04), height: H * 0.23 })
    }
    return blocks
  }

  pushPersonGroup({
    name: content.name,
    credentials: content.credentials,
    position: content.position,
    tagline: content.tagline,
    email: content.showEmail ? content.email : '',
    phone: content.showPhone ? content.phone : '',
    cellPhone: content.showCellPhone ? content.cellPhone : ''
  }, 0)
  if (content.showSecondOccupant) {
    pushPersonGroup({
      name: content.name2,
      position: content.position2,
      tagline: content.tagline2,
      email: content.showEmail2 ? content.email2 : '',
      phone: content.showPhone2 ? content.phone2 : '',
      cellPhone: content.showCellPhone2 ? content.cellPhone2 : ''
    }, blocks.length ? groupGap : 0)
  }

  return blocks
}

export const SignArtwork = forwardRef(({ content, fontFamily = ARTWORK_FONT }, ref) => {
  const insert = content.insert || DEFAULT_INSERT_SIZE
  const W = insert.width * PT_PER_INCH
  const H = insert.height * PT_PER_INCH

  // Bleed (in points) extends the background fills past the trim line so cutting leaves
  // no white slivers. The canvas (viewBox) grows by BLEED on every edge.
  const bleedInches = Number.isFinite(content.bleed) ? content.bleed : 0
  const BLEED = bleedInches * PT_PER_INCH
  const CW = W + BLEED * 2
  const CH = H + BLEED * 2

  // Viewable window: the acrylic frame covers these insets (inches) of the trimmed insert,
  // so all live content is laid out INSIDE this window and never hides behind the frame.
  // With no holder selected the offsets are 0 and the window equals the full trim (unchanged).
  const view = content.viewable || {}
  const VL = Math.max(view.left || 0, 0) * PT_PER_INCH
  const VR = Math.max(view.right || 0, 0) * PT_PER_INCH
  const VT = Math.max(view.top || 0, 0) * PT_PER_INCH
  const VB = Math.max(view.bottom || 0, 0) * PT_PER_INCH
  const VW = W - VL - VR   // viewable width  (the design space below works in these dims)
  const VH = H - VT - VB   // viewable height

  const headerColor = readBrandVar('--brand-header', '#2a634d')
  const nameColor = readBrandVar('--sign-name-color', '#373535')
  const secondaryColor = readBrandVar('--sign-secondary-color', '#454343')

  // Everything below is in DESIGN space — coordinates relative to the viewable window's
  // top-left corner. The content <g> is translated out by BLEED + the viewable inset.
  // Production files measure ~12% left margin, a ~20.5% header band that grows ~3.3% per
  // department line, and a logo lockup spanning ~35.5% of the card width.
  const PAD_X = VW * (content.contentWidth === 'wide' ? 0.08 : 0.12)
  const departmentLineCount = splitDepartmentText(content.departmentText || '').length
  const HEADER_H = VH * (0.205 + 0.033 * departmentLineCount)

  const logoWidth = VW * 0.355
  const logoScale = logoWidth / 178
  const logoHeight = 80 * logoScale
  // Centre the logo in the header band, but never above the viewable top — for a wide-but-short
  // window (e.g. Residence Compact) the band is shorter than the logo, which would otherwise
  // push it up under the frame.
  const logoY = Math.max((HEADER_H - logoHeight) / 2, 0)

  const isRoom = content.signType === 'lab' || content.signType === 'general-room' || content.signType === 'custodian-closet'
  const hasSecondPerson = !isRoom && Boolean(content.showSecondOccupant && content.name2)
  const compactTwoPerson = hasSecondPerson && content.twoPersonSpacing !== 'relaxed'
  const showPrimaryAlumni = !isRoom && Boolean(content.showAlumni)
  const showSecondaryAlumni = hasSecondPerson && Boolean(content.showAlumni2)
  const hasAlumni = showPrimaryAlumni || showSecondaryAlumni
  const bodyHeight = VH - HEADER_H
  const badgeHeight = bodyHeight * (hasSecondPerson ? 0.3 : 0.34)
  const badgeScale = badgeHeight / 67.82
  const badgeWidth = 59.27 * badgeScale
  const badgeX = VW - PAD_X - badgeWidth
  const badgeCenterY = HEADER_H + (bodyHeight - badgeHeight) / 2
  const primaryBadgeY = hasSecondPerson
    ? HEADER_H + bodyHeight * 0.25 - badgeHeight / 2
    : badgeCenterY
  const secondaryBadgeY = HEADER_H + bodyHeight * 0.75 - badgeHeight / 2

  // The source two-person templates let long names run close to their individual crest.
  // Relaxed/single-person layouts retain a little more breathing room beside the badge.
  const badgeGap = compactTwoPerson ? 0 : VW * 0.025
  const textMaxWidth = (VW - 2 * PAD_X) - (hasAlumni ? badgeWidth + badgeGap : 0)

  const blocks = buildBlocks(content, { H: VH, nameColor, secondaryColor })

  const items = []
  blocks.forEach((block) => {
    if (block.kind === 'logo') {
      items.push({
        kind: 'logo',
        lineHeight: block.height,
        height: block.height,
        marginTop: block.gapBefore || 0
      })
      return
    }
    const lines = block.wrap
      ? wrapText(block.text, { weight: block.weight, style: block.style, size: block.size, family: fontFamily, maxWidth: textMaxWidth })
      : [(block.text || '').toString()]
    lines.filter(Boolean).forEach((line, index) => {
      items.push({
        text: line,
        size: block.size,
        weight: block.weight,
        style: block.style,
        fill: block.fill,
        lineHeight: block.size * block.lineHeightRatio,
        marginTop: index === 0 ? (block.gapBefore || 0) : 0
      })
    })
  })

  // Auto-shrink: long content (wrapped room names, two occupants) scales down uniformly
  // instead of running off the bottom of the card.
  const rawHeight = items.reduce((sum, item) => sum + item.marginTop + item.lineHeight, 0)
  const availableHeight = (VH - HEADER_H) * 0.96
  const shrink = rawHeight > availableHeight ? availableHeight / rawHeight : 1
  if (shrink < 1) {
    items.forEach((item) => {
      if (item.size) item.size *= shrink
      if (item.height) item.height *= shrink
      item.lineHeight *= shrink
      item.marginTop *= shrink
    })
  }

  const totalHeight = rawHeight * shrink
  let cursorY = HEADER_H + Math.max(((VH - HEADER_H) - totalHeight) / 2, VH * 0.02)

  const texts = items.map((item) => {
    cursorY += item.marginTop
    if (item.kind === 'logo') {
      const y = cursorY
      cursorY += item.lineHeight
      return { ...item, y }
    }
    const baseline = cursorY + item.size * 0.8
    cursorY += item.lineHeight
    return { ...item, baseline }
  })

  // Canvas-space top-left of the viewable window (bleed + frame inset).
  const originX = BLEED + VL
  const originY = BLEED + VT
  // The green header bleeds off the top and side canvas edges and runs down to the bottom of
  // the header band inside the viewable window, so the frame-covered margin reads as green.
  const headerBottom = originY + HEADER_H

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${CW} ${CH}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      fontFamily={fontFamily}
      data-bleed={BLEED}
      data-trim-width={W}
      data-trim-height={H}
      style={{ display: 'block' }}
    >
      {/* White spans the full bleed canvas; the green header bleeds off the top and side
          edges and stops at the header band inside the viewable window. */}
      <rect x="0" y="0" width={CW} height={CH} fill="#ffffff" />
      <rect x="0" y="0" width={CW} height={headerBottom} fill={headerColor} />

      <g transform={`translate(${originX}, ${originY})`}>
        <UnbcLogoMark
          transform={`translate(${PAD_X}, ${logoY}) scale(${logoScale})`}
          departmentText={content.departmentText}
          fontFamily={fontFamily}
        />

        {texts.map((item, index) => item.kind === 'logo' ? (
          <image
            key={index}
            href={ctaanLogo}
            x={content.textAlignment === 'center' ? (VW - item.height * 2.076) / 2 : PAD_X}
            y={item.y}
            width={item.height * 2.076}
            height={item.height}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <text
            key={index}
            x={content.textAlignment === 'center' ? VW / 2 : PAD_X}
            y={item.baseline}
            textAnchor={content.textAlignment === 'center' ? 'middle' : 'start'}
            fontFamily={fontFamily}
            fontSize={item.size}
            fontWeight={item.weight}
            fontStyle={item.style}
            fill={item.fill}
          >
            {item.text}
          </text>
        ))}

        {showPrimaryAlumni && (
          <AlumniCrest
            occupant="primary"
            transform={`translate(${badgeX}, ${primaryBadgeY}) scale(${badgeScale})`}
          />
        )}

        {showSecondaryAlumni && (
          <AlumniCrest
            occupant="secondary"
            transform={`translate(${badgeX}, ${secondaryBadgeY}) scale(${badgeScale})`}
          />
        )}
      </g>
    </svg>
  )
})

SignArtwork.displayName = 'SignArtwork'
