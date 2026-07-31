# Uyum

**Compliance that keeps pace with the counter.**

Uyum is a web-based SaaS platform for jewelers that combines AML/KYC compliance, customer onboarding, payment tracking, e-Invoice / e-Archive workflows, document archiving, and audit-ready reporting.

## Design system

Step 2 interface language lives in:

| Artifact | Path |
|---|---|
| Spec | [`docs/design-system.md`](docs/design-system.md) |
| Living styleguide | [`design-system/index.html`](design-system/index.html) |
| Tokens | [`design-system/tokens.css`](design-system/tokens.css) |
| Components | [`design-system/components.css`](design-system/components.css) |
| Layout | [`design-system/layout.css`](design-system/layout.css) |

### Preview locally

```bash
python3 -m http.server 4173 --directory design-system
# open http://localhost:4173
```

### Visual direction

- **Palette:** navy structure, gold primary actions, charcoal text, light gray surfaces
- **Type:** Source Serif 4 (brand) + IBM Plex Sans (UI) + IBM Plex Mono (IDs/amounts)
- **Tone:** trustworthy and efficient — not decorative
- **Actions:** verb-led labels (`Save`, `Confirm`, `Issue Invoice`, `Download Document`, `Generate Report`)
