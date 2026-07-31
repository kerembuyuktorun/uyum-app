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

function formatBirthDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderProfile(profile) {
  $("profile-name").textContent = profile.fullName;
  $("profile-id").textContent = profile.id;
  $("profile-created").textContent = `Created ${profile.createdLabel}`;
  $("profile-store").textContent = profile.store;
  $("kyc-badge").textContent = profile.kycStatus;
  $("risk-badge").textContent = profile.riskLevel;
  $("ocr-badge").textContent = profile.ocrScanned ? "OCR scanned" : "Manual entry";
  $("ocr-badge").className = `badge ${profile.ocrScanned ? "badge--success" : "badge--neutral"}`;

  const rows = [
    ["National ID number", profile.nationalId],
    ["Full name", profile.fullName],
    ["Birth date", formatBirthDate(profile.birthDate)],
    ["Phone", profile.phone],
    ["Email", profile.email],
    ["Address", profile.address],
    ["Occupation", profile.occupation],
    ["Transaction purpose", profile.transactionPurpose],
    ["Privacy consent", profile.privacyConsent ? "Accepted" : "Not accepted"],
    ["Customer declaration", profile.customerDeclaration ? "Accepted" : "Not accepted"],
  ];

  $("profile-grid").innerHTML = rows
    .map(([label, value]) => `<dt>${label}</dt><dd>${value || "—"}</dd>`)
    .join("");
}

function renderEmpty() {
  $("profile-view").hidden = true;
  $("empty-view").hidden = false;
}

function init() {
  wireNav();
  const raw = sessionStorage.getItem("uyum.latestCustomer");
  if (!raw) {
    renderEmpty();
    return;
  }
  try {
    const profile = JSON.parse(raw);
    renderProfile(profile);
    $("profile-view").hidden = false;
    $("empty-view").hidden = true;
  } catch (err) {
    console.error(err);
    renderEmpty();
  }
}

init();
