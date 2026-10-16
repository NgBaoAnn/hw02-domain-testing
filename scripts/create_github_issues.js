const { execSync } = require('child_process');

const REPO = 'NgBaoAnn/hw02-domain-testing';
const RAW_URL_BASE = 'https://raw.githubusercontent.com/NgBaoAnn/hw02-domain-testing/master/screenshots';

const issues = [
  {
    title: '[BUG-01] [FR-06] Nút "Thêm vào giỏ hàng" bị nuốt ở lần bấm đầu tiên (clickCount trap)',
    body: `## Mô Tả Lỗi (Bug Description)
Nút "Thêm vào giỏ hàng" trên màn hình chi tiết sản phẩm không phản hồi ở lần nhấp chuột đầu tiên. Người dùng buộc phải nhấp chuột lần thứ hai thì sản phẩm mới được thêm vào giỏ.

- **Mã định danh:** \`BUG-01\`
- **Phân hệ / Tính năng:** FR-06: Xem chi tiết sản phẩm (Product Detail)
- **Mức độ nghiêm trọng (Severity):** High (P1)
- **Môi trường:** URL \`http://localhost:5173/products/1\`, Chrome Desktop

## Các Bước Tái Hiện (Steps to Reproduce)
1. Mở trang chủ \`http://localhost:5173\`, chọn sản phẩm bất kỳ để vào trang chi tiết.
2. Giữ nguyên số lượng \`1\`.
3. Nhấp **1 lần** vào nút màu xanh "Thêm vào giỏ hàng".
4. **Kết quả thực tế:** Không có phản hồi, nút không đổi trạng thái, giỏ hàng giữ nguyên 0 sản phẩm.
5. **Kết quả mong đợi:** Sản phẩm phải được thêm ngay vào giỏ hàng ở lần bấm đầu tiên, nút chuyển "Đã thêm" trong 2 giây.

## Nguyên Nhân Mã Nguồn (Root Cause)
File: \`frontend-web/src/pages/ProductDetail.jsx\` (dòng 21-25):
\`\`\`javascript
const handleAddToCart = () => {
  if (clickCount === 0) {
    setClickCount(1);
    return; // Lần bấm đầu tiên bị nuốt hoàn toàn!
  }
  addToCart(product, parseInt(quantity));
  setAdded(true);
};
\`\`\`

## Bằng Chứng Ảnh Chụp Màn Hình (Screenshot Evidence)
![BUG-01 Evidence](${RAW_URL_BASE}/bug-01-fr06-first-click.png)
`
  },
  {
    title: '[BUG-02] [FR-06] Ô nhập số lượng nhận số 0, số âm (-1) và NaN làm sai lệch giỏ hàng',
    body: `## Mô Tả Lỗi (Bug Description)
Ô nhập số lượng (\`quantity\`) trên màn hình chi tiết sản phẩm không có thuộc tính \`min="1"\` và không kiểm tra dữ liệu đầu vào, cho phép người dùng nhập số $0$, số âm ($-1$) hoặc ký tự chữ (\`NaN\`) và thêm vào giỏ hàng.

- **Mã định danh:** \`BUG-02\`
- **Phân hệ / Tính năng:** FR-06: Xem chi tiết sản phẩm (Product Detail)
- **Mức độ nghiêm trọng (Severity):** High (P1)
- **Môi trường:** URL \`http://localhost:5173/products/1\`

## Các Bước Tái Hiện (Steps to Reproduce)
1. Truy cập \`http://localhost:5173/products/1\`.
2. Nhập số lượng \`-1\` hoặc \`0\` vào ô "Số lượng".
3. Nhấp đúp vào "Thêm vào giỏ hàng".
4. Mở trang Giỏ hàng (\`http://localhost:5173/cart\`).
5. **Kết quả thực tế:** Giỏ hàng hiển thị số lượng âm, tổng tiền đơn hàng bị trừ âm, phá vỡ logic thanh toán.
6. **Kết quả mong đợi:** Hệ thống phải chặn các giá trị $\\le 0$ và hiển thị thông báo lỗi yêu cầu số lượng tối thiểu là 1.

## Nguyên Nhân Mã Nguồn (Root Cause)
File: \`frontend-web/src/pages/ProductDetail.jsx\` (dòng 56-62):
\`\`\`jsx
<input
  type="number"
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
  className="border p-2 w-20 rounded"
/>
// Thiếu min="1", thiếu validation giá trị hợp lệ trước khi gọi addToCart
\`\`\`

## Bằng Chứng Ảnh Chụp Màn Hình (Screenshot Evidence)
![BUG-02 Evidence](${RAW_URL_BASE}/bug-02-fr06-negative-qty.png)
`
  },
  {
    title: '[BUG-03] [FR-11] Backend cho phép hủy đơn hàng đang ở trạng thái shipping (State Machine Violation)',
    body: `## Mô Tả Lỗi (Bug Description)
Theo đặc tả SRS, đơn hàng chỉ được phép hủy khi ở trạng thái \`pending\` hoặc \`confirmed\`. Khi đơn hàng đã chuyển sang \`shipping\` (đang giao), khách hàng tuyệt đối không được hủy đơn. Tuy nhiên backend API vẫn cho phép hủy đơn hàng đang \`shipping\` với HTTP 200 OK.

- **Mã định danh:** \`BUG-03\`
- **Phân hệ / Tính năng:** FR-11: Lịch sử đơn hàng (User Order History) / Máy trạng thái đơn hàng
- **Mức độ nghiêm trọng (Severity):** High (P1)
- **Môi trường:** Endpoint \`PUT http://localhost:3000/api/orders/:id/cancel\`

## Các Bước Tái Hiện (Steps to Reproduce)
1. Đăng nhập tài khoản khách hàng và đặt đơn hàng mới (trạng thái ban đầu \`pending\`).
2. Quản trị viên cập nhật trạng thái đơn hàng sang \`shipping\` (\`PUT /api/admin/orders/:id/status\`).
3. Khách hàng gửi request \`PUT /api/orders/:id/cancel\` với Bearer token của mình.
4. **Kết quả thực tế:** Backend phản hồi HTTP 200 \`{"message":"Order canceled successfully"}\`, đơn hàng bị hủy khi hàng đang được vận chuyển.
5. **Kết quả mong đợi:** Backend phải từ chối với HTTP 400 \`{"error":"Cannot cancel this order."}\`.

## Nguyên Nhân Mã Nguồn (Root Cause)
File: \`backend/server.js\` (dòng 328-331):
\`\`\`javascript
// Lẽ ra phải là: if (order.status !== 'pending' && order.status !== 'confirmed')
if (order.status === "delivered" || order.status === "canceled") {
  return res.status(400).json({ error: "Cannot cancel this order." });
}
// Logic chỉ chặn delivered và canceled, vô tình cho phép trạng thái shipping!
\`\`\`

## Bằng Chứng Ảnh Chụp Màn Hình (Screenshot Evidence)
![BUG-03 Evidence](${RAW_URL_BASE}/bug-03-fr11-cancel-shipping.png)
`
  },
  {
    title: '[BUG-04] [FR-19] Admin có thể tự xóa chính tài khoản đang đăng nhập (Vi phạm SRS & Nguy cơ Lockout)',
    body: `## Mô Tả Lỗi (Bug Description)
Theo đặc tả nghiệp vụ SRS: "Cấm Admin tự xóa chính tài khoản đang đăng nhập". Tuy nhiên, hệ thống cho phép tài khoản Admin đang đăng nhập tự xóa chính ID của mình qua API và Web Admin UI, gây rủi ro hệ thống bị mất tài khoản quản trị tối cao (Orphaned System / Admin Lockout).

- **Mã định danh:** \`BUG-04\`
- **Phân hệ / Tính năng:** FR-19: Quản lý người dùng Admin
- **Mức độ nghiêm trọng (Severity):** **Critical (P0 - Blocker)**
- **Môi trường:** URL \`http://localhost:5174\` & Endpoint \`DELETE /api/admin/users/:id\`

## Các Bước Tái Hiện (Steps to Reproduce)
1. Đăng nhập vào Web Admin (\`http://localhost:5174\`) bằng tài khoản \`admin@eshop.com\` (ID = 1).
2. Vào tab "Quản lý Người dùng".
3. Tìm dòng hiển thị tài khoản của chính mình (ID: 1, email: \`admin@eshop.com\`).
4. Nhấp nút màu đỏ "Xóa".
5. **Kết quả thực tế:** Lệnh xóa được thực thi thành công, tài khoản Admin hiện tại bị xóa vĩnh viễn khỏi database SQLite.
6. **Kết quả mong đợi:** Hệ thống phải kiểm tra \`req.user.id !== req.params.id\`, trả về HTTP 400/403 báo lỗi cấm tự xóa chính mình.

## Nguyên Nhân Mã Nguồn (Root Cause)
File: \`backend/server.js\` (dòng 504-508) & \`frontend-admin/src/App.jsx\` (dòng 906-912):
\`\`\`javascript
app.delete("/api/admin/users/:id", authenticateToken, (req, res) => {
  // Thiếu: if (parseInt(req.params.id) === req.user.id) return res.status(400)...
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
    res.json({ message: "User deleted" });
  });
});
\`\`\`

## Bằng Chứng Ảnh Chụp Màn Hình (Screenshot Evidence)
![BUG-04 Evidence](${RAW_URL_BASE}/bug-04-fr19-admin-self-delete.png)
`
  },
  {
    title: '[BUG-05] [FR-19] Lỗ hổng bảo mật BOLA: Người dùng thường có thể gọi API xóa bất kỳ tài khoản nào',
    body: `## Mô Tả Lỗi (Bug Description)
Lỗ hổng bảo mật nghiêm trọng Broken Object Level Authorization (OWASP API Security Top 10 - API1: BOLA). Endpoint \`DELETE /api/admin/users/:id\` áp dụng middleware xác thực token nhưng hoàn toàn thiếu middleware kiểm tra vai trò quản trị (\`req.user.role === 'admin'\`). Người dùng bình thường có thể xóa bất kỳ tài khoản khách hàng hay quản trị viên nào.

- **Mã định danh:** \`BUG-05\`
- **Phân hệ / Tính năng:** FR-19: Quản lý người dùng Admin
- **Mức độ nghiêm trọng (Severity):** **Critical (P0 - Blocker / Security Exploit)**
- **Môi trường:** Endpoint \`DELETE http://localhost:3000/api/admin/users/:id\`

## Các Bước Tái Hiện (Steps to Reproduce)
1. Đăng ký một tài khoản người dùng bình thường (\`role = "user"\`) và lấy JWT Bearer token.
2. Gửi request HTTP:
   \`\`\`http
   DELETE /api/admin/users/1 HTTP/1.1
   Host: localhost:3000
   Authorization: Bearer <USER_TOKEN>
   \`\`\`
3. **Kết quả thực tế:** Backend phản hồi HTTP 200 \`{"message":"User deleted"}\`. Tài khoản Admin ID 1 bị xóa bởi một user thường!
4. **Kết quả mong đợi:** Backend phải chặn và trả về HTTP 403 Forbidden.

## Nguyên Nhân Mã Nguồn (Root Cause)
File: \`backend/server.js\` (dòng 504-508):
\`\`\`javascript
app.delete("/api/admin/users/:id", authenticateToken, (req, res) => {
  // HOÀN TOÀN THIẾU KIỂM TRA PHÂN QUYỀN:
  // if (req.user.role !== 'admin') return res.status(403).json({ error: "Access denied" });
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
    res.json({ message: "User deleted" });
  });
});
\`\`\`

## Bằng Chứng Ảnh Chụp Màn Hình (Screenshot Evidence)
![BUG-05 Evidence](${RAW_URL_BASE}/bug-05-fr19-bola-unauthorized-delete.png)
`
  },
  {
    title: '[BUG-06] [FR-19] Web Admin thiếu hộp thoại xác nhận khi bấm Xóa tài khoản người dùng',
    body: `## Mô Tả Lỗi (Bug Description)
Trên giao diện Web Admin (\`http://localhost:5174\`), khi quản trị viên nhấp vào nút "Xóa" trên bảng người dùng, hàm \`deleteUser(u.id)\` được gọi và xóa dữ liệu tức thì mà không hề hiển thị bất kỳ hộp thoại xác nhận (\`window.confirm\`) nào.

- **Mã định danh:** \`BUG-06\`
- **Phân hệ / Tính năng:** FR-19: Quản lý người dùng Admin
- **Mức độ nghiêm trọng (Severity):** Medium (P2)
- **Môi trường:** Web Admin Portal (\`frontend-admin/src/App.jsx\`)

## Các Bước Tái Hiện (Steps to Reproduce)
1. Đăng nhập vào trang quản trị \`http://localhost:5174\`.
2. Mở tab "Quản lý Người dùng".
3. Nhấp 1 lần vào nút "Xóa" ở bất kỳ dòng người dùng nào.
4. **Kết quả thực tế:** Dữ liệu bị xóa vĩnh viễn ngay lập tức mà không có cảnh báo. Nếu nhấp chuột nhầm, dữ liệu sẽ bị mất không thể khôi phục.
5. **Kết quả mong đợi:** Phải hiển thị modal hoặc hộp thoại xác nhận: "Bạn có chắc chắn muốn xóa người dùng [Email] không?".

## Nguyên Nhân Mã Nguồn (Root Cause)
File: \`frontend-admin/src/App.jsx\` (dòng 76-83 và 906-912):
\`\`\`jsx
const deleteUser = async (id) => {
  try {
    await axios.delete(\`\${API_URL}/admin/users/\${id}\`);
    fetchData();
  } catch (err) {
    alert("Lỗi xóa: " + err.message);
  }
};
// Thiếu if (!window.confirm("Bạn có chắc chắn muốn xóa?")) return;
\`\`\`

## Bằng Chứng Ảnh Chụp Màn Hình (Screenshot Evidence)
![BUG-06 Evidence](${RAW_URL_BASE}/bug-06-fr19-missing-confirm-dialog.png)
`
  },
  {
    title: '[BUG-07] [Mobile FR-10] Chức năng hủy đơn hàng trên Mobile App hủy tức thì không có Alert xác nhận',
    body: `## Mô Tả Lỗi (Bug Description)
Trên ứng dụng di động (\`frontend-mobile/App.js\`), khi người dùng chạm vào nút "Hủy đơn" màu đỏ trong màn hình lịch sử đơn hàng, ứng dụng gửi ngay request hủy tới backend mà không hiển thị hộp thoại \`Alert.alert\` xác nhận hai bước. Trên màn hình cảm ứng, người dùng rất dễ chạm nhầm khi vuốt cuộn màn hình.

- **Mã định danh:** \`BUG-07\`
- **Phân hệ / Tính năng:** Mobile FR-10: Hủy đơn hàng trên ứng dụng di động
- **Mức độ nghiêm trọng (Severity):** Medium (P2)
- **Môi trường:** \`frontend-mobile/App.js\` (React Native Mobile Client)

## Các Bước Tái Hiện (Steps to Reproduce)
1. Khởi chạy ứng dụng Mobile và đăng nhập tài khoản.
2. Điều hướng tới màn hình Lịch sử đơn hàng (Profile tab).
3. Tìm đơn hàng ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận".
4. Chạm vào nút màu đỏ "Hủy đơn".
5. **Kết quả thực tế:** Đơn hàng bị gửi lệnh hủy ngay lập tức tới backend và hiện thông báo "Hủy đơn thành công!", người dùng không có cơ hội hủy bỏ thao tác nếu lỡ tay chạm nhầm.
6. **Kết quả mong đợi:** Phải hiển thị hộp thoại cảnh báo: \`Alert.alert("Xác nhận", "Bạn có chắc chắn muốn hủy đơn hàng này không?", [{ text: "Không" }, { text: "Hủy đơn", onPress: ... }])\`.

## Nguyên Nhân Mã Nguồn (Root Cause)
File: \`frontend-mobile/App.js\` (dòng 312-329):
\`\`\`javascript
const cancelOrder = async (orderId) => {
  try {
    // Thiếu Alert.alert xác nhận trước khi gọi fetch!
    const response = await fetch(\`\${API_URL}/orders/\${orderId}/cancel\`, {
      method: "PUT",
      headers: { ... },
      body: JSON.stringify({}),
    });
    ...
  }
};
\`\`\`

## Bằng Chứng Ảnh Chụp Màn Hình (Screenshot Evidence)
![BUG-07 Evidence](${RAW_URL_BASE}/bug-07-mobile-fr10-unconfirmed-cancellation.png)
`
  }
];

async function main() {
  console.log(`Đang đăng ${issues.length} lỗi lên GitHub Issues của kho: ${REPO}...\n`);
  for (let i = 0; i < issues.length; i++) {
    const it = issues[i];
    console.log(`[${i+1}/${issues.length}] Đang tạo Issue: ${it.title}...`);
    const tempFile = `/tmp/issue_body_${i}.md`;
    require('fs').writeFileSync(tempFile, it.body, 'utf8');
    
    try {
      const out = execSync(`gh issue create --repo "${REPO}" --title "${it.title.replace(/"/g, '\\"')}" --body-file "${tempFile}"`, { encoding: 'utf8' });
      console.log(`   -> Thành công: ${out.trim()}`);
    } catch (e) {
      console.error(`   -> Thất bại: ${e.message}`);
    }
  }
  console.log('\nHoàn tất tạo tất cả GitHub Issues!');
}

main();
