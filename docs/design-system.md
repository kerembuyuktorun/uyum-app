# Uyum Design System & Interface Language

**Step 2 · Design System and Interface Language**  
**Status:** Foundation for UI implementation  
**Companion:** [`/design-system/`](../design-system/) living styleguide

---

## 1. Design intent

Uyum’s interface is **trustworthy and efficient**, not decorative. It should feel like a finance console for jewelry operations: calm navy structure, restrained gold accents for brand and primary actions, charcoal text, and light gray surfaces for hierarchy.

| Principle | Application |
|---|---|
| Trust | Clear statuses, readable type, stable navy chrome |
| Efficiency | Dense-but-legible tables, obvious primary actions, minimal chrome |
| Restraint | Gold as accent only — never large fills or ornament |
| Clarity | Verb-led buttons (`Save`, `Issue Invoice`), one job per panel |

---

## 2. Color palette

### Core tokens

| Token | Hex | Role |
|---|---|---|
| `--navy-950` | `#0A1628` | Sidebar, top bar, high-contrast chrome |
| `--navy-900` | `#12233D` | Primary brand surface |
| `--navy-800` | `#1A3358` | Hover / elevated navy |
| `--navy-100` | `#E8EEF6` | Soft navy tint (selected rows, info wells) |
| `--gold-600` | `#A8843A` | Primary action, brand mark accent |
| `--gold-500` | `#C49A45` | Interactive gold hover |
| `--gold-100` | `#F7F0DE` | Gold tint backgrounds (badges, highlights) |
| `--charcoal-900` | `#1C2128` | Primary text |
| `--charcoal-700` | `#3D4654` | Secondary text |
| `--charcoal-500` | `#6B7380` | Tertiary / meta |
| `--gray-50` | `#F5F6F8` | App canvas |
| `--gray-100` | `#EBEDF0` | Panels, zebra, input fill |
| `--gray-200` | `#D7DBE2` | Borders, dividers |
| `--gray-300` | `#B8BEC8` | Strong borders, disabled |

### Semantic status

| Token | Hex | Use |
|---|---|---|
| `--success-700` | `#1F6B45` | Cleared, paid, accepted |
| `--success-100` | `#E5F4EC` | Success badge / alert well |
| `--warning-700` | `#8A5A12` | Pending review, queued |
| `--warning-100` | `#F8EFDC` | Warning well |
| `--danger-700` | `#9B2C2C` | Rejected, blocked, failed |
| `--danger-100` | `#F8E8E8` | Danger well |
| `--info-700` | `#1A4A7A` | Informational / in progress |
| `--info-100` | `#E7F0F8` | Info well |

### Usage rules

1. **Navy** owns structure (shell, headers, key navigation).
2. **Gold** marks primary CTAs and the brand wordmark accent — never page backgrounds.
3. **Charcoal** is body text; never pure black.
4. **Light gray** separates canvas from panels; borders stay `--gray-200`.
5. Status color is always paired with a label — color alone is not enough.
6. Avoid gradients on controls. Soft page atmosphere may use a single navy→gray wash in the shell only.

---

## 3. Typography

### Families

| Role | Family | Source |
|---|---|---|
| Brand / display | **Source Serif 4** | Wordmark, report titles, empty-state headlines |
| UI / body | **IBM Plex Sans** | Navigation, forms, tables, buttons, body |

Avoid Inter, Roboto, Arial, and generic system stacks for brand-facing surfaces.

### Scale

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `--text-display` | 32px / 40px | Serif 600 | Rare page heroes (reports landing) |
| `--text-h1` | 24px / 32px | Sans 600 | Page titles |
| `--text-h2` | 18px / 26px | Sans 600 | Section / panel titles |
| `--text-h3` | 15px / 22px | Sans 600 | Card / subsection titles |
| `--text-body` | 14px / 22px | Sans 400 | Default body |
| `--text-body-strong` | 14px / 22px | Sans 550–600 | Table emphasis, labels |
| `--text-small` | 12px / 18px | Sans 400–500 | Meta, captions, badges |
| `--text-mono` | 13px / 20px | IBM Plex Mono | Invoice IDs, amounts, refs |

### Type rules

- Page titles use IBM Plex Sans; Source Serif 4 is reserved for brand and formal report covers.
- Tabular numbers (`font-variant-numeric: tabular-nums`) for money, weights, and IDs.
- Sentence case for UI labels; never ALL CAPS except short status codes if required by domain.
- Max content measure for prose: ~68ch.

---

## 4. Layout system

### Spacing scale (4px base)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

### App shell

```
┌──────────┬────────────────────────────────────────┐
│          │  Top bar (page title + primary action) │
│ Sidebar  ├────────────────────────────────────────┤
│  240px   │                                        │
│  navy    │           Content canvas               │
│          │           (max 1280px content)         │
│          │                                        │
└──────────┴────────────────────────────────────────┘
```

- **Sidebar:** 240px desktop; collapses to icon rail (64px) or drawer on tablet/mobile.
- **Content padding:** 24px desktop, 16px tablet/mobile.
- **Panel gap:** 16–24px.
- **Grid:** 12-column for dashboard; forms use single column (max 560px) or two-column on wide screens for paired fields.

### Elevation & surfaces

| Level | Treatment |
|---|---|
| Canvas | `--gray-50` |
| Panel | `#FFFFFF` + 1px `--gray-200` border |
| Overlay | White panel + single soft shadow `0 8px 24px rgba(10,22,40,0.12)` |
| No cards-for-decoration | Panels exist to group interactive or tabular work |

Border radius: **6px** controls, **8px** panels/modals. No pill shapes.

---

## 5. Responsive behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| Desktop | ≥1120px | Full sidebar + multi-column dashboards/tables |
| Tablet | 768–1119px | Collapsible sidebar; tables keep horizontal scroll; forms single column |
| Mobile | <768px | Drawer nav; stacked panels; sticky primary action; modals full-screen sheet |

### Responsive rules

1. **Checkout / tablet first for sales flows** — primary actions ≥44px touch targets.
2. Tables: freeze first column (customer/name) when horizontal scroll is needed.
3. Confirmation modals become bottom sheets below 640px.
4. Dashboard widgets stack to one column under 768px.
5. Document archive switches from grid to list under 768px.

---

## 6. Component rules

### Buttons

| Variant | Style | When |
|---|---|---|
| **Primary** | Gold fill, charcoal text | One primary action per view |
| **Secondary** | White + navy border | Alternate actions |
| **Ghost** | Text only, navy | Tertiary / inline |
| **Danger** | Danger fill or outline | Destructive confirm |

**Required action labels (verb + object):**

- Save  
- Confirm  
- Issue Invoice  
- Download Document  
- Generate Report  

Also allowed when needed: `Cancel`, `Retry Submission`, `Clear Case`, `Record Payment`, `Upload Document`.

Rules:

- Never generic labels (`OK`, `Submit`, `Click here`).
- Primary button right-aligned in toolbars; in modals: Cancel left / Confirm right (LTR).
- Disabled = 40% opacity, `not-allowed` cursor.

### Forms

- Label above field; helper text below; error replaces helper in danger color.
- Input height 40px; textarea min 96px.
- Required marker: text `(required)` or subtle asterisk — not color alone.
- Group related fields in a panel with one H2.

### Tables

- Header row: `--gray-100`, small caps avoided; 12–13px medium weight.
- Row height ~48px; hover `--navy-100` at 40% opacity.
- Right-align numeric columns.
- Row actions as ghost buttons or overflow menu — not icon-only without labels on touch.

### Transaction cards

Compact payment/invoice summary used in customer timelines and queues:

- Title (type + amount), status badge, meta line (date · method · ref), optional CTA.
- Border panel, no heavy shadow.
- Amount in mono + tabular nums.

### Alerts

Inline wells: icon + title + message + optional action. Variants: info, success, warning, danger. Never toast-only for compliance-critical errors — persist in context.

### Confirmation modals

- Title states the consequence (`Issue invoice for Ayşe Yılmaz?`).
- Body: 1–2 sentences of impact.
- Actions: `Cancel` + decisive verb (`Confirm`, `Issue Invoice`).
- Danger actions use danger button styling.

### Status badges

Pill-avoidant: **4px radius**, small text, tinted background + strong text.

| Status examples | Tone |
|---|---|
| Cleared, Paid, Accepted, Archived | Success |
| In review, Queued, Pending | Warning |
| Rejected, Blocked, Failed, Overdue | Danger |
| Draft, In progress | Info / neutral |

### Document archive views

- **List mode (default for ops):** name, type, linked entity, date, actions (`Download Document`).
- **Grid mode (optional):** file-type tile + name + date.
- Filters: type, customer, date range — one filter bar, not chips clusters.
- Empty state: short serif or sans headline + one CTA (`Upload Document`).

### Dashboard panels

- Title + optional “attention” count.
- One metric or one short list per panel — no stat-strip clutter.
- Link to full queue: text link, not nested cards.

---

## 7. Core UI component inventory

| Component | File / class prefix | Purpose |
|---|---|---|
| App shell | `.app-shell` | Sidebar + top bar + canvas |
| Button | `.btn` | Primary / secondary / ghost / danger |
| Form field | `.field` | Label, input, select, textarea, error |
| Data table | `.table` | Sortable ops tables |
| Transaction card | `.txn-card` | Payment / invoice summary |
| Alert | `.alert` | Contextual feedback |
| Modal | `.modal` | Confirmations |
| Badge | `.badge` | Status |
| Archive list/grid | `.archive-*` | Document browser |
| Page header | `.page-header` | Title + actions |
| Empty state | `.empty-state` | Zero-data guidance |

Living reference: open [`design-system/index.html`](../design-system/index.html) in a browser.

---

## 8. Motion (restrained)

Ship only purposeful motion:

1. **Sidebar collapse** — 160ms ease width transition.  
2. **Modal enter** — 120ms fade + 6px rise.  
3. **Row/status update** — 150ms background tint when status changes.

No parallax, no glow pulses, no decorative loops.

---

## 9. Accessibility baseline

- Contrast: body text ≥ 4.5:1 on canvas/panels; gold primary button uses charcoal text (not white) for contrast.
- Focus rings: 2px `--navy-800` outline, 2px offset.
- All status badges include text.
- Modals trap focus; `Esc` closes.

---

## 10. Do / Don’t

| Do | Don’t |
|---|---|
| One gold primary CTA per screen | Gold gradients or gold page backgrounds |
| Verb-led button labels | `OK` / `Submit` / icon-only primary actions |
| Panels with borders for work grouping | Decorative card grids in dashboards |
| Tabular nums for money | Mixed alignment on amount columns |
| Persist compliance errors inline | Rely only on transient toasts |
