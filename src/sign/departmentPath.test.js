import assert from 'node:assert/strict'
import test from 'node:test'
import { departmentTypes } from '../../vendor/unbc-logo/src/departments/departmentData.js'
import {
  departmentChildren,
  findDepartmentPath,
  resolveDepartmentPath,
  selectDepartmentLevel
} from './departmentPath.js'

const FOOD_PATH = [
  'administrative',
  'Vice-President, Finance and Administration',
  'Hospitality Services',
  'Food Services'
]

test('lists the choices one level down, and nothing under a leaf', () => {
  assert.deepEqual(departmentChildren(departmentTypes, []), ['academic', 'administrative'])
  assert.ok(departmentChildren(departmentTypes, FOOD_PATH.slice(0, 3)).includes(FOOD_PATH[3]))
  assert.deepEqual(departmentChildren(departmentTypes, FOOD_PATH), [])
  assert.deepEqual(departmentChildren(departmentTypes, ['administrative', 'President', 'Athletics']), [])
})

test('finds a department saved by its name alone', () => {
  assert.deepEqual(findDepartmentPath(departmentTypes, 'Food Services'), FOOD_PATH)
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { mainDepartment: 'Food Services' }), {
    path: FOOD_PATH,
    custom: ''
  })
  assert.equal(findDepartmentPath(departmentTypes, 'administrative'), null)
})

test('keeps a full path as stored, and reports a name that is not in the list', () => {
  const selection = selectDepartmentLevel(FOOD_PATH, 3, FOOD_PATH[3])
  assert.deepEqual(resolveDepartmentPath(departmentTypes, selection), { path: FOOD_PATH, custom: '' })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { departmentType: 'academic' }), { path: ['academic'], custom: '' })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, { mainDepartment: 'Northern Medical Program' }), {
    path: [],
    custom: 'Northern Medical Program'
  })
  assert.deepEqual(resolveDepartmentPath(departmentTypes, {}), { path: [], custom: '' })
})

test('a sign saved before its department moved finds it at its new place', () => {
  // NALS sat under the Office of Research and Innovation before the logo kit moved it under the
  // Provost with the other student service departments.
  const saved = {
    departmentType: 'administrative',
    mainDepartment: 'Vice-President, Research and Innovation',
    subDepartment: 'Office of Research and Innovation',
    subSubDepartment: 'Northern Analytical Laboratory Services'
  }
  assert.deepEqual(resolveDepartmentPath(departmentTypes, saved), {
    path: ['academic', 'Provost and Vice-President, Academic', 'Northern Analytical Laboratory Services'],
    custom: ''
  })
})

test('choosing a level keeps the ones above and clears the ones below', () => {
  assert.deepEqual(selectDepartmentLevel(FOOD_PATH, 2, 'Facilities'), {
    departmentType: 'administrative',
    mainDepartment: 'Vice-President, Finance and Administration',
    subDepartment: 'Facilities',
    subSubDepartment: ''
  })
  assert.deepEqual(selectDepartmentLevel(FOOD_PATH, 3, ''), {
    departmentType: 'administrative',
    mainDepartment: 'Vice-President, Finance and Administration',
    subDepartment: 'Hospitality Services',
    subSubDepartment: ''
  })
})
