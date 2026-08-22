# WeSabiHub Operations Specification

## DOCUMENT GOVERNANCE

- **Document Name**: WeSabiHub Operations Specification
- **Version**: 1.0
- **Status**: ACTIVE
- **Release Date**: 2026-07-20
- **Purpose**: Define the authoritative operational workflows, role responsibilities, business procedures, and platform operating rules of WeSabiHub.

This Operations Specification is the authoritative reference for how WeSabiHub processes, manages, and secures parcel movements, financial settlements, and platform interactions. It serves as the bridge between high-level policy (the WeSabiHub Platform Constitution) and concrete technological implementation (engines and database models).

### Change Log and History

| Version | Date | Section Affected | Change Description | Constitution Checked? | Code Change Required? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1.0 | 2026-07-20 | All | Initial Release of Canonical Operations Specification. | Yes | No |

### Amendment Procedures

Every future amendment to this specification must adhere to the following strict governance rules:

1. **Update the version number**: Increment the minor version (e.g., 1.0 to 1.1) for operational updates or the major version (e.g., 1.0 to 2.0) for major structural overhauls.
2. **Record the date of the change**: Use ISO format (YYYY-MM-DD).
3. **Record the section changed**: State the exact chapter, heading, or section of the modification.
4. **Record a concise description of the change**: Detail the operational justification and the rules updated.
5. **Preserve the existing change history**: Append the new entry to the Change Log table. Never truncate past entries.
6. **Check the change against the WeSabiHub Platform Constitution**: Cross-reference the new rule with the WeSabiHub Platform Constitution (`AGENTS.md`) to guarantee no rules or constraints are breached.
7. **Identify whether the change affects existing application code**: Explicitly note whether backend, frontend, database schemas, or authoritative engines must be modified.
8. **Never silently override a higher-level constitutional rule**: If an operational requirement conflicts with the Platform Constitution, it is invalid and cannot be implemented without a formal Constitutional amendment.

---

## CHAPTER 1: WESABIHUB OPERATING MODEL

### 1.1 Platform Purpose
WeSabiHub is an enterprise-grade collaborative logistics and secure trade ecosystem. In developing and emerging markets (such as Nigeria and wider West Africa), peer-to-peer commerce and social commerce suffer from a severe trust deficit, inefficient last-mile logistics, and high cash-on-delivery failure rates.

WeSabiHub solves these operational problems by providing:
- **Shared Hub Infrastructure**: Authorized physical locations (filling stations, supermarkets, pharmacies) act as secure, monitored drop-off, storage, and pick-up points (Hubs).
- **SafePay (Escrowed Payment Protection)**: Escrowed payment mechanisms that hold funds securely until custody is verified and parcels are released to the rightful customer.
- **Unified Custody & Tracking**: Complete end-to-end auditability and absolute traceability of parcel custody transfers between merchants, hub personnel, logistics partners, dispatch riders, and customers.

#### Stakeholder Operations & Relationships:
- **Customers**: Retail buyers or recipients who retrieve parcels from Hubs or receive deliveries.
- **Merchants**: Commercial sellers who sell goods and ship them to customers via the WeSabiHub network.
- **Hub Owners**: Operators of physical locations certified as official WeSabiHub Points. They manage staff, secure storage space, and oversee regional operations.
- **Hub Staff**: On-the-ground agents hired by Hub Owners to perform check-in, scanning, condition logging, storage management, and parcel release.
- **Logistics Partners**: Fleet operators or third-party logistics (3PL) providers coordinating transit between regional Hubs.
- **Dispatch Riders**: Individual couriers or riders executing last-mile pickups and deliveries.
- **Super Admin**: Platform administrators with oversight, incident investigation, dispute resolution, and system configuration capabilities.
- **Payment Providers**: External payment gateways (e.g., Flutterwave) supporting digital wallet cash-ins, direct cards, and escrow payouts.
- **API/Platform Partners**: Third-party integrations connecting to WeSabiHub programmatic logistics and parcel tracking.

---

### 1.2 Platform Operating Philosophy
WeSabiHub operates on a philosophy of **uncompromising custody integrity and absolute accountability**. The platform coordinates the physical receiving, structured storage, secure custody, payment protection, real-time tracking, and multi-leg transit of parcels within a single trusted framework.

To achieve this, the platform maintains the following core pillars:
- **Accountability**: Every operational state change must be attributable to a verified actor, signed with a valid cryptographic context or authenticated user session.
- **Traceability**: A parcel's physical journey from booking to final release must form a contiguous, unbroken chain of events, with no gaps in custody.
- **Security**: Strict physical verification and multi-factor verification checks (e.g., digital OTP, secure QR scan, and government-issued ID checks) protect parcels from unauthorized pickup.
- **Custody Integrity**: Physical transfers of a parcel must have dual-sided confirmation (e.g., dispatch rider hand-over and hub staff hand-over log).
- **Payment Integrity**: Payments must pass through the secure escrow (SafePay) pipeline, preventing fraud or seller exit scams.
- **User Identity**: All commercial actors (Merchants, Hub Owners, Staff, Logistics Partners, and Riders) must undergo robust identity and business verification (KYC/KYB) before operating.
- **Auditability**: Every event is preserved immutably in a system-wide audit ledger that can neither be manipulated nor bypassed by client-side mechanisms.
- **Operational Transparency**: Operational statuses must be clean, human-readable, and supported by real-time notification pathways.

---

### 1.3 Authoritative System Architecture
WeSabiHub is designed with a strict, decoupled full-stack architecture where backend components enforce absolute authority. In compliance with the WeSabiHub Engineering Constitution, the frontend is merely a presentation layer. It must not independently evaluate business state, bypass validation, or calculate financial metrics.

```
       [ Frontend UI / Presentation Layer ]
                       │
                       ▼
       [ API Routes / Express Gateway ]
                       │
                       ▼
         [ WorkflowEngine (Coordinator) ]
                       │
         ┌─────────────┼──────────────┬─────────────┐
         ▼             ▼              ▼             ▼
   [UserEngine]  [ParcelEngine] [PaymentEngine] [AuditEngine] ...
         │             │              │             │
         └─────────────┼──────────────┴─────────────┘
                       ▼
            [ Authoritative Repositories ]
                       │
                       ▼
            [ Firestore DB / Storage ]
```

#### Key Architecture Components:
- **Frontend**: The user interface built with React, Vite, and Tailwind CSS. It communicates with backend endpoints `/api/*` and renders appropriate views, loaders, and error states.
- **WorkflowEngine**: The central business orchestrator (located at `/src/engines/WorkflowEngine.ts`) that implements high-level processes. It coordinates transactions across multiple domain engines, ensuring atomic-like consistency across business flows.
- **Authoritative Business Engines**: Domain-specific engines executing isolated core business logic:
  - `UserEngine`: Manages registration, user verification status, custom permissions, and RBAC security contexts.
  - `ParcelEngine`: Controls parcel lifecycles, pricing metrics, tracking code generation, and custody state changes.
  - `PaymentEngine`: Operates wallet balances, payment gateways, ledger histories, and settlement rules.
  - `PaymentProtectionEngine`: Manages the escrow (SafePay) logic, holding funds until release conditions are met.
  - `InventoryEngine`: Manages physical space allocation, shelf/bin locations, and stock levels at Hub Points.
  - `AuditEngine`: Registers system-wide operational updates into the immutable transaction history.
  - `NotificationEngine`: Distributes multi-channel transactional notifications (SMS, Email, Push).
  - `IntegrationEngine`: Powers external API routes, webhooks, and 3PL integrations.
  - `ComplianceEngine`: Handles legal acceptance, terms tracking, and policy agreements.
- **Repositories**: Standardized data access layers mapping database entities (Firestore) to business engines. Repositories do not enforce business rules.
- **Database**: The source of truth (Firestore), protected by rigid backend security rules (`firestore.rules`) to guarantee data integrity independently of the client.

---

### 1.4 Operational Lifecycle
The parcel journey on WeSabiHub follows a strict progression designed to protect custody and financial value:

```
[Merchant: Book Shipment] ──► [Payment & Escrow] ──► [Drop-Off at Origin Hub]
                                                             │
                                                             ▼
[Final Release to Customer] ◄── [Check-In at Dest Hub] ◄── [Transit Route]
```

1. **Shipment Booking**: A verified Merchant (or an authorized Hub Staff member acting on their behalf) creates a shipment. The parcel is assigned a unique system-wide tracking number and QR code.
2. **Payment & SafePay Escrow**: The shipping fee and parcel value (if using SafePay) are captured. The funds are placed into escrow.
3. **Drop-Off (Origin Hub)**: The Merchant drops off the parcel at the designated origin Hub. Hub Staff perform a check-in scan, record the parcel's condition, assign a physical shelf/bin location, and generate a custody log. The status shifts to `RECEIVED`.
4. **Logistics Pickup & Transit**: An authorized Logistics Partner or Dispatch Rider arrives to transport the parcel. Hub Staff verify the rider, scan the parcel, and hand it over. The Dispatch Rider accepts custody, shifting the status to `IN_TRANSIT`.
5. **Transit Handover**: For multi-leg transit, the parcel may pass through sorting facilities, with every physical hand-over logged as a custody record in the database.
6. **Destination Hub Arrival**: The parcel reaches the destination Hub. Hub Staff scan the parcel, log its condition, assign storage, and trigger automated SMS/Email alerts to the Customer with a secure retrieval PIN/OTP. Status shifts to `AWAITING_COLLECTION`.
7. **Verification & Release**: The Customer arrives at the Hub. Hub Staff verify the Customer's identity, validate the secure retrieval OTP, and confirm SafePay release status.
8. **Custody Completion**: The parcel is physically handed over. Hub Staff submit the release scan, the escrowed funds are released to the Merchant, the custody record is marked complete, and a system audit is logged.

---

### 1.5 Accountability Model
To prevent fraud, theft, and loss, WeSabiHub maintains a zero-trust accountability model. Every operational event, status transition, or custody exchange must be backed by a system-wide audit record.

#### Audit Log Requirements:
Every important operational action must produce an immutable audit log storing:
- **Timestamp**: Exact server-recorded ISO timestamp of the action.
- **Actor Identity**: The verified user ID (`uid`) of the person executing the action.
- **Actor Role**: The active role (e.g., `CENTER_STAFF`, `DRIVER`) used for authorization.
- **Target Entity**: The ID of the affected resource (e.g., `parcelId`, `shipmentId`, `paymentId`).
- **Action Type**: Descriptive operational code (e.g., `PARCEL_CHECK_IN`, `CUSTODY_TRANSFER_INITIATED`).
- **Location Context**: Physical GPS coordinates or Hub Center ID where the action was executed.
- **Result Status**: Success or failure status with detailed execution metadata.

---

### 1.6 Business Rule Authority
Operational decisions and technical implementations on WeSabiHub must observe a strict, non-negotiable hierarchy of authority:

```
          [ WeSabiHub Platform Constitution (AGENTS.md) ]
                                 │
                                 ▼
         [ WeSabiHub Operations Specification (v1.0) ]
                                 │
                                 ▼
          [ Approved Product Roadmap & Specifications ]
                                 │
                                 ▼
                     [ Technical Implementation ]
```

1. **Platform Constitution (`AGENTS.md`)**: The permanent, supreme charter. It defines permanent structural boundaries, security mandates, backend-frontend integrity constraints, and immutable logging rules.
2. **Operations Specification (This Document)**: The active operational handbook. It defines concrete workflows, role permissions, operating rules, and transactional boundaries.
3. **Approved Product Roadmap**: The collection of features approved for future development, categorized as out-of-scope for the current operational release.
4. **Technical Implementation**: The compiled codebase (TSX/TypeScript/Rules).

No technical implementation or operational specification change may contradict a higher-level constitutional rule. Any conflict renders the implementation invalid.

---

### 1.7 No Duplicate Business Logic
To maintain platform stability, keep code dry, and guarantee correctness:
- **Zero Page-Level Business Logic**: Front-end components, pages, hooks, and views are strictly forbidden from executing calculations, changing financial states, or processing custody rules.
- **Single Source of Truth**: All operational validations, state evaluations, and database modifications must go through the appropriate authoritative engine (e.g., `ParcelEngine`, `UserEngine`) via `WorkflowEngine`.
- **Database Control**: Direct database edits from the client are forbidden. All modifications must route through server-validated API routes.

---

## CHAPTER 2: ROLES, RESPONSIBILITIES & OPERATIONAL PERMISSIONS

### 2.1 Role Separation Principle
A user's capabilities on WeSabiHub are strictly governed by their verified, active role configuration.
- Access is determined by authenticated identity (`uid`), assigned roles (`roles` array), verification status, resource ownership, and operational context.
- **Multiple Roles**: Users may hold multiple roles (e.g., a `CENTER_OWNER` who also acts as a `MERCHANT`).
- **Verification Gates**: Adding a role (e.g., upgrading from a `CUSTOMER` to a `MERCHANT`) does not immediately grant access. The role remains in a pending verification gate until required documents, identity verification, or compliance checks are verified and approved by an administrator.
- **RBAC Enforcement**: Role-based access control must be implemented in depth. Hiding a button on the front end is not security; backend endpoints and Firestore security rules must independently block and log unauthorized access attempts.

---

### 2.2 Role Definitions

#### 2.2.1 CUSTOMER (`CUSTOMER`)
- **Role Purpose**: Individual consumer or retail buyer utilizing WeSabiHub to securely receive parcels and manage social commerce purchases.
- **Operational Boundaries**:
  - **CAN**: Track parcels, complete payment requirements, retrieve parcels from Hubs, initiate SafePay transactions, receive notifications, open disputes, view personal order history, and contact support.
  - **CANNOT**: Create commercial shipments, create parcels, send commercial parcels, operate Hub Points, perform check-in/out scans, assign storage, manage logistics routes, or access administrative portals.
- **Access Limits**: Access is strictly limited to parcels where the user's phone number or email is designated as the recipient.
- **Financial Limits**: Maximum wallet/escrow transaction limits apply based on KYC verification level.
- **Audit Requirement**: All package collections, SafePay initiations, and disputes must log recipient identity, retrieval PIN verified, and timestamp.

---

#### 2.2.2 MERCHANT (`MERCHANT`)
- **Role Purpose**: Verified commercial seller, brand, or social commerce business using WeSabiHub to fulfill orders, ship items, and receive secure payments.
- **Operational Boundaries**:
  - **CAN**: Create shipment requests, book parcels, track outgoing shipments, manage billing/payout wallets, view sales history, utilize Hub-assisted booking, and trigger customer delivery notifications.
  - **CANNOT**: Operate Hub Points, perform on-site parcel check-in scans, override recipient verification, operate third-party logistics routes, or view other merchants' data.
- **Verification Requirements**: Must satisfy all platform-required identity checks (government-issued ID, phone verification) and business verification (KYC/KYB) before creating commercial shipments.
- **Financial Boundaries**: Sales payouts are securely held in escrow (SafePay) until recipient pickup is fully logged and verified.
- **Audit Requirement**: Every shipment created, payment requested, or payout settled must be fully audited and mapped to the merchant's verified identity.

---

#### 2.2.3 HUB OWNER (`CENTER_OWNER`)
- **Role Purpose**: Certified physical business operator responsible for running an official WeSabiHub Point, managing staff, securing physical inventory, and guaranteeing local custody integrity.
- **Operational Boundaries**:
  - **CAN**: Manage assigned Hub Point profile, hire/fire Hub Staff, view Hub analytics, receive/check in parcels, assign storage shelves, coordinate logistics handovers, report parcel exceptions, manage Hub wallets, and create shipments **on behalf of verified Merchants**.
  - **CANNOT**: Create shipments on behalf of unverified Customers, bypass recipient retrieval verification, release parcels without OTP validation, falsely designate the Hub as the sender/owner of merchant goods, or modify global platform settings.
- **Hub-Assisted Merchant Booking Workflow**:
  When a Hub Owner creates a shipment on behalf of a Merchant, the following strict protocol must be observed:
  1. **Identify the Merchant**: The Hub Owner must obtain the Merchant's unique WeSabi ID, verified phone number, or email.
  2. **Verify Merchant Authorization**: The system must verify that the target Merchant account is active, approved, and KYC-compliant.
  3. **Associate the Shipment**: The shipment must be linked to the Merchant's account as the primary owner. The Merchant remains legally and operationally accountable for the package contents and booking fees.
  4. **Maintain Auditable Trails**: An immutable audit record must be written, capturing that the Hub Owner (and specifically which verified staff account) created the shipment on behalf of the Merchant.
- **Audit Requirement**: Hub Owners are fully responsible and liable for all custody transfers, employee logs, and financial transactions taking place within their physical facility.

---

#### 2.2.4 HUB STAFF / HUB AGENT (`CENTER_STAFF`)
- **Role Purpose**: On-site operational personnel working under the authority of a Hub Owner, executing physical parcel check-ins, storage placement, scanning, and secure collections.
- **Operational Boundaries**:
  - **CAN**: Receive parcels, perform physical check-in scans, record parcel conditions, assign shelf locations, hand over parcels to riders, validate retrieval OTPs, release parcels to customers, log exceptions, and create shipments on behalf of verified merchants **only when explicitly authorized by the Hub Owner**.
  - **CANNOT**: Create shipments on behalf of unverified Customers, bypass KYC/identity verification of merchants/recipients, manage staff accounts, adjust Hub settings, or withdraw Hub funds.
- **Accountability**: Staff act under the operational license of the Hub Owner, but all actions must be linked directly to their specific, authenticated employee account.

---

#### 2.2.5 LOGISTICS PARTNER (`LOGISTICS_COMPANY`)
- **Role Purpose**: Certified third-party logistics (3PL) firm or fleet manager coordinating the movement of parcels between regional Hub Points.
- **Operational Boundaries**:
  - **CAN**: Receive assigned transport routes, coordinate fleet operations, assign drivers/dispatch riders, update movement milestones, view assigned manifests, and log multi-leg transit handovers.
  - **CANNOT**: Create shipments, book packages, alter parcel ownership, access SafePay escrows, modify merchant financial records, or execute direct customer pickups/releases without specific system authorization.
- **Compliance Rules**: Must provide valid transport licenses, verified driver databases, and satisfy logistics insurance requirements before route activation.

---

#### 2.2.6 DISPATCH RIDER (`DRIVER`)
- **Role Purpose**: Last-mile courier or driver performing physical transit, pickup, and transport task execution.
- **Operational Boundaries**:
  - **CAN**: Accept transport tasks, scan parcels upon custody pickup, update delivery milestone tracking, record handover events, and upload delivery photos where required.
  - **CANNOT**: Book new shipments, alter parcel details, adjust logistics prices, perform unauthorized Hub operations, or release parcels to final customers without completing dual-handover validation.
- **Audit Requirement**: Every package pickup and drop-off requires GPS coordinates and electronic signature scans.

---

#### 2.2.7 SUPER ADMIN (`SUPER_ADMIN`)
- **Role Purpose**: Platform administrator representing the ultimate authority of WeSabiHub. Responsibilities focus on monitoring, platform health, dispute mediation, and policy compliance.
- **Operational Boundaries**:
  - **CAN**: Monitor global platform-wide operations, audit ledger activities, investigate support disputes, configure pricing variables, suspend fraudulent users, approve KYC/KYB records, and execute approved administrative interventions.
  - **CANNOT**: Bypass immutable logging, alter active transaction history, delete custody logs, or withdraw merchant wallet funds without double-authorized financial approval.
- **Rule of Immutable Operations**: A Super Admin's action is never invisible. Administrative actions are logged automatically into the core audit logs, ensuring accountability even at the highest level of system privilege.

---

### 2.3 Role-Permission Matrix

The following matrix provides the canonical definition of capabilities across major WeSabiHub roles:

| Capability | CUSTOMER | MERCHANT | HUB OWNER | HUB STAFF | LOGISTICS | DISPATCH RIDER | SUPER ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Shipment Creation** | ❌ |  |  *(On Behalf)* |  *(On Behalf)* | ❌ | ❌ |  |
| **Bulk Booking** | ❌ |  | ❌ | ❌ | ❌ | ❌ |  |
| **Hub-Assisted Booking** | ❌ | ❌ |  |  | ❌ | ❌ | ❌ |
| **Parcel Check-In** | ❌ | ❌ |  |  | ❌ | ❌ | ❌ |
| **Parcel Storage (Shelving)**| ❌ | ❌ |  |  | ❌ | ❌ | ❌ |
| **Parcel Release** | ❌ | ❌ |  |  | ❌ | ❌ |  *(Dispute)* |
| **Parcel Movement (Transit)**| ❌ | ❌ | ❌ | ❌ |  |  | ❌ |
| **SafePay Access (Escrow)** |  |  | ❌ | ❌ | ❌ | ❌ |  *(Resolve)* |
| **Dispute Access** |  |  |  | ❌ | ❌ | ❌ |  |
| **Administrative Access** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |

**Legend:**
-  = Authorized / Permitted
- ❌ = Strictly Prohibited / Unauthorized
- *(On Behalf)* = Allowed only on behalf of a verified Merchant, linked to their account.
- *(Dispute)* / *(Resolve)* = Access allowed only in the context of an official dispute escalation or administrative resolution process.

---

## CHAPTER 3: PARCEL & SHIPMENT OPERATIONS

### 3.1 Taxonomy of Core Platform Entities
To maintain architectural correctness, database consistency, and prevent operational ambiguity, the platform strictly distinguishes between the following entity types. These entities are not interchangeable and are managed by distinct engines and schemas:
- **SHIPMENT**: The commercial logistics contract between a Merchant and WeSabiHub. It represents the overall booking order (containing overall payment details, origin, and destination requirements). A single shipment may consist of one or multiple physical parcels.
- **PARCEL**: The individual physical box, bag, or package being processed, stored, and transported. Each parcel has a unique physical identity, unique tracking ID, custom QR label, custom storage location, and its own lifecycle states.
- **CUSTODY RECORD**: An immutable ledger entry tracking the exact legal and physical responsibility of a parcel at any given second. Every hand-over (e.g., Merchant to Hub Staff, Hub Staff to Dispatch Rider, Dispatch Rider to destination Hub Staff) must create an explicit Custody Record to ensure an unbroken chain of custody.
- **TRACKING EVENT**: A chronological, user-facing timeline entry mapping the parcel's travel milestones (e.g., "Awaiting Drop-off", "Arrived at Lekki Hub Alpha", "In Transit to Ikeja Hub", "Ready for Pickup").
- **DELIVERY / COLLECTION EVENT**: The final terminal event marking the successful and secure release of a parcel to the designated customer or recipient, cataloging the verification method used (e.g., Retrieval OTP validated, ID card check).
- **PAYMENT / SAFEPAY TRANSACTION**: The financial ledger record processing escrow status, wallet adjustments, and cash flows. It interacts directly with payment gateway webhooks (Flutterwave/Paystack) to verify that funds are authoritatively captured before physical release operations are allowed.

---

### 3.2 Shipment Creation & Accountability
Every parcel in the WeSabiHub network must trace back to a clearly identifiable, active, and accountable Merchant.
- **Authorized Shipment Creators**:
  1. **Verified Merchants**: Through their designated merchant panel.
  2. **Hub Owners**: Creating shipments on behalf of a verified Merchant who has physically visited the Hub center.
  3. **Authorized Hub Staff**: Creating shipments on behalf of a verified Merchant, restricted to permissions configured by the Hub Owner.
- **Prohibitions**:
  - **No Customer Shipments**: A standard Customer (consumer) account **MUST NOT** create shipments or packages under the shipment creation workflow.
  - **Verification Gate**: Any Customer wishing to send commercial parcels must separately apply for a Merchant account, submit to required commercial KYC/KYB audits, and obtain approved Merchant credentials.
  - **No Logistics/Driver Booking**: Logistics Partners and Dispatch Riders have no capability to create shipments.
- **Intermediary Booking Accountability**:
  When a Hub Owner or Staff member creates a shipment on behalf of a Merchant, the system enforces the following:
  - The Merchant's verified account remains the sole accountable sender and owner of the goods.
  - The shipment must be structurally linked to the target Merchant's unique account ID, ensuring financial transactions, ledger audits, and notifications map back correctly.
  - The audit log must record the exact Hub ID and individual Hub Staff user ID who executed the booking.
  - The system prevents the Hub itself from falsely claiming ownership, acting as the seller, or bypassing merchant compliance limits.

---

### 3.3 Merchant Verification Requirements
commercial shipment booking is a high-trust platform feature. The platform enforces that shipment creation privileges are granted only to merchants who satisfy all required identity and compliance checks.
- **Verification Gates & Checks**:
  The system supports multiple verification states, evaluated dynamically on the backend (enforced via `UserEngine` and Firestore Security Rules):
  - **Legal Identity Information**: Full legal name, verified address, and national identifier details.
  - **Business Registration**: Certified records (such as CAC documents in Nigeria) for corporate/enterprise-tier accounts.
  - **Government-Issued ID**: Scanned uploads of verified Passports, Driver's Licenses, or National Identity Cards.
  - **Face Identity Verification**: Verification matching facial photos with ID uploads where required by high-risk thresholds.
  - **Contact Verification**: SMS-verified mobile numbers and verified business emails.
- **Authoritative Backend Security**:
  Merchant verification status must never be evaluated solely on the client. The backend `UserEngine` and Firestore security rules must block any shipment creation API payload if the sender's authenticated state is not flagged as `VERIFIED`.

---

### 3.4 Single Shipment Creation Workflow
The step-by-step process for booking a standard shipment:
1. **Merchant Authentication & Authorization**: The user authenticates; the system verifies they hold the active `MERCHANT` role and that their verification status is `VERIFIED`.
2. **Metadata Input**: The merchant inputs receiver details (name, email, phone), origin Hub point, target destination Hub point, and shipment service tier (e.g., Hub-to-Hub, Hub-to-Door).
3. **Parcel Declarations**: The merchant inputs package descriptions, fragile status, and declared financial value.
4. **Authoritative Pricing Assessment**:
   - The frontend calls the backend route `/api/calculate-price`.
   - The backend `ParcelEngine` evaluates official pricing configurations (base fee, weight multipliers, distance rate, country-specific tariffs) retrieved from the `ConfigurationEngine`.
   - The resulting price is stored as an authoritative quote in the session.
5. **Payment Gateway Authorization**:
   - The platform generates a transaction record.
   - If using SafePay escrow, the escrow vault is initialized.
   - The merchant executes payment via the integrated gateway (Paystack/Flutterwave).
   - The backend listens for secure, signature-verified webhooks to authoritatively verify payment success.
6. **Unique ID & Asset Generation**: Once payment is marked success:
   - A unique, collision-resistant Tracking ID (e.g., `WSH-YYYYMM-XXXX`) is allocated.
   - A cryptographic QR code payload representing this unique ID is generated.
7. **Audit & Milestone Logging**: The system records the initial `CREATED` tracking event, writes a system-wide audit ledger, and triggers notifications to the merchant.

---

### 3.5 Bulk Shipment Creation Workflow
Enterprise and high-volume merchants may process bulk shipments to streamline operations:
- **Bulk Upload Process**: Merchants ingest spreadsheet data (CSV) detailing multiple recipients and packages.
- **Batch Verification Engine**: Before any write operation, the system processes batch validation—verifying that every phone number is valid, target Hub destinations exist and are open, and pricing rules can be mapped.
- **Traceability Guarantee**: Bulk shipping is a tracking accelerator, not a grouping mechanism. Each individual package in the bulk order retains its own unique tracking ID, separate barcode, independent shelf/storage status, and continuous custody logs.
- **Bulk Progress Monitoring**: Merchants can track processing, pickup, and collection percentages across the entire batch from a unified bulk dashboard, with nested navigation to individual package timelines.

---

### 3.6 Hub-Assisted Shipment Creation Workflow
When a verified Merchant drops off unregistered physical inventory at a Hub, the Hub operator may book the shipment on the spot:
1. The operator inputs the Merchant’s unique phone, email, or WeSabi ID.
2. The backend validates that the merchant exists and is `VERIFIED`.
3. The operator inputs recipient and parcel specs.
4. The system calculates the rate and collects payment (via cash-in to Hub Wallet or direct digital billing).
5. The system logs the active Hub Staff ID, the Hub ID, the Merchant ID, and the timestamp, verifying that the Hub acted as an intermediary creator and did not assume parcel ownership.

---

### 3.7 Parcel Identification Standards
- Every parcel entering the WeSabiHub operational network must be uniquely identifiable.
- Identification must use approved mechanisms: tracking ID (e.g., `WSH-YYYYMM-XXXX`) and QR codes.
- Scanning the QR code must resolve to the authoritative URL mapping to `/api/parcels/:id` (validated on the server).
- To prevent collision attacks and spoofing:
  - Tracking numbers must be non-sequential and include randomized alphanumeric characters.
  - Duplicate scans of an existing tracking number must trigger immediate conflict alerts.

---

### 3.8 Parcel Status Model
The physical and operational state of every parcel is governed by an explicit state machine enforced on the backend by the `ParcelEngine`:
- **`CREATED`**: Shipment booked on the platform; tracking ID generated, but physical parcel not yet dropped off.
- **`AWAITING_INTAKE`**: Merchant has scheduled drop-off, or parcel is expected at the origin Hub.
- **`RECEIVED`**: Parcel has been physically scanned, inspected, and checked into the origin Hub (often referred to in current UI code as `RECEIVED` or `ARRIVED_AT_HUB`).
- **`IN_TRANSIT`**: Parcel has been checked out of a Hub and handed over to an authorized Dispatch Rider or Logistics Partner.
- **`AWAITING_COLLECTION`**: Parcel has arrived at the final destination Hub, shelved, and is ready for recipient pickup.
- **`RELEASED`**: Parcel successfully handed to the verified recipient, escrow payout completed (also referred to as `COLLECTED` or `DELIVERED`).
- **`RETURN_REQUESTED`**: Custody release was rejected, or merchant initiated a return-to-sender loop.
- **`DISPUTED`**: Escrow or package condition contested, putting state transitions on absolute hold.
- **`INVESTIGATION_HOLD`**: Administrative or compliance block preventing any custody change.

---

### 3.9 Parcel Timeline Construction
Every parcel's history page must build its visual timeline strictly from real, authenticated backend logs fetched from the `AuditEngine` and `CustodyRepository`. The timeline cannot be mocked or hardcoded. Each item requires:
`[Timestamp] | [Action Code] | [Actor Role] | [Actor ID] | [Location Context]`

---

### 3.10 Weight, Size, and Physical Verification
- A merchant's declared measurements are advisory.
- During intake at the origin Hub, Hub Staff must physically weigh and measure the package.
- If physical weight exceeds declared weight by more than 5%, the `ParcelEngine` flags a pricing discrepancy:
  - The intake workflow is halted.
  - A supplementary payment request is generated and sent to the merchant.
  - The parcel is placed on a temporary `INTAKE_DISCREPANCY_HOLD` until settled.

---

### 3.11 Payment Integration & Security
- **No Front-End Price Setting**: All pricing math is computed in Node.js server memory using rule tables.
- **SafePay Escrow**: Flutterwave is the authorized custody escrow partner. Payment funds are isolated in a secure vault until the `RELEASE` webhook or manual release validation occurs.
- **Standard Payments**: Paystack handles standard shipping and platform fees.
- **Webhook Protection**:
  - All webhooks must be validated using cryptographic signing signatures (e.g., matching the `X-Re-Signature` or merchant secret).
  - Webhooks must be logged for idempotency in the database to prevent double-spending or duplicate wallet top-ups.

---

### 3.12 Operational Exception Management
When physical operations deviate from normal flows, Hub Staff must log an Exception Record under one of these pre-defined classifications:
- `DAMAGED_ARRIVALS`: Package is wet, torn, or broken upon drop-off or delivery.
- `LABEL_UNREADABLE`: Tracking QR code or tracking ID is scratched or unscannable.
- `MISROUTED_PARCEL`: Package scanned at a Hub different from the designated destination.
- `CONTRABAND_SUSPICION`: Physical suspicion of illegal or dangerous goods.
All logged exceptions must require a written explanation and photographic evidence upload (processed via `StorageEngine`).

---

## CHAPTER 4: HUB OPERATIONS & PARCEL CUSTODY

### 4.1 Hub Arrival Protocols
When a parcel physically arrives at a WeSabiHub Point (either via merchant drop-off or via a transit rider), Hub Staff must immediately initialize an identification scan. The system automatically verifies:
1. **System Validity**: Does this tracking ID exist in the database?
2. **State Eligibility**: Is the parcel currently `IN_TRANSIT` or `CREATED`?
3. **Route Verification**: Is this physical Hub authorized as the correct origin, hub-stop, or final destination for this package?
4. **Holds**: Is the package flagged with an active `INVESTIGATION_HOLD` or `DISPUTE`?
If any validation rule fails, the software blocks the check-in process and alerts the operator.

---

### 4.2 Single Parcel Check-In Workflow
The step-by-step check-in procedure:
1. **Physical Inspection**: Operator checks package for tears, leakage, or breaks.
2. **Scan Identifier**: Scan the parcel QR.
3. **Evaluate State**: System validates eligibility.
4. **Condition Logging**: If package is pristine, select `Good condition`. If damaged, record evidence and log an exception.
5. **Assign Shelf Location**: Enter physical storage identifier (e.g., `Shelf A, Bin 3`).
6. **Log Custody**: Write the custody transition (e.g., "Rider -> Hub").
7. **Update State**: Authorized state changes to `AWAITING_COLLECTION` (for dest hub) or `RECEIVED` (for origin hub).
8. **Trigger SMS/Email**: NotificationEngine dispatches retrieval codes to customer.
9. **Write Audit**: Audit log created immediately.

---

### 4.3 Detailed Condition Recording
Physical condition must be captured during custody transfers to allocate liability fairly. Categories include:
- `PRISTINE`: Fully sealed, no physical markings.
- `MINOR_DAMAGE`: Crushed corners, slightly torn wrapper.
- `CRITICAL_DAMAGE`: Open box, broken seals, leakage.
- `TAMPERED`: Evidence of tape tampering, suspicious reseals.
All non-pristine logs require high-resolution photographs saved as un-alterable metadata under the parcel’s database record.

---

### 4.4 Enterprise Bulk Parcel Check-In
When logistics trucks drop off multiple packages simultaneously, operators use the Bulk Intake workflow:
1. The operator opens a `Bulk Intake Session` mapped to the Dispatch Rider’s active transit manifest.
2. The system registers the session as `IN_INTAKE_PROGRESS`.
3. The operator rapidly scans package QR codes.
4. For each scan, the `WorkflowEngine` executes parallel checks: validating shipment association, checking eligibility, and allocating default overflow shelves.
5. Custody records are generated for each successful scan.

---

### 4.5 Non-Blocking Bulk Intake Principles
To keep physical warehouse lines moving, a single package failure must not block the entire truck’s check-in session:
- If package #15 fails validation (e.g., wrong destination or damaged), the software isolates that tracking ID as an `EXCEPTION` and requests the operator set it aside in a physical "Exception Bin".
- The session remains open, allowing package #16 to be scanned and processed normally.
- Upon session completion, the system renders a breakdown:
  `[Processed: 48] | [Rejected/Failed: 2] | [Total Manifest: 50]`

---

### 4.6 Preventative Duplicate Scanning Logic
To protect database integrity against rapid clickers or faulty scanners:
- If an operator scans a package that has already been registered in the current check-in session, the software intercepts the call.
- The system prevents the creation of duplicate custody transitions, double-shelving assignments, or redundant tracking messages.
- The operator is shown a soft warning displaying: *"Parcel WSH-XXXX already checked in under Shelf B1. No actions taken."*

---

### 4.7 Storage, Shelf, and Bin Allocation
- Every parcel inside a Hub must correspond to a physical storage index tracked in `InventoryEngine`.
- Physical layout coordinates must match the pattern: `[Section]-[Rack]-[Shelf]-[Bin]` (e.g., `SEC-B-SHELF3-BIN2`).
- High-security items (e.g., electronics, jewelry) must be routed by the `InventoryEngine` to a secure/locked safe designated for valuable goods.

---

### 4.8 Overflow & Spillover Capacity Management
When a Hub’s default shelves reach 90% physical capacity (tracked via `InventoryEngine` volume counts):
- The system automatically triggers the `Overflow Procedure`.
- Spillovers are directed to temporary staging zones or secondary floor locations (e.g., `OVERFLOW-ZONE-C`).
- The coordinate is updated in real-time, ensuring that overflow packages are never lost or left as "untracked" physical piles.

---

### 4.9 Custody Chain and Append-Only Architecture
- A package’s custody ledger is **immutable and append-only**.
- No database update may change, erase, or delete a past custody step.
- If a parcel check-in was logged in error, the operator must execute a `Reversal Event`. The faulty log remains in history as a deactivated event, while the corrective log is appended with a detailed system justification note.

---

### 4.10 Reliable Offline Hub Operations (Edge Cases)
To handle internet blackouts at physical hubs:
- Checked-in parcels are queued in local browser state (`indexedDB` or `localStorage`).
- Local queue operations are stamped with local device timestamps and marked as `PENDING_SYNC`.
- Once internet is restored, the synchronization engine pushes logs sequentially.
- The backend matches operations using unique, client-generated event UUIDs to ensure **idempotent execution** (preventing duplicate bookings or duplicate SMS alerts on multiple sync retries).

---

### 4.11 Secure Parcel Release & Collection
A parcel must never be physically released to any person without complete authorization verification:
1. **OTP Verification**: The customer must provide the 6-digit retrieval PIN sent to their registered phone number.
2. **ID Matching**: For high-value goods, Hub Staff must check a physical ID matching the recipient name in the system.
3. **Escrow Validation**: The `PaymentProtectionEngine` must confirm that the SafePay status is `ESCROW_AUTHORIZED_RELEASE` (meaning the buyer's funds are fully captured).
4. **Physical Scan**: The operator scans the parcel to confirm its state transition to `RELEASED`. This automatically triggers the Flutterwave escrow release to the Merchant.

---

### 4.12 Operational Investigation Holds
When legal, security, or customer disputes require freezing a package:
- Authorized Super Admins (or Hub Owners via incident report) can apply an `INVESTIGATION_HOLD`.
- When active, the system throws a strict block preventing custody transfers, riders from accepting transit tasks, or staff from completing release OTP validations.
- The parcel is locked physically in the Hub’s secure hold area.
- The hold can only be removed by an authorized administrative actor with documented resolution notes.

---

### 4.13 Shift Accountability and Staff Activity Logging
- All actions taken inside the Hub (scans, releases, exception logging) are signed with the active user’s session context.
- Daily reports can trace which specific staff member checked in a damaged package, preventing un-attributable losses or operational errors.

---

### 4.14 Operational Notification Framework
- **Merchant Notifications**: Initiated automatically via `NotificationEngine` when bulk sessions conclude or when a parcel condition change is recorded.
- **Customer Notifications**: OTP dispatch contains pickup locations, operating hours, and maps coordinates. Reminders are scheduled if a parcel remains shelved for over 48 hours.

---

### 4.15 Authority Mapping of Hub Operations
To maintain structural compliance with WeSabiHub rules, the internal software roles are assigned as follows:
- **WorkflowEngine**: Orchestrates complex transition sequences (e.g., "Release OTP -> Release State -> Escrow Payout").
- **ParcelEngine**: Evaluates logical state transitions and tracks state history.
- **InventoryEngine**: Manages physical shelf mapping and storage capacities.
- **AuditEngine**: Registers persistent transactional activity logs.
- **NotificationEngine**: Formulates and triggers external communications.
- **UserEngine / RBAC**: Verifies staff authorizations before allowing access to scan screens.

---

## CHAPTER 5: PAYMENT, SAFEPAY & FINANCIAL OPERATIONS

### 5.1 Payment Architecture & Gateway Integration
WeSabiHub manages a multi-provider financial infrastructure that ensures payment security, reliability, and automated fallback.
- **Authoritative Provider Assignments**:
  - **Flutterwave**: The primary and authoritative payment provider for **SafePay protected transactions** (escrow accounts). High-risk, protected funds are routed here to isolate buyer payments securely.
  - **Paystack**: The primary payment provider for standard, non-escrow platform transactions, including registration fees, wallet funding, and general platform charges.
- **Engine-Level Governance**:
  - The frontend is strictly forbidden from assessing payment outcomes. It can only display transaction statuses queried from the backend.
  - The backend `PaymentEngine` and `PaymentProtectionEngine` are the sole authorities for orchestrating, verifying, and recording payment states.
  - If a platform charge fails on the primary provider (e.g., Paystack), `PaymentEngine` evaluates the fallback policies defined in `ConfigurationEngine`. If backup failover is enabled and the payment category is eligible, the engine automatically routes the retry to the backup provider (Flutterwave). Escrow-related transactions on Flutterwave are strictly prohibited from failover to ensure escrow account consistency.

---

### 5.2 SafePay Operational & Legal Model
SafePay is an escrow-style platform workflow managed by WeSabiHub to protect transactions between buyers (customers) and sellers (merchants).
- **Platform Regulatory Disclaimer**:
  - WeSabiHub is **NOT** a commercial bank, credit union, or licensed deposit-taking financial institution.
  - WeSabiHub does **NOT** claim to operate as an independently licensed escrow provider.
  - All funds processed under SafePay are securely received, processed, and held in trust by our licensed financial integration partner, **Flutterwave**.
  - WeSabiHub provides the operational coordination layer: mapping transaction references, evaluating inspection timers, validating physical release conditions, and orchestrating dispute resolutions.
  - Prior to any public launch, the complete transaction architecture and terms of service must be reviewed against applicable Nigerian financial laws (CBN guidelines) and the payment provider's merchant contracts.

---

### 5.3 SafePay Transaction Lifecycle
The transition of a protected SafePay transaction is modeled as an authoritative state machine:

```
    Transaction Initiated (PENDING_PAYMENT)
                    ↓
        Funds Secured (FUNDS_SECURED)
                    ↓
     Shipment Dispatched (SHIPMENT_IN_TRANSIT)
                    ↓
   Arrived & Shelved (DELIVERED_AWAITING_CONFIRMATION)
                    ↓
     Inspection Active (INSPECTION_IN_PROGRESS)
                    ↓
  [Customer Release]   [Customer Issue]      [Timer Expiry]
          ↓                    ↓                   ↓
  Released (PAYMENT_RELEASED) Dispute (DISPUTE_OPENED) Auto-Release
          ↓                    ↓                   ↓
  Settled (PAYMENT_COMPLETED) Resolution  Settled (PAYMENT_COMPLETED)
```

- **Operational State Mapping & Code Terminologies**:
  - **`PENDING_PAYMENT`**: The initial state when a transaction is generated in the system.
  - **`FUNDS_SECURED`**: Webhook received from Flutterwave; funds are captured and held in the merchant's dedicated `escrowBalance` inside their platform wallet.
  - **`SHIPMENT_IN_TRANSIT`**: Physical custody has transferred to a dispatch rider or logistics carrier.
  - **`DELIVERED_AWAITING_CONFIRMATION` / `INSPECTION_IN_PROGRESS`**: The parcel has arrived at the destination Hub and is shelved. The customer is notified, starting the `inspectionPeriodHours` countdown.
  - **`PAYMENT_RELEASED`**: Customer manually confirms satisfaction, or the inspection period expires without disputes. Funds transfer from the merchant’s `escrowBalance` to their `pendingBalance`.
  - **`DISPUTE_OPENED` / `UNDER_INVESTIGATION`**: Customer reports a discrepancy before the inspection window expires. Funds are frozen inside the escrow hold state, blocking manual release and automated timers.
  - **`REFUND_APPROVED` / `PARTIAL_REFUND_APPROVED`**: Dispute settled in favor of the customer. Escrow balance is decremented, and the customer's available balance is immediately credited.
  - **`PAYMENT_COMPLETED`**: Funds successfully settle into the merchant's available balance after clearing periods.
  - **`TRANSACTION_CLOSED` / `CANCELLED`**: The transaction is fully reconciled and archived.

---

### 5.4 Payment Amount Integrity
To prevent financial fraud, users must never be allowed to dictate transaction fees or item amounts from frontend fields.
- **Tamper-Proof Flow**:
  1. Frontend submits metadata (parcel volume, distance, shipping tier) to `/api/calculate-price`.
  2. `PricingEngine` calculates fees using rules supplied securely by `ConfigurationEngine` in node server memory.
  3. The system generates a persistent, signed payment reference linked to the computed amount.
  4. The backend communicates directly with the payment gateway provider using this secure, server-generated transaction record.
  5. Callback validation inspects the *actually received* currency and amount to ensure it matches the original server calculation before modifying database records.

---

### 5.5 Payment Verification Controls
- Every transaction is verified by the backend invoking the secure gateway endpoint via `PaymentEngine.verifyExternalPayment()`.
- **Validation Rules**:
  - The verification must evaluate transaction references (`tx_ref`), gateway transaction IDs, currency, and exact amount.
  - System-wide transaction logs are queried to prevent **replay attacks** (attempts to re-submit a previously completed transaction ID to gain double credit).
  - Successful verifications are written to the immutable ledger via `AuditEngine`.

---

### 5.6 Webhook Security & Signatures
Gateway notifications (webhooks) are highly sensitive entry points:
- **Authentication**: All webhooks must be verified using the provider's cryptographic signature header (e.g., verifying against secret signature keys).
- **Idempotency**: Webhook handlers store every processed event ID in a persistent ledger. If a duplicate webhook payload arrives, the system logs the duplicate but skips the business/financial logic to prevent double-crediting.
- **Direct Processing**: Webhook processing is handled entirely by the server and must never be triggered or bypassed by frontend actions.

---

### 5.7 Idempotent Financial Operations
Every financial state change (wallet credit, escrow transfer, refund) must run inside transactional DB blocks (`walletRepository.transaction`). Repeated sync operations must be idempotent:
- If a wallet-funding webhook is retried, the system checks if the platform payment reference is already marked `SUCCESS`. If yes, the balance-credit operation is blocked.
- Escrow release triggers must verify that the state is not already `PAYMENT_RELEASED` before adding funds to the pending balance, protecting the platform from duplicate payouts.

---

### 5.8 Authoritative Wallet Operations
Wallets are the central depository of platform balances. Balances cannot be modified from the frontend.
- **Balance Classifications**:
  - **`balance` (Available)**: Liquid funds immediately available for withdrawal or platform transactions.
  - **`pendingBalance`**: Funds released from escrow awaiting standard settlement clearing delays (e.g., 24-hour verification holds).
  - **`escrowBalance`**: Secured funds under Payment Protection that are locked until customer release, timer expiry, or dispute resolution.
- **Immutable Transaction Logs**:
  - Every balance adjustment (Funding, Debit, Credit, Refund, Adjustment, Settlement, Reversal) must create an atomic transaction record in `transactionRepository`.
  - Transaction records contain: Transaction ID, Wallet ID, User ID, Type (`CREDIT` / `DEBIT`), Category (e.g., `COMMISSION`, `REFUND`), Amount, Status, and Reference ID.
  - Wallets are prevented from falling below zero (`balance < 0`) unless explicitly overridden by authorized system overdraft parameters.

---

### 5.9 Refunds Management
- **Origination**: Refunds must only initiate through the administrative dispute resolution screen or secure automation (e.g., approved returns).
- **Linking**: Every refund record must link directly to the original gateway reference, original transaction record, reason code, authorized admin actor, and refund status.
- **Safety**: A refund automatically deducts funds from the merchant's `escrowBalance` (or available `balance` if already released) and credits the buyer's liquid wallet `balance`. Duplicate refund requests for the same transaction ID are blocked at the database engine level.

---

### 5.10 Separation of Disputes & Physical Custody
- The financial state of a transaction must remain conceptually decoupled from physical parcel custody.
- A parcel being marked as physically `RECEIVED_AT_CENTER` does not automatically trigger escrow release or refund.
- The financial ledger tracks who holds the money (Buyer, Escrow, Merchant, Platform), while the custody ledger tracks who holds the physical box (Merchant, Rider, Hub Section, Customer).
- Disputes freeze financial transitions but allow physical operations (like returns-to-sender or compliance storage) to continue under strict administrative tracking.

---

### 5.11 Financial Accountability & Auditing
- Every financial ledger write must record: User ID, Actor Role, Gateway Reference, Amount, Currency, Timestamp, Operation Code, and Status.
- Database access to transaction histories and wallet balances is restricted via role-based access control (RBAC), limiting read access to `FINANCE_OFFICER`, `FINANCE_ADMIN`, `SUPER_ADMIN`, and the account owner.

---

### 5.12 Fees, Commissions, and Allocations
- Platform fees, commission cuts, and partner shares must never be calculated on the frontend.
- **Commission Split Structure**:
  When a transaction is completed, `PaymentEngine` and `SettlementService` evaluate split configurations from the database:
  - **Gross Amount**: Total paid by the customer.
  - **Platform Share**: Platform commission fee for service facilitation.
  - **Hub Share**: Accrued earnings allocated to the originating and destination Hub Owners.
  - **Logistics Share**: Standard transit fees paid to dispatch/logistics companies.
  - **Merchant Amount**: The net payout cleared to the merchant’s wallet.
- All fee deductions, platform commissions, and partner earnings are recorded as distinct credit transactions.

---

### 5.13 Financial Settlement Processes
Settlements (transferring funds from pending balances or platform reserves to verified bank accounts) are executed securely via `SettlementService`:
1. **Verification**: Checks that the settlement profile is complete, payment status is `SUCCESS`, clearing periods have elapsed, and no active disputes are flagged on the associated transactions.
2. **Trigger**: Initiated by a user calling `requestWithdrawal()` or scheduled administrative routines.
3. **Execution**: The backend makes secure payout requests to Paystack/Flutterwave and moves the requested available balance to `settlement_pending`.
4. **Completion**: Upon signature-verified gateway webhook confirmation of withdrawal success, the balance is deducted permanently, and status shifts to `COMPLETED`.

---

### 5.14 Financial Holds, Escrows, and Locks
The system supports multiple automated financial freeze states:
- **Escrow Hold (`escrowBalance`)**: Standard Payment Protection hold applied automatically upon successful shipment payment.
- **Dispute Lock**: When a dispute is filed, funds are blocked from automatic timers or manual customer releases.
- **Compliance Freeze**: Handled via `RiskEngine` or `AdminEngine` to lock a user’s entire wallet if fraud, tampering, or compliance breaches are suspected, disabling all withdrawals, credits, and debits until manually unblocked.

---

## CHAPTER 6: DISPUTES, RETURNS, EXCEPTIONS & CUSTOMER PROTECTION

### 6.1 Dispute Categorization & Integrity Rules
To maintain commercial trust and support precise problem resolution, WeSabiHub strictly separates disputes into distinct conceptual categories. Operational workflows must never treat these issues interchangeably:
- **Parcel Disputes**: Focused on physical issues like item damage, broken seals, missing parts, or incorrect package content.
- **Payment Disputes**: Initiated for transaction issues such as incorrect debits, duplicate charges, billing errors, or refund failures.
- **SafePay Disputes**: Focuses on escrow lockups, non-delivery reports, or merchant-buyer disagreements during the active inspection window.
- **Logistics Disputes**: Focused on carrier errors including dispatch pickup delays, transport route deviations, or uncooperative riders.
- **Hub Operational Complaints**: Covers staff misbehavior, incorrect physical shelf logging, or center storage billing discrepancies.
- **Integrity Rule**: Opening a dispute creates a separate, cross-referenced audit record. Under no circumstance may a dispute edit, delete, or overwrite any historic custody log, ledger transaction, or original tracking event.

---

### 6.2 Authorized Dispute Initiators and Roles
Different roles may initiate disputes or report exceptions depending on their relationship with the physical parcel or transaction:
- **Customers (Buyers)**: May open disputes regarding:
  - Parcel damage, wet items, or compromised box seals detected at delivery.
  - Receipt of incorrect items or empty boxes.
  - Unauthorized collection (someone else obtaining their pickup PIN).
  - Webhook or payment processing anomalies.
  - Unjustified merchant rejections of valid return requests.
- **Merchants**: May open disputes regarding:
  - Damage or tampering occurring while the parcel was held in Hub custody.
  - Inaccurate custody transitions logged by Hub operators.
  - Delivery failures or delays caused by Logistics Partners or Dispatch Riders.
  - Settlement delays or incorrect wallet commission deductions.
- **Hub Operators / Owners**: May report:
  - Consigned packages with physical tears, wet wrappers, or broken seals during check-in.
  - Unreadable barcodes, missing/faulty QR labels, or suspicious package contents.
  - Inventory discrepancies (discrepancy between system counts and physical shelves).
- **Logistics Partners & Dispatch Riders**: May report:
  - Merchant drop-off delays or pickup failures.
  - Customer absence or refusal of physical hand-over.
  - Transport exceptions (vehicle breakdown, accident, or force majeure).
  - Unauthorized hand-over attempts by unverified hub staff.
- **Platform Administrators & Compliance Officers**: May initiate system-wide investigations, suspend accounts, and freeze transactions when fraud, systemic errors, or terms of service violations are suspected.
- **General Principle**: No participant may initiate a dispute to bypass normal platform verification, skip mandatory fees, or override security checks.

---

### 6.3 Database Dispute Linking & Traceability
Every dispute must structurally tie to its exact context to prevent detached or untraceable records. The `Dispute` schema maintains explicit, indexed relationships to:
- `userId` (Initiating Actor identity).
- `shipmentId` (Contractual order reference).
- `parcelId` (Physical package reference).
- `transactionId` (Financial payment reference).
- `paymentProtectionId` (SafePay escrow reference, if applicable).
- `custodyId` (Last recorded custody transfer record).
- `hubId` (Contextual center reference).
- `dispatchJobId` / `logisticsJobId` (Associated transport record).
All original shipment, payment, and custody tables must remain immutable; the dispute behaves as a supplementary operational event layer.

---

### 6.4 Immutable Evidence Freeze & Storage Rules
To ensure fairness and prevent tampering during investigation, all submitted evidence must be safeguarded:
- **Evidence Snapshots**: Upon dispute creation, the system captures immediate snapshots of peer messages, photographs taken by Hub operators during intake, and tracking timestamps.
- **Allowed Evidence Formats**: High-resolution photos, MP4 video unpackings, delivery receipts, and digital signature proofs.
- **Immutability Barrier**: Once submitted, evidence files cannot be edited, overwritten, or deleted by either the customer or merchant.
- **Version History**: If supplementary evidence is requested by an administrator, the new file is appended to the dispute dossier, maintaining an explicit timestamped list of all historical versions.

---

### 6.5 Physical Parcel Condition Disputes
When physical cargo condition is contested (e.g., delivered item is wet, damaged, or tampered with):
- The platform retains the physical inspections recorded during every custody hand-over:
  `[Merchant Handover Condition] -> [Origin Hub Intake] -> [Transit Rider Check-out] -> [Destination Hub Intake]`
- **Attribution Logic**: The system does not automatically attribute fault to the active handler. Responsibility is calculated based on:
  - The exact point in the custody chain where the exception was first logged.
  - Digital photograph verification comparing origin intake photos against recipient drop-off photos.
  - The physical state of the box seals recorded at intermediate scan terminals.
- If the custody logs show a package was checked out of a Hub as `PRISTINE` but scanned into a transit bag as `TAMPERED`, the system automatically flags the logistics handler as potentially responsible and escalates the ticket for administrative mediation.

---

### 6.6 Missing Parcel Investigations
If a tracking record has been idle past SLA limits, or a merchant reports a package missing:
- **Audit Trace**: The `DisputeEngine` queries the last verified custody log to establish a starting physical coordinate.
- **Checklist Audit**:
  - Verification of the last physical shelf/bin coordinates inside the responsible Hub.
  - Review of the last rider signature or barcode hand-over timestamp.
  - Evaluation of active camera logs or shift hand-overs inside the coordinate window.
- The platform remains strictly evidence-based and prohibits automatic accusations or automated financial penalties against staff or carriers until the physical investigation has been resolved.

---

### 6.7 Compliance, Investigation, and Secure Parcel Holds
When dangerous, restricted, or illegal cargo is reported or suspected:
- Authorized administrators or Hub Owners can transition a parcel's state to `INVESTIGATION_HOLD` (utilizing the neutral system designations: **Compliance Hold**, **Investigation Hold**, or **Secure Parcel**).
- **Enforcement Rules**:
  - The system blocks all manual release OTP attempts, transit assignments, and customer-facing notifications.
  - A secure physical hold coordinate is assigned in a locked administrative vault.
  - The system preserves all sender, merchant, and intermediary custody identities.
  - Only authorized compliance officers holding the `COMPLIANCE_OFFICER` or `SUPER_ADMIN` RBAC permission may lift the hold or release the parcel details to legal authorities.

---

### 6.8 Return Request Lifecycle
Return requests are handled as controlled, automated workflows that do not bypass platform verification rules. The lifecycle states are defined as follows:
- **`REQUESTED`**: Customer submits return application, attaching clear photographic proof of wrong or defective merchandise.
- **`APPROVED`**: Merchant or platform admin reviews the evidence and accepts the return.
- **`REJECTED`**: Return denied due to policy expiration or lack of supportive proof.
- **`RECEIVED_AT_CENTER`**: Physical return package is handed over to the Hub and checked in.
- **`COMPLETED`**: Return package is physically scanned and accepted back by the origin merchant, automatically releasing the escrow refund.
- **`CANCELLED`**: Return application withdrawn by the customer.

---

### 6.9 Authoritative Business Rule: Logistics is Optional
- **Core Principle**: Creating a shipment **DOES NOT** automatically require or trigger the creation of a physical Logistics Job. Logistics is a strictly optional fulfillment method.
- **Fulfillment Tiers**:
  - **Hub Pickup (Self-Collection)**: Senders drop off packages at the origin Hub; receivers manually collect them from the destination Hub. No third-party dispatch or transit carrier is engaged.
  - **Logistics Delivery (Door-to-Door / Hub-to-Door)**: A third-party dispatch rider or logistics partner is scheduled to transport the goods.
- **Logistics Job Constraint**: The software **MUST NEVER** generate a `LogisticsJob` or notify transit partners upon shipment booking unless the shipment creator has explicitly selected and confirmed "Logistics Delivery" as their active fulfillment tier. If Hub Pickup is selected, the parcel remains completely operational within standard hub custody pathways without any logistics dependency.

---

### 6.10 Shipment Creation & Fulfillment Selection Flow
The unified shipment booking workflow strictly executes the following sequence:

```
                  Start Shipment Creation (Verified Merchant)
                                      ↓
                     Enter Origin & Destination Details
                                      ↓
                     Input Recipient & Parcel Metadata
                                      ↓
                         Select Fulfillment Method
                                    /   \
                                   /     \
                       [Hub Pickup]       [Logistics Delivery]
                                  |         |
                     Calculate Price         Calculate Price + Delivery Fee
                                  \         /
                                   \       /
                            Execute Authoritative Payment
                                      ↓
                            Generate Shipment Record
                                      ↓
                  Initialize Logistics Job ONLY IF Delivery Selected
```

---

### 6.11 Hub-Assisted Shipment Booking Constraints
A Hub Owner or authorized Hub Staff member may book shipments for merchants who visit the center, subject to strict boundary rules:
- **Merchant Verification Prerequisite**: The customer on whose behalf the shipment is created must be a verified platform merchant. Hub Owners are **prohibited** from booking shipments for ordinary, unverified customers.
- **Audit Linking**: The system logs the actual owner (Verified Merchant ID), the initiating Hub ID, and the individual Staff ID who handled the booking.
- **Ownership Partition**: The Hub Owner acts as an operational facilitator only and never assumes commercial ownership or financial liability for the goods during creation.

---

### 6.12 Customer vs. Merchant Role Boundary
To maintain compliance and structural separation of roles:
- **Customer Role capabilities**: Limited to tracking parcels, receiving deliveries, paying invoices, releasing SafePay escrow funds, submitting return requests, and opening customer-facing disputes.
- **Shipment Prohibitions**: A standard customer account cannot create commercial shipments, book bulk uploads, or bypass merchant KYC gates.
- **Role Elevation**: To obtain shipment creation privileges, customers must undergo official merchant onboarding—supplying commercial business credentials and completing government-issued identity verification. The customer and merchant profiles remain structurally separate even if mapped to the same unified login credential.

---

### 6.13 Return and Logistics Interaction
Returns are not forced to follow a single logistics pathway:
- **Logistics Returns**: If selected, the system triggers a dispatch job to collect the package from the customer and deliver it to the local Hub.
- **Manual Hub Returns**: The customer physically drops the return package at their nearest WeSabiHub branch. It is routed back to the origin merchant using the platform's standard Hub-to-Hub transfer networks, avoiding redundant carrier costs.

---

### 6.14 Dispute Status Lifecycle
Disputes navigate through a strict state-transition timeline enforced by `DisputeEngine`:
- **`OPENED`**: Initial ticket logged; financial transactions locked.
- **`UNDER_REVIEW`**: Admin has assigned the case to an investigator.
- **`EVIDENCE_REQUESTED`**: Additional documentation or unboxing videos requested from parties.
- **`EVIDENCE_SUBMITTED`**: Requested assets successfully uploaded and frozen.
- **`INVESTIGATION`**: Physical hub checkouts or carrier logs are being audited.
- **`RESOLUTION_PENDING`**: Final draft of administrative decision generated.
- **`RESOLVED`**: Case finalized; dispute resolved.
- **`REJECTED`**: Case dismissed due to false claims or lack of proof.
- **`CANCELLED`**: Customer revokes the dispute before investigation.
- **`ESCALATED`**: Dispute elevated to regional compliance managers.
- **`CLOSED`**: Dispute archived and logged.

---

### 6.15 Dispute Resolution & Financial Payout Gates
Dispute resolutions can trigger different outcomes, but any resulting financial settlement must adhere to strict platform constraints:
- **Allowed Outcomes**: Complete refund to buyer, release of full escrow funds to merchant, negotiated partial splits, physical return of cargo, or compliance holds.
- **Financial Engine Payout Gates**: The `DisputeEngine` is strictly **forbidden** from directly modifying user wallet balances, adjusting transaction tables, or calling bank transfer APIs. Any financial resolution must be passed to `PaymentEngine` and `PaymentProtectionEngine` as an authorized, signed system command, verifying that every ledger balance shift is validated, authorized, and audited under transactional security.

---

### 6.16 Dispute Audit Trail
Every dispute action must be logged chronologically to prevent administrative fraud:
- **Audit Log Metadata**: Dispute ID, Operator User ID, Operator Role, Action taken (e.g., Status Transition, Evidence Appended, Refund Initiated), Timestamp, Prior Status state, and New Status state.
- **Immutability**: This audit table is append-only. It is physically protected against deletions, updates, or edits by database rules.

---

### 6.17 Customer Protection and Privacy Standards
Customer protection mechanisms must prioritize user-facing safety and strict data privacy:
- **Verified Deliveries**: All package collections require unique OTP verification to prevent unauthorized pickup.
- **Data Partitioning**: Customers are strictly forbidden from viewing internal administrative notes, merchant business files, other users' tracking records, or Hub capacity metrics. The system blocks all cross-tenant database reads.
- **Transparent Billing**: Delivery fees, platform charges, and storage rates are calculated transparently and shown to the customer before payment is completed.

---

### 6.18 Platform Anti-Fraud Protocols
To guard against physical and digital exploits, the platform enforces the following protections:
- **Gateway Validation**: The system verifies payment success via independent backend gateway API calls, neutralizing browser-manipulated payment success claims.
- **Token Single-Use Rules**: Retrieval OTPs and parcel QR codes are automatically invalidated upon successful scan or check-out, rendering duplicate attempts useless.
- **State Transition Safeguards**: The `ParcelEngine` blocks invalid custody steps (e.g., transitioning a parcel directly from `CREATED` to `RELEASED` without passing through physical Hub check-in).

---

### 6.19 Operational Data Transparency
Each role receives a tailored, secure operational view of platform data:
- **Customers**: Can view tracking state, delivery pins, invoice status, and open dispute statuses.
- **Merchants**: Can access shipment booking histories, inventory levels, wallet balances, and merchant return policies.
- **Hub Owners / Staff**: Limited to managing local Hub inventory, physical storage layout mapping, check-in scanning screens, and local staff shift records.
- **Logistics Partners**: Limited to managing active dispatch transit manifests, rider assignments, and assigned route coordinates.
- **Administrators**: Enjoy full visibility into audits, disputes, and compliance holds, restricted by role-based credentials.

---

### 6.20 Operational Constitutional Alignment
Every standard defined in this specification aligns with the core principles of the WeSabiHub Constitution:
- Ordinary customers are restricted from creating shipments.
- Hub Owners can only book shipments on behalf of registered, verified merchants.
- Logistics is completely optional; no dispatch jobs are triggered for Hub Pickup selections.
- Wallet balances and escrow transfers are handled strictly by secure server engines.
- Every state transition, financial movement, and dispute resolution is fully validated, authorized, and written to the append-only audit ledger.

---

## CHAPTER 7: PARCEL LIFECYCLE, CUSTODY, CHECK-IN, STORAGE, RELEASE & OPERATIONAL EXCEPTIONS

### 7.1 Parcel Lifecycle Principle
The parcel lifecycle must be based on authoritative state transitions. A conceptual lifecycle includes:
- `SHIPMENT_CREATED`
- `AWAITING_ORIGIN_ACCEPTANCE`
- `ACCEPTED_AT_ORIGIN_HUB`
- `IN_CUSTODY`
- `IN_TRANSIT`
- `ARRIVED_AT_HUB`
- `STORED`
- `READY_FOR_PICKUP`
- `RELEASE_PENDING_VERIFICATION`
- `RELEASED`
- `COMPLETED`

The specification distinguishes between conceptual business states, authoritative database states, and frontend display labels.

### 7.2 Shipment Creation vs. Parcel Creation
Maintain a clear distinction between shipment creation, parcel creation, parcel custody, fulfillment method, and Logistics Job creation:
- A shipment may contain one or multiple parcels.
- Logistics is optional. The authorized shipment creator must select the applicable fulfillment method (e.g., Hub Pickup, Logistics Delivery).
- A Logistics Job is created **ONLY** when Logistics is explicitly selected and confirmed.

### 7.3 Authorized Shipment Creation
Only authorized users may create shipment requests:
- **Merchant**: May create shipments and bulk shipments (if authorized) upon satisfying verification requirements.
- **Hub Owner**: May create shipments **ONLY** on behalf of a verified Merchant. Cannot create shipments for ordinary Customers.
- **Customer**: Cannot create shipments under the Customer role. Must separately activate/obtain the Merchant role and complete verification first.
- **Logistics/Dispatch Rider**: Executes assigned movements, but does not create shipments.

### 7.4 Merchant Parcel Flyer
A merchant may provide approved branding information for parcel presentation (Merchant Parcel Flyer):
- Can contain: Merchant business name, logo, thank-you message, parcel reference, WeSabiHub branding.
- Cannot expose sensitive personal information or modify official WeSabiHub records.
- Distinguishes between merchant-provided branding and official/operational WeSabiHub information.

### 7.5 Parcel Arrival & Check-In
When a parcel arrives at a Hub, authorized personnel initiate the check-in workflow:
- Validate parcel against shipment, verify destination and merchant ownership.
- Inspect condition, capture evidence if required, assign storage location, record custody event.
- Generate receipt, notify parties, audit the operation.
- The Hub must not accept unrelated parcels into a shipment without authorized exception handling.

### 7.6 Bulk Parcel Check-In
For bulk shipments by verified Merchants, Hub personnel process it via Bulk Parcel Check-In:
- Starts a Bulk Intake Session, scans parcels, validates associations, checks duplicates, inspects condition, assigns shelf.
- Records custody event, updates progress.
- The session is not complete until explicitly finalized by the operator.

### 7.7 Non-Blocking Bulk Intake
A single parcel exception (e.g., duplicate, damaged, wrong label, missing) must not automatically terminate the entire bulk intake session.
- The session remains active where operationally safe.
- Affected parcels are marked with their specific exception state, preserving parcel ID, exception type, operator, timestamp, reason, and audit record.

### 7.8 Duplicate Parcel Scanning
If a parcel is scanned multiple times during a bulk session:
- The system must detect the duplicate, not create a duplicate custody record/parcel, and not double-count it.
- The system displays the parcel's current authoritative state (status, Hub, shelf, last scan).
- The session continues.

### 7.9 Parcel Condition Recording
Parcel condition must be recorded at relevant custody transitions (e.g., Good, Damaged, Wet, Broken Seal, Missing Items, Quantity Mismatch).
- Condition records must not overwrite previous custody-condition records.
- Each observation is associated with the Parcel, Shipment, Custody event, Actor, Role, Location, Timestamp, and Evidence.

### 7.10 Photo Evidence
Where required, authorized Hub personnel may capture a photograph:
- Supports native device camera capture or file upload.
- Secure upload and storage controls are preserved.
- Photos are linked to the correct parcel/custody event.
- Unauthorized users cannot access private evidence, and evidence cannot be silently replaced.

### 7.11 Damaged & Missing Parcels
- **Damaged Parcels**: Condition recorded, evidence captured, event added to custody history. Exception state assigned, relevant parties notified. Responsibility is determined through evidence/custody history, not automatically assigned.
- **Missing Parcels**: Handled as an operational exception. System preserves last known location/custodian/scan. Original custody history remains immutable.

### 7.12 Rejected Parcels
Controlled rejected-parcel workflow at intake (e.g., wrong destination, prohibited goods, damaged beyond acceptance):
- Does not silently disappear.
- System records rejection reason, actor, timestamp, hub, parcel, shipment, evidence, next operational action (e.g., return to sender, compliance hold).
- Rejection does not automatically create a Logistics Job unless explicitly selected.

### 7.13 Shelf Assignment & Overflow Storage
- **Shelf Assignment**: Supports controlled categories (e.g., Standard, Fragile, Valuable, Overflow) based on authoritative InventoryEngine configuration.
- **Overflow Storage**: If primary storage is full, InventoryEngine determines overflow/temporary storage availability. Original requested location, actual assigned location, reason, and actor are preserved.

### 7.14 Hub Storage & Parcel Timeline
- **Hub Storage**: Represents authoritative physical custody state (awaiting pickup, in transit, exceptions, holds). Prevents unauthorized modification.
- **Parcel Timeline**: Clear chronological operational timeline (shipment accepted, checked in, stored, dispatched, etc.). Based solely on authoritative events; frontend pages must not invent events.

### 7.15 Customer Pickup & Release Verification
- **Customer Pickup**: Notification includes parcel status, pickup Hub location, operating hours, amount due, and OTP/QR.
- **Release Verification**: Hub personnel verify Parcel ID, QR, receiver details, OTP/PIN, payment status. Successful release records the parcel, customer, hub, operator, timestamp, and verification result.

### 7.16 Failed Release Attempts
The system protects against repeated unauthorized release attempts using attempt counters, temporary locks, security alerts, and audit records.

### 7.17 Shift Management & Custody Chain
- **Shift Management**: Actions are associated with an active staff shift (start/end time, parcels processed, actions). Supplements operational accountability but doesn't replace audit logs.
- **Custody Chain**: Every significant physical custody transition is traceable and append-only. Corrections require controlled corrective events; historical events cannot be rewritten.

### 7.18 Offline Operations & Bulk Completion
- **Offline Operations**: Distinguishes locally queued vs. authoritatively synchronized actions. Synchronization must be idempotent; duplicate events must not be created.
- **Bulk Completion**: Explicit finalization by the operator generates an authoritative summary (total expected, scanned, accepted, duplicates, damaged, rejected, etc.).

### 7.19 Notifications & Audit Requirements
- **Notifications**: Role-aware. Merchants receive operational milestones (bulk intake started/completed, exception summaries). Customers receive customer-relevant milestones (arrived, ready for pickup, payment required).
- **Audit Requirements**: Every significant action (shipment/parcel creation, bulk session, scan, check-in, shelf assignment, custody transfer, release, offline sync, dispute/return creation) is audited (Actor, Role, Action, Target, Timestamp, Result).

### 7.20 Engine Responsibilities
- **WorkflowEngine**: Orchestrates multi-step workflows.
- **ParcelEngine**: Authoritative parcel state/custody logic.
- **InventoryEngine**: Storage location/capacity logic.
- **PaymentEngine** / **PaymentProtectionEngine**: Financial workflows.
- **NotificationEngine**: Notification orchestration.
- **AuditEngine**: Audit event recording.
- **DisputeEngine**: Dispute lifecycle.
- **UserEngine**: User identity and roles.
- No frontend page should independently recreate these rules.

### 7.21 Engineering Constitution Alignment
- Customers cannot create shipments under the Customer role (must activate Merchant role).
- Verified Merchants and authorized Hub Owners (on behalf of verified Merchants) can create shipments.
- Logistics does not create shipments and is strictly OPTIONAL.
- Shipment creation does NOT automatically create a Logistics Job.
- All state transitions, parcel custody, financial workflows, and sensitive actions are appropriately segregated, authorized, persisted, and audited.

---

## CHAPTER 8: PAYMENTS, SAFE PAY, WALLETS, REFUNDS, DISPUTES & FINANCIAL OPERATIONS

### 8.1 Financial Architecture Principle
WeSabiHub strictly separates the following financial systems:
1. Normal Platform Payments
2. SafePay protected transactions
3. User Wallet balances
4. Merchant payments
5. Hub earnings
6. Logistics payments
7. Refunds
8. Disputes
9. Platform commissions
10. Financial adjustments

Each operation must use the correct authoritative Engine and payment provider. No frontend page may directly modify financial balances or declare a payment successful. Users cannot manually edit payment amounts, wallet balances, transaction statuses, refund statuses, commission amounts, or SafePay release statuses.

### 8.2 Payment Provider Separation
- **Flutterwave**: Authoritative provider for WeSabiHub SafePay protected transactions.
- **Paystack**: Handles normal platform payments where configured.
SafePay is strictly separated from normal platform payments. The product terminology remains "SafePay", "Protected Payment", or "Payment Protection", not an independent escrow service unless explicitly supported by legal/financial structure.

### 8.3 SafePay Principle
SafePay protects transactions between parties:
1. Buyer initiates protected transaction -> exact amount calculated -> buyer confirms.
2. Flutterwave processes payment -> webhook verified -> payment status becomes authoritative (funds held).
3. Seller fulfills transaction -> buyer receives/confirms -> protection period/condition satisfied -> funds released.
Funds must not be released solely via a frontend button click.

### 8.4 Exact Payment Amount
The platform calculates authoritative payment amounts (item amount, shipping fee, platform/service fees, discounts). Users cannot override this system-generated amount. The frontend displays the amount but is not trusted as the authority.

### 8.5 Payment Creation & Status
- **Payment Creation**: Platform creates authoritative transaction records containing payer, payee, order/shipment/parcel details, amount, currency, provider reference, status, and timestamp. Duplicate creation on retries is prevented.
- **Payment Status**: Authoritative states include `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `DISPUTED`, `HELD`, `RELEASED`. A frontend success page does not mean success; it must be confirmed through trusted verification.

### 8.6 Payment Callback & Webhook Security
Callbacks/webhooks are untrusted until verified (provider signature, reference, amount, currency, account association, status, replay/duplicate protection). Operations must be idempotent.

### 8.7 SafePay Release & Protection Window
- **Release Conditions**: Successful payment, successful fulfillment, buyer confirmation, expiration of protection window, no active blocking disputes/returns. Release must be authenticated, authorized, validated, atomic, idempotent, and audited.
- **Protection Window**: Begins when buyer receives item. Buyer can confirm receipt, open a dispute, or request a return. If conditions are met and no blocking dispute exists, funds are released. Timings are configurable via platform policy, not hardcoded.

### 8.8 Disputes & Resolution
- **Disputes**: Arise from missing/wrong/damaged items, fraud, etc. Valid disputes put relevant transactions on hold; SafePay funds are not released. Disputes are associated with User, Transaction, Shipment/Parcel, Reason, Evidence, Status, Timestamp, Resolution, and handled by `DisputeEngine`.
- **Resolution**: Outcomes (refunds, release to seller, return required, etc.) must be authorized, recorded, audited, and linked to the transaction. Conflicting financial outcomes are prevented.

### 8.9 Returns & Refunds
- **Returns**: A return request is separate from a financial refund (requested -> reviewed -> approved -> returned -> received -> verified -> refund authorized -> processed). Refunds are not automatic upon return request.
- **Refunds**: Processed via authoritative payment workflow. Prevents duplicate refunds. Total refunded amount never exceeds the eligible original transaction amount.

### 8.10 Wallet System & Funding
- **Wallet System**: Balances are financial records modified only by authoritative events (funding, debit, credit, refund, adjustment, withdrawal). Double-spend protection is enforced (no double credits/debits, negative balances, race conditions).
- **Funding**: Initiated -> processed -> verified (webhook/trusted response) -> wallet credited exactly once.

### 8.11 Earnings & Payments (Merchant, Hub, Logistics)
- **Merchant Payments**: Must be associated with correct merchant identity/transaction. Distinct from customer payment, platform commission, etc.
- **Hub Earnings**: Calculated centrally from authoritative completed transactions, auditable. Hubs cannot alter their earnings.
- **Logistics Payments**: Separate from shipment creation. Logistics is optional. Creating a shipment does not automatically create a Logistics Job. No Logistics Job/fee if Hub Pickup is selected.

### 8.12 Payment Before Pickup & Release Verification
- **Payment Before Pickup**: Customers see Parcel, Amount Due, Payment Status, Pay Now, Pickup details. Not required to manually calculate amounts.
- **Release Verification**: Hub must verify authoritative payment status. Release workflows must not trust screenshots, user claims, or frontend-only status.

### 8.13 Financial Holds & Compliance
- **Holds**: Placed on transactions during disputes, fraud suspicion, pending returns, or compliance investigations. Traceable, preventing unauthorized release.
- **Compliance**: Suspicious activity (failed payments, unusual patterns, multiple accounts) triggers controlled investigation. Actions are auditable.

### 8.14 Financial Audit Trail & Data Privacy
- **Audit Trail**: Every financial event (initiation, webhook receipt, wallet update, refund, SafePay hold/release, dispute, commission calculation, adjustment) is audited with Actor, Transaction, Amount, Currency, Provider, Reference, Previous/New state, Timestamp, Result.
- **Data Privacy**: Users access only authorized financial information. Customers, Merchants, and Hubs cannot view each other's private financial records.

### 8.15 Role-Based Financial Permissions
- **CUSTOMER**: Can make payments, fund wallet, use SafePay, view own transactions/status, open disputes. Cannot modify records/balances or release SafePay manually.
- **MERCHANT**: Can receive payments, view own records, use SafePay. Cannot manually alter commissions or SafePay state.
- **HUB OWNER**: Can view authorized Hub earnings. Cannot modify financial balances, release SafePay outside workflows, or alter commissions.
- **LOGISTICS / DRIVER**: Can view necessary financial information for assigned jobs. Cannot modify records or wallet balances.
- **SUPER ADMIN**: Highest authority, but all actions remain authenticated, authorized, controlled, and audited.

### 8.16 Payment Failure Recovery & Outages
- **Recovery**: Failed processing does not assume success. Transactions remain pending/unresolved. Controlled reconciliation, idempotent retries.
- **Provider Outage**: If Flutterwave/Paystack fail, platform fails safely. No fabricated success, unverified credits/releases, or parcel releases based on claims.

### 8.17 Financial Reconciliation
Reconciliation between WeSabiHub, provider records, wallet, SafePay, refunds, commissions, and earnings. Discrepancies are traceable. Historical records are not silently modified; corrective events are recorded separately.

### 8.18 Financial Engine Responsibilities
- `PaymentEngine`: Normal payment workflows.
- `PaymentProtectionEngine`: SafePay workflows.
- `WalletEngine`: Wallet operations/integrity.
- `TransactionEngine`: Authoritative transaction records.
- `CommissionEngine`: Commission calculations.
- `DisputeEngine`: Dispute lifecycle.
- `WorkflowEngine`: Orchestrates workflows.
- `AuditEngine`: Records financial events.

### 8.19 Financial Engineering Constitution Alignment
- No client-side balance modification, frontend-only payment success, unverified webhooks, duplicate webhook effects, duplicate credits/refunds, or double SafePay releases.
- No financial action without authorization and audit logging.
- No parcel release based solely on unverified payment claims.
- No automatic Logistics Job/fee when not explicitly selected.
- Flutterwave handles SafePay; Paystack handles normal platform payments. SafePay remains distinct.

---

## CHAPTER 9: TRUST, SAFETY, COMPLIANCE, IDENTITY VERIFICATION & ANTI-FRAUD OPERATIONS

### 9.1 Trust & Safety Principle
The platform must know who is responsible for each sensitive operational action. Every action must be attributable to a verified user, authenticated account, authorized role, device/session, timestamp, relevant shipment/parcel, and operational location (if applicable). Records must be sufficient to investigate disputes, fraud, prohibited goods, theft, abuse, and misconduct.

### 9.2 Customer Registration & Role Separation
- **Customer Registration**: Remains simple (Name, Email, Age/DOB, Password). Does not automatically grant shipment-creation privileges.
- **Role Separation**:
    - **Customer**: Receives/tracks parcels, uses SafePay, opens disputes/returns. Cannot create shipments/parcels.
    - **Merchant**: May create/bulk-shipments upon verification.
    - **Hub Owner/Staff**: Hub Owner operates Hub, creates shipments ONLY for verified Merchants. Staff perform authorized operational tasks.
    - **Logistics/Dispatch**: Moves parcels, but does not create shipments.

### 9.3 Merchant Verification & Bulk Shipments
- **Adding Merchant Role**: Requires approved role-management flow (identity/business checks, Agreement acceptance). Verification must be passed before shipment creation privileges are granted.
- **Merchant Verification**: Depends on policy (Legal name, ID document, Phone/Email verification, Face/Biometric (if allowed), Business/CAC registration, Business address, Proof of ownership).
- **Bulk Shipments**: Higher operational/safety risk; requires Merchant verification.

### 9.4 Shipment Creation Responsibility
- **Hub-on-behalf-of-Merchant**: Hub creates shipment ONLY for a verified Merchant (identifying Merchant, Hub, Operator, Timestamp). Never for an ordinary Customer.
- **Accountability**: Creation events must identify the Merchant responsible, the Hub, the specific operator, and the authenticated account.

### 9.5 Identity, Compliance & Holds
- **Verification**: Identity/Face verification (if legally permitted) for high-risk/value transactions or roles. CAC info for registered businesses.
- **Prohibited/Dangerous Goods**: Prohibited/Restricted list is authoritative. Dangerous goods require specific declarations/labeling/approval.
- **Compliance Holds**: Controlled state for investigation (Prohibited/Stolen goods, fraud, etc.). Must be authorized, reason-coded, audited, and traceable. Neutral terminology like "Compliance/Investigation/Security Hold" is preferred.

### 9.6 Parcel Evidence, Hub Accountability & Privacy
- **Parcel Evidence**: Condition/packaging/label photographs, operator identity, custody records, etc. Secure upload/storage; unauthorized users cannot access private evidence.
- **Operator Accountability**: Every sensitive Hub action (check-in, release, rejection, investigation hold, etc.) must be attributable to the individual operator.
- **Customer Privacy**: Customer info is accessible only for legitimate operational purposes (Hub release, Logistics delivery).

### 9.7 Security Signals & Fraud Prevention
- **Security Signals**: OTP failures, unusual shipment patterns, bulk shipment spikes, refund/dispute spikes, identity verification failures. Triggers review/verification; not automatic proof of crime.
- **OTP/Release Security**: Parcel release requires authorized verification (Parcel ID, QR, OTP/PIN). Limits failed attempts, prevents guessing.

### 9.8 Compliance, Consent & Account Management
- **Retention**: Policies defined for identity/verification records, audit/shipment/custody/payment/dispute records, evidence, and legal agreements.
- **Consent**: Immutably record acceptance (ToS, Privacy Policy, Merchant/Hub/Logistics Agreements, SafePay terms). Version updates supported.
- **Suspension/Revocation**: Accounts/roles suspended/revoked for fraud, policy violations, verification failure, etc. Auditable and traceable.

### 9.9 Engineering Constitution Alignment
- No anonymous shipment creation, Customer shipment creation, or Logistics-based shipment creation.
- No bypass of Merchant/Identity/Business verification.
- No silent role escalation, unauthorized role changes, or deletion of audit evidence by ordinary users.
- No frontend-only security enforcement or UI-only permissions.
- All sensitive actions are authenticated, authorized, validated, persisted, and audited.

### 9.10 Authoritative Engine Responsibilities
- `UserEngine`: User identity/profile state.
- `Role/Permission system`: Authorization.
- `Verification system`: Identity/Business verification state.
- `Compliance workflow`: Compliance/holds.
- `ParcelEngine`: Authoritative parcel state/custody.
- `WorkflowEngine`: Orchestration.
- `AuditEngine`: Records actions.
- `NotificationEngine`: Security/compliance events.

### 9.11 Trust & Safety Engineering Constitution
- Identity must be attributable; sensitive actions authenticated; authorization server-side enforced.
- Verification must be authoritative.
- Prohibited goods policies must be authoritative; face verification must respect privacy/legal requirements.
- Personal data minimized, audit records protected, role changes controlled, suspensions auditable.
- No frontend-only security mechanism is authoritative.

### 9.12 Documentation Audit
- Chapters 1–9 have been completed.
- Contradictions, conflicts with codebase, and regulatory legal review requirements have been noted in the audit report.

---

## CHAPTER 10: PARCEL LIFECYCLE, CUSTODY, CHECK-IN, STORAGE, RELEASE, RETURNS & OPERATIONAL EXCEPTIONS

### 10.1 Parcel Lifecycle Principle
Every parcel must have an authoritative lifecycle. This lifecycle is controlled exclusively by the platform's authoritative Engines and `WorkflowEngine`. The frontend displays the current authoritative state and must not independently invent or overwrite parcel states.
A conceptual parcel lifecycle progresses through:
- `SHIPMENT_CREATED`
- `SHIPMENT_VERIFIED`
- `AWAITING_ORIGIN_HANDOVER`
- `RECEIVED_AT_ORIGIN_HUB`
- `IN_HUB_STORAGE`
- `AWAITING_LOGISTICS` OR `AWAITING_CUSTOMER_PICKUP`
- `IN_LOGISTICS`
- `ARRIVED_AT_DESTINATION_HUB`
- `READY_FOR_PICKUP`
- `CUSTOMER_VERIFICATION`
- `RELEASED`
- `COMPLETED`

Equivalent existing states in the codebase (e.g. `RECEIVED`, `COLLECTED`, `DELIVERED`, `SHIPPED`, `IN_HUB`) semantic-map directly to these conceptual lifecycle milestones to avoid unnecessary renaming of database properties.

### 10.2 Shipment Creation vs. Parcel Custody
Shipment creation and physical parcel custody are entirely separate business operations:
- **Shipment Creation**: Identifies the sender, responsible merchant, shipment contents, destination, selected fulfillment method, payment requirements, and shipment metadata. It does NOT imply physical possession of the items.
- **Parcel Custody**: Begins only when an authorized operational party (such as a Hub Operator) physically receives or accepts custody of the parcel. The system must never mark a parcel as physically received merely because a shipment record was created.

### 10.3 Logistics is Optional
Logistics is an optional fulfillment method. The platform never assumes that every shipment requires Logistics:
- A shipment may be configured for **Hub-to-Hub movement** via logistics, or for **Hub Pickup** by the customer.
- If **Logistics** is selected, a Logistics Job is created.
- If **Hub Pickup** is selected, no Logistics Job is created, no logistics fee is charged, no dispatch driver is assigned, and no logistics status is required for shipment progression. The absence of a Logistics Job is normal behavior when Hub Pickup is selected.

### 10.4 Fulfillment Method Selection
When an eligible Merchant creates a shipment, the platform allows the authorized sender to select the applicable fulfillment method (e.g., Customer Pickup at Hub, Logistics Delivery). The selected method is stored as authoritative shipment data. The platform must not silently switch fulfillment methods without authorization. Any changes to the fulfillment method after shipment creation must pass through an authorized workflow and must be fully audited.

### 10.5 Single Parcel Check-In
An authorized Hub Operator checks in individual parcels by:
1. Scanning the Parcel ID (QR or barcode).
2. Retrieving authoritative shipment information and validating that the parcel belongs to the expected shipment, checking its destination, and ensuring eligibility.
3. Inspecting physical condition, recording the condition (with optional photo evidence), and logging any exceptions.
4. Assigning an authorized storage location (shelf).
5. Logging a physical custody event and updating the authoritative parcel state.
Repeated scans of the same parcel must not generate duplicate custody records or double-count the item.

### 10.6 Bulk Parcel Check-In
Bulk Check-In is an operational capability for authorized Hub personnel, completely distinct from bulk shipment creation:
- The merchant submits the shipment batch, and the physical shipment arrives at the Hub.
- The operator initiates a **Bulk Intake Session** by scanning the Bulk Shipment ID or manifest.
- The operator scans individual parcels; each is validated independently by `WorkflowEngine` in real time.
- The UI maintains active progress (e.g. "15 / 20 Processed"). The session remains active even when individual parcels encounter exceptions.
- The Bulk Intake Session must be explicitly finalized by the operator to complete.

### 10.7 Bulk Check-In Validation
For every scanned parcel in a bulk session, the platform validates:
- The parcel exists and is associated with the expected shipment batch.
- The parcel is eligible for intake and is not already checked in or in an incompatible custody state.
- The destination and operator permissions are valid.
An individual parcel failure must never abort or corrupt the entire bulk intake session.

### 10.8 Duplicate Scan Handling
If a parcel is scanned multiple times during a bulk intake session, the system detects the duplicate, prevents duplicate custody or inventory records, and bypasses duplicate notifications. The UI displays the current authoritative state of the parcel (current hub, shelf, last scan timestamp, operator) and allows the session to proceed normally.

### 10.9 Parcel Condition Recording
At intake or custody transitions, Hub personnel record parcel condition under centrally controlled categories (e.g., Good Condition, Damaged, Wet, Broken Seal, Tampered, Packaging Damage). Condition records must not overwrite previous custody-condition records; each observation is stored as a new append-only entry linked to the parcel, custody event, operator, and timestamp.

### 10.10 Photo Evidence
Hub personnel can capture condition photographs using native device camera APIs or secure file uploads. Photo evidence is linked immutably to the correct parcel and custody event. Secure storage access controls prevent unauthorized access, and previous evidence versions are preserved in history if updated.

### 10.11 Complaint During Check-In
Hub Operators can log structured exception classifications during check-in (e.g., Damaged, Wet, Broken Seal, Wrong Label, Wrong Destination, Missing Items, Quantity Mismatch, Prohibited/Dangerous Goods). A complaint/exception record is generated containing the parcel, shipment, merchant, hub, operator, timestamp, classification, description, status, and photo evidence.

### 10.12 Damaged & Missing Parcels
- **Damaged Parcels**: Condition is recorded, evidence is saved, and the parcel is placed in an Exception state for review. The merchant/parties are notified. Damaged parcels are not automatically treated as lost; responsibility is determined objectively based on custody history and evidence.
- **Missing Parcels**: If an expected parcel is absent from a shipment batch, its missing status is recorded at the end of the check-in process. The expected vs. actual quantities are tracked, and the original custody history is preserved as immutable.

### 10.13 Rejected Parcels
A parcel may be rejected at intake for authorized reasons (invalid shipment, prohibited goods, extreme damage, wrong destination). Rejections must be initiated by authorized operators with recorded reasons and timestamps. Rejections do not silently disappear from shipments; they trigger Return to Sender or Compliance Hold workflows and notify relevant parties, without automatically creating a Logistics Job.

### 10.14 Bulk Intake Non-Blocking Principle
Bulk intake sessions must allow non-blocking processing. If a batch contains exceptions (duplicates, damage, rejection, or missing items), the operator can still finalize the session. The final summary maps all statuses (Accepted, Rejected, Damaged, Duplicate, Missing, Unprocessed) and prevents marking the entire batch as fully successful if unresolved parcels remain.

### 10.15 Shelf Assignment & Inventory Capacity
- **Shelf Assignment**: Post-intake, parcels are assigned to a storage location (Shelf, Rack, Bin, Fragile Zone, Valuable Area, Overflow Area) managed by `InventoryEngine`.
- **Inventory Capacity**: If primary storage locations are full, `InventoryEngine` identifies authorized overflow or temporary locations. The exact assigned location is recorded, ensuring the physical parcel remains discoverable.

### 10.16 Hub Storage & Parcel Timeline
- **Hub Storage**: Provides Hub personnel with filtered visibility into inventory under their physical custody (Awaiting Pickup, Ready, Long Stay, Exceptions, Holds, Awaiting Dispatch). Operators cannot see unrelated inventory of other Hubs.
- **Parcel Timeline**: Displays an append-only chronological history of actual authoritative events (created, accepted, stored, ready, verified, released). Frontend pages must never invent timeline milestones.

### 10.17 Customer Pickup & Release Security
- **Customer Pickup**: Customers receive milestone-specific notifications (arrived at destination Hub, ready for pickup, payment required) containing pickup hub details, amount due, and verification credentials (QR, OTP, or PIN).
- **Release Verification**: Hub operators must verify release credentials (QR, OTP, PIN, payment status, identity verification if required) through the authoritative release workflow. Unlimited OTP guessing is prevented, and release events are fully audited.
- **Release Completion**: Once released, parcel, custody, and inventory states are updated. Released parcels are removed from active pickup inventory to prevent duplicate release attempts.

### 10.18 Return Requests & Return Custody
- **Return Requests**: Customers can request returns where eligible. The return request records the parcel, reason, and status. It does not overwrite the original custody history.
- **Return Custody**: A returned parcel maintains a separate, traceable custody chain (Return Requested -> Return Approved -> Customer Handover -> Hub Received -> Merchant Received -> Return Completed). Returns are optional for Logistics.

### 10.19 Long-Stay Parcels & Compliance Holds
- **Long-Stay Parcels**: Parcels remaining in Hub custody beyond the expected pickup period trigger customer reminders, merchant notifications, and operational alerts. Disposal requires an authorized legal/operational workflow.
- **Compliance Holds**: Suspected stolen, prohibited, or fraudulent parcels are placed on an Investigation or Compliance Hold. The hold must be authorized, reason-coded, and restricted to compliance personnel, leaving the custody chain fully intact.

### 10.20 Offline Operations & Sync Recovery
- **Offline Check-In**: Locally queued actions remain pending and are not displayed as authoritative until synchronized with the server.
- **Offline Synchronization**: Synchronization must be idempotent, ordered, and retryable to prevent duplicate custody events or double-counting during network retries.
- **Network Recovery**: Loss of connectivity during operational events (check-in, release, shelf assignment) triggers safe failure states that preserve pending operations for retry and clearly mark synchronization status.

### 10.21 Role-Based Operational Permissions
- **CUSTOMER**: Can receive/track parcels, view timelines, use SafePay, open disputes/returns. Cannot create shipments, check in, assign shelves, or release parcels.
- **MERCHANT**: Can create shipments and bulk shipments. Cannot perform Hub custody operations.
- **HUB OWNER / STAFF**: Hub Owner manages Hub and creates shipments ONLY on behalf of verified Merchants. Staff perform check-in, shelf assignment, exception logging, and release verification. Staff cannot create shipments for ordinary Customers.
- **LOGISTICS / DRIVER**: Accept, move, and update assigned Logistics custody events. Cannot create shipments.

### 10.22 Operational Engine Responsibilities
- `WorkflowEngine`: Orchestrates lifecycles and bulk sessions.
- `ParcelEngine`: Controls authoritative state and physical custody.
- `InventoryEngine`: Manages shelf assignments, storage capacity, and overflow.
- `StorageEngine`: Securely stores condition photographs and evidence.
- `NotificationEngine`: Orchestrates role-aware milestone notifications.
- `AuditEngine`: Records append-only operational actions.
- No frontend page can independently manipulate or determine parcel states.

### 10.23 Operational Engineering Constitution
- Shipment creation is strictly separated from physical parcel custody.
- Customers, Logistics, and Dispatch Riders cannot create shipments.
- Hub Owners/Staff create shipments ONLY on behalf of verified Merchants, never for Customers.
- Logistics is optional. Logistics Jobs are created ONLY if Logistics is selected; otherwise, no logistics fees are charged.
- Duplicate scans do not create duplicate custody events.
- Bulk intake is non-blocking; exceptions do not abort sessions.
- Released parcels are immediately removed from active pickup inventory.
- Historical custody events are immutable and append-only.

---

## CHAPTER 10 COMPLETION AUDIT & REPORT

### 1. Chapters Completed
Chapters 1 through 10 have been fully completed and documented in this specification.

### 2. Verification of Authoritative Business Rules
- **Logistics is Optional**: Creating a shipment does NOT automatically create a Logistics Job. Logistics is strictly optional and triggered only upon explicit merchant confirmation and selection.
- **Hub Shipment Creation**: Hub Owners may create shipments ONLY on behalf of verified Merchants. Creating shipments for ordinary Customers is strictly forbidden.
- **Customer Role Boundaries**: Customers cannot create shipments under any circumstances unless they explicitly activate the Merchant role and complete the required identity/business verification.

### 3. Discovered Codebase Mapping & Conflicts
- **State Property Synonyms**: The codebase represents parcel statuses using synonyms such as `RECEIVED` (for origin check-in), `SHIPPED` (for logistics in transit), `IN_HUB` (for arrived/stored at destination hub), and `COLLECTED`/`DELIVERED` (for released/completed). These map perfectly to the conceptual states:
    - `RECEIVED` -> `ACCEPTED_AT_ORIGIN_HUB`
    - `IN_HUB` -> `IN_HUB_STORAGE` / `READY_FOR_PICKUP`
    - `SHIPPED` -> `IN_LOGISTICS`
    - `COLLECTED` / `DELIVERED` -> `RELEASED` / `COMPLETED`
- **Optional Logistics Implementation**: Some current frontend forms or validation states in `CreateShipmentPage.tsx` or `ParcelEngine.ts` might implicitly expect logistics information as mandatory (such as requiring vehicle or driver parameters). These must be updated in future code changes to be entirely optional when `Hub Pickup` is selected.
- **Dispute & Return Operations**: The codebase contains `DisputeEngine.ts` and corresponding repositories (`DisputeRepository.ts`, `ReturnRepository.ts`), but these actions do not directly modify wallet balances or transaction states outside of the `PaymentEngine` and `PaymentProtectionEngine`, which perfectly matches the specifications in Chapter 8.

### 4. Documentation-Only Confirmation
WeSabiHub application code, database configurations, React components, and Cloud storage settings remain unmodified. This is a documentation-only audit task. All specifications and operational principles have been written to the canonical Operations Specification document.
