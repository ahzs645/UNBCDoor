// Share links: the whole sign, compressed into the URL with @firstform/json-url (the
// ahzs645/json-url submodule, consumed the same way the Webforms app does).
//
// The token rides in the hash (`…/UNBCDoor/#sign=1.gz.<payload>.<checksum>`), so names and email
// addresses never reach a server log, and a link opens straight into the editor with no backend.
//
// Imported by path rather than by package name: an npm `file:` dependency on the submodule trips
// an npm arborist crash on json-url's dev tooling. `npm run vendor:build` (run automatically
// before dev, build and test) builds dist/ from the submodule.
import createWebShareEngine from '../../vendor/json-url/dist/web-share.js'
import { INITIAL_SIGN_DATA } from './signData.js'
import { normalizeSignData } from './signArchive.js'

export const SHARE_PARAM = 'sign'
const SHARE_LOCATION = 'hash'

// Long links get cut off by chat apps and email clients; signs come in well under this.
const MAX_SHARE_URL_LENGTH = 4000

// Frozen short names for the stored fields. Never renumber or reuse an entry — links already in
// the wild decode through this table. A field added later can simply be left out (unmapped keys
// pass through unchanged) or appended with a new short name.
const SHORT_KEYS = {
  signType: 't',
  departmentType: 'dt',
  mainDepartment: 'dm',
  subDepartment: 'ds',
  subSubDepartment: 'dss',
  name: 'n',
  position: 'p',
  tagline: 'tl',
  email: 'e',
  emailLabel: 'el',
  phone: 'ph',
  phoneLabel: 'pl',
  cellPhone: 'c',
  cellPhoneLabel: 'cl',
  showEmail: 'se',
  showPhone: 'sp',
  showCellPhone: 'sc',
  roomName: 'r',
  contactName: 'cn',
  showSecondOccupant: 'so',
  secondaryEntryType: 'st',
  name2: 'n2',
  position2: 'p2',
  tagline2: 'tl2',
  email2: 'e2',
  phone2: 'ph2',
  cellPhone2: 'c2',
  showEmail2: 'se2',
  showPhone2: 'sp2',
  showCellPhone2: 'sc2',
  roomName2: 'r2',
  contactName2: 'cn2',
  cardHolderType: 'h',
  showAlumni: 'a',
  showAlumni2: 'a2',
  alumniCrestSize: 'acs',
  alumniCrestSpacing: 'acp',
  headlineWeight: 'hw',
  roomNameStyle: 'rs',
  positionLayout: 'pyl',
  positionSize: 'psz',
  designationLayout: 'dl',
  departmentWrap: 'dw',
  twoPersonSpacing: 'tps',
  contentSize: 'csz',
  contentSpacing: 'csp',
  contentWidth: 'cw',
  textAlignment: 'ta',
  contactLayout: 'cyl',
  contactSize: 'ctz',
  bodyTextMode: 'btm',
  roomContactGrouping: 'rcg',
  organizationLogo: 'ol',
  showDesignations: 'sd',
  designations: 'd',
  roles: 'ro',
  roles2: 'ro2',
  roleLayout: 'rly',
  organization: 'org',
  ligatures: 'lg',
  showThirdOccupant: 'so3',
  name3: 'n3',
  tagline3: 'tl3',
  roles3: 'ro3',
  email3: 'e3',
  phone3: 'ph3',
  cellPhone3: 'c3',
  showEmail3: 'se3',
  showPhone3: 'sp3',
  showCellPhone3: 'sc3',
  showAlumni3: 'a3'
}

// Encode order: drop every field still at its default (most of a sign), then shorten the keys.
// Decode reverses both, and normalizeSignData() vets the result like any imported JSON — a link
// is untrusted input.
const engine = createWebShareEngine({
  version: '1',
  checksum: true,
  // Stream codecs every current browser can decode (no brotli: a link made in one browser must
  // open in all of them). The engine keeps whichever is shortest.
  codecs: ['lz', 'gz', 'df', 'zl', 'raw'],
  transforms: [
    createWebShareEngine.createDefaultsTransform({ rules: [{ defaults: INITIAL_SIGN_DATA }] }),
    createWebShareEngine.createKeyMapTransform({ keys: SHORT_KEYS })
  ]
})

const urlOptions = { param: SHARE_PARAM, location: SHARE_LOCATION }

export const encodeSignToken = (signData) => engine.compress({ ...INITIAL_SIGN_DATA, ...signData })

export const decodeSignToken = async (token) =>
  normalizeSignData(await engine.decompress(token, { deURI: true }))

// The editor's address with this sign in the hash. Throws if the link would be too long to share
// safely.
export const buildSignShareUrl = (signData, editorUrl) =>
  engine.compressToUrl({ ...INITIAL_SIGN_DATA, ...signData }, editorUrl, {
    ...urlOptions,
    maxUrlLength: MAX_SHARE_URL_LENGTH
  })

const hashParams = (href) => new URLSearchParams(new URL(href).hash.replace(/^#/, ''))

export const hasSignShareToken = (href) => Boolean(hashParams(href).get(SHARE_PARAM))

// Reads a shared sign out of a URL: null when the URL carries none, otherwise the sign — or an
// error explaining why the link could not be opened (usually a link cut short when it was pasted).
export const readSignFromUrl = async (href) => {
  if (!hasSignShareToken(href)) return null
  try {
    return { signData: normalizeSignData(await engine.decompressFromUrl(href, urlOptions)) }
  } catch (error) {
    return { error }
  }
}

// The same URL without the share token, so the address bar stops pointing at the original once
// the sign has been loaded and edited.
export const removeSignShareToken = (href) => {
  const url = new URL(href)
  const params = hashParams(href)
  params.delete(SHARE_PARAM)
  const rest = params.toString()
  url.hash = rest ? rest : ''
  return url.toString().replace(/#$/, '')
}
