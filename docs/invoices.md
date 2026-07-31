# Uyum e-Invoice / e-Archive Module

**Step 7 · e-Invoice and e-Archive Module**  
**Screens:** [`app/invoices.html`](../app/invoices.html) · [`app/invoice-new.html`](../app/invoice-new.html)

---

## Features

- Create e-Invoice or e-Archive from **customer details**, **payment information**, and **sale line items**
- Invoice list with filters and status chips
- Statuses: **Draft**, **Sending**, **Successful**, **Failed**, **Cancelled**
- Failed submissions show **field-level correction suggestions**
- In-browser **PDF preview** area (mock document HTML)
- Integration via adapter + mock service (no live tax/integrator APIs)

## Architecture

```
UI (invoice-new / invoices)
  → UyumInvoices (invoice-service.js)
    → EDocumentAdapter (mock-edocument.js)
      → MockEDocumentService.send() / cancel()
```

## Status flow

```
Draft → Sending → Successful
                ↘ Failed → (correct) → Draft → Sending → …
Draft / Failed / Successful → Cancelled
```

On **Successful**, linked payment transaction is marked `invoiced`.

## Failure demo triggers

- Tax/national ID ending in `000`
- Notes containing `FORCE-FAIL`
- Missing address, email, line items, or payment/total mismatch

## Preview

```bash
python3 -m http.server 4173 --directory .
# List:   http://localhost:4173/app/invoices.html
# Create: http://localhost:4173/app/invoice-new.html
```
