// Role permissions. The backend checks every request against these (authorize() in utils/authMiddleware.js),
// and the same list is sent to the frontend at login so it can hide what an account cannot do.
//
// 1.4.2 Secretary: certification management, read-only residents, household viewing and editing.
// 2.3.2 BHW (Barangay Health Worker): register, view, and update residents and households.
//       No certification permissions, so the BHW cannot open or change certification requests.
// A permission that is not listed for a role is denied. Nothing else grants it.
export const ROLES = {
  secretary: {
    label: 'Barangay Secretary',
    perms: ['cert:view'],
  },
}

export const permsOf = (role) => ROLES[role]?.perms ?? []
export const labelOf = (role) => ROLES[role]?.label ?? role
