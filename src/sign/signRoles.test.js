import assert from 'node:assert/strict'
import test from 'node:test'
import { EMPTY_ROLE, separateRoleUnit, splitRoleTitle } from './signRoles.js'
import { emailFromName, resolveSignValues } from './signDefaults.js'

test('a role splits its position at separators only when asked to', () => {
  const title = 'Associate Professor | Faculty of Environment\nChair'
  assert.deepEqual(splitRoleTitle({ title, titleLayout: 'stacked' }), ['Associate Professor', 'Faculty of Environment', 'Chair'])
  assert.deepEqual(splitRoleTitle({ title, titleLayout: 'inline' }), ['Associate Professor | Faculty of Environment', 'Chair'])
})

test('separating moves the text after the bar into the department field', () => {
  assert.deepEqual(
    separateRoleUnit({ ...EMPTY_ROLE, title: 'Associate Professor | Faculty of Environment' }),
    { ...EMPTY_ROLE, title: 'Associate Professor', unit: 'Faculty of Environment', unitLayout: 'below' }
  )
  assert.deepEqual(
    separateRoleUnit({ ...EMPTY_ROLE, title: 'Director | Centre for Technology Adoption\nfor Aging', titleLayout: 'inline' }),
    { ...EMPTY_ROLE, title: 'Director', unit: 'Centre for Technology Adoption for Aging', unitLayout: 'beside' }
  )
  const withUnit = { ...EMPTY_ROLE, title: 'A | B', unit: 'C' }
  assert.equal(separateRoleUnit(withUnit), withUnit)
})

test('a blank email defaults to first.last@unbc.ca from the name', () => {
  assert.equal(emailFromName('Dr. Jane Doe'), 'jane.doe@unbc.ca')
  assert.equal(emailFromName('Prof. Thérèse  Mary O’Neil-Smith, PhD'), 'therese.oneil-smith@unbc.ca')
  assert.equal(emailFromName('Jane (Jay) Doe'), 'jane.doe@unbc.ca')
  assert.equal(emailFromName('Cher'), 'cher@unbc.ca')
  assert.equal(emailFromName('  '), '')

  assert.equal(resolveSignValues({ signType: 'faculty', name: 'Dr. Jane Doe' }).email, 'jane.doe@unbc.ca')
  assert.equal(resolveSignValues({ signType: 'faculty' }).email, 'john.smith@unbc.ca')
  assert.equal(resolveSignValues({ signType: 'staff', name: 'Jane Doe', email: 'jd@unbc.ca' }).email, 'jd@unbc.ca')
  assert.equal(resolveSignValues({ signType: 'staff', name2: 'John Roe' }).email2, 'john.roe@unbc.ca')
  assert.equal(resolveSignValues({ signType: 'lab', name: 'Jane Doe' }).email, '')
})

test('the placeholder position only shows until a role is typed', () => {
  assert.equal(resolveSignValues({ signType: 'faculty', roles: [] }).position, 'Professor')
  const values = resolveSignValues({ signType: 'faculty', roles: [{ ...EMPTY_ROLE }, { ...EMPTY_ROLE, note: 'Hub' }] })
  assert.equal(values.position, '')
  assert.deepEqual(values.roles.map(role => role.note), ['Hub'])
})
