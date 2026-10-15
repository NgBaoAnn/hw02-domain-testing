# Kế Hoạch Triển Khai HW02 – Domain Testing (Thành Viên 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện toàn bộ bài tập lớn cá nhân HW02 (Domain Testing & BVA) cho 4 tính năng của Thành viên 5 (FR-06, FR-11, FR-19, Mobile FR-10), bao gồm thiết kế test case, kiểm thử và bắt lỗi trên SUT EShop, Agent Skill, AI Audit Report & AI Critique, Git log và bộ hồ sơ đóng gói nộp Moodle.

**Architecture:** Sử dụng phương pháp kiểm thử hộp đen chuẩn ISTQB (Equivalence Partitioning & Boundary Value Analysis) kết hợp AI-First Testing. Xây dựng tài liệu báo cáo dạng Markdown cấu trúc chuẩn học thuật, xây dựng một Agent Skill tự động sinh ca kiểm thử biên/miền, viết test script tự động hóa kiểm chứng API/E2E để chụp chứng cứ lỗi và lập báo cáo GitHub Issues, kết xuất Git log và file zip nộp bài.

**Tech Stack:** Node.js, Express, SQLite, Axios, Playwright/Puppeteer/cURL để trích xuất bug và bằng chứng màn hình, Markdown, Git.

**Spec:** `2026.HW02.Domain Testing_Vi.md` và `group_feature_assignment.md`.

## Global Constraints

- Mỗi tính năng phải được phân tích và thiết kế theo 2 kỹ thuật độc lập: Domain Testing (Equivalence Partitioning) và Boundary Value Analysis (BVA), kèm giải thích chi tiết từng bước.
- Phân tích khoảng trống AI (AI gap analysis) bắt buộc cho cả 4 tính năng: chỉ ra test case/bug mà AI bỏ sót và lý do cụ thể.
- Báo cáo lỗi (Bug Report) phải ghi nhận đầy đủ các lỗi phát hiện được trên SUT, đối chiếu với đặc tả SRS, kèm các bước tái hiện và ảnh chụp màn hình tương ứng cho GitHub Issues.
- Agent Skill phải hoàn chỉnh, có khả năng tái sử dụng cho các tính năng khác kèm hướng dẫn và kịch bản video demo.
- AI Audit Report (nhật ký tương tác với AI: tên công cụ, thời gian, prompt, output) và AI Critique (đoạn văn 200–300 từ trả lời đủ 3 câu hỏi) là phụ lục bắt buộc.
- Git commit log phải ghi nhận từng bước của quy trình kiểm thử cho từng tính năng và lưu dạng text.
- File nộp bài tuân thủ định dạng zip: `<StudentID>_HW02_AI_DomainTesting_<SelfAssessedGrade>.zip`.

## Review Focus

1. **FR-06 (Chi tiết sản phẩm):** Hành vi khi người dùng nhập số lượng $\le 0$, số thực thập phân, chuỗi ký tự, hoặc số lượng vượt quá tồn kho; lỗi click lần đầu tiên bị nuốt (`clickCount === 0`).
2. **FR-11 (Lịch sử đơn hàng):** Bảo mật phân quyền dữ liệu (chỉ xem đơn của mình), hiển thị đúng trạng thái tiếng Việt, mã đơn, và lỗ hổng cho phép hủy đơn khi trạng thái là `shipping`.
3. **FR-19 (Quản lý người dùng Admin):** Lỗ hổng API `DELETE /api/admin/users/:id` không kiểm tra quyền admin và cho phép Admin tự xóa chính tài khoản đang đăng nhập; giao diện thiếu xác nhận xác thực trước khi xóa.
4. **Mobile FR-10 (Hủy đơn hàng Mobile):** Hành vi hủy đơn hàng trực tiếp trên UI Mobile không có xác nhận; trạng thái nút hủy giữa các trạng thái `pending`, `confirmed`, `shipping`, `delivered`, `canceled`.
5. **AI Gap Analysis & Critique:** Đánh giá tính xác thực của việc AI hay có xu hướng giả định hệ thống hoạt động lý tưởng và bỏ sót các lỗi logic nghiệp vụ ngầm (như `clickCount` hay IDOR / Self-deletion).

---

### Task 1: Thiết kế Test Case Domain Testing & BVA cho FR-06 (Chi tiết sản phẩm)

**Files:**
- Create: `reports/feature-a-fr06-product-detail.md`
- Test: `tests/verify_fr06.js`

**Interfaces:**
- Consumes: GET `http://localhost:3000/api/products/:id`, `frontend-web/src/pages/ProductDetail.jsx`
- Produces: Bảng phân tích miền giá trị (Input domains), phân vùng tương đương (Valid/Invalid Equivalence Partitions), giá trị biên (2-point/3-point BVA: 0, 1, 2, max), tập test case chi tiết kèm Expected Result.

- [ ] **Step 1: Viết kịch bản test tự động verify_fr06.js để kiểm chứng các giá trị biên của ô số lượng và nút Thêm vào giỏ hàng**
  Tạo `tests/verify_fr06.js` kiểm tra gửi request và hành vi UI: số lượng = 0, số lượng = 1, số lượng = -1, click lần 1 vs click lần 2.

- [ ] **Step 2: Chạy kịch bản test để ghi nhận hành vi thực tế và lỗi của SUT**
  Chạy: `node tests/verify_fr06.js`
  Kết quả kỳ vọng: Ghi nhận lỗi nút "Thêm vào giỏ" không hoạt động ở lần bấm đầu tiên và nhận số lượng âm/bằng 0.

- [ ] **Step 3: Biên soạn tài liệu Domain Testing & Boundary Value Analysis cho FR-06**
  Soạn thảo `reports/feature-a-fr06-product-detail.md` bao gồm:
  - Phân tích biến đầu vào: `quantity` (kiểu số nguyên), `clickCount` (trạng thái tương tác), `product_id`.
  - Phân hoạch tương đương (Equivalence Partitioning): Miền hợp lệ ($quantity \ge 1$), miền không hợp lệ ($quantity \le 0$, số thập phân, ký tự chữ).
  - Phân tích giá trị biên (BVA): biên dưới ($0, 1, 2$), biên âm ($-1$), biên lớn ($999, 1000$).
  - Bảng tổng hợp Test Cases (ID, mục tiêu kiểm thử, dữ liệu test, kết quả mong đợi, kết quả thực tế, kết luận Pass/Fail).
  - Phân tích khoảng trống AI (AI Gap Analysis): AI thường bỏ sót lỗi `clickCount === 0` vì cho rằng code chỉ gọi `addToCart()`.

- [ ] **Step 4: Kiểm tra và hoàn thiện tài liệu FR-06**
  Đối chiếu tài liệu với yêu cầu mục 6 của đề bài HW02.

- [ ] **Step 5: Git Commit**
  ```bash
  git add reports/feature-a-fr06-product-detail.md tests/verify_fr06.js
  git commit -m "feat(testing): complete domain and bva test design for FR-06 Product Detail"
  ```

---

### Task 2: Thiết kế Test Case Domain Testing & BVA cho FR-11 (Lịch sử đơn hàng)

**Files:**
- Create: `reports/feature-b-fr11-order-history.md`
- Test: `tests/verify_fr11.js`

**Interfaces:**
- Consumes: GET `http://localhost:3000/api/orders/my-orders`, PUT `http://localhost:3000/api/orders/:id/cancel`, `frontend-web/src/pages/Profile.jsx`
- Produces: Ma trận Domain Testing & BVA cho FR-11: lọc đơn theo user, định dạng hiển thị, hủy đơn ở các trạng thái biên (`pending`, `confirmed`, `shipping`, `delivered`, `canceled`).

- [ ] **Step 1: Viết kịch bản test tự động verify_fr11.js kiểm tra quyền xem đơn và logic chuyển trạng thái hủy đơn**
  Tạo `tests/verify_fr11.js` gửi request với token User 1 để xem có thấy đơn User 2 không, và thử hủy đơn khi đơn ở trạng thái `shipping`.

- [ ] **Step 2: Chạy kịch bản test để xác nhận lỗi nghiệp vụ trên SUT**
  Chạy: `node tests/verify_fr11.js`
  Kết quả kỳ vọng: Phát hiện lỗi backend cho phép hủy đơn hàng khi trạng thái là `shipping`.

- [ ] **Step 3: Biên soạn tài liệu Domain Testing & Boundary Value Analysis cho FR-11**
  Soạn thảo `reports/feature-b-fr11-order-history.md` bao gồm:
  - Phân tích biến đầu vào: User Token, Order Status (`pending`, `confirmed`, `shipping`, `delivered`, `canceled`).
  - Phân tích miền và biên trạng thái: Chuyển dịch hợp lệ (`pending`/`confirmed` $\rightarrow$ `canceled`), biên không hợp lệ (`shipping` $\rightarrow$ `canceled`, `delivered` $\rightarrow$ `canceled`).
  - Ma trận test case chi tiết cho hiển thị (tiếng Việt, định dạng tiền, sắp xếp ngày) và chức năng hủy đơn.
  - AI Gap Analysis: AI chỉ sinh test case cho `pending` và `canceled`, bỏ sót kiểm thử biên với trạng thái `shipping`.

- [ ] **Step 4: Kiểm tra tính nhất quán của bảng test case FR-11**
  Xác minh các test case bao phủ cả API và Web UI.

- [ ] **Step 5: Git Commit**
  ```bash
  git add reports/feature-b-fr11-order-history.md tests/verify_fr11.js
  git commit -m "feat(testing): complete domain and bva test design for FR-11 Order History"
  ```

---

### Task 3: Thiết kế Test Case Domain Testing & BVA cho FR-19 (Quản lý người dùng Admin)

**Files:**
- Create: `reports/feature-c-fr19-user-management.md`
- Test: `tests/verify_fr19.js`

**Interfaces:**
- Consumes: GET `http://localhost:3000/api/admin/users`, DELETE `http://localhost:3000/api/admin/users/:id`, `frontend-admin/src/App.jsx`
- Produces: Ma trận Domain & BVA cho quyền Admin, tự xóa tài khoản (Self-deletion constraint), xóa user không tồn tại, xóa user có dữ liệu liên kết.

- [ ] **Step 1: Viết kịch bản test tự động verify_fr19.js kiểm tra xóa người dùng và phân quyền**
  Tạo `tests/verify_fr19.js` mô phỏng: User thường gọi DELETE user, Admin xóa user thường, Admin tự xóa chính tài khoản ID của mình.

- [ ] **Step 2: Chạy test để ghi nhận lỗ hổng bảo mật và vi phạm đặc tả**
  Chạy: `node tests/verify_fr19.js`
  Kết quả kỳ vọng: Ghi nhận API không kiểm tra role admin và cho phép Admin tự xóa chính mình thành công (vi phạm SRS).

- [ ] **Step 3: Biên soạn tài liệu Domain Testing & Boundary Value Analysis cho FR-19**
  Soạn thảo `reports/feature-c-fr19-user-management.md` bao gồm:
  - Phân tích biến: `role` (admin / user / guest), `target_user_id` ($id = me$, $id \ne me$, $id \le 0$, $id$ không tồn tại).
  - Phân tích phân vùng tương đương và giá trị biên của User ID và Quyền hạn truy cập.
  - Tập hợp test cases đầy đủ: Self-deletion test, Non-existent ID, XSS trong bảng user, thiếu confirmation popup.
  - AI Gap Analysis: AI thường cho rằng nút Xóa đã có modal xác nhận hoặc backend đã có middleware `authorizeAdmin()`.

- [ ] **Step 4: Rà soát tài liệu FR-19**
  Đảm bảo đáp ứng đầy đủ tiêu chí của Pool C trong đề bài.

- [ ] **Step 5: Git Commit**
  ```bash
  git add reports/feature-c-fr19-user-management.md tests/verify_fr19.js
  git commit -m "feat(testing): complete domain and bva test design for FR-19 Admin User Management"
  ```

---

### Task 4: Thiết kế Test Case Domain Testing & BVA cho FR-10 Mobile (Hủy đơn hàng trên Mobile)

**Files:**
- Create: `reports/feature-d-mobile-fr10-cancel-order.md`
- Test: `tests/verify_mobile_fr10.js`

**Interfaces:**
- Consumes: `frontend-mobile/App.js`, PUT `http://localhost:3000/api/orders/:id/cancel`
- Produces: Ma trận Domain & BVA kiểm thử giao diện và hành vi nút "Hủy đơn" trên Mobile: hiển thị nút có điều kiện, xử lý chạm hủy vô tình, cập nhật danh sách sau hủy.

- [ ] **Step 1: Viết kịch bản test verify_mobile_fr10.js kiểm tra logic hiển thị nút hủy đơn và API call**
  Tạo kịch bản kiểm tra logic điều kiện `(o.status === "pending" || o.status === "confirmed")` và hàm `cancelOrder`.

- [ ] **Step 2: Chạy kịch bản test để xác nhận các biên logic trên Mobile**
  Chạy: `node tests/verify_mobile_fr10.js`
  Kết quả kỳ vọng: Xác nhận nút bị ẩn khi `shipping`/`delivered` trên UI nhưng thiếu hộp thoại `Alert.alert` xác nhận trước khi hủy.

- [ ] **Step 3: Biên soạn tài liệu Domain Testing & Boundary Value Analysis cho Mobile FR-10**
  Soạn thảo `reports/feature-d-mobile-fr10-cancel-order.md` bao gồm:
  - Phân tích biến đầu vào: Trạng thái đơn hàng trên Mobile UI, sự kiện chạm `onPress`.
  - Phân vùng tương đương miền trạng thái: Cho phép hủy (`pending`, `confirmed`) vs Không cho phép hủy (`shipping`, `delivered`, `canceled`).
  - Phân tích giá trị biên: Chuyển dịch biên giữa `confirmed` (có nút) và `shipping` (mất nút), xử lý mạng chập chờn khi hủy đơn.
  - Bộ test cases chi tiết: Kiểm thử hiển thị, kiểm thử thao tác, kiểm thử thông báo lỗi/thành công.
  - AI Gap Analysis: AI không chú ý đến vấn đề UX mobile thiếu confirm dialog dẫn đến việc người dùng dễ bấm nhầm nút Hủy đơn màu đỏ.

- [ ] **Step 4: Hoàn thiện báo cáo Mobile FR-10**
  Đảm bảo đáp ứng đầy đủ tiêu chí 15 điểm của Pool D.

- [ ] **Step 5: Git Commit**
  ```bash
  git add reports/feature-d-mobile-fr10-cancel-order.md tests/verify_mobile_fr10.js
  git commit -m "feat(testing): complete domain and bva test design for Mobile FR-10 Cancel Order"
  ```

---

### Task 5: Xây dựng Báo Cáo Lỗi (Bug Report) & Bằng Chứng GitHub Issues

**Files:**
- Create: `reports/bug_report.md`
- Create: `screenshots/` (thư mục lưu ảnh chụp bằng chứng lỗi)
- Create: `scripts/capture_bugs.js`

**Interfaces:**
- Consumes: Các lỗi phát hiện từ Task 1, 2, 3, 4 trên SUT EShop.
- Produces: Danh sách báo cáo lỗi chuẩn học thuật và tài liệu hướng dẫn tạo GitHub Issues với đầy đủ ảnh chụp màn hình.

- [ ] **Step 1: Viết script tự động kích hoạt và chụp ảnh màn hình bằng chứng các bug đã tìm thấy**
  Tạo `scripts/capture_bugs.js` sử dụng công cụ chụp (hoặc render giao diện) để lưu ảnh bằng chứng các lỗi vào thư mục `screenshots/`:
  - Bug 1: FR-06 - Nút "Thêm vào giỏ hàng" không hoạt động ở lần nhấn đầu tiên (`clickCount === 0`).
  - Bug 2: FR-06 - Cho phép nhập số lượng âm và số lượng bằng 0 vào giỏ hàng.
  - Bug 3: FR-11 / Backend - Cho phép hủy đơn hàng đang ở trạng thái `shipping`.
  - Bug 4: FR-19 - Admin có thể tự xóa chính tài khoản đang đăng nhập qua API/UI.
  - Bug 5: FR-19 - Không có hộp thoại xác nhận khi bấm Xóa tài khoản người dùng.
  - Bug 6: Mobile FR-10 - Hủy đơn hàng trực tiếp ngay khi chạm không có hộp thoại xác nhận.

- [ ] **Step 2: Chạy script chụp ảnh bằng chứng lỗi**
  Chạy: `node scripts/capture_bugs.js`
  Kết quả kỳ vọng: Tạo đầy đủ các tệp ảnh chụp màn hình trong `screenshots/`.

- [ ] **Step 3: Soạn thảo tài liệu báo cáo lỗi reports/bug_report.md**
  Định dạng chuẩn mỗi bug:
  - Bug ID, Tiêu đề tóm tắt, Tính năng liên quan.
  - Mức độ nghiêm trọng (Severity: Critical / High / Medium / Low).
  - Môi trường thử nghiệm (URL, Trình duyệt, OS).
  - Các bước tái hiện (Steps to Reproduce - chi tiết từng bước).
  - Kết quả thực tế (Actual Result) vs Kết quả mong đợi (Expected Result).
  - Bằng chứng ảnh chụp màn hình (`screenshots/...`).
  - Đường dẫn / Mẫu bài đăng trên GitHub Issues của nhóm.

- [ ] **Step 4: Rà soát báo cáo lỗi**
  Đảm bảo mọi lỗi đều có chứng cứ rõ ràng và liên kết trực tiếp với mã nguồn SUT.

- [ ] **Step 5: Git Commit**
  ```bash
  git add reports/bug_report.md scripts/capture_bugs.js screenshots/
  git commit -m "docs(bugs): create detailed bug report with reproduction steps and screenshots"
  ```

---

### Task 6: Phát Triển Reusable Agent Skill (Domain Testing & BVA Generator)

**Files:**
- Create: `skills/domain-bva-generator/SKILL.md`
- Create: `skills/domain-bva-generator/prompts/domain_analysis_prompt.md`
- Create: `skills/domain-bva-generator/prompts/bva_analysis_prompt.md`
- Create: `skills/domain-bva-generator/scripts/generate_test_cases.js`
- Create: `skills/domain-bva-generator/README.md` (kèm kịch bản video demo YouTube)

**Interfaces:**
- Consumes: Đặc tả tính năng hoặc API endpoint bất kỳ.
- Produces: Agent Skill có thể nạp vào OpenCode / Claude Code / Agentic CLI để tự động phân tích biến đầu vào, phân vùng tương đương và sinh test case biên 2-point/3-point.

- [ ] **Step 1: Định nghĩa cấu trúc Agent Skill và quy chuẩn phân tích theo ISTQB**
  Tạo `skills/domain-bva-generator/SKILL.md` hướng dẫn agent từng bước thực hiện Domain Testing & BVA, tránh sinh prompt chung chung.

- [ ] **Step 2: Viết script tự động generate_test_cases.js hỗ trợ agent sinh test case**
  Tạo script nhận vào schema/inputs và tự động xuất bảng Markdown test case phân tích biên.

- [ ] **Step 3: Chạy thử nghiệm script sinh test case với một tính năng mẫu**
  Chạy: `node skills/domain-bva-generator/scripts/generate_test_cases.js`
  Kết quả kỳ vọng: Xuất ra bảng test case chuẩn định dạng cho một tính năng.

- [ ] **Step 4: Soạn thảo tài liệu hướng dẫn và Kịch bản Video Demo YouTube**
  Tạo `skills/domain-bva-generator/README.md` mô tả cách cài đặt skill, cách tái sử dụng cho các tính năng khác, và nội dung kịch bản video demo end-to-end (kèm chỗ điền link YouTube).

- [ ] **Step 5: Git Commit**
  ```bash
  git add skills/domain-bva-generator/
  git commit -m "feat(skill): create reusable Domain and BVA testing agent skill with demo script"
  ```

---

### Task 7: Lập Báo Cáo Kiểm Toán AI (AI Audit Report) & Đánh Giá Phản Biện AI (AI Critique)

**Files:**
- Create: `reports/ai_audit_report.md`
- Create: `reports/ai_critique.md`

**Interfaces:**
- Consumes: Nhật ký toàn bộ các phiên làm việc và câu lệnh prompt từ đầu đến cuối, các hạn chế và lỗi nhận định của AI trong quá trình kiểm thử.
- Produces: Bản khai báo minh bạch sử dụng AI, nhật ký kiểm toán (Tên tool, Thời gian, Prompt, Output), và bài viết phản biện AI (200–300 từ) trả lời trọn vẹn 3 câu hỏi bắt buộc theo SRS.

- [ ] **Step 1: Tổng hợp nhật ký tương tác AI vào reports/ai_audit_report.md**
  Bao gồm câu tuyên bố bắt buộc: `"I use AI tools for the following tasks,"` và bảng/danh sách chi tiết từng phiên tương tác (Công cụ, Thời gian, Prompt, AI Output tóm tắt).

- [ ] **Step 2: Soạn thảo bài phản biện AI reports/ai_critique.md (độ dài đúng 200–300 từ)**
  Trả lời chính xác 3 câu hỏi của đề bài:
  1. *AI đã làm sai, bị thiên kiến hoặc chưa hoàn chỉnh ở điểm nào?* (Ví dụ: Giả định code hoạt động đúng chuẩn và bỏ sót lỗi logic ngầm như `clickCount`, giả định admin API có authorization).
  2. *Tại sao AI lại không phát hiện ra vấn đề đó?* (Do AI chỉ phân tích trên góc nhìn "happy path" và dữ liệu huấn luyện thiên về code chuẩn, thiếu khả năng thực thi động nếu không được con người dẫn dắt từng bước).
  3. *Nguyên tắc rút ra về việc cộng tác với AI?* (AI là công cụ hỗ trợ tăng tốc, con người phải nắm vững kỹ thuật kiểm thử và trực tiếp thẩm định code/kết quả thực tế).

- [ ] **Step 3: Đếm số lượng từ bài AI Critique để đảm bảo nằm chính xác trong khoảng 200–300 từ**
  Kiểm tra số từ thực tế của `reports/ai_critique.md`.

- [ ] **Step 4: Git Commit**
  ```bash
  git add reports/ai_audit_report.md reports/ai_critique.md
  git commit -m "docs(ai): complete AI Audit Report and AI Critique (200-300 words)"
  ```

---

### Task 8: Tổng Hợp Báo Cáo Chính, README.md, Git Commit Log & Đóng Gói Hồ Sơ Nộp Bài

**Files:**
- Create: `REPORT.md` (Báo cáo chính hợp nhất đầy đủ 4 tính năng)
- Create: `README.md` (Bảng tự đánh giá điểm 100/100, tóm tắt chỉ số test, link video demo)
- Create: `git_commit_log.txt` (Nhật ký commit Git theo từng bước)
- Create: `scripts/package_submission.sh` (Script tự động đóng gói file zip)

**Interfaces:**
- Consumes: Tất cả các báo cáo và tài liệu từ Task 1 đến Task 7.
- Produces: Bộ hồ sơ hoàn chỉnh sẵn sàng nộp Moodle với định dạng file zip `<StudentID>_HW02_AI_DomainTesting_100.zip`.

- [ ] **Step 1: Hợp nhất toàn bộ nội dung thành Báo cáo chính REPORT.md**
  Tập hợp phần Giới thiệu, Phương pháp luận Domain Testing & BVA, Chi tiết kết quả 4 tính năng (FR-06, FR-11, FR-19, Mobile FR-10), Báo cáo lỗi, AI Gap Analysis, và Phụ lục.

- [ ] **Step 2: Tạo tệp README.md với Bảng tự đánh giá điểm và Tóm tắt kiểm thử**
  Điền bảng tự chấm điểm theo mẫu chuẩn của đề bài:
  - Feature A (FR-06): 25/25
  - Feature B (FR-11): 25/25
  - Feature C (FR-19): 25/25
  - Feature D (Mobile FR-10): 15/15
  - Agent Skills: 10/10
  - **Tổng cộng: 100/100**
  Cùng bảng thống kê: Số tính năng (4), Số test case thiết kế, đã chạy, pass, fail, số bug phát hiện.

- [ ] **Step 3: Trích xuất lịch sử Git commit ra tệp text git_commit_log.txt**
  Chạy lệnh trích xuất: `git log --pretty=format:"[%h] %ad - %s" --date=short > git_commit_log.txt`

- [ ] **Step 4: Viết script package_submission.sh và kiểm tra tính đầy đủ của file zip**
  Tạo script đóng gói gom tất cả các file bắt buộc theo Mục 14 của SRS vào file `<StudentID>_HW02_AI_DomainTesting_100.zip`.

- [ ] **Step 5: Git Commit cuối cùng**
  ```bash
  git add REPORT.md README.md git_commit_log.txt scripts/package_submission.sh
  git commit -m "docs: finalize complete submission package for HW02 Domain Testing"
  ```
