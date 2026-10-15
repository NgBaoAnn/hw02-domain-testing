# PHỤ LỤC KIỂM TOÁN SỬ DỤNG CÔNG CỤ TRÍ TUỆ NHÂN TẠO (AI AUDIT REPORT)
## DỰ ÁN KIỂM THỬ MIỀN VÀ GIÁ TRỊ BIÊN - HỆ THỐNG ESHOP (HW02 - MEMBER 5)

---

### Tuyên bố bắt buộc (Mandatory AI Declaration)

> **"I use AI tools for the following tasks,"**

Tôi sử dụng các công cụ Trí tuệ nhân tạo (AI Tools) để hỗ trợ quá trình thực hiện bài tập lớn HW02 môn Kiểm thử Phần mềm Nâng cao, bao gồm:
1. Phân tích tài liệu yêu cầu (SRS) và mã nguồn của Hệ thống Thương mại Điện tử EShop (SUT).
2. Nhận diện các biến đầu vào, phân tích miền giá trị (Domain Analysis), phân vùng tương đương (Equivalence Partitioning) và xác định giá trị biên (Boundary Value Analysis - BVA).
3. Thiết kế bảng ma trận ca kiểm thử (Domain Test Matrices & Boundary Test Cases) chuẩn hóa Markdown.
4. Sinh mã kịch bản kiểm thử tự động (Automated Test Scripts) bằng Jest, Supertest, React Testing Library và Puppeteer E2E.
5. Soạn thảo tài liệu báo cáo lỗi (Bug Reports), phân tích mã nguồn gây lỗi (Root Cause Analysis) và đề xuất bản vá mã nguồn.
6. Thiết kế và đóng gói Agent Skill tái sử dụng (`domain-testing-agent`) phục vụ kiểm thử miền tự động.

---

## 1. THÔNG TIN CÁC CÔNG CỤ AI ĐÃ SỬ DỤNG (AI TOOLS INVENTORY)

| Tên công cụ AI (Tool Name) | Phiên bản / Mô hình (Model / Provider) | Môi trường tích hợp (Environment) | Mục đích sử dụng chính |
| :--- | :--- | :--- | :--- |
| **Gemini 3.8 Flash** | Google Antigravity Agent Engine | OpenCode CLI & Autonomous Agent | Phân tích SUT, thiết kế ma trận kiểm thử, sinh test suite, phân tích bug |
| **Claude 3.5 Sonnet** | Anthropic | AI Coding Assistant & Code Reviewer | Đối soát kịch bản kiểm thử, kiểm tra cú pháp Jest/React Testing Library |

---

## 2. NHẬT KÝ KIỂM TOÁN TƯƠNG TÁC AI CHI TIẾT (AI INTERACTION SESSIONS LOG)

Dưới đây là nhật ký chi tiết ghi lại toàn bộ các phiên làm việc chính với AI Agent từ Task 1 đến Task 6 theo thời gian thực:

### Phiên 1: Khảo sát và Thiết kế kiểm thử FR-06 Chi tiết sản phẩm & Giỏ hàng
- **Thời gian:** Ngày 15 tháng 10 năm 2026, 13:57 (GMT+7)
- **Công cụ AI:** Gemini 3.8 Flash (Antigravity Agent)
- **Prompt:**
  ```text
  Đọc mã nguồn frontend-web/src/pages/ProductDetail.jsx và SRS yêu cầu FR-06.
  Hãy thực hiện Domain Analysis: xác định các biến (quantity, stock, clickCount),
  phân vùng tương đương (Hợp lệ, Không hợp lệ, Biên), xây dựng bảng kiểm thử BVA
  (ON, OFF, IN, OUT) và sinh test suite Jest kiểm thử toàn diện tính năng này.
  Lưu kết quả vào reports/feature-a-fr06-product-detail.md và tests/domain/product_detail.test.js.
  ```
- **AI Output tóm tắt:**
  - AI phân tích cấu trúc component `ProductDetail.jsx`, phát hiện trường input số lượng và cơ chế tồn kho `stock`.
  - Ban đầu AI giả định hàm `handleAddToCart` gọi bình thường, nhưng khi rà soát mã nguồn thực tế, phát hiện bẫy mã nguồn `if (clickCount === 0) setClickCount(1); return;` khiến lần nhấn đầu tiên bị vô hiệu.
  - Sinh bảng 12 ca kiểm thử miền và file kiểm thử `tests/domain/product_detail.test.js` bao quát các biên: 0, 1, stock, stock+1, -1, số thực, chuỗi ký tự.

---

### Phiên 2: Thiết kế kiểm thử FR-11 Lịch sử đơn hàng & Hủy đơn hàng
- **Thời gian:** Ngày 15 tháng 10 năm 2026, 14:01 (GMT+7)
- **Công cụ AI:** Gemini 3.8 Flash (Antigravity Agent)
- **Prompt:**
  ```text
  Phân tích endpoint PUT /api/orders/:id/cancel trong backend/server.js và màn hình
  frontend-web/src/pages/OrderHistory.jsx. Phân tích máy trạng thái (State Machine):
  pending, shipping, delivered, cancelled. Thiết kế các ca kiểm thử BVA và Domain
  chuyển trạng thái, viết file tests/domain/order_history.test.js và lưu báo cáo vào
  reports/feature-b-fr11-order-history.md.
  ```
- **AI Output tóm tắt:**
  - Phân tích điều kiện backend: phát hiện câu lệnh SQL `WHERE id = ? AND status IN ('pending', 'shipping')` cho phép hủy đơn hàng cả khi đang giao hàng (`shipping`), vi phạm quy tắc nghiệp vụ thực tế.
  - Xây dựng 10 ca kiểm thử miền: hủy đơn pending, shipping, delivered, cancelled, mã đơn không tồn tại, đơn của người khác.
  - Sinh test suite Jest + Supertest kiểm thử trực tiếp logic API backend.

---

### Phiên 3: Thiết kế kiểm thử FR-19 Quản lý người dùng Admin
- **Thời gian:** Ngày 15 tháng 10 năm 2026, 14:05 (GMT+7)
- **Công cụ AI:** Gemini 3.8 Flash (Antigravity Agent)
- **Prompt:**
  ```text
  Khảo sát backend/server.js (các endpoint /api/users và DELETE /api/users/:id) cùng
  frontend-admin/src/App.jsx. Phân tích miền vai trò (Admin, User), quyền tự xóa tài khoản,
  lỗ hổng Broken Object Level Authorization (BOLA). Lập báo cáo reports/feature-c-fr19-user-management.md
  và viết file tests/domain/admin_user_management.test.js.
  ```
- **AI Output tóm tắt:**
  - Phát hiện 2 lỗi bảo mật nghiêm trọng: Endpoint `DELETE /api/users/:id` hoàn toàn không có middleware kiểm tra vai trò admin (ai cũng xóa được nếu gửi HTTP request), và hệ thống cho phép Admin tự xóa chính tài khoản ID của mình, gây nguy cơ tự khóa hệ thống (Self-Lockout).
  - Lập ma trận 11 ca kiểm thử miền và hoàn thiện bộ test Supertest tái hiện chính xác lỗ hổng.

---

### Phiên 4: Thiết kế kiểm thử Mobile App FR-10 Hủy đơn hàng
- **Thời gian:** Ngày 15 tháng 10 năm 2026, 14:09 (GMT+7)
- **Công cụ AI:** Gemini 3.8 Flash (Antigravity Agent)
- **Prompt:**
  ```text
  Phân tích frontend-mobile/App.js tại hàm handleCancelOrder và giao diện hiển thị danh sách đơn hàng.
  Đánh giá miền dữ liệu mobile (mạng ngắt kết nối, token hết hạn, trạng thái nút, hộp thoại Alert xác nhận).
  Tạo báo cáo reports/feature-d-mobile-fr10-cancel-order.md và kịch bản tests/domain/mobile_cancel_order.test.js.
  ```
- **AI Output tóm tắt:**
  - Xác định giao diện React Native thiếu bước `Alert.alert` yêu cầu người dùng xác nhận trước khi gửi request hủy đơn hàng.
  - Phân tích trạng thái xử lý bất đồng bộ, lập 9 ca kiểm thử miền bao gồm phản hồi UI, disable nút khi đang tải và cập nhật danh sách sau khi hủy thành công.

---

### Phiên 5: Tổng hợp Báo cáo Lỗi Phần mềm (Bug Report) & GitHub Issues
- **Thời gian:** Ngày 15 tháng 10 năm 2026, 14:14 (GMT+7)
- **Công cụ AI:** Gemini 3.8 Flash (Antigravity Agent)
- **Prompt:**
  ```text
  Tổng hợp toàn bộ 7 lỗi phần mềm phát hiện được qua 4 tính năng (BUG-01 đến BUG-07).
  Viết báo cáo chuyên sâu reports/bug_report.md chuẩn quốc tế IEEE 829 / Jira Bug Format:
  Title, Severity, Priority, Steps to Reproduce, Actual Result, Expected Result,
  Root Cause Analysis kèm dòng code lỗi, đề xuất mã vá (Fix Patch) và mẫu GitHub Issue tương ứng.
  ```
- **AI Output tóm tắt:**
  - Soạn thảo tài liệu toàn diện 7 lỗi phần mềm với đầy đủ bằng chứng, nguyên nhân sâu xa, đoạn mã vá chi tiết và 7 bản mẫu GitHub Issue hoàn chỉnh sẵn sàng để mở trên GitHub repository.

---

### Phiên 6: Xây dựng Agent Skill Tự động hóa Kiểm thử Miền
- **Thời gian:** Ngày 15 tháng 10 năm 2026, 14:20 (GMT+7)
- **Công cụ AI:** Gemini 3.8 Flash (Antigravity Agent)
- **Prompt:**
  ```text
  Đóng gói quy trình kiểm thử miền và BVA thành một Agent Skill chuẩn OpenCode.
  Tạo thư mục skills/domain-testing-agent/ với file SKILL.md hướng dẫn quy trình 5 bước,
  bộ template ma trận Markdown, checklist kiểm tra biên BVA và script demo tests/demo_skill_runner.js.
  ```
- **AI Output tóm tắt:**
  - Tạo cấu trúc thư mục `skills/domain-testing-agent/` gồm `SKILL.md`, template và checklist chuẩn mực.
  - Viết và chạy thử nghiệm thành công kịch bản `tests/demo_skill_runner.js` chứng minh khả năng tự động phân tích và sinh ca kiểm thử biên.

---

## 3. KẾT LUẬN VỀ VIỆC SỬ DỤNG AI

Toàn bộ các nội dung do AI sinh ra đều được kiểm tra đối chiếu trực tiếp với mã nguồn thật của SUT, chạy thử nghiệm thực tế qua bộ kiểm thử Jest (`npm test`), và được thành viên dự án hiệu chỉnh để đảm bảo tính khách quan, chính xác tuyệt đối và trung thực học thuật.
