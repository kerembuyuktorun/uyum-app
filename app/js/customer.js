function $(id) {
  return document.getElementById(id);
}

function wireNav() {
  const shell = $("shell");
  const toggle = $("nav-toggle");
  const backdrop = $("nav-backdrop");
  if (!toggle) return;
  const close = () => shell.classList.remove("nav-open");
  toggle.addEventListener("click", () => shell.classList.toggle("nav-open"));
  backdrop?.addEventListener("click", close);
}

function consentLabel(type) {
  const found = window.UyumSecurity.CONSENT_TYPES.find((c) => c.id === type);
  return found ? found.label : type;
}

function renderRoleControls() {
  const sec = window.UyumSecurity;
  const user = sec.getSessionUser();
  const select = $("role-select");
  if (!select) return;

  select.innerHTML = Object.values(sec.ROLES)
    .map(
      (role) =>
        `<option value="${role.id}" ${role.id === user.role ? "selected" : ""}>${role.label}</option>`,
    )
    .join("");

  $("active-role-label").textContent = `${user.name} · ${sec.getRoleConfig(user.role).label}`;
  $("pii-access-badge").textContent =
    sec.getRoleConfig(user.role).piiAccess === "full"
      ? "Full PII access"
      : sec.getRoleConfig(user.role).piiAccess === "masked"
        ? "Masked PII"
        : "PII hidden";
  $("pii-access-badge").className = `badge ${
    sec.getRoleConfig(user.role).piiAccess === "full"
      ? "badge--success"
      : sec.getRoleConfig(user.role).piiAccess === "masked"
        ? "badge--warning"
        : "badge--danger"
  }`;
}

function renderSecurityBanner(profile) {
  const sec = window.UyumSecurity;
  const user = sec.getSessionUser();
  const access = sec.getRoleConfig(user.role).piiAccess;
  const alert = $("security-alert");
  if (access === "full") {
    alert.className = "alert alert--info";
    alert.innerHTML = `
      <div class="alert__icon">i</div>
      <div>
        <div class="alert__title">Authorized full access</div>
        <div class="alert__body">Identity numbers and contact details are visible because your role is ${user.role}.</div>
      </div>
    `;
  } else if (access === "masked") {
    alert.className = "alert alert--warning";
    alert.innerHTML = `
      <div class="alert__icon">!</div>
      <div>
        <div class="alert__title">Sensitive data masked</div>
        <div class="alert__body">National ID and contact details are partially masked for store employee sessions.</div>
      </div>
    `;
  } else {
    alert.className = "alert alert--danger";
    alert.innerHTML = `
      <div class="alert__icon">×</div>
      <div>
        <div class="alert__title">Unauthorized — details hidden</div>
        <div class="alert__body">Full identity numbers and contact details are not available for this role.</div>
      </div>
    `;
  }
}

function renderProfile(profile) {
  const sec = window.UyumSecurity;
  const view = sec.redactProfileForViewer(profile);
  const masked = view.sensitiveMasked;

  $("profile-name").textContent = view.fullNameDisplay;
  $("profile-id").textContent = profile.id;
  const payLink = $("add-payment-link");
  if (payLink) payLink.href = `./payment-new.html?customerId=${encodeURIComponent(profile.id)}`;
  $("profile-created").textContent = `Created ${profile.createdLabel}`;
  $("profile-store").textContent = profile.store;
  $("kyc-badge").textContent = profile.kycStatus;
  $("risk-badge").textContent = profile.riskLevel;
  $("ocr-badge").textContent = profile.ocrScanned ? "OCR scanned" : "Manual entry";
  $("ocr-badge").className = `badge ${profile.ocrScanned ? "badge--success" : "badge--neutral"}`;
  $("form-version-badge").textContent = profile.formVersion || sec.FORM_VERSION;

  const access = sec.getRoleConfig(sec.getSessionUser().role).piiAccess;
  const rows = [
    ["National ID number", view.nationalIdDisplay, true],
    ["Full name", view.fullNameDisplay, access === "hidden"],
    ["Birth date", view.birthDateDisplay, access === "hidden"],
    ["Phone", view.phoneDisplay, true],
    ["Email", view.emailDisplay, true],
    ["Address", view.addressDisplay, true],
    ["Occupation", profile.occupation, false],
    ["Transaction purpose", profile.transactionPurpose, false],
    ["Privacy notice", profile.privacyNoticeAck ? "Acknowledged" : "Missing", false],
    ["Explicit consent", profile.explicitConsent ? "Accepted" : "Missing", false],
    ["Data retention", profile.dataRetentionPermission ? "Permitted" : "Missing", false],
    ["Customer declaration", profile.customerDeclaration ? "Accepted" : "Missing", false],
  ];

  $("profile-grid").innerHTML = rows
    .map(([label, value, isSensitive]) => {
      const cls =
        isSensitive && masked ? ' class="masked-value is-redacted"' : isSensitive ? ' class="masked-value"' : "";
      return `<dt>${label}</dt><dd${cls}>${value || "—"}</dd>`;
    })
    .join("");

  renderSecurityBanner(profile);
  renderConsents(profile.id);
  renderAudit(profile.id);
}

function renderConsents(customerId) {
  const sec = window.UyumSecurity;
  const panel = $("consent-panel");
  const list = $("consent-list");

  if (!sec.canViewConsentAudit()) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;

  const records = sec.getConsentsForCustomer(customerId);
  if (!records.length) {
    list.innerHTML = `<p class="text-secondary">No consent permission records found for this customer.</p>`;
    return;
  }

  list.innerHTML = records
    .map((record) => {
      const when = new Date(record.timestamp).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return `
        <article class="consent-record">
          <div class="consent-record__title">
            <strong>${consentLabel(record.consentType)}</strong>
            <span class="badge ${record.accepted ? "badge--success" : "badge--danger"}">
              ${record.accepted ? "Accepted" : "Rejected"}
            </span>
          </div>
          <dl class="consent-record__meta">
            <div><dt>Timestamp</dt><dd class="mono">${when}</dd></div>
            <div><dt>User</dt><dd>${record.user.name} (${record.user.role})</dd></div>
            <div><dt>IP address</dt><dd class="mono">${record.ipAddress}</dd></div>
            <div><dt>Device</dt><dd>${record.device.platform} · ${record.device.screen}</dd></div>
            <div><dt>Form version</dt><dd class="mono">${record.formVersion}</dd></div>
            <div><dt>Record ID</dt><dd class="mono">${record.id}</dd></div>
          </dl>
        </article>
      `;
    })
    .join("");
}

function renderAudit(customerId) {
  const sec = window.UyumSecurity;
  const panel = $("audit-panel");
  const body = $("audit-body");

  if (!sec.canViewConsentAudit()) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;

  const rows = sec
    .getAuditLog(30)
    .filter((entry) => !customerId || entry.customerId === customerId || entry.event === "session.role_switched")
    .slice(0, 12);

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="text-muted">No audit events yet.</td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map((entry) => {
      const when = new Date(entry.timestamp).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return `
        <tr>
          <td class="mono">${when}</td>
          <td>${entry.event}</td>
          <td>${entry.actorName}<div class="text-small text-muted">${entry.actorRole}</div></td>
          <td class="mono">${entry.ipAddress}</td>
          <td class="text-small">${entry.detail || entry.formVersion}</td>
        </tr>
      `;
    })
    .join("");
}

function renderEmpty() {
  $("profile-view").hidden = true;
  $("empty-view").hidden = false;
}

function ensureConsentRecords(profile) {
  const sec = window.UyumSecurity;
  const existing = sec.getConsentsForCustomer(profile.id);
  if (existing.length) return existing;

  const values = {
    privacyNoticeAck: Boolean(profile.privacyNoticeAck ?? profile.privacyConsent),
    explicitConsent: Boolean(profile.explicitConsent ?? profile.privacyConsent),
    dataRetentionPermission: Boolean(
      profile.dataRetentionPermission ?? profile.privacyConsent,
    ),
    customerDeclaration: Boolean(profile.customerDeclaration),
  };

  if (!Object.values(values).some(Boolean)) return [];

  const records = sec.recordConsentBundle(profile.id, values);
  profile.consentRecordIds = records.map((r) => r.id);
  sessionStorage.setItem("uyum.latestCustomer", JSON.stringify(profile));
  return records;
}

function loadProfile() {
  const raw = sessionStorage.getItem("uyum.latestCustomer");
  if (!raw) {
    renderEmpty();
    return null;
  }
  try {
    const profile = JSON.parse(raw);
    // Migrate older profiles that only had privacyConsent
    if (profile.privacyConsent != null && profile.explicitConsent == null) {
      profile.explicitConsent = profile.privacyConsent;
      profile.privacyNoticeAck = profile.privacyConsent;
      profile.dataRetentionPermission = profile.privacyConsent;
    }
    ensureConsentRecords(profile);
    renderProfile(profile);
    $("profile-view").hidden = false;
    $("empty-view").hidden = true;
    return profile;
  } catch (err) {
    console.error(err);
    renderEmpty();
    return null;
  }
}

function init() {
  wireNav();
  renderRoleControls();
  let profile = loadProfile();

  $("role-select").addEventListener("change", (event) => {
    window.UyumSecurity.setSessionRole(event.target.value);
    renderRoleControls();
    profile = loadProfile() || profile;
  });
}

init();
