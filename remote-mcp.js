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
const MIME = "text/html;profile=mcp-app";

const UI = {
  DASHBOARD:   "ui://widget/loan-dashboard.html",
  EMI:         "ui://widget/emi-card.html",
  DISCOVERY:   "ui://widget/loan-discovery.html",
  SR:          "ui://widget/service-request.html",
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const CUSTOMER = {
  customer_Name: "Vikas Singh Rathaur",
  prodDesc: "PERSONAL LOAN",
  roi: 11.25,
  agreementNo: "X402P34T9588444",
  disbDate: "27/03/2025",
  flexiFlag: "Y",
  totalOverDue: 0,
  pos: 4203,
  prodCategory: "PERSONAL LOAN",
  relStatus: "Active",
  prodId: "PSPFL",
  missedEmi: 0,
  grossTenure: 96,
  relAmount: 3739000,
  nextEMIAmount: 132,
  amcCharges: "0",
  amountDrawnLimit: 3734797,
  applId: "1015709507",
  balanceTenure: 83,
  nextEmiDate: "2026-08-02T00:00:00.0000000Z",
  loanExpiryDate: "02/04/2033",
};

const PRODUCTS = {
  personal_loan: { name:"Personal Loan", interest_rate:"11% - 31% p.a.", max_amount:"₹40 Lakh", tenure:"12 - 84 months", processing_fee:"Up to 3.93% + GST", eligibility:"Salaried / Self-Employed, Age 21-80, Min income ₹25,000/month", key_features:["No collateral needed","Quick disbursal in 24 hrs","Flexible EMI options","Top-up facility available"], apply_now:"https://www.bajajfinserv.in/personal-loan" },
  insta_personal_loan: { name:"Insta Personal Loan", interest_rate:"10% - 28% p.a.", max_amount:"₹10 Lakh", tenure:"3 - 60 months", processing_fee:"Up to 2% + GST", eligibility:"Pre-approved existing Bajaj customers", key_features:["Instant approval","Disbursal in minutes","No documentation required","Available via app"], apply_now:"https://www.bajajfinserv.in/insta-personal-loan" },
  home_loan: { name:"Home Loan", interest_rate:"8.50% - 15% p.a.", max_amount:"₹5 Crore", tenure:"Up to 30 years", processing_fee:"Up to 0.50% + GST", eligibility:"Salaried / Self-Employed, Age 23-70", key_features:["Low interest rates","Long repayment tenure","Tax benefits u/s 80C & 24(b)","Part-prepayment allowed"], apply_now:"https://www.bajajfinserv.in/home-loan" },
  home_loan_balance_transfer: { name:"Home Loan Balance Transfer", interest_rate:"8.50% - 14% p.a.", max_amount:"₹5 Crore", tenure:"Up to 30 years", processing_fee:"Up to 0.50% + GST", eligibility:"Existing home loan holders with other banks/NBFCs", key_features:["Lower EMI","Top-up loan available","Minimal documentation","Online process"], apply_now:"https://www.bajajfinserv.in/home-loan-balance-transfer" },
  loan_against_property: { name:"Loan Against Property", interest_rate:"9% - 18% p.a.", max_amount:"₹5 Crore", tenure:"Up to 15 years", processing_fee:"Up to 1% + GST", eligibility:"Property owner, Age 25-70", key_features:["High loan amount","Residential / commercial property accepted","Flexible end use","Part-prepayment allowed"], apply_now:"https://www.bajajfinserv.in/loan-against-property" },
  business_loan: { name:"Business Loan", interest_rate:"14% - 30% p.a.", max_amount:"₹80 Lakh", tenure:"12 - 96 months", processing_fee:"Up to 3.54% + GST", eligibility:"Business vintage min 3 years, Turnover ₹20 Lakh+", key_features:["No collateral","Quick disbursal","Dropline overdraft option","Business expansion / working capital"], apply_now:"https://www.bajajfinserv.in/business-loan" },
  loan_for_doctors: { name:"Loan for Doctors", interest_rate:"11% - 22% p.a.", max_amount:"₹2 Crore", tenure:"12 - 84 months", processing_fee:"Up to 2.95% + GST", eligibility:"MBBS / BDS / MD / MS qualified practicing doctors", key_features:["Clinic setup / equipment purchase","No collateral up to ₹50 Lakh","Doorstep service","Quick approval"], apply_now:"https://www.bajajfinserv.in/doctor-loan" },
  loan_for_ca: { name:"Loan for CA", interest_rate:"11% - 22% p.a.", max_amount:"₹50 Lakh", tenure:"12 - 84 months", processing_fee:"Up to 2.95% + GST", eligibility:"Practicing CA with valid ICAI certificate", key_features:["Office expansion","Working capital needs","No collateral","Online process"], apply_now:"https://www.bajajfinserv.in/ca-loan" },
  gold_loan: { name:"Gold Loan", interest_rate:"9.50% - 28% p.a.", max_amount:"₹2 Crore", tenure:"1 - 12 months", processing_fee:"Up to 1% + GST", eligibility:"Gold ornaments / jewellery as collateral, Age 18+", key_features:["Instant disbursal","Gold safely stored in vault","Interest-only EMI option","Auction-free 7-day notice"], apply_now:"https://www.bajajfinserv.in/gold-loan" },
  loan_against_fd: { name:"Loan Against FD", interest_rate:"FD rate + 1-2% p.a.", max_amount:"Up to 90% of FD value", tenure:"Up to FD tenure", processing_fee:"Nil", eligibility:"Existing Bajaj Finance FD holder", key_features:["No credit check required","FD continues to earn interest","Overdraft facility","Instant processing"], apply_now:"https://www.bajajfinserv.in/loan-against-fd" },
  loan_against_shares: { name:"Loan Against Shares / Securities", interest_rate:"10.5% - 18% p.a.", max_amount:"₹10 Crore", tenure:"12 months (renewable)", processing_fee:"Up to 0.5% + GST", eligibility:"Demat account holder with approved securities", key_features:["Overdraft limit against portfolio","Shares continue to grow","Pay interest only on utilized amount","Online management"], apply_now:"https://www.bajajfinserv.in/loan-against-securities" },
  two_wheeler_loan: { name:"Two Wheeler Loan", interest_rate:"9.99% - 29% p.a.", max_amount:"100% of bike on-road price", tenure:"12 - 48 months", processing_fee:"Up to 2% + GST", eligibility:"Age 18-65, Min income ₹12,000/month", key_features:["0% down payment offers","Quick approval at dealership","Covers new and used bikes","Doorstep delivery"], apply_now:"https://www.bajajfinserv.in/two-wheeler-loan" },
  used_car_loan: { name:"Used Car Loan", interest_rate:"12% - 26% p.a.", max_amount:"₹50 Lakh", tenure:"12 - 60 months", processing_fee:"Up to 3.93% + GST", eligibility:"Car age max 10 years, Age 21-65", key_features:["Up to 100% of car value financed","Quick loan disbursal","Doorstep inspection","Flexible EMIs"], apply_now:"https://www.bajajfinserv.in/used-car-loan" },
};

const serviceRequests = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

// Return tool result. When widgetData is provided:
//   - structuredContent = data the widget reads via window.openai.toolOutput
//   - content[].text    = short sentence for the model (NOT rendered by ChatGPT as table
//                         when a widget is present)
function ok(data, widgetData) {
  if (widgetData !== undefined) {
    return {
      structuredContent: widgetData,
      content: [{ type: "text", text: JSON.stringify(data) }],
    };
  }
  return {
    content: [{ type: "text", text: JSON.stringify({ ok: true, data }) }],
  };
}

function err(msg) {
  return {
    content: [{ type: "text", text: JSON.stringify({ ok: false, error: msg }) }],
    isError: true,
  };
}

// ─── Widget HTML ──────────────────────────────────────────────────────────────
// Rules that prevent Runtime error in ChatGPT sandbox:
//   1. NO template literals inside widget HTML strings — use concatenation only
//   2. NO regex with \d — use split() for date parsing instead
//   3. NO <script type="module"> — use plain <script>
//   4. window.openai.toolOutput is set synchronously by ChatGPT before script runs

function makeDashboardHtml() {
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>',
    '<title>Loan Dashboard</title><style>',
    ':root{font-family:Inter,system-ui,sans-serif;color:#0b0b0f}',
    'body{margin:0;padding:10px;background:#f6f8fb}',
    '.card{background:#fff;border-radius:14px;padding:14px 16px;',
    'box-shadow:0 2px 10px rgba(0,0,0,.07);max-width:390px;margin:0 auto}',
    '.hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}',
    '.hdr h2{margin:0;font-size:.95rem;color:#1a1a2e}',
    '.sub{font-size:.72rem;color:#6c768a;margin-top:2px}',
    '.badge{flex-shrink:0;padding:2px 9px;border-radius:20px;font-size:.7rem;font-weight:700;',
    'background:#e6faf0;color:#1a7f50;margin-left:8px;margin-top:2px}',
    '.badge.cl{background:#fce;color:#a00}',
    'table{width:100%;border-collapse:collapse}',
    'tr{border-bottom:1px solid #f3f4f8}tr:last-child{border-bottom:none}',
    'td{padding:6px 2px;font-size:.85rem;vertical-align:middle}',
    'td:first-child{color:#6c768a;width:50%}td:last-child{font-weight:600;text-align:right}',
    '.dp{display:inline-flex;align-items:center;gap:4px;background:#f0f4ff;',
    'color:#3b5bdb;border-radius:7px;padding:2px 7px;font-size:.78rem;font-weight:600}',
    '.flexi{margin-top:10px;background:#f0f4ff;border-radius:9px;padding:9px 11px;font-size:.82rem}',
    '.lbl{color:#6c768a;font-size:.72rem;margin-bottom:2px}',
    '.bar{background:#dde3f5;border-radius:5px;height:5px;margin-top:5px}',
    '.bf{background:#3b5bdb;border-radius:5px;height:5px}',
    '.ok{color:#1a7f50}.er{color:#c00}',
    '</style></head><body>',
    '<div class="card" id="root"><p style="color:#6c768a;margin:0;font-size:.85rem">Loading...</p></div>',
    '<script>',
    'function fmtDate(s){',
    '  if(!s)return null;',
    '  var d;',
    '  if(s.indexOf("/")===2){',  // DD/MM/YYYY
    '    var p=s.split("/");',
    '    d=new Date(p[2]+"-"+p[1]+"-"+p[0]);',
    '  } else {',
    '    d=new Date(s);',
    '  }',
    '  if(isNaN(d.getTime()))return s;',
    '  return "<span class=\\"dp\\">\\uD83D\\uDCC5 "+d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})+"</span>";',
    '}',
    'function row(l,v){',
    '  if(v===null||v===undefined||v==="")return "";',
    '  return "<tr><td>"+l+"</td><td>"+v+"</td></tr>";',
    '}',
    'function render(d){',
    '  if(!d)return;',
    '  var s=d.structuredContent||d;',
    '  var rows=[',
    '    row("Loan Amount",s.loanAmountFormatted||(s.loanAmount?"\\u20B9"+s.loanAmount:null)),',
    '    row("Outstanding",s.outstandingAmountFormatted||(s.outstandingAmount?"\\u20B9"+s.outstandingAmount:null)),',
    '    row("Interest Rate",s.roi||null),',
    '    row("Tenure",s.grossTenure?s.grossTenure+" months ("+s.balanceTenure+" remaining)":null),',
    '    row("Next EMI",s.nextEmiAmountFormatted||(s.nextEmiAmount?"\\u20B9"+s.nextEmiAmount:null)),',
    '    row("Next EMI Date",fmtDate(s.nextEmiDate)),',
    '    row("Disbursed On",fmtDate(s.disbursementDate)),',
    '    row("Loan Expiry",fmtDate(s.loanExpiryDate)),',
    '    row("Overdue",s.totalOverDue!==undefined?(s.totalOverDue>0?"<span class=\\"er\\">\\u20B9"+s.totalOverDue+"</span>":"<span class=\\"ok\\">Nil \\u2713</span>"):null)',
    '  ].filter(Boolean).join("");',
    '  var fl=s.flexiEnabled?"<div class=\\"flexi\\"><p class=\\"lbl\\">Flexi Limit</p><strong>"+(s.flexiLimitFormatted||"")+"</strong><div class=\\"bar\\"><div class=\\"bf\\" style=\\"width:72%\\"></div></div></div>":"";',
    '  document.getElementById("root").innerHTML=',
    '    "<div class=\\"hdr\\"><div><h2>"+(s.customerName||"Customer")+"</h2>"',
    '    +"<div class=\\"sub\\">"+(s.agreementNo||"")+(s.productType?" &middot; "+s.productType:"")+"</div></div>"',
    '    +"<span class=\\"badge"+(s.loanStatus==="Active"?"":" cl")+"\\">"+(s.loanStatus||"")+"</span></div>"',
    '    +"<table>"+rows+"</table>"+fl;',
    '}',
    'render(window.openai&&window.openai.toolOutput);',
    'window.addEventListener("message",function(e){',
    '  if(e.source!==window.parent)return;',
    '  var m=e.data;',
    '  if(m&&m.method==="ui/notifications/tool-result")render(m.params);',
    '},{passive:true});',
    '</script></body></html>',
  ].join("\n");
}

function makeEmiHtml() {
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>',
    '<title>EMI Details</title><style>',
    ':root{font-family:Inter,system-ui,sans-serif;color:#0b0b0f}',
    'body{margin:0;padding:10px;background:#f6f8fb}',
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:390px;margin:0 auto}',
    '.tile{background:#fff;border-radius:12px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)}',
    '.lbl{font-size:.72rem;color:#6c768a;margin:0 0 4px}',
    '.val{font-size:1.1rem;font-weight:700;margin:0}',
    '.sub{font-size:.75rem;color:#6c768a;margin:3px 0 0}',
    '.wide{grid-column:span 2}',
    '.dp{display:inline-flex;align-items:center;gap:3px;background:#f0f4ff;',
    'color:#3b5bdb;border-radius:6px;padding:2px 6px;font-size:.76rem;font-weight:600}',
    '.ok{color:#1a7f50}.er{color:#c00}',
    '</style></head><body>',
    '<div class="grid" id="root"><div class="tile wide"><p class="lbl">Loading...</p></div></div>',
    '<script>',
    'function fmtDate(s){',
    '  if(!s)return null;',
    '  var d;',
    '  if(s.indexOf("/")===2){var p=s.split("/");d=new Date(p[2]+"-"+p[1]+"-"+p[0]);}',
    '  else d=new Date(s);',
    '  if(isNaN(d.getTime()))return s;',
    '  return "<span class=\\"dp\\">\\uD83D\\uDCC5 "+d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})+"</span>";',
    '}',
    'function render(d){',
    '  if(!d)return;',
    '  var s=d.structuredContent||d;',
    '  var html="";',
    '  html+=\'<div class="tile"><p class="lbl">Next EMI Amount</p>\';',
    '  html+=\'<p class="val">\'+(s.nextEmiAmountFormatted||(s.nextEmiAmount?"\\u20B9"+s.nextEmiAmount:"\\u2014"))+"</p>";',
    '  if(s.nextEmiDate)html+=\'<p class="sub">\'+fmtDate(s.nextEmiDate)+"</p>";',
    '  html+="</div>";',
    '  html+=\'<div class="tile"><p class="lbl">Missed EMIs</p>\';',
    '  html+=\'<p class="val \'+(s.missedEmi>0?"er":"ok")+\'">\'+( s.missedEmi!==undefined?s.missedEmi:"\\u2014")+"</p>";',
    '  html+=\'<p class="sub">\'+(s.missedEmi>0?"Action required":"All clear")+"</p></div>";',
    '  if(s.balanceTenure!==undefined)html+=\'<div class="tile"><p class="lbl">Balance Tenure</p><p class="val">\'+s.balanceTenure+\'</p><p class="sub">months remaining</p></div>\';',
    '  if(s.pos!==undefined||s.posFormatted)html+=\'<div class="tile"><p class="lbl">Principal Outstanding</p><p class="val">\'+(s.posFormatted||(s.pos?"\\u20B9"+s.pos:"\\u2014"))+"</p></div>";',
    '  html+=\'<div class="tile wide \'+(s.totalOverDue>0?"er":"ok")+\'"><p class="lbl">Total Overdue</p>\';',
    '  html+=\'<p class="val">\'+(s.totalOverDue!==undefined?(s.totalOverDue>0?(s.totalOverDueFormatted||"\\u20B9"+s.totalOverDue):"\\u20B90 \\u2014 No dues"):"\\u2014")+"</p></div>";',
    '  document.getElementById("root").innerHTML=html;',
    '}',
    'render(window.openai&&window.openai.toolOutput);',
    'window.addEventListener("message",function(e){',
    '  if(e.source!==window.parent)return;',
    '  var m=e.data;',
    '  if(m&&m.method==="ui/notifications/tool-result")render(m.params);',
    '},{passive:true});',
    '</script></body></html>',
  ].join("\n");
}

function makeDiscoveryHtml() {
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>',
    '<title>Loan Products</title><style>',
    ':root{font-family:Inter,system-ui,sans-serif;color:#0b0b0f}',
    'body{margin:0;padding:10px;background:#f6f8fb}',
    '.wrap{max-width:430px;margin:0 auto}',
    'h2{font-size:.9rem;margin:0 0 10px;color:#1a1a2e}',
    '.card{background:#fff;border-radius:12px;padding:14px;',
    'box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:10px}',
    '.card h3{margin:0 0 3px;font-size:.88rem}',
    '.reason{font-size:.78rem;color:#6c768a;margin:0 0 8px}',
    '.chips{display:flex;gap:6px;flex-wrap:wrap}',
    '.chip{background:#f0f4ff;color:#3b5bdb;border-radius:20px;',
    'padding:2px 9px;font-size:.74rem;font-weight:600}',
    '.detail{background:#fff;border-radius:14px;padding:16px;',
    'box-shadow:0 2px 10px rgba(0,0,0,.07)}',
    '.detail h2{margin:0 0 10px;font-size:1rem}',
    'table{width:100%;border-collapse:collapse}',
    'tr{border-bottom:1px solid #f3f4f8}tr:last-child{border-bottom:none}',
    'td{padding:6px 2px;font-size:.84rem}',
    'td:first-child{color:#6c768a;width:45%}td:last-child{font-weight:600;text-align:right}',
    'ul{margin:8px 0 12px;padding-left:0;list-style:none}',
    'li{font-size:.82rem;margin:3px 0}li::before{content:"\\u2713 ";color:#1a7f50;font-weight:700}',
    '.apply{display:inline-block;margin-top:4px;padding:7px 16px;background:#3b5bdb;',
    'color:#fff;border-radius:9px;font-size:.82rem;font-weight:600;text-decoration:none}',
    '.tip{font-size:.76rem;color:#6c768a;text-align:center;margin:6px 0 0}',
    '</style></head><body>',
    '<div id="root"><p style="color:#6c768a;font-size:.85rem">Loading...</p></div>',
    '<script>',
    'function render(d){',
    '  if(!d)return;',
    '  var s=d.structuredContent||d;',
    '  var root=document.getElementById("root");',
    '  if(s.name&&s.interest_rate){',
    '    var feats=(s.key_features||[]).map(function(f){return"<li>"+f+"</li>";}).join("");',
    '    root.innerHTML=\'<div class="detail"><h2>\'+s.name+"</h2><table>"',
    '      +"<tr><td>Interest Rate</td><td>"+s.interest_rate+"</td></tr>"',
    '      +"<tr><td>Max Amount</td><td>"+s.max_amount+"</td></tr>"',
    '      +"<tr><td>Tenure</td><td>"+s.tenure+"</td></tr>"',
    '      +"<tr><td>Processing Fee</td><td>"+s.processing_fee+"</td></tr>"',
    '      +\'<tr><td>Eligibility</td><td style="font-weight:400;font-size:.78rem">\'+s.eligibility+"</td></tr>"',
    '      +"</table><ul>"+feats+"</ul>"',
    '      +\'<a class="apply" href="\'+s.apply_now+\'" target="_blank" rel="noopener">Apply Now \\u2192</a></div>\';',
    '    return;',
    '  }',
    '  if(s.recommendations&&s.recommendations.length){',
    '    var cards=s.recommendations.map(function(r){',
    '      return\'<div class="card"><h3>\'+r.productName+"</h3>"',
    '        +\'<p class="reason">\'+r.reason+"</p>"',
    '        +\'<div class="chips"><span class="chip">\'+r.interestRate+"</span>"',
    '        +\'<span class="chip">Up to \'+r.maxAmount+"</span></div></div>";',
    '    }).join("");',
    '    root.innerHTML=\'<div class="wrap"><h2>Recommended (\'+(s.totalRecommendations||0)+")</h2>"+cards',
    '      +\'<p class="tip">Ask me about any product for full details.</p></div>\';',
    '    return;',
    '  }',
    '  root.innerHTML=\'<p style="padding:12px;color:#6c768a">No products found.</p>\';',
    '}',
    'render(window.openai&&window.openai.toolOutput);',
    'window.addEventListener("message",function(e){',
    '  if(e.source!==window.parent)return;',
    '  var m=e.data;',
    '  if(m&&m.method==="ui/notifications/tool-result")render(m.params);',
    '},{passive:true});',
    '</script></body></html>',
  ].join("\n");
}

function makeServiceRequestHtml() {
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>',
    '<title>Service Request</title><style>',
    ':root{font-family:Inter,system-ui,sans-serif;color:#0b0b0f}',
    'body{margin:0;padding:10px;background:#f6f8fb}',
    '.card{background:#fff;border-radius:14px;padding:16px;',
    'box-shadow:0 2px 10px rgba(0,0,0,.07);max-width:380px;margin:0 auto}',
    '.icon{font-size:1.8rem;margin-bottom:6px}',
    'h2{margin:0 0 3px;font-size:.95rem}',
    '.sub{color:#6c768a;font-size:.8rem;margin:0 0 12px}',
    '.badge{display:inline-block;padding:3px 10px;border-radius:20px;',
    'font-size:.75rem;font-weight:700;background:#fff8e1;color:#b45309;margin-bottom:12px}',
    'table{width:100%;border-collapse:collapse}',
    'tr{border-bottom:1px solid #f3f4f8}tr:last-child{border-bottom:none}',
    'td{padding:6px 2px;font-size:.84rem}',
    'td:first-child{color:#6c768a;width:48%}td:last-child{font-weight:600;text-align:right}',
    '.tip{font-size:.76rem;color:#6c768a;margin-top:12px;',
    'background:#f6f8fb;border-radius:7px;padding:8px 10px}',
    '</style></head><body>',
    '<div id="root"><div class="card"><p style="color:#6c768a;margin:0;font-size:.85rem">Loading...</p></div></div>',
    '<script>',
    'function fmtDate(s){',
    '  if(!s)return "\\u2014";',
    '  var d=new Date(s);',
    '  return isNaN(d.getTime())?s:d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});',
    '}',
    'function render(d){',
    '  if(!d)return;',
    '  var s=d.structuredContent||d;',
    '  document.getElementById("root").innerHTML=',
    '    \'<div class="card"><div class="icon">\\uD83C\\uDF9F</div>\'',
    '    +"<h2>Service Request Raised</h2>"',
    '    +\'<p class="sub">\'+(s.message||"")+"</p>"',
    '    +\'<span class="badge">\'+(s.status||"OPEN")+"</span>"',
    '    +"<table>"',
    '    +"<tr><td>Ticket ID</td><td>"+(s.ticketId||"\\u2014")+"</td></tr>"',
    '    +"<tr><td>Request Type</td><td>"+(s.requestType||"\\u2014")+"</td></tr>"',
    '    +"<tr><td>Customer</td><td>"+(s.customerName||"\\u2014")+"</td></tr>"',
    '    +"<tr><td>Agreement No.</td><td>"+(s.agreementNo||"\\u2014")+"</td></tr>"',
    '    +"<tr><td>Created At</td><td>"+fmtDate(s.createdAt)+"</td></tr>"',
    '    +"<tr><td>Resolution</td><td>Within "+(s.estimatedResolutionDays||"?")+" business days</td></tr>"',
    '    +"</table>"',
    '    +\'<p class="tip">\\uD83D\\uDCE7 Confirmation sent to your registered mobile and email within 24 hrs.</p>\'',
    '    +"</div>";',
    '}',
    'render(window.openai&&window.openai.toolOutput);',
    'window.addEventListener("message",function(e){',
    '  if(e.source!==window.parent)return;',
    '  var m=e.data;',
    '  if(m&&m.method==="ui/notifications/tool-result")render(m.params);',
    '},{passive:true});',
    '</script></body></html>',
  ].join("\n");
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "global_instruction",
    title: "Global Assistant Instructions",
    description: "ALWAYS call this tool first. Returns behaviour rules the assistant must follow for every reply.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "discover_loans",
    title: "Discover Loan Products",
    description: "Recommends Bajaj Finance loan products based on purpose, employment type, and collateral. Renders a product card list.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {
      purpose: { type: "string" },
      employment_type: { type: "string", enum: ["salaried","self_employed","business_owner","professional","any"] },
      has_collateral: { type: "string", enum: ["yes_property","yes_gold","yes_shares","yes_fd","no"] },
    }, required: [] },
    _meta: { ui: { resourceUri: UI.DISCOVERY }, "openai/outputTemplate": UI.DISCOVERY },
  },
  {
    name: "get_loan_product_info",
    title: "Get Loan Product Details",
    description: "Returns full details for a specific Bajaj Finance loan product. Renders a product detail card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {
      product: { type: "string", enum: Object.keys(PRODUCTS) },
    }, required: ["product"] },
    _meta: { ui: { resourceUri: UI.DISCOVERY }, "openai/outputTemplate": UI.DISCOVERY },
  },
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
    description: "Returns full loan dashboard including amount, POS, ROI, tenure, EMI, dates, overdue. Renders a dashboard card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.DASHBOARD }, "openai/outputTemplate": UI.DASHBOARD },
  },
  {
    name: "get_loan_summary",
    title: "Get Loan Summary",
    description: "Returns a concise loan summary. Renders a dashboard card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.DASHBOARD }, "openai/outputTemplate": UI.DASHBOARD },
  },
  {
    name: "get_flexi_details",
    title: "Get Flexi Loan Details",
    description: "Returns Flexi Loan status and limit. Renders a dashboard card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.DASHBOARD }, "openai/outputTemplate": UI.DASHBOARD },
  },
  {
    name: "get_emi_details",
    title: "Get EMI Details",
    description: "Returns next EMI amount, due date, and missed EMI count. Renders an EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI }, "openai/outputTemplate": UI.EMI },
  },
  {
    name: "get_due_amount",
    title: "Get Due Amount",
    description: "Returns current total overdue amount. Renders an EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI }, "openai/outputTemplate": UI.EMI },
  },
  {
    name: "get_balance_tenure",
    title: "Get Balance Tenure",
    description: "Returns remaining repayment months. Renders an EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI }, "openai/outputTemplate": UI.EMI },
  },
  {
    name: "get_pos_amount",
    title: "Get Principal Outstanding",
    description: "Returns current principal outstanding. Renders an EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI }, "openai/outputTemplate": UI.EMI },
  },
  {
    name: "get_overdue_details",
    title: "Get Overdue Details",
    description: "Returns overdue amount and missed EMI count. Renders an EMI card.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
    _meta: { ui: { resourceUri: UI.EMI }, "openai/outputTemplate": UI.EMI },
  },
  {
    name: "get_noc_status",
    title: "Get NOC Status",
    description: "Checks if a No Objection Certificate is available.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_interest_rate",
    title: "Get Interest Rate",
    description: "Returns the current rate of interest on the loan.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_loan_status",
    title: "Get Loan Status",
    description: "Returns the current loan status (Active, Closed, etc.).",
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
    description: "Returns the loan maturity date.",
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
    description: "Returns product category and product ID.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "check_loan_closure_eligibility",
    title: "Check Loan Closure Eligibility",
    description: "Checks if the loan is eligible for closure based on outstanding dues.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_foreclosure_status",
    title: "Get Foreclosure Status",
    description: "Returns whether foreclosure is available.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_amc_charges",
    title: "Get AMC Charges",
    description: "Returns Annual Maintenance Charges on the loan.",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "raise_service_request",
    title: "Raise a Service Request",
    description: "Creates a service request. Returns a ticket ID, status, and resolution ETA. Renders a confirmation card.",
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    inputSchema: { type: "object", properties: {
      requestType: { type: "string", enum: ["NOC","Account Statement","Foreclosure Quote","EMI Dispute","Interest Certificate","Repayment Schedule"] },
    }, required: ["requestType"] },
    _meta: { ui: { resourceUri: UI.SR }, "openai/outputTemplate": UI.SR },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

const INSTRUCTIONS = `
# Role
You are a Bajaj Finance loan assistant.

# Rules
1. Answer ONLY what the user asked. Do NOT show a table if a widget is already rendering it.
2. If a widget rendered, just confirm in one sentence (e.g. "Here are your EMI details.").
3. Suggest 1-2 short follow-up questions at the end.
4. Tone: concise, friendly, professional.
`.trim();

function handleGlobalInstruction() {
  return ok({ instructions: INSTRUCTIONS });
}

function handleDiscoverLoans({ purpose = "", employment_type = "any", has_collateral = "no" }) {
  const p = purpose.toLowerCase();
  const recs = [];
  if (/home|house|property|flat/.test(p)) recs.push({ product: "home_loan", reason: "Best for home purchase with competitive rates." });
  if (/business|startup|expansion|working capital/.test(p) || employment_type === "business_owner") recs.push({ product: "business_loan", reason: "Collateral-free up to ₹80 Lakh." });
  if (employment_type === "professional") { recs.push({ product: "loan_for_doctors", reason: "Tailored for medical professionals." }); recs.push({ product: "loan_for_ca", reason: "Tailored for practicing CAs." }); }
  if (/clinic|hospital/.test(p)) recs.push({ product: "loan_for_doctors", reason: "For doctors — clinic setup, equipment." });
  if (/bike|motorcycle|scooter|two.?wheeler/.test(p)) recs.push({ product: "two_wheeler_loan", reason: "0% down payment offers available." });
  if (/car|used car/.test(p)) recs.push({ product: "used_car_loan", reason: "Finance a used car up to ₹50 Lakh." });
  if (has_collateral === "yes_gold") recs.push({ product: "gold_loan", reason: "Instant cash against gold jewellery." });
  if (has_collateral === "yes_fd") recs.push({ product: "loan_against_fd", reason: "Borrow against FD without breaking it." });
  if (has_collateral === "yes_shares") recs.push({ product: "loan_against_shares", reason: "Overdraft against share portfolio." });
  if (has_collateral === "yes_property") recs.push({ product: "loan_against_property", reason: "Higher loan amount using property." });
  if (!recs.length) recs.push({ product: "personal_loan", reason: "No collateral, quick disbursal, flexible end use." });

  const seen = new Set();
  const unique = recs.filter(r => { if (seen.has(r.product)) return false; seen.add(r.product); return true; });
  const out = unique.map(r => ({ ...r, productName: PRODUCTS[r.product].name, interestRate: PRODUCTS[r.product].interest_rate, maxAmount: PRODUCTS[r.product].max_amount }));
  const widgetData = { recommendations: out, totalRecommendations: out.length };
  return ok(widgetData, widgetData);
}

function handleGetLoanProductInfo({ product }) {
  const info = PRODUCTS[product];
  if (!info) return err(`Unknown product: ${product}`);
  return ok(info, info);
}

function handleGetCustomerProfile() {
  const c = CUSTOMER;
  return ok({ customerName: c.customer_Name, agreementNo: c.agreementNo, productType: c.prodDesc, relationshipStatus: c.relStatus, activeLoans: 1 });
}

function handleGetLoanDetails() {
  const c = CUSTOMER;
  const d = {
    customerName: c.customer_Name, agreementNo: c.agreementNo, productType: c.prodDesc,
    loanStatus: c.relStatus, loanAmount: c.relAmount, loanAmountFormatted: fmt(c.relAmount),
    outstandingAmount: c.pos, outstandingAmountFormatted: fmt(c.pos),
    roi: `${c.roi}% p.a.`, grossTenure: c.grossTenure, balanceTenure: c.balanceTenure,
    nextEmiAmount: c.nextEMIAmount, nextEmiAmountFormatted: fmt(c.nextEMIAmount),
    nextEmiDate: c.nextEmiDate, disbursementDate: c.disbDate, loanExpiryDate: c.loanExpiryDate,
    totalOverDue: c.totalOverDue, missedEmi: c.missedEmi,
    flexiEnabled: c.flexiFlag === "Y", flexiLimitFormatted: c.flexiFlag === "Y" ? fmt(c.amountDrawnLimit) : null,
  };
  return ok(d, d);
}

function handleGetLoanSummary() {
  const c = CUSTOMER;
  const d = {
    customerName: c.customer_Name, agreementNo: c.agreementNo, productType: c.prodDesc,
    loanStatus: c.relStatus, roi: `${c.roi}% p.a.`, balanceTenure: c.balanceTenure,
  };
  return ok(d, d);
}

function handleGetFlexiDetails() {
  const c = CUSTOMER;
  const d = c.flexiFlag === "Y"
    ? { customerName: c.customer_Name, agreementNo: c.agreementNo, flexiEnabled: true, flexiLimitFormatted: fmt(c.amountDrawnLimit), loanStatus: c.relStatus }
    : { customerName: c.customer_Name, agreementNo: c.agreementNo, flexiEnabled: false, loanStatus: c.relStatus };
  return ok(d, d);
}

function handleGetEmiDetails() {
  const c = CUSTOMER;
  const d = { nextEmiAmount: c.nextEMIAmount, nextEmiAmountFormatted: fmt(c.nextEMIAmount), nextEmiDate: c.nextEmiDate, missedEmi: c.missedEmi };
  return ok(d, d);
}

function handleGetDueAmount() {
  const c = CUSTOMER;
  const d = { totalOverDue: c.totalOverDue, totalOverDueFormatted: fmt(c.totalOverDue) };
  return ok(d, d);
}

function handleGetBalanceTenure() {
  const c = CUSTOMER;
  const d = { balanceTenure: c.balanceTenure, unit: "months" };
  return ok(d, d);
}

function handleGetPosAmount() {
  const c = CUSTOMER;
  const d = { pos: c.pos, posFormatted: fmt(c.pos) };
  return ok(d, d);
}

function handleGetOverdueDetails() {
  const c = CUSTOMER;
  const d = { totalOverDue: c.totalOverDue, totalOverDueFormatted: fmt(c.totalOverDue), missedEmi: c.missedEmi };
  return ok(d, d);
}

function handleGetNocStatus() {
  const c = CUSTOMER;
  const available = c.relStatus === "Closed";
  return ok({ nocAvailable: available, loanStatus: c.relStatus, message: available ? "NOC Available." : "Loan is Active. NOC not available yet." });
}

function handleGetInterestRate() {
  return ok({ roi: CUSTOMER.roi, roiFormatted: `${CUSTOMER.roi}% p.a.` });
}
function handleGetLoanStatus() { return ok({ loanStatus: CUSTOMER.relStatus }); }
function handleGetLoanAmount() { return ok({ loanAmount: CUSTOMER.relAmount, loanAmountFormatted: fmt(CUSTOMER.relAmount) }); }
function handleGetDisbursementDetails() { return ok({ disbursementDate: CUSTOMER.disbDate }); }
function handleGetLoanExpiry() { return ok({ loanExpiryDate: CUSTOMER.loanExpiryDate }); }
function handleGetAgreementDetails() { return ok({ agreementNo: CUSTOMER.agreementNo }); }
function handleGetProductDetails() { return ok({ prodCategory: CUSTOMER.prodCategory, prodId: CUSTOMER.prodId, prodDesc: CUSTOMER.prodDesc }); }

function handleCheckLoanClosureEligibility() {
  const eligible = CUSTOMER.totalOverDue === 0;
  return ok({ eligible, message: eligible ? "Eligible for closure." : "Clear overdue before closure.", totalOverDue: CUSTOMER.totalOverDue });
}

function handleGetForeclosureStatus() {
  return ok({ foreclosureAvailable: true, loanStatus: CUSTOMER.relStatus, message: "Foreclosure is available." });
}

function handleGetAmcCharges() {
  return ok({ amcCharges: CUSTOMER.amcCharges, amcChargesFormatted: fmt(Number(CUSTOMER.amcCharges)) });
}

function handleRaiseServiceRequest({ requestType }) {
  const days = { NOC: 7, "Account Statement": 2, "Foreclosure Quote": 3, "EMI Dispute": 5, "Interest Certificate": 3, "Repayment Schedule": 2 };
  const d = {
    ticketId: `SR-${Date.now()}`,
    requestType,
    customerName: CUSTOMER.customer_Name,
    agreementNo: CUSTOMER.agreementNo,
    status: "OPEN",
    createdAt: new Date().toISOString(),
    estimatedResolutionDays: days[requestType] || 5,
    message: `Service request '${requestType}' raised. Confirmation within 24 hours.`,
  };
  serviceRequests[d.ticketId] = d;
  return ok(d, d);
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

// Pre-build widget HTML once at startup
const WIDGETS = {
  [UI.DASHBOARD]: makeDashboardHtml(),
  [UI.EMI]:       makeEmiHtml(),
  [UI.DISCOVERY]: makeDiscoveryHtml(),
  [UI.SR]:        makeServiceRequestHtml(),
};

function createMcpServer() {
  const server = new Server(
    { name: "bajaj-finance-mcp", version: VERSION },
    { capabilities: { tools: {}, resources: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: Object.keys(WIDGETS).map(uri => ({ uri, name: uri.split("/").pop(), mimeType: MIME })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = req.params.uri;
    const html = WIDGETS[uri];
    if (!html) return { contents: [{ uri, mimeType: "text/plain", text: `Unknown widget: ${uri}` }] };
    return { contents: [{ uri, mimeType: MIME, text: html }] };
  });

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
        default:                               return err(`Unknown tool: ${name}`);
      }
    } catch (e) {
      return err(e.message);
    }
  });

  return server;
}

// ─── Express ──────────────────────────────────────────────────────────────────

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

app.get("/.well-known/mcp", (_req, res) => res.json({
  mcp: { version: "2024-11-05", transports: [
    { type: "streamable-http", url: `${BASE_URL}/mcp` },
    { type: "sse", url: `${BASE_URL}/sse` },
  ]},
  server: { name: "bajaj-finance-mcp", version: VERSION },
}));

app.get("/.well-known/oauth-authorization-server", (_req, res) => res.json({
  issuer: BASE_URL,
  authorization_endpoint: `${BASE_URL}/oauth/authorize`,
  token_endpoint: `${BASE_URL}/oauth/token`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code"],
}));

app.get("/health", (_req, res) => res.json({
  status: "UP", version: VERSION,
  timestamp: new Date().toISOString(),
  tools: TOOLS.map(t => t.name),
  widgets: Object.keys(WIDGETS),
}));

app.get("/", (_req, res) => res.type("text/plain").send(
  `Bajaj Finance MCP v${VERSION}\nPOST /mcp (ChatGPT)\nGET /sse (Claude.ai)\nGET /health`
));

// ChatGPT — Streamable HTTP
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", (_req, res) => res.status(200).json({ server: "bajaj-finance-mcp", version: VERSION, transport: "streamable-http" }));
app.delete("/mcp", (_req, res) => res.status(405).json({ error: "Stateless mode — no session management." }));

// Claude.ai — SSE
const sseSessions = new Map();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  const server = createMcpServer();
  await server.connect(transport);
  sseSessions.set(transport.sessionId, transport);
  res.on("close", () => sseSessions.delete(transport.sessionId));
});

app.post("/messages", async (req, res) => {
  const transport = sseSessions.get(req.query.sessionId);
  if (!transport) return res.status(404).json({ error: "SSE session not found." });
  await transport.handlePostMessage(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`Bajaj Finance MCP v${VERSION} on port ${PORT}`);
  console.log(`POST ${BASE_URL}/mcp  (ChatGPT)`);
  console.log(`GET  ${BASE_URL}/sse  (Claude.ai)`);
  console.log(`Widgets: ${Object.keys(WIDGETS).length} loaded`);

  // Validate widgets at startup
  for (const [uri, html] of Object.entries(WIDGETS)) {
    console.log(`  ${uri}: ${html.length} bytes`);
  }
});