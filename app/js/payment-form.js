function $(id) {
  return document.getElementById(id);
}

function wireNav() {
  const shell = $("shell");
  const toggle = $("nav-toggle");
  const backdrop = $("nav-backdrop");
  if (!toggle) return;
  toggle.addEventListener("click", () => shell.classList.toggle("nav-open"));
  backdrop?.addEventListener("click", () => shell.classList.remove("nav-open"));
}

function showAlert(type, title, body) {
  const el = $("form-alert");
  el.hidden = false;
  el.className = `alert alert--${type}`;
  el.innerHTML = `
    <div class="alert__icon">${type === "danger" ? "×" : type === "success" ? "✓" : "!"}</div>
    <div>
      <div class="alert__title">${title}</div>
      <div class="alert__body">${body}</div>
    </div>
  `;
}

function hideAlert() {
  $("form-alert").hidden = true;
}

function populateCustomers() {
  const customers = UyumPayments.getCustomersFromStorage();
  const select = $("customerId");
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get("customerId");

  select.innerHTML =
    `<option value="">Select customer</option>` +
    customers
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === preselect ? "selected" : ""}>${c.fullName} · ${c.id}</option>`,
      )
      .join("");
}

function populateTransactions() {
  const customerId = $("customerId").value;
  const select = $("transactionId");
  const txns = UyumPayments.listTransactions().filter(
    (t) => (!customerId || t.customerId === customerId) && t.status !== "invoiced",
  );

  select.innerHTML =
    `<option value="">Auto-create / match open transaction</option>` +
    txns
      .map((t) => {
        const meta = UyumPayments.txnStatusMeta(t.status);
        return `<option value="${t.id}">${t.id} · ${UyumPayments.formatMoney(t.amount, t.currency)} · ${meta.label}</option>`;
      })
      .join("");
}

function selectedMethod() {
  return document.querySelector(".method-card.is-selected")?.dataset.method || "pos";
}

function setMethod(method) {
  document.querySelectorAll(".method-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.method === method);
  });
  $("split-section").hidden = method !== "split";
  $("transfer-section").hidden = method !== "bank_transfer" && method !== "split";
  $("connector-label").textContent =
    method === "pos"
      ? "Mock POS connector"
      : method === "bank_transfer"
        ? "Mock bank transfer connector"
        : method === "cash"
          ? "Mock cash drawer connector"
          : "Mock connectors (per split leg)";
}

function addSplitRow(method = "pos", amount = "") {
  const row = document.createElement("div");
  row.className = "split-row";
  row.innerHTML = `
    <div class="field">
      <label class="field__label">Method</label>
      <select class="field__control split-method">
        <option value="pos">POS</option>
        <option value="bank_transfer">Bank transfer</option>
        <option value="cash">Cash</option>
      </select>
    </div>
    <div class="field">
      <label class="field__label">Amount (TRY)</label>
      <input class="field__control mono split-amount" type="number" min="0.01" step="0.01" value="${amount}" />
    </div>
    <button class="btn btn--ghost btn--sm split-remove" type="button">Remove</button>
  `;
  row.querySelector(".split-method").value = method;
  row.querySelector(".split-remove").addEventListener("click", () => {
    if ($("split-rows").children.length > 2) row.remove();
  });
  $("split-rows").appendChild(row);
}

function readSplits() {
  return [...$("split-rows").querySelectorAll(".split-row")].map((row) => ({
    method: row.querySelector(".split-method").value,
    amount: row.querySelector(".split-amount").value,
  }));
}

function readForm() {
  const method = selectedMethod();
  const customerOption = $("customerId").selectedOptions[0];
  return {
    customerId: $("customerId").value,
    customerName: customerOption?.textContent?.split("·")[0]?.trim() || "",
    transactionId: $("transactionId").value || null,
    amount: $("amount").value,
    currency: "TRY",
    date: $("paymentDate").value,
    method,
    description: $("description").value,
    documentName: $("documentName").value,
    documentType: "application/pdf",
    transferRef: $("transferRef").value,
    splits: method === "split" ? readSplits() : [],
  };
}

async function submitPayment(event) {
  event.preventDefault();
  hideAlert();
  const btn = $("submit-btn");
  btn.disabled = true;
  btn.textContent = "Processing…";

  try {
    const result = await UyumPayments.receivePayment(readForm());
    if (!result.ok) {
      showAlert(
        "danger",
        "Payment not recorded",
        `<ul class="missing-list">${(result.errors || ["Unknown error"]).map((e) => `<li>${e}</li>`).join("")}</ul>`,
      );
      return;
    }

    const txnMeta = UyumPayments.txnStatusMeta(result.transaction.status);
    showAlert(
      "success",
      "Payment received",
      `${result.payment.id} linked to ${result.transaction.id}. Transaction status is now <strong>${txnMeta.label}</strong>.`,
    );

    window.setTimeout(() => {
      window.location.href = `./payments.html?highlight=${encodeURIComponent(result.payment.id)}`;
    }, 900);
  } finally {
    btn.disabled = false;
    btn.textContent = "Record Payment";
  }
}

function init() {
  wireNav();
  populateCustomers();
  populateTransactions();
  $("customerId").addEventListener("change", populateTransactions);

  const today = new Date();
  $("paymentDate").value = today.toISOString().slice(0, 10);

  document.querySelectorAll(".method-card").forEach((card) => {
    card.addEventListener("click", () => setMethod(card.dataset.method));
  });
  setMethod("pos");

  addSplitRow("pos", "");
  addSplitRow("cash", "");
  $("add-split-btn").addEventListener("click", () => addSplitRow("bank_transfer", ""));

  $("mock-doc-btn").addEventListener("click", () => {
    const name = `payment-proof-${Date.now().toString().slice(-6)}.pdf`;
    $("documentName").value = name;
    $("doc-drop").classList.add("is-ready");
    $("doc-status").textContent = `Attached (mock): ${name}`;
  });

  $("payment-form").addEventListener("submit", submitPayment);
}

init();
