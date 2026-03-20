# Current Project State & Active Debt

## Status of Backend Logic
- **Maintenance Workflow Broken:** The "Mark Serviced" flow asks for a manual date even when an interval is configured, and the action fails entirely upon submission.
- **Notes System Missing:** API endpoints and DB logic for adding/deleting Notes tied to Equipment objects are incomplete for Admin, Maintenance, and Field Worker roles.

## UI/UX & Frontend Debt
- **Search Behavior:** Search fields currently preload massive lists. They must start empty and only populate upon typing.
- **Data Presentation:** Equipment availability grid needs to be converted to a list view. Tables/Lists need more left/right padding on column headers.
- **Admin Dashboard:** Action buttons (View, Approve, Reject, Mark Returned, Checkout) lack consistent styling and wrap poorly on medium screens. The "Delete User" button is too aggressive and needs to be moved inside a User Profile view under a "..." menu.
- **Field Worker Dashboard:** The "recommended available equipment" section needs to be completely removed.
- **Equipment Detail Navigation:** Redundant "Back" button beside "Mark Serviced" needs removal. Standardize "Back" to return to previous page, not always Dashboard.
- **Empty States:** Missing placeholder text (e.g., "No recent history on file") in Recent History and Service Logs.
- **Login Styling:** Background should be white; the button container should be the brand navy color.