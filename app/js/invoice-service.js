/**
 * e-Invoice / e-Archive domain service — create, list, status, PDF preview model.
 */
(function (global) {
  const KEY = "uyum.invoices";

  const STATUSES = {
    Draft: { id: "Draft", label: "Draft", tone: "neutral" },
    Sending: { id: "Sending", label: "Sending", tone: "info" },
    Successful: { id: "Successful", label: "Successful", tone: "success" },
    Failed: { id: "Failed", label: "Failed", tone: "danger" },
    Cancelled: { id: "Cancelled", label: "Cancelled", tone: "warning" },
  };

  function uid(prefix) {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}`;
    return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function read() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "[]");
    } catch (_) {
      return [];
    }
  }

  function write(list) {
    sessionStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
  }

  function money(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function formatMoney(amount, currency = "TRY") {
    return `${currency} ${money(amount).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function calcTotals(lineItems, vatRate = 20) {
    const lines = (lineItems || []).map((line) => {
      const quantity = money(line.quantity);
      const unitPrice = money(line.unitPrice);
      const lineNet = money(quantity * unitPrice);
      return { ...line, quantity, unitPrice, lineNet };
    });
    const subtotal = money(lines.reduce((s, l) => s + l.lineNet, 0));
    const vatAmount = money(subtotal * (vatRate / 100));
    const grandTotal = money(subtotal + vatAmount);
    return { lines, subtotal, vatRate, vatAmount, grandTotal };
  }

  function getCustomers() {
    if (global.UyumPayments?.getCustomersFromStorage) {
      return global.UyumPayments.getCustomersFromStorage();
    }
    return [];
  }

  function getPayments() {
    if (global.UyumPayments?.listPayments) {
      global.UyumPayments.ensureSeedData?.();
      return global.UyumPayments.listPayments().filter((p) => p.status === "received");
    }
    return [];
  }

  function getInvoicePendingTransactions() {
    if (global.UyumPayments?.paymentsAwaitingInvoice) {
      global.UyumPayments.ensureSeedData?.();
      return global.UyumPayments.paymentsAwaitingInvoice();
    }
    return [];
  }

  function markTransactionInvoiced(transactionId, invoiceId) {
    try {
      const raw = sessionStorage.getItem("uyum.transactions");
      if (!raw) return;
      const list = JSON.parse(raw);
      const idx = list.findIndex((t) => t.id === transactionId);
      if (idx < 0) return;
      list[idx] = {
        ...list[idx],
        status: "invoiced",
        invoiceId,
        statusUpdatedAt: new Date().toISOString(),
        statusReason: "e-Document successful",
      };
      sessionStorage.setItem("uyum.transactions", JSON.stringify(list));
    } catch (_) {
      /* ignore */
    }
  }

  function ensureSeed() {
    if (read().length) return;
    const customers = getCustomers();
    const customer = customers[0] || {
      id: "CUS-DEMO-10482",
      fullName: "Ayşe Yılmaz",
      nationalId: "12345678901",
      email: "ayse.yilmaz@example.com",
      address: "Caferağa Mah. Moda Cad. No:12, Kadıköy, İstanbul",
      phone: "+90 532 555 44 33",
    };
    const payments = getPayments();
    const payment = payments[0] || null;
    const lines = [
      {
        description: "22K gold bracelet",
        quantity: 1,
        unitPrice: 207083.33,
        unit: "adet",
      },
    ];
    const { lines: normalized, subtotal, vatRate, vatAmount, grandTotal } = calcTotals(lines, 20);
    const invoice = {
      id: uid("INV"),
      number: "INV-2026-SEED01",
      documentType: "e-Invoice",
      status: "Draft",
      issueDate: new Date().toISOString().slice(0, 10),
      currency: "TRY",
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        taxOrNationalId: customer.nationalId || "12345678901",
        email: customer.email || "ayse.yilmaz@example.com",
        phone: customer.phone || "",
        address: customer.address || "Kadıköy, İstanbul",
      },
      payment: payment
        ? {
            id: payment.id,
            amount: payment.amount,
            method: payment.method,
            date: payment.date,
            transactionId: payment.transactionId,
          }
        : null,
      transactionId: payment?.transactionId || null,
      lineItems: normalized,
      totals: { subtotal, vatRate, vatAmount, grandTotal },
      notes: "Seed draft for styleguide / demo",
      suggestions: [],
      history: [
        {
          at: new Date().toISOString(),
          status: "Draft",
          detail: "Seed invoice created",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    write([invoice]);
  }

  function listInvoices() {
    ensureSeed();
    return read().sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
  }

  function getInvoice(id) {
    return listInvoices().find((i) => i.id === id) || null;
  }

  function saveInvoice(invoice) {
    const all = read();
    const idx = all.findIndex((i) => i.id === invoice.id);
    invoice.updatedAt = new Date().toISOString();
    if (idx >= 0) all[idx] = invoice;
    else all.unshift(invoice);
    write(all);
    return invoice;
  }

  function pushHistory(invoice, status, detail) {
    invoice.history = invoice.history || [];
    invoice.history.unshift({
      at: new Date().toISOString(),
      status,
      detail,
    });
  }

  function buildCustomerSnapshot(customerId, overrides = {}) {
    const source = getCustomers().find((c) => c.id === customerId) || {};
    return {
      id: customerId || source.id || "",
      fullName: overrides.fullName ?? source.fullName ?? "",
      taxOrNationalId: overrides.taxOrNationalId ?? source.nationalId ?? "",
      email: overrides.email ?? source.email ?? "",
      phone: overrides.phone ?? source.phone ?? "",
      address: overrides.address ?? source.address ?? "",
    };
  }

  function createDraft(input) {
    const { lines, subtotal, vatRate, vatAmount, grandTotal } = calcTotals(
      input.lineItems || [],
      Number(input.vatRate) || 20,
    );
    const customer = buildCustomerSnapshot(input.customerId, input.customer || {});
    const payment =
      input.paymentId && getPayments().find((p) => p.id === input.paymentId)
        ? (() => {
            const p = getPayments().find((x) => x.id === input.paymentId);
            return {
              id: p.id,
              amount: p.amount,
              method: p.method,
              date: p.date,
              transactionId: p.transactionId,
            };
          })()
        : input.payment || null;

    const invoice = {
      id: uid("INV"),
      number: input.number || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      documentType: input.documentType === "e-Archive" ? "e-Archive" : "e-Invoice",
      status: "Draft",
      issueDate: input.issueDate || new Date().toISOString().slice(0, 10),
      currency: "TRY",
      customer,
      payment,
      transactionId: input.transactionId || payment?.transactionId || null,
      lineItems: lines,
      totals: { subtotal, vatRate, vatAmount, grandTotal },
      notes: input.notes || "",
      suggestions: [],
      failureCode: null,
      failureMessage: null,
      ettn: null,
      uuid: null,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pushHistory(invoice, "Draft", "Draft created from customer / payment / line items");
    return saveInvoice(invoice);
  }

  function updateDraft(id, patch) {
    const invoice = getInvoice(id);
    if (!invoice) return { ok: false, error: "Invoice not found" };
    if (!["Draft", "Failed"].includes(invoice.status)) {
      return { ok: false, error: "Only Draft or Failed invoices can be edited." };
    }

    if (patch.customer) {
      invoice.customer = { ...invoice.customer, ...patch.customer };
    }
    if (patch.number) invoice.number = patch.number;
    if (patch.documentType) invoice.documentType = patch.documentType;
    if (patch.issueDate) invoice.issueDate = patch.issueDate;
    if (patch.notes != null) invoice.notes = patch.notes;
    if (patch.lineItems) {
      const calc = calcTotals(patch.lineItems, Number(patch.vatRate) || invoice.totals.vatRate);
      invoice.lineItems = calc.lines;
      invoice.totals = {
        subtotal: calc.subtotal,
        vatRate: calc.vatRate,
        vatAmount: calc.vatAmount,
        grandTotal: calc.grandTotal,
      };
    }
    if (patch.paymentId) {
      const p = getPayments().find((x) => x.id === patch.paymentId);
      if (p) {
        invoice.payment = {
          id: p.id,
          amount: p.amount,
          method: p.method,
          date: p.date,
          transactionId: p.transactionId,
        };
        invoice.transactionId = p.transactionId;
      }
    }

    if (invoice.status === "Failed") {
      invoice.status = "Draft";
      pushHistory(invoice, "Draft", "Corrected after failure — returned to Draft");
    } else {
      pushHistory(invoice, invoice.status, "Draft updated");
    }
    invoice.suggestions = [];
    invoice.failureCode = null;
    invoice.failureMessage = null;
    return { ok: true, invoice: saveInvoice(invoice) };
  }

  async function submitInvoice(id) {
    const invoice = getInvoice(id);
    if (!invoice) return { ok: false, error: "Invoice not found" };
    if (!["Draft", "Failed"].includes(invoice.status)) {
      return { ok: false, error: "Only Draft or Failed invoices can be sent." };
    }

    invoice.status = "Sending";
    invoice.suggestions = [];
    pushHistory(invoice, "Sending", "Submitting to mock e-document adapter");
    saveInvoice(invoice);

    const adapter = global.UyumEDocument?.EDocumentAdapter;
    if (!adapter) {
      invoice.status = "Failed";
      invoice.failureMessage = "E-document adapter unavailable";
      invoice.suggestions = [
        { field: "adapter", action: "Ensure mock-edocument.js is loaded, then retry." },
      ];
      pushHistory(invoice, "Failed", invoice.failureMessage);
      saveInvoice(invoice);
      return { ok: false, invoice };
    }

    const result = await adapter.submit(invoice);
    if (!result.ok) {
      invoice.status = "Failed";
      invoice.failureCode = result.code || "FAILED";
      invoice.failureMessage = result.message || "Submission failed";
      invoice.suggestions = result.suggestions || [];
      pushHistory(invoice, "Failed", invoice.failureMessage);
      saveInvoice(invoice);
      return { ok: false, invoice, result };
    }

    invoice.status = "Successful";
    invoice.ettn = result.ettn;
    invoice.uuid = result.uuid;
    invoice.failureCode = null;
    invoice.failureMessage = null;
    invoice.suggestions = [];
    invoice.acceptedAt = result.submittedAt;
    pushHistory(invoice, "Successful", result.message || "Accepted by mock integrator");
    saveInvoice(invoice);

    if (invoice.transactionId) {
      markTransactionInvoiced(invoice.transactionId, invoice.id);
    }

    if (global.UyumSecurity?.writeAudit) {
      global.UyumSecurity.writeAudit({
        event: "invoice.successful",
        customerId: invoice.customer.id,
        detail: `${invoice.number} ${invoice.documentType} successful · ${invoice.ettn}`,
      });
    }

    return { ok: true, invoice, result };
  }

  async function cancelInvoice(id, reason) {
    const invoice = getInvoice(id);
    if (!invoice) return { ok: false, error: "Invoice not found" };
    if (invoice.status === "Cancelled") return { ok: true, invoice };
    if (invoice.status === "Sending") {
      return { ok: false, error: "Cannot cancel while Sending." };
    }

    if (invoice.status === "Successful") {
      const adapter = global.UyumEDocument?.EDocumentAdapter;
      const result = await adapter.cancel(invoice, reason || "Cancelled by user");
      if (!result.ok) {
        return { ok: false, error: result.message, invoice, suggestions: result.suggestions };
      }
    }

    invoice.status = "Cancelled";
    invoice.cancelReason = reason || "Cancelled by user";
    pushHistory(invoice, "Cancelled", invoice.cancelReason);
    saveInvoice(invoice);
    return { ok: true, invoice };
  }

  function buildPreviewHtml(invoice) {
    const lines = (invoice.lineItems || [])
      .map(
        (l) => `
        <tr>
          <td>${escapeHtml(l.description)}</td>
          <td style="text-align:right">${l.quantity}</td>
          <td style="text-align:right">${formatMoney(l.unitPrice, invoice.currency)}</td>
          <td style="text-align:right">${formatMoney(l.lineNet, invoice.currency)}</td>
        </tr>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: "IBM Plex Sans", Arial, sans-serif; color: #1c2128; margin: 24px; font-size: 12px; }
  h1 { font-family: "Source Serif 4", Georgia, serif; font-size: 22px; margin: 0 0 4px; }
  .muted { color: #6b7380; }
  .row { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border-bottom: 1px solid #d7dbe2; padding: 8px 6px; text-align: left; }
  th { background: #ebedf0; font-size: 11px; }
  .totals { margin-top: 16px; width: 240px; margin-left: auto; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .stamp { display: inline-block; padding: 4px 8px; border: 1px solid #a8843a; color: #8f7130; border-radius: 4px; font-weight: 700; }
</style></head><body>
  <div class="row">
    <div>
      <h1>Uyum ${escapeHtml(invoice.documentType)}</h1>
      <div class="muted">Mock PDF preview · not a live GİB document</div>
    </div>
    <div style="text-align:right">
      <div class="stamp">${escapeHtml(invoice.status)}</div>
      <div><strong>${escapeHtml(invoice.number)}</strong></div>
      <div class="muted">${escapeHtml(invoice.issueDate)}</div>
    </div>
  </div>
  <div class="row">
    <div>
      <strong>Bill to</strong><br/>
      ${escapeHtml(invoice.customer.fullName)}<br/>
      ID: ${escapeHtml(invoice.customer.taxOrNationalId || "—")}<br/>
      ${escapeHtml(invoice.customer.address || "—")}<br/>
      ${escapeHtml(invoice.customer.email || "")}
    </div>
    <div style="text-align:right">
      <strong>Payment</strong><br/>
      ${invoice.payment ? escapeHtml(invoice.payment.id) : "—"}<br/>
      ${invoice.payment ? formatMoney(invoice.payment.amount, invoice.currency) : ""}<br/>
      ${invoice.payment ? escapeHtml(invoice.payment.method) : ""}
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Net</th></tr></thead>
    <tbody>${lines || `<tr><td colspan="4" class="muted">No line items</td></tr>`}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatMoney(invoice.totals.subtotal, invoice.currency)}</span></div>
    <div><span>VAT (${invoice.totals.vatRate}%)</span><span>${formatMoney(invoice.totals.vatAmount, invoice.currency)}</span></div>
    <div><strong>Grand total</strong><strong>${formatMoney(invoice.totals.grandTotal, invoice.currency)}</strong></div>
  </div>
  ${invoice.notes ? `<p class="muted" style="margin-top:20px">Notes: ${escapeHtml(invoice.notes)}</p>` : ""}
  ${invoice.ettn ? `<p class="muted">ETTN: ${escapeHtml(invoice.ettn)}</p>` : ""}
</body></html>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusMeta(status) {
    return STATUSES[status] || { id: status, label: status, tone: "neutral" };
  }

  global.UyumInvoices = {
    STATUSES,
    formatMoney,
    calcTotals,
    listInvoices,
    getInvoice,
    createDraft,
    updateDraft,
    submitInvoice,
    cancelInvoice,
    buildPreviewHtml,
    getCustomers,
    getPayments,
    getInvoicePendingTransactions,
    statusMeta,
    ensureSeed,
  };
})(window);
