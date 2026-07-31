const actionCopy = {
  "new-customer": {
    title: "New Customer",
    body: "Opening customer onboarding form…",
    href: "./kyc.html",
  },
  "start-kyc": {
    title: "Start KYC Form",
    body: "Starting AML/KYC checklist for the selected or new customer…",
    href: "./kyc.html",
  },
  "add-payment": {
    title: "Add Payment",
    body: "Opening payment entry for today’s sales…",
    href: "./payment-new.html",
  },
  "issue-invoice": {
    title: "Issue Invoice",
    body: "Opening e-Invoice / e-Archive issue flow…",
    href: "./invoice-new.html",
  },
  "search-archive": {
    title: "Search Archive",
    body: "Opening document archive search…",
  },
};

function badgeClass(tone) {
  const map = {
    success: "badge--success",
    warning: "badge--warning",
    danger: "badge--danger",
    info: "badge--info",
    neutral: "badge--neutral",
  };
  return map[tone] || "badge--neutral";
}

function summaryToneClass(tone) {
  if (tone === "warning") return "summary-card--warning";
  if (tone === "success") return "summary-card--success";
  if (tone === "info") return "summary-card--info";
  return "";
}

function showToast(title, body) {
  const host = document.getElementById("toast-host");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <div>
      <div class="toast__title"></div>
      <div class="toast__body"></div>
    </div>
    <button class="toast__close" type="button" aria-label="Dismiss">×</button>
  `;
  toast.querySelector(".toast__title").textContent = title;
  toast.querySelector(".toast__body").textContent = body;
  const remove = () => toast.remove();
  toast.querySelector(".toast__close").addEventListener("click", remove);
  host.appendChild(toast);
  window.setTimeout(remove, 3200);
}

function renderShell(data) {
  document.getElementById("store-name").textContent = data.store.name;
  document.getElementById("store-date").textContent = data.store.dateLabel;
  document.getElementById("employee-name").textContent = data.store.employee;
  document.getElementById("employee-role").textContent = data.store.role;
  document.getElementById("sidebar-store").textContent = data.store.name;
}

function renderPrices(market) {
  const board = document.getElementById("price-board");
  const items = market.items
    .map((item) => {
      const dirClass = item.direction === "down" ? "is-down" : "is-up";
      return `
        <div class="price-item">
          <div class="price-item__label">${item.label} · ${item.symbol}</div>
          <div class="price-item__value">${item.value} <span class="text-small text-muted">${item.unit}</span></div>
          <div class="price-item__change ${dirClass}">${item.change}</div>
        </div>
      `;
    })
    .join("");

  board.innerHTML = `
    <div class="price-board__header">
      <div class="price-board__title">
        Gold &amp; currency prices
        <span class="badge badge--neutral">Live placeholder</span>
      </div>
      <span class="text-small text-muted">${market.updatedLabel}</span>
    </div>
    ${items}
  `;
}

function renderSummary(summary) {
  const cards = [
    { key: "dailyTransactions", href: "#recent-customers" },
    { key: "missingKyc", href: "#attention" },
    { key: "paymentsAwaitingInvoice", href: "#attention" },
    { key: "auditReadyFiles", href: "#action-search-archive" },
  ];

  document.getElementById("summary-grid").innerHTML = cards
    .map(({ key, href }) => {
      const item = summary[key];
      return `
        <a class="summary-card ${summaryToneClass(item.tone)}" href="${href}">
          <div class="summary-card__label">${item.label}</div>
          <div class="summary-card__value">${item.count}</div>
          <div class="summary-card__detail">${item.detail}</div>
        </a>
      `;
    })
    .join("");
}

function renderQuickActions(actions) {
  const host = document.getElementById("quick-actions");
  host.innerHTML = actions
    .map((action) => {
      const variant =
        action.variant === "primary"
          ? "btn--primary"
          : action.variant === "ghost"
            ? "btn--ghost"
            : "btn--secondary";
      return `
        <button
          class="btn ${variant}"
          type="button"
          data-action="${action.id}"
        >${action.label}</button>
      `;
    })
    .join("");

  host.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const copy = actionCopy[btn.dataset.action];
      if (!copy) return;
      if (copy.href) {
        window.location.href = copy.href;
        return;
      }
      showToast(copy.title, copy.body);
      window.location.hash = `action-${btn.dataset.action}`;
    });
  });
}

function renderRecentCustomers(customers) {
  const body = document.getElementById("recent-customers-body");
  body.innerHTML = customers
    .map(
      (c) => `
      <tr>
        <td class="sticky-col">
          <a class="customer-link" href="#customer-${c.id}">${c.name}</a>
          <div class="text-small text-muted mono">${c.id}</div>
        </td>
        <td class="text-small text-secondary">${c.lastSeen}</td>
        <td class="num">${c.purchase}</td>
        <td><span class="badge ${badgeClass(c.kycTone)}">${c.kycStatus}</span></td>
        <td><span class="badge ${badgeClass(c.invoiceTone)}">${c.invoiceStatus}</span></td>
      </tr>
    `,
    )
    .join("");
}

function renderAttention(items) {
  document.getElementById("attention-list").innerHTML = items
    .map(
      (item) => `
      <li>
        <div>
          <a href="#${item.id}">${item.title}</a>
          <div class="text-small text-muted">${item.meta}</div>
        </div>
        <span class="badge ${badgeClass(item.tone)}">${item.status}</span>
      </li>
    `,
    )
    .join("");
}

function wireNav() {
  const shell = document.getElementById("shell");
  const toggle = document.getElementById("nav-toggle");
  const backdrop = document.getElementById("nav-backdrop");

  const close = () => shell.classList.remove("nav-open");
  toggle.addEventListener("click", () => shell.classList.toggle("nav-open"));
  backdrop.addEventListener("click", close);
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", close);
  });
}

async function init() {
  wireNav();
  try {
    const res = await fetch("./data/dashboard.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load dashboard data (${res.status})`);
    const data = await res.json();
    renderShell(data);
    renderPrices(data.marketPrices);
    renderSummary(data.summary);
    renderQuickActions(data.quickActions);
    renderRecentCustomers(data.recentCustomers);
    renderAttention(data.attentionQueue);
  } catch (err) {
    console.error(err);
    showToast("Dashboard data unavailable", err.message || "Could not load sample data.");
  }
}

init();
