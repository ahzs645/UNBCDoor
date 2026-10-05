import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SHARE_PARAM,
  buildSignShareUrl,
  decodeSignToken,
  encodeSignToken,
  hasSignShareToken,
  readSignFromUrl,
  removeSignShareToken
} from './signShare.js'
import { INITIAL_SIGN_DATA } from './signData.js'
import { signDataDiffers } from './signArchiveSearch.js'
import archive from '../../data/door-sign-archive.json' with { type: 'json' }

const EDITOR = 'https://ahzs645.github.io/UNBCDoor/'

const sample = {
  ...INITIAL_SIGN_DATA,
  signType: 'staff',
  name: 'Dr. Jane Doe',
  position: 'Associate Professor\nGeography',
  email: 'jane.doe@unbc.ca',
  showPhone: false,
  showDesignations: true,
  designations: ['PhD', 'P.Eng'],
  cardHolderType: 'building-10'
}

test('every production sign survives a share link round trip', async () => {
  for (const entry of archive.signs) {
    const signData = { ...INITIAL_SIGN_DATA, ...entry.signData }
    const decoded = await decodeSignToken(await encodeSignToken(signData))
    assert.equal(signDataDiffers(decoded, signData), false, entry.label)
  }
})

test('defaults are left out of the token, so an untouched sign is tiny', async () => {
  const blank = await encodeSignToken(INITIAL_SIGN_DATA)
  const filled = await encodeSignToken(sample)
  assert.ok(blank.length < 40, blank)
  assert.ok(filled.length > blank.length)
})

test('share URLs put the token in the hash and read back', async () => {
  const url = await buildSignShareUrl(sample, EDITOR)
  assert.ok(url.startsWith(`${EDITOR}#${SHARE_PARAM}=`), url)
  assert.equal(new URL(url).search, '')
  assert.equal(hasSignShareToken(url), true)

  const result = await readSignFromUrl(url)
  assert.equal(signDataDiffers(result.signData, sample), false)
})

test('a URL without a token reads as nothing to load', async () => {
  assert.equal(hasSignShareToken(EDITOR), false)
  assert.equal(await readSignFromUrl(`${EDITOR}#other=1`), null)
})

test('a truncated link is reported, not half-loaded', async () => {
  const url = await buildSignShareUrl(sample, EDITOR)
  const result = await readSignFromUrl(url.slice(0, -12))
  assert.ok(result.error instanceof Error)
  assert.equal(result.signData, undefined)
})

test('decoded links are vetted like imported JSON', async () => {
  const token = await encodeSignToken({ ...sample, signType: 'not-a-type', designations: ['PhD', 3] })
  const decoded = await decodeSignToken(token)
  assert.equal(decoded.signType, INITIAL_SIGN_DATA.signType)
  assert.deepEqual(decoded.designations, ['PhD'])
})

test('removing the token keeps the rest of the URL', () => {
  assert.equal(removeSignShareToken(`${EDITOR}#sign=abc`), EDITOR)
  assert.equal(removeSignShareToken(`${EDITOR}saved-signs/?x=1#sign=abc&y=2`), `${EDITOR}saved-signs/?x=1#y=2`)
})
