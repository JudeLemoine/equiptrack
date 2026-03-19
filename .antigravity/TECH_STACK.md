# EquipTrack Technical Stack

## Backend
- **Framework:** Node.js with Express & TypeScript.
- **ORM:** Prisma (Sole source of database access).
- **Database:** SQLite (Development) / PostgreSQL (Production).
- **Architecture:** Controller-Service pattern. Business logic lives in `/services`.

## Frontend
- **Framework:** React 18+ with TypeScript (Vite).
- **UI:** Material UI (MUI) components for data density; Tailwind CSS for layout.
- **State/API:** TanStack Query (React Query) for server state; Axios for API calls.
- **Navigation:** Dashboard-centric hub model (minimal sidebars).

## Styling Configuration
- **MUI Theme:** Update `createTheme` with the following palette:
  - `primary.main`: '#1A4889'
  - `secondary.main`: '#EBBA38'
  - `background.default`: '#F2F2F2'
- **Typography:** Standardize on `Roboto` or `Inter`. Ensure `Select` and `MenuItem` components have a minimum font-size of `0.875rem` to avoid "small text" issues.
- **Layout:** Use a central `<Container maxWidth="lg">` for both the Page Body and the Header Content to ensure horizontal alignment.

## Deployment & Security
- **Auth:** Role-Based Access Control (RBAC) enforced via server-side middleware.
- **Traceability:** Every write action must trigger an `AuditLog` entry.