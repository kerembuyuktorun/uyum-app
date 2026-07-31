# Uyum

**Compliance that keeps pace with the counter.**

Uyum is a web-based SaaS platform for jewelers that combines AML/KYC compliance, customer onboarding, payment tracking, e-Invoice / e-Archive workflows, document archiving, and audit-ready reporting.

## App

| Screen | Path |
|---|---|
| **Dashboard (post-login)** | [`app/index.html`](app/index.html) |
| Dashboard notes | [`docs/dashboard.md`](docs/dashboard.md) |

### Preview

```bash
python3 -m http.server 4173 --directory .
# Dashboard: http://localhost:4173/app/
# Design system: http://localhost:4173/design-system/
```

### Dashboard includes

- Live gold/currency **price placeholder**
- Status cards: daily transactions, missing AML/KYC, payments waiting for invoice, audit-ready files
- Quick actions: **New Customer**, **Start KYC Form**, **Add Payment**, **Issue Invoice**, **Search Archive**
- Recent customers table + attention queue (sample data)

## Design system

| Artifact | Path |
|---|---|
| Spec | [`docs/design-system.md`](docs/design-system.md) |
| Living styleguide | [`design-system/index.html`](design-system/index.html) |

### Visual direction

- **Palette:** navy structure, gold primary actions, charcoal text, light gray surfaces
- **Type:** Source Serif 4 (brand) + IBM Plex Sans (UI) + IBM Plex Mono (IDs/amounts)
- **Tone:** trustworthy and efficient — not decorative
