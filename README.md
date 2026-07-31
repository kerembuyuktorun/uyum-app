# Uyum

**Compliance that keeps pace with the counter.**

Uyum is a web-based SaaS platform for jewelers that combines AML/KYC compliance, customer onboarding, payment tracking, e-Invoice / e-Archive workflows, document archiving, and audit-ready reporting.

## App screens

| Screen | Path |
|---|---|
| Dashboard | [`app/index.html`](app/index.html) |
| KYC onboarding | [`app/kyc.html`](app/kyc.html) |
| Customer profile | [`app/customer.html`](app/customer.html) |
| **Payments list** | [`app/payments.html`](app/payments.html) |
| **Record payment** | [`app/payment-new.html`](app/payment-new.html) |

### Preview

```bash
python3 -m http.server 4173 --directory .
# Payments: http://localhost:4173/app/payments.html
# Entry:    http://localhost:4173/app/payment-new.html
```

### Payment management (Step 6)

- Methods: POS, bank transfer, cash, split
- Linked fields: customer, transaction, amount, date, method, description, document
- Received payment → transaction status **Invoice Pending**
- Mock connectors in `app/js/mock-connectors.js`

Docs: [`docs/payments.md`](docs/payments.md) · [`docs/privacy-security.md`](docs/privacy-security.md) · [`docs/kyc-flow.md`](docs/kyc-flow.md)

## Design system

Living styleguide: [`design-system/index.html`](design-system/index.html)
