# Current Project State & Active Debt

## 🛑 Critical Blockers
- **Auth Regression (401 Unauthorized):** State-changing actions (POST/PUT) for All roles return 401 errors. This blocks Approvals, Issue Reporting, Equipment Edits, and more.
- **Broken Navigation (404 Not Found):** Field Worker Dashboard "View" button in 'My Requests' table points to `/equipment/{id}` instead of `/field/equipment/{id}`.
- **Missing Date Guard (400 Bad Request):** Initiating a "Check Out" from the Equipment Profile without pre-selected search dates results in a 400 error.

## ✅ Resolved / Verified (Cleared Debt)
- **Search Behavior:** Search fields now correctly start empty and only populate upon user interaction.
- **Admin Dashboard:** Red "Delete User" button has been successfully removed from the main table and relocated to the User Profile kebap menu.
- **Field Dashboard:** "Recommended available equipment" section has been removed.
- **Navigation HUB:** Dashboard-centered navigation is implemented across all roles.
- **Maintenance Servicing:** Automatic "Next Due Date" calculation and interval-based bypassing of manual date entry is functional and verified (200 OK).

## 🛠️ UI/UX & Remaining Debt
- **Functional Gap (Field Notes):** The Notes system is implemented for Admins but missing from the Field Worker's Equipment Profile view.
- **Table Header Alignment:** Table headers in Admin and Maintenance views have overlapping sort icons and inconsistent padding.
- **Native Date Pickers:** Search bar uses native browser date inputs; recommend replacement with controlled MUI components for consistent UX across devices.
- **Error Handling:** Backend failures (401/404/400) often lack descriptive user-facing toast messages, leading to "silent failures" in the UI.
- **Layout/Design:** Some inconsistencies with design & aesthetics, across pages that should be mostly similar in structure.
- **User Profile:** The mini dropdown menu that shows the "logout" function, should also show a "Profile" in it which brings them to that same users mini profile. 
-**Profile Functionality:** In each users personal profile, they should be able to change their avatar/icon from the list povided, resulting in their mini photo being displayed(always in the little circle in top right of the dashboard, but currently it only shows the user's initials).
-**Back Button:** Inconsistent occurances of "back" and "back to dashboard" buttons. All "back to dashboard" text must be replaced with "back", as the button should just bring you back to the previous page, not back to the dashboard everytime.
## Others
- **