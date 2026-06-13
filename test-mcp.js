/**
 * Test runner for Bajaj Finance MCP Server
 * Validates all 12 test cases against the local server on port 8080
 */

const BASE = "http://localhost:8080";
let passed = 0;
let failed = 0;

// ─── Helper: call a tool via POST /mcp ────────────────────────────────────────

async function callTool(toolName, args = {}) {
  const body = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 100000),
    method: "tools/call",
    params: { name: toolName, arguments: args },
  };

  const res = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  // Streamable HTTP returns SSE format: "event: message\ndata: {...}\n\n"
  // Extract the last data: line (may have multiple events in one response)
  const dataLines = text
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim())
    .filter(Boolean);

  let jsonText = dataLines.length > 0 ? dataLines[dataLines.length - 1] : text.trim();
  const rpcResponse = JSON.parse(jsonText);
  const resultContent = rpcResponse?.result?.content?.[0]?.text;
  if (!resultContent) return { success: false, error: "No content in response", _raw: rpcResponse };
  return JSON.parse(resultContent);
}

// ─── Helper: GET request ──────────────────────────────────────────────────────

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`);
  return res.json();
}

// ─── Test runner ──────────────────────────────────────────────────────────────

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runTest(number, name, fn) {
  try {
    await fn();
    console.log(`  PASS  TEST ${number}: ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  TEST ${number}: ${name}`);
    console.log(`        → ${err.message}`);
    failed++;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Bajaj Finance MCP Server — Test Suite ===\n");

  // TEST 1 — Public: discover_loans
  await runTest(1, "discover_loans — home purchase with collateral", async () => {
    const result = await callTool("discover_loans", {
      purpose: "home purchase",
      employment_type: "salaried",
      has_collateral: "yes_property",
    });
    assert(result.success === true, `Expected success: true, got: ${result.success}`);
    assert(
      Array.isArray(result.data?.recommendations) && result.data.recommendations.length > 0,
      `Expected at least one recommendation, got: ${JSON.stringify(result.data?.recommendations)}`
    );
    console.log(`        → ${result.data.recommendations.length} recommendations returned`);
  });

  // TEST 2 — Public: get_loan_product_info
  await runTest(2, "get_loan_product_info — personal_loan", async () => {
    const result = await callTool("get_loan_product_info", { product: "personal_loan" });
    assert(result.success === true, `Expected success: true, got: ${result.success}`);
    assert(result.data?.name, `Expected name field, got: ${JSON.stringify(result.data)}`);
    assert(result.data?.interest_rate, `Expected interest_rate field`);
    assert(result.data?.apply_now, `Expected apply_now URL`);
    assert(result.data.apply_now.startsWith("http"), `apply_now should be a URL, got: ${result.data.apply_now}`);
    console.log(`        → name: "${result.data.name}", rate: ${result.data.interest_rate}`);
  });

  // TEST 3 — send_otp with valid number
  await runTest(3, "send_otp — valid number 9999999999", async () => {
    const result = await callTool("send_otp", { mobileNumber: "9999999999" });
    assert(result.success === true, `Expected success: true, got: ${result.success}`);
    assert(result.data?.otpSent === true, `Expected otpSent: true, got: ${result.data?.otpSent}`);
    console.log(`        → otpSent: ${result.data.otpSent}, demoOtp: ${result.data.demoOtp}`);
  });

  // TEST 4 — send_otp with invalid number
  await runTest(4, "send_otp — invalid number 1111111111", async () => {
    const result = await callTool("send_otp", { mobileNumber: "1111111111" });
    assert(result.success === false, `Expected success: false, got: ${result.success}`);
    assert(result.error, `Expected error message, got: ${JSON.stringify(result)}`);
    console.log(`        → error: "${result.error}"`);
  });

  // TEST 5 — get_loan_details with correct OTP
  await runTest(5, "get_loan_details — correct OTP, Vikas", async () => {
    const result = await callTool("get_loan_details", { mobileNumber: "9999999999", otp: "123456" });
    assert(result.success === true, `Expected success: true, got: ${result.success}`);
    assert(result.data?.customerName === "Vikas Singh Rathaur", `Expected "Vikas Singh Rathaur", got: "${result.data?.customerName}"`);
    const loan = result.data?.loans?.[0];
    assert(loan?.loanStatus === "Active", `Expected loanStatus "Active", got: "${loan?.loanStatus}"`);
    console.log(`        → customerName: "${result.data.customerName}", loanStatus: "${loan.loanStatus}"`);
  });

  // TEST 6 — get_loan_details with wrong OTP
  await runTest(6, "get_loan_details — wrong OTP 000000", async () => {
    const result = await callTool("get_loan_details", { mobileNumber: "9999999999", otp: "000000" });
    assert(result.success === false, `Expected success: false, got: ${result.success}`);
    assert(result.error, `Expected error message, got: ${JSON.stringify(result)}`);
    console.log(`        → error: "${result.error}"`);
  });

  // TEST 7 — get_customer_profile — Rahul Sharma
  await runTest(7, "get_customer_profile — Rahul Sharma 8888888888", async () => {
    const result = await callTool("get_customer_profile", { mobileNumber: "8888888888", otp: "123456" });
    assert(result.success === true, `Expected success: true, got: ${result.success}`);
    assert(result.data?.customerName === "Rahul Sharma", `Expected "Rahul Sharma", got: "${result.data?.customerName}"`);
    assert(
      result.data?.activeProducts?.includes("Home Loan"),
      `Expected activeProducts to include "Home Loan", got: ${JSON.stringify(result.data?.activeProducts)}`
    );
    console.log(`        → customerName: "${result.data.customerName}", products: ${JSON.stringify(result.data.activeProducts)}`);
  });

  // TEST 8 — get_flexi_details — Flexi enabled (Vikas)
  await runTest(8, "get_flexi_details — Flexi enabled (Vikas 9999999999)", async () => {
    const result = await callTool("get_flexi_details", { mobileNumber: "9999999999", otp: "123456" });
    assert(result.success === true, `Expected success: true, got: ${result.success}`);
    assert(result.data?.flexiEnabled === true, `Expected flexiEnabled: true, got: ${result.data?.flexiEnabled}`);
    console.log(`        → flexiEnabled: ${result.data.flexiEnabled}, limit: ${result.data.flexiLimitFormatted}`);
  });

  // TEST 9 — get_flexi_details — Flexi disabled (Rahul)
  await runTest(9, "get_flexi_details — Flexi disabled (Rahul 8888888888)", async () => {
    const result = await callTool("get_flexi_details", { mobileNumber: "8888888888", otp: "123456" });
    assert(result.success === true, `Expected success: true, got: ${result.success}`);
    assert(result.data?.flexiEnabled === false, `Expected flexiEnabled: false, got: ${result.data?.flexiEnabled}`);
    console.log(`        → flexiEnabled: ${result.data.flexiEnabled}`);
  });

  // TEST 10 — raise_service_request
  await runTest(10, "raise_service_request — NOC for Vikas", async () => {
    const result = await callTool("raise_service_request", {
      mobileNumber: "9999999999",
      otp: "123456",
      requestType: "NOC",
    });
    assert(result.success === true, `Expected success: true, got: ${result.success}`);
    assert(result.data?.ticketId?.startsWith("SR-"), `Expected ticketId starting with "SR-", got: "${result.data?.ticketId}"`);
    assert(result.data?.status === "OPEN", `Expected status "OPEN", got: "${result.data?.status}"`);
    console.log(`        → ticketId: "${result.data.ticketId}", status: "${result.data.status}"`);
  });

  // TEST 11 — Discovery endpoint
  await runTest(11, "Discovery — /.well-known/mcp", async () => {
    const data = await getJson("/.well-known/mcp");
    assert(
      Array.isArray(data?.mcp?.transports) && data.mcp.transports.length > 0,
      `Expected mcp.transports array, got: ${JSON.stringify(data?.mcp?.transports)}`
    );
    const hasPostMcp = data.mcp.transports.some((t) => t.url?.includes("/mcp"));
    assert(hasPostMcp, `Expected a transport URL containing /mcp, got: ${JSON.stringify(data.mcp.transports)}`);
    console.log(`        → ${data.mcp.transports.length} transports, first: ${data.mcp.transports[0].url}`);
  });

  // TEST 12 — Health check
  await runTest(12, "Health check — GET /health", async () => {
    const data = await getJson("/health");
    assert(data?.status === "UP", `Expected status "UP", got: "${data?.status}"`);
    assert(Array.isArray(data?.tools) && data.tools.length === 7, `Expected 7 tools, got: ${data?.tools?.length}`);
    console.log(`        → status: "${data.status}", tools: ${data.tools.length} (${data.tools.join(", ")})`);
  });

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);

  if (failed === 0) {
    console.log("\nALL TESTS PASSED — ready to deploy to Render");
  } else {
    console.log(`\n${failed} test(s) FAILED — fix server and re-run`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running tests:", err.message);
  process.exit(1);
});
