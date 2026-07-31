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
  const all = UyumInvoices.listInvoices();
  const counts = {
    Draft: 0,
    Sending: 0,
    Successful: 0,
    Failed: 0,
    Cancelled: 0,
  };
  all.forEach((i) => {
    if (counts[i.status] != null) counts[i.status] += 1;
  });
  $("stat-total").textContent = String(all.length);
  $("stat-successful").textContent = String(counts.Successful);
  $("stat-failed").textContent = String(counts.Failed);
  $("status-chips").innerHTML = Object.entries(counts)
    .map(([status, count]) => {
      const meta = UyumInvoices.statusMeta(status);
      return `${badge(meta.tone, `${meta.label} ${count}`)}`;
    })
    .join("");
}

function renderTable() {
  const status = $("filter-status").value;
  const type = $("filter-type").value;
  const query = $("filter-query").value.trim().toLowerCase();
  const highlight = new URLSearchParams(window.location.search).get("highlight");

  const rows = UyumInvoices.listInvoices().filter((inv) => {
    if (status && inv.status !== status) return false;
    if (type && inv.documentType !== type) return false;
    if (query) {
      const hay = `${inv.number} ${inv.customer.fullName} ${inv.id} ${inv.payment?.id || ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const body = $("invoices-body");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="8" class="text-muted">No invoices match these filters.</td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map((inv) => {
      const meta = UyumInvoices.statusMeta(inv.status);
      const hl = highlight === inv.id ? ' style="background: rgba(247, 240, 222, 0.7)"' : "";
      const actions = [];
      if (["Draft", "Failed"].includes(inv.status)) {
        actions.push(
          `<a class="btn btn--ghost btn--sm" href="./invoice-new.html?edit=${encodeURIComponent(inv.id)}">${inv.status === "Failed" ? "Correct & Retry" : "Edit"}</a>`,
        );
      }
      actions.push(
        `<button class="btn btn--ghost btn--sm" type="button" data-preview="${inv.id}">Preview</button>`,
      );
      if (inv.status !== "Cancelled" && inv.status !== "Sending") {
        actions.push(
          `<button class="btn btn--ghost btn--sm" type="button" data-cancel="${inv.id}">Cancel</button>`,
        );
      }
      return `
        <tr${hl} data-id="${inv.id}">
          <td class="mono sticky-col">${inv.number}</td>
          <td>${inv.documentType}</td>
          <td>
            <div>${inv.customer.fullName}</div>
            <div class="text-small text-muted mono">${inv.customer.taxOrNationalId || "—"}</div>
          </td>
          <td class="num">${UyumInvoices.formatMoney(inv.totals.grandTotal, inv.currency)}</td>
          <td class="text-small">${inv.issueDate}</td>
          <td>${badge(meta.tone, meta.label)}</td>
          <td class="text-small">${inv.payment?.id || "—"}</td>
          <td><div class="row" style="flex-wrap:wrap;gap:0.25rem">${actions.join("")}</div></td>
        </tr>
        ${
          inv.status === "Failed" && inv.suggestions?.length
            ? `<tr class="failure-row" data-for="${inv.id}">
                <td colspan="8">
                  <div class="alert alert--danger" style="margin:0.25rem 0 0.75rem">
                    <div class="alert__icon">×</div>
                    <div>
                      <div class="alert__title">${inv.failureMessage || "Failed"}</div>
                      <div class="alert__body">
                        <ul class="suggestion-list">
                          ${inv.suggestions.map((s) => `<li><strong>${s.field}</strong> — ${s.action}</li>`).join("")}
                        </ul>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>`
            : ""
        }
      `;
    })
    .join("");

  body.querySelectorAll("[data-preview]").forEach((btn) => {
    btn.addEventListener("click", () => openPreview(btn.dataset.preview));
  });
  body.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => cancelInvoice(btn.dataset.cancel));
  });
}

function openPreview(id) {
  const invoice = UyumInvoices.getInvoice(id);
  if (!invoice) return;
  $("list-preview-panel").hidden = false;
  $("list-preview-frame").srcdoc = UyumInvoices.buildPreviewHtml(invoice);
  $("list-preview-title").textContent = `${invoice.number} · ${invoice.documentType}`;
  const meta = UyumInvoices.statusMeta(invoice.status);
  $("list-preview-status").textContent = meta.label;
  $("list-preview-status").className = `badge badge--${meta.tone}`;
  $("list-preview-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function cancelInvoice(id) {
  const reason = window.prompt("Cancellation reason", "Cancelled by store staff");
  if (reason == null) return;
  const result = await UyumInvoices.cancelInvoice(id, reason || "Cancelled by user");
  if (!result.ok) {
    window.alert(result.error || "Cancel failed");
    return;
  }
  renderStats();
  renderTable();
}

function renderPendingQueue() {
  const txns = UyumInvoices.getInvoicePendingTransactions();
  const el = $("pending-queue");
  if (!txns.length) {
    el.innerHTML = `<li><span class="text-muted">No Invoice Pending transactions.</span></li>`;
    return;
  }
  el.innerHTML = txns
    .map(
      (t) => `
      <li>
        <div>
          <a href="./invoice-new.html?transactionId=${encodeURIComponent(t.id)}&customerId=${encodeURIComponent(t.customerId)}">${t.customerName}</a>
          <div class="text-small text-muted mono">${t.id} · ${UyumInvoices.formatMoney(t.amount)}</div>
        </div>
        <a class="btn btn--secondary btn--sm" href="./invoice-new.html?transactionId=${encodeURIComponent(t.id)}&customerId=${encodeURIComponent(t.customerId)}">Issue Invoice</a>
      </li>`,
    )
    .join("");
}

function init() {
  wireNav();
  UyumPayments?.ensureSeedData?.();
  UyumInvoices.ensureSeed();
  renderStats();
  renderTable();
  renderPendingQueue();

  ["filter-status", "filter-type", "filter-query"].forEach((id) => {
    $(id).addEventListener("input", renderTable);
    $(id).addEventListener("change", renderTable);
  });

  $("close-preview-btn")?.addEventListener("click", () => {
    $("list-preview-panel").hidden = true;
  });
}

init();
