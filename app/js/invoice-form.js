function $(id) {
  return document.getElementById(id);
}

let currentInvoiceId = null;

function wireNav() {
  const shell = $("shell");
  const toggle = $("nav-toggle");
  const backdrop = $("nav-backdrop");
  if (!toggle) return;
  toggle.addEventListener("click", () => shell.classList.toggle("nav-open"));
  backdrop?.addEventListener("click", () => shell.classList.remove("nav-open"));
}

function showAlert(type, title, bodyHtml) {
  const el = $("form-alert");
  el.hidden = false;
  el.className = `alert alert--${type}`;
  el.innerHTML = `
    <div class="alert__icon">${type === "danger" ? "×" : type === "success" ? "✓" : "!"}</div>
    <div>
      <div class="alert__title">${title}</div>
      <div class="alert__body">${bodyHtml}</div>
    </div>
  `;
}

function hideAlert() {
  $("form-alert").hidden = true;
}

function selectedDocType() {
  return document.querySelector(".doc-type-btn.is-selected")?.dataset.type || "e-Invoice";
}

function setDocType(type) {
  document.querySelectorAll(".doc-type-btn").forEach((btn) => {
    btn.classList.toggle("is-selected", btn.dataset.type === type);
  });
}

function populateCustomers() {
  const customers = UyumInvoices.getCustomers();
  const params = new URLSearchParams(window.location.search);
  const pre = params.get("customerId");
  $("customerId").innerHTML =
    `<option value="">Select customer</option>` +
    customers
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === pre ? "selected" : ""}>${c.fullName} · ${c.id}</option>`,
      )
      .join("");
}

function populatePayments() {
  const customerId = $("customerId").value;
  const payments = UyumInvoices.getPayments().filter(
    (p) => !customerId || p.customerId === customerId,
  );
  const params = new URLSearchParams(window.location.search);
  const prePay = params.get("paymentId");
  const preTxn = params.get("transactionId");

  $("paymentId").innerHTML =
    `<option value="">No linked payment</option>` +
    payments
      .map((p) => {
        const selected =
          p.id === prePay || (!prePay && preTxn && p.transactionId === preTxn) ? "selected" : "";
        return `<option value="${p.id}" ${selected}>${p.id} · ${UyumInvoices.formatMoney(p.amount)} · ${p.method}</option>`;
      })
      .join("");
}

function fillCustomerFields() {
  const customer = UyumInvoices.getCustomers().find((c) => c.id === $("customerId").value);
  if (!customer) return;
  $("taxOrNationalId").value = customer.nationalId || "";
  $("customerEmail").value = customer.email || "";
  $("customerAddress").value = customer.address || "";
  $("customerName").value = customer.fullName || "";
}

function addLineRow(line = { description: "", quantity: 1, unitPrice: "" }) {
  const row = document.createElement("div");
  row.className = "line-row";
  row.innerHTML = `
    <div class="field">
      <label class="field__label">Description</label>
      <input class="field__control line-desc" value="${line.description || ""}" placeholder="22K ring" />
    </div>
    <div class="field">
      <label class="field__label">Qty</label>
      <input class="field__control mono line-qty" type="number" min="0.01" step="0.01" value="${line.quantity ?? 1}" />
    </div>
    <div class="field">
      <label class="field__label">Unit price</label>
      <input class="field__control mono line-price" type="number" min="0.01" step="0.01" value="${line.unitPrice ?? ""}" />
    </div>
    <button class="btn btn--ghost btn--sm line-remove" type="button">Remove</button>
  `;
  row.querySelector(".line-remove").addEventListener("click", () => {
    if ($("line-rows").children.length > 1) row.remove();
    refreshTotalsAndPreview();
  });
  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", refreshTotalsAndPreview);
  });
  $("line-rows").appendChild(row);
}

function readLineItems() {
  return [...$("line-rows").querySelectorAll(".line-row")].map((row) => ({
    description: row.querySelector(".line-desc").value,
    quantity: row.querySelector(".line-qty").value,
    unitPrice: row.querySelector(".line-price").value,
    unit: "adet",
  }));
}

function readForm() {
  return {
    number: $("invoice-number").value,
    documentType: selectedDocType(),
    customerId: $("customerId").value,
    customer: {
      fullName: $("customerName").value,
      taxOrNationalId: $("taxOrNationalId").value,
      email: $("customerEmail").value,
      address: $("customerAddress").value,
    },
    paymentId: $("paymentId").value || null,
    issueDate: $("issueDate").value,
    notes: $("notes").value,
    vatRate: Number($("vatRate").value) || 20,
    lineItems: readLineItems(),
  };
}

function draftFromForm() {
  const input = readForm();
  if (!input.customerId) {
    showAlert("danger", "Customer required", "Select a customer before saving the draft.");
    return null;
  }
  if (currentInvoiceId) {
    const result = UyumInvoices.updateDraft(currentInvoiceId, input);
    if (!result.ok) {
      showAlert("danger", "Could not update draft", result.error);
      return null;
    }
    return result.invoice;
  }
  const invoice = UyumInvoices.createDraft(input);
  currentInvoiceId = invoice.id;
  $("invoice-id-label").textContent = invoice.id;
  return invoice;
}

function renderPreview(invoice) {
  if (!invoice) {
    $("preview-frame").srcdoc =
      "<p style='font-family:sans-serif;padding:24px;color:#6b7380'>Save a draft to preview the e-document PDF.</p>";
    return;
  }
  $("preview-frame").srcdoc = UyumInvoices.buildPreviewHtml(invoice);
  const meta = UyumInvoices.statusMeta(invoice.status);
  $("preview-status").textContent = meta.label;
  $("preview-status").className = `badge badge--${meta.tone}`;
}

function refreshTotalsAndPreview() {
  const calc = UyumInvoices.calcTotals(readLineItems(), Number($("vatRate").value) || 20);
  $("total-subtotal").textContent = UyumInvoices.formatMoney(calc.subtotal);
  $("total-vat").textContent = UyumInvoices.formatMoney(calc.vatAmount);
  $("total-grand").textContent = UyumInvoices.formatMoney(calc.grandTotal);

  // Live preview from unsaved form state
  const live = {
    id: currentInvoiceId || "INV-DRAFT",
    number: $("invoice-number").value || "INV-PREVIEW",
    documentType: selectedDocType(),
    status: currentInvoiceId ? UyumInvoices.getInvoice(currentInvoiceId)?.status || "Draft" : "Draft",
    issueDate: $("issueDate").value,
    currency: "TRY",
    customer: {
      fullName: $("customerName").value || "Customer",
      taxOrNationalId: $("taxOrNationalId").value,
      email: $("customerEmail").value,
      address: $("customerAddress").value,
    },
    payment: (() => {
      const p = UyumInvoices.getPayments().find((x) => x.id === $("paymentId").value);
      return p
        ? { id: p.id, amount: p.amount, method: p.method, date: p.date, transactionId: p.transactionId }
        : null;
    })(),
    lineItems: calc.lines,
    totals: {
      subtotal: calc.subtotal,
      vatRate: calc.vatRate,
      vatAmount: calc.vatAmount,
      grandTotal: calc.grandTotal,
    },
    notes: $("notes").value,
    ettn: currentInvoiceId ? UyumInvoices.getInvoice(currentInvoiceId)?.ettn : null,
  };
  renderPreview(live);
}

function renderFailure(invoice) {
  if (!invoice || invoice.status !== "Failed") {
    $("failure-panel").hidden = true;
    return;
  }
  $("failure-panel").hidden = false;
  const items = (invoice.suggestions || [])
    .map((s) => `<li><strong>${s.field}</strong> — ${s.action}</li>`)
    .join("");
  showAlert(
    "danger",
    invoice.failureMessage || "e-Document failed",
    `${invoice.failureCode ? `<div class="mono text-small">${invoice.failureCode}</div>` : ""}
     <p>Correction suggestions:</p>
     <ul class="suggestion-list">${items || "<li>Review customer and line item data, then retry.</li>"}</ul>`,
  );
}

async function saveDraft() {
  hideAlert();
  const invoice = draftFromForm();
  if (!invoice) return;
  showAlert("success", "Draft saved", `${invoice.number} saved as Draft. PDF preview updated.`);
  renderPreview(invoice);
  renderFailure(invoice);
}

async function issueInvoice() {
  hideAlert();
  const invoice = draftFromForm();
  if (!invoice) return;

  $("issue-btn").disabled = true;
  $("issue-btn").textContent = "Sending…";
  try {
    const result = await UyumInvoices.submitInvoice(invoice.id);
    currentInvoiceId = result.invoice.id;
    renderPreview(result.invoice);
    if (!result.ok) {
      renderFailure(result.invoice);
      return;
    }
    showAlert(
      "success",
      "Invoice successful",
      `${result.invoice.number} accepted. ETTN <span class="mono">${result.invoice.ettn}</span>.`,
    );
    $("failure-panel").hidden = true;
    window.setTimeout(() => {
      window.location.href = `./invoices.html?highlight=${encodeURIComponent(result.invoice.id)}`;
    }, 1000);
  } finally {
    $("issue-btn").disabled = false;
    $("issue-btn").textContent = "Issue Invoice";
  }
}

function prefillFromPayment() {
  const paymentId = $("paymentId").value;
  const payment = UyumInvoices.getPayments().find((p) => p.id === paymentId);
  if (!payment) return;
  if (!$("customerId").value) {
    $("customerId").value = payment.customerId;
    fillCustomerFields();
    populatePayments();
    $("paymentId").value = paymentId;
  }
  // Suggest a single line matching payment amount (net of 20% VAT)
  const net = Math.round((Number(payment.amount) / 1.2) * 100) / 100;
  if (!$("line-rows").querySelector(".line-price")?.value) {
    $("line-rows").innerHTML = "";
    addLineRow({
      description: payment.description || "Jewelry sale",
      quantity: 1,
      unitPrice: net,
    });
  }
  refreshTotalsAndPreview();
}

function loadExistingInvoice(id) {
  const invoice = UyumInvoices.getInvoice(id);
  if (!invoice) return false;
  currentInvoiceId = invoice.id;
  $("invoice-id-label").textContent = invoice.id;
  $("invoice-number").value = invoice.number;
  setDocType(invoice.documentType);
  $("issueDate").value = invoice.issueDate;
  $("customerId").value = invoice.customer.id;
  populatePayments();
  if (invoice.payment?.id) $("paymentId").value = invoice.payment.id;
  $("customerName").value = invoice.customer.fullName || "";
  $("taxOrNationalId").value = invoice.customer.taxOrNationalId || "";
  $("customerEmail").value = invoice.customer.email || "";
  $("customerAddress").value = invoice.customer.address || "";
  $("notes").value = invoice.notes || "";
  $("vatRate").value = String(invoice.totals.vatRate || 20);
  $("line-rows").innerHTML = "";
  (invoice.lineItems || []).forEach((line) => addLineRow(line));
  if (!(invoice.lineItems || []).length) addLineRow();
  renderPreview(invoice);
  renderFailure(invoice);
  return true;
}

function init() {
  wireNav();
  UyumPayments?.ensureSeedData?.();
  UyumInvoices.ensureSeed();

  populateCustomers();
  populatePayments();
  $("issueDate").value = new Date().toISOString().slice(0, 10);
  $("invoice-number").value = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

  document.querySelectorAll(".doc-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setDocType(btn.dataset.type);
      refreshTotalsAndPreview();
    });
  });
  setDocType("e-Invoice");

  $("customerId").addEventListener("change", () => {
    fillCustomerFields();
    populatePayments();
    refreshTotalsAndPreview();
  });
  $("paymentId").addEventListener("change", prefillFromPayment);
  ["customerName", "taxOrNationalId", "customerEmail", "customerAddress", "notes", "vatRate", "issueDate", "invoice-number"].forEach(
    (id) => $(id).addEventListener("input", refreshTotalsAndPreview),
  );

  $("add-line-btn").addEventListener("click", () => {
    addLineRow();
    refreshTotalsAndPreview();
  });
  $("save-draft-btn").addEventListener("click", saveDraft);
  $("issue-btn").addEventListener("click", issueInvoice);
  $("refresh-preview-btn").addEventListener("click", () => {
    const inv = draftFromForm();
    if (inv) renderPreview(inv);
    else refreshTotalsAndPreview();
  });

  const editId = new URLSearchParams(window.location.search).get("edit");
  if (editId && loadExistingInvoice(editId)) {
    return;
  }

  addLineRow({ description: "22K gold item", quantity: 1, unitPrice: "" });
  if ($("customerId").value) fillCustomerFields();
  if ($("paymentId").value) prefillFromPayment();
  refreshTotalsAndPreview();
}

init();
