// The organizations a sign can be printed for. The organization picks the logo in the header band,
// the band's colour, and the app's own colours; everything else on the sign works the same way.
//
// UNBC is the university lockup with its department line (see headerGeometry.js). NUGSS — the
// Northern Undergraduate Student Society — prints its own logo on a cerulean band and has no
// department line. Its production door signs ("Final V1" artboards) differ from UNBC's in the
// body as well: the position and contact lines share one size, and the text column runs wider.
// Switching a sign to NUGSS applies those as its starting appearance (`styleDefaults`), which can
// still be changed under Appearance.

export const ORGANIZATIONS = {
  unbc: {
    label: 'UNBC',
    fullName: 'University of Northern British Columbia',
    // The rendered PMS build sampled from the production print files.
    headerColor: '#2a634d',
    hasDepartments: true,
    styleDefaults: {
      bodyTextMode: 'hierarchy',
      contactSize: 'standard',
      contentWidth: 'standard'
    }
  },
  nugss: {
    label: 'NUGSS',
    fullName: 'Northern Undergraduate Student Society',
    // Cerulean, from the NUGSS logo guidelines' colour palette.
    headerColor: '#0579ba',
    hasDepartments: false,
    styleDefaults: {
      bodyTextMode: 'uniform',
      contactSize: 'largest',
      contentWidth: 'wide'
    }
  }
}

export const ORGANIZATION_KEYS = Object.keys(ORGANIZATIONS)
export const DEFAULT_ORGANIZATION = 'unbc'

export const resolveOrganization = (key) => ORGANIZATIONS[key] || ORGANIZATIONS[DEFAULT_ORGANIZATION]

// The change to a sign's data that moves it to another organization: the organization itself
// and that organization's starting appearance.
export const switchOrganization = (key) => (
  ORGANIZATIONS[key] ? { organization: key, ...ORGANIZATIONS[key].styleDefaults } : {}
)
