# Báo Cáo Kiểm Thử Miền & Phân Tích Giá Trị Biên: FR-11 - Lịch Sử Đơn Hàng (User Order History)

- **Môn học:** Kiểm thử phần mềm nâng cao (KCPM)
- **Bài tập:** HW02 – Domain Testing trên EShop
- **Mã tính năng:** FR-11 (Pool B - Giỏ hàng, Thanh toán và Đơn hàng)
- **Hệ thống thử nghiệm (SUT):** EShop E-Commerce Web Application
- **Môi trường:**
  - Backend: Node.js / Express (Port 3000)
  - Frontend: React / Vite / TailwindCSS (Port 5173)
  - Database: SQLite (`eshop-sut/backend/database.sqlite`)

---

## 1. Tổng Quan Tính Năng & Kiến Trúc (Feature Overview & Architecture)

### 1.1 Mục tiêu nghiệp vụ (SRS Description)
Tính năng **FR-11 (Lịch sử đơn hàng của người dùng)** cho phép khách hàng:
1. Xem danh sách toàn bộ các đơn hàng do chính tài khoản của mình khởi tạo từ trước đến nay, sắp xếp theo thứ tự thời gian mới nhất lên đầu (`ORDER BY id DESC` hoặc `created_at DESC`).
2. Xem chi tiết từng trường dữ liệu của đơn hàng: Mã đơn hàng (`#id`), Ngày đặt hàng (định dạng theo bản địa hóa `toLocaleDateString`), Tổng tiền thanh toán (đơn vị VND `toLocaleString() ₫`), và Trạng thái xử lý đơn hàng (gắn nhãn tiếng Việt tương ứng kèm mã màu CSS trực quan).
3. Thực hiện hủy đơn hàng đối với các đơn hàng còn trong phạm vi cho phép hủy (trạng thái khởi tạo hoặc đang chờ xác nhận) thông qua nút bấm **"Hủy đơn"**.
4. Bảo đảm tính toàn vẹn dữ liệu và an toàn thông tin: Khách hàng tuyệt đối không thể truy cập, xem hoặc thao tác hủy đơn hàng của người khác (Ngăn chặn triệt để lỗ hổng Insecure Direct Object References - IDOR).

### 1.2 Kiến trúc luồng dữ liệu & Tương tác thành phần (Data & Component Flow)
```
[User Browser / React Client]
       │
       ├─ 1. Truy cập trang /profile
       │       ▼
       │   [Profile.jsx] ─── GET /api/orders/my-orders (Header: Bearer Token) ───► [Express server.js]
       │       ▲                                                                         │
       │       │ 2. Trả về JSON mảng orders (lọc user_id = req.user.id)                  ▼
       │       └────────────────────────────────────────────────────────── [SQLite DB: orders]
       │
       ├─ 3. Hiển thị danh sách: Mã ĐH, Ngày đặt, Tổng tiền (₫), Tag trạng thái tiếng Việt
       │       │
       │       ▼
       └─ 4. Người dùng bấm nút "Hủy đơn" trên đơn hàng #ID
               │
               ▼
           cancelOrder(orderId) ─── PUT /api/orders/:id/cancel ───────────────► [Express server.js]
               ▲                                                                         │
               │                                                      Kiểm tra: user_id = req.user.id
               │                                                      Kiểm tra biên trạng thái hủy
               │                                                                         │
               └─ Nhận kết quả cập nhật / Thông báo lỗi ◄────────────────────────────────┘
```

### 1.3 Mã nguồn liên quan & Các lỗi tiềm ẩn (Seeded Bugs) trên SUT
Dựa trên phân tích mã nguồn thực tế tại `eshop-sut/backend/server.js` và `eshop-sut/frontend-web/src/pages/Profile.jsx`:

1. **Lỗi nghiêm trọng tại Backend - Vi phạm biên trạng thái hủy đơn (`server.js` dòng 328–331):**
   ```javascript
   // Mã nguồn hiện tại trong server.js:
   if (order.status === "delivered" || order.status === "canceled") {
     return res.status(400).json({ error: "Cannot cancel this order." });
   }
   ```
   *Lỗ hổng nghiệp vụ:* Backend chỉ từ chối khi đơn hàng đã ở trạng thái `delivered` (đã giao) hoặc `canceled` (đã hủy). Do đó, khi đơn hàng đang ở trạng thái `shipping` (đang giao hàng trên đường), hệ thống **VẪN CHO PHÉP HỦY**! Theo quy tắc nghiệp vụ chuẩn E-Commerce, hàng hóa một khi đã xuất kho và bàn giao cho đơn vị vận chuyển (`shipping`) thì khách hàng không thể đơn phương bấm hủy trên web mà phải qua quy trình trả hàng/từ chối nhận hàng.
   *Logic đúng cần có:*
   ```javascript
   if (order.status !== "pending" && order.status !== "confirmed") {
     return res.status(400).json({ error: "Cannot cancel order in current status." });
   }
   ```

2. **Lỗi logic hiển thị tại Frontend (`Profile.jsx` dòng 199–208):**
   ```javascript
   {/* Nút hủy hiển thị khi chưa giao xong và chưa hủy (kể cả khi đang giao) */}
   {o.status !== "delivered" && o.status !== "canceled" && (
     <button onClick={() => cancelOrder(o.id)} className="...">Hủy đơn</button>
   )}
   ```
   Frontend hiển thị nút hủy ngay cả khi đơn hàng mang trạng thái `shipping`, đồng thuận sai lệch với backend khiêu khích người dùng hủy đơn lúc shipper đang giao hàng.

3. **Thiếu cơ chế xác nhận người dùng (Missing Confirmation Dialog):**
   Hàm `cancelOrder` trong `Profile.jsx` gọi trực tiếp API `PUT /api/orders/${orderId}/cancel` mà không qua hộp thoại xác nhận `window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")`. Điều này khiến thao tác hủy diễn ra tức thì khi người dùng vô tình bấm nhầm.

4. **Kiểm soát truy cập (Access Control) & Bảo mật:**
   - Endpoint `GET /api/orders/my-orders` có middleware `authenticateToken` và lọc `WHERE user_id = ?` dựa vào `req.user.id` được giải mã từ JWT token $\rightarrow$ Bảo mật tốt.
   - Endpoint `PUT /api/orders/:id/cancel` có điều kiện `WHERE id = ? AND user_id = ?` $\rightarrow$ Ngăn chặn IDOR khi User A cố tình hủy đơn của User B.

---

## 2. Phân Tích Miền Đầu Vào & Phân Hoạch Tương Đương (Equivalence Partitioning)

Để thiết kế bộ test case bao phủ toàn diện cho tính năng FR-11, ta xác định 4 biến đầu vào và không gian trạng thái chính:
1. $V_1$: Biến ủy quyền danh tính `Auth Token` (JWT Bearer Token trong Header).
2. $V_2$: Tham số định danh đơn hàng `order_id` (Path parameter trong URL cancel).
3. $V_3$: Trạng thái đơn hàng `order.status` (State domain của đơn hàng trong cơ sở dữ liệu).
4. $V_4$: Quyền sở hữu đối tượng `order.user_id` so với danh tính phiên đăng nhập `req.user.id`.

### 2.1 Phân hoạch tương đương cho biến xác thực `Auth Token` ($V_1$)

| Phân vùng (Partition) | Kiểu miền | Mô tả dữ liệu | Giá trị đại diện | Hành vi mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **EP1-AUTH-V1** | Valid | Token JWT hợp lệ của người dùng đang đăng nhập | `Bearer <valid_user_jwt>` | HTTP 200, trả về đúng danh sách đơn hàng của user. |
| **EP1-AUTH-INV1** | Invalid | Không truyền Header Authorization (Khách vãng lai) | `null` / `undefined` | HTTP 401 hoặc 403, từ chối truy cập. |
| **EP1-AUTH-INV2** | Invalid | Token sai cú pháp hoặc đã hết hạn (Expired/Tampered) | `Bearer invalid_token_xyz` | HTTP 403 Forbidden ("Invalid token"). |

### 2.2 Phân hoạch tương đương cho biến định danh `order_id` ($V_2$)

| Phân vùng (Partition) | Kiểu miền | Mô tả dữ liệu | Giá trị đại diện | Hành vi mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **EP2-OID-V1** | Valid | ID đơn hàng là số nguyên dương tồn tại trong CSDL | `1`, `2`, `10` | Tìm thấy đơn hàng để đối soát nghiệp vụ. |
| **EP2-OID-INV1** | Invalid | ID đơn hàng là số nguyên dương nhưng không tồn tại | `99999` | HTTP 404 ("Order not found"). |
| **EP2-OID-INV2** | Invalid | ID đơn hàng là số 0 hoặc số âm | `0`, `-5` | HTTP 404 ("Order not found"). |
| **EP2-OID-INV3** | Invalid | ID không phải số (ký tự chữ, ký tự đặc biệt) | `'abc'`, `'xyz'` | HTTP 404 hoặc 400 Bad Request. |

### 2.3 Phân hoạch tương đương cho quan hệ sở hữu đối tượng ($V_4$)

| Phân vùng (Partition) | Kiểu miền | Mô tả quan hệ | Tình huống kiểm thử | Hành vi mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **EP4-OWN-V1** | Valid | Đơn hàng thuộc sở hữu của User đăng nhập (`user_id == req.user.id`) | User A thao tác với đơn do chính User A tạo | Cho phép xem và chuyển tiếp xử lý hủy nếu hợp lệ. |
| **EP4-OWN-INV1** | Invalid | Đơn hàng thuộc người dùng khác (`user_id != req.user.id`) | User B gửi request hủy đơn hàng của User A (Tấn công IDOR) | HTTP 404 ("Order not found"), tuyệt đối không cho phép hủy hoặc đọc thông tin. |

---

## 3. Phân Tích Giá Trị Biên & Máy Trạng Thái (Boundary Value Analysis - State Transition)

Trong kiểm thử hướng miền cho hệ thống quản lý đơn hàng, kỹ thuật **Phân tích giá trị biên (BVA)** kết hợp chặt chẽ với **Kiểm thử chuyển trạng thái (State Transition Testing)**.

### 3.1 Mô hình chuyển đổi trạng thái của đơn hàng (Order State Lifecycle)

```
        ┌──────────────┐
        │   pending    │ (Chờ xác nhận) ──[Hủy đơn hợp lệ]──┐
        └──────┬───────┘                                    │
               │ [Admin xác nhận]                           │
               ▼                                            │
        ┌──────────────┐                                    │
        │  confirmed   │ (Đã xác nhận)  ──[Hủy đơn hợp lệ]──┤
        └──────┬───────┘                                    │
               │ [Giao vận chuyển]                          │
               ▼                                            │
 ══════════════╪═══════════════════════════════════════════ │ ═══ BIÊN GIỚI CẤM HỦY (CANCELLATION BOUNDARY)
               ▼                                            │
        ┌──────────────┐                                    │
        │   shipping   │ (Đang giao hàng)                   │
        └──────┬───────┘                                    │
               │ [Giao thành công]                          │
               ▼                                            ▼
        ┌──────────────┐                             ┌──────────────┐
        │  delivered   │ (Đã giao - Điểm kết thúc)   │   canceled   │ (Đã hủy - Điểm kết thúc)
        └──────────────┘                             └──────────────┘
```

### 3.2 Bảng phân tích biên cho thao tác Hủy đơn (`PUT /api/orders/:id/cancel`)

Hành động Hủy đơn là hàm chuyển đổi trạng thái từ trạng thái hiện tại $S_{cur}$ sang trạng thái kết thúc $S_{next} = \text{canceled}$. Biên giới phân định giữa tập trạng thái **Được phép hủy (Permitted/Valid Domain)** và **Không được phép hủy (Prohibited/Invalid Domain)**:

$$\text{Domain}_{\text{Permitted}} = \{\text{pending}, \text{confirmed}\}$$
$$\text{Domain}_{\text{Prohibited}} = \{\text{shipping}, \text{delivered}, \text{canceled}\}$$

| Trạng thái hiện tại ($S_{cur}$) | Phân loại biên (BVA Classification) | Nghiệp vụ kỳ vọng | Kết quả thực tế trên SUT (Observed) | Nhận định (Verdict) |
| :--- | :--- | :--- | :--- | :--- |
| **`pending`** | **On-boundary (Miền hợp lệ)** | Cho phép hủy $\rightarrow$ Chuyển sang `canceled`, HTTP 200 | HTTP 200 `"Order canceled successfully"` | **PASS** |
| **`confirmed`** | **On-boundary (Miền hợp lệ)** | Cho phép hủy $\rightarrow$ Chuyển sang `canceled`, HTTP 200 | HTTP 200 `"Order canceled successfully"` | **PASS** |
| **`shipping`** | **Immediate Off-boundary (Điểm biên cấm đầu tiên)** | **Bắt buộc từ chối $\rightarrow$ HTTP 400 Bad Request** | **HTTP 200 `"Order canceled successfully"`** | **FAIL (BUG SUT NGHIÊM TRỌNG)** |
| **`delivered`** | **Off-boundary (Điểm cuối không hợp lệ)** | Từ chối hủy $\rightarrow$ HTTP 400 Bad Request | HTTP 400 `"Cannot cancel this order."` | **PASS** |
| **`canceled`** | **Terminal State (Đơn đã bị hủy trước đó)** | Từ chối hủy lặp lại $\rightarrow$ HTTP 400 Bad Request | HTTP 400 `"Cannot cancel this order."` | **PASS** |

*Phân tích chi tiết lỗi biên `shipping`:*
- Biên chuyển giao giữa `confirmed` (hàng còn ở kho, có thể giữ lại) và `shipping` (hàng đã giao cho shipper/bưu cục) là **điểm biên tới hạn (Critical Transition Boundary)**.
- Khi lập trình viên viết điều kiện:
  `if (order.status === 'delivered' || order.status === 'canceled') return res.status(400);`
  người phát triển đã vô tình tạo ra lỗ hổng bỏ quên trạng thái biên trung gian `shipping`.

---

## 4. Ma Trận Ca Kiểm Thử Chi Tiết (Detailed Test Cases)

| Mã Test Case | Tiêu đề Test Case | Biến & Miền đầu vào | Điều kiện tiên quyết (Preconditions) | Các bước thực hiện (Test Steps) | Kết quả kỳ vọng (Expected Result) | Kết quả thực tế trên SUT (Actual Result) | Đánh giá (Verdict) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR11-SEC-01** | Kiểm tra chặn truy cập lịch sử đơn khi không có Token | $V_1$: `null` (No Auth Header) | Người dùng chưa đăng nhập hệ thống | 1. Gửi request `GET /api/orders/my-orders` không kèm header Authorization.<br>2. Kiểm tra mã trạng thái HTTP trả về. | HTTP 401 hoặc 403 Access Denied; không trả về bất kỳ bản ghi đơn hàng nào. | HTTP 401 Unauthorized; body rỗng. | **PASS** |
| **TC-FR11-SEC-02** | Kiểm tra phân lập dữ liệu giữa người dùng (Data Isolation) | $V_1$: Token User A; CSDL có đơn hàng của User A và User B | User A có 1 đơn (#1), User B có 1 đơn (#2) | 1. Đăng nhập với tài khoản User A.<br>2. Gửi request `GET /api/orders/my-orders` với Token User A.<br>3. Kiểm tra danh sách đơn trả về. | Danh sách chỉ chứa các đơn hàng có `user_id == User A.id`. Không chứa đơn hàng #2 của User B. | Danh sách chỉ chứa đúng 1 đơn hàng của User A (`user_id == 3`). Không lộ đơn của User B. | **PASS** |
| **TC-FR11-SEC-03** | Kiểm tra chống tấn công IDOR khi hủy đơn hàng của người khác | $V_1$: Token User B; $V_2$: ID đơn hàng #1 của User A | Đơn hàng #1 thuộc sở hữu của User A | 1. Đăng nhập với tài khoản User B.<br>2. Gửi request `PUT /api/orders/1/cancel` mang Token User B.<br>3. Kiểm tra phản hồi. | HTTP 404 Not Found hoặc 403 Forbidden; trạng thái đơn #1 của User A không bị thay đổi. | HTTP 404 `"Order not found"`; đơn #1 giữ nguyên trạng thái. | **PASS** |
| **TC-FR11-BVA-01** | Kiểm thử biên: Hủy đơn hàng ở trạng thái `pending` | $V_3$: `status = "pending"` (On-boundary valid) | User A có đơn hàng mới tạo ở trạng thái `pending` | 1. Gửi `PUT /api/orders/:id/cancel` với Token User A.<br>2. Kiểm tra phản hồi và trạng thái đơn trong DB. | HTTP 200 `"Order canceled successfully"`. Trạng thái đơn đổi thành `canceled`. | HTTP 200, message `"Order canceled successfully"`. | **PASS** |
| **TC-FR11-BVA-02** | Kiểm thử biên: Hủy đơn hàng ở trạng thái `confirmed` | $V_3$: `status = "confirmed"` (On-boundary valid) | User A có đơn hàng đã được Admin chuyển sang `confirmed` | 1. Gửi `PUT /api/orders/:id/cancel` với Token User A.<br>2. Kiểm tra mã phản hồi HTTP. | HTTP 200 `"Order canceled successfully"`. Trạng thái đơn đổi thành `canceled`. | HTTP 200, message `"Order canceled successfully"`. | **PASS** |
| **TC-FR11-BVA-03** | Kiểm thử biên: Hủy đơn hàng ở trạng thái `shipping` (Hàng đang giao) | $V_3$: `status = "shipping"` (Critical Off-boundary invalid) | User A có đơn hàng đã được Admin chuyển sang `shipping` | 1. Gửi `PUT /api/orders/:id/cancel` với Token User A.<br>2. Kiểm tra phản hồi hệ thống. | **HTTP 400 Bad Request** với thông báo lỗi (Hàng đang giao không thể hủy). | **HTTP 200 OK**, phản hồi `"Order canceled successfully"`! Đơn hàng đang đi giao bị hủy sai trái! | **FAIL (BUG SUT)** |
| **TC-FR11-BVA-04** | Kiểm thử biên: Hủy đơn hàng ở trạng thái `delivered` (Đã giao hàng) | $V_3$: `status = "delivered"` (Terminal state invalid) | User A có đơn hàng đã nhận (`delivered`) | 1. Gửi `PUT /api/orders/:id/cancel` với Token User A.<br>2. Kiểm tra phản hồi. | HTTP 400 Bad Request `"Cannot cancel this order."`. | HTTP 400 `"Cannot cancel this order."`. | **PASS** |
| **TC-FR11-BVA-05** | Kiểm thử biên: Hủy đơn hàng đã ở trạng thái `canceled` (Hủy lần 2) | $V_3$: `status = "canceled"` (Terminal state invalid) | Đơn hàng đã bị hủy thành công trước đó | 1. Gửi tiếp request `PUT /api/orders/:id/cancel` vào đơn đã hủy.<br>2. Kiểm tra phản hồi. | HTTP 400 Bad Request `"Cannot cancel this order."`. | HTTP 400 `"Cannot cancel this order."`. | **PASS** |
| **TC-FR11-UI-01** | Kiểm tra nhãn trạng thái tiếng Việt và định dạng tiền tệ | $V_3$: `status = "shipping"`, $total = 30000000$ | Đơn hàng hiển thị trên bảng Lịch sử đơn hàng | 1. Render giao diện `Profile.jsx`.<br>2. Kiểm tra text nhãn trạng thái và format tiền tệ. | Nhãn hiển thị đúng: "Đang giao". Tiền tệ hiển thị đúng định dạng VND: "30,000,000 ₫" hoặc "30.000.000 ₫". | Nhãn hiển thị "Đang giao", tiền tệ định dạng `30,000,000 ₫`. | **PASS** |
| **TC-FR11-UI-02** | Kiểm tra hiển thị nút "Hủy đơn" tại trạng thái `shipping` trên Web UI | $V_3$: `status = "shipping"` | Đơn hàng đang ở trạng thái `shipping` hiển thị trên Profile | 1. Mở trang Profile.<br>2. Quan sát cột "Thao tác" của đơn hàng có trạng thái "Đang giao". | **Không hiển thị nút "Hủy đơn"** vì hàng đang đi giao. | **Hiển thị nút "Hủy đơn" màu đỏ** (`Profile.jsx` chỉ ẩn khi delivered hoặc canceled). | **FAIL (BUG SUT)** |
| **TC-FR11-UI-03** | Kiểm tra hộp thoại xác nhận khi bấm nút "Hủy đơn" trên UI | Tương tác người dùng: Click nút "Hủy đơn" | Người dùng đang xem danh sách đơn hàng có đơn hợp lệ | 1. Nhấn nút "Hủy đơn".<br>2. Quan sát hộp thoại trình duyệt. | Hiển thị hộp thoại `confirm` cảnh báo xác nhận trước khi gửi request. | Không hiển thị bất kỳ xác nhận nào, tự động gọi API hủy ngay lập tức! | **FAIL (BUG SUT)** |

---

## 5. Phân Tích Khoảng Trống AI (AI Gap Analysis)

### 5.1 Hiện tượng AI bỏ sót lỗi biên trong bài toán chuyển trạng thái
Khi sử dụng các công cụ sinh test case tự động bằng AI (LLMs như ChatGPT, GitHub Copilot hay các hệ thống AI Test Generator thông thường) với câu nhắc (prompt): *"Hãy sinh bộ test case cho chức năng Lịch sử đơn hàng và Hủy đơn hàng"*, các công cụ này thường mắc các sai lầm mang tính hệ thống sau:

1. **Giả định tính Đơn điệu (Monotonic State Transition Assumption):**
   - AI thường chỉ hình dung kịch bản "Happy Path": Đơn hàng được tạo ở trạng thái `pending` $\rightarrow$ Khách hàng đổi ý $\rightarrow$ Hủy đơn (`pending` $\rightarrow$ `canceled`).
   - Kịch bản âm bản (Negative Path) mà AI tạo ra thường chỉ là trường hợp cực đoan cuối cùng: Thử hủy đơn hàng đã giao (`delivered` $\rightarrow$ `canceled`).
   - AI gần như **bỏ qua hoàn toàn trạng thái trung gian `shipping`** khi phân tích biên, bởi vì trong nhận thức ngôn ngữ tự nhiên, AI mặc định rằng các trạng thái trung gian tuân theo logic tuần tự thông thường mà không nhận ra đây chính là **vùng biên tranh chấp (Boundary Conflict Zone)** giữa bộ phận kho vận và người dùng.

2. **Ảo tưởng về tính hoàn chỉnh của mã nguồn (Blind Faith in Conditionals):**
   - Khi quét mã nguồn:
     `if (order.status === 'delivered' || order.status === 'canceled')`
     AI thông thường thường suy diễn rằng: *"Nhà phát triển đã chủ động cài đặt logic từ chối các đơn hàng đã đóng (terminal states), do đó mã nguồn đã có xử lý lỗi"*. AI không tự động đặt câu hỏi: *"Liệu danh sách phủ định này có đầy đủ không (Blacklist flaw)?"* thay vì áp dụng nguyên tắc Whitelist bảo mật (`if (status !== 'pending' && status !== 'confirmed')`).

3. **Bỏ qua sự bất đồng bộ giữa Business Flow và UI View:**
   - AI thường kiểm thử API riêng rẽ và UI riêng rẽ. AI ít khi liên kết việc nút bấm "Hủy đơn" trên giao diện React (`Profile.jsx` dòng 200) đang mở cửa cho phép người dùng click khi đơn hàng ở trạng thái `shipping`, dẫn thẳng đến việc gọi API backend bị lỗi.

### 5.2 Giá trị của kỹ thuật kiểm thử miền (Domain Testing) có con người dẫn dắt
- Phương pháp kiểm thử miền chính thống (Black-box & Gray-box Domain Testing) yêu cầu chuyên viên kiểm thử:
  - Vẽ đồ hình chuyển dịch trạng thái toàn vẹn (State Transition Graph).
  - Liệt kê đầy đủ mọi trạng thái trong miền dữ liệu: $\{\text{pending}, \text{confirmed}, \text{shipping}, \text{delivered}, \text{canceled}\}$.
  - Lập ma trận kiểm thử trạng thái 2 chiều ($5 \times 5 = 25$ giao dịch khả dĩ), lập tức phát hiện ngay giao dịch `shipping` $\rightarrow$ `canceled` là một **Invalid Transition** bắt buộc phải có test case kiểm chứng.
- Đây chính là sự khác biệt then chốt giữa việc kiểm thử theo miền chuyên sâu và việc sinh test case hời hợt từ AI.

---

## 6. Kết Quả Chạy Script Kiểm Thử Thực Tế (`tests/verify_fr11.js`)

Kịch bản kiểm thử độc lập `verify_fr11.js` đã được thực thi trực tiếp trên hệ thống SUT đang chạy tại cổng 3000:

```text
================================================================
VERIFYING FR-11: ORDER HISTORY & CANCELLATION (DOMAIN TESTING & BVA)
================================================================

[SETUP] Logged in Admin (ID: 1), User A (ID: 3), User B (ID: 4)

[TC-FR11-SEC-01] GET /api/orders/my-orders without token -> Status: 401
[TC-FR11-SEC-02] User A queries /api/orders/my-orders -> Total: 1, contains User B order? false
[TC-FR11-SEC-03] User B cancels User A order #1 -> Status: 404, Error: Order not found

--- BOUNDARY VALUE ANALYSIS: ORDER STATUS TRANSITION TO CANCELED ---
[TC-FR11-BVA-01] Cancel order in 'pending' status -> Status: 200, Msg: "Order canceled successfully"
[TC-FR11-BVA-02] Cancel order in 'confirmed' status -> Status: 200, Msg: "Order canceled successfully"
[TC-FR11-BVA-03] Cancel order in 'shipping' status -> Status: 200, Response: { message: 'Order canceled successfully' }
[TC-FR11-BVA-04] Cancel order in 'delivered' status -> Status: 400, Error: "Cannot cancel this order."
[TC-FR11-BVA-05] Cancel order already in 'canceled' status -> Status: 400, Error: "Cannot cancel this order."

--- UI DISPLAY & LOCALIZATION SIMULATION ---
[TC-FR11-UI-01] Rendered Format: {
  orderIdText: '#101',
  dateFormatted: '10/15/2026',
  currencyFormatted: '30,000,000 ₫',
  statusText: 'Đang giao',
  statusClass: 'bg-blue-100 text-blue-800',
  canCancelOnUi: true
}
```

### Kết luận đánh giá:
1. **Lỗi nghiêm trọng (Critical Bug) được xác thực:** SUT chấp thuận yêu cầu hủy đơn hàng khi trạng thái là `shipping` (HTTP 200 thay vì HTTP 400).
2. **Lỗi giao diện (UI Bug) được xác thực:** Giao diện hiển thị nút hủy đơn khi trạng thái là `shipping`, và thiếu hộp thoại `confirm` an toàn trước khi hủy.
3. **Bảo mật phân quyền (Access Control) đạt yêu cầu:** Cơ chế JWT và truy vấn `WHERE user_id = req.user.id` ngăn chặn thành công việc xem chéo dữ liệu và tấn công IDOR giữa các người dùng.
