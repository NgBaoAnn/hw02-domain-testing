# Báo Cáo Kiểm Thử Miền & Phân Tích Giá Trị Biên: FR-19 - Quản Lý Người Dùng Admin (Admin User Management)

- **Môn học:** Kiểm thử phần mềm nâng cao (KCPM)
- **Bài tập:** HW02 – Domain Testing trên EShop
- **Mã tính năng:** FR-19 (Pool C - Quản trị và Tiện ích)
- **Hệ thống thử nghiệm (SUT):** EShop E-Commerce Web Application
- **Môi trường:**
  - Backend: Node.js / Express (Port 3000)
  - Frontend Admin: React / Vite / TailwindCSS (Port 5174)
  - Database: SQLite (`eshop-sut/backend/database.sqlite`)

---

## 1. Tổng Quan Tính Năng & Kiến Trúc (Feature Overview & Architecture)

### 1.1 Mục tiêu nghiệp vụ (SRS Description)
Tính năng **FR-19 (Quản lý người dùng Admin - Admin User Management)** cung cấp cho Quản trị viên hệ thống (Admin) khả năng giám sát tài khoản và duy trì trật tự hệ thống thương mại điện tử:
1. **Xem danh sách toàn bộ người dùng:** Admin có quyền xem danh sách người dùng trong hệ thống kèm theo các trường thông tin quản trị: ID, Tên (`name`), Email, Vai trò (`role`), Trạng thái tài khoản (số lần đăng nhập sai `login_attempts`, thời gian khóa `locked_until`), Địa chỉ giao hàng (`shipping_address`), và Số điện thoại (`phone`).
2. **Bảo mật dữ liệu nhạy cảm:** Danh sách người dùng tuyệt đối **không được để lộ mật khẩu** (kể cả hash mật khẩu hoặc reset token).
3. **Phân quyền truy cập nghiêm ngặt (Role-based Access Control - RBAC):** Chỉ người dùng có vai trò `role === 'admin'` mới được phép gọi các API quản lý người dùng (`/api/admin/users`). Khách vãng lai và người dùng thông thường (`role === 'user'`) phải bị chặn triệt để (HTTP 401/403).
4. **Xóa tài khoản người dùng (Delete User):** Admin có quyền xóa bỏ tài khoản vi phạm hoặc tài khoản rác ra khỏi hệ thống.
5. **Ràng buộc tự bảo vệ - Cấm tự xóa tài khoản (Self-Deletion Constraint):** Admin đang đăng nhập tuyệt đối **không được phép xóa chính tài khoản của mình** (`target_user_id === caller_id`). Quy tắc này nhằm ngăn chặn tình trạng hệ thống bị "mồ côi" quản trị viên (Lockout/Orphaned System) hoặc lỗi thao tác nhầm lẫn tai hại.
6. **Xác nhận thao tác nguy hiểm (Destructive Action Confirmation):** Do hành động xóa là không thể phục hồi (irreversible), giao diện Admin bắt buộc phải hiển thị hộp thoại xác nhận (Confirmation Dialog / Modal) trước khi phát lệnh xóa xuống máy chủ.

### 1.2 Kiến trúc luồng dữ liệu & Tương tác thành phần (Data & Component Flow)

```
[Admin Web Client (Port 5174)]
       │
       ├─ 1. Điều hướng Tab "Quản lý Người dùng" (activeTab === 'users')
       │       ▼
       │   [App.jsx] ─── GET /api/admin/users (Header: Bearer <Admin_JWT>) ───► [Express server.js]
       │       ▲                                                                       │
       │       │ 2. Trả về JSON danh sách users (id, name, email, role, ...)           ▼
       │       └──────────────────────────────────────────────────────────── [SQLite: users]
       │
       ├─ 3. Hiển thị bảng User Table: [ID, Email, Role, Số ĐT, Nút "Xóa"]
       │       │
       │       ▼
       │   Admin click nút "Xóa" trên dòng User #ID
       │       │
       │       ▼ (Thiếu bước Prompt Confirmation Dialog!)
       │   deleteUser(id) ─── DELETE /api/admin/users/:id ───────────────────► [Express server.js]
       │       ▲                                                                       │
       │       │                                                    Thiếu: Check req.user.role === 'admin'
       │       │                                                    Thiếu: Check req.user.id !== req.params.id
       │       │                                                    Thiếu: Check rowCount > 0 (404 Not Found)
       │       │                                                                       ▼
       │       └─ Nhận thông báo { message: "User deleted" } ◄────────────── [SQLite: users]
```

### 1.3 Mã nguồn liên quan & Các lỗi tiềm ẩn (Seeded Bugs) trên SUT

Dựa trên phân tích mã nguồn thực tế tại `eshop-sut/backend/server.js` (dòng 494–508) và `eshop-sut/frontend-admin/src/App.jsx` (dòng 76–83 và dòng 879–918):

1. **Lỗ hổng bảo mật nghiêm trọng - Phá vỡ ủy quyền đối tượng (BOLA / Missing RBAC):**
   ```javascript
   // backend/server.js dòng 504-508:
   app.delete("/api/admin/users/:id", authenticateToken, (req, res) => {
     db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
       res.json({ message: "User deleted" });
     });
   });
   ```
   *Lỗ hổng:* Endpoint chỉ sử dụng middleware `authenticateToken` để kiểm tra JWT hợp lệ, hoàn toàn **KHÔNG KIỂM TRA** `req.user.role === 'admin'`. Bất kỳ người dùng thông thường (`user`) nào chỉ cần đăng ký tài khoản và có JWT hợp lệ đều có thể gửi HTTP `DELETE /api/admin/users/:id` để xóa sạch toàn bộ tài khoản người dùng và thậm chí xóa cả tài khoản Super Admin!

2. **Lỗ hổng rò rỉ danh sách người dùng cho User thường (GET `/api/admin/users`):**
   ```javascript
   // backend/server.js dòng 494-502:
   app.get("/api/admin/users", authenticateToken, (req, res) => {
     db.all(
       "SELECT id, name, email, role, login_attempts, locked_until, shipping_address FROM users",
       [],
       (err, users) => {
         res.json(users);
       },
     );
   });
   ```
   *Lỗ hổng:* Endpoint này cũng chỉ gọi `authenticateToken`, không kiểm tra role. Người dùng thông thường gửi request kèm Bearer token sẽ lấy được toàn bộ danh sách khách hàng và quản trị viên, lộ email và địa chỉ giao hàng. (Điểm tích cực duy nhất là câu lệnh SELECT đã loại bỏ cột `password`).

3. **Vi phạm ràng buộc tự xóa tài khoản (Self-Deletion Constraint Violation):**
   Đặc tả SRS nghiêm cấm tài khoản Admin tự xóa chính mình khi đang thao tác. Tuy nhiên, backend thực thi trực tiếp `DELETE FROM users WHERE id = ?` bằng tham số URL mà không có mệnh đề kiểm tra:
   ```javascript
   if (parseInt(req.params.id) === req.user.id) {
     return res.status(400).json({ error: "Cannot delete your own account." });
   }
   ```
   Hậu quả: Admin tự xóa tài khoản của mình thành công, dẫn đến phiên đăng nhập bị hủy hoại và hệ thống mất quyền quản trị.

4. **Xử lý sai giá trị biên mã định danh không tồn tại (Non-existent ID - False Positive 200 OK):**
   Khi người dùng gửi lệnh xóa một ID không tồn tại (ví dụ: `ID = 999999`, `ID = 0`, hoặc `ID = -1`), SQLite thực thi `DELETE` và trả về `this.changes = 0`. Backend không kiểm tra `this.changes` mà lập tức trả về `HTTP 200 { message: "User deleted" }`. Về mặt chuẩn RESTful API, tài nguyên không tồn tại bắt buộc phải trả về `HTTP 404 Not Found`.

5. **Lỗi thiết kế giao diện (UI Flaw) - Thiếu cảnh báo xác nhận xóa:**
   Tại `frontend-admin/src/App.jsx` (dòng 76–83 và 906–912):
   ```javascript
   const deleteUser = async (id) => {
     try {
       await axios.delete(`${API_URL}/admin/users/${id}`);
       fetchData();
     } catch (err) {
       alert("Lỗi xóa: " + err.message);
     }
   };
   // ...
   <button onClick={() => deleteUser(u.id)}>Xóa</button>
   ```
   Nút "Xóa" kích hoạt trực tiếp hàm `deleteUser` mà không có bất kỳ lệnh gọi `window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")` hay hộp thoại xác nhận nào. Chỉ cần một cú click chuột vô tình, tài khoản người dùng sẽ biến mất vĩnh viễn khỏi CSDL.

---

## 2. Phân Tích Miền Đầu Vào & Phân Hoạch Tương Đương (Equivalence Partitioning)

Để kiểm thử toàn diện chức năng FR-19, ta phân tích không gian tham số đầu vào đa chiều gồm 3 biến chính:
1. $V_1$: **Caller Authentication & Role Domain** (Danh tính và Quyền hạn của người gọi API).
2. $V_2$: **Target User ID Domain** (Định danh người dùng mục tiêu cần thao tác).
3. $V_3$: **Caller-Target Identity Relationship** (Mối quan hệ định danh giữa người gọi và đối tượng bị xóa).

---

### 2.1 Phân hoạch tương đương cho biến Caller Identity & Role ($V_1$)

| Mã phân vùng | Kiểu miền | Mô tả dữ liệu | Giá trị đại diện | Hành vi nghiệp vụ mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **EP1-ROLE-V1** | Valid | Quản trị viên hệ thống có JWT hợp lệ | Header `Authorization: Bearer <admin_token>` (`role: "admin"`) | Cho phép truy cập GET danh sách và DELETE user hợp lệ. |
| **EP1-ROLE-INV1** | Invalid | Người dùng thông thường có JWT hợp lệ | Header `Authorization: Bearer <user_token>` (`role: "user"`) | **HTTP 403 Forbidden** (Từ chối truy cập API quản trị). |
| **EP1-ROLE-INV2** | Invalid | Khách vãng lai (Chưa đăng nhập) | Header Authorization rỗng / `null` | **HTTP 401 Unauthorized** (Yêu cầu đăng nhập). |
| **EP1-ROLE-INV3** | Invalid | Token giả mạo hoặc hết hạn | `Bearer invalid_signature_token` | **HTTP 403 Forbidden** ("Forbidden"). |

---

### 2.2 Phân hoạch tương đương cho biến Target User ID ($V_2$)

| Mã phân vùng | Kiểu miền | Mô tả miền giá trị | Giá trị đại diện | Hành vi nghiệp vụ mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **EP2-UID-V1** | Valid | Số nguyên dương tồn tại trong bảng `users` | `id = 2`, `id = 3` | Thực hiện xóa thành công, trả về HTTP 200. |
| **EP2-UID-INV1** | Invalid | Số nguyên dương nhưng không tồn tại trong CSDL | `id = 999999` | **HTTP 404 Not Found** ("User not found"). |
| **EP2-UID-INV2** | Invalid | Số không (Zero ID) | `id = 0` | **HTTP 400 Bad Request** hoặc **HTTP 404 Not Found**. |
| **EP2-UID-INV3** | Invalid | Số nguyên âm (Negative ID) | `id = -1`, `id = -99` | **HTTP 400 Bad Request** hoặc **HTTP 404 Not Found**. |
| **EP2-UID-INV4** | Invalid | Chuỗi ký tự chữ hoặc ký tự đặc biệt | `id = 'abc'`, `id = ';DROP TABLE'` | **HTTP 400 Bad Request** (Validation Failure). |

---

### 2.3 Phân hoạch tương đương cho quan hệ định danh Caller vs Target ($V_3$)

| Mã phân vùng | Kiểu miền | Mô tả quan hệ | Tình huống kiểm thử | Hành vi nghiệp vụ mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **EP3-REL-V1** | Valid | Khác danh tính ($target\_id \ne caller\_id$) | Admin ID 1 xóa Regular User ID 2 | Cho phép xóa hợp lệ, trả về HTTP 200. |
| **EP3-REL-INV1** | Invalid | Trùng danh tính ($target\_id == caller\_id$) | Admin ID 1 xóa chính mình (ID 1) | **HTTP 400 Bad Request** ("Cannot delete your own account"). Cấm tự xóa! |

---

## 3. Phân Tích Giá Trị Biên (Boundary Value Analysis - BVA)

Trong quản lý người dùng và an toàn hệ thống, kỹ thuật BVA không chỉ áp dụng cho biên số học mà còn áp dụng cho **Biên quan hệ danh tính (Identity Boundary)** và **Biên phân quyền (Privilege Boundary)**.

```
       [ Negative IDs ]     0     [ Valid User IDs in DB ]       [ Non-existent IDs ]
  <----------------------|-----|-----------------------------|------------------------->
        id = -1          id=0    id=1, 2, ..., max_id          id = max_id + 1, 999999
        [INVALID]      [INVALID]        [VALID]                       [INVALID]
```

### 3.1 Biên quan hệ danh tính (Identity Boundary: Self vs Other)

Biên quan hệ danh tính xác định ranh giới giữa việc quản trị tài nguyên người khác và tự hủy hoại phiên của chính mình:

$$\Delta = \text{target\_user\_id} - \text{caller\_user\_id}$$

- **On-Boundary Point ($\Delta = 0 \iff target\_user\_id = caller\_user\_id$):** Điểm biên tới hạn của ràng buộc tự bảo vệ. Thao tác xóa tại điểm này phải bị hệ thống từ chối dứt khoát (**HTTP 400 Bad Request**).
- **Off-Boundary Point ($\Delta \ne 0 \iff target\_user\_id \ne caller\_user\_id$):** Vùng thao tác hợp lệ đối với Admin. Cho phép thực hiện xóa người dùng khác (**HTTP 200 OK**).

### 3.2 Bảng tổng hợp phân tích biên cho FR-19

| Điểm kiểm tra biên (BVA Point) | Phân loại biên | Giá trị kiểm thử | Kết quả kỳ vọng chuẩn SRS | Kết quả thực tế trên SUT | Nhận định (Verdict) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Self-deletion ($\Delta = 0$)** | **Critical Invalid Boundary** | Admin xóa chính ID của mình | **HTTP 400 Bad Request** ("Cannot delete own account") | **HTTP 200 OK** `{ message: "User deleted" }` | **FAIL (BUG SUT NGHIÊM TRỌNG)** |
| **Delete Other ($\Delta \ne 0$)** | **Valid Boundary** | Admin xóa User khác có tồn tại | **HTTP 200 OK** `{ message: "User deleted" }` | **HTTP 200 OK** `{ message: "User deleted" }` | **PASS** |
| **Min Valid ID ($id = 1$)** | **Lower Bound (Valid)** | ID nhỏ nhất của bảng users | Xử lý theo quan hệ identity | Xử lý thành công (hoặc xóa nhầm nếu là self) | **PASS / CONDITIONAL** |
| **Zero ID ($id = 0$)** | **Immediate Lower Off-Bound** | `DELETE /api/admin/users/0` | **HTTP 404 Not Found** hoặc 400 | **HTTP 200 OK** `{ message: "User deleted" }` | **FAIL (BUG SUT)** |
| **Negative ID ($id = -1$)** | **Out-of-Bound (Negative)** | `DELETE /api/admin/users/-1` | **HTTP 404 Not Found** hoặc 400 | **HTTP 200 OK** `{ message: "User deleted" }` | **FAIL (BUG SUT)** |
| **Non-existent ID ($id = 999999$)** | **Upper Off-Bound (Non-existent)** | `DELETE /api/admin/users/999999` | **HTTP 404 Not Found** ("User not found") | **HTTP 200 OK** `{ message: "User deleted" }` | **FAIL (BUG SUT)** |
| **Non-numeric ID ($id = \text{'abc'}\$)** | **Format Boundary** | `DELETE /api/admin/users/abc` | **HTTP 400 Bad Request** | **HTTP 200 OK** `{ message: "User deleted" }` | **FAIL (BUG SUT)** |

---

## 4. Ma Trận Ca Kiểm Thử Chi Tiết (Detailed Test Cases Table)

| Mã Test Case | Tiêu đề Test Case | Phân loại & Miền đầu vào | Điều kiện tiên quyết (Preconditions) | Các bước thực hiện (Test Steps) | Kết quả kỳ vọng (Expected Result) | Kết quả thực tế trên SUT (Actual Result) | Đánh giá (Verdict) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR19-SEC-01** | Kiểm tra chặn truy cập GET danh sách người dùng khi không có Token | EP1-ROLE-INV2: Không có Header Authorization | Khách vãng lai chưa đăng nhập | 1. Gửi request `GET /api/admin/users` không kèm header Authorization.<br>2. Kiểm tra mã phản hồi HTTP. | HTTP 401 Unauthorized; không trả về bất kỳ dữ liệu người dùng nào. | HTTP 401 Unauthorized `{"error":"Unauthorized"}`. | **PASS** |
| **TC-FR19-SEC-02** | Kiểm tra phân quyền truy cập GET danh sách người dùng với tài khoản User thường | EP1-ROLE-INV1: Token của `role: "user"` | Người dùng thông thường đã đăng nhập | 1. Đăng nhập với tài khoản người dùng thường.<br>2. Gửi request `GET /api/admin/users` mang token user.<br>3. Kiểm tra mã phản hồi. | **HTTP 403 Forbidden** (Từ chối vì không phải Admin). | **HTTP 200 OK**! Trả về toàn bộ danh sách người dùng! | **FAIL (LỖ HỔNG BẢO MẬT)** |
| **TC-FR19-SEC-03** | Kiểm tra Admin lấy danh sách người dùng & Bảo vệ mật khẩu | EP1-ROLE-V1: Token Admin hợp lệ | Tài khoản Admin đã đăng nhập | 1. Gửi request `GET /api/admin/users` với Token Admin.<br>2. Duyệt qua mảng users trả về.<br>3. Kiểm tra sự tồn tại của trường `password` và `reset_token`. | HTTP 200 OK; Danh sách chứa các trường công khai; tuyệt đối **không chứa trường `password`**. | HTTP 200 OK; Không có trường `password` trong payload. | **PASS** |
| **TC-FR19-SEC-04** | Kiểm tra lỗ hổng Broken Object Level Authorization (BOLA) trên API DELETE | EP1-ROLE-INV1: User thường gửi DELETE tới ID người khác | Người dùng thường và người dùng nạn nhân cùng tồn tại | 1. Lấy token của User thường.<br>2. Gửi `DELETE /api/admin/users/:victim_id` mang token User thường.<br>3. Kiểm tra phản hồi và trạng thái tài khoản nạn nhân. | **HTTP 403 Forbidden**; Tài khoản nạn nhân không bị xóa khỏi cơ sở dữ liệu. | **HTTP 200 OK** `{ message: "User deleted" }`! Tài khoản nạn nhân bị xóa vĩnh viễn! | **FAIL (LỖ HỔNG CRITICAL)** |
| **TC-FR19-BVA-01** | Kiểm thử ràng buộc tự xóa tài khoản của Admin (Self-Deletion Constraint) | EP3-REL-INV1 / BVA Identity $\Delta = 0$: Admin xóa chính ID của mình | Admin tạm thời đăng nhập với ID xác định | 1. Admin gửi request `DELETE /api/admin/users/:my_admin_id` với Token của chính mình.<br>2. Kiểm tra mã phản hồi và CSDL. | **HTTP 400 Bad Request** với thông báo lỗi cấm tự xóa.<br>Tài khoản Admin không bị xóa. | **HTTP 200 OK** `{ message: "User deleted" }`! Tài khoản Admin bị xóa sổ hoàn toàn! | **FAIL (BUG SUT NGHIÊM TRỌNG)** |
| **TC-FR19-BVA-02** | Kiểm thử Admin xóa tài khoản người dùng khác hợp lệ | EP3-REL-V1 / BVA Identity $\Delta \ne 0$: Admin xóa ID người dùng khác | Tài khoản Admin và tài khoản người dùng rác tồn tại | 1. Admin gửi `DELETE /api/admin/users/:other_user_id`.<br>2. Kiểm tra phản hồi HTTP và bảng `users`. | HTTP 200 OK `{ message: "User deleted" }`. Bản ghi người dùng bị gỡ bỏ khỏi bảng `users`. | HTTP 200 OK `{ message: "User deleted" }`. | **PASS** |
| **TC-FR19-BVA-03** | Kiểm thử biên: Xóa User ID không tồn tại trong CSDL | EP2-UID-INV1 / BVA Upper Off-Bound: $id = 999999$ | Không có user nào mang ID 999999 | 1. Gửi `DELETE /api/admin/users/999999` với Token Admin.<br>2. Kiểm tra mã trạng thái HTTP. | **HTTP 404 Not Found** ("User not found"). | **HTTP 200 OK** `{ message: "User deleted" }` (Sai lệch RESTful). | **FAIL (BUG SUT)** |
| **TC-FR19-BVA-04** | Kiểm thử biên: Xóa User ID bằng 0 | EP2-UID-INV2 / BVA Zero Point: $id = 0$ | Giá trị ID = 0 | 1. Gửi `DELETE /api/admin/users/0` với Token Admin.<br>2. Kiểm tra phản hồi. | **HTTP 400 Bad Request** hoặc **HTTP 404 Not Found**. | **HTTP 200 OK** `{ message: "User deleted" }`. | **FAIL (BUG SUT)** |
| **TC-FR19-BVA-05** | Kiểm thử biên: Xóa User ID là số âm | EP2-UID-INV3 / BVA Negative Point: $id = -1$ | Giá trị ID âm | 1. Gửi `DELETE /api/admin/users/-1` với Token Admin.<br>2. Kiểm tra phản hồi. | **HTTP 400 Bad Request** hoặc **HTTP 404 Not Found**. | **HTTP 200 OK** `{ message: "User deleted" }`. | **FAIL (BUG SUT)** |
| **TC-FR19-BVA-06** | Kiểm thử định dạng: Xóa User ID là chuỗi không phải số | EP2-UID-INV4: $id = \text{'invalid\_abc'}\$ | Tham số chuỗi | 1. Gửi `DELETE /api/admin/users/invalid_abc` với Token Admin.<br>2. Kiểm tra phản hồi. | **HTTP 400 Bad Request** (Lỗi tham số định danh). | **HTTP 200 OK** `{ message: "User deleted" }`. | **FAIL (BUG SUT)** |
| **TC-FR19-UI-01** | Kiểm tra hộp thoại xác nhận khi bấm nút "Xóa" trên giao diện Admin | UI Interaction: Click nút "Xóa" tại bảng Người dùng | Admin đang đăng nhập và xem bảng quản lý người dùng | 1. Nhấn nút "Xóa" trên một dòng người dùng bất kỳ.<br>2. Quan sát sự xuất hiện của popup cảnh báo `window.confirm` hoặc Modal xác nhận. | Hiển thị hộp thoại cảnh báo: "Bạn có chắc chắn muốn xóa người dùng này không?" trước khi phát API request. | **Không có hộp thoại xác nhận nào**, API DELETE được gọi tức thì khi click chuột! | **FAIL (BUG SUT)** |

---

## 5. Phân Tích Khoảng Trống AI (AI Gap Analysis)

### 5.1 Tại sao các công cụ sinh Test tự động bằng AI thường xuyên bỏ sót các lỗi trong FR-19?

Khi yêu cầu các mô hình ngôn ngữ lớn (LLM như GPT-4, Claude, Copilot) hoặc các công cụ sinh kiểm thử tự động tạo kịch bản test cho endpoint `DELETE /api/admin/users/:id`, chúng thường gặp phải những điểm mù nghiêm trọng (Blind Spots):

1. **Ngộ nhận về tên đường dẫn (REST URL Semantic Assumption):**
   - AI nhìn thấy tiền tố `/api/admin/...` và middleware `authenticateToken` trong mã nguồn:
     ```javascript
     app.delete("/api/admin/users/:id", authenticateToken, (req, res) => ...
     ```
   - Do thiên kiến ngữ nghĩa (Semantic Bias), AI tự động mặc định rằng *đã có cơ chế bảo vệ Admin* (hoặc cho rằng framework đã tự động xử lý RBAC từ prefix `admin`).
   - AI hiếm khi suy luận sâu vào logic nội tại của middleware để nhận ra `authenticateToken` chỉ giải mã JWT (`req.user = user`) mà **hoàn toàn bỏ quên bước kiểm tra quyền hạn** `if (req.user.role !== 'admin') return res.status(403)`.
   - Vì vậy, AI gần như không bao giờ tự động tạo ra ca kiểm thử mang tính đối kháng: *Dùng token của một tài khoản khách hàng thông thường để xóa Admin*.

2. **Bỏ qua ràng buộc quan hệ danh tính (Identity-Aware Self-Deletion Constraint):**
   - Hầu hết các bộ sinh test AI chỉ coi tham số `:id` là một biến số học độc lập $X \in \mathbb{N}^+$. Chúng kiểm thử: $X = 1$, $X = 2$, $X = \text{"abc"}$.
   - AI **không kết nối biến đầu vào `$req.params.id$` với ngữ cảnh phiên làm việc `$req.user.id$`**.
   - Mối quan hệ tương quan $target\_id = caller\_id$ là một quy tắc nghiệp vụ bảo mật đặc thù (Business Security Constraint). Nếu người kỹ sư kiểm thử không áp dụng kỹ thuật Domain Testing để phân lập miền định danh (Caller vs Target), AI sẽ hoàn toàn bỏ lỡ kịch bản Admin tự sát tài khoản của chính mình.

3. **Ngộ nhận về trạng thái hoàn tất của DB Driver (The `changes` count oversight):**
   - Trong lập trình Express + SQLite, câu lệnh:
     `db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) { res.json({ message: "User deleted" }); });`
     luôn thực thi callback thành công (không có `err`) kể cả khi không có hàng nào khớp với điều kiện xóa (`this.changes === 0`).
   - AI thường chỉ kiểm tra "Happy Path": gửi một ID và mong đợi mã 200 trả về. Khi gửi ID 999999 và thấy HTTP 200 trả về, AI thậm chí còn đánh giá là **PASS** nếu nó chỉ kiểm tra `status === 200`, thay vì kiểm tra tính đúng đắn của mã trạng thái theo chuẩn HTTP (404 Not Found khi 0 bản ghi bị ảnh hưởng).

4. **Sự chia cắt giữa Frontend UX và Backend Logic:**
   - AI sinh test case cho Frontend thường chỉ kiểm tra render: "Bảng có hiển thị đủ cột không", "Nút Xóa có màu đỏ không".
   - AI sinh test case cho Backend chỉ gửi HTTP request.
   - Khoảng trống nằm ở chỗ: **Hành vi người dùng đối với các thao tác mang tính hủy diệt (Destructive Actions)** đòi hỏi một lớp đệm bảo vệ an toàn giao diện (Confirmation Dialog / Double Confirmation Pattern). AI thiếu khả năng liên kết giữa mức độ rủi ro của nghiệp vụ (xóa dữ liệu vĩnh viễn) với yêu cầu trải nghiệm an toàn người dùng (UX Safeguards).

---

## 6. Kết Quả Thực Thi Script Kiểm Thử (`tests/verify_fr19.js`)

Kịch bản kiểm thử độc lập `verify_fr19.js` đã được thực thi trực tiếp trên hệ thống SUT:

```text
================================================================
VERIFYING FR-19: ADMIN USER MANAGEMENT (DOMAIN TESTING & BVA)
================================================================

[SETUP] Admin logged in. ID: 1, Token available: true
[SETUP] Regular user registered. ID: 11, Email: regular_1792047989878@test.com
[SETUP] Victim users created: ID 12, ID 13

--- TEST SUITE 1: ACCESS CONTROL & SENSITIVE DATA CHECK ---
[TC-FR19-SEC-01] GET /api/admin/users (No Auth) -> HTTP 401 (Expected: 401/403)
[TC-FR19-SEC-02] GET /api/admin/users (Regular User Token) -> HTTP 200
  -> VULNERABILITY ALERT: Regular user can list all user accounts! (Missing role check on GET)
[TC-FR19-SEC-03] GET /api/admin/users (Admin Token) -> HTTP 200, Count: 12
  -> Sensitive Data Leakage: Password field exposed? NO (SECURE)

--- TEST SUITE 2: BROKEN AUTHORIZATION ON DELETE (BOLA) ---
[TC-FR19-SEC-04] Regular user calls DELETE /api/admin/users/12 -> HTTP 200, Body: { message: 'User deleted' }
  -> CRITICAL VULNERABILITY CONFIRMED: Regular user can DELETE any user in the system!

--- TEST SUITE 3: DOMAIN BOUNDARY - SELF-DELETION CONSTRAINT ---
[SETUP] Temporary Admin created. ID: 14, Role: admin
[TC-FR19-BVA-01] Admin deletes own account (ID 14) -> HTTP 200, Body: { message: 'User deleted' }
  -> SPEC VIOLATION / BUG CONFIRMED: Admin was able to delete own currently logged in account!
[TC-FR19-BVA-02] Admin deletes other user (ID 13) -> HTTP 200, Body: { message: 'User deleted' }

--- TEST SUITE 4: NUMERICAL BOUNDARY VALUES ON USER ID ---
[TC-FR19-BVA-03] DELETE non-existent user ID 999999 -> HTTP 200, Body: { message: 'User deleted' }
  -> BUG CONFIRMED: SUT returns 200 "User deleted" when 0 rows were affected (should be 404)!
[TC-FR19-BVA-04] DELETE user ID = 0 -> HTTP 200, Body: { message: 'User deleted' }
[TC-FR19-BVA-05] DELETE user ID = -1 -> HTTP 200, Body: { message: 'User deleted' }
[TC-FR19-BVA-06] DELETE non-numeric user ID 'invalid_abc' -> HTTP 200, Body: { message: 'User deleted' }

--- TEST SUITE 5: FRONTEND UX VERIFICATION ---
[TC-FR19-UI-01] Frontend deleteUser function includes confirmation check? NO (BUG CONFIRMED: Deletion occurs instantly without confirmation)

================================================================
TEST RUN COMPLETE
================================================================
```

---

## 7. Đề Xuất Giải Pháp Khắc Phục (Recommended Fixes)

Để giải quyết toàn diện các lỗi và lỗ hổng bảo mật được phát hiện qua Domain Testing & BVA, khuyến nghị áp dụng các biện pháp sau:

1. **Bổ sung Middleware kiểm tra quyền Quản trị viên (`requireAdmin`):**
   ```javascript
   const requireAdmin = (req, res, next) => {
     if (!req.user || req.user.role !== 'admin') {
       return res.status(403).json({ error: "Access denied. Admin role required." });
     }
     next();
   };
   // Áp dụng cho toàn bộ router /api/admin:
   app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => { ... });
   app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, (req, res) => { ... });
   ```

2. **Cài đặt ràng buộc tự bảo vệ (Self-Deletion Constraint):**
   ```javascript
   app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, (req, res) => {
     const targetId = parseInt(req.params.id, 10);
     if (isNaN(targetId) || targetId <= 0) {
       return res.status(400).json({ error: "Invalid user ID format." });
     }
     if (targetId === req.user.id) {
       return res.status(400).json({ error: "You cannot delete your own account." });
     }
     db.run("DELETE FROM users WHERE id = ?", [targetId], function (err) {
       if (err) return res.status(500).json({ error: err.message });
       if (this.changes === 0) {
         return res.status(404).json({ error: "User not found." });
       }
       res.json({ message: "User deleted successfully." });
     });
   });
   ```

3. **Cải tiến giao diện người dùng Admin với Modal xác nhận:**
   ```jsx
   const deleteUser = async (id, email) => {
     if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn người dùng [${email}] không?`)) {
       return;
     }
     try {
       await axios.delete(`${API_URL}/admin/users/${id}`);
       fetchData();
     } catch (err) {
       alert("Lỗi xóa: " + (err.response?.data?.error || err.message));
     }
   };
   ```
