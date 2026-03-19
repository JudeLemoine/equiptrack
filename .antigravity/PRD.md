# EquipTrack: Product Requirements Document

## 1. Executive Summary
EquipTrack is a role-based industrial equipment operations platform. Unlike consumer rental apps, it tracks individual physical assets (Units) across their entire lifecycle, integrating scheduling, maintenance, and auditability.

## 2. Core Philosophy (Non-Negotiables)
- **Unit vs. Type:** Systems must distinguish between a Model (Type) and a specific serial-numbered machine (Unit).
- **Time-Awareness:** Availability is dynamic. A unit is only available if it has no overlapping rentals AND no maintenance blocks during the requested window.
- **Action-Oriented:** Dashboards prioritize tasks (Approvals, Overdue, Due Soon) over vanity metrics.

## 3. Critical Workflows
- **Field Worker:** Search by date/location -> Request Type -> Track Status -> Checkout/Return.
- **Admin:** Review Requests -> Assign specific Unit ID -> Approve/Reject -> Resolve Conflicts.
- **Maintenance:** Queue-led workflow for "Overdue Service," "Reported Issues," and "Routine Maintenance."

## 4. Lifecycle Definitions
- **Rental Status:** PENDING, APPROVED, RESERVED, CHECKED_OUT, RETURNED, OVERDUE, CANCELLED.
- **Equipment Status:** AVAILABLE, RESERVED, CHECKED_OUT, OVERDUE, IN_MAINTENANCE, OUT_OF_SERVICE.