# Uyum Payment Management

**Step 6 · Payment Management**  
**Screens:** [`app/payments.html`](../app/payments.html) · [`app/payment-new.html`](../app/payment-new.html)

---

## Features

- Payment methods: **POS**, **bank transfer**, **cash**, **split**
- Each payment links: customer, transaction, amount, date, method, description, document
- On **payment received** → linked transaction status becomes **Invoice Pending**
- Mock connectors only (no real bank/POS APIs)

## Status logic

| Payment status | Meaning |
|---|---|
| processing | Connector call in flight |
| received | Connector(s) succeeded |
| failed | Connector declined / error |

| Transaction status | Meaning |
|---|---|
| open | Awaiting payment |
| invoice_pending | Payment received — ready to invoice |
| invoiced | Invoice issued (future step) |

## Mock integration structure

```
app/js/mock-connectors.js
  MockPosConnector.charge()
  MockBankConnector.confirmTransfer()
  MockCashConnector.record()
  processMethod(method, payload)

app/js/payment-service.js
  receivePayment(input) → validates, calls connectors, links txn, sets Invoice Pending
```

## Payment record fields

`id`, `customerId`, `customerName`, `transactionId`, `amount`, `currency`, `date`, `method`, `splits[]`, `description`, `document{name,type,source}`, `status`, `connectorResults[]`

## Preview

```bash
python3 -m http.server 4173 --directory .
# List:  http://localhost:4173/app/payments.html
# Entry: http://localhost:4173/app/payment-new.html
```
