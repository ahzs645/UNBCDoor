// UNBC brand kit — reusable logo generator + department selector.
// Self-contained (assets imported as raw SVG, own CSS); structured to lift into a package later.

// Logo generator
export { UnbcLogoMark } from './logo/UnbcLogoMark'
export { AlumniCrest } from './logo/AlumniCrest'
export { splitDepartmentText, LOGO_VIEWBOX } from './logo/logoText'

// Department selector
export { DepartmentSelector } from './departments/DepartmentSelector'
export { DepartmentSelectionDisplay } from './departments/DepartmentSelectionDisplay'
export { departmentTypes } from './departments/departmentData'
export {
  searchDepartmentHierarchy,
  getDepartmentDisplayName,
  hasDepartmentSelection,
  toDepartmentSelection
} from './departments/hierarchy'
