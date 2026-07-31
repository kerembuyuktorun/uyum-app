# Uyum — Product Vision & Scope

**Step 1 · Product Vision and Scope**  
**Status:** Approved for design & build  
**Audience:** Product, design, engineering

---

## 1. App name

**Uyum**

Named for the Turkish word for *compliance* / *harmony* — signaling trust, regulatory readiness, and operational order for jewelry businesses.

**Tagline:** Compliance that keeps pace with the counter.

---

## 2. Short product description

Uyum is a web-based SaaS platform for jewelers that unifies AML/KYC compliance, customer onboarding, payment tracking, e-Invoice / e-Archive workflows, document archiving, and audit-ready reporting in one operations console.

Built for store owners, floor staff, accountants, and audit prep — usable on desktop, tablet, and checkout screens. Fast, clean, and trustworthy; designed for the moment of sale, not after-the-fact paperwork.

---

## 3. Target users

| Persona | Role | Primary jobs in Uyum |
|---|---|---|
| **Store owner** | Business decision-maker | Oversight of compliance health, staff access, payment & invoice status, audit readiness |
| **Store employee** | Sales / checkout | Onboard customers, complete KYC forms, record payments, trigger e-Invoice / e-Archive at sale |
| **Accountant** | Finance & tax ops | Reconcile payments, manage e-Invoice/e-Archive queues, export reports, archive evidence |
| **Audit preparer** | Internal or external audit support | Pull audit packs, trace customer → payment → invoice → document chains |

**Secondary:** Multi-store operators and compliance consultants who need read/report access across locations.

---

## 4. Core modules

### 4.1 Dashboard (Operations Home)
At-a-glance compliance status, open KYC cases, pending invoices, payment exceptions, and audit readiness signals. One screen for “what needs attention now.”

### 4.2 Customers & Onboarding
Customer records with guided onboarding forms. Capture identity, contact, risk indicators, and store association. Supports walk-in and returning customers.

### 4.3 AML / KYC Compliance
Risk scoring, identity verification checklist, threshold-triggered enhanced due diligence, case notes, and status lifecycle (Draft → In review → Cleared / Escalated / Blocked). Designed for MASAK-oriented jewelry AML workflows.

### 4.4 Payments
Record and track payments tied to customers and sales: method, amount, currency/precious-metal context where relevant, status, and reconciliation flags. Surface incomplete or mismatched payments.

### 4.5 e-Invoice / e-Archive
Create, submit, and track electronic invoices and archive documents. Status pipeline (Draft → Queued → Sent → Accepted / Rejected / Archived) with retry and error visibility for store and accountant roles.

### 4.6 Document Archive
Central vault for KYC IDs, forms, invoices, payment proofs, and supporting files. Linked to customers, cases, payments, and invoices. Retention-aware and search/filterable.

### 4.7 Audit & Reporting
Audit-ready packs and operational reports: compliance case summaries, payment ledgers, invoice status, document completeness. Exportable evidence trails for inspectors and accountants.

### 4.8 Settings & Access
Organization profile, store locations, role-based access (Owner, Employee, Accountant, Auditor), notification preferences, and integration credentials for e-Invoice providers.

---

## 5. Information architecture

```
Uyum
├── Auth
│   ├── Sign in
│   ├── Invite accept
│   └── Password reset
│
├── App shell (authenticated)
│   ├── Dashboard                         / 
│   ├── Customers                         /customers
│   │   ├── Customer list
│   │   ├── Customer detail               /customers/:id
│   │   │   ├── Profile & risk
│   │   │   ├── KYC cases
│   │   │   ├── Payments
│   │   │   ├── Invoices
│   │   │   └── Documents
│   │   └── New onboarding                /customers/new
│   │
│   ├── Compliance                        /compliance
│   │   ├── Case queue
│   │   └── Case detail                   /compliance/:caseId
│   │
│   ├── Payments                          /payments
│   │   ├── Payment list / filters
│   │   └── Payment detail                /payments/:id
│   │
│   ├── Invoicing                         /invoices
│   │   ├── e-Invoice / e-Archive list
│   │   ├── Invoice detail                /invoices/:id
│   │   └── Create invoice                /invoices/new
│   │
│   ├── Documents                         /documents
│   │   ├── Archive browser
│   │   └── Document detail               /documents/:id
│   │
│   ├── Reports                           /reports
│   │   ├── Compliance report
│   │   ├── Payments report
│   │   ├── Invoice status report
│   │   └── Audit pack builder
│   │
│   └── Settings                          /settings
│       ├── Organization & stores
│       ├── Users & roles
│       ├── Integrations (e-Invoice)
│       └── Preferences
│
└── Shared patterns
    ├── Global search (customers, invoices, cases)
    ├── Notifications / attention queue
    └── Role-gated navigation
```

### Navigation principles
- **Operations-first:** Dashboard and Customers are the primary entry points for floor staff.
- **Entity-centric:** Customer is the hub; KYC, payments, invoices, and documents hang off the customer.
- **Queue-centric for specialists:** Compliance, Invoicing, and Reports expose work queues for accountants and owners.
- **Tablet-ready:** Primary actions are large, single-purpose, and reachable within two taps from the shell.

---

## 6. Initial user flow

### Primary happy path: Sale with compliance + e-Invoice

```
1. Employee signs in on tablet / checkout screen
2. Dashboard → “New customer” (or search returning customer)
3. Complete onboarding form (identity, contact, purchase context)
4. System runs AML/KYC checks
   ├─ Cleared → continue
   └─ Escalated / threshold → open compliance case → owner/accountant review
5. Record payment (method, amount, reference)
6. Create e-Invoice or e-Archive document from sale
7. Submit to e-Invoice / e-Archive pipeline; track status
8. Auto-attach supporting docs (ID scan, payment proof, invoice PDF) to Document Archive
9. Customer record shows complete chain: KYC → Payment → Invoice → Documents
10. Accountant later reconciles payments & invoice statuses from Payments / Invoicing
11. Owner or auditor exports Audit Pack from Reports when needed
```

### Supporting flows

| Flow | Actor | Outcome |
|---|---|---|
| Returning customer sale | Employee | Search → confirm KYC still valid → payment → invoice |
| Compliance escalation | Owner / Accountant | Case queue → review evidence → Clear / Block |
| Invoice rejection retry | Accountant | Invoicing queue → fix data → resubmit |
| Month-end audit prep | Accountant / Auditor | Reports → Audit pack → export ZIP / PDF |
| Staff onboarding | Owner | Settings → invite user → assign role |

### Success criteria for v1 flow
- A cleared walk-in sale (onboard → KYC → pay → e-Invoice → archive) can be completed without leaving the customer context.
- Every financial and compliance artifact is linked and exportable for audit.

---

## 7. Product principles

1. **Trustworthy** — Clear status language, immutable audit trails, no ambiguous compliance states.
2. **Fast** — Checkout-speed onboarding; minimal fields until risk requires more.
3. **Clean** — One job per screen; queues over dashboards-of-widgets.
4. **Operations-focused** — Built for the counter and the back office, not marketing chrome.
5. **Audit-ready by default** — Evidence is captured as work happens, not reconstructed later.

---

## 8. Out of scope (v1)

- Full ERP / inventory / workshop manufacturing
- Consumer-facing storefront or e-commerce
- Automated government portal filing beyond e-Invoice / e-Archive provider integrations
- Multi-country regulatory packs beyond the primary jewelry AML + e-Invoice market focus

---

## 9. Summary

| Item | Decision |
|---|---|
| **Name** | Uyum |
| **Description** | Jeweler SaaS for AML/KYC, onboarding, payments, e-Invoice/e-Archive, archive, and audit reporting |
| **Users** | Store owners, employees, accountants, audit preparers |
| **Modules** | Dashboard, Customers, Compliance, Payments, Invoicing, Documents, Reports, Settings |
| **IA hub** | Customer record + specialist queues |
| **Initial flow** | Onboard → KYC → Pay → e-Invoice/e-Archive → Archive → Audit pack |
