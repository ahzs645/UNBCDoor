import React, { forwardRef } from 'react'
import { UnbcLogoMark, AlumniCrest } from '@unbc/logo'
import { PT_PER_INCH, DEFAULT_INSERT_SIZE } from './signConstants'
import { resolveHeaderGeometry } from './headerGeometry'
import { splitRoleTitle } from './signRoles'
import { resolveOrganization } from './organizations'
import { NugssLogoMark } from './NugssLogoMark'
import ctaanLogo from '../assets/ctaan-logo.png'

export const ARTWORK_FONT = "'HelveticaNeueUNBC', 'HelveticaNeueUNBCFallback', 'Helvetica Neue', Helvetica, Arial, sans-serif"

const ALUMNI_CREST_SIZE_SCALE = {
  small: 0.85,
  standard: 1,
  large: 1.15,
  maximum: 1.25
}

const ALUMNI_CREST_GAP_RATIO = {
  tight: 0.015,
  standard: 0.025,
  wide: 0.04,
  maximum: 0.06
}

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

// Ligatures (the "fi" and "fl" drawn as one joined glyph) are a per-sign choice, on by default as
// in UNBC's own documents. <SignArtwork> switches them with CSS, but a canvas has no such switch,
// so with them off the measured text gets a zero-width non-joiner after each f, which breaks the
// ligature without adding any width.
const NO_LIGATURE = '\u200c'
const measureText = (ctx, text, ligatures = false) => ctx.measureText(
  ligatures ? text : text.replace(/f(?=\S)/g, `f${NO_LIGATURE}`)
)

// Spaces inside a phrase that should wrap as one unit (a designation kept together) are joined
// with this no-break space. The wrapper treats the phrase as a single word, falls back to normal
// wrapping only if the phrase can't fit on a line by itself, and hands back ordinary spaces.
const KEEP_TOGETHER = '\u00a0'
const keepTogether = (text) => text.replace(/ +/g, KEEP_TOGETHER)

const wrapText = (text, { weight, style, size, family, maxWidth, ligatures }) => {
  const value = (text || '').toString().trim()
  if (!value) return []

  const ctx = getMeasureContext()
  const restoreSpaces = line => line.replaceAll(KEEP_TOGETHER, ' ')
  const paragraphs = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (!ctx) return paragraphs.map(restoreSpaces)

  ctx.font = `${style} ${weight} ${size}px ${family}`
  const lines = []
  paragraphs.forEach((paragraph) => {
    const words = paragraph
      .split(/[^\S\u00a0]+/)
      .flatMap(word => (
        word.includes(KEEP_TOGETHER) && measureText(ctx, word, ligatures).width > maxWidth
          ? word.split(KEEP_TOGETHER)
          : [word]
      ))
    let current = ''
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word
      if (measureText(ctx, candidate, ligatures).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = candidate
      }
    })
    if (current) lines.push(current)
  })
  return lines.map(restoreSpaces)
}

// Roles print as "Position | Faculty or department". Aligned, the bars line up in one column
// and a long department wraps under itself, as on the printed signs. Falls back to plain
// "Position | Department" lines when the positions are too long to leave room for a column (or
// there is nothing to align, or no canvas to measure with). A role can instead put its
// department on a line of its own or leave it off, and its subtext follows in italics — under
// the department column when the role sits in it. A role can drop the bar and keep only the gap
// (in the aligned column the department still lines up with the others). Each line comes back with its segments and
// whether it is a subtext line.
const ROLE_SEPARATOR = '|'

const layoutRoles = (roles, { aligned, font, noteFont }) => {
  const plain = (text, lineFont = font, dx = 0) => wrapText(text, { ...lineFont, maxWidth: lineFont.maxWidth - dx })
    .map(line => ({ segments: [{ text: line, dx }], note: lineFont === noteFont }))

  const rows = roles.map((role) => {
    const pieces = splitRoleTitle(role)
    return {
      role,
      leading: pieces.slice(0, -1),
      title: pieces[pieces.length - 1] || '',
      bar: role.unitDivider !== 'none',
      unit: role.unitLayout === 'beside' ? role.unit : '',
      unitBelow: role.unitLayout === 'below' ? role.unit : ''
    }
  })

  const ctx = getMeasureContext()
  const paired = rows.filter(row => row.title && row.unit)
  let separatorX = 0
  let unitX = 0
  let column = Boolean(aligned && ctx && paired.length)
  if (column) {
    ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`
    const space = measureText(ctx, ' ', font.ligatures).width
    const titleWidth = Math.max(...paired.map(row => measureText(ctx, row.title, font.ligatures).width))
    separatorX = titleWidth + space
    // With no bar in the column at all, the gap the bar would have filled is closed up.
    unitX = paired.some(row => row.bar)
      ? separatorX + measureText(ctx, ROLE_SEPARATOR, font.ligatures).width + space
      : titleWidth + space * 2
    if (unitX > font.maxWidth * 0.5) column = false
  }

  return rows.flatMap(({ role, leading, title, bar, unit, unitBelow }) => {
    const lines = leading.flatMap(piece => plain(piece))
    let noteX = 0
    if (title && unit && column) {
      wrapText(unit, { ...font, maxWidth: font.maxWidth - unitX }).forEach((line, index) => {
        lines.push({
          note: false,
          segments: index === 0
            ? [
                { text: title, dx: 0 },
                ...(bar ? [{ text: ROLE_SEPARATOR, dx: separatorX }] : []),
                { text: line, dx: unitX }
              ]
            : [{ text: line, dx: unitX }]
        })
      })
      noteX = unitX
    } else {
      lines.push(...plain([title, unit].filter(Boolean).join(bar ? ` ${ROLE_SEPARATOR} ` : ' ')))
    }
    if (unitBelow) lines.push(...plain(unitBelow))
    if (role.note) lines.push(...plain(role.note, noteFont, noteX))
    return lines
  })
}

// The extra line is italic, and a line wrapped in *asterisks* switches to regular — so one
// line of it can stand upright above an italic one.
const taglineLines = (tagline) => tagline
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean)
  .map((line) => {
    const flipped = line.match(/^\*(.+)\*$/)
    return flipped ? { text: flipped[1].trim(), italic: false } : { text: line, italic: true }
  })
  .filter(line => line.text)

const isRoomSign = (content) =>
  content.signType === 'lab' || content.signType === 'general-room' || content.signType === 'custodian-closet'

// How many people a person sign prints: the first, plus the second and third when they are on
// the sign and named. Room signs have none.
const countPeople = (content) => isRoomSign(content)
  ? 0
  : 1 +
    (content.showSecondOccupant && content.name2 ? 1 : 0) +
    (content.showSecondOccupant && content.showThirdOccupant && content.name3 ? 1 : 0)

// Block sizes are fractions of the viewable height, matched against the production
// Illustrator files: names ≈ 10% H, positions ≈ 5% H, contact lines ≈ 4.6% H.
const buildBlocks = (content, { H, nameColor, secondaryColor }) => {
  const blocks = []
  const isRoom = isRoomSign(content)
  const peopleCount = countPeople(content)
  const compactTwoPerson = peopleCount > 1 && content.twoPersonSpacing !== 'relaxed'
  // Three people share the two-person card at four fifths the size, so all three fit under the
  // header without the auto-shrink squeezing their gaps shut.
  const contentScale = (content.contentSize === 'largest' ? 1.55 : content.contentSize === 'large' ? 1.2 : 1) *
    (peopleCount > 2 ? 0.8 : 1)
  const compactContent = content.contentSpacing === 'compact'
  const spacingScale = compactContent ? 0.48 : 1
  // 'largest' is the NUGSS production size: ≈6.6% of the window, as big as a position line.
  const contactScale = content.contactSize === 'largest' ? 1.45 : content.contactSize === 'large' ? 1.25 : 1
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
        occupant: options.occupant,
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
  const pushPersonGroup = (group, gapBefore, occupant) => {
    if (!group.name) return
    blocks.push({
      occupant,
      text: group.name + (group.credentials
        ? content.designationLayout === 'below'
          ? ','
          : content.designationLayout === 'together'
            ? `, ${keepTogether(`(${group.credentials})`)}`
            : `, (${group.credentials})`
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
        occupant,
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
    const positionStyle = {
      occupant,
      size: uniformBodyText
        ? contactTextSize
        : H * (compactTwoPerson ? 0.065 : content.positionSize === 'large' ? 0.065 : 0.05) * contentScale,
      weight: 400,
      style: 'normal',
      fill: secondaryColor,
      lineHeightRatio: uniformBodyText ? contactLineHeight : compactTwoPerson || compactContent ? 1.08 : 1.3
    }
    const positionGap = compactContent ? 0 : gap(H * (compactTwoPerson ? 0.01 : 0.03))
    // Subtext under a role and the extra line share a size: a step down from the position.
    const italicLineStyle = {
      size: uniformBodyText ? contactTextSize : H * 0.046 * contentScale,
      lineHeightRatio: uniformBodyText ? contactLineHeight : 1.32
    }
    if (group.position) {
      // The placeholder position, shown until a role is typed.
      blocks.push({ ...positionStyle, text: group.position, gapBefore: positionGap, wrap: true })
    }
    if (group.roles?.length) {
      blocks.push({
        ...positionStyle,
        kind: 'roles',
        roles: group.roles,
        noteSize: italicLineStyle.size,
        noteLineHeightRatio: italicLineStyle.lineHeightRatio,
        gapBefore: group.position ? 0 : positionGap
      })
    }
    if (group.tagline) {
      taglineLines(group.tagline).forEach((line, index) => {
        blocks.push({
          occupant,
          text: line.text,
          ...italicLineStyle,
          weight: 400,
          style: line.italic ? 'italic' : 'normal',
          fill: secondaryColor,
          gapBefore: index === 0 ? gap(H * 0.03) : 0,
          wrap: true
        })
      })
    }
    const contactLines = compactTwoPerson
      ? [group.email, group.phone, group.cellPhone].filter(Boolean)
      : contactLinesFor(group)
    pushContactLines(
      contactLines,
      uniformBodyText ? 0 : gap(H * (compactTwoPerson ? 0.012 : 0.035)),
      { compact: compactTwoPerson, occupant }
    )
  }

  const groupGap = gap(H * (peopleCount > 2 ? 0.035 : compactTwoPerson ? 0.045 : 0.07))

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
    roles: content.roles,
    tagline: content.tagline,
    email: content.showEmail ? content.email : '',
    phone: content.showPhone ? content.phone : '',
    cellPhone: content.showCellPhone ? content.cellPhone : ''
  }, 0, 'primary')
  if (content.showSecondOccupant) {
    pushPersonGroup({
      name: content.name2,
      position: content.position2,
      roles: content.roles2,
      tagline: content.tagline2,
      email: content.showEmail2 ? content.email2 : '',
      phone: content.showPhone2 ? content.phone2 : '',
      cellPhone: content.showCellPhone2 ? content.cellPhone2 : ''
    }, blocks.length ? groupGap : 0, 'secondary')
  }
  if (content.showSecondOccupant && content.showThirdOccupant) {
    pushPersonGroup({
      name: content.name3,
      roles: content.roles3,
      tagline: content.tagline3,
      email: content.showEmail3 ? content.email3 : '',
      phone: content.showPhone3 ? content.phone3 : '',
      cellPhone: content.showCellPhone3 ? content.cellPhone3 : ''
    }, blocks.length ? groupGap : 0, 'tertiary')
  }

  return blocks
}

// Ink extent of a laid-out line, for centring the body on what is actually printed rather than on
// line boxes (which carry extra leading under the last line). Falls back to typical Helvetica
// proportions when there is no canvas to measure with.
const measureInk = (item, fontFamily, ligatures) => {
  const text = item.segments ? item.segments.map(segment => segment.text).join(' ') : item.text
  const ctx = getMeasureContext()
  if (ctx && text) {
    ctx.font = `${item.style} ${item.weight} ${item.size}px ${fontFamily}`
    const metrics = measureText(ctx, text, ligatures)
    if (Number.isFinite(metrics.actualBoundingBoxAscent) && Number.isFinite(metrics.actualBoundingBoxDescent)) {
      return { ascent: metrics.actualBoundingBoxAscent, descent: metrics.actualBoundingBoxDescent }
    }
  }
  return { ascent: item.size * 0.72, descent: item.size * 0.2 }
}

// Resolves where everything on the sign goes, in the artwork's canvas points. <SignArtwork> draws
// from it, and the preview's guide overlay reads the same numbers to mark the cut line, the
// holder window and the margins, so the guides can never drift from the artwork.
export const layoutSignArtwork = (content, fontFamily = ARTWORK_FONT) => {
  const insert = content.insert || DEFAULT_INSERT_SIZE
  const ligatures = content.ligatures === 'on'
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

  const headerColor = resolveOrganization(content.organization).headerColor
  const nameColor = readBrandVar('--sign-name-color', '#373535')
  const secondaryColor = readBrandVar('--sign-secondary-color', '#454343')

  // Everything below is in DESIGN space — coordinates relative to the viewable window's
  // top-left corner. The content <g> is translated out by BLEED + the viewable inset.
  // Production files measure a ~12% left margin for the body text. The header band and the
  // lockup are measured against the trimmed card rather than the viewable window, so they are
  // resolved in trim space (see headerGeometry.js) and shifted into design space here.
  const PAD_X = VW * (content.contentWidth === 'wide' ? 0.08 : 0.12)
  const header = resolveHeaderGeometry({
    width: W,
    height: H,
    viewable: { top: VT, right: VR, bottom: VB, left: VL },
    textX: VL + PAD_X,
    rightInset: PAD_X,
    departmentText: content.departmentText,
    departmentWrap: content.departmentWrap,
    organization: content.organization
  })
  const HEADER_H = header.bandHeight - VT
  const logoX = header.logoX - VL
  const logoY = header.logoY - VT

  const isRoom = isRoomSign(content)
  const hasSecondPerson = !isRoom && Boolean(content.showSecondOccupant && content.name2)
  const hasThirdPerson = !isRoom && Boolean(content.showSecondOccupant && content.showThirdOccupant && content.name3)
  const peopleCount = countPeople(content)
  const compactTwoPerson = peopleCount > 1 && content.twoPersonSpacing !== 'relaxed'
  const showPrimaryAlumni = !isRoom && Boolean(content.showAlumni)
  const showSecondaryAlumni = hasSecondPerson && Boolean(content.showAlumni2)
  const showTertiaryAlumni = hasThirdPerson && Boolean(content.showAlumni3)
  const hasAlumni = showPrimaryAlumni || showSecondaryAlumni || showTertiaryAlumni
  const bodyHeight = VH - HEADER_H
  const baseBadgeHeight = bodyHeight * (peopleCount > 2 ? 0.24 : peopleCount > 1 ? 0.3 : 0.34)
  const badgeSizeScale = ALUMNI_CREST_SIZE_SCALE[content.alumniCrestSize] || 1
  // The largest preset is capped at 29% of a three-person body, 37.5% of a two-person body or
  // 42.5% of a single-person body so crests cannot overrun their occupant area.
  const maxBadgeHeight = bodyHeight * (peopleCount > 2 ? 0.29 : peopleCount > 1 ? 0.375 : 0.425)
  const badgeHeight = Math.min(baseBadgeHeight * badgeSizeScale, maxBadgeHeight)
  const badgeScale = badgeHeight / 67.82
  const badgeWidth = 59.27 * badgeScale
  const badgeX = VW - PAD_X - badgeWidth
  const badgeCenterY = HEADER_H + (bodyHeight - badgeHeight) / 2
  // Without text to centre on, each crest sits in the middle of an equal share of the body.
  const fallbackBadgeY = (index) => HEADER_H + bodyHeight * (index + 0.5) / peopleCount - badgeHeight / 2
  const fallbackPrimaryBadgeY = peopleCount > 1 ? fallbackBadgeY(0) : badgeCenterY
  const fallbackSecondaryBadgeY = fallbackBadgeY(1)
  const fallbackTertiaryBadgeY = fallbackBadgeY(2)

  // The source two-person templates let long names run close to their individual crest.
  // Relaxed/single-person layouts retain a little more breathing room beside the badge.
  const configuredGapRatio = ALUMNI_CREST_GAP_RATIO[content.alumniCrestSpacing]
  const badgeGap = VW * (configuredGapRatio ?? (compactTwoPerson ? 0 : 0.025))
  const textMaxWidth = (VW - 2 * PAD_X) - (hasAlumni ? badgeWidth + badgeGap : 0)

  const blocks = buildBlocks(content, { H: VH, nameColor, secondaryColor })

  const items = []
  blocks.forEach((block) => {
    if (block.kind === 'logo') {
      items.push({
        kind: 'logo',
        occupant: block.occupant,
        lineHeight: block.height,
        height: block.height,
        marginTop: block.gapBefore || 0
      })
      return
    }
    if (block.kind === 'roles') {
      const aligned = content.roleLayout !== 'inline' && content.textAlignment !== 'center'
      const font = { weight: block.weight, style: block.style, size: block.size, family: fontFamily, maxWidth: textMaxWidth, ligatures }
      const noteFont = { ...font, style: 'italic', size: block.noteSize }
      layoutRoles(block.roles, { aligned, font, noteFont }).forEach(({ segments, note }, index) => {
        const lineFont = note ? noteFont : font
        items.push({
          occupant: block.occupant,
          segments,
          size: lineFont.size,
          weight: lineFont.weight,
          style: lineFont.style,
          fill: block.fill,
          lineHeight: lineFont.size * (note ? block.noteLineHeightRatio : block.lineHeightRatio),
          marginTop: index === 0 ? (block.gapBefore || 0) : 0
        })
      })
      return
    }
    const lines = block.wrap
      ? wrapText(block.text, { weight: block.weight, style: block.style, size: block.size, family: fontFamily, maxWidth: textMaxWidth, ligatures })
      : [(block.text || '').toString()]
    lines.filter(Boolean).forEach((line, index) => {
      items.push({
        occupant: block.occupant,
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
      if (item.segments) item.segments = item.segments.map(segment => ({ ...segment, dx: segment.dx * shrink }))
      item.lineHeight *= shrink
      item.marginTop *= shrink
    })
  }

  // Centre the body's ink (cap top of the first line to the bottom of the last) between the
  // header band and the bottom of the window, so the white above and below it match.
  const totalHeight = rawHeight * shrink
  const first = items[0]
  const last = items[items.length - 1]
  const inkTop = first && first.kind !== 'logo'
    ? first.marginTop + first.size * 0.8 - measureInk(first, fontFamily, ligatures).ascent
    : (first?.marginTop || 0)
  const inkBottom = last && last.kind !== 'logo'
    ? totalHeight - last.lineHeight + last.size * 0.8 + measureInk(last, fontFamily, ligatures).descent
    : totalHeight
  const centredStart = HEADER_H + ((VH - HEADER_H) - (inkBottom - inkTop)) / 2 - inkTop
  let cursorY = Math.max(centredStart, HEADER_H + VH * 0.02)
  const bodyStart = cursorY

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

  // Centre each crest on the visible text bounds for its occupant. This keeps the badge
  // aligned with the complete name/title/contact block even when lines wrap or are hidden.
  const badgeYFor = (occupant, fallbackY) => {
    const occupantTexts = texts.filter(item => item.occupant === occupant && item.size)
    if (!occupantTexts.length) return fallbackY
    const top = Math.min(...occupantTexts.map(item => item.baseline - item.size * 0.8))
    const bottom = Math.max(...occupantTexts.map(item => item.baseline + item.size * 0.2))
    return (top + bottom - badgeHeight) / 2
  }
  const primaryBadgeY = badgeYFor('primary', fallbackPrimaryBadgeY)
  const secondaryBadgeY = badgeYFor('secondary', fallbackSecondaryBadgeY)
  const tertiaryBadgeY = badgeYFor('tertiary', fallbackTertiaryBadgeY)

  // Canvas-space top-left of the viewable window (bleed + frame inset).
  const originX = BLEED + VL
  const originY = BLEED + VT
  // The green header bleeds off the top and side canvas edges and runs down to the bottom of
  // the header band inside the viewable window, so the frame-covered margin reads as green.
  const headerBottom = originY + HEADER_H

  return {
    W, H, BLEED, CW, CH,
    VL, VR, VT, VB, VW, VH,
    PAD_X,
    header,
    HEADER_H,
    logoX,
    logoY,
    headerColor,
    texts,
    isRoom,
    showPrimaryAlumni,
    showSecondaryAlumni,
    showTertiaryAlumni,
    badgeX,
    badgeScale,
    primaryBadgeY,
    secondaryBadgeY,
    tertiaryBadgeY,
    originX,
    originY,
    headerBottom,
    // Design-space (window-relative) ink bounds of the body, for the margin guides.
    body: texts.length
      ? { inkTop: bodyStart + inkTop, inkBottom: bodyStart + inkBottom }
      : null
  }
}

export const SignArtwork = forwardRef(({ content, fontFamily = ARTWORK_FONT }, ref) => {
  const {
    W, H, BLEED, CW, CH, VW,
    header, logoX, logoY, headerColor, PAD_X,
    texts, showPrimaryAlumni, showSecondaryAlumni, showTertiaryAlumni,
    badgeX, badgeScale, primaryBadgeY, secondaryBadgeY, tertiaryBadgeY,
    originX, originY, headerBottom
  } = layoutSignArtwork(content, fontFamily)
  const ligatures = content.ligatures === 'on'

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${CW} ${CH}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      fontFamily={fontFamily}
      style={{ fontVariantLigatures: ligatures ? 'normal' : 'none' }}
      data-ligatures={ligatures ? 'on' : 'off'}
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
        {content.organization === 'nugss' ? (
          <NugssLogoMark transform={`translate(${logoX}, ${logoY}) scale(${header.scale})`} />
        ) : (
          <UnbcLogoMark
            transform={`translate(${logoX}, ${logoY}) scale(${header.scale})`}
            departmentText={content.departmentText}
            maxWidth={header.departmentMaxWidth}
            fontFamily={fontFamily}
          />
        )}

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
        ) : item.segments ? (
          // A role line: each column is its own <text> so the export's per-node font mapping
          // still applies.
          <React.Fragment key={index}>
            {item.segments.map((segment, segmentIndex) => (
              <text
                key={segmentIndex}
                x={content.textAlignment === 'center' && item.segments.length === 1 ? VW / 2 : PAD_X + segment.dx}
                y={item.baseline}
                textAnchor={content.textAlignment === 'center' && item.segments.length === 1 ? 'middle' : 'start'}
                fontFamily={fontFamily}
                fontSize={item.size}
                fontWeight={item.weight}
                fontStyle={item.style}
                fill={item.fill}
              >
                {segment.text}
              </text>
            ))}
          </React.Fragment>
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

        {showTertiaryAlumni && (
          <AlumniCrest
            occupant="tertiary"
            transform={`translate(${badgeX}, ${tertiaryBadgeY}) scale(${badgeScale})`}
          />
        )}
      </g>
    </svg>
  )
})

SignArtwork.displayName = 'SignArtwork'
