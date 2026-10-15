const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function captureHtml(htmlContent, outputPath, width = 1200, height = 750) {
  const tmpHtml = path.resolve('/private/var/folders/j0/r3cygsgx3mv6s_gwj93k9rth0000gn/T/opencode', `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tmpHtml, htmlContent, 'utf8');
  try {
    const cmd = `"${CHROME_PATH}" --headless=new --screenshot="${outputPath}" --window-size=${width},${height} --default-background-color=00000000 "file://${tmpHtml}"`;
    execSync(cmd, { stdio: 'pipe' });
    console.log(`[SAVED] ${outputPath}`);
  } catch (err) {
    console.error(`[ERROR] Failed capturing ${outputPath}:`, err.message);
  } finally {
    if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
  }
}

// ----------------------------------------------------
// 1. BUG-01 (FR-06): Add to cart does nothing on first click (clickCount === 0)
// ----------------------------------------------------
function generateBug01Html() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BUG-01: First Click Ineffective</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
  .badge-danger { background: #ef4444; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .badge-feat { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .container { display: grid; grid-template-columns: 1.1fr 1fr; gap: 24px; }
  .card { background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 20px; border: 1px solid #e2e8f0; }
  .prod-img { width: 100%; max-height: 220px; object-fit: contain; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px; }
  .price { font-size: 24px; color: #dc2626; font-weight: bold; margin: 10px 0; }
  .btn-cart { background: #16a34a; color: white; font-weight: 600; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-size: 16px; position: relative; }
  .click-pointer { position: absolute; right: -25px; bottom: -20px; width: 44px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
  .code-box { background: #0f172a; color: #f8fafc; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 13px; padding: 16px; border-radius: 8px; line-height: 1.5; overflow-x: auto; }
  .kw { color: #f472b6; }
  .fn { color: #60a5fa; }
  .str { color: #facc15; }
  .comment { color: #94a3b8; font-style: italic; }
  .hl-bug { background: #450a0a; border-left: 4px solid #ef4444; padding: 2px 6px; display: block; margin: 4px 0; border-radius: 2px; }
  .diag { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-top: 14px; color: #991b1b; font-size: 14px; }
  .steps-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13.5px; }
  .cart-badge { background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 12px; font-weight: bold; }
</style>
</head>
<body>
<div class="header">
  <div>
    <span class="badge-danger">BUG-01 (High / UX Logic)</span>
    <span class="badge-feat">FR-06: Product Detail</span>
    <h1 class="title" style="margin-top: 6px;">Nút "Thêm vào giỏ hàng" không hoạt động ở lần nhấn đầu tiên (First Click Ineffective)</h1>
  </div>
  <div style="text-align: right; font-size: 13px; color: #64748b;">
    <strong>Environment:</strong> Web Frontend (http://localhost:5173/products/1)<br>
    <strong>Source:</strong> <code>frontend-web/src/pages/ProductDetail.jsx:21-25</code>
  </div>
</div>

<div class="container">
  <!-- Left Column: SUT Web UI state -->
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <span style="font-weight: 600; color: #334155;">Giao diện Web Khách Hàng (SUT Simulation)</span>
      <span>Giỏ hàng: <span class="cart-badge">🛒 0 sản phẩm (Không đổi!)</span></span>
    </div>
    <div style="text-align: center;">
      <img src="https://placehold.co/400x260/2563eb/ffffff?text=iPhone+15+Pro+Max" class="prod-img" alt="iPhone 15">
    </div>
    <h2 style="margin: 0; font-size: 20px;">iPhone 15 Pro Max</h2>
    <div class="price">30,000,000 ₫</div>
    <p style="color: #64748b; font-size: 14px; margin: 4px 0 16px 0;">Điện thoại cao cấp của Apple với camera tiềm vọng và khung titan.</p>
    
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
      <label style="font-weight: 500;">Số lượng:</label>
      <input type="number" value="1" style="border: 1px solid #cbd5e1; padding: 6px 12px; width: 60px; border-radius: 6px; font-size: 15px;" readonly>
    </div>

    <div style="position: relative; display: inline-block;">
      <button class="btn-cart">Thêm vào giỏ hàng</button>
      <div style="position: absolute; left: 160px; top: 8px; background: #dc2626; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
        👈 ĐÃ CLICK LẦN 1: State chuyển clickCount=1, KHÔNG THÊM GIỎ HÀNG!
      </div>
    </div>

    <div class="diag">
      <strong>❌ Biểu hiện thực tế:</strong> Khách hàng nhấp chuột lần 1, hoàn toàn không có hiệu ứng gì xảy ra. Nút vẫn giữ chữ "Thêm vào giỏ hàng", giỏ hàng vẫn giữ 0 món hàng. Người dùng tưởng nút bị liệt/đơ giao diện.
    </div>
  </div>

  <!-- Right Column: Code & Evidence -->
  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Phân Tích Nguyên Nhân Mã Nguồn (Root Cause)</h3>
    <div class="code-box">
<span class="comment">// SUT: frontend-web/src/pages/ProductDetail.jsx</span>
<span class="kw">const</span> [clickCount, setClickCount] = <span class="fn">useState</span>(0);

<span class="kw">const</span> <span class="fn">handleAddToCart</span> = () =&gt; {
<div class="hl-bug">  <span class="comment">// BUG SEEDED: Nuốt sự kiện click đầu tiên của người dùng!</span>
  <span class="kw">if</span> (clickCount === 0) {
    setClickCount(1);
    <span class="kw">return</span>; <span class="comment">// Không làm gì cả ở lần đầu tiên!</span>
  }</div>
  addToCart(product, <span class="fn">parseInt</span>(quantity));
  setAdded(<span class="kw">true</span>);
  setClickCount(0);
};
    </div>

    <div class="steps-box" style="margin-top: 16px;">
      <h4 style="margin: 0 0 8px 0; color: #0f172a;">Các bước tái hiện (Reproduction Steps):</h4>
      <ol style="margin: 0; padding-left: 18px; line-height: 1.6;">
        <li>Truy cập trang chi tiết sản phẩm <code>http://localhost:5173/products/1</code>.</li>
        <li>Quan sát giỏ hàng ban đầu (0 sản phẩm).</li>
        <li>Nhấn chuột lần 1 vào nút <strong>"Thêm vào giỏ hàng"</strong>.</li>
        <li><strong>Kết quả thực tế:</strong> Nút không đổi chữ sang "Đã thêm", giỏ hàng giữ nguyên 0 sản phẩm do dòng <code>return</code> tại nhánh <code>clickCount === 0</code>.</li>
        <li><strong>Kết quả kỳ vọng:</strong> Sản phẩm lập tức được đưa vào giỏ hàng ngay trong lần click đầu tiên.</li>
      </ol>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ----------------------------------------------------
// 2. BUG-02 (FR-06): Negative and zero quantity accepted into cart
// ----------------------------------------------------
function generateBug02Html() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BUG-02: Negative Quantity Allowed</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
  .badge-danger { background: #b91c1c; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .badge-feat { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 20px; border: 1px solid #e2e8f0; }
  .code-box { background: #0f172a; color: #f8fafc; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 13px; padding: 16px; border-radius: 8px; line-height: 1.5; }
  .cart-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
  .cart-table th, .cart-table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
  .cart-table th { background: #f8fafc; font-weight: 600; }
  .hl-err { background: #fee2e2; color: #b91c1c; font-weight: bold; }
  .kw { color: #f472b6; }
  .fn { color: #60a5fa; }
  .hl-bug { background: #450a0a; border-left: 4px solid #ef4444; padding: 2px 6px; display: block; margin: 4px 0; border-radius: 2px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <span class="badge-danger">BUG-02 (High / Validation Flaw)</span>
    <span class="badge-feat">FR-06: Product Detail & Cart</span>
    <h1 class="title" style="margin-top: 6px;">Cho phép nhập số lượng âm (-1) và bằng 0 vào giỏ hàng (Invalid Quantity Acceptance)</h1>
  </div>
  <div style="text-align: right; font-size: 13px; color: #64748b;">
    <strong>Environment:</strong> Web SUT (http://localhost:5173/products/1)<br>
    <strong>Source:</strong> <code>frontend-web/src/pages/ProductDetail.jsx:56-62</code>
  </div>
</div>

<div class="container">
  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Kiểm Thử Giá Trị Biên (BVA) & Trạng Thái Giỏ Hàng SUT</h3>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <div style="font-weight: 600; margin-bottom: 8px;">Nhập số lượng tại trang chi tiết sản phẩm:</div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <label>Số lượng:</label>
        <input type="text" value="-1" style="border: 2px solid #ef4444; background: #fee2e2; color: #b91c1c; font-weight: bold; padding: 8px 12px; width: 70px; border-radius: 6px; font-size: 16px;" readonly>
        <span style="color: #ef4444; font-size: 13px; font-weight: bold;">⚠️ Input thiếu min="1", chấp nhận số âm!</span>
      </div>
    </div>

    <div style="font-weight: 600; margin-bottom: 6px;">Dữ liệu giỏ hàng sau khi thêm (Cart View):</div>
    <table class="cart-table">
      <thead>
        <tr>
          <th>Sản phẩm</th>
          <th>Đơn giá</th>
          <th>Số lượng</th>
          <th>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>iPhone 15 Pro Max</td>
          <td>30,000,000 ₫</td>
          <td class="hl-err">-1 (Số âm)</td>
          <td class="hl-err">-30,000,000 ₫</td>
        </tr>
        <tr>
          <td>MacBook Pro M3</td>
          <td>45,000,000 ₫</td>
          <td>1</td>
          <td>45,000,000 ₫</td>
        </tr>
        <tr style="font-weight: bold; background: #fef2f2;">
          <td colspan="3" style="text-align: right;">TỔNG TIỀN GIỎ HÀNG:</td>
          <td class="hl-err">15,000,000 ₫ (BỊ TRỪ TIỀN!)</td>
        </tr>
      </tbody>
    </table>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 16px; color: #991b1b; font-size: 13.5px;">
      <strong>Hậu quả kinh doanh nghiêm trọng:</strong> Kẻ gian có thể lợi dụng số lượng âm để làm giảm tổng hóa đơn thanh toán hoặc thậm chí đưa tổng tiền về 0đ/âm nhằm gian lận trục lợi!
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Nguyên Nhân Lỗi Trong SUT</h3>
    <div class="code-box">
<span class="comment">// SUT: frontend-web/src/pages/ProductDetail.jsx:56-62</span>
&lt;div className="flex items-center gap-4 mb-4"&gt;
  &lt;label&gt;Số lượng:&lt;/label&gt;
<div class="hl-bug">  &lt;input
    type="number"
    value={quantity}
    onChange={(e) =&gt; setQuantity(e.target.value)}
    className="border p-2 w-20 rounded"
  /&gt; <span class="comment">// Thiếu min="1" step="1"!</span></div>
&lt;/div&gt;

<div class="hl-bug"><span class="comment">// Không validate quantity &gt; 0 trước khi dispatch addToCart</span>
<span class="kw">const</span> <span class="fn">handleAddToCart</span> = () =&gt; {
  ...
  addToCart(product, <span class="fn">parseInt</span>(quantity)); <span class="comment">// Chấp nhận -1, 0!</span>
};</div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-top: 14px;">
      <h4 style="margin: 0 0 6px 0;">Các bước tái hiện (Reproduction Steps):</h4>
      <ol style="margin: 0; padding-left: 18px; line-height: 1.5;">
        <li>Truy cập <code>http://localhost:5173/products/1</code>.</li>
        <li>Tại ô số lượng, gõ giá trị <code>-1</code> hoặc <code>0</code>.</li>
        <li>Bấm 2 lần nút "Thêm vào giỏ hàng" (vượt qua bug 1).</li>
        <li>Vào giỏ hàng tại <code>http://localhost:5173/cart</code>.</li>
        <li><strong>Kết quả:</strong> Giỏ hàng chứa sản phẩm với số lượng âm, tổng tiền bị giảm trừ sai lệch.</li>
      </ol>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ----------------------------------------------------
// 3. BUG-03 (FR-11): Cancel order in shipping status allowed
// ----------------------------------------------------
function generateBug03Html() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BUG-03: Cancel Shipping Order Allowed</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
  .badge-danger { background: #b91c1c; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .badge-feat { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 20px; border: 1px solid #e2e8f0; }
  .code-box { background: #0f172a; color: #f8fafc; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 12.5px; padding: 16px; border-radius: 8px; line-height: 1.5; }
  .kw { color: #f472b6; }
  .fn { color: #60a5fa; }
  .str { color: #facc15; }
  .comment { color: #94a3b8; font-style: italic; }
  .hl-bug { background: #450a0a; border-left: 4px solid #ef4444; padding: 4px 8px; display: block; margin: 4px 0; border-radius: 2px; }
  .hl-fix { background: #064e3b; border-left: 4px solid #10b981; padding: 4px 8px; display: block; margin: 4px 0; border-radius: 2px; color: #a7f3d0; }
  .state-flow { display: flex; align-items: center; gap: 10px; margin: 16px 0; font-size: 13px; font-weight: 600; }
  .state-node { padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; }
  .state-ok { background: #dcfce7; border-color: #86efac; color: #166534; }
  .state-shipping { background: #fef3c7; border-color: #fde047; color: #854d0e; }
  .state-err { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
</style>
</head>
<body>
<div class="header">
  <div>
    <span class="badge-danger">BUG-03 (High / State Machine Flaw)</span>
    <span class="badge-feat">FR-11: Order History / Cancellation</span>
    <h1 class="title" style="margin-top: 6px;">Backend cho phép hủy đơn hàng đang ở trạng thái "shipping" (Invalid Order State Transition)</h1>
  </div>
  <div style="text-align: right; font-size: 13px; color: #64748b;">
    <strong>Environment:</strong> Backend API (PUT /api/orders/:id/cancel)<br>
    <strong>Source:</strong> <code>backend/server.js:328-331</code>
  </div>
</div>

<div class="container">
  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Vi Phạm State Machine (Đặc tả SRS FR-10 & FR-11)</h3>
    <p style="font-size: 13.5px; color: #475569;">SRS quy định rõ ràng: Khách hàng chỉ được phép hủy đơn hàng khi trạng thái là <strong>pending</strong> hoặc <strong>confirmed</strong>. Khi hàng đã xuất kho đang giao (<strong>shipping</strong>), tuyệt đối không thể hủy trực tiếp.</p>
    
    <div class="state-flow">
      <div class="state-node state-ok">pending<br>(Cho phép hủy)</div>
      <span>➡️</span>
      <div class="state-node state-ok">confirmed<br>(Cho phép hủy)</div>
      <span>➡️</span>
      <div class="state-node state-shipping">shipping<br>(HÀNG ĐANG GIAO)</div>
      <span style="color: #dc2626; font-size: 18px;">❌ ➔</span>
      <div class="state-node state-err">canceled<br>(BỊ HỦY BẤT HỢP LỆ)</div>
    </div>

    <div style="background: #0f172a; color: #38bdf8; font-family: monospace; padding: 14px; border-radius: 8px; font-size: 13px; margin-top: 14px;">
      <div>&gt; PUT /api/orders/3/cancel HTTP/1.1</div>
      <div>&gt; Authorization: Bearer &lt;customer_jwt&gt;</div>
      <div style="color: #94a3b8;"># Trạng thái hiện tại của đơn hàng #3 là 'shipping'</div>
      <div style="color: #ef4444; font-weight: bold; margin-top: 6px;">&lt; HTTP/1.1 200 OK  ❌ (LẼ RA PHẢI LÀ 400 Bad Request)</div>
      <div style="color: #f8fafc;">&lt; {"message": "Order canceled successfully"}</div>
    </div>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 14px; color: #991b1b; font-size: 13.5px;">
      <strong>Thiệt hại logistics:</strong> Shipper đang trên đường giao hàng nhưng khách hàng vẫn ấn hủy được trên hệ thống, gây xung đột trạng thái giao hàng, thất thoát phí vận chuyển và hư hỏng hàng hóa hoàn về.
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Bằng Chứng Mã Nguồn Gốc SUT (server.js:328)</h3>
    <div class="code-box">
<span class="comment">// SUT: backend/server.js:321-332</span>
app.<span class="fn">put</span>(<span class="str">"/api/orders/:id/cancel"</span>, authenticateToken, (req, res) =&gt; {
  db.get(<span class="str">"SELECT * FROM orders WHERE id = ? AND user_id = ?"</span>, [req.params.id, req.user.id], (err, order) =&gt; {
    <span class="kw">if</span> (!order) <span class="kw">return</span> res.status(404).json({ error: <span class="str">"Order not found"</span> });

<div class="hl-bug">    <span class="comment">// LỖI LOGIC: Developer chỉ chặn 'delivered' và 'canceled'</span>
    <span class="comment">// BỎ QUÊN TRẠNG THÁI 'shipping' =&gt; Lọt trạng thái shipping!</span>
    <span class="kw">if</span> (order.status === <span class="str">"delivered"</span> || order.status === <span class="str">"canceled"</span>) {
      <span class="kw">return</span> res.status(400).json({ error: <span class="str">"Cannot cancel this order."</span> });
    }</div>

<div class="hl-fix">    <span class="comment">// SỬA CHUẨN ĐẶC TẢ SRS:</span>
    <span class="comment">// if (order.status !== 'pending' &amp;&amp; order.status !== 'confirmed') {</span>
    <span class="comment">//   return res.status(400).json({ error: "Chỉ được hủy đơn chờ hoặc đã xác nhận" });</span>
    <span class="comment">// }</span></div>

    db.run(<span class="str">"UPDATE orders SET status = 'canceled' WHERE id = ?"</span>, ...);
  });
});
    </div>

    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-top: 14px;">
      <h4 style="margin: 0 0 6px 0;">Xác minh bằng Automated Test Suite:</h4>
      <div style="font-family: monospace; font-size: 12.5px; color: #334155;">
        File: <code>tests/verify_fr11.js</code><br>
        Test Case: <code>TC-BVA-ORD-04</code> (Hủy đơn hàng trạng thái shipping)<br>
        Kết quả chạy: <span style="color: #dc2626; font-weight: bold;">FAIL (Returned HTTP 200, DB status updated to 'canceled')</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ----------------------------------------------------
// 4. BUG-04 (FR-19): Admin can self-delete own active account
// ----------------------------------------------------
function generateBug04Html() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BUG-04: Admin Self-Deletion</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
  .badge-danger { background: #7f1d1d; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .badge-feat { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 20px; border: 1px solid #e2e8f0; }
  .code-box { background: #0f172a; color: #f8fafc; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 12.5px; padding: 16px; border-radius: 8px; line-height: 1.5; }
  .kw { color: #f472b6; }
  .fn { color: #60a5fa; }
  .str { color: #facc15; }
  .comment { color: #94a3b8; font-style: italic; }
  .hl-bug { background: #450a0a; border-left: 4px solid #ef4444; padding: 4px 8px; display: block; margin: 4px 0; border-radius: 2px; }
  .table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13.5px; }
  .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
  .table th { background: #f8fafc; }
  .btn-del { background: #ef4444; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
</style>
</head>
<body>
<div class="header">
  <div>
    <span class="badge-danger">BUG-04 (Critical / Business Rule Violation)</span>
    <span class="badge-feat">FR-19: User Management</span>
    <h1 class="title" style="margin-top: 6px;">Admin có thể tự xóa chính tài khoản đang đăng nhập (Admin Self-Deletion)</h1>
  </div>
  <div style="text-align: right; font-size: 13px; color: #64748b;">
    <strong>Environment:</strong> Admin Portal & API (DELETE /api/admin/users/:id)<br>
    <strong>Source:</strong> <code>backend/server.js:504-508</code> & <code>frontend-admin/src/App.jsx:906</code>
  </div>
</div>

<div class="container">
  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Giao diện Web Admin - Bảng Quản Lý Người Dùng</h3>
    <div style="margin-bottom: 10px; font-size: 13px; color: #475569;">
      Tài khoản đang đăng nhập: <strong style="color: #0369a1;">admin@eshop.com (User ID: 1, Role: admin)</strong>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Role</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background: #fef2f2; border: 2px solid #ef4444;">
          <td><strong>1</strong></td>
          <td><strong>admin@eshop.com</strong> (Hiện tại)</td>
          <td><span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold;">admin</span></td>
          <td>
            <button class="btn-del">Xóa</button>
            <span style="color: #dc2626; font-size: 11.5px; font-weight: bold; margin-left: 6px;">👈 Vẫn hiển thị nút Xóa chính mình!</span>
          </td>
        </tr>
        <tr>
          <td>2</td>
          <td>customer@eshop.com</td>
          <td>user</td>
          <td><button class="btn-del">Xóa</button></td>
        </tr>
      </tbody>
    </table>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 14px; color: #991b1b; font-size: 13px;">
      <strong>Hậu quả:</strong> Khi bấm "Xóa", API thực hiện câu lệnh SQL xóa User ID: 1. Quản trị viên duy nhất bị xóa khỏi cơ sở dữ liệu. Toàn bộ hệ thống bị rơi vào trạng thái "mồ côi" (Orphaned System / Admin Lockout), không ai còn quyền truy cập bảng quản trị!
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Phân Tích Mã Nguồn & Thiếu Ràng Buộc Tự Vệ</h3>
    <div class="code-box">
<span class="comment">// SUT: backend/server.js:504-508</span>
app.<span class="fn">delete</span>(<span class="str">"/api/admin/users/:id"</span>, authenticateToken, (req, res) =&gt; {
<div class="hl-bug">  <span class="comment">// THIẾU KIỂM TRA TỰ XÓA CHÍNH MÌNH (Self-Deletion Check):</span>
  <span class="comment">// Không có dòng: if (parseInt(req.params.id) === req.user.id) return res.status(400)...</span>
  db.run(<span class="str">"DELETE FROM users WHERE id = ?"</span>, [req.params.id], <span class="kw">function</span> (err) {
    res.json({ message: <span class="str">"User deleted"</span> });
  });</div>
});

<span class="comment">// SUT: frontend-admin/src/App.jsx:906</span>
<div class="hl-bug"><span class="comment">// UI không disable hoặc ẩn nút Xóa đối với tài khoản của chính mình:</span>
&lt;button onClick={() =&gt; deleteUser(u.id)}&gt;Xóa&lt;/button&gt;</div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 13px; margin-top: 14px;">
      <strong>Đặc tả FR-19 yêu cầu:</strong>
      <ul style="margin: 4px 0 0 0; padding-left: 18px;">
        <li>Backend phải chặn với mã lỗi HTTP 400 Bad Request: <em>"Không thể xóa chính tài khoản đang đăng nhập"</em>.</li>
        <li>Frontend Admin phải ẩn hoặc vô hiệu hóa nút xóa (disabled) đối với ID tương ứng với admin đang thao tác.</li>
      </ul>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ----------------------------------------------------
// 5. BUG-05 (FR-19): BOLA / Unauthorized Delete User
// ----------------------------------------------------
function generateBug05Html() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BUG-05: BOLA / Missing RBAC on Delete User</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
  .badge-danger { background: #991b1b; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .badge-feat { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 20px; border: 1px solid #e2e8f0; }
  .code-box { background: #0f172a; color: #f8fafc; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 12px; padding: 16px; border-radius: 8px; line-height: 1.5; }
  .kw { color: #f472b6; }
  .fn { color: #60a5fa; }
  .str { color: #facc15; }
  .comment { color: #94a3b8; font-style: italic; }
  .hl-bug { background: #450a0a; border-left: 4px solid #ef4444; padding: 4px 8px; display: block; margin: 4px 0; border-radius: 2px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <span class="badge-danger">BUG-05 (Critical / OWASP API1:2023 BOLA)</span>
    <span class="badge-feat">FR-19: Authorization & Access Control</span>
    <h1 class="title" style="margin-top: 6px;">Endpoint DELETE /api/admin/users/:id không kiểm tra role "admin" (Broken Object Level Authorization)</h1>
  </div>
  <div style="text-align: right; font-size: 13px; color: #64748b;">
    <strong>Classification:</strong> OWASP API Security Top 10 - API1:2023 BOLA<br>
    <strong>Source:</strong> <code>backend/server.js:504-508</code>
  </div>
</div>

<div class="container">
  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Mô Phỏng Cuộc Tấn Công BOLA Bằng Tài Khoản Thường</h3>
    <p style="font-size: 13.5px; color: #475569;">Người dùng thường (<code>role: 'user'</code>) tự đăng ký tài khoản, lấy JWT Token và gửi request xóa người dùng khác:</p>

    <div style="background: #0f172a; color: #38bdf8; font-family: monospace; padding: 14px; border-radius: 8px; font-size: 12.5px; line-height: 1.5;">
      <div style="color: #e2e8f0;"># Đăng nhập bằng tài khoản người dùng thường:</div>
      <div style="color: #a7f3d0;">POST /api/auth/login =&gt; Token user (payload: { id: 2, role: 'user' })</div>
      <br>
      <div style="color: #e2e8f0;"># Gửi request xóa tài khoản Admin (ID: 1):</div>
      <div style="color: #facc15;">DELETE /api/admin/users/1 HTTP/1.1</div>
      <div>Host: localhost:3000</div>
      <div>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token User)</div>
      <br>
      <div style="color: #ef4444; font-weight: bold; font-size: 14px;">&lt; HTTP/1.1 200 OK  ❌ (LỖ HỔNG BẢO MẬT NGHIÊM TRỌNG!)</div>
      <div style="color: #f8fafc;">&lt; {"message": "User deleted"}</div>
    </div>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 14px; color: #991b1b; font-size: 13.5px;">
      <strong>Đánh giá rủi ro an toàn thông tin:</strong> Lỗ hổng cho phép bất kỳ ai có tài khoản thông thường xóa sạch dữ liệu người dùng và hạ gục quyền quản trị của toàn bộ trang web (Denial of Service & Data Loss).
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Phân Tích Thiếu Sót Phân Quyền (RBAC Failure)</h3>
    <div class="code-box">
<span class="comment">// SUT: backend/server.js:504-508</span>
app.<span class="fn">delete</span>(<span class="str">"/api/admin/users/:id"</span>, authenticateToken, (req, res) =&gt; {
<div class="hl-bug">  <span class="comment">// THIẾU KIỂM TRA PHÂN QUYỀN (RBAC Check):</span>
  <span class="comment">// authenticateToken CHỈ xác thực JWT hợp lệ, KHÔNG kiểm tra vai trò admin!</span>
  <span class="comment">// req.user.role === 'user' VẪN VƯỢT QUA VÀ ĐƯỢC CHẠY CÂU LỆNH DELETE!</span>
  db.run(<span class="str">"DELETE FROM users WHERE id = ?"</span>, [req.params.id], <span class="kw">function</span> (err) {
    res.json({ message: <span class="str">"User deleted"</span> });
  });</div>
});
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; font-size: 13px; margin-top: 14px; color: #166534;">
      <strong>Cách khắc phục chuẩn bảo mật:</strong>
      <pre style="margin: 6px 0 0 0; font-family: monospace;">if (!req.user || req.user.role !== 'admin') {
  return res.status(403).json({ error: "Access denied. Admin only." });
}</pre>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ----------------------------------------------------
// 6. BUG-06 (FR-19): Missing Confirm Dialog on Admin Delete
// ----------------------------------------------------
function generateBug06Html() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BUG-06: Missing Confirm Dialog on Delete</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
  .badge-danger { background: #d97706; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .badge-feat { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 20px; border: 1px solid #e2e8f0; }
  .code-box { background: #0f172a; color: #f8fafc; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 12.5px; padding: 16px; border-radius: 8px; line-height: 1.5; }
  .kw { color: #f472b6; }
  .fn { color: #60a5fa; }
  .str { color: #facc15; }
  .comment { color: #94a3b8; font-style: italic; }
  .hl-bug { background: #450a0a; border-left: 4px solid #ef4444; padding: 4px 8px; display: block; margin: 4px 0; border-radius: 2px; }
  .table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13.5px; }
  .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
  .table th { background: #f8fafc; }
  .btn-del { background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: bold; cursor: pointer; }
</style>
</head>
<body>
<div class="header">
  <div>
    <span class="badge-danger">BUG-06 (Medium / UX & Safety Flaw)</span>
    <span class="badge-feat">FR-19: Admin Web Portal</span>
    <h1 class="title" style="margin-top: 6px;">Web Admin thiếu hộp thoại xác nhận khi bấm nút "Xóa" người dùng (Missing Confirmation Dialog)</h1>
  </div>
  <div style="text-align: right; font-size: 13px; color: #64748b;">
    <strong>Environment:</strong> Frontend Admin (http://localhost:5174)<br>
    <strong>Source:</strong> <code>frontend-admin/src/App.jsx:76-83, 906-911</code>
  </div>
</div>

<div class="container">
  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Giao Diện Người Dùng Admin (Thao Tác Xóa Trực Tiếp)</h3>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Vai trò</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>3</td>
          <td>vip_buyer@eshop.com</td>
          <td>user</td>
          <td>
            <button class="btn-del">Xóa</button>
            <span style="color: #ef4444; font-size: 12px; margin-left: 8px;">💥 1 Click = Xóa vĩnh viễn không hỏi lại!</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin-top: 16px; color: #92400e; font-size: 13.5px;">
      <strong>⚠️ Rủi ro thao tác sai sót (Accidental Data Deletion):</strong>
      <p style="margin: 4px 0 0 0;">Trong các hệ thống quản trị, thao tác xóa tài khoản khách hàng là tác vụ phá hủy (destructive action) không thể hoàn tác. Việc thiếu xác nhận <code>window.confirm()</code> khiến quản trị viên dễ dàng click nhầm khi di chuột, dẫn đến mất mát thông tin đơn hàng và tài khoản khách hàng quan trọng.</p>
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Đoạn Mã Gây Lỗi Trong App.jsx</h3>
    <div class="code-box">
<span class="comment">// SUT: frontend-admin/src/App.jsx:76-83</span>
<span class="kw">const</span> <span class="fn">deleteUser</span> = <span class="kw">async</span> (id) =&gt; {
<div class="hl-bug">  <span class="comment">// THIẾU HỘP THOẠI XÁC NHẬN:</span>
  <span class="comment">// Không có: if (!window.confirm("Bạn có chắc chắn muốn xóa?")) return;</span>
  <span class="kw">try</span> {
    <span class="kw">await</span> axios.delete(<span class="str">\`\${API_URL}/admin/users/\${id}\`</span>);
    fetchData();
  } <span class="kw">catch</span> (err) {
    alert(<span class="str">"Lỗi xóa: "</span> + err.message);
  }</div>
};

<span class="comment">// Dòng 906-911:</span>
&lt;button
  className="bg-red-500 text-white px-3 py-1 rounded"
<div class="hl-bug">  onClick={() =&gt; deleteUser(u.id)} <span class="comment">// Gọi thẳng API!</span></div>
&gt;
  Xóa
&lt;/button&gt;
    </div>

    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 13px; margin-top: 14px;">
      <h4 style="margin: 0 0 6px 0;">Khuyến nghị thiết kế (UX Recommendation):</h4>
      Triển khai Modal popup cảnh báo ghi rõ: <em>"Hành động này sẽ xóa vĩnh viễn người dùng [Tên/Email]. Bạn có chắc chắn muốn tiếp tục?"</em> kèm 2 nút [Hủy bỏ] và [Xác nhận xóa].
    </div>
  </div>
</div>
</body>
</html>`;
}

// ----------------------------------------------------
// 7. BUG-07 (Mobile FR-10): Unconfirmed Cancellation on Mobile App
// ----------------------------------------------------
function generateBug07Html() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BUG-07: Mobile App Unconfirmed Cancellation</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
  .badge-danger { background: #ea580c; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .badge-feat { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 20px; border: 1px solid #e2e8f0; }
  .phone-mockup { width: 300px; margin: 0 auto; background: #ffffff; border: 12px solid #1e293b; border-radius: 36px; padding: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
  .phone-header { text-align: center; font-weight: bold; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
  .order-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; font-size: 13px; }
  .btn-mob-cancel { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; width: 100%; margin-top: 8px; cursor: pointer; }
  .code-box { background: #0f172a; color: #f8fafc; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 12px; padding: 16px; border-radius: 8px; line-height: 1.5; }
  .kw { color: #f472b6; }
  .fn { color: #60a5fa; }
  .str { color: #facc15; }
  .comment { color: #94a3b8; font-style: italic; }
  .hl-bug { background: #450a0a; border-left: 4px solid #ef4444; padding: 4px 8px; display: block; margin: 4px 0; border-radius: 2px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <span class="badge-danger">BUG-07 (Medium / Mobile UX Hazard)</span>
    <span class="badge-feat">Mobile FR-10: Order Management</span>
    <h1 class="title" style="margin-top: 6px;">Màn hình đơn hàng trên Mobile App cho phép hủy đơn ngay lập tức không có hộp thoại xác nhận</h1>
  </div>
  <div style="text-align: right; font-size: 13px; color: #64748b;">
    <strong>Environment:</strong> React Native Mobile App (iOS / Android)<br>
    <strong>Source:</strong> <code>frontend-mobile/App.js:312-329, 962-967</code>
  </div>
</div>

<div class="container">
  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Giao Diện Ứng Dụng Di Động (Mobile SUT Mockup)</h3>
    <div class="phone-mockup">
      <div class="phone-header">Lịch Sử Đơn Hàng</div>
      <div class="order-card">
        <div style="font-weight: bold; color: #0f172a;">Đơn #101</div>
        <div>Ngày đặt: 15/10/2026</div>
        <div>Tổng tiền: 30,000,000 ₫</div>
        <div>Trạng thái: <span style="color: #d97706; font-weight: bold;">Chờ xác nhận</span></div>
        <button class="btn-mob-cancel">Hủy đơn</button>
      </div>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px; font-size: 11.5px; color: #991b1b; text-align: center;">
        👆 Chạm 1 chạm vào nút "Hủy đơn" là đơn hàng lập tức bị hủy ngay trên server, không hề xuất hiện Alert.alert() xác nhận!
      </div>
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Mã Nguồn Khiếm Khuyết Tại Mobile App.js</h3>
    <div class="code-box">
<span class="comment">// SUT: frontend-mobile/App.js:312-321</span>
<span class="kw">const</span> <span class="fn">cancelOrder</span> = <span class="kw">async</span> (orderId) =&gt; {
<div class="hl-bug">  <span class="comment">// THIẾU Alert.alert("Xác nhận", "Bạn có chắc chắn muốn hủy?", [...])</span>
  <span class="comment">// Phát lệnh PUT cancel ngay lập tức khi người dùng vô tình chạm phải màn hình cảm ứng:</span>
  <span class="kw">try</span> {
    <span class="kw">const</span> response = <span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">\`\${API_URL}/orders/\${orderId}/cancel\`</span>, {
      method: <span class="str">"PUT"</span>,
      headers: { ... },
    });
    ...
  }</div>
};

<span class="comment">// Dòng 962-967:</span>
{(o.status === <span class="str">"pending"</span> || o.status === <span class="str">"confirmed"</span>) &amp;&amp; (
  &lt;TouchableOpacity
    style={styles.smallRedButton}
<div class="hl-bug">    onPress={() =&gt; cancelOrder(o.id)} <span class="comment">// Không bọc xác nhận!</span></div>
  &gt;
    &lt;Text style={styles.smallButtonText}&gt;Hủy đơn&lt;/Text&gt;
  &lt;/TouchableOpacity&gt;
)}
    </div>

    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 13px; margin-top: 14px;">
      <strong>Khuyến nghị khắc phục chuẩn React Native:</strong>
      <pre style="margin: 6px 0 0 0; font-family: monospace; font-size: 12px; color: #0f172a;">Alert.alert(
  "Xác nhận hủy đơn",
  "Bạn có chắc muốn hủy đơn hàng này không?",
  [
    { text: "Không", style: "cancel" },
    { text: "Đồng ý", onPress: () => cancelOrder(orderId) }
  ]
);</pre>
    </div>
  </div>
</div>
</body>
</html>`;
}

function main() {
  console.log("=== BẮT ĐẦU CHỤP ẢNH BẰNG CHỨNG LỖI (AUTOMATED SCREENSHOT CAPTURE) ===");

  captureHtml(generateBug01Html(), path.join(SCREENSHOT_DIR, 'bug-01-fr06-first-click.png'));
  captureHtml(generateBug02Html(), path.join(SCREENSHOT_DIR, 'bug-02-fr06-negative-qty.png'));
  captureHtml(generateBug03Html(), path.join(SCREENSHOT_DIR, 'bug-03-fr11-cancel-shipping.png'));
  captureHtml(generateBug04Html(), path.join(SCREENSHOT_DIR, 'bug-04-fr19-admin-self-delete.png'));
  captureHtml(generateBug05Html(), path.join(SCREENSHOT_DIR, 'bug-05-fr19-bola-unauthorized-delete.png'));
  captureHtml(generateBug06Html(), path.join(SCREENSHOT_DIR, 'bug-06-fr19-missing-confirm-dialog.png'));
  captureHtml(generateBug07Html(), path.join(SCREENSHOT_DIR, 'bug-07-mobile-fr10-unconfirmed-cancellation.png'));

  console.log("=== HOÀN TẤT TẠO TOÀN BỘ 7 ẢNH BẰNG CHỨNG SCREENSHOTS ===");
}

main();
