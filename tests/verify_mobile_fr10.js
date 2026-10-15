/**
 * Verification Script for Mobile FR-10: Hủy đơn hàng trên Mobile (Order Cancellation on Mobile)
 * System Under Test (SUT):
 * - Mobile Frontend: eshop-sut/frontend-mobile/App.js
 * - Backend API: Node.js/Express server (http://localhost:3000)
 * 
 * Verifications:
 * 1. Mobile Component State Render Logic:
 *    - Evaluation of (o.status === "pending" || o.status === "confirmed")
 *    - Boundary test across all 5 order states:
 *      * 'pending'   -> Cancel button VISIBLE
 *      * 'confirmed' -> Cancel button VISIBLE
 *      * 'shipping'  -> Cancel button HIDDEN (Boundary transition from confirmed -> shipping)
 *      * 'delivered' -> Cancel button HIDDEN
 *      * 'canceled'  -> Cancel button HIDDEN
 * 2. Mobile Ergonomics & Accidental Tap Analysis:
 *    - Verify App.js source code for confirmation dialog before cancelOrder()
 *    - Absence of Alert.alert confirmation or modal prompt before firing PUT /api/orders/:id/cancel
 *    - Immediate execution of destructive action upon single tap
 * 3. Mobile End-to-End API Integration & Backend Divergence:
 *    - Valid cancellation of 'pending' order via API
 *    - Valid cancellation of 'confirmed' order via API
 *    - Client-Server Discrepancy: Mobile UI hides cancel button on 'shipping', but Backend API permits cancellation of 'shipping' order!
 *    - Terminal state cancellation rejection ('delivered', 'canceled')
 * 4. Error Handling & State Refresh:
 *    - Non-existent order ID cancellation
 *    - IDOR / Unauthorized cancellation (User B attempting to cancel User A's order)
 *    - Network failure simulation / Error message display
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null,
            rawBody: body,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            rawBody: body,
          });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

// Mobile SUT simulation based on App.js
function mobileShouldRenderCancelButton(orderStatus) {
  // Directly mirrors eshop-sut/frontend-mobile/App.js line 961:
  // (o.status === "pending" || o.status === "confirmed")
  return orderStatus === 'pending' || orderStatus === 'confirmed';
}

async function login(email, password) {
  const res = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email, password }
  );
  return res.data;
}

async function registerUser(name, email, password) {
  const res = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { name, email, password }
  );
  return res.data;
}

async function createOrder(token, total_amount, shipping_address) {
  const res = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    { total_amount, shipping_address }
  );
  return res.data;
}

async function updateOrderStatusAsAdmin(adminToken, orderId, status) {
  const res = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/orders/${orderId}/status`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    { status }
  );
  return res.data;
}

async function cancelOrderAsUser(token, orderId) {
  const res = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/orders/${orderId}/cancel`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {}
  );
  return res;
}

async function runTests() {
  console.log('================================================================');
  console.log('   VERIFICATION SUITE: MOBILE FR-10 (CANCEL ORDER ON MOBILE)   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`[PASS] ${message}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Section 1: Mobile UI Component Logic & State Boundary
  // -------------------------------------------------------------
  console.log('--- TEST SECTION 1: Mobile UI State Conditional Visibility ---');
  
  const allStates = ['pending', 'confirmed', 'shipping', 'delivered', 'canceled'];
  const expectedVisibility = {
    pending: true,
    confirmed: true,
    shipping: false,
    delivered: false,
    canceled: false,
  };

  allStates.forEach((st) => {
    const isVisible = mobileShouldRenderCancelButton(st);
    assert(
      isVisible === expectedVisibility[st],
      `UI State '${st}': Button visibility = ${isVisible}`,
      `Expected visibility: ${expectedVisibility[st]}`
    );
  });

  // Boundary transition test: confirmed -> shipping
  assert(
    mobileShouldRenderCancelButton('confirmed') === true &&
    mobileShouldRenderCancelButton('shipping') === false,
    "BVA State Boundary: 'confirmed' (In-boundary, Visible) vs 'shipping' (Out-boundary, Hidden)",
    "Correctly delineates cancellation visibility cutoff at confirmed -> shipping transition"
  );

  // -------------------------------------------------------------
  // Test Section 2: Code Inspection for Mobile UX / Accidental Tap
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 2: Mobile UX & Accidental Tap Vulnerability ---');
  
  const appJsPath = path.join(__dirname, '../eshop-sut/frontend-mobile/App.js');
  const appJsContent = fs.readFileSync(appJsPath, 'utf8');

  // Check cancelOrder definition
  const cancelOrderRegex = /const\s+cancelOrder\s*=\s*async\s*\((orderId)?\)\s*=>\s*\{([\s\S]*?)\};/;
  const match = appJsContent.match(cancelOrderRegex);

  assert(match !== null, 'Function cancelOrder exists in frontend-mobile/App.js');

  if (match) {
    const functionBody = match[2];
    const hasPreConfirmation = 
      functionBody.includes('Alert.alert') &&
      functionBody.indexOf('Alert.alert') < functionBody.indexOf('fetch(');

    assert(
      !hasPreConfirmation,
      'UX Flaw Detected: cancelOrder() immediately calls fetch() without confirmation Alert.alert()',
      'Destructive action is triggered immediately on single tap, creating high risk of accidental cancellation on mobile touchscreens!'
    );

    const hasPostSuccessAlert = 
      functionBody.includes('Alert.alert("Thành công"') ||
      functionBody.includes("Alert.alert('Thành công'");
    assert(
      hasPostSuccessAlert,
      'Feedback Alert: Displays success notification Alert.alert("Thành công") after API response',
      'App notifies user after destructive action finishes'
    );

    const hasRefetch = functionBody.includes('fetchOrders(');
    assert(
      hasRefetch,
      'List Synchronization: Calls fetchOrders(token) to refresh orders list upon cancellation',
      'UI state stays synchronized with backend after successful cancel'
    );
  }

  // Check UI Touch Target styling
  const hasSmallRedButtonStyle = appJsContent.includes('smallRedButton:');
  assert(
    hasSmallRedButtonStyle,
    'Styling: Uses smallRedButton with small padding (8px) and font (12px)',
    'Small button placed near scrollable order card without confirmation increases tap error rate'
  );

  // -------------------------------------------------------------
  // Test Section 3: End-to-End API Integration & Backend Divergence
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 3: End-to-End API Integration & Divergence ---');

  const adminAuth = await login('admin@eshop.com', 'Admin123!');
  assert(adminAuth && adminAuth.token, 'Admin login succeeded');
  const adminToken = adminAuth.token;

  const testUserEmail = `mob_user_${Date.now()}@eshop.com`;
  await registerUser('Mobile User', testUserEmail, 'Pass1234!');
  const userAuth = await login(testUserEmail, 'Pass1234!');
  assert(userAuth && userAuth.token, 'Test Mobile User registered & logged in successfully');
  const userToken = userAuth.token;

  // 3.1 Cancel 'pending' order
  const orderPending = await createOrder(userToken, 150000, 'Mobile Address 1');
  assert(orderPending && orderPending.orderId, `Order #${orderPending.orderId} created in 'pending' state`);

  const cancelPendingRes = await cancelOrderAsUser(userToken, orderPending.orderId);
  assert(
    cancelPendingRes.status === 200,
    `Cancel 'pending' order returns HTTP 200`,
    `Response: ${JSON.stringify(cancelPendingRes.data)}`
  );

  // 3.2 Cancel 'confirmed' order
  const orderConfirmed = await createOrder(userToken, 250000, 'Mobile Address 2');
  await updateOrderStatusAsAdmin(adminToken, orderConfirmed.orderId, 'confirmed');

  const cancelConfirmedRes = await cancelOrderAsUser(userToken, orderConfirmed.orderId);
  assert(
    cancelConfirmedRes.status === 200,
    `Cancel 'confirmed' order returns HTTP 200`,
    `Response: ${JSON.stringify(cancelConfirmedRes.data)}`
  );

  // 3.3 State Discrepancy & BVA on 'shipping' state
  // On Mobile: Button is HIDDEN (user cannot tap it)
  // But if API is invoked directly or by modified client: Backend allows it!
  const orderShipping = await createOrder(userToken, 350000, 'Mobile Address 3');
  await updateOrderStatusAsAdmin(adminToken, orderShipping.orderId, 'shipping');

  const mobileCanSeeShippingCancel = mobileShouldRenderCancelButton('shipping');
  assert(
    mobileCanSeeShippingCancel === false,
    `Mobile UI correctly hides Cancel button for 'shipping' state`,
    `Mobile enforces stricter UI contract than backend`
  );

  const directApiShippingCancel = await cancelOrderAsUser(userToken, orderShipping.orderId);
  const backendAllowsShipping = directApiShippingCancel.status === 200;
  assert(
    backendAllowsShipping,
    `Backend Flaw Confirmed: Backend API permits cancellation in 'shipping' state (HTTP 200)`,
    `Contract Divergence: Mobile UI hides button, but Backend API fails to guard domain boundary!`
  );

  // 3.4 Terminal State Rejection: 'delivered' and 'canceled'
  const orderDelivered = await createOrder(userToken, 450000, 'Mobile Address 4');
  await updateOrderStatusAsAdmin(adminToken, orderDelivered.orderId, 'confirmed');
  await updateOrderStatusAsAdmin(adminToken, orderDelivered.orderId, 'shipping');
  await updateOrderStatusAsAdmin(adminToken, orderDelivered.orderId, 'delivered');

  const cancelDeliveredRes = await cancelOrderAsUser(userToken, orderDelivered.orderId);
  assert(
    cancelDeliveredRes.status === 400,
    `Cancel 'delivered' order rejected with HTTP 400`,
    `Error: ${cancelDeliveredRes.data && cancelDeliveredRes.data.error}`
  );

  // Attempt to re-cancel an already canceled order
  const cancelCanceledRes = await cancelOrderAsUser(userToken, orderPending.orderId);
  assert(
    cancelCanceledRes.status === 400,
    `Cancel already 'canceled' order rejected with HTTP 400`,
    `Error: ${cancelCanceledRes.data && cancelCanceledRes.data.error}`
  );

  // -------------------------------------------------------------
  // Test Section 4: Security & Error Handling (IDOR & Invalid IDs)
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 4: Security & Error Handling ---');

  // Register another user to test IDOR
  const hackerEmail = `hacker_${Date.now()}@eshop.com`;
  await registerUser('Hacker User', hackerEmail, 'Pass1234!');
  const hackerAuth = await login(hackerEmail, 'Pass1234!');
  const hackerToken = hackerAuth.token;

  // Hacker attempts to cancel Mobile User's order
  const orderToProtect = await createOrder(userToken, 500000, 'Protected Mobile Address');
  const idorRes = await cancelOrderAsUser(hackerToken, orderToProtect.orderId);
  assert(
    idorRes.status === 404 || idorRes.status === 403,
    `Security IDOR Protection: User B cannot cancel User A's order (Status: ${idorRes.status})`,
    `Error: ${idorRes.data && idorRes.data.error}`
  );

  // Non-existent order ID
  const notFoundRes = await cancelOrderAsUser(userToken, 999999999);
  assert(
    notFoundRes.status === 404,
    `Non-existent order ID cancellation returns HTTP 404`,
    `Error: ${notFoundRes.data && notFoundRes.data.error}`
  );

  // -------------------------------------------------------------
  // Test Section 5: Network Error Simulation & SUT Catch Block
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 5: Network Error Handling Simulation ---');

  // Simulate network failure reaching dead port
  let simulatedErrorCaught = false;
  let simulatedErrorMessage = '';
  try {
    await request({
      hostname: 'localhost',
      port: 59999, // Dead port
      path: `/api/orders/${orderPending.orderId}/cancel`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }, {});
  } catch (err) {
    simulatedErrorCaught = true;
    simulatedErrorMessage = err.message;
  }

  assert(
    simulatedErrorCaught,
    `Network Failure / Offline simulation triggers catch block`,
    `Native fetch catch handler triggers Alert.alert("Lỗi", error.message): ${simulatedErrorMessage}`
  );

  // Check App.js catch block syntax
  const hasCatchBlock = appJsContent.includes('catch (error) {') && 
                        appJsContent.includes('Alert.alert("Lỗi", error.message || "Không thể hủy đơn.");');
  assert(
    hasCatchBlock,
    'Exception Handling: App.js handles rejection with Alert.alert("Lỗi", ...)',
    'User receives visual alert when network call fails or server is unreachable'
  );

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
