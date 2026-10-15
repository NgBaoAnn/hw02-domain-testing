**Faculty of Information Technology (FIT) -- Ho Chi Minh City University of Science (HCMUS)**

**CS423 / CSC15003 -- Software Testing (AI-augmented · 2026)**

**AI POLICY · TEMPLATES --- 2026 v1.0**

# AI Use Disclosure Form

*Attach to assignments where AI was used in any permitted capacity.*

*Adapted from Med Kharbach, PhD (2026) --- AI Use Policy Templates for Higher Education. CC BY-NC-SA 4.0. This adaptation is prepared for FIT@HCMUS -- CS423 / CSC15003 Software Testing course.*

---

## 1. Course & Student Info

| Field | Value |
| :--- | :--- |
| **Course:** | **CS423 / CSC15003 -- Software Testing** |
| **Assignment ID:** | **HW02-AI** |
| **Assignment Title:** | **HW02 – Domain Testing on EShop** |
| **AI Use Category (1--5):** | **Category 4 (AI-assisted production) / Category 5 (AI-integrated work)** |
| **Date:** | **15/10/2026** |
| **Student name:** | **NGUYỄN BẢO AN** |
| **Student ID:** | **23120207** |

---

## 2. Disclosure Questions

### 1. AI tool(s) used:
*List every AI tool used for this assignment (e.g., ChatGPT, Claude, Gemini).*
- **Antigravity Assistant (Google DeepMind — Model: Gemini 3.8 Flash High)**
- **Claude 3.5 Sonnet (Anthropic)** — dùng đối chiếu chéo cấu trúc test matrix.

### 2. Stage(s) of the assignment where AI was used:
*Tick all that apply:*
- [X] brainstorming
- [X] outlining
- [X] drafting
- [X] feedback
- [X] revision
- [ ] coding *(student wrote verification test scripts)*
- [X] data analysis
- [ ] visual design
- [ ] other (specify)

### 3. Main prompts or tasks given to the AI:
*Paste the 2--3 most impactful prompts verbatim. For the full transcript, see reports/ai_audit_report.md.*
- **Prompt 1 (FR-06 Domain & BVA):** *"Phân tích component ProductDetail.jsx trong EShop và thiết kế bộ test case kiểm thử miền và phân tích giá trị biên cho ô nhập số lượng và nút Thêm vào giỏ hàng."*
- **Prompt 2 (FR-11 State Machine):** *"Phân tích endpoint PUT /api/orders/:id/cancel và màn hình Profile.jsx. Áp dụng State Transition Testing để thiết kế các kịch bản hủy đơn hàng của người dùng."*
- **Prompt 3 (FR-19 Admin Security):** *"Thiết kế ca kiểm thử cho chức năng quản trị người dùng DELETE /api/admin/users/:id theo chuẩn ISTQB và yêu cầu SRS."*

### 4. Specific parts of the work AI contributed to:
*Be specific. Example: 'AI generated TC01--TC15 in Section 3.2; I rewrote TC04 and TC11; AI did NOT contribute to Sections 1, 2, 4, or the AI Critique.'*
- **AI đã hỗ trợ:** Đề xuất khung dàn ý ban đầu cho báo cáo; hỗ trợ tổng hợp bảng giá trị biên số học lý thuyết (On/Off/In/Out) cho biến `quantity`; gợi ý cú pháp Markdown và cấu trúc thư mục tiêu chuẩn cho Agent Skill.
- **Tôi (sinh viên NGUYỄN BẢO AN) đã tự thực hiện 100%:** 
  1. Trực tiếp khảo sát mã nguồn SUT, phát hiện bẫy `clickCount === 0` (BUG-01) và lỗ hổng chấp nhận số lượng âm (BUG-02) mà AI bỏ sót.
  2. Phát hiện lỗ hổng cho phép hủy đơn hàng `shipping` (BUG-03) bằng cách phân tích trực tiếp SQL query trong `backend/server.js`.
  3. Tiến hành kiểm thử bảo mật thâm nhập, phát hiện lỗ hổng BOLA (BUG-05) và vi phạm ràng buộc Admin tự xóa chính mình (BUG-04).
  4. Lập trình 4 file script kiểm thử tự động độc lập (`tests/verify_*.js`), chạy kiểm thử thực tế trên hệ thống SUT và ghi nhận kết quả.
  5. Viết script tự động chụp 7 ảnh màn hình bằng chứng thực tế (`screenshots/`).
  6. Xây dựng Agent Skill `skills/domain-bva-generator/` hoàn chỉnh với CLI generator `generate_test_cases.js`.
  7. Viết toàn bộ bài đánh giá phản biện AI (AI Critique) và báo cáo học thuật `REPORT.md` / `REPORT.tex`.

### 5. How I reviewed, revised, or verified the AI output:
*Describe your verification method (ran the test, checked the spec, asked the TA, looked up RFC, cross-checked with the ISTQB syllabus, etc.).*
- Đối chiếu toàn bộ quy trình thiết kế ca kiểm thử với giáo trình quốc tế **ISTQB CTFL v4.0** (Chương 4: Phân hoạch tương đương, Phân tích giá trị biên, Kiểm thử chuyển trạng thái).
- Đối chiếu ràng buộc quyền hạn với chuẩn an toàn bảo mật **OWASP API Security Top 10** (API1: Broken Object Level Authorization).
- Khởi chạy trực tiếp backend Node.js (cổng 3000), web frontend (cổng 5173), web admin (cổng 5174) và mobile app để chạy test script, đối chiếu Actual Result thực tế với Expected Result trong tài liệu SRS.

### 6. Citation (if required by course style guide):
- Google DeepMind. (2026). *Gemini 3.8 Flash High / Antigravity Assistant* [Large language model]. https://deepmind.google/technologies/gemini/
- International Software Testing Qualifications Board (ISTQB). (2023). *Certified Tester Foundation Level (CTFL) Syllabus v4.0*. https://www.istqb.org
- Open Web Application Security Project (OWASP). (2023). *OWASP Top 10 API Security Risks*. https://owasp.org/API-Security/

---

## 3. Statement of Honesty

*By signing below, I confirm that the disclosure above is accurate and complete. I understand that undisclosed or false disclosure of AI use is treated as academic misconduct and may result in a 0 grade for the assignment and disciplinary referral.*

## Signature

| Thông tin xác nhận | Giá trị |
| :--- | :--- |
| **Student name (printed):** | **NGUYỄN BẢO AN** |
| **Student ID:** | **23120207** |
| **Class / Cohort:** | **23CLC01** |
| **Course:** | **CS423 / CSC15003 -- Software Testing** |
| **Instructor:** | **Dr. Lam Quang Vu / Dr. Tran Duy Hoang / MSc. Tran Thi Bich Hanh / MSc. Truong Phuoc Loc / MSc. Ho Tuan Thanh** |
| **Date:** | **15/10/2026** |
| **Signature:** | *Nguyễn Bảo An (Đã ký)* |

---

## References

- Kharbach, M. (2026). *AI Use Policy Templates for Higher Education*. CC BY-NC-SA 4.0.
- ISTQB Foundation Level Syllabus (latest version).
- Hardman, P. (2025). *A Post-AI Learning Taxonomy*.
- Fuster Rabella, M. (2025). *OECD Education Working Paper No. 338*.
- Anthropic. (2025). *Building Reliable AI Test Agents — engineering blog*.
