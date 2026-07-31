# Uyum Privacy Consent & Security Layer

**Step 5 · Privacy Consent and Security Layer**  
**Module:** [`app/js/security.js`](../app/js/security.js)  
**Model:** [`app/data/consent-model.json`](../app/data/consent-model.json)

---

## Consent sections

| Section | Field | Stored consent type |
|---|---|---|
| Privacy notice | Display + acknowledge | `privacy_notice_ack` |
| Explicit consent | Checkbox | `explicit_consent` |
| Data retention permission | Checkbox | `data_retention` |
| Customer declaration | Checkbox | `customer_declaration` |

All four are required in the KYC Consents step (`app/kyc.html`).

## Permission record model

Every accepted consent writes a record with:

- `timestamp` (ISO-8601)
- `user` `{ id, name, role }`
- `ipAddress` (session demo IP)
- `device` `{ userAgent, platform, language, screen }`
- `formVersion` (`kyc-consent-v1.1`)
- `customerId`, `consentType`, `accepted`, `storeId`

## Audit log fields

`id`, `event`, `timestamp`, `actorUserId`, `actorName`, `actorRole`, `customerId`, `consentType`, `ipAddress`, `deviceSummary`, `formVersion`, `detail`

Events include `consent.accepted`, `customer.profile_created`, `session.role_switched`.

## Masking & roles

| Role | PII access | Behavior |
|---|---|---|
| Owner / Accountant | Full | National ID, phone, email, address visible |
| Employee (default) | Masked | Partial mask (e.g. `*******8901`, `•••@domain`) |
| Unauthorized | Hidden | Full identity/contact redacted; consent audit hidden |

Masking helpers: `maskNationalId`, `maskPhone`, `maskEmail`, `maskAddress`.

## Security behavior

1. Consents captured during KYC Confirm → permission records + audit entries  
2. Customer profile applies `redactProfileForViewer()` based on active role  
3. Profile page **View as** control demos role switching  
4. Unauthorized viewers cannot see full identity numbers, contact details, or consent audit panels  

## Preview

```bash
python3 -m http.server 4173 --directory .
# Complete KYC, then open http://localhost:4173/app/customer.html
# Switch role to Unauthorized to verify redaction
```
