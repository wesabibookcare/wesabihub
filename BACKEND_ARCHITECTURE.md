# WeSabiHub Backend Architecture Blueprint

## Overview
This document outlines the production-grade backend architecture for WeSabiHub. The system is designed for high scalability, security, and multi-country deployment using a serverless-first approach with Firebase and Google Cloud Platform (GCP).

## 1. Technical Stack
- **Authentication**: Firebase Authentication (Email, Google, Phone).
- **Primary Database**: Cloud Firestore (NoSQL, real-time).
- **Secondary Database**: Cloud SQL (PostgreSQL) for complex financial reporting (if needed).
- **File Storage**: Firebase Storage (Parcels photos, KYC documents).
- **Compute**: Firebase Cloud Functions (Node.js/TypeScript) for business logic.
- **Payments**: Flutterwave Integration.
- **Maps & Geo**: Google Maps Platform (Places, Distance Matrix, Geocoding).
- **Real-time**: Firestore Real-time listeners & Firebase Cloud Messaging (FCM).

## 2. Role-Based Access Control (RBAC)
Roles are managed via custom claims in Firebase Authentication:
- `CUSTOMER`: Basic access to send/track parcels.
- `MERCHANT`: Access to manage their point, inventory, and staff.
- `LOGISTICS_OWNER`: Manage fleet, drivers, and routes.
- `DRIVER`: Mobile-first access for pickup/delivery tasks.
- `ADMIN_SUPPORT`: Level 1 support access.
- `ADMIN_FINANCE`: Access to payouts, commissions, and escrow.
- `SUPER_ADMIN`: Full system control.

## 3. Database Schema (Firestore Collections)
### `users`
- `uid`: string (doc ID)
- `email`: string
- `role`: string
- `country`: string
- `profile`: object

### `parcels`
- `parcelId`: string
- `senderUid`: string
- `receiverInfo`: object
- `originPointId`: string
- `destPointId`: string
- `status`: enum (PENDING, AT_ORIGIN, IN_TRANSIT, AT_DEST, DELIVERED)
- `pricing`: object
- `escrowStatus`: enum (HELD, RELEASED, REFUNDED)

### `points` (WeSabiHub Points)
- `pointId`: string
- `ownerUid`: string
- `location`: geopoint
- `trustScore`: number
- `starRating`: string
- `operatingHours`: object

### `business_rules`
- `id`: string (e.g., 'pricing_v1')
- `rules`: object
- `effectiveDate`: timestamp
- `createdBy`: uid

## 4. Centralized Service Layer (Architecture)
The frontend should interact with the backend via centralized service classes:
- **`ParcelService`**: Create, track, and update parcel status.
- **`PricingService`**: Fetch current rules and simulate pricing (server-side calculation).
- **`EscrowService`**: Manage fund holding and release triggers.
- **`NotificationService`**: Trigger FCM, Email (SendGrid/Mailgun), and SMS.
- **`SearchService`**: Geo-queries for nearby points and partners.
- **`VerificationService`**: Handle KYC and partner onboarding.
- **`AuditService`**: Log all administrative changes.
- **`BrandService`**: Fetch dynamic assets and themes by country/partner.

## 5. Security & Observability
- **Security Rules**: Strict Firestore rules based on `auth.token.role`.
- **Encryption**: Data encrypted at rest and in transit (TLS).
- **Audit Logs**: Every admin action recorded in `audit_logs` collection.
- **Monitoring**: Google Cloud Operations Suite (formerly Stackdriver) for logs and errors.

## 6. Future Expansion
- **International Routing**: Schema supports `originCountry` and `destinationCountry`.
- **Public APIs**: Architecture ready for API Gateway / Cloud Endpoints for third-party logistics.
- **Real-time Maps**: Driver location tracking via FCM and real-time Firestore updates.
