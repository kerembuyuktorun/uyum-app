const STEPS = [
  {
    id: "identity",
    title: "Identity",
    fields: ["nationalId", "fullName", "birthDate"],
  },
  {
    id: "contact",
    title: "Contact & address",
    fields: ["phone", "email", "address"],
  },
  {
    id: "purpose",
    title: "Occupation & purpose",
    fields: ["occupation", "transactionPurpose"],
  },
  {
    id: "consent",
    title: "Consents",
    fields: [
      "privacyNoticeAck",
      "explicitConsent",
      "dataRetentionPermission",
      "customerDeclaration",
    ],
  },
  {
    id: "confirm",
    title: "Confirm",
    fields: [],
  },
];

const FIELD_LABELS = {
  nationalId: "National ID number",
  fullName: "Full name",
  birthDate: "Birth date",
  phone: "Phone",
  email: "Email",
  address: "Address",
  occupation: "Occupation",
  transactionPurpose: "Transaction purpose",
  privacyNoticeAck: "Privacy notice acknowledged",
  explicitConsent: "Explicit processing consent",
  dataRetentionPermission: "Data retention permission",
  customerDeclaration: "Customer declaration",
};

const CONSENT_FIELDS = [
  "privacyNoticeAck",
  "explicitConsent",
  "dataRetentionPermission",
  "customerDeclaration",
];

const MOCK_OCR = {
  nationalId: "12345678901",
  fullName: "Ayşe Yılmaz",
  birthDate: "1990-04-12",
};

const state = {
  step: 0,
  ocrScanned: false,
  values: {
    nationalId: "",
    fullName: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    occupation: "",
    transactionPurpose: "",
    privacyNoticeAck: false,
    explicitConsent: false,
    dataRetentionPermission: false,
    customerDeclaration: false,
  },
};

function $(id) {
  return document.getElementById(id);
}

function isFilled(key) {
  const value = state.values[key];
  if (typeof value === "boolean") return value === true;
  return String(value || "").trim().length > 0;
}

function validateField(key) {
  const value = state.values[key];
  const trimmed = typeof value === "string" ? value.trim() : value;

  if (key === "nationalId") {
    if (!trimmed) return "National ID number is required.";
    if (!/^\d{11}$/.test(trimmed)) return "Enter an 11-digit national ID number.";
    return "";
  }
  if (key === "fullName") {
    if (!trimmed) return "Full name is required.";
    if (String(trimmed).split(/\s+/).length < 2) return "Enter first and last name.";
    return "";
  }
  if (key === "birthDate") {
    if (!trimmed) return "Birth date is required.";
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) return "Enter a valid birth date.";
    if (date > new Date()) return "Birth date cannot be in the future.";
    return "";
  }
  if (key === "phone") {
    if (!trimmed) return "Phone is required.";
    if (!/^\+?[\d\s()-]{10,}$/.test(trimmed)) return "Enter a valid phone number.";
    return "";
  }
  if (key === "email") {
    if (!trimmed) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address.";
    return "";
  }
  if (key === "address") {
    if (!trimmed) return "Address is required.";
    if (String(trimmed).length < 10) return "Enter a full street address.";
    return "";
  }
  if (key === "occupation") {
    if (!trimmed) return "Occupation is required.";
    return "";
  }
  if (key === "transactionPurpose") {
    if (!trimmed) return "Transaction purpose is required.";
    return "";
  }
  if (key === "privacyNoticeAck") {
    return value ? "" : "Privacy notice acknowledgment is required.";
  }
  if (key === "explicitConsent") {
    return value ? "" : "Explicit processing consent is required.";
  }
  if (key === "dataRetentionPermission") {
    return value ? "" : "Data retention permission is required.";
  }
  if (key === "customerDeclaration") {
    return value ? "" : "Customer declaration is required.";
  }
  return "";
}

function fieldIsComplete(key) {
  return validateField(key) === "";
}

function stepMissingFields(stepIndex) {
  return STEPS[stepIndex].fields.filter((key) => !fieldIsComplete(key));
}

function stepIsComplete(stepIndex) {
  if (STEPS[stepIndex].id === "confirm") {
    return STEPS.slice(0, -1).every((_, i) => stepMissingFields(i).length === 0);
  }
  return stepMissingFields(stepIndex).length === 0;
}

function readInputsIntoState() {
  state.values.nationalId = $("nationalId").value;
  state.values.fullName = $("fullName").value;
  state.values.birthDate = $("birthDate").value;
  state.values.phone = $("phone").value;
  state.values.email = $("email").value;
  state.values.address = $("address").value;
  state.values.occupation = $("occupation").value;
  state.values.transactionPurpose = $("transactionPurpose").value;
  state.values.privacyNoticeAck = $("privacyNoticeAck").checked;
  state.values.explicitConsent = $("explicitConsent").checked;
  state.values.dataRetentionPermission = $("dataRetentionPermission").checked;
  state.values.customerDeclaration = $("customerDeclaration").checked;
}

function applyFieldUI(key) {
  const field = document.querySelector(`[data-field="${key}"]`);
  if (!field) return;

  const control = field.querySelector(".field__control, input[type='checkbox']");
  const errorEl = field.querySelector(".field__error");
  const isCheckbox = CONSENT_FIELDS.includes(key);
  const error = validateField(key);
  const touched = isCheckbox ? isFilled(key) || field.classList.contains("was-validated") : isFilled(key) || field.classList.contains("was-validated");

  field.classList.toggle("is-complete", fieldIsComplete(key));
  field.classList.toggle("is-invalid", Boolean(error) && field.classList.contains("was-validated"));

  if (isCheckbox) {
    field.classList.toggle("is-complete", fieldIsComplete(key));
  }

  if (errorEl) {
    errorEl.textContent = field.classList.contains("was-validated") && error ? error : "";
  }

  if (control && !isCheckbox) {
    control.setAttribute("aria-invalid", error && field.classList.contains("was-validated") ? "true" : "false");
  }
}

function refreshAllFields() {
  Object.keys(FIELD_LABELS).forEach(applyFieldUI);
}

function renderStepper() {
  $("stepper").innerHTML = STEPS.map((step, index) => {
    const classes = ["stepper__item"];
    if (index === state.step) classes.push("is-active");
    if (index < state.step && stepIsComplete(index)) classes.push("is-complete");
    const mark = index < state.step && stepIsComplete(index) ? "✓" : String(index + 1);
    return `
      <div class="${classes.join(" ")}" data-step-index="${index}">
        <span class="stepper__index">${mark}</span>
        <span>${step.title}</span>
      </div>
    `;
  }).join("");
}

function renderSideChecklist() {
  const items = Object.keys(FIELD_LABELS)
    .map((key) => {
      const done = fieldIsComplete(key);
      return `
        <li>
          <span>${FIELD_LABELS[key]}</span>
          <span class="badge ${done ? "badge--success" : "badge--warning"}">${done ? "Complete" : "Missing"}</span>
        </li>
      `;
    })
    .join("");
  $("field-checklist").innerHTML = items;

  const missing = Object.keys(FIELD_LABELS).filter((key) => !fieldIsComplete(key));
  $("progress-count").textContent = `${Object.keys(FIELD_LABELS).length - missing.length}/${Object.keys(FIELD_LABELS).length} fields complete`;
}

function showStepAlert(missing) {
  const alert = $("step-alert");
  if (!missing.length) {
    alert.hidden = true;
    alert.innerHTML = "";
    return;
  }
  alert.hidden = false;
  alert.className = "alert alert--danger";
  alert.innerHTML = `
    <div class="alert__icon">×</div>
    <div>
      <div class="alert__title">Missing required fields</div>
      <div class="alert__body">
        Complete the items below before continuing.
        <ul class="missing-list">
          ${missing.map((key) => `<li>${FIELD_LABELS[key]}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderReview() {
  // Capture-time review shows full values so staff can verify before Confirm.
  // Stored profile views apply role-based masking via UyumSecurity.
  const rows = Object.keys(FIELD_LABELS)
    .map((key) => {
      let value = state.values[key];
      if (typeof value === "boolean") value = value ? "Accepted" : "Not accepted";
      if (key === "birthDate" && value) {
        value = new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      return `<dt>${FIELD_LABELS[key]}</dt><dd>${value || "—"}</dd>`;
    })
    .join("");
  $("review-grid").innerHTML = rows;
}

function showPanel() {
  document.querySelectorAll(".step-panel").forEach((panel) => {
    panel.hidden = panel.dataset.step !== STEPS[state.step].id;
  });

  $("step-title").textContent = STEPS[state.step].title;
  $("back-btn").hidden = state.step === 0;
  $("next-btn").hidden = STEPS[state.step].id === "confirm";
  $("confirm-btn").hidden = STEPS[state.step].id !== "confirm";

  if (STEPS[state.step].id === "confirm") {
    renderReview();
    const missing = Object.keys(FIELD_LABELS).filter((key) => !fieldIsComplete(key));
    showStepAlert(missing);
    $("confirm-btn").disabled = missing.length > 0;
  } else {
    showStepAlert([]);
  }

  renderStepper();
  renderSideChecklist();
  $("ocr-box").classList.toggle("is-scanned", state.ocrScanned);
  $("ocr-status").textContent = state.ocrScanned
    ? "OCR mock scan applied — review identity fields."
    : "Mock OCR identity scan placeholder — no camera required.";
}

function markStepFieldsValidated(stepIndex) {
  STEPS[stepIndex].fields.forEach((key) => {
    const field = document.querySelector(`[data-field="${key}"]`);
    if (field) field.classList.add("was-validated");
    applyFieldUI(key);
  });
}

function goNext() {
  readInputsIntoState();
  const missing = stepMissingFields(state.step);
  markStepFieldsValidated(state.step);
  renderSideChecklist();

  if (missing.length) {
    showStepAlert(missing);
    return;
  }

  showStepAlert([]);
  state.step = Math.min(state.step + 1, STEPS.length - 1);
  showPanel();
}

function goBack() {
  readInputsIntoState();
  state.step = Math.max(state.step - 1, 0);
  showPanel();
}

function runMockOcr() {
  state.ocrScanned = true;
  $("nationalId").value = MOCK_OCR.nationalId;
  $("fullName").value = MOCK_OCR.fullName;
  $("birthDate").value = MOCK_OCR.birthDate;
  readInputsIntoState();
  ["nationalId", "fullName", "birthDate"].forEach((key) => {
    const field = document.querySelector(`[data-field="${key}"]`);
    if (field) field.classList.add("was-validated");
    applyFieldUI(key);
  });
  showStepAlert([]);
  renderSideChecklist();
  $("ocr-box").classList.add("is-scanned");
  $("ocr-status").textContent = "OCR mock scan applied — review identity fields.";
}

function generateCustomerProfile() {
  const sec = window.UyumSecurity;
  const now = new Date();
  const id = `CUS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const actor = sec ? sec.getSessionUser() : { id: "usr-emp-01", name: "Zeynep Arslan", role: "employee" };
  const profile = {
    id,
    createdAt: now.toISOString(),
    createdLabel: now.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    kycStatus: "Cleared",
    riskLevel: "Standard",
    store: "Uyum Kuyumculuk — Kadıköy",
    ocrScanned: state.ocrScanned,
    formVersion: sec ? sec.FORM_VERSION : "kyc-consent-v1.1",
    capturedBy: actor,
    ...state.values,
  };

  const consentRecords = sec
    ? sec.recordConsentBundle(id, state.values)
    : [];
  profile.consentRecordIds = consentRecords.map((r) => r.id);

  if (sec) {
    sec.writeAudit({
      event: "customer.profile_created",
      customerId: id,
      consentType: null,
      detail: "KYC confirmed; customer profile generated with consent bundle",
    });
  }

  sessionStorage.setItem("uyum.latestCustomer", JSON.stringify(profile));

  const existing = JSON.parse(sessionStorage.getItem("uyum.customers") || "[]");
  existing.unshift(profile);
  sessionStorage.setItem("uyum.customers", JSON.stringify(existing.slice(0, 20)));
  return profile;
}

function confirmAndCreate() {
  readInputsIntoState();
  const missing = Object.keys(FIELD_LABELS).filter((key) => !fieldIsComplete(key));
  Object.keys(FIELD_LABELS).forEach((key) => {
    const field = document.querySelector(`[data-field="${key}"]`);
    if (field) field.classList.add("was-validated");
    applyFieldUI(key);
  });

  if (missing.length) {
    showStepAlert(missing);
    $("confirm-btn").disabled = true;
    return;
  }

  generateCustomerProfile();
  window.location.href = "./customer.html";
}

function bindInputs() {
  const textIds = [
    "nationalId",
    "fullName",
    "birthDate",
    "phone",
    "email",
    "address",
    "occupation",
    "transactionPurpose",
  ];
  textIds.forEach((id) => {
    $(id).addEventListener("input", () => {
      readInputsIntoState();
      applyFieldUI(id);
      renderSideChecklist();
      if (STEPS[state.step].id === "confirm") renderReview();
    });
    $(id).addEventListener("blur", () => {
      document.querySelector(`[data-field="${id}"]`).classList.add("was-validated");
      readInputsIntoState();
      applyFieldUI(id);
      renderSideChecklist();
    });
  });

  CONSENT_FIELDS.forEach((id) => {
    $(id).addEventListener("change", () => {
      document.querySelector(`[data-field="${id}"]`).classList.add("was-validated");
      readInputsIntoState();
      applyFieldUI(id);
      renderSideChecklist();
    });
  });
}

function hydrateConsentMeta() {
  const sec = window.UyumSecurity;
  if (!sec) return;
  const user = sec.getSessionUser();
  const versionEl = $("consent-form-version");
  const actorEl = $("consent-actor");
  if (versionEl) versionEl.textContent = `Form ${sec.FORM_VERSION}`;
  if (actorEl) actorEl.textContent = `Captured by ${user.name} (${user.role})`;
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

function init() {
  wireNav();
  bindInputs();
  hydrateConsentMeta();
  $("ocr-scan-btn").addEventListener("click", runMockOcr);
  $("next-btn").addEventListener("click", goNext);
  $("back-btn").addEventListener("click", goBack);
  $("confirm-btn").addEventListener("click", confirmAndCreate);
  showPanel();
  refreshAllFields();
}

init();
