/**
 * Uyum privacy consent + security layer
 * Masking, permission records, audit log, role-based PII access.
 */
(function (global) {
  const FORM_VERSION = "kyc-consent-v1.1";
  const STORE_ID = "store-kadikoy-01";

  const STORAGE = {
    sessionUser: "uyum.sessionUser",
    consents: "uyum.consentRecords",
    audit: "uyum.auditLog",
  };

  const ROLES = {
    owner: {
      id: "owner",
      label: "Store owner",
      piiAccess: "full",
      canViewConsentAudit: true,
    },
    accountant: {
      id: "accountant",
      label: "Accountant",
      piiAccess: "full",
      canViewConsentAudit: true,
    },
    employee: {
      id: "employee",
      label: "Store employee",
      piiAccess: "masked",
      canViewConsentAudit: true,
    },
    unauthorized: {
      id: "unauthorized",
      label: "Unauthorized viewer",
      piiAccess: "hidden",
      canViewConsentAudit: false,
    },
  };

  const DEFAULT_USERS = {
    owner: { id: "usr-owner-01", name: "Kerem Büyük", role: "owner" },
    accountant: { id: "usr-acct-01", name: "Selin Aksoy", role: "accountant" },
    employee: { id: "usr-emp-01", name: "Zeynep Arslan", role: "employee" },
    unauthorized: { id: "usr-guest-01", name: "Guest Viewer", role: "unauthorized" },
  };

  const CONSENT_TYPES = [
    {
      id: "privacy_notice_ack",
      field: "privacyNoticeAck",
      label: "Privacy notice acknowledged",
    },
    {
      id: "explicit_consent",
      field: "explicitConsent",
      label: "Explicit processing consent",
    },
    {
      id: "data_retention",
      field: "dataRetentionPermission",
      label: "Data retention permission",
    },
    {
      id: "customer_declaration",
      field: "customerDeclaration",
      label: "Customer declaration",
    },
  ];

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function getRoleConfig(role) {
    return ROLES[role] || ROLES.unauthorized;
  }

  function getSessionUser() {
    try {
      const raw = sessionStorage.getItem(STORAGE.sessionUser);
      if (raw) return JSON.parse(raw);
    } catch (_) {
      /* ignore */
    }
    const user = { ...DEFAULT_USERS.employee };
    sessionStorage.setItem(STORAGE.sessionUser, JSON.stringify(user));
    return user;
  }

  function setSessionRole(role) {
    const user = { ...(DEFAULT_USERS[role] || DEFAULT_USERS.unauthorized) };
    sessionStorage.setItem(STORAGE.sessionUser, JSON.stringify(user));
    writeAudit({
      event: "session.role_switched",
      customerId: null,
      consentType: null,
      detail: `Active viewer role set to ${user.role}`,
    });
    return user;
  }

  function mockIpAddress() {
    // Deterministic demo IP for the browser session (not a real client IP).
    let seed = sessionStorage.getItem("uyum.mockIp");
    if (!seed) {
      seed = `203.0.113.${Math.floor(20 + Math.random() * 200)}`;
      sessionStorage.setItem("uyum.mockIp", seed);
    }
    return seed;
  }

  function captureDeviceContext() {
    const nav = global.navigator || {};
    const screenObj = global.screen || {};
    return {
      userAgent: nav.userAgent || "unknown",
      platform: nav.platform || "unknown",
      language: nav.language || "unknown",
      screen: `${screenObj.width || "?"}x${screenObj.height || "?"}`,
    };
  }

  function deviceSummary(device) {
    const ua = device.userAgent || "";
    let browser = "Browser";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    return `${browser} · ${device.platform} · ${device.screen}`;
  }

  function maskNationalId(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length < 5) return "•••••••••••";
    return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  }

  function maskPhone(value) {
    const raw = String(value || "").trim();
    if (!raw) return "••••••••";
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 4) return "••••••••";
    return `••• ••• ${digits.slice(-4)}`;
  }

  function maskEmail(value) {
    const raw = String(value || "").trim();
    const at = raw.indexOf("@");
    if (at < 1) return "•••@•••";
    const name = raw.slice(0, at);
    const domain = raw.slice(at + 1);
    const visible = name.slice(0, 1);
    return `${visible}${"•".repeat(Math.max(2, name.length - 1))}@${domain}`;
  }

  function maskAddress(value) {
    const raw = String(value || "").trim();
    if (!raw) return "••••";
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `••••, ${parts[parts.length - 1]}`;
    return "•••• (address hidden)";
  }

  function maskName(value) {
    const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "•••";
    return parts.map((p) => `${p.slice(0, 1)}.`).join(" ");
  }

  function canViewFullPii(user = getSessionUser()) {
    return getRoleConfig(user.role).piiAccess === "full";
  }

  function canViewConsentAudit(user = getSessionUser()) {
    return Boolean(getRoleConfig(user.role).canViewConsentAudit);
  }

  function displaySensitive(field, value, user = getSessionUser()) {
    const access = getRoleConfig(user.role).piiAccess;
    if (access === "full") return value || "—";
    if (access === "hidden") {
      if (field === "fullName") return maskName(value);
      if (field === "nationalId") return "•••••••••••";
      if (field === "phone") return "••••••••";
      if (field === "email") return "•••@•••";
      if (field === "address") return "••••";
      if (field === "birthDate") return "••••-••-••";
      return "••••";
    }
    // masked
    if (field === "nationalId") return maskNationalId(value);
    if (field === "phone") return maskPhone(value);
    if (field === "email") return maskEmail(value);
    if (field === "address") return maskAddress(value);
    return value || "—";
  }

  function readList(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "[]");
    } catch (_) {
      return [];
    }
  }

  function writeList(key, list) {
    sessionStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
  }

  function writeAudit({ event, customerId, consentType, detail }) {
    const user = getSessionUser();
    const device = captureDeviceContext();
    const entry = {
      id: uid("aud"),
      event,
      timestamp: new Date().toISOString(),
      actorUserId: user.id,
      actorName: user.name,
      actorRole: user.role,
      customerId: customerId || null,
      consentType: consentType || null,
      ipAddress: mockIpAddress(),
      deviceSummary: deviceSummary(device),
      formVersion: FORM_VERSION,
      detail: detail || "",
    };
    const log = readList(STORAGE.audit);
    log.unshift(entry);
    writeList(STORAGE.audit, log);
    return entry;
  }

  function createConsentRecord({ customerId, consentType, accepted }) {
    const user = getSessionUser();
    const device = captureDeviceContext();
    const record = {
      id: uid("cns"),
      customerId,
      consentType,
      accepted: Boolean(accepted),
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      ipAddress: mockIpAddress(),
      device,
      formVersion: FORM_VERSION,
      storeId: STORE_ID,
    };
    const all = readList(STORAGE.consents);
    all.unshift(record);
    writeList(STORAGE.consents, all);
    writeAudit({
      event: accepted ? "consent.accepted" : "consent.rejected",
      customerId,
      consentType,
      detail: `${consentType} recorded as ${accepted ? "accepted" : "rejected"}`,
    });
    return record;
  }

  function recordConsentBundle(customerId, values) {
    return CONSENT_TYPES.map((type) =>
      createConsentRecord({
        customerId,
        consentType: type.id,
        accepted: Boolean(values[type.field]),
      }),
    );
  }

  function getConsentsForCustomer(customerId) {
    return readList(STORAGE.consents).filter((r) => r.customerId === customerId);
  }

  function getAuditLog(limit = 50) {
    return readList(STORAGE.audit).slice(0, limit);
  }

  function redactProfileForViewer(profile, user = getSessionUser()) {
    if (!profile) return null;
    const access = getRoleConfig(user.role).piiAccess;
    return {
      ...profile,
      viewAccess: access,
      nationalIdDisplay: displaySensitive("nationalId", profile.nationalId, user),
      phoneDisplay: displaySensitive("phone", profile.phone, user),
      emailDisplay: displaySensitive("email", profile.email, user),
      addressDisplay: displaySensitive("address", profile.address, user),
      fullNameDisplay: displaySensitive("fullName", profile.fullName, user),
      birthDateDisplay:
        access === "hidden"
          ? "••••-••-••"
          : profile.birthDate
            ? new Date(profile.birthDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
      sensitiveMasked: access !== "full",
    };
  }

  global.UyumSecurity = {
    FORM_VERSION,
    STORE_ID,
    ROLES,
    CONSENT_TYPES,
    getSessionUser,
    setSessionRole,
    getRoleConfig,
    canViewFullPii,
    canViewConsentAudit,
    captureDeviceContext,
    mockIpAddress,
    maskNationalId,
    maskPhone,
    maskEmail,
    maskAddress,
    displaySensitive,
    createConsentRecord,
    recordConsentBundle,
    getConsentsForCustomer,
    getAuditLog,
    writeAudit,
    redactProfileForViewer,
  };
})(window);
