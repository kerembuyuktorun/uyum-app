# Uyum KYC Onboarding Flow

**Step 4 · Customer Onboarding and AML/KYC Form Flow**  
**Screens:** [`app/kyc.html`](../app/kyc.html) → [`app/customer.html`](../app/customer.html)

---

## Goal

A counter-ready AML/KYC form that can be completed in about one minute when a customer arrives.

## Steps

1. **Identity** — national ID, full name, birth date + mock OCR scan  
2. **Contact & address** — phone, email, address  
3. **Occupation & purpose** — occupation, transaction purpose  
4. **Consents** — privacy notice, explicit consent, data retention permission, customer declaration  
5. **Confirm** — review all fields, then generate profile (+ permission records)  

See also [`privacy-security.md`](privacy-security.md) for masking and audit fields.

## Validation & status

- Required-field validation on Continue / Confirm
- Inline errors for invalid formats (11-digit national ID, email, phone, etc.)
- **Missing field alerts** list incomplete items before advancing
- **Green confirmation indicators** on completed valid fields and finished stepper steps
- Side checklist shows Complete / Missing for every field

## Mock OCR

`Scan ID (Mock OCR)` prefills:

- National ID: `12345678901`
- Full name: `Ayşe Yılmaz`
- Birth date: `1990-04-12`

## Generated profile

On **Confirm**, the app writes the customer to `sessionStorage` and opens the profile screen with:

- Generated customer ID  
- KYC status: Cleared  
- Risk level: Standard  
- Full captured details  

## Preview

```bash
python3 -m http.server 4173 --directory .
# open http://localhost:4173/app/kyc.html
```
