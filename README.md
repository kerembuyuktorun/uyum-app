# Uyum

**Compliance that keeps pace with the counter.**

Uyum is a web-based SaaS platform for jewelers that combines AML/KYC compliance, customer onboarding, payment tracking, e-Invoice / e-Archive workflows, document archiving, and audit-ready reporting.

## App screens

| Screen | Path |
|---|---|
| Dashboard | [`app/index.html`](app/index.html) |
| KYC onboarding | [`app/kyc.html`](app/kyc.html) |
| Customer profile | [`app/customer.html`](app/customer.html) |
| Payments | [`app/payments.html`](app/payments.html) |
| Record payment | [`app/payment-new.html`](app/payment-new.html) |
| **Invoices** | [`app/invoices.html`](app/invoices.html) |
| **Create e-document** | [`app/invoice-new.html`](app/invoice-new.html) |

### Preview

```bash
python3 -m http.server 4173 --directory .
# Invoices: http://localhost:4173/app/invoices.html
# Create:   http://localhost:4173/app/invoice-new.html
```

### e-Invoice / e-Archive (Step 7)

- Create from customer + payment + line items
- Statuses: Draft · Sending · Successful · Failed · Cancelled
- Failed → clear correction suggestions
- Mock adapter: `EDocumentAdapter` → `MockEDocumentService`
- PDF preview pane on create + list screens

Docs: [`docs/invoices.md`](docs/invoices.md) · [`docs/payments.md`](docs/payments.md) · [`docs/privacy-security.md`](docs/privacy-security.md)
