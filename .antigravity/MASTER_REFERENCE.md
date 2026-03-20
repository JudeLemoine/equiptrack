# EquipTrack — Full Product, System, and Technical Definition

## 1. Product Identity

| Property | Definition |
| :--- | :--- |
| **Product Name** | EquipTrack |
| **Product Type** | Role-based equipment operations platform for large industrial organizations. |
| **Product Purpose** | Managing the full operational lifecycle of heavy equipment and industrial assets across multiple company-controlled sites. Integrates tracking, scheduling, approvals, rentals, maintenance, issue reporting, and auditability. |

### Target Operating Environments
- Oilfield and oil sands contractors
- Mining companies
- Heavy civil and industrial construction firms
- Refineries and plant contractors
- Utilities and power generation
- Nuclear plant contractors and shutdown/outage teams

### Core Operational Reality
- Multi-unit tracking of identical equipment types.
- Future-dated booking (no double-booking).
- Maintenance directly impacts availability.
- Role-based responsibilities (Field, Maintenance, Admin).
- Real-time status over assumptions.

---

## 2. The Core Problem EquipTrack Solves
Industrial equipment management breaks down due to:
- Lack of visibility into true availability.
- Double-booking conflicts.
- Disconnect between project planning and maintenance deadlines.
- Informal issue reporting.
- Fragmented equipment history.
- Lack of audit trails for approvals/exceptions.
- Vanity metrics over operational actions.

**Solution:** Treat each physical asset as a real operational entity with identity, state, location, maintenance condition, and availability windows.

---

## 3. Core Product Philosophy

### 3.1 Equipment is not just a category
Distinguish between **Equipment Type** (e.g., Hydraulic Excavator) and **Equipment Unit** (e.g., EXC-001). Every unit has its own unique status, history, and audit trail.

### 3.2 Time matters
Availability depends on time. A unit may be free today but reserved next week or hitting a maintenance deadline. The system is scheduling-aware.

### 3.3 Maintenance is not a separate world
Maintenance directly affects operations. Flagged, unsafe, or in-service units are removed from the booking pool.

### 3.4 Action-driven, not vanity-driven
Dashboards show what needs to be done: Pending approvals, overdue returns, maintenance conflicts.

### 3.5 Role-specific workflows
Field workers, maintenance teams, and admins have unique interfaces tailored to their specific tasks.

### 3.6 The dashboard is the hub
Primary navigation happens through the dashboard. Heavy sidebars are avoided in favor of direct task access.

---

## 4. Product Scope
- User/Role management
- Equipment Type/Unit management
- Site/Location management
- Search and Filtering (Time & Location aware)
- Rental Request & Approval workflows
- Checkout & Return workflows
- Availability Engine (Overlap detection)
- Maintenance Scheduling & Records
- Issue Reporting & Communication (Notes)
- Equipment Profile/History views
- Audit Logs & Admin Oversight

---

## 5. User Roles and Profiles (Updated)

Each user now possesses a **Mini Profile** containing:
- **Identity:** Full Name (No more "Admin 4"), Position/Title.
- **Contact:** Email, Phone Number.
- **Avatar:** Choice of uploaded photo, selection from Industrial Icon set (Hard-hat, Wrench, Truck), or blank.

### 5.1 Field Worker
- **Needs:** Search by date/location, request for future use, track request status, report issues, view current checkouts, **and add operational notes to equipment they are actively renting or returning.**
- **Does NOT Need:** Admin control, raw asset management, fleet-wide maintenance queues.
- **Workflow:** Dashboard -> Search -> Request -> Track -> Return/Note.

### 5.2 Maintenance User
- **Needs:** Queues for "Due Soon," "Overdue," and a dedicated **"Reported Issues" triage queue**; update statuses, log work, and rely on auto-calculated next maintenance dates based on intervals.
- **Does NOT Need:** Rental browsing, job planning tools, worker-specific views.
- **Workflow:** Dashboard -> Maintenance Queue / Reported Issues -> Triage / Update Record -> Restore Availability.


### 5.3 Admin
- **Needs:** Approve/Reject requests, resolve conflicts, oversee exceptions, bulk-create units, inspect audit trails.
- **Does NOT Need:** Vanity metrics.
- **Workflow:** Dashboard -> Pending Actions -> Resolution/Approval.

### 5.4 Admin Permissions Logic
- Admins can delete Field and Maintenance users.
- **Constraint:** Admins are strictly prohibited from deleting other Admins. The UI must hide the "Delete" action for Admin-to-Admin interactions.

---

## 6. Core Domain Model

### 6.1 Equipment Category
Broad classification (e.g., Earthmoving, Lifting, Power).

### 6.2 Equipment Type
Specific class/model (e.g., Hydraulic Excavator). Includes manufacturer, model, and maintenance defaults.

### 6.3 Equipment Unit
The physical machine (e.g., EXC-001). Includes asset tag, serial number, status, and history.

### 6.4 Location
Real physical company site (e.g., Fort McMurray Main Yard).

### 6.5 Rental
Time-bound usage record. Tracks requester, assigned unit, status (PENDING to RETURNED), and job details.

### 6.6 Maintenance Record
Log of work or need for a specific unit. Tracks trigger, technician, status, and completion.

### 6.7 Issue Report
Problem submitted by field workers. Tracks severity and resolution status.

### 6.8 Note
Attributed, timestamped human notes tied to any object (Rental, Unit, etc.).

### 6.9 Audit Log
Traceable event log of all significant system actions.

---

## 7. Rental Lifecycle

### 7.1 Statuses
- `PENDING`: Awaiting review.
- `APPROVED`: Approved in principle.
- `RESERVED`: Unit assigned and blocked for dates.
- `CHECKED_OUT`: Actively in use.
- `RETURNED`: Lifecycle complete.
- `OVERDUE`: Past return date.
- `REJECTED`: Request denied.
- `CANCELLED`: Request withdrawn.

### 7.3 Unit Assignment
Assignment happens at **Approval Time** to ensure real-time availability check before commitment.

---

## 8. Equipment Status Lifecycle
- `AVAILABLE`: Operational and schedulable.
- `RESERVED`: Assigned to future booking.
- `CHECKED_OUT`: Currently in use.
- `OVERDUE`: Return window missed.
- `DUE_SOON_MAINTENANCE`: Safe for use but limits booking duration.
- `IN_MAINTENANCE`: Actively unavailable.
- `OUT_OF_SERVICE`: Unusable.

---

## 9. Availability and Scheduling Logic
A unit is available ONLY if:
1. It is active and not Out of Service.
2. It is not in maintenance during the requested period.
3. There are no overlapping reservations/checkouts.
4. Requested duration does not exceed maintenance deadlines.

**Overlap Detection:** Prevents two rentals from occupying the same unit during intersecting time windows.

---

## 10. Maintenance System
- Supports routine, issue-triggered, and breakdown maintenance.
- Provides queues: Due Soon, Overdue, Open, In Progress.
- Interaction: Maintenance status automatically updates unit availability.

---

## 11. Issue Reporting & Triage
- **Trigger:** Field-triggered attention for damage, safety concerns, or malfunctions via the Equipment Profile.
- **Severity levels:** LOW, MEDIUM, HIGH, CRITICAL.
- **Triage Workflow:** Issues flow directly to the Maintenance Dashboard's "Reported Issues" queue. Maintenance users can either:
  1. **Move to Maintenance:** Automatically updates equipment status to `IN_MAINTENANCE` or `DUE_SOON` and generates a work record.
  2. **Dismiss Issue:** Deletes/closes the report and restores the unit to `AVAILABLE`.
---

## 12. Equipment Profile Page
The single source of truth for a unit, showing:
- Identity (Asset Tag, Serial).
- Status & Location.
- Dates (In-service, Maintenance due).
- History (Rentals, Maintenance, Issues, Audit Trail).

---

## 13. Industry Scope (Pivot)
- **Primary Focus:** Heavy Industrial, Oilfield, and Oil Sands Operations.
- **Excluded Assets:** Deep-sea, consumer-grade, or general warehouse equipment are removed to ensure operational relevance.

---

## 14. Navigation & UI Model (Updated)
- **Pattern:** Dashboard as Hub.
- **Search Behavior:** Search and filter lists must **start empty** to prevent massive data dumps. Data is only fetched/displayed upon user input.
- **Back Actions:** Every sub-page must include a "Back" button utilizing relative history routing (e.g., `useNavigate(-1)`) to return the user to their exact previous screen, rather than force-routing them back to the dashboard.
---

## 15. Admin Workflow
- **Creation:** Add Types (models) and Units (physical machines).
- **Bulk Creation:** Generate units with auto-incremented asset tags based on type codes (e.g., EXC-003, EXC-004).
- **Permissions:** Admins can delete Field and Maintenance users. **Constraint:** Admins are strictly prohibited from deleting other Admins. The UI must hide the "Delete" action for Admin-to-Admin interactions.

---

## 16. Dashboards by Role
- **Field:** Request (Empty by default until searched), My Requests, My Rentals.
- **Maintenance:** Due Soon, Overdue, **Reported Issues (Triage Queue)**, Completed.
- **Admin:** Approvals, Overdue Returns, Conflicts, Asset Management, User Management

---

## 17. Auditability & Traceability
Every action is attributable (Who, What, Affected Record, When). Essential for safety and accountability in industrial environments.

---

## 18. Notes System
Nuanced communication tied to Units, Rentals, or Issues. Must include Author, Role, and Timestamp.

---

## 19. Reporting
Focus on operational metrics (Pending Approvals, Overdue Returns, Available Quantities) rather than generic vanity counts.

---

## 20. Technical Stack
- **Frontend:** React, TypeScript, Material UI.
- **Backend:** Node.js, Express, TypeScript.
- **ORM:** Prisma.
- **Database:** SQLite (Dev) / PostgreSQL (Future).

---

## 21. Database Schema Summary
Models include: `User`, `Location`, `EquipmentCategory`, `EquipmentType`, `EquipmentUnit`, `Rental`, `MaintenanceRecord`, `IssueReport`, `Note`, `AuditLog`.

---

## 22. Required Business Rules
- **No Double-booking:** Block overlapping time windows.
- **Maintenance Blocking:** Maintenance dates limit or block booking windows.
- **Server-side Enforcement:** Permissions and status transitions validated on the backend.
- **Unique Asset IDs:** Incremental, type-based unique identifiers.

---

## 24. Current State (As of Capstone Final Polish)
- **Completed:** Prisma schema is active. Mock data has been purged. The Availability Engine successfully detects overlaps and blocks double-booking. Role-based dashboards (Admin, Maintenance, Field) are functional. Authentication and middleware routing are strictly enforced.
- **Active Phase:** Final QA testing, resolving edge-case 400/401 API errors, standardizing table padding, and finalizing presentation data seeds. 

## 25. Rebuild Milestones
1. ~~Finalize Prisma/Backend Access.
2. ~~Build Availability Engine & Overlap Logic.
3. ~~Field Worker Flows (Search/Request).
4. ~~Equipment Profiles & Notes.
5. ~~Maintenance Module & Triage Queues.
6. ~~Admin Approval/Exception Management.
7. ~~Navigation/UI Cleanup.
8. ~~Final bug and logic fixes. (Current)
8. **Final Capstone QA & Presentation Prep.** (Current)

---

## 26. Coding Standards & Rules
- TypeScript everywhere.
- Business logic in **Services**, not controllers or UI.
- No mock arrays once Prisma is active.
- Server-side validation for all write actions.
- Audit logs for all status changes.
- Mobile UI uses Cards/Accordions; Desktop uses Tables.

---

## 29. What "Perfect" Means
A coherent, credible industrial system where units have identity/history, scheduling is time-accurate, maintenance impacts operations, and every action is traceable.

---

## 30. Final Definition
EquipTrack is a role-based industrial operations platform tracking individual equipment units through locations, schedules, rentals, and maintenance. It treats assets as schedulable, maintainable, and accountable operational resources rather than simple inventory.