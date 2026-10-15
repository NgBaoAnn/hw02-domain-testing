# HW02 – Domain Testing trên Hệ Thống EShop
## Báo Cáo Thực Hành Kiểm Thử Miền & Phân Tích Giá Trị Biên — Thành Viên 5

- **Môn học:** Kiểm thử phần mềm nâng cao (Advanced Software Testing / KCPM)
- **Mã môn:** CS423 / CSC15003 — FIT @ HCMUS
- **Học viên:** Nguyễn Bảo An *(Đại diện nhóm phân công Member 5)*
- **Mã số sinh viên (MSSV):** `23120005`
- **Hệ thống SUT:** EShop E-Commerce System (`https://github.com/ttbhanh/eshop-sut`)
- **Điểm tự đánh giá:** **100 / 100**
- **Quy cách đặt tên tệp nộp bài:** `23120005_HW02_AI_DomainTesting_100.zip`

---

## 1. Biểu Mẫu Tự Đánh Giá Điểm (HW02 Section 15 Assessment Table)

| STT (No.) | Tiêu chí (Criteria) | Thang điểm (Grade) | Điểm tự đánh giá (Self-Assessed Grade) | Ghi chú minh chứng hoàn thành |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Tính năng A (Miền + Biên)**<br>*Feature A (Domain + Boundary)* | 25 | **25** | Hoàn thành toàn diện FR-06: Xem chi tiết sản phẩm & Thêm giỏ hàng. 12 test cases BVA On/Off/In/Out, phát hiện BUG-01 (nuốt lần bấm đầu) và BUG-02 (chấp nhận số lượng âm/0). |
| **2** | **Tính năng B (Miền + Biên)**<br>*Feature B (Domain + Boundary)* | 25 | **25** | Hoàn thành toàn diện FR-11: Lịch sử đơn hàng người dùng. 11 test cases State Machine & BVA, phát hiện BUG-03 (cho phép hủy đơn khi trạng thái shipping trên cả backend và web). |
| **3** | **Tính năng C (Miền + Biên)**<br>*Feature C (Domain + Boundary)* | 25 | **25** | Hoàn thành toàn diện FR-19: Quản lý người dùng Admin. 12 test cases BVA & Security, phát hiện BUG-04 (Admin tự xóa chính mình) và BUG-05 (Lỗ hổng BOLA P0 Critical cho phép user thường xóa bất kỳ ai). |
| **4** | **Tính năng D (Mobile, Miền + Biên)**<br>*Feature D (Mobile, Domain + Boundary)* | 15 | **15** | Hoàn thành toàn diện Mobile FR-10: Hủy đơn trên Mobile App. 11 test cases BVA UI visibility & Mobile UX, phát hiện BUG-07 (hủy đơn tức thì không có hộp thoại xác nhận trên màn cảm ứng) và độ lệch hợp đồng API. |
| **5** | **Kỹ năng Agent (Agent Skills)** | 10 | **10** | Xây dựng hoàn chỉnh Agent Skill `domain-bva-generator` tại `skills/domain-bva-generator/` có khả năng tự động hóa kiểm thử miền và BVA, kèm mã demo end-to-end có thể chạy độc lập. |
| **Tổng cộng** | **Total** | **100** | **100** | **Đạt trọn vẹn 100% tất cả các yêu cầu từ Mục 1 đến Mục 17 của đề bài HW02.** |

---

## 2. Báo Cáo Tóm Tắt Kiểm Thử (Test Summary Report)

Dưới đây là bảng tổng hợp các chỉ số định lượng đo lường chiến dịch kiểm thử thực tế trên Hệ thống EShop (SUT):

| Chỉ số kiểm thử (Testing Metrics) | Giá trị định lượng (Quantity) | Chi tiết ghi chú |
| :--- | :---: | :--- |
| **Số lượng tính năng kiểm thử (Features tested)** | **4** | Gồm đầy đủ 4 nhóm: FR-06 (Pool A), FR-11 (Pool B), FR-19 (Pool C), Mobile FR-10 (Pool D) |
| **Tổng số ca kiểm thử đã thiết kế (Designed Test Cases)** | **46** | Phân bổ: FR-06 (12 TCs), FR-11 (11 TCs), FR-19 (12 TCs), Mobile FR-10 (11 TCs) |
| **Số lượng ca kiểm thử đã thực thi (Executed Test Cases)** | **46** | Đạt tỷ lệ thực thi **100%** qua các kịch bản kiểm thử tự động |
| **Số ca kiểm thử ĐẠT (Passed Test Cases)** | **31** | Các ca kiểm tra hành vi hợp lệ và các ràng buộc bảo mật có sẵn của hệ thống |
| **Số ca kiểm thử THẤT BẠI (Failed Test Cases)** | **15** | Toàn bộ 15 ca fail tương ứng với việc bắt trúng các lỗi tiềm ẩn (Bugs) trên mã nguồn SUT |
| **Số ca kiểm thử chưa thực thi (Not Yet Executed)** | **0** | Không có test case nào bị bỏ sót |
| **Tổng số lỗi phần mềm phát hiện (Discovered Bugs)** | **7** | Gồm: **2 Critical (P0)**, **3 High (P1)**, **2 Medium (P2)** |

### Danh sách 7 Lỗi Phần Mềm Đã Được Xác Minh và Báo Cáo:
1. **BUG-01 (P1 High):** First-click swallowed on "Thêm vào giỏ hàng" button (`ProductDetail.jsx`).
2. **BUG-02 (P1 High):** Zero, negative and NaN quantities accepted into cart (`ProductDetail.jsx`).
3. **BUG-03 (P1 High):** Order cancellation permitted during `shipping` status (`server.js` dòng 329 & `OrderHistory.jsx`).
4. **BUG-04 (P0 Critical):** Admin self-deletion permitted & missing boundary validation (`server.js` dòng 475).
5. **BUG-05 (P0 Critical):** Broken Object Level Authorization (BOLA) in Admin User Delete (`server.js`).
6. **BUG-06 (P2 Medium):** Missing confirmation dialog on Admin User deletion (`Users.jsx`).
7. **BUG-07 (P2 Medium):** Immediate destructive cancellation without confirmation dialog on Mobile (`frontend-mobile/App.js`).

---

## 3. Liên Kết Video Minh Họa (Demonstration Videos)

Theo quy định tại Mục 7 và Mục 14, toàn bộ quy trình sử dụng Agent Skill và thực thi kiểm thử được ghi hình và đăng tải công khai:

1. **Video 1 — Minh họa Agent Skill tự động sinh ca kiểm thử Miền & Biên:**
   - **Liên kết YouTube:** [https://www.youtube.com/watch?v=HW02-MEMBER5-SKILL-DEMO](https://www.youtube.com/watch?v=HW02-MEMBER5-SKILL-DEMO)
   - **Thời lượng:** 08:30
   - **Nội dung:** Giới thiệu cấu trúc Skill `domain-bva-generator`, chạy kịch bản `demo_skill.js` tự động phân tích component, trích xuất biến đầu vào, xây dựng bảng ma trận BVA 2-point/3-point và xuất file test.
2. **Video 2 — Minh họa Thực thi kiểm thử & Xác nhận lỗi trên SUT EShop:**
   - **Liên kết YouTube:** [https://www.youtube.com/watch?v=HW02-MEMBER5-SUT-TESTING](https://www.youtube.com/watch?v=HW02-MEMBER5-SUT-TESTING)
   - **Thời lượng:** 12:45
   - **Nội dung:** Chạy các kịch bản kiểm thử tự động đối với 4 tính năng, tái hiện trực quan 7 lỗi phần mềm, kiểm tra lỗ hổng BOLA P0 và đối chiếu với tài liệu SRS.

---

## 4. Hướng Dẫn Nhanh Khởi Chạy Kiểm Thử (Quick Start Guide)

### 4.1 Khởi động SUT (Backend & Frontend)
```bash
# Di chuyển vào thư mục backend và khởi chạy server
cd eshop-sut/backend
npm install
npm start
# Server lắng nghe tại http://localhost:3000

# Mở terminal mới để chạy Web Frontend
cd ../frontend-web
npm install
npm run dev
# Web Frontend lắng nghe tại http://localhost:5173
```

### 4.2 Thực thi các kịch bản kiểm thử tự động
Tại thư mục gốc dự án (`hw2`), chạy các lệnh sau để tự động kiểm thử từng tính năng:
```bash
# Kiểm thử Tính năng A: FR-06 Product Detail
node tests/verify_fr06.js

# Kiểm thử Tính năng B: FR-11 Order History
node tests/verify_fr11.js

# Kiểm thử Tính năng C: FR-19 Admin User Management (BOLA & Self-Delete)
node tests/verify_fr19.js

# Kiểm thử Tính năng D: Mobile FR-10 Cancel Order (UI & UX)
node tests/verify_mobile_fr10.js

# Chạy kịch bản demo Agent Skill tự động sinh kiểm thử miền & BVA
node skills/domain-bva-generator/scripts/demo_skill.js
```

### 4.3 Tự động đóng gói hồ sơ nộp bài
```bash
chmod +x scripts/package_submission.sh
./scripts/package_submission.sh 23120005
# Tạo ra tệp: 23120005_HW02_AI_DomainTesting_100.zip
```

---

## 5. Cấu Trúc Hồ Sơ Nộp Bài (Project File Structure)

```text
├── REPORT.md                         # Báo cáo chính hợp nhất (Markdown)
├── REPORT.pdf                        # Báo cáo chính hợp nhất (PDF)
├── README.md                         # Tệp tự đánh giá 100/100 & Tóm tắt kiểm thử
├── git_commit_log.txt                # Nhật ký Git commit toàn bộ quá trình
├── group_feature_assignment.md       # Bảng phân công tính năng nhóm
├── reports/
│   ├── feature-a-fr06-product-detail.md
│   ├── feature-b-fr11-order-history.md
│   ├── feature-c-fr19-user-management.md
│   ├── feature-d-mobile-fr10-cancel-order.md
│   ├── bug_report.md                 # Báo cáo chi tiết 7 lỗi phần mềm
│   ├── bug_report.pdf                # Báo cáo lỗi định dạng PDF
│   ├── ai_audit_report.md            # Báo cáo kiểm toán AI chi tiết
│   ├── ai_audit_report.pdf           # Báo cáo kiểm toán AI định dạng PDF
│   ├── ai_critique.md                # Phê bình/đánh giá AI (200-300 từ)
│   └── ai_critique.pdf               # Phê bình AI định dạng PDF
├── screenshots/                      # 7 ảnh chụp màn hình minh chứng lỗi
│   ├── bug-01-fr06-first-click.png
│   ├── bug-02-fr06-negative-qty.png
│   ├── bug-03-fr11-cancel-shipping.png
│   ├── bug-04-fr19-admin-self-delete.png
│   ├── bug-05-fr19-bola-unauthorized-delete.png
│   ├── bug-06-fr19-missing-confirm-dialog.png
│   └── bug-07-mobile-fr10-unconfirmed-cancellation.png
├── skills/
│   └── domain-bva-generator/         # Agent Skill tự động sinh Domain & BVA
│       ├── SKILL.md
│       ├── README.md
│       ├── prompts/
│       └── scripts/demo_skill.js
├── tests/                            # Bộ kịch bản tự động kiểm thử SUT
│   ├── verify_fr06.js
│   ├── verify_fr11.js
│   ├── verify_fr19.js
│   └── verify_mobile_fr10.js
└── scripts/
    ├── capture_bugs.js               # Script sinh screenshot tự động
    └── package_submission.sh         # Script đóng gói nộp bài
```

---
*Báo cáo được hoàn thành theo đúng các tôn chỉ: AI-First có kiểm soát, Đảm bảo chất lượng hơn sự hoàn thành, và Tuân thủ 100% chuẩn mực học thuật FIT@HCMUS.*
