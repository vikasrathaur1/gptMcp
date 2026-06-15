import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const VERSION = "2.0.0";

// ─── MCP Apps UI MIME type ────────────────────────────────────────────────────
// Required by ChatGPT to recognise the resource as a renderable widget.
const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";

// ─── Widget URIs ──────────────────────────────────────────────────────────────
const UI = {
  DASHBOARD:   "ui://widget/loan-dashboard.html",
  EMI:         "ui://widget/emi-card.html",
  DISCOVERY:   "ui://widget/loan-discovery.html",
  SERVICE_REQ: "ui://widget/service-request.html",
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const customers = {
  "9999999999": {
    customer_Name: "Vikas Singh Rathaur",
    prodDesc: "PERSONAL LOAN",
    roi: 11.25,
    agreementNo: "X402P34T9588444",
    disbDate: "27/03/2025",
    partnerName: null,
    flexiFlag: "Y",
    totalOverDue: 0,
    pos: 4203,
    prodCategory: "PERSONAL LOAN",
    relStatus: "Active",
    prodId: "PSPFL",
    missedEmi: 0,
    netTenure: 96,
    isMilesFlag: "N",
    crmDealId: "B2C000117643003",
    primaryCustomerId: null,
    relAmount: 3739000,
    opportunityId: null,
    nextEMIAmount: 132,
    amcCharges: "0",
    amountDrawnLimit: 3734797,
    sourceSysId: "2",
    applId: "1015709507",
    listofAgreementNos: null,
    closureDate: null,
    grossTenure: 96,
    balanceTenure: 83,
    nextEmiDate: "2026-08-02T00:00:00.0000000Z",
    loanExpiryDate: "02/04/2033",
  },
};

const loanProducts = {
  personal_loan: {
    name: "Personal Loan",
    interest_rate: "11% - 31% p.a.",
    max_amount: "₹40 Lakh",
    tenure: "12 - 84 months",
    processing_fee: "Up to 3.93% + GST",
    eligibility: "Salaried / Self-Employed, Age 21-80, Min income ₹25,000/month",
    key_features: ["No collateral needed", "Quick disbursal in 24 hrs", "Flexible EMI options", "Top-up facility available"],
    apply_now: "https://www.bajajfinserv.in/personal-loan",
  },
  insta_personal_loan: {
    name: "Insta Personal Loan",
    interest_rate: "10% - 28% p.a.",
    max_amount: "₹10 Lakh",
    tenure: "3 - 60 months",
    processing_fee: "Up to 2% + GST",
    eligibility: "Pre-approved customers only, existing Bajaj customers",
    key_features: ["Instant approval", "Disbursal in minutes", "No documentation required", "Available via app"],
    apply_now: "https://www.bajajfinserv.in/insta-personal-loan",
  },
  home_loan: {
    name: "Home Loan",
    interest_rate: "8.50% - 15% p.a.",
    max_amount: "₹5 Crore",
    tenure: "Up to 30 years (360 months)",
    processing_fee: "Up to 0.50% + GST",
    eligibility: "Salaried / Self-Employed, Age 23-70, Property as collateral",
    key_features: ["Low interest rates", "Long repayment tenure", "Tax benefits u/s 80C & 24(b)", "Part-prepayment allowed"],
    apply_now: "https://www.bajajfinserv.in/home-loan",
  },
  home_loan_balance_transfer: {
    name: "Home Loan Balance Transfer",
    interest_rate: "8.50% - 14% p.a.",
    max_amount: "₹5 Crore",
    tenure: "Up to 30 years",
    processing_fee: "Up to 0.50% + GST",
    eligibility: "Existing home loan holders with other banks/NBFCs",
    key_features: ["Lower EMI", "Top-up loan available", "Minimal documentation", "Online process"],
    apply_now: "https://www.bajajfinserv.in/home-loan-balance-transfer",
  },
  loan_against_property: {
    name: "Loan Against Property",
    interest_rate: "9% - 18% p.a.",
    max_amount: "₹5 Crore",
    tenure: "Up to 15 years (180 months)",
    processing_fee: "Up to 1% + GST",
    eligibility: "Property owner, Salaried / Self-Employed, Age 25-70",
    key_features: ["High loan amount", "Residential / commercial property accepted", "Flexible end use", "Part-prepayment allowed"],
    apply_now: "https://www.bajajfinserv.in/loan-against-property",
  },
  business_loan: {
    name: "Business Loan",
    interest_rate: "14% - 30% p.a.",
    max_amount: "₹80 Lakh",
    tenure: "12 - 96 months",
    processing_fee: "Up to 3.54% + GST",
    eligibility: "Business vintage min 3 years, Turnover ₹20 Lakh+, Age 24-70",
    key_features: ["No collateral", "Quick disbursal", "Dropline overdraft option", "Business expansion / working capital"],
    apply_now: "https://www.bajajfinserv.in/business-loan",
  },
  loan_for_doctors: {
    name: "Loan for Doctors",
    interest_rate: "11% - 22% p.a.",
    max_amount: "₹2 Crore",
    tenure: "12 - 84 months",
    processing_fee: "Up to 2.95% + GST",
    eligibility: "MBBS / BDS / MD / MS qualified practicing doctors",
    key_features: ["Clinic setup / equipment purchase", "No collateral up to ₹50 Lakh", "Doorstep service", "Quick approval"],
    apply_now: "https://www.bajajfinserv.in/doctor-loan",
  },
  loan_for_ca: {
    name: "Loan for CA",
    interest_rate: "11% - 22% p.a.",
    max_amount: "₹50 Lakh",
    tenure: "12 - 84 months",
    processing_fee: "Up to 2.95% + GST",
    eligibility: "Practicing CA with valid ICAI certificate, min 2 years practice",
    key_features: ["Office expansion", "Working capital needs", "No collateral", "Online process"],
    apply_now: "https://www.bajajfinserv.in/ca-loan",
  },
  gold_loan: {
    name: "Gold Loan",
    interest_rate: "9.50% - 28% p.a.",
    max_amount: "₹2 Crore",
    tenure: "1 - 12 months",
    processing_fee: "Up to 1% + GST",
    eligibility: "Gold ornaments / jewellery as collateral, Age 18+",
    key_features: ["Instant disbursal", "Gold safely stored in vault", "Interest-only EMI option", "Auction-free 7-day notice"],
    apply_now: "https://www.bajajfinserv.in/gold-loan",
  },
  loan_against_fd: {
    name: "Loan Against FD",
    interest_rate: "FD rate + 1-2% p.a.",
    max_amount: "Up to 90% of FD value",
    tenure: "Up to FD tenure",
    processing_fee: "Nil",
    eligibility: "Existing Bajaj Finance FD holder",
    key_features: ["No credit check required", "FD continues to earn interest", "Overdraft facility", "Instant processing"],
    apply_now: "https://www.bajajfinserv.in/loan-against-fd",
  },
  loan_against_shares: {
    name: "Loan Against Shares / Securities",
    interest_rate: "10.5% - 18% p.a.",
    max_amount: "₹10 Crore",
    tenure: "12 months (renewable)",
    processing_fee: "Up to 0.5% + GST",
    eligibility: "Demat account holder with approved securities",
    key_features: ["Overdraft limit against portfolio", "Shares continue to grow", "Pay interest only on utilized amount", "Online management"],
    apply_now: "https://www.bajajfinserv.in/loan-against-securities",
  },
  two_wheeler_loan: {
    name: "Two Wheeler Loan",
    interest_rate: "9.99% - 29% p.a.",
    max_amount: "100% of bike on-road price",
    tenure: "12 - 48 months",
    processing_fee: "Up to 2% + GST",
    eligibility: "Age 18-65, Salaried / Self-Employed, Min income ₹12,000/month",
    key_features: ["0% down payment offers", "Quick approval at dealership", "Covers new and used bikes", "Doorstep delivery"],
    apply_now: "https://www.bajajfinserv.in/two-wheeler-loan",
  },
  used_car_loan: {
    name: "Used Car Loan",
    interest_rate: "12% - 26% p.a.",
    max_amount: "₹50 Lakh",
    tenure: "12 - 60 months",
    processing_fee: "Up to 3.93% + GST",
    eligibility: "Car age max 10 years, Salaried / Self-Employed, Age 21-65",
    key_features: ["Up to 100% of car value financed", "Quick loan disbursal", "Doorstep inspection", "Flexible EMIs"],
    apply_now: "https://www.bajajfinserv.in/used-car-loan",
  },
};

const serviceRequests = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function success(data, structuredContent) {
  const result = {
    content: [{ type: "text", text: JSON.stringify({ success: true, data }, null, 2) }],
  };
  if (structuredContent !== undefined) result.structuredContent = structuredContent;
  return result;
}

function failure(msg) {
  return {
    content: [{ type: "text", text: JSON.stringify({ success: false, error: msg }, null, 2) }],
    isError: true,
  };
}

function getDemoCustomer() {
  return customers["9999999999"];
}

// ─── Inline HTML Widgets ──────────────────────────────────────────────────────
// Each widget:
//   1. Initialises the MCP Apps bridge (ui/initialize → ui/notifications/initialized)
//   2. Listens for ui/notifications/tool-result and re-renders from structuredContent
//   3. Can call back to tools via tools/call (service-request widget does this)

const WIDGET_LOAN_DASHBOARD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Loan Dashboard</title>
<style>
  :root { font-family: "Inter", system-ui, sans-serif; color: #0b0b0f; }
  body { margin: 0; padding: 16px; background: #f6f8fb; }
  .card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,.07); max-width: 420px; margin: 0 auto; }
  h2 { margin: 0 0 4px; font-size: 1.1rem; color: #1a1a2e; }
  .sub { color: #6c768a; font-size: .85rem; margin: 0 0 20px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: .78rem; font-weight: 600; background: #e6faf0; color: #1a7f50; margin-bottom: 16px; }
  .badge.closed { background: #fce; color: #a00; }
  table { width: 100%; border-collapse: collapse; }
  tr { border-bottom: 1px solid #f0f2f8; }
  tr:last-child { border-bottom: none; }
  td { padding: 9px 4px; font-size: .9rem; }
  td:first-child { color: #6c768a; width: 55%; }
  td:last-child { font-weight: 600; text-align: right; }
  .flexi-bar { margin-top: 16px; background: #f0f4ff; border-radius: 10px; padding: 12px 14px; }
  .flexi-bar p { margin: 0; font-size: .85rem; }
  .flexi-bar .label { color: #6c768a; font-size: .8rem; margin-bottom: 4px; }
  .progress { background: #dde3f5; border-radius: 6px; height: 8px; margin-top: 6px; }
  .progress-fill { background: #3b5bdb; border-radius: 6px; height: 8px; }
</style>
</head>
<body>
<div class="card" id="card">
  <p style="color:#6c768a;font-size:.9rem">Loading loan details…</p>
</div>
<script type="module">
  let rpcId = 0;
  const pending = new Map();

  const notify  = (method, params) => window.parent.postMessage({ jsonrpc:"2.0", method, params }, "*");
  const request = (method, params) => new Promise((res, rej) => {
    const id = ++rpcId;
    pending.set(id, { resolve: res, reject: rej });
    window.parent.postMessage({ jsonrpc:"2.0", id, method, params }, "*");
  });

  window.addEventListener("message", e => {
    if (e.source !== window.parent) return;
    const m = e.data;
    if (!m || m.jsonrpc !== "2.0") return;
    if (typeof m.id === "number") {
      const p = pending.get(m.id);
      if (!p) return;
      pending.delete(m.id);
      m.error ? p.reject(m.error) : p.resolve(m.result);
    }
    if (m.method === "ui/notifications/tool-result") render(m.params?.structuredContent);
  }, { passive: true });

  async function init() {
    await request("ui/initialize", { appInfo:{ name:"loan-dashboard", version:"1.0" }, appCapabilities:{}, protocolVersion:"2026-01-26" });
    notify("ui/notifications/initialized", {});
  }

  function render(d) {
    if (!d) return;
    const card = document.getElementById("card");
    const flexiHtml = d.flexiEnabled ? \`
      <div class="flexi-bar">
        <p class="label">Flexi Limit Available</p>
        <p><strong>\${d.flexiLimitFormatted || ""}</strong></p>
        <div class="progress"><div class="progress-fill" style="width:72%"></div></div>
      </div>\` : "";
    card.innerHTML = \`
      <h2>\${d.customerName || "Customer"}</h2>
      <p class="sub">\${d.agreementNo || ""} &nbsp;·&nbsp; \${d.productType || ""}</p>
      <span class="badge \${d.loanStatus === "Active" ? "" : "closed"}">\${d.loanStatus || ""}</span>
      <table>
        <tr><td>Loan Amount</td><td>\${d.loanAmountFormatted || d.loanAmount || "—"}</td></tr>
        <tr><td>Outstanding (POS)</td><td>\${d.outstandingAmountFormatted || "—"}</td></tr>
        <tr><td>Interest Rate</td><td>\${d.roi || "—"}</td></tr>
        <tr><td>Tenure</td><td>\${d.grossTenure || "—"} months (\${d.balanceTenure || "—"} remaining)</td></tr>
        <tr><td>Next EMI</td><td>\${d.nextEmiAmountFormatted || "—"}</td></tr>
        <tr><td>Next EMI Date</td><td>\${d.nextEmiDate ? new Date(d.nextEmiDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}</td></tr>
        <tr><td>Disbursement Date</td><td>\${d.disbursementDate || "—"}</td></tr>
        <tr><td>Loan Expiry</td><td>\${d.loanExpiryDate || "—"}</td></tr>
        <tr><td>Overdue</td><td style="color:\${d.totalOverDue>0?"#c00":"#1a7f50"}">\${d.totalOverDue !== undefined ? (d.totalOverDue > 0 ? "₹"+d.totalOverDue : "Nil") : "—"}</td></tr>
      </table>
      \${flexiHtml}
    \`;
  }

  init().catch(console.error);
</script>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────

const WIDGET_EMI_CARD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>EMI & Balance</title>
<style>
  :root { font-family: "Inter", system-ui, sans-serif; color: #0b0b0f; }
  body { margin: 0; padding: 16px; background: #f6f8fb; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 420px; margin: 0 auto; }
  .tile { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,.06); }
  .tile .label { font-size: .78rem; color: #6c768a; margin: 0 0 6px; }
  .tile .value { font-size: 1.25rem; font-weight: 700; margin: 0; }
  .tile .sub { font-size: .8rem; color: #6c768a; margin: 4px 0 0; }
  .tile.wide { grid-column: span 2; }
  .tile.alert .value { color: #c00; }
  .tile.ok .value { color: #1a7f50; }
  .emi-date { font-size: .85rem; color: #3b5bdb; font-weight: 600; margin: 4px 0 0; }
</style>
</head>
<body>
<div class="grid" id="grid">
  <div class="tile wide"><p class="label">Loading…</p></div>
</div>
<script type="module">
  let rpcId = 0;
  const pending = new Map();
  const notify  = (m, p) => window.parent.postMessage({ jsonrpc:"2.0", method:m, params:p }, "*");
  const request = (m, p) => new Promise((res, rej) => {
    const id = ++rpcId;
    pending.set(id, { resolve:res, reject:rej });
    window.parent.postMessage({ jsonrpc:"2.0", id, method:m, params:p }, "*");
  });

  window.addEventListener("message", e => {
    if (e.source !== window.parent) return;
    const msg = e.data;
    if (!msg || msg.jsonrpc !== "2.0") return;
    if (typeof msg.id === "number") {
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      msg.error ? p.reject(msg.error) : p.resolve(msg.result);
    }
    if (msg.method === "ui/notifications/tool-result") render(msg.params?.structuredContent);
  }, { passive: true });

  async function init() {
    await request("ui/initialize", { appInfo:{ name:"emi-card", version:"1.0" }, appCapabilities:{}, protocolVersion:"2026-01-26" });
    notify("ui/notifications/initialized", {});
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"numeric" });
  }

  function render(d) {
    if (!d) return;
    const g = document.getElementById("grid");
    const overdueClass = d.totalOverDue > 0 ? "alert" : "ok";
    g.innerHTML = \`
      <div class="tile">
        <p class="label">Next EMI Amount</p>
        <p class="value">\${d.nextEmiAmountFormatted || d.nextEmiAmount || "—"}</p>
        <p class="emi-date">\${fmtDate(d.nextEmiDate)}</p>
      </div>
      <div class="tile">
        <p class="label">Missed EMIs</p>
        <p class="value \${d.missedEmi > 0 ? "alert" : "ok"}">\${d.missedEmi !== undefined ? d.missedEmi : "—"}</p>
        <p class="sub">\${d.missedEmi > 0 ? "Action required" : "All clear"}</p>
      </div>
      <div class="tile">
        <p class="label">Balance Tenure</p>
        <p class="value">\${d.balanceTenure !== undefined ? d.balanceTenure : "—"}</p>
        <p class="sub">months remaining</p>
      </div>
      <div class="tile">
        <p class="label">Principal Outstanding</p>
        <p class="value">\${d.posFormatted || d.pos || "—"}</p>
        <p class="sub">current POS</p>
      </div>
      <div class="tile wide \${overdueClass}">
        <p class="label">Total Overdue</p>
        <p class="value">\${d.totalOverDue !== undefined ? (d.totalOverDue > 0 ? (d.totalOverDueFormatted || "₹"+d.totalOverDue) : "₹0 — No dues") : "—"}</p>
      </div>
    \`;
  }

  init().catch(console.error);
</script>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────

const WIDGET_LOAN_DISCOVERY = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Loan Products</title>
<style>
  :root { font-family: "Inter", system-ui, sans-serif; color: #0b0b0f; }
  body { margin: 0; padding: 16px; background: #f6f8fb; }
  h2 { font-size: 1rem; margin: 0 0 14px; color: #1a1a2e; }
  .list { display: flex; flex-direction: column; gap: 12px; max-width: 440px; margin: 0 auto; }
  .card { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,.06); }
  .card h3 { margin: 0 0 4px; font-size: .95rem; }
  .card .reason { font-size: .82rem; color: #6c768a; margin: 0 0 10px; }
  .meta { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip { background: #f0f4ff; color: #3b5bdb; border-radius: 20px; padding: 3px 10px; font-size: .78rem; font-weight: 600; }
  .apply-btn { display: inline-block; margin-top: 12px; padding: 8px 16px; background: #3b5bdb; color: #fff; border-radius: 10px; font-size: .85rem; font-weight: 600; text-decoration: none; cursor: pointer; border: none; }
  .tip { font-size: .8rem; color: #6c768a; margin: 16px auto 0; text-align: center; max-width: 440px; }
  .product-detail { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,.07); max-width: 440px; margin: 0 auto; }
  .product-detail h2 { margin: 0 0 12px; }
  .product-detail table { width: 100%; border-collapse: collapse; }
  .product-detail tr { border-bottom: 1px solid #f0f2f8; }
  .product-detail tr:last-child { border-bottom: none; }
  .product-detail td { padding: 8px 4px; font-size: .88rem; }
  .product-detail td:first-child { color: #6c768a; width: 45%; }
  .product-detail td:last-child { font-weight: 600; text-align: right; }
  .features { margin: 12px 0 0; padding: 0; list-style: none; }
  .features li::before { content: "✓ "; color: #1a7f50; font-weight: 700; }
  .features li { font-size: .85rem; margin: 4px 0; }
</style>
</head>
<body>
<div id="root"><p style="color:#6c768a;padding:16px">Loading products…</p></div>
<script type="module">
  let rpcId = 0;
  const pending = new Map();
  const notify  = (m, p) => window.parent.postMessage({ jsonrpc:"2.0", method:m, params:p }, "*");
  const request = (m, p) => new Promise((res, rej) => {
    const id = ++rpcId;
    pending.set(id, { resolve:res, reject:rej });
    window.parent.postMessage({ jsonrpc:"2.0", id, method:m, params:p }, "*");
  });

  window.addEventListener("message", e => {
    if (e.source !== window.parent) return;
    const msg = e.data;
    if (!msg || msg.jsonrpc !== "2.0") return;
    if (typeof msg.id === "number") {
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      msg.error ? p.reject(msg.error) : p.resolve(msg.result);
    }
    if (msg.method === "ui/notifications/tool-result") render(msg.params?.structuredContent);
  }, { passive: true });

  async function init() {
    await request("ui/initialize", { appInfo:{ name:"loan-discovery", version:"1.0" }, appCapabilities:{}, protocolVersion:"2026-01-26" });
    notify("ui/notifications/initialized", {});
  }

  function render(d) {
    if (!d) return;
    const root = document.getElementById("root");

    // Single product detail view
    if (d.name && d.interest_rate) {
      root.innerHTML = \`
        <div class="product-detail">
          <h2>\${d.name}</h2>
          <table>
            <tr><td>Interest Rate</td><td>\${d.interest_rate}</td></tr>
            <tr><td>Max Amount</td><td>\${d.max_amount}</td></tr>
            <tr><td>Tenure</td><td>\${d.tenure}</td></tr>
            <tr><td>Processing Fee</td><td>\${d.processing_fee}</td></tr>
            <tr><td>Eligibility</td><td style="font-weight:400;font-size:.82rem">\${d.eligibility}</td></tr>
          </table>
          <ul class="features">
            \${(d.key_features||[]).map(f=>\`<li>\${f}</li>\`).join("")}
          </ul>
          <a class="apply-btn" href="\${d.apply_now}" target="_blank" rel="noopener">Apply Now →</a>
        </div>
      \`;
      return;
    }

    // Discovery list view
    if (d.recommendations && d.recommendations.length) {
      root.innerHTML = \`
        <div class="list">
          <h2>Recommended for you (\${d.totalRecommendations})</h2>
          \${d.recommendations.map(r => \`
            <div class="card">
              <h3>\${r.productName}</h3>
              <p class="reason">\${r.reason}</p>
              <div class="meta">
                <span class="chip">\${r.interestRate}</span>
                <span class="chip">Up to \${r.maxAmount}</span>
              </div>
            </div>
          \`).join("")}
          <p class="tip">Ask me about any of these products for full details and apply link.</p>
        </div>
      \`;
      return;
    }

    root.innerHTML = \`<p style="padding:16px;color:#6c768a">No products found. Try describing what you need.</p>\`;
  }

  init().catch(console.error);
</script>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────

const WIDGET_SERVICE_REQUEST = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Service Request</title>
<style>
  :root { font-family: "Inter", system-ui, sans-serif; color: #0b0b0f; }
  body { margin: 0; padding: 16px; background: #f6f8fb; }
  .card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,.07); max-width: 400px; margin: 0 auto; }
  .icon { font-size: 2rem; margin-bottom: 8px; }
  h2 { margin: 0 0 4px; font-size: 1.05rem; }
  .sub { color: #6c768a; font-size: .85rem; margin: 0 0 18px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: .8rem; font-weight: 600; background: #fff8e1; color: #b45309; margin-bottom: 16px; }
  .badge.resolved { background: #e6faf0; color: #1a7f50; }
  table { width: 100%; border-collapse: collapse; }
  tr { border-bottom: 1px solid #f0f2f8; }
  tr:last-child { border-bottom: none; }
  td { padding: 8px 4px; font-size: .88rem; }
  td:first-child { color: #6c768a; width: 50%; }
  td:last-child { font-weight: 600; text-align: right; }
  .tip { font-size: .8rem; color: #6c768a; margin-top: 16px; background: #f6f8fb; border-radius: 8px; padding: 10px 12px; }
</style>
</head>
<body>
<div id="root"><p style="color:#6c768a;padding:16px">Loading service request…</p></div>
<script type="module">
  let rpcId = 0;
  const pending = new Map();
  const notify  = (m, p) => window.parent.postMessage({ jsonrpc:"2.0", method:m, params:p }, "*");
  const request = (m, p) => new Promise((res, rej) => {
    const id = ++rpcId;
    pending.set(id, { resolve:res, reject:rej });
    window.parent.postMessage({ jsonrpc:"2.0", id, method:m, params:p }, "*");
  });

  window.addEventListener("message", e => {
    if (e.source !== window.parent) return;
    const msg = e.data;
    if (!msg || msg.jsonrpc !== "2.0") return;
    if (typeof msg.id === "number") {
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      msg.error ? p.reject(msg.error) : p.resolve(msg.result);
    }
    if (msg.method === "ui/notifications/tool-result") render(msg.params?.structuredContent);
  }, { passive: true });

  async function init() {
    await request("ui/initialize", { appInfo:{ name:"service-request", version:"1.0" }, appCapabilities:{}, protocolVersion:"2026-01-26" });
    notify("ui/notifications/initialized", {});
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  }

  function render(d) {
    if (!d) return;
    document.getElementById("root").innerHTML = \`
      <div class="card">
        <div class="icon">🎫</div>
        <h2>Service Request Raised</h2>
        <p class="sub">\${d.message || ""}</p>
        <span class="badge \${d.status === "RESOLVED" ? "resolved" : ""}">\${d.status || "OPEN"}</span>
        <table>
          <tr><td>Ticket ID</td><td>\${d.ticketId || "—"}</td></tr>
          <tr><td>Request Type</td><td>\${d.requestType || "—"}</td></tr>
          <tr><td>Customer</td><td>\${d.customerName || "—"}</td></tr>
          <tr><td>Agreement No.</td><td>\${d.agreementNo || "—"}</td></tr>
          <tr><td>Created At</td><td>\${fmtDate(d.createdAt)}</td></tr>
          <tr><td>Resolution</td><td>Within \${d.estimatedResolutionDays || "?"} business days</td></tr>
        </table>
        <p class="tip">📧 Confirmation will be sent to your registered mobile and email within 24 hours.</p>
      </div>
    \`;
  }

  init().catch(console.error);
</script>
</body>
</html>`;

// ─── Widget registry (URI → HTML) ─────────────────────────────────────────────
const WIDGETS = {
  [UI.DASHBOARD]:   WIDGET_LOAN_DASHBOARD,
  [UI.EMI]:         WIDGET_EMI_CARD,
  [UI.DISCOVERY]:   WIDGET_LOAN_DISCOVERY,
  [UI.SERVICE_REQ]: WIDGET_SERVICE_REQUEST,
};

// ─── Global instructions ──────────────────────────────────────────────────────
const GLOBAL_INSTRUCTIONS = `
# Role
You are a Bajaj Finance loan assistant. You help customers understand their loan details and take action.

# Response rules
1. Answer only what the user asked. Do NOT dump the full tool response.
2. Use a table ONLY when showing 2+ comparable fields. For a single fact, reply in one plain sentence.
3. Suggest 1–2 follow-ups at the end of each response, phrased as short tap-ready questions.
4. Tone: concise, friendly, professional. No filler phrases.
`.trim();

// ─── Tool definitions ─────────────────────────────────────────────────────────
// Tools that have a UI widget include:
//   _meta.ui.resourceUri  → which widget to load in the ChatGPT iframe
//   outputSchema          → structuredContent shape the widget reads

const TOOLS = [
  {
    name: "global_instruction",
    title: "Global Assistant Instructions",
    description: "ALWAYS call this tool first before calling any other tool. Returns behaviour rules the assistant must follow.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },

  // ── Discovery tools ──────────────────────────────────────────────────────
  {
    name: "discover_loans",
    title: "Discover Loan Products",
    description: "Recommends Bajaj Finance loan products based on purpose, employment type, and collateral. Shows a card list in the ChatGPT UI.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        purpose:         { type: "string", description: "Reason for loan (home purchase, business, medical, vehicle, etc.)" },
        employment_type: { type: "string", enum: ["salaried","self_employed","business_owner","professional","any"] },
        has_collateral:  { type: "string", enum: ["yes_property","yes_gold","yes_shares","yes_fd","no"] },
      },
      required: [],
    },
    _meta: { ui: { resourceUri: UI.DISCOVERY } },
    outputSchema: {
      type: "object",
      properties: {
        recommendations:      { type: "array" },
        totalRecommendations: { type: "number" },
        tip:                  { type: "string" },
      },
    },
  },
  {
    name: "get_loan_product_info",
    title: "Get Loan Product Details",
    description: "Returns complete details for a specific Bajaj Finance loan product including rate, tenure, eligibility and apply link. Shows a product detail card.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", enum: Object.keys(loanProducts), description: "Product key. Use discover_loans first if unsure." },
      },
      required: ["product"],
    },
    _meta: { ui: { resourceUri: UI.DISCOVERY } },
    outputSchema: {
      type: "object",
      properties: {
        name: { type: "string" }, interest_rate: { type: "string" }, max_amount: { type: "string" },
        tenure: { type: "string" }, processing_fee: { type: "string" }, eligibility: { type: "string" },
        key_features: { type: "array" }, apply_now: { type: "string" },
      },
    },
  },

  // ── Dashboard tools ──────────────────────────────────────────────────────
  {
    name: "get_customer_profile",
    title: "Get Customer Profile",
    description: "Returns customer name, agreement number, product type, and relationship status.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_loan_details",
    title: "Get Loan Details",
    description: "Returns full loan dashboard: amount, POS, ROI, tenure, next EMI, dates, overdue. Shows an interactive dashboard card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.DASHBOARD } },
    outputSchema: {
      type: "object",
      properties: {
        customerName: { type: "string" }, agreementNo: { type: "string" }, productType: { type: "string" },
        loanStatus: { type: "string" }, loanAmount: { type: "number" }, loanAmountFormatted: { type: "string" },
        outstandingAmountFormatted: { type: "string" }, roi: { type: "string" },
        grossTenure: { type: "number" }, balanceTenure: { type: "number" },
        nextEmiAmountFormatted: { type: "string" }, nextEmiDate: { type: "string" },
        disbursementDate: { type: "string" }, loanExpiryDate: { type: "string" },
        totalOverDue: { type: "number" }, flexiEnabled: { type: "boolean" }, flexiLimitFormatted: { type: "string" },
      },
    },
  },
  {
    name: "get_loan_summary",
    title: "Get Loan Summary",
    description: "Concise summary: customer name, loan type, status, ROI, balance tenure. Shows dashboard card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.DASHBOARD } },
  },
  {
    name: "get_flexi_details",
    title: "Get Flexi Loan Details",
    description: "Returns Flexi Loan status, limit, and available amount. Shows dashboard card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.DASHBOARD } },
  },

  // ── EMI / Balance tools ──────────────────────────────────────────────────
  {
    name: "get_emi_details",
    title: "Get EMI Details",
    description: "Returns next EMI amount, next EMI due date, and missed EMI count. Shows EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI } },
    outputSchema: {
      type: "object",
      properties: {
        nextEmiAmount: { type: "number" }, nextEmiAmountFormatted: { type: "string" },
        nextEmiDate: { type: "string" }, missedEmi: { type: "number" },
      },
    },
  },
  {
    name: "get_due_amount",
    title: "Get Due Amount",
    description: "Returns current total overdue amount. Shows EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI } },
    outputSchema: {
      type: "object",
      properties: { totalOverDue: { type: "number" }, totalOverDueFormatted: { type: "string" } },
    },
  },
  {
    name: "get_balance_tenure",
    title: "Get Balance Tenure",
    description: "Returns remaining repayment months. Shows EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI } },
    outputSchema: {
      type: "object",
      properties: { balanceTenure: { type: "number" }, unit: { type: "string" } },
    },
  },
  {
    name: "get_pos_amount",
    title: "Get Principal Outstanding",
    description: "Returns current principal outstanding (POS). Shows EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI } },
    outputSchema: {
      type: "object",
      properties: { pos: { type: "number" }, posFormatted: { type: "string" } },
    },
  },
  {
    name: "get_overdue_details",
    title: "Get Overdue Details",
    description: "Returns total overdue amount and missed EMI count. Shows EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI } },
  },

  // ── Single-value tools (no widget — plain text reply) ────────────────────
  {
    name: "get_noc_status",
    title: "Get NOC Status",
    description: "Checks if a No Objection Certificate is available based on loan closure status.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_interest_rate",
    title: "Get Interest Rate",
    description: "Returns the current rate of interest (ROI) on the customer's loan.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_loan_status",
    title: "Get Loan Status",
    description: "Returns the current relationship/loan status (Active, Closed, etc.).",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_loan_amount",
    title: "Get Loan Amount",
    description: "Returns the total sanctioned loan amount.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_disbursement_details",
    title: "Get Disbursement Details",
    description: "Returns the loan disbursement date.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_loan_expiry",
    title: "Get Loan Expiry Date",
    description: "Returns the loan maturity / expiry date.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_agreement_details",
    title: "Get Agreement Details",
    description: "Returns the loan agreement number.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_product_details",
    title: "Get Product Details",
    description: "Returns product category, product ID, and description for the customer's loan.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "check_loan_closure_eligibility",
    title: "Check Loan Closure Eligibility",
    description: "Checks whether the loan is eligible for a closure request based on outstanding dues.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_foreclosure_status",
    title: "Get Foreclosure Status",
    description: "Returns whether foreclosure is available for the customer's loan.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_amc_charges",
    title: "Get AMC Charges",
    description: "Returns Annual Maintenance Charges applicable to the loan.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },

  // ── Write tool ────────────────────────────────────────────────────────────
  {
    name: "raise_service_request",
    title: "Raise a Service Request",
    description: "Creates a service request and returns a ticket ID, status, and ETA. Shows a service request confirmation card.",
    annotations: { destructiveHint: true, readOnlyHint: false, openWorldHint: false },
    inputSchema: {
      type: "object",
      properties: {
        requestType: {
          type: "string",
          enum: ["NOC","Account Statement","Foreclosure Quote","EMI Dispute","Interest Certificate","Repayment Schedule"],
          description: "Type of service request.",
        },
      },
      required: ["requestType"],
    },
    _meta: { ui: { resourceUri: UI.SERVICE_REQ } },
    outputSchema: {
      type: "object",
      properties: {
        ticketId: { type: "string" }, requestType: { type: "string" }, customerName: { type: "string" },
        agreementNo: { type: "string" }, status: { type: "string" }, createdAt: { type: "string" },
        estimatedResolutionDays: { type: "number" }, message: { type: "string" },
      },
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

function handleGlobalInstruction() {
  return success({ instructions: GLOBAL_INSTRUCTIONS });
}

function handleDiscoverLoans({ purpose = "", employment_type = "any", has_collateral = "no" }) {
  const recs = [];
  const p = purpose.toLowerCase();
  const isHome     = /home|house|property|flat/.test(p);
  const isBusiness = /business|startup|expansion|working capital/.test(p);
  const isVehicle  = /bike|motorcycle|scooter|two.?wheeler/.test(p);
  const isCar      = /car|used car/.test(p);
  const isDoctor   = /clinic|hospital|medical practice/.test(p);
  const hasProperty = has_collateral === "yes_property";
  const hasGold     = has_collateral === "yes_gold";
  const hasFd       = has_collateral === "yes_fd";
  const hasShares   = has_collateral === "yes_shares";

  if (isHome) {
    recs.push({ product: "home_loan", reason: "Best fit for home purchase with competitive rates." });
    if (hasProperty) recs.push({ product: "loan_against_property", reason: "Higher amount using existing property as collateral." });
  }
  if (isBusiness || employment_type === "business_owner") {
    recs.push({ product: "business_loan", reason: "Collateral-free business funding up to ₹80 Lakh." });
  }
  if (employment_type === "professional") {
    recs.push({ product: "loan_for_doctors", reason: "Tailored for medical professionals." });
    recs.push({ product: "loan_for_ca", reason: "Tailored for practicing CAs." });
  }
  if (isDoctor) recs.push({ product: "loan_for_doctors", reason: "Specifically for doctors — clinic setup, equipment." });
  if (isVehicle) recs.push({ product: "two_wheeler_loan", reason: "Two-wheeler purchase with 0% down payment offers." });
  if (isCar)     recs.push({ product: "used_car_loan",    reason: "Used car financing up to ₹50 Lakh with flexible EMIs." });
  if (hasGold)   recs.push({ product: "gold_loan",         reason: "Instant cash against gold with gold safely vaulted." });
  if (hasFd)     recs.push({ product: "loan_against_fd",   reason: "Borrow against FD without breaking it." });
  if (hasShares) recs.push({ product: "loan_against_shares", reason: "Overdraft against your share portfolio." });
  if (!recs.length) recs.push({ product: "personal_loan", reason: "No collateral, quick disbursal, flexible end use." });

  const seen = new Set();
  const unique = recs.filter(r => { if (seen.has(r.product)) return false; seen.add(r.product); return true; });
  const out = unique.map(r => ({
    ...r,
    productName: loanProducts[r.product].name,
    interestRate: loanProducts[r.product].interest_rate,
    maxAmount: loanProducts[r.product].max_amount,
  }));

  const sc = { recommendations: out, totalRecommendations: out.length, tip: "Ask me about any product for full details and apply link." };
  return success({ recommendations: out, totalRecommendations: out.length }, sc);
}

function handleGetLoanProductInfo({ product }) {
  const info = loanProducts[product];
  if (!info) return failure(`Unknown product '${product}'. Valid: ${Object.keys(loanProducts).join(", ")}`);
  // Pass the product object directly as structuredContent for the widget
  return success(info, info);
}

function handleGetCustomerProfile() {
  const c = getDemoCustomer();
  return success({ customerName: c.customer_Name, agreementNo: c.agreementNo, productType: c.prodDesc, relationshipStatus: c.relStatus, activeLoans: 1 });
}

function handleGetLoanDetails() {
  const c = getDemoCustomer();
  const d = {
    customerName: c.customer_Name,
    agreementNo: c.agreementNo,
    productType: c.prodDesc,
    loanStatus: c.relStatus,
    loanAmount: c.relAmount,
    loanAmountFormatted: fmt(c.relAmount),
    outstandingAmount: c.pos,
    outstandingAmountFormatted: fmt(c.pos),
    roi: `${c.roi}% p.a.`,
    grossTenure: c.grossTenure,
    balanceTenure: c.balanceTenure,
    nextEmiAmount: c.nextEMIAmount,
    nextEmiAmountFormatted: fmt(c.nextEMIAmount),
    nextEmiDate: c.nextEmiDate,
    disbursementDate: c.disbDate,
    loanExpiryDate: c.loanExpiryDate,
    missedEmi: c.missedEmi,
    totalOverDue: c.totalOverDue,
    flexiEnabled: c.flexiFlag === "Y",
    flexiLimitFormatted: c.flexiFlag === "Y" ? fmt(c.amountDrawnLimit) : null,
  };
  return success(d, d);
}

function handleGetFlexiDetails() {
  const c = getDemoCustomer();
  const flexiEnabled = c.flexiFlag === "Y";
  const d = flexiEnabled
    ? { customerName: c.customer_Name, agreementNo: c.agreementNo, flexiEnabled: true, flexiLimit: c.amountDrawnLimit, flexiLimitFormatted: fmt(c.amountDrawnLimit), message: "Your Flexi Loan is active. Withdraw anytime, pay interest only on utilised amount." }
    : { customerName: c.customer_Name, agreementNo: c.agreementNo, flexiEnabled: false, message: "Not enrolled in Flexi Loan. Visit the Bajaj Finserv app or contact your RM to enrol.", enrollUrl: "https://www.bajajfinserv.in/flexi-personal-loan" };
  return success(d, d);
}

function handleGetEmiDetails() {
  const c = getDemoCustomer();
  const d = { nextEmiAmount: c.nextEMIAmount, nextEmiAmountFormatted: fmt(c.nextEMIAmount), nextEmiDate: c.nextEmiDate, missedEmi: c.missedEmi };
  return success(d, d);
}

function handleGetDueAmount() {
  const c = getDemoCustomer();
  const d = { totalOverDue: c.totalOverDue, totalOverDueFormatted: fmt(c.totalOverDue) };
  return success(d, d);
}

function handleGetBalanceTenure() {
  const c = getDemoCustomer();
  const d = { balanceTenure: c.balanceTenure, unit: "months" };
  return success(d, d);
}

function handleGetPosAmount() {
  const c = getDemoCustomer();
  const d = { pos: c.pos, posFormatted: fmt(c.pos) };
  return success(d, d);
}

function handleGetOverdueDetails() {
  const c = getDemoCustomer();
  const d = { totalOverDue: c.totalOverDue, totalOverDueFormatted: fmt(c.totalOverDue), missedEmi: c.missedEmi };
  return success(d, d);
}

function handleGetNocStatus() {
  const c = getDemoCustomer();
  const available = c.relStatus === "Closed";
  return success({ nocAvailable: available, loanStatus: c.relStatus, message: available ? "NOC Available." : "Loan is Active. NOC not available yet." });
}

function handleGetInterestRate() {
  const c = getDemoCustomer();
  return success({ roi: c.roi, roiFormatted: `${c.roi}% p.a.` });
}

function handleGetLoanStatus() {
  const c = getDemoCustomer();
  return success({ loanStatus: c.relStatus });
}

function handleGetLoanAmount() {
  const c = getDemoCustomer();
  return success({ loanAmount: c.relAmount, loanAmountFormatted: fmt(c.relAmount) });
}

function handleGetDisbursementDetails() {
  return success({ disbursementDate: getDemoCustomer().disbDate });
}

function handleGetLoanExpiry() {
  return success({ loanExpiryDate: getDemoCustomer().loanExpiryDate });
}

function handleGetAgreementDetails() {
  return success({ agreementNo: getDemoCustomer().agreementNo });
}

function handleGetProductDetails() {
  const c = getDemoCustomer();
  return success({ prodCategory: c.prodCategory, prodId: c.prodId, prodDesc: c.prodDesc });
}

function handleGetLoanSummary() {
  const c = getDemoCustomer();
  const d = { customerName: c.customer_Name, loanType: c.prodDesc, loanStatus: c.relStatus, roi: `${c.roi}% p.a.`, balanceTenure: `${c.balanceTenure} months`, agreementNo: c.agreementNo };
  return success(d, d);
}

function handleCheckLoanClosureEligibility() {
  const c = getDemoCustomer();
  const eligible = c.totalOverDue === 0;
  return success({ eligible, message: eligible ? "Loan is eligible for closure request." : "Please clear overdue amount before closure.", totalOverDue: c.totalOverDue });
}

function handleGetForeclosureStatus() {
  return success({ foreclosureAvailable: true, loanStatus: getDemoCustomer().relStatus, message: "Foreclosure is available for this loan." });
}

function handleGetAmcCharges() {
  const c = getDemoCustomer();
  return success({ amcCharges: c.amcCharges, amcChargesFormatted: fmt(Number(c.amcCharges)) });
}

function handleRaiseServiceRequest({ requestType }) {
  const c = getDemoCustomer();
  const resolutionDays = { NOC: 7, "Account Statement": 2, "Foreclosure Quote": 3, "EMI Dispute": 5, "Interest Certificate": 3, "Repayment Schedule": 2 };
  const ticketId = `SR-${Date.now()}`;
  const d = {
    ticketId, requestType,
    customerName: c.customer_Name,
    agreementNo: c.agreementNo,
    status: "OPEN",
    createdAt: new Date().toISOString(),
    estimatedResolutionDays: resolutionDays[requestType] || 5,
    message: `Service request '${requestType}' raised successfully. You will receive confirmation within 24 hours.`,
  };
  serviceRequests[ticketId] = d;
  return success(d, d);  // structuredContent goes to the widget
}

// ─── MCP server factory ───────────────────────────────────────────────────────

function createMcpServer() {
  const server = new Server(
    { name: "bajaj-finance-mcp", version: VERSION },
    { capabilities: { tools: {}, resources: {} } }
  );

  // ── List tools ──────────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  // ── List resources (widget URIs) ────────────────────────────────────────
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: Object.keys(WIDGETS).map(uri => ({
      uri,
      name: uri.replace("ui://widget/", "").replace(".html", ""),
      mimeType: RESOURCE_MIME_TYPE,
    })),
  }));

  // ── Read resource (serve widget HTML) ───────────────────────────────────
  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = req.params.uri;
    const html = WIDGETS[uri];
    if (!html) {
      return {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: `Unknown widget URI: ${uri}`,
        }],
      };
    }
    return {
      contents: [{
        uri,
        mimeType: RESOURCE_MIME_TYPE,
        text: html,
        _meta: {
          ui: {
            prefersBorder: true,
          },
        },
      }],
    };
  });

  // ── Call tool ────────────────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    try {
      switch (name) {
        case "global_instruction":             return handleGlobalInstruction();
        case "discover_loans":                 return handleDiscoverLoans(args);
        case "get_loan_product_info":          return handleGetLoanProductInfo(args);
        case "get_customer_profile":           return handleGetCustomerProfile();
        case "get_loan_details":               return handleGetLoanDetails();
        case "get_loan_summary":               return handleGetLoanSummary();
        case "get_flexi_details":              return handleGetFlexiDetails();
        case "get_emi_details":                return handleGetEmiDetails();
        case "get_due_amount":                 return handleGetDueAmount();
        case "get_balance_tenure":             return handleGetBalanceTenure();
        case "get_pos_amount":                 return handleGetPosAmount();
        case "get_overdue_details":            return handleGetOverdueDetails();
        case "get_noc_status":                 return handleGetNocStatus();
        case "get_interest_rate":              return handleGetInterestRate();
        case "get_loan_status":                return handleGetLoanStatus();
        case "get_loan_amount":                return handleGetLoanAmount();
        case "get_disbursement_details":       return handleGetDisbursementDetails();
        case "get_loan_expiry":                return handleGetLoanExpiry();
        case "get_agreement_details":          return handleGetAgreementDetails();
        case "get_product_details":            return handleGetProductDetails();
        case "check_loan_closure_eligibility": return handleCheckLoanClosureEligibility();
        case "get_foreclosure_status":         return handleGetForeclosureStatus();
        case "get_amc_charges":                return handleGetAmcCharges();
        case "raise_service_request":          return handleRaiseServiceRequest(args);
        default:                               return failure(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return failure(err.message);
    }
  });

  return server;
}

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id");
  if (_req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ─── Discovery endpoints ───────────────────────────────────────────────────────

app.get("/.well-known/mcp", (_req, res) => {
  res.json({
    mcp: {
      version: "2024-11-05",
      transports: [
        { type: "streamable-http", url: `${BASE_URL}/mcp` },
        { type: "sse",             url: `${BASE_URL}/sse` },
      ],
    },
    server: {
      name: "bajaj-finance-mcp",
      version: VERSION,
      description: "Bajaj Finance MCP Server — loan discovery, account management, service requests with ChatGPT UI widgets",
    },
    widgets: Object.keys(WIDGETS).map(uri => ({
      uri,
      mimeType: RESOURCE_MIME_TYPE,
    })),
  });
});

app.get("/.well-known/oauth-authorization-server", (_req, res) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/oauth/authorize`,
    token_endpoint: `${BASE_URL}/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    note: "Placeholder for ChatGPT connector discovery. Auth is handled in tool parameters.",
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    version: VERSION,
    timestamp: new Date().toISOString(),
    tools: TOOLS.map(t => t.name),
    widgets: Object.keys(WIDGETS),
    transports: {
      streamableHttp: `${BASE_URL}/mcp`,
      sse: `${BASE_URL}/sse`,
    },
  });
});

app.get("/", (_req, res) => {
  res.type("text/plain").send(
    `Bajaj Finance MCP Server v${VERSION}\n` +
    `POST /mcp  → ChatGPT (Streamable HTTP + UI widgets)\n` +
    `GET  /sse  → Claude.ai (SSE)\n` +
    `GET  /health\n` +
    `Widgets: ${Object.keys(WIDGETS).join(", ")}`
  );
});

// ─── Streamable HTTP transport (ChatGPT) ──────────────────────────────────────

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", (_req, res) => {
  res.status(200).json({
    server: "bajaj-finance-mcp",
    version: VERSION,
    transport: "streamable-http",
    endpoint: "POST /mcp",
    widgets: Object.keys(WIDGETS),
  });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).json({ error: "Session management not supported in stateless mode." });
});

// ─── SSE transport (Claude.ai) ────────────────────────────────────────────────

const sseSessions = new Map();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  const server = createMcpServer();
  await server.connect(transport);
  sseSessions.set(transport.sessionId, transport);
  res.on("close", () => sseSessions.delete(transport.sessionId));
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = sseSessions.get(sessionId);
  if (!transport) return res.status(404).json({ error: "SSE session not found. Connect via GET /sse first." });
  await transport.handlePostMessage(req, res, req.body);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Bajaj Finance MCP Server v${VERSION} on port ${PORT}`);
  console.log(`Streamable HTTP : POST ${BASE_URL}/mcp`);
  console.log(`SSE             : GET  ${BASE_URL}/sse`);
  console.log(`Health          : GET  ${BASE_URL}/health`);
  console.log(`Widgets loaded  : ${Object.keys(WIDGETS).length}`);
});