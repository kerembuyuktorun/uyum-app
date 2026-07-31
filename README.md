# Uyum

**Compliance that keeps pace with the counter.**

Uyum is a web-based SaaS platform for jewelers that combines AML/KYC compliance, customer onboarding, payment tracking, e-Invoice / e-Archive workflows, document archiving, and audit-ready reporting.

## App screens

| Screen | Path |
|---|---|
| Dashboard (post-login) | [`app/index.html`](app/index.html) |
| **KYC onboarding** | [`app/kyc.html`](app/kyc.html) |
| Customer profile | [`app/customer.html`](app/customer.html) |

### Preview

```bash
python3 -m http.server 4173 --directory .
# Dashboard: http://localhost:4173/app/
# KYC flow:  http://localhost:4173/app/kyc.html
```

### KYC flow (Step 4)

Multi-step ~1 minute counter form:

1. Identity (+ mock OCR)  
2. Contact & address  
3. Occupation & purpose  
4. Privacy notice, explicit consent, retention permission, declaration  
5. Final confirmation → generated customer profile  

### Privacy & security (Step 5)

- Consent permission records with timestamp, user, IP/device, form version  
- Role-based PII masking (employee masked, unauthorized hidden)  
- Audit log on the customer profile screen  

Docs: [`docs/privacy-security.md`](docs/privacy-security.md) · [`docs/kyc-flow.md`](docs/kyc-flow.md) · [`docs/dashboard.md`](docs/dashboard.md) · [`docs/design-system.md`](docs/design-system.md)

## Design system

Living styleguide: [`design-system/index.html`](design-system/index.html)
