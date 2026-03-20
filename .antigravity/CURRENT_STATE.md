# Current Project State & Active Debt

## 🛑 Critical Blockers
*None — all blockers resolved.*

## ✅ Resolved / Verified (Cleared Debt)

### Critical Blockers (Session 1)
- **Auth Regression (401 Unauthorized):** Fixed `apiClient.ts` to automatically attach `Authorization` and `x-user-id` headers on all requests.
- **Broken Navigation (404 Not Found):** Field Worker "View" button corrected to route to `/field/equipment/{id}`.
- **Missing Date Guard (400 Bad Request):** Check-out from Equipment Profile now passes search dates from location state.

### Critical Blockers (Session 2 — Field/Maintenance E2E)
- **Mark Serviced:** `EquipmentProfilePage.tsx` button had no `onClick` handler — wired to `markEquipmentServiced` mutation with dialog.
- **Issue Report Title:** Backend used hardcoded severity string instead of user-provided `title` field — now uses `title`.
- **Back Buttons:** All 6 "Back to Dashboard" buttons refactored to `navigate(-1)` with label "Back".

### Critical Blockers (Session 3 — Admin E2E)
- **Rental Approval 404:** `fakeAuth` middleware set `req.user.id = 1` (invalid CUID). Added `x-user-id` header fallback in `PATCH /api/rentals/:id/status`.
- **Admin Delete Admin UI:** `UserProfilePage.tsx` showed Delete button for admin-to-admin profiles. Added `user.role !== 'admin'` guard.

### UI/UX Debt (Session 4 — Aesthetic Audit)
- **Native Date Pickers:** All 7 native `<input type="date">` fields replaced with MUI `<TextField type="date">` across `EquipmentForm`, `RentalRequestForm`, `MaintenanceEquipmentPage`, `EquipmentProfilePage`, and `FieldEquipmentPage`.
- **Error Handling:** Global error toast added to `apiClient.ts` — every non-2xx response fires a descriptive `toast.error()` with server message extraction and status-based fallbacks.
- **Profile Dropdown:** `AppLayout.tsx` now includes a "Profile" link in the header dropdown, navigating to `/profile`.
- **Avatar Display:** Header avatar circle now shows the user's chosen icon (hardhat/wrench/truck/clipboard/gear) instead of just initials. Queries user data on mount to stay in sync.
- **Table Header Alignment:** Consistent `h-12 px-4 py-2` padding, sort icons in `flex-shrink-0` container, non-sortable headers match alignment.
- **Back Button:** Last remaining "Back to dashboard" in `NotFoundPage.tsx` changed to "Back to home".
- **Visual Polish:** Global CSS enhanced with font smoothing, 150ms transition defaults for interactive elements, table row hover effects, consistent cell padding, MUI input border overrides matching slate palette, and Sonner toast font inheritance.

### Previously Resolved
- **Search Behavior:** Search fields start empty and populate only on user interaction.
- **Admin Dashboard:** Delete User button removed from table, relocated to User Profile kebab menu.
- **Field Dashboard:** "Recommended available equipment" section removed.
- **Navigation HUB:** Dashboard-centered navigation implemented across all roles.
- **Maintenance Servicing:** Automatic "Next Due Date" calculation and interval-based bypassing functional.
- **Field Notes:** Notes system extended to Field Worker's Equipment Profile view.

## 🛠️ UI/UX & Remaining Debt
*Clean slate — no known debt remaining.*

## Others
*No outstanding items.*