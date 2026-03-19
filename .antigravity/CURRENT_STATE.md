# Current Project State & Debt

## Status of Logic
- **Missing Engine:** The core "Availability Engine" (overlap detection) is incomplete.
- **Status Desync:** Some routes allow moving a Rental to CHECKED_OUT without an assigned Unit.
- **Mock Leaks:** `products.controller.ts` and others still reference legacy mock data.

## Structural Debt
- **Folder Names:** `products.controller.ts` is misnamed; it should be `equipment.controller.ts` to align with PRD.
- **Frontend Placeholder:** Many pages in `features/` contain placeholder logic and mismatched navigation patterns from an earlier "fake store" iteration.

## Immediate Priority
1. Finalize `schema.prisma` to support `AuditLog`, `MaintenanceRecord`, and `IssueReport`.
2. Refactor Backend Services to use Prisma exclusively.
3. Build the backend Availability Engine.

---

# Current Polish Phase (Active Debt)

## UI/UX Bugs
- [ ] **Search Focus:** Typing in search boxes triggers a re-render that steals focus.
- [ ] **Table Overflow:** Mobile views require horizontal scrolling; need transition to Accordions.
- [ ] **Header Width:** Navbar contents are stretching full-width on ultra-wide monitors.
- [ ] **Legibility:** Admin filter dropdowns are using unreadably small font sizes.

## Logic & Data
- [ ] **Seed Data:** Purge equipment that is un-related to or would never be used at an on-land oilfields jobsite; replace numbered users with real names.
- [ ] **Admin Security:** Admins currently lack protection from being deleted by other Admins.
- [ ] **User Profiles:** Models need expansion for phone numbers, positions, and avatar icons.