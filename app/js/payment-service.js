/**
 * Payment management service — storage, status, customer/transaction linking.
 */
(function (global) {
  const KEYS = {
    payments: "uyum.payments",
    transactions: "uyum.transactions",
  };

  const METHODS = {
    pos: { id: "pos", label: "POS" },
    bank_transfer: { id: "bank_transfer", label: "Bank transfer" },
    cash: { id: "cash", label: "Cash" },
    split: { id: "split", label: "Split payment" },
  };

  const PAYMENT_STATUS = {
    draft: { id: "draft", label: "Draft", tone: "neutral" },
    processing: { id: "processing", label: "Processing", tone: "info" },
    received: { id: "received", label: "Received", tone: "success" },
    failed: { id: "failed", label: "Failed", tone: "danger" },
  };

  const TXN_STATUS = {
    open: { id: "open", label: "Open", tone: "neutral" },
    payment_received: { id: "payment_received", label: "Payment Received", tone: "success" },
    invoice_pending: { id: "invoice_pending", label: "Invoice Pending", tone: "warning" },
    invoiced: { id: "invoiced", label: "Invoiced", tone: "info" },
  };

  function uid(prefix) {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function read(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "[]");
    } catch (_) {
      return [];
    }
  }

  function write(key, list) {
    sessionStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
  }

  function money(n) {
    return Number(n || 0);
  }

  function formatMoney(amount, currency = "TRY") {
    return `${currency} ${money(amount).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function getCustomersFromStorage() {
    const latest = sessionStorage.getItem("uyum.latestCustomer");
    const list = [];
    try {
      const all = JSON.parse(sessionStorage.getItem("uyum.customers") || "[]");
      list.push(...all);
    } catch (_) {
      /* ignore */
    }
    if (latest) {
      try {
        const one = JSON.parse(latest);
        if (!list.some((c) => c.id === one.id)) list.unshift(one);
      } catch (_) {
        /* ignore */
      }
    }
    // Seed demo customers if empty
    if (!list.length) {
      return [
        {
          id: "CUS-DEMO-10482",
          fullName: "Ayşe Yılmaz",
          phone: "+90 532 555 44 33",
          email: "ayse.yilmaz@example.com",
        },
        {
          id: "CUS-DEMO-10471",
          fullName: "Golden Gate Ltd.",
          phone: "+90 212 000 00 00",
          email: "finance@goldengate.example",
        },
        {
          id: "CUS-DEMO-10460",
          fullName: "Mehmet Kaya",
          phone: "+90 533 111 22 33",
          email: "mehmet.kaya@example.com",
        },
      ];
    }
    return list;
  }

  function ensureSeedData() {
    if (read(KEYS.payments).length || read(KEYS.transactions).length) return;

    const customers = getCustomersFromStorage();
    const c1 = customers[0];
    const c2 = customers[1] || customers[0];

    const txn1 = {
      id: uid("TXN"),
      customerId: c1.id,
      customerName: c1.fullName,
      amount: 248500,
      currency: "TRY",
      description: "22K bracelet sale",
      status: "invoice_pending",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      paymentIds: [],
      invoiceId: null,
    };
    const txn2 = {
      id: uid("TXN"),
      customerId: c2.id,
      customerName: c2.fullName,
      amount: 92150,
      currency: "TRY",
      description: "Gold coin set",
      status: "open",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      paymentIds: [],
      invoiceId: null,
    };

    const pay1 = {
      id: "PAY-SEED-88341",
      customerId: c1.id,
      customerName: c1.fullName,
      transactionId: txn1.id,
      amount: 248500,
      currency: "TRY",
      date: new Date(Date.now() - 3500000).toISOString(),
      method: "split",
      splits: [
        { method: "pos", amount: 150000, connectorRef: "POS-SEED-01", provider: "mock-pos" },
        { method: "cash", amount: 98500, connectorRef: "CASH-SEED-01", provider: "mock-cash" },
      ],
      description: "Counter sale — card + cash split",
      document: {
        name: "payment-proof-88341.pdf",
        type: "application/pdf",
        source: "mock-upload",
      },
      status: "received",
      connectorResults: [],
      createdAt: new Date(Date.now() - 3500000).toISOString(),
    };
    txn1.paymentIds = [pay1.id];

    write(KEYS.transactions, [txn1, txn2]);
    write(KEYS.payments, [pay1]);
  }

  function listPayments() {
    ensureSeedData();
    return read(KEYS.payments).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  function listTransactions() {
    ensureSeedData();
    return read(KEYS.transactions).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  }

  function getPayment(id) {
    return listPayments().find((p) => p.id === id) || null;
  }

  function getTransaction(id) {
    return listTransactions().find((t) => t.id === id) || null;
  }

  function savePayment(payment) {
    const all = read(KEYS.payments);
    const idx = all.findIndex((p) => p.id === payment.id);
    if (idx >= 0) all[idx] = payment;
    else all.unshift(payment);
    write(KEYS.payments, all);
    return payment;
  }

  function saveTransaction(txn) {
    const all = read(KEYS.transactions);
    const idx = all.findIndex((t) => t.id === txn.id);
    if (idx >= 0) all[idx] = txn;
    else all.unshift(txn);
    write(KEYS.transactions, all);
    return txn;
  }

  function createTransaction({ customerId, customerName, amount, currency = "TRY", description }) {
    const txn = {
      id: uid("TXN"),
      customerId,
      customerName,
      amount: money(amount),
      currency,
      description: description || "Jewelry sale",
      status: "open",
      createdAt: new Date().toISOString(),
      paymentIds: [],
      invoiceId: null,
    };
    return saveTransaction(txn);
  }

  function findOrCreateOpenTransaction({ customerId, customerName, amount, currency, description }) {
    const open = listTransactions().find(
      (t) =>
        t.customerId === customerId &&
        t.status === "open" &&
        money(t.amount) === money(amount),
    );
    if (open) return open;
    return createTransaction({ customerId, customerName, amount, currency, description });
  }

  function validatePaymentInput(input) {
    const errors = [];
    if (!input.customerId) errors.push("Customer is required.");
    if (!input.amount || money(input.amount) <= 0) errors.push("Amount must be greater than zero.");
    if (!input.date) errors.push("Payment date is required.");
    if (!input.method) errors.push("Payment method is required.");
    if (!input.description?.trim()) errors.push("Description is required.");
    if (!input.documentName?.trim()) errors.push("Payment document is required.");

    if (input.method === "split") {
      const splits = input.splits || [];
      if (splits.length < 2) errors.push("Split payments need at least two methods.");
      const total = splits.reduce((sum, s) => sum + money(s.amount), 0);
      if (Math.abs(total - money(input.amount)) > 0.001) {
        errors.push("Split amounts must equal the total payment amount.");
      }
      splits.forEach((s, i) => {
        if (!s.method || s.method === "split") errors.push(`Split #${i + 1} needs a method.`);
        if (!s.amount || money(s.amount) <= 0) errors.push(`Split #${i + 1} needs an amount.`);
      });
    }

    if (input.method === "bank_transfer" && !input.transferRef?.trim()) {
      errors.push("Bank transfer reference is required.");
    }

    return errors;
  }

  /**
   * When a payment is received, linked transaction moves to Invoice Pending.
   */
  function applyPaymentReceivedToTransaction(transactionId, paymentId) {
    const txn = getTransaction(transactionId);
    if (!txn) return null;

    if (!txn.paymentIds.includes(paymentId)) {
      txn.paymentIds = [...txn.paymentIds, paymentId];
    }

    // Business rule: received payment → Invoice Pending (ready for e-Invoice)
    if (txn.status !== "invoiced") {
      txn.status = "invoice_pending";
      txn.statusUpdatedAt = new Date().toISOString();
      txn.statusReason = "Payment received — awaiting invoice issuance";
    }

    return saveTransaction(txn);
  }

  async function receivePayment(input) {
    const errors = validatePaymentInput(input);
    if (errors.length) {
      return { ok: false, errors };
    }

    const connectors = global.UyumMockConnectors;
    if (!connectors) {
      return { ok: false, errors: ["Mock connectors unavailable."] };
    }

    const customer =
      getCustomersFromStorage().find((c) => c.id === input.customerId) || {
        id: input.customerId,
        fullName: input.customerName || "Customer",
      };

    const txn =
      (input.transactionId && getTransaction(input.transactionId)) ||
      findOrCreateOpenTransaction({
        customerId: customer.id,
        customerName: customer.fullName,
        amount: input.amount,
        currency: input.currency || "TRY",
        description: input.description,
      });

    const paymentId = uid("PAY");
    const payment = {
      id: paymentId,
      customerId: customer.id,
      customerName: customer.fullName,
      transactionId: txn.id,
      amount: money(input.amount),
      currency: input.currency || "TRY",
      date: new Date(input.date).toISOString(),
      method: input.method,
      splits: input.method === "split" ? input.splits.map((s) => ({ ...s, amount: money(s.amount) })) : [],
      description: input.description.trim(),
      document: {
        name: input.documentName.trim(),
        type: input.documentType || "application/pdf",
        source: "mock-upload",
      },
      transferRef: input.transferRef || null,
      status: "processing",
      connectorResults: [],
      createdAt: new Date().toISOString(),
    };
    savePayment(payment);

    const legs =
      input.method === "split"
        ? input.splits.map((s) => ({
            method: s.method,
            amount: money(s.amount),
            transferRef: s.transferRef || input.transferRef,
          }))
        : [
            {
              method: input.method,
              amount: money(input.amount),
              transferRef: input.transferRef,
            },
          ];

    const results = [];
    for (const leg of legs) {
      const result = await connectors.processMethod(leg.method, {
        amount: leg.amount,
        currency: payment.currency,
        customerName: customer.fullName,
        transferRef: leg.transferRef,
      });
      results.push({ ...result, method: leg.method, amount: leg.amount });
      if (!result.ok) {
        payment.status = "failed";
        payment.connectorResults = results;
        payment.failureReason = result.error || "Connector failed";
        savePayment(payment);
        return { ok: false, errors: [payment.failureReason], payment, transaction: txn };
      }
    }

    payment.status = "received";
    payment.connectorResults = results;
    payment.splits = payment.splits.map((split, i) => ({
      ...split,
      connectorRef: results[i]?.reference || null,
      provider: results[i]?.provider || null,
    }));
    if (payment.method !== "split" && results[0]) {
      payment.connectorRef = results[0].reference;
      payment.provider = results[0].provider;
    }
    savePayment(payment);

    const updatedTxn = applyPaymentReceivedToTransaction(txn.id, payment.id);

    if (global.UyumSecurity?.writeAudit) {
      global.UyumSecurity.writeAudit({
        event: "payment.received",
        customerId: customer.id,
        consentType: null,
        detail: `${payment.id} received · txn ${updatedTxn.id} → Invoice Pending`,
      });
    }

    return { ok: true, payment, transaction: updatedTxn };
  }

  function paymentsAwaitingInvoice() {
    return listTransactions().filter((t) => t.status === "invoice_pending");
  }

  function methodLabel(method) {
    return METHODS[method]?.label || method;
  }

  function statusMeta(status, map) {
    return map[status] || { id: status, label: status, tone: "neutral" };
  }

  global.UyumPayments = {
    METHODS,
    PAYMENT_STATUS,
    TXN_STATUS,
    formatMoney,
    getCustomersFromStorage,
    listPayments,
    listTransactions,
    getPayment,
    getTransaction,
    createTransaction,
    receivePayment,
    validatePaymentInput,
    applyPaymentReceivedToTransaction,
    paymentsAwaitingInvoice,
    methodLabel,
    paymentStatusMeta: (s) => statusMeta(s, PAYMENT_STATUS),
    txnStatusMeta: (s) => statusMeta(s, TXN_STATUS),
    ensureSeedData,
  };
})(window);
