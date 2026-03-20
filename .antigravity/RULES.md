# Engineering & UX Rules

## General
- **Strict Types:** No `any`. Use Prisma-generated types or explicit interfaces.
- **No Mocks:** Remove all in-memory store logic. Every fetch must hit a Prisma service.
- **Audit Requirement:** Every status change (Rental or Equipment) must record an entry in the `AuditLog`.

## Backend Logic
- **Service Isolation:** Controllers handle requests/responses; Services handle business logic (e.g., `AvailabilityService` handles overlap detection).
- **Unique Assets:** Asset IDs (e.g., EXC-001) must be unique and incremented logically per Type.
- **Atomic Ops:** Use Prisma Transactions for status changes that affect multiple tables (e.g., Approving a Rental should update both the Rental status and the EquipmentUnit status).
- **API Integrity & Auth:** All protected routes must enforce role-based middleware. Frontend API clients must consistently attach authentication headers on every request, especially after a user role switch.

## UI/UX & Branding Rules

### 1. Branding & Colors
- **Primary Navy:** `#1A4889` (Use for Headers, Primary Buttons).
- **Secondary Gold:** `#EBBA38` (Use for Accents, Icons, Warning States).
- **Background Off-White:** `#F2F2F2` (Use for Page Backgrounds).

### 2. Responsive Data Tables & Mobile First
- **Mobile Rule:** For screens < 768px, standard tables are FORBIDDEN.
- **Implementation:** Tables must transform into **Accordion Lists**.
- **Accordion UI:** Left-aligned Equipment Name, Right-aligned Chevron. Expand to show full details.
- **Role-Based Views:** Field Worker views must prioritize Accordions/Cards.

### 3. Search Focus & Behavior
- **Focus Rule:** Search inputs must NEVER lose focus during typing.
- **Implementation:** Do not declare functional components inside other components. Ensure stable `key` props and controlled state to prevent full re-mounts on `onChange`.
- **Empty Default State:** Search and filter lists must **start empty**. Do not fetch or display massive data dumps on initial load. Data should only populate once the user begins typing or applies specific filter criteria.

### 4. Layout Constraints
- **Header/Navbar:** The bar remains full-width, but its **Content** (Logo, Profile, Title) must be padded/margined to match the `max-width` of the main page body.
- **Typography:** Admin dashboard filter text must be highly legible (minimum 14px). No "tiny text" in dropdowns.
- **Table/List Formatting:** All table column headers and list titles must have generous horizontal padding (e.g., `px-4`). Text and sort icons must use flexbox alignment to prevent text overlap or layout shifts when resizing.

### 5. General UX Principles
- **The Hub Pattern:** The Dashboard is the primary navigation. Use Card-based "Quick Actions" for primary tasks.
- **Readability:** Human-readable histories must be derived from `AuditLog` and `Notes`.