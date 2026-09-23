import { getDepartmentDisplayName } from '@unbc/logo'
import { BLEED_INCHES } from './signConstants'
import { resolveSignValues } from './signDefaults'
import { resolveCardHolderGeometry } from './signGeometry'

// Turns the editor's sign data into the content object <SignArtwork> draws. The main preview,
// the phone/tablet live preview, both exporters, and the archive review viewer all build their
// artwork from here, so they can never disagree about what is on the sign.
export const buildSignContent = (signData, { cardHolders = {}, bleed = BLEED_INCHES } = {}) => {
  const selectedCardHolder = signData.cardHolderType ? cardHolders[signData.cardHolderType] : null
  const { insertSize, viewableOffset } = resolveCardHolderGeometry(selectedCardHolder)
  const values = resolveSignValues(signData)
  const supportsAlumni = signData.signType === 'faculty' || signData.signType === 'staff'

  return {
    signType: signData.signType || 'faculty',
    departmentText: getDepartmentDisplayName(signData),
    name: values.name,
    credentials: (signData.showDesignations && signData.designations?.length > 0)
      ? signData.designations.join(', ')
      : '',
    position: values.position,
    tagline: values.tagline,
    email: values.email,
    emailLabel: signData.emailLabel,
    phone: values.phone,
    phoneLabel: signData.phoneLabel,
    cellPhone: values.cellPhone,
    cellPhoneLabel: signData.cellPhoneLabel,
    showEmail: signData.showEmail,
    showPhone: signData.showPhone,
    showCellPhone: signData.showCellPhone,
    roomName: values.roomName,
    contactName: values.contactName,
    showSecondOccupant: signData.showSecondOccupant,
    secondaryEntryType: signData.secondaryEntryType,
    name2: values.name2,
    position2: values.position2,
    tagline2: values.tagline2,
    email2: values.email2,
    phone2: values.phone2,
    cellPhone2: values.cellPhone2,
    showEmail2: signData.showEmail2,
    showPhone2: signData.showPhone2,
    showCellPhone2: signData.showCellPhone2,
    roomName2: values.roomName2,
    contactName2: values.contactName2,
    showAlumni: supportsAlumni && signData.showAlumni,
    showAlumni2: supportsAlumni && signData.showAlumni2,
    alumniCrestSize: signData.alumniCrestSize,
    alumniCrestSpacing: signData.alumniCrestSpacing,
    headlineWeight: signData.headlineWeight,
    roomNameStyle: signData.roomNameStyle,
    positionLayout: signData.positionLayout,
    positionSize: signData.positionSize,
    designationLayout: signData.designationLayout,
    twoPersonSpacing: signData.twoPersonSpacing,
    contentSize: signData.contentSize,
    contentSpacing: signData.contentSpacing,
    contentWidth: signData.contentWidth,
    textAlignment: signData.textAlignment,
    contactLayout: signData.contactLayout,
    contactSize: signData.contactSize,
    bodyTextMode: signData.bodyTextMode,
    roomContactGrouping: signData.roomContactGrouping,
    organizationLogo: signData.organizationLogo,
    insert: insertSize,
    viewable: viewableOffset,
    bleed
  }
}
