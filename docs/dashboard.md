# Uyum Dashboard — Daily Operations

**Step 3 · Dashboard and Daily Operations**  
**Screen:** [`app/index.html`](../app/index.html)  
**Sample data:** [`app/data/dashboard.json`](../app/data/dashboard.json)

---

## Purpose

Post-login home for jewelry store employees. Surfaces what needs attention at the counter today and provides one-tap quick actions for common workflows.

## Sections

| Section | Content |
|---|---|
| Market prices | Placeholder board for live gold / currency quotes (XAU, USD, EUR) |
| Status summary | Daily transactions · Missing AML/KYC · Payments waiting for invoice · Audit-ready files |
| Quick actions | New Customer · Start KYC Form · Add Payment · Issue Invoice · Search Archive |
| Recent customers | Latest counter activity with KYC + invoice status |
| Needs attention | Queue of escalations and exceptions |

## Quick actions

Buttons confirm intent with a toast and set a hash route for later screen wiring:

- `#action-new-customer`
- `#action-start-kyc`
- `#action-add-payment`
- `#action-issue-invoice`
- `#action-search-archive`

## Preview

```bash
python3 -m http.server 4173 --directory .
# open http://localhost:4173/app/
```
