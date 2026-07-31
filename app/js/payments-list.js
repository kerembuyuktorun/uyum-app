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

function badge(tone, label) {
  return `<span class="badge badge--${tone}">${label}</span>`;
}

function renderStats() {
  const payments = UyumPayments.listPayments();
  const received = payments.filter((p) => p.status === "received");
  const pendingInvoice = UyumPayments.paymentsAwaitingInvoice();
  const total = received.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  $("stat-payments").textContent = String(payments.length);
  $("stat-received").textContent = UyumPayments.formatMoney(total);
  $("stat-invoice-pending").textContent = String(pendingInvoice.length);
}

function currentFilters() {
  return {
    method: $("filter-method").value,
    status: $("filter-status").value,
    query: $("filter-query").value.trim().toLowerCase(),
  };
}

function renderPayments() {
  const { method, status, query } = currentFilters();
  const highlight = new URLSearchParams(window.location.search).get("highlight");
  const rows = UyumPayments.listPayments().filter((p) => {
    if (method && p.method !== method) return false;
    if (status && p.status !== status) return false;
    if (query) {
      const hay = `${p.id} ${p.customerName} ${p.transactionId} ${p.description}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const body = $("payments-body");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="8" class="text-muted">No payments match these filters.</td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map((p) => {
      const payMeta = UyumPayments.paymentStatusMeta(p.status);
      const txn = UyumPayments.getTransaction(p.transactionId);
      const txnMeta = txn
        ? UyumPayments.txnStatusMeta(txn.status)
        : { label: "—", tone: "neutral" };
      const when = new Date(p.date).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const hl = highlight === p.id ? ' style="background: rgba(247, 240, 222, 0.7)"' : "";
      return `
        <tr${hl}>
          <td class="mono sticky-col">${p.id}</td>
          <td>
            <div>${p.customerName}</div>
            <div class="text-small text-muted mono">${p.customerId}</div>
          </td>
          <td class="mono">${p.transactionId}</td>
          <td class="num">${UyumPayments.formatMoney(p.amount, p.currency)}</td>
          <td>${UyumPayments.methodLabel(p.method)}</td>
          <td class="text-small">${when}</td>
          <td>${badge(payMeta.tone, payMeta.label)}</td>
          <td>${badge(txnMeta.tone, txnMeta.label)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderInvoicePending() {
  const list = $("invoice-pending-list");
  const rows = UyumPayments.paymentsAwaitingInvoice();
  if (!rows.length) {
    list.innerHTML = `<li><span class="text-muted">No transactions waiting for invoice.</span></li>`;
    return;
  }
  list.innerHTML = rows
    .map((t) => {
      const meta = UyumPayments.txnStatusMeta(t.status);
      return `
        <li>
          <div>
            <a href="#${t.id}">${t.customerName}</a>
            <div class="text-small text-muted mono">${t.id} · ${UyumPayments.formatMoney(t.amount, t.currency)}</div>
          </div>
          ${badge(meta.tone, meta.label)}
        </li>
      `;
    })
    .join("");
}

function renderConnectorHelp() {
  $("connector-help").innerHTML = `
    <div class="stack-sm text-small text-secondary">
      <div><code>MockPosConnector.charge()</code> — card auth</div>
      <div><code>MockBankConnector.confirmTransfer()</code> — EFT confirm</div>
      <div><code>MockCashConnector.record()</code> — cash drawer</div>
      <div>Split payments call one connector per leg.</div>
    </div>
  `;
}

function init() {
  wireNav();
  UyumPayments.ensureSeedData();
  renderStats();
  renderPayments();
  renderInvoicePending();
  renderConnectorHelp();

  ["filter-method", "filter-status", "filter-query"].forEach((id) => {
    $(id).addEventListener("input", renderPayments);
    $(id).addEventListener("change", renderPayments);
  });
}

init();
