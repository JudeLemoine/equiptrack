# Current Project State & Active Debt

## 🛑 Critical Blockers
*None — core routing, auth, and availability engine are stable.*

## ⚙️ Active Feature & Logic Debt (Sprint 5)
- **Unit ID Auto-Generation:** The system currently uses manual "QR Code" entry. This must be renamed to "Unit ID" system-wide and auto-generated/auto-incremented during equipment creation (e.g., based on Category + Type + Unit Number).
- **Equipment List Performance & UX:** The Admin "All Equipment" page loads all units simultaneously, causing lag. It needs search-to-load functionality (similar to the Field view) or an Accordion grouping by Equipment Type to reduce clutter.
- **Form Constraints:** In the Admin "Add Equipment" modal, 'Category' is a free-text string. It must be a controlled dropdown select.
- **Maintenance Reporting:** The "Mark Serviced" modal lacks context gathering. It needs a "Routine" vs. "Other" checkbox, with a conditional text field for descriptions when "Other" is selected.
- **Notes Permissions:** - Admins currently cannot add, edit, or delete notes.
  - Maintenance users cannot add or delete "Technician Notes" on the equipment profile.

## 🛠️ UI/UX & Aesthetic Debt
- **Global Header Avatar:** The avatar/icon picker saves in the profile settings, but the global top-right header bubble does not visually update to reflect the choice.
- **Missing Navigation:** The "My Profile" page is missing the standard relative "Back" button (`useNavigate(-1)`).
- **Admin Equipment Cards:** The kebap ("...") menu is inefficient. Replace it with a "View Profile" button and an "Edit" icon button. Move the "Delete" action inside the Edit modal. 
- **Redundant Buttons:** The "Edit asset" button in the top right of the Admin Equipment Profile page is broken and redundant; it must be removed.
- **Maintenance UI:** - "Move to maintenance" button text is white-on-white/invisible. Needs standard button styling.
  - Severity pills (LOW, HIGH, CRITICAL) have inconsistent widths. They must be uniform in size.
  - Reported Issues queue is missing a sortable "Date/Time" column.
- **Filter Padding:** The "Status" filter dropdown needs more right-padding so the chevron doesn't crowd the edge.
- **Profile Polish:** Add a dummy "Update Email" button to the user profile (UI only, no backend required yet).