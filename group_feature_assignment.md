# Bảng Phân Công Tính Năng Nhóm — HW02 Domain Testing

- **Môn học:** Kiểm thử phần mềm (CS423 / CSC15003) — FIT@HCMUS
- **Bài tập:** HW02 – Domain Testing on EShop
- **Hệ thống kiểm thử (SUT):** EShop (`https://github.com/ttbhanh/eshop-sut`)
- **Quy tắc phân công (Mục 5 SRS):** Mỗi thành viên chọn đúng **4 tính năng** (1 tính năng từ mỗi Pool: A, B, C, D), đảm bảo **hoàn toàn không có tính năng nào bị trùng lặp** giữa các thành viên trong nhóm.

---

## 1. Bảng Phân Công Tổng Hợp (5 Thành Viên)

| STT | Thành viên | Pool A (Auth & SP) | Pool B (Giỏ hàng & Đơn hàng) | Pool C (Web Admin) | Pool D (Mobile App) |
|:---:|---|---|---|---|---|
| **1** | **Phạm Quang Vinh** *(MSSV: 23120202)* | **FR-01**: Đăng ký tài khoản | **FR-09**: Mã giảm giá (Coupons) | **FR-15**: Quản lý sản phẩm CRUD | **FR-20**: Mobile - Giỏ hàng & Số lượng |
| **2** | **Thành viên 2** *(Họ tên - MSSV)* | **FR-02**: Đăng nhập & Khóa tài khoản | **FR-07**: Giỏ hàng trên Web | **FR-14**: Quản lý danh mục CRUD | **Mobile FR-01**: Đăng ký trên Mobile |
| **3** | **Thành viên 3** *(Họ tên - MSSV)* | **FR-04**: Quản lý hồ sơ cá nhân | **FR-08**: Thanh toán Web (Checkout) | **FR-17**: Quản lý mã giảm giá CRUD | **Mobile FR-02/04**: Đăng nhập & Hồ sơ Mobile |
| **4** | **Thành viên 4** *(Họ tên - MSSV)* | **FR-03**: Quên & Đặt lại mật khẩu | **FR-10**: Máy trạng thái đơn hàng | **FR-16**: Import sản phẩm từ CSV | **Mobile FR-08/09**: Thanh toán & Coupon Mobile |
| **5** | **Thành viên 5** *(Họ tên - MSSV)* | **FR-06**: Chi tiết sản phẩm | **FR-11**: Lịch sử đơn hàng (User) | **FR-19**: Quản lý người dùng Admin | **Mobile FR-10**: Hủy đơn hàng trên Mobile |

---

## 2. Chi Tiết Phạm Vi & Ràng Buộc Kiểm Thử Từng Thành Viên

### Thành viên 1: Phạm Quang Vinh (23120202)
* **Pool A — FR-01 (Đăng ký tài khoản):**
  * *Input:* Họ tên, Email, Mật khẩu, Xác nhận mật khẩu.
  * *Domain & Boundary:* Mật khẩu độ dài $\ge 8$ (biên: 7, 8, 9), đủ 4 loại ký tự (hoa, thường, số, ký tự đặc biệt `@$!%*?&`), Email regex, so khớp Confirm password.
* **Pool B — FR-09 (Mã giảm giá):**
  * *Input:* Code, tổng tiền đơn hàng, trạng thái đăng nhập, số lần đã dùng.
  * *Domain & Boundary:* 5 điều kiện ($C_1 \dots C_5$), biên tổng tiền `total >= min_order_amount` (min−1, min, min+1), biên lượt dùng `count < max_uses`, biên hạn dùng.
* **Pool C — FR-15 (Quản lý sản phẩm CRUD):**
  * *Input:* Tên SP, Giá SP, Danh mục.
  * *Domain & Boundary:* Tên $\le 255$ ký tự (biên: 0, 1, 255, 256), Giá số nguyên $> 0$ (biên: −1, 0, 1).
* **Pool D — FR-20 (Mobile: Giỏ hàng & Số lượng):**
  * *Input:* Ô nhập số lượng sản phẩm, nút thêm vào giỏ, nút $+/-$, gộp dòng.
  * *Domain & Boundary:* Số lượng $\ge 1$ (biên: 0, 1, 2), xóa item kèm dialog xác nhận, tính tổng tiền.

---

### Thành viên 2
* **Pool A — FR-02 (Đăng nhập & Khóa tài khoản):**
  * *Input:* Email, Mật khẩu.
  * *Domain & Boundary:* Đăng nhập đúng / sai; biên số lần đăng nhập sai liên tiếp $\ge 3$ lần (1, 2, 3, 4 lần); biên thời gian khóa tạm thời 30 giây (29s, 30s, 31s).
* **Pool B — FR-07 (Giỏ hàng Web):**
  * *Input:* Số lượng từng sản phẩm, nút $+/-$, nút Xóa.
  * *Domain & Boundary:* Số lượng tối thiểu $\ge 1$, thành tiền = đơn giá $\times$ số lượng, nhãn "Tổng cộng" thay vì "Tổng tạm tính", dialog xác nhận khi xóa.
* **Pool C — FR-14 (Quản lý danh mục CRUD):**
  * *Input:* Tên danh mục.
  * *Domain & Boundary:* Tên danh mục bắt buộc không rỗng (chuỗi rỗng, khoảng trắng, chuỗi hợp lệ), thêm/xóa danh mục.
* **Pool D — Mobile FR-01 (Đăng ký trên Mobile):**
  * *Input:* Form đăng ký trên màn hình Mobile App (`frontend-mobile/App.js`).
  * *Domain & Boundary:* Kiểm tra validate các trường form trên giao diện Mobile, thông báo lỗi hiển thị trên màn hình nhỏ.

---

### Thành viên 3
* **Pool A — FR-04 (Quản lý hồ sơ cá nhân):**
  * *Input:* Họ tên, Số điện thoại, Địa chỉ giao hàng.
  * *Domain & Boundary:* Số điện thoại bắt đầu bằng số `0`, độ dài từ 10–11 chữ số (biên: 9, 10, 11, 12 số); cấm thay đổi trường `role` và Email.
* **Pool B — FR-08 (Thanh toán Web - Checkout):**
  * *Input:* Danh sách giỏ hàng, thông tin thanh toán, token đăng nhập.
  * *Domain & Boundary:* Bắt buộc đăng nhập; kiểm tra tổng tiền tự động tính từ backend (chặn client sửa `total_amount`); làm trống giỏ hàng sau khi thanh toán.
* **Pool C — FR-17 (Quản lý coupon Admin CRUD):**
  * *Input:* Code, Type (`percent`/`fixed`), discount_value, min_order_amount, max_uses_per_user, expired_at.
  * *Domain & Boundary:* Biên `discount_value > 0` (percent $\le 100$), `min_order_amount >= 0`, `max_uses_per_user >= 1`.
* **Pool D — Mobile FR-02/04 (Đăng nhập & Hồ sơ Mobile):**
  * *Input:* Màn hình Đăng nhập và Profile trên Mobile App.
  * *Domain & Boundary:* Lưu trữ token trên Mobile, cập nhật SĐT, địa chỉ và hiển thị thông tin user trên Mobile.

---

### Thành viên 4
* **Pool A — FR-03 (Quên & Đặt lại mật khẩu):**
  * *Input:* Email (bước 1), Mã OTP + Mật khẩu mới + Xác nhận mật khẩu (bước 2).
  * *Domain & Boundary:* Mã OTP đúng 6 chữ số (biên: 5, 6, 7 chữ số), Step Indicator (bước 1/2), OTP hết hạn / sai email.
* **Pool B — FR-10 (Máy trạng thái đơn hàng - State Machine):**
  * *Input:* Hành động chuyển trạng thái đơn hàng (`pending` $\rightarrow$ `confirmed` $\rightarrow$ `shipping` $\rightarrow$ `delivered` / `canceled`).
  * *Domain & Boundary:* Ràng buộc trạng thái kết thúc (`delivered`, `canceled` cấm chuyển trạng thái tiếp); User bị cấm hủy đơn khi đơn ở `shipping`.
* **Pool C — FR-16 (Import sản phẩm từ CSV):**
  * *Input:* File `.csv` (header: `name,price,description,imageUrl,category_id`).
  * *Domain & Boundary:* Header đúng/sai; giá tiền âm / dương; rollback nguyên tử (all-or-nothing: 1 dòng lỗi thì hủy cả file).
* **Pool D — Mobile FR-08/09 (Thanh toán & Coupon Mobile):**
  * *Input:* Màn hình Checkout và ô nhập Coupon trên Mobile App.
  * *Domain & Boundary:* Áp dụng mã giảm giá, kiểm tra tính toán tổng tiền sau giảm giá trên giao diện Mobile.

---

### Thành viên 5
* **Pool A — FR-06 (Chi tiết sản phẩm):**
  * *Input:* Ô nhập số lượng sản phẩm, nút "Thêm vào giỏ hàng".
  * *Domain & Boundary:* Số lượng là số nguyên dương $\ge 1$ (biên: 0, 1, 2, số âm, số thập phân), toast phản hồi sau khi bấm.
* **Pool B — FR-11 (Lịch sử đơn hàng User):**
  * *Input:* Danh sách đơn hàng theo user token.
  * *Domain & Boundary:* Phân quyền xem đơn (chỉ xem đơn của chính mình); hiển thị trạng thái tiếng Việt, mã đơn, định dạng tiền tệ.
* **Pool C — FR-19 (Quản lý người dùng Admin):**
  * *Input:* Danh sách user, thao tác xóa user.
  * *Domain & Boundary:* Không để lộ password; ràng buộc đặc tả: **cấm Admin tự xóa chính tài khoản đang đăng nhập**.
* **Pool D — Mobile FR-10 (Hủy đơn hàng trên Mobile):**
  * *Input:* Nút "Hủy đơn" trong màn hình Đơn hàng Mobile.
  * *Domain & Boundary:* Chỉ hiển thị/cho phép hủy khi trạng thái là `pending` hoặc `confirmed`; chặn hủy khi ở trạng thái `shipping` hoặc `delivered`.

---

## 3. Bảng Kiểm Tra Đối Chiếu (Zero Duplicate Verification)

| Pool | Tổng số tính năng trong Pool | Số lượng đã phân | Tình trạng trùng lặp |
|---|:---:|:---:|:---:|
| **Pool A** | 6 tính năng (FR-01 → FR-06) | 5 tính năng (dư FR-05) | **0% Trùng lặp (Mỗi người 1 FR riêng)** |
| **Pool B** | 5 tính năng (FR-07 → FR-11) | 5 tính năng (phủ 100%) | **0% Trùng lặp (Mỗi người 1 FR riêng)** |
| **Pool C** | 8 tính năng (FR-12 → FR-19) | 5 tính năng (dư FR-12, 13, 18) | **0% Trùng lặp (Mỗi người 1 FR riêng)** |
| **Pool D** | Toàn bộ phân hệ Mobile | 5 màn hình/luồng riêng biệt | **0% Trùng lặp (Mỗi người 1 màn hình riêng)** |
