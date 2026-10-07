import { useEffect, useState } from 'react'
import { INITIAL_SIGN_DATA } from '../sign/signData'
import { DEFAULT_ORGANIZATION, ORGANIZATIONS, switchOrganization } from '../sign/organizations'

const ORGANIZATION_KEY = 'unbc-door-sign:organization'

// The organization picked last in this browser, so a NUGSS editor starts on a NUGSS sign. Storage
// can be unavailable (private mode, blocked site data); then every visit starts on UNBC.
const readPreferredOrganization = () => {
  try {
    const key = window.localStorage.getItem(ORGANIZATION_KEY)
    return ORGANIZATIONS[key] ? key : DEFAULT_ORGANIZATION
  } catch (error) {
    return DEFAULT_ORGANIZATION
  }
}

export const useSignState = () => {
  const [signData, setSignData] = useState(() => ({
    ...INITIAL_SIGN_DATA,
    ...switchOrganization(readPreferredOrganization())
  }))

  // The app's colours follow the organization of the sign being edited (base.css, [data-org]).
  const organization = ORGANIZATIONS[signData.organization] ? signData.organization : DEFAULT_ORGANIZATION
  useEffect(() => {
    document.documentElement.dataset.org = organization
    try {
      window.localStorage.setItem(ORGANIZATION_KEY, organization)
    } catch (error) {
      // Not remembered for next time; this visit still uses it.
    }
  }, [organization])

  return [signData, setSignData]
}
