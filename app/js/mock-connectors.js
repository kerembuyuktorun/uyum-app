/**
 * Mock payment connectors — no real bank/POS APIs.
 */
(function (global) {
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function ref(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
  }

  const MockPosConnector = {
    id: "mock-pos",
    label: "Mock POS terminal",
    async charge({ amount, currency = "TRY", customerName }) {
      await delay(350);
      if (!amount || amount <= 0) {
        return { ok: false, error: "Invalid POS amount", provider: "mock-pos" };
      }
      // Simulate rare decline for demo when amount ends with .13
      if (Number(amount).toFixed(2).endsWith("13")) {
        return {
          ok: false,
          error: "Mock POS declined (demo rule: amount ends with .13)",
          provider: "mock-pos",
        };
      }
      return {
        ok: true,
        provider: "mock-pos",
        reference: ref("POS"),
        authCode: String(Math.floor(100000 + Math.random() * 900000)),
        amount,
        currency,
        customerName: customerName || null,
        message: "POS authorization approved (mock)",
      };
    },
  };

  const MockBankConnector = {
    id: "mock-bank",
    label: "Mock bank transfer",
    async confirmTransfer({ amount, currency = "TRY", transferRef }) {
      await delay(280);
      if (!amount || amount <= 0) {
        return { ok: false, error: "Invalid transfer amount", provider: "mock-bank" };
      }
      return {
        ok: true,
        provider: "mock-bank",
        reference: transferRef?.trim() || ref("EFT"),
        amount,
        currency,
        message: "Bank transfer confirmed (mock)",
      };
    },
  };

  const MockCashConnector = {
    id: "mock-cash",
    label: "Mock cash drawer",
    async record({ amount, currency = "TRY" }) {
      await delay(120);
      if (!amount || amount <= 0) {
        return { ok: false, error: "Invalid cash amount", provider: "mock-cash" };
      }
      return {
        ok: true,
        provider: "mock-cash",
        reference: ref("CASH"),
        amount,
        currency,
        message: "Cash received recorded (mock)",
      };
    },
  };

  async function processMethod(method, payload) {
    if (method === "pos") return MockPosConnector.charge(payload);
    if (method === "bank_transfer") return MockBankConnector.confirmTransfer(payload);
    if (method === "cash") return MockCashConnector.record(payload);
    return { ok: false, error: `Unknown method: ${method}` };
  }

  global.UyumMockConnectors = {
    MockPosConnector,
    MockBankConnector,
    MockCashConnector,
    processMethod,
  };
})(window);
