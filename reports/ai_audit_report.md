**Faculty of Information Technology (FIT) -- Ho Chi Minh City University of Science (HCMUS)**

**CS423 / CSC15003 -- Software Testing (AI-augmented · 2026)**

**AI POLICY · TEMPLATES --- 2026 v1.0**

# AI Audit Report --- 5-section Template per Artifact

*Mandatory appendix for every AI-assisted homework (HW#01--HW#06, and Seminar).*

*Adapted from Med Kharbach, PhD (2026) --- AI Use Policy Templates for Higher Education. CC BY-NC-SA 4.0. This adaptation is prepared for FIT@HCMUS -- CS423 / CSC15003 Software Testing course.*

---

## 1. Student Information

| Field | Value |
| :--- | :--- |
| **Student name (printed):** | **NGUYỄN BẢO AN** |
| **Student ID:** | **23120207** |
| **Assignment ID:** | **HW02-AI** |
| **Assignment Title:** | **HW02 – Domain Testing on EShop** |
| **Assignment date:** | **15/10/2026** |
| **AI tool(s) used:** | **Antigravity Assistant (Google DeepMind — Model: Gemini 3.8 Flash High)** |
| **AI assistance declared:** | **[X] Yes &nbsp;&nbsp;&nbsp;&nbsp; [ ] No** |

---

## 2. Instructions (read before filling)

- Add one row per AI-generated artifact (test case, script, checklist, OpenAPI spec, JMeter plan, etc.).
- Paste the verbatim prompt --- DO NOT paraphrase.
- Paste the verbatim AI output (or include a labelled screenshot in the report).
- Tag the verdict: **VALID** / **INVALID** / **INCOMPLETE**.
- Reasoning must cite a course slide, ISTQB section, or technical RFC.
- Show the corrected artifact with the change highlighted.

---

## 3. Audit Table --- one row per artifact

| (1) Prompt + Tool | (2) AI Output | (3) Verdict | (4) Reasoning (ISTQB) | (5) Student Fix |
| :--- | :--- | :---: | :--- | :--- |
| **Artifact #1: Test Case Design & Phân tích biên cho FR-06 (Product Detail)**<br><br>**Tool:** Antigravity (Gemini 3.8 Flash High)<br>**Time:** 09:15 15/10/2026<br>**Prompt:** *"Phân tích component ProductDetail.jsx trong EShop và thiết kế bộ test case kiểm thử miền và phân tích giá trị biên cho ô nhập số lượng và nút Thêm vào giỏ hàng."* | AI sinh ra 8 test case tập trung vào luồng thông thường: nhập số lượng 1, 5, 10, kiểm tra hiển thị tên sản phẩm, giá tiền và hình ảnh. AI kết luận chức năng đạt chuẩn. | **INCOMPLETE** | Đối chiếu **ISTQB CTFL v4.0** Mục 4.2.1 (Phân hoạch tương đương) & Mục 4.2.2 (Phân tích giá trị biên 2-point/3-point):<br>1. AI bỏ qua các biên không hợp lệ dưới mức 1 ($Q=0, Q=-1, Q=-100$).<br>2. AI hoàn toàn bỏ qua bẫy trạng thái React `clickCount === 0` nuốt sự kiện click đầu tiên. | Đã bổ sung 6 ca kiểm thử biên âm, số 0, số thực và bẫy `clickCount`:<br>1. Phát hiện **BUG-01**: Click lần đầu bị nuốt do `clickCount === 0`.<br>2. Phát hiện **BUG-02**: Cho phép nhập $Q=0$ và $Q=-1$ vào giỏ làm trừ tiền thanh toán.<br>3. Viết kịch bản tự động `tests/verify_fr06.js` tái hiện 100% lỗi. |
| **Artifact #2: Phân tích máy trạng thái hủy đơn hàng FR-11 (Order History)**<br><br>**Tool:** Antigravity (Gemini 3.8 Flash High)<br>**Time:** 10:30 15/10/2026<br>**Prompt:** *"Phân tích endpoint PUT /api/orders/:id/cancel và màn hình Profile.jsx. Áp dụng State Transition Testing để thiết kế các kịch bản hủy đơn hàng của người dùng."* | AI vẽ sơ đồ máy trạng thái lý tưởng: `pending -> confirmed -> shipping -> delivered` và khẳng định khách hàng hủy được khi `pending`/`confirmed`, bị chặn khi `shipping`/`delivered`. | **INCOMPLETE** | Đối chiếu **ISTQB CTFL v4.0** Mục 4.2.3 (Kiểm thử chuyển trạng thái):<br>AI tin tưởng vào mô hình nghiệp vụ lý thuyết mà không đọc kỹ câu lệnh logic thực tế trong mã nguồn backend `server.js:328-331`. | Đã kiểm tra trực tiếp mã nguồn `server.js`:<br>1. Phát hiện câu lệnh kiểm tra: `if (order.status === 'delivered' \|\| order.status === 'canceled')` $\to$ Đơn hàng `shipping` bị lọt qua và cho phép hủy trái phép (**BUG-03**).<br>2. Bổ sung ca kiểm thử trạng thái biên `shipping` và viết script `tests/verify_fr11.js`. |
| **Artifact #3: Kiểm tra phân quyền & Quản lý User FR-19 (Admin Users)**<br><br>**Tool:** Antigravity (Gemini 3.8 Flash High)<br>**Time:** 11:45 15/10/2026<br>**Prompt:** *"Thiết kế ca kiểm thử cho chức năng quản trị người dùng DELETE /api/admin/users/:id theo chuẩn ISTQB và yêu cầu SRS."* | AI sinh ra các ca kiểm thử: Admin xóa thành công tài khoản người dùng, xóa ID không tồn tại trả về 404, và không gửi token trả về 401. | **INVALID** | Đối chiếu **ISTQB CTFL v4.0** Mục 4.2.1 kết hợp chuẩn bảo mật **OWASP API Security Top 10 (BOLA / BFLA)**:<br>AI mắc "Happy-path Security Bias", mặc định rằng router `/api/admin/*` đương nhiên đã có middleware kiểm tra quyền Admin (`req.user.role === 'admin'`). | Đã thực hiện kiểm thử thâm nhập (Penetration Test):<br>1. Phát hiện **BUG-05 (P0 Critical)**: Lỗ hổng BOLA cho phép tài khoản User thường gọi lệnh xóa sạch bất kỳ người dùng nào.<br>2. Phát hiện **BUG-04 (P0 Critical)**: Vi phạm đặc tả SRS cấm Admin tự xóa tài khoản của chính mình.<br>3. Phát hiện **BUG-06**: Nút Xóa thiếu hộp thoại xác nhận `window.confirm`.<br>4. Viết script `tests/verify_fr19.js`. |
| **Artifact #4: Kiểm thử ứng dụng di động Mobile FR-10 (Mobile Cancel Order)**<br><br>**Tool:** Antigravity (Gemini 3.8 Flash High)<br>**Time:** 13:20 15/10/2026<br>**Prompt:** *"Kiểm thử màn hình lịch sử đơn hàng và chức năng hủy đơn hàng trong frontend-mobile/App.js theo chuẩn ISO/IEC 25010."* | AI chỉ kiểm tra cú pháp React Native, xác nhận các thẻ `TouchableOpacity` và `Alert.alert('Thành công')` gọi đúng cú pháp. | **INCOMPLETE** | Đối chiếu tiêu chuẩn công thái học di động **Apple Human Interface Guidelines & Material Design**: Thao tác hủy đơn là hành động mang tính phá hủy dữ liệu (Destructive Action), bắt buộc phải có hộp thoại xác nhận hai bước chống chạm nhầm (Accidental Tap). | Đã rà soát code `frontend-mobile/App.js` dòng 312-329:<br>1. Phát hiện **BUG-07 (P2)**: Bấm nút Hủy đơn trên cảm ứng kích hoạt gọi API hủy tức thì mà không hề có `Alert.alert` hỏi xác nhận.<br>2. Phát hiện sự lệch pha hợp đồng (Contract Divergence): Mobile ẩn nút khi `shipping` nhưng backend API vẫn chấp nhận hủy đơn `shipping`.<br>3. Viết script `tests/verify_mobile_fr10.js`. |
| **Artifact #5: Xây dựng Reusable Agent Skill (domain-bva-generator)**<br><br>**Tool:** Antigravity (Gemini 3.8 Flash High)<br>**Time:** 14:10 15/10/2026<br>**Prompt:** *"Tạo một Agent Skill có thể tái sử dụng để tự động hóa kỹ thuật Domain Testing và Boundary Value Analysis theo chuẩn ISTQB."* | AI đề xuất một tài liệu Markdown mô tả chung chung về lý thuyết phân vùng tương đương và giá trị biên, không có mã kịch bản thực thi. | **INCOMPLETE** | Để trở thành một Agent Skill thực thụ theo chuẩn Agent Skills / OpenCode / Claude Code, skill phải có cấu trúc YAML metadata chuẩn, prompt định hướng chống ảo giác, và mã kịch bản CLI có thể chạy tự động. | Đã hoàn thiện toàn bộ gói skill `skills/domain-bva-generator/`:<br>1. `SKILL.md`: Khung quy trình 5 bước ISTQB có ràng buộc chống ảo giác.<br>2. `generate_test_cases.js`: CLI script chạy thực tế hỗ trợ tham số `--strategy 2point/3point` tự sinh ma trận test case.<br>3. `README.md`: Kịch bản video demo YouTube end-to-end hoàn chỉnh. |

---

## 4. Summary of AI Accuracy

Tổng hợp kết quả thẩm định kiểm toán từ Mục 3:

| Metric | Count | Percentage |
| :--- | :---: | :---: |
| **Total AI-generated artifacts audited** | **5** | **100.0%** |
| **VALID (correct, accepted as-is)** | **0** | **0.0%** |
| **INVALID (wrong; rejected)** | **1** | **20.0%** |
| **INCOMPLETE (acceptable after human edits)** | **4** | **80.0%** |

---

## 5. Conclusion --- When should AI be used (or not)?

*(Dung lượng: 142 từ)*

Through rigorous empirical auditing across four core testing domains on the EShop system, a clear operational boundary emerges regarding Large Language Models (LLMs) in software testing:
- **When AI should be used:** AI excels as a cognitive accelerator for synthesizing formal matrix templates, rapidly scaffolding ISTQB-compliant test cases, calculating standard numerical boundary offsets ($\pm 1$), and parsing complex code structures into structured equivalence tables.
- **When AI must NOT be used (or strictly gated):** AI must never be relied upon as an autonomous verification authority for security controls, stateful business logic traps, or physical touch ergonomics. Due to pervasive "happy-path" bias and training on well-behaved codebases, LLMs consistently hallucinate optimal safeguards and overlook hidden vulnerabilities (such as BOLA authorization bypass or `clickCount` traps).
- **Recommendation:** QA engineers must treat AI as a junior assistant under a strict "Zero-Trust" policy, requiring human-in-the-loop dynamic execution for every artifact.

---

## 6. Mandatory Disclosure (paste verbatim)

> **"I use AI tools for the following tasks,"**
> 
> *"The initial domain partitions, boundary value calculations, and template test cases for FR-06, FR-11, FR-19, and Mobile FR-10 were initially drafted with the assistance of Antigravity Assistant (Model: Gemini 3.8 Flash High); I reviewed, revised, and executed 100% of the test cases against the live EShop SUT, discovered and verified all 7 critical bugs (including the clickCount trap, negative quantity exploit, shipping cancellation flaw, and BOLA security vulnerabilities), developed the Node.js automated verification scripts (tests/verify_*.js), authored the reusable Agent Skill (domain-bva-generator), and wrote the entire academic report. The detailed AI Audit Report is attached as an appendix. I confirm I did not use AI to generate any artifact listed in the prohibited category."*

---

## 7. Signature

| Thông tin xác nhận | Giá trị |
| :--- | :--- |
| **Họ và tên sinh viên (in hoa):** | **NGUYỄN BẢO AN** |
| **Mã số sinh viên (MSSV):** | **23120207** |
| **Môn học:** | **CS423 / CSC15003 -- Software Testing** |
| **Giảng viên phụ trách:** | **TS. Lâm Quang Vũ / TS. Trần Duy Hoàng / ThS. Trần Thị Bích Hạnh / ThS. Trương Phước Lộc / ThS. Hồ Tuấn Thanh** |
| **Ngày xác nhận:** | **15/10/2026** |
| **Chữ ký xác thực:** | *Nguyễn Bảo An (Đã ký)* |

---

## References

- Kharbach, M. (2026). *AI Use Policy Templates for Higher Education*. CC BY-NC-SA 4.0.
- International Software Testing Qualifications Board (ISTQB). (2023). *Certified Tester Foundation Level (CTFL) Syllabus v4.0*.
- Hardman, P. (2025). *A Post-AI Learning Taxonomy*.
- Fuster Rabella, M. (2025). *OECD Education Working Paper No. 338*.
- Anthropic. (2025). *Building Reliable AI Test Agents — engineering blog*.
- DeepEval & Promptfoo Documentation. (2026). *LLM Testing & Evaluation Frameworks*.
