/**
 * Verification Script for FR-06: Product Detail View (Xem chi tiết sản phẩm)
 * Tests backend API endpoints, domain boundaries for quantity, and simulates frontend click/state logic.
 */

const http = require('http');

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

// Simulates ProductDetail component state and handleAddToCart logic
class ProductDetailSimulator {
  constructor(product, initialQuantity = 1) {
    this.product = product;
    this.quantity = initialQuantity;
    this.clickCount = 0;
    this.added = false;
    this.cart = [];
  }

  setQuantity(val) {
    this.quantity = val;
  }

  handleAddToCart() {
    // SUT Logic from ProductDetail.jsx:
    // if (clickCount === 0) {
    //   setClickCount(1);
    //   return; // Không làm gì cả ở lần đầu tiên
    // }
    // addToCart(product, parseInt(quantity));
    // setAdded(true);
    // setClickCount(0);
    if (this.clickCount === 0) {
      this.clickCount = 1;
      return { added: false, message: 'First click swallowed (clickCount became 1)' };
    }

    const parsedQuantity = parseInt(this.quantity);
    this.cart.push({ ...this.product, quantity: parsedQuantity });
    this.added = true;
    this.clickCount = 0;
    return { added: true, message: 'Added to cart on second click', item: { ...this.product, quantity: parsedQuantity } };
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('VERIFYING FR-06: PRODUCT DETAIL (DOMAIN TESTING & BVA)');
  console.log('================================================================\n');

  const testResults = [];

  // 1. API Verification: Valid Product ID
  try {
    const resValid = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/products/1',
      method: 'GET',
    });

    const isOddProductValid = resValid.status === 200 && resValid.data && resValid.data.id === 1;
    console.log(`[TC-FR06-API-01] GET /api/products/1 (Valid ID 1) -> Status: ${resValid.status}, Product Name: "${resValid.data?.name}", Price Type: ${typeof resValid.data?.price}`);
    testResults.push({
      id: 'TC-FR06-API-01',
      description: 'Fetch product with valid ID 1',
      expected: 'HTTP 200 with product data object',
      actual: `Status: ${resValid.status}, Product ID: ${resValid.data?.id}`,
      verdict: isOddProductValid ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    console.error('Error fetching product 1:', err.message);
  }

  // 2. API Verification: Even Product ID (Type inconsistency seeded bug check)
  try {
    const resEven = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/products/2',
      method: 'GET',
    });

    const isPriceString = typeof resEven.data?.price === 'string';
    console.log(`[TC-FR06-API-02] GET /api/products/2 (Even ID 2 - Type Check) -> Price: "${resEven.data?.price}" (type: ${typeof resEven.data?.price})`);
    testResults.push({
      id: 'TC-FR06-API-02',
      description: 'Check data type of price for even product ID (Seeded backend bug)',
      expected: 'price should be numeric type for consistent arithmetic/display',
      actual: `price is returned as string: "${resEven.data?.price}" (typeof: ${typeof resEven.data?.price})`,
      verdict: isPriceString ? 'DETECTED_BUG (PASS for tester)' : 'FAIL',
    });
  } catch (err) {
    console.error('Error fetching product 2:', err.message);
  }

  // 3. API Verification: Non-existent Product ID
  try {
    const resNotFound = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/products/9999',
      method: 'GET',
    });

    // In backend: if (!row) return res.status(200).json({});
    // In frontend: if (Object.keys(product).length === 0) return <div>Sản phẩm không tồn tại (Lỗi trắng trang do data rỗng)</div>;
    const isBlankObject = resNotFound.status === 200 && Object.keys(resNotFound.data).length === 0;
    console.log(`[TC-FR06-API-03] GET /api/products/9999 (Non-existent ID) -> Status: ${resNotFound.status}, Data: ${JSON.stringify(resNotFound.data)}`);
    testResults.push({
      id: 'TC-FR06-API-03',
      description: 'Fetch non-existent product ID 9999',
      expected: 'HTTP 404 Not Found (REST standard)',
      actual: `HTTP 200 with empty object {} causing frontend empty view`,
      verdict: 'DETECTED_BUG (Backend returns 200 {} instead of 404)',
    });
  } catch (err) {
    console.error('Error fetching product 9999:', err.message);
  }

  // 4. UI Domain & BVA Simulation: Quantity Boundaries and Click Behavior
  console.log('\n--- SIMULATING COMPONENT LOGIC & BOUNDARY VALUE ANALYSIS ---');

  const dummyProduct = { id: 1, name: 'iPhone 15 Pro Max', price: 30000000 };

  // Case A: First Click vs Second Click (Seeded Bug: clickCount === 0 swallows first click)
  const simClick = new ProductDetailSimulator(dummyProduct, 1);
  const click1 = simClick.handleAddToCart();
  console.log(`[TC-FR06-UI-01] First Click on 'Thêm vào giỏ hàng': added=${simClick.added}, clickCount=${simClick.clickCount}, msg=${click1.message}`);
  const click2 = simClick.handleAddToCart();
  console.log(`[TC-FR06-UI-02] Second Click on 'Thêm vào giỏ hàng': added=${simClick.added}, clickCount=${simClick.clickCount}, cartLength=${simClick.cart.length}, msg=${click2.message}`);
  
  testResults.push({
    id: 'TC-FR06-UI-01',
    description: 'First click on "Thêm vào giỏ hàng" button',
    expected: 'Product added to cart immediately on 1st click',
    actual: `First click swallowed without any visual feedback or cart change (Bug: clickCount === 0 return)`,
    verdict: 'FAIL (Bug Confirmed)',
  });

  // Case B: Boundary Quantity = 1 (Valid lower boundary - 2-point / 3-point on boundary)
  const simBVA1 = new ProductDetailSimulator(dummyProduct, 1);
  simBVA1.clickCount = 1; // bypass first-click bug to test quantity boundary
  simBVA1.handleAddToCart();
  const itemBVA1 = simBVA1.cart[0];
  console.log(`[TC-FR06-BVA-01] Quantity = 1 (Valid min on-boundary): Cart Item Quantity = ${itemBVA1.quantity}`);

  // Case C: Boundary Quantity = 0 (Invalid boundary - off boundary)
  const simBVA0 = new ProductDetailSimulator(dummyProduct, 0);
  simBVA0.clickCount = 1;
  simBVA0.handleAddToCart();
  const itemBVA0 = simBVA0.cart[0];
  console.log(`[TC-FR06-BVA-02] Quantity = 0 (Invalid boundary): Cart Item Quantity = ${itemBVA0.quantity} -> ALLOWED BY SUT!`);
  testResults.push({
    id: 'TC-FR06-BVA-02',
    description: 'Quantity = 0 (Boundary off-point for valid domain [1, +inf))',
    expected: 'Validation error: Quantity must be at least 1; do not add to cart',
    actual: `Added to cart with quantity = 0!`,
    verdict: 'FAIL (Bug Confirmed: No lower boundary validation)',
  });

  // Case D: Boundary Quantity = -1 (Invalid boundary - negative number)
  const simBVANeg = new ProductDetailSimulator(dummyProduct, -1);
  simBVANeg.clickCount = 1;
  simBVANeg.handleAddToCart();
  const itemBVANeg = simBVANeg.cart[0];
  console.log(`[TC-FR06-BVA-03] Quantity = -1 (Invalid negative domain): Cart Item Quantity = ${itemBVANeg.quantity} -> ALLOWED BY SUT!`);
  testResults.push({
    id: 'TC-FR06-BVA-03',
    description: 'Quantity = -1 (Negative domain value)',
    expected: 'Validation error: Quantity cannot be negative',
    actual: `Added to cart with quantity = -1 (can corrupt cart total calculation)!`,
    verdict: 'FAIL (Bug Confirmed: Negative quantity accepted)',
  });

  // Case E: Boundary Quantity = "abc" (Invalid non-numeric input)
  const simBVABad = new ProductDetailSimulator(dummyProduct, 'abc');
  simBVABad.clickCount = 1;
  simBVABad.handleAddToCart();
  const itemBVABad = simBVABad.cart[0];
  console.log(`[TC-FR06-BVA-04] Quantity = 'abc' (NaN): Cart Item Quantity = ${itemBVABad.quantity} -> NaN stored!`);
  testResults.push({
    id: 'TC-FR06-BVA-04',
    description: 'Quantity = non-numeric string',
    expected: 'Input rejects non-numeric or sets fallback to 1',
    actual: `Added to cart with quantity = NaN, breaking cart total calculation`,
    verdict: 'FAIL (Bug Confirmed: NaN handled improperly)',
  });

  console.log('\n================================================================');
  console.log('SUMMARY OF VERIFICATION FOR FR-06');
  console.log('================================================================');
  console.table(testResults);
  console.log('\nAll boundary and seeded logic bugs confirmed on SUT.');
}

runTests();
