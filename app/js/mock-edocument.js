/**
 * Mock e-Invoice / e-Archive service + integration adapter.
 * No real tax authority or private integrator APIs.
 */
(function (global) {
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function uuid() {
    return `EDOC-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
  }

  /**
   * Validation rules that mimic integrator / GİB-style rejects.
   * Returns { ok, code, message, suggestions[] }
   */
  function validatePayload(payload) {
    const suggestions = [];
    const customer = payload.customer || {};
    const lines = payload.lineItems || [];
    const totals = payload.totals || {};

    if (!customer.taxOrNationalId || String(customer.taxOrNationalId).replace(/\D/g, "").length < 10) {
      suggestions.push({
        field: "customer.taxOrNationalId",
        action: "Add a valid 10–11 digit tax/national ID on the customer record, then retry.",
      });
    }

    if (!customer.fullName || String(customer.fullName).trim().split(/\s+/).length < 2) {
      suggestions.push({
        field: "customer.fullName",
        action: "Enter the customer’s full legal name (first and last name).",
      });
    }

    if (!customer.address || String(customer.address).trim().length < 8) {
      suggestions.push({
        field: "customer.address",
        action: "Complete the billing address (street, district, city) before sending.",
      });
    }

    if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      suggestions.push({
        field: "customer.email",
        action: "Provide a valid customer email for e-document delivery notifications.",
      });
    }

    if (!lines.length) {
      suggestions.push({
        field: "lineItems",
        action: "Add at least one sale line item with description, quantity, and unit price.",
      });
    }

    lines.forEach((line, index) => {
      if (!line.description?.trim()) {
        suggestions.push({
          field: `lineItems[${index}].description`,
          action: `Line ${index + 1}: enter a product/service description.`,
        });
      }
      if (!(Number(line.quantity) > 0)) {
        suggestions.push({
          field: `lineItems[${index}].quantity`,
          action: `Line ${index + 1}: quantity must be greater than zero.`,
        });
      }
      if (!(Number(line.unitPrice) > 0)) {
        suggestions.push({
          field: `lineItems[${index}].unitPrice`,
          action: `Line ${index + 1}: unit price must be greater than zero.`,
        });
      }
    });

    if (!(Number(totals.grandTotal) > 0)) {
      suggestions.push({
        field: "totals.grandTotal",
        action: "Grand total must be greater than zero. Check line items and VAT.",
      });
    }

    if (
      payload.payment &&
      Math.abs(Number(payload.payment.amount) - Number(totals.grandTotal)) > 0.05
    ) {
      suggestions.push({
        field: "payment.amount",
        action: "Align invoice total with the linked payment amount, or adjust line items.",
      });
    }

    // Deterministic demo failure: national ID ending with 000
    const idDigits = String(customer.taxOrNationalId || "").replace(/\D/g, "");
    if (idDigits.endsWith("000")) {
      suggestions.push({
        field: "customer.taxOrNationalId",
        action: "Tax ID ends with 000 (mock reject). Correct the ID — demo rule for Failed status.",
      });
    }

    if (String(payload.notes || "").toUpperCase().includes("FORCE-FAIL")) {
      suggestions.push({
        field: "notes",
        action: "Remove the FORCE-FAIL marker from notes (mock reject trigger).",
      });
    }

    if (suggestions.length) {
      return {
        ok: false,
        code: "EDOC_VALIDATION_FAILED",
        message: "e-Document rejected by mock integrator validation.",
        suggestions,
      };
    }

    return { ok: true };
  }

  const MockEDocumentService = {
    id: "mock-edocument",
    label: "Mock e-Invoice / e-Archive service",

    async send(payload) {
      await delay(450);
      const check = validatePayload(payload);
      if (!check.ok) {
        return {
          ok: false,
          status: "Failed",
          provider: "mock-edocument",
          code: check.code,
          message: check.message,
          suggestions: check.suggestions,
          submittedAt: new Date().toISOString(),
        };
      }

      const docType = payload.documentType === "e-Archive" ? "e-Archive" : "e-Invoice";
      return {
        ok: true,
        status: "Successful",
        provider: "mock-edocument",
        code: "EDOC_ACCEPTED",
        message: `${docType} accepted by mock integrator.`,
        ettn: uuid(),
        uuid: uuid(),
        submittedAt: new Date().toISOString(),
        suggestions: [],
      };
    },

    async cancel({ ettn, reason }) {
      await delay(200);
      if (!ettn) {
        return {
          ok: false,
          status: "Failed",
          message: "Missing e-document UUID/ETTN to cancel.",
          suggestions: [
            {
              field: "ettn",
              action: "Only successfully issued documents can be cancelled. Issue first, then cancel.",
            },
          ],
        };
      }
      return {
        ok: true,
        status: "Cancelled",
        provider: "mock-edocument",
        message: `Cancellation accepted (mock): ${reason || "User cancelled"}`,
        ettn,
        cancelledAt: new Date().toISOString(),
      };
    },
  };

  /**
   * Integration adapter — app talks to this, not to tax APIs directly.
   */
  const EDocumentAdapter = {
    provider: MockEDocumentService,

    toPayload(invoice) {
      return {
        documentType: invoice.documentType,
        invoiceNumber: invoice.number,
        issueDate: invoice.issueDate,
        customer: invoice.customer,
        payment: invoice.payment,
        lineItems: invoice.lineItems,
        totals: invoice.totals,
        notes: invoice.notes,
        currency: invoice.currency || "TRY",
      };
    },

    async submit(invoice) {
      const payload = this.toPayload(invoice);
      return this.provider.send(payload);
    },

    async cancel(invoice, reason) {
      return this.provider.cancel({ ettn: invoice.ettn || invoice.uuid, reason });
    },
  };

  global.UyumEDocument = {
    MockEDocumentService,
    EDocumentAdapter,
    validatePayload,
  };
})(window);
