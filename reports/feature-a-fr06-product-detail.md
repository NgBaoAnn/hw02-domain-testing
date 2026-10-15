# Báo Cáo Kiểm Thử Miền & Phân Tích Giá Trị Biên: FR-06 - Xem Chi Tiết Sản Phẩm (Product Detail View)

- **Môn học:** Kiểm thử phần mềm nâng cao (KCPM)
- **Bài tập:** HW02 – Domain Testing trên EShop
- **Mã tính năng:** FR-06 (Pool A - Xác thực, Danh mục và Sản phẩm)
- **Hệ thống thử nghiệm (SUT):** EShop E-Commerce Web Application
- **Môi trường:**
  - Backend: Node.js / Express (Port 3000)
  - Frontend: React / Vite / TailwindCSS (Port 5173)
  - Database: SQLite (`eshop-sut/backend/database.sqlite`)

---

## 1. Tổng Quan Tính Năng & Kiến Trúc (Feature Overview & Architecture)

### 1.1 Mục tiêu nghiệp vụ (SRS Description)
Tính năng **FR-06 (Xem chi tiết sản phẩm)** cho phép khách hàng:
1. Xem thông tin đầy đủ về một sản phẩm cụ thể: Hình ảnh minh họa, tên sản phẩm, giá bán (VND), mô tả chi tiết sản phẩm.
2. Điều chỉnh số lượng sản phẩm cần mua thông qua ô nhập liệu số nguyên dương ($quantity \ge 1$).
3. Thêm sản phẩm cùng số lượng đã chọn vào giỏ hàng (`CartContext`) thông qua nút tương tác **"Thêm vào giỏ hàng"**.
4. Cung cấp phản hồi trực quan khi thêm thành công (nút chuyển sang trạng thái "Đã thêm" trong 2 giây).

### 1.2 Kiến trúc luồng dữ liệu (Data & Component Flow)
```
[User Browser]
      │
      ├─ 1. Truy cập /products/:id
      │       ▼
      │   [ProductDetail.jsx] ─── GET /api/products/:id ───► [Express Backend (server.js)]
      │       ▲                                                        │
      │       │ 2. Nhận dữ liệu JSON (name, price, image,...)          ▼
      │       └─────────────────────────────────────────────── [SQLite DB: products]
      │
      ├─ 3. Người dùng nhập [quantity] và nhấn [Thêm vào giỏ hàng]
      │       ▼
      │   handleAddToCart()
      │       │
      │       ▼
      └─► [CartContext.jsx] ─── addToCart(product, parseInt(quantity)) ───► Local State / Cart View
```

### 1.3 Mã nguồn liên quan trên SUT
- **Backend API:** `GET /api/products/:id` trong `eshop-sut/backend/server.js` (dòng 159–165).
  - Điểm bất thường (Seeded bug): Nếu `row.id % 2 === 0`, trường `price` bị chuyển từ kiểu số (`number`) sang chuỗi ký tự (`string`).
  - Khi không tìm thấy sản phẩm, backend trả về HTTP 200 kèm JSON rỗng `{}` thay vì HTTP 404 Not Found.
- **Frontend Component:** `eshop-sut/frontend-web/src/pages/ProductDetail.jsx`.
  - State quản lý: `product`, `quantity` (mặc định = 1), `clickCount` (mặc định = 0), `added`.
  - Điểm bất thường 1: Biến trạng thái `clickCount` bắt buộc người dùng phải nhấn 2 lần mới gọi được `addToCart` (`if (clickCount === 0) { setClickCount(1); return; }`).
  - Điểm bất thường 2: Thẻ `<input type="number">` không có thuộc tính ràng buộc `min="1"`, `max`, `step="1"`. Hàm `handleAddToCart` không kiểm tra giá trị của `quantity` trước khi gọi `addToCart(product, parseInt(quantity))`, cho phép số lượng bằng 0, số âm, hoặc `NaN`.

---

## 2. Phân Tích Miền Đầu Vào & Phân Hoạch Tương Đương (Equivalence Partitioning)

Để thiết kế tập ca kiểm thử bao phủ toàn diện theo chuẩn ISTQB, ta phân rã bài toán thành 3 biến đầu vào chính:
1. $V_1$: Biến `product_id` (Định danh sản phẩm truyền qua URL parameter).
2. $V_2$: Biến `quantity` (Số lượng sản phẩm khách hàng muốn thêm vào giỏ).
3. $V_3$: Trạng thái tương tác `clickCount` (Trạng thái số lần click nút "Thêm vào giỏ hàng").

### 2.1 Phân hoạch tương đương cho biến `product_id` ($V_1$)

| Phân vùng (Partition) | Kiểu miền (Type) | Mô tả phân vùng | Giá trị đại diện mẫu | Hành vi mong đợi (Expected Behavior) |
| :--- | :--- | :--- | :--- | :--- |
| **EP1-ID-V1** | Valid | ID sản phẩm tồn tại trong CSDL, ID số lẻ | `1`, `3`, `5` | Trả về HTTP 200, hiển thị đầy đủ thông tin, `price` kiểu số. |
| **EP1-ID-V2** | Valid | ID sản phẩm tồn tại trong CSDL, ID số chẵn | `2`, `4` | Trả về HTTP 200, hiển thị đầy đủ thông tin, `price` chuẩn hóa số. |
| **EP1-ID-INV1** | Invalid | ID là số nguyên dương nhưng không tồn tại trong DB | `9999` | Trả về HTTP 404, hiển thị thông báo lỗi thân thiện "Không tìm thấy sản phẩm". |
| **EP1-ID-INV2** | Invalid | ID không hợp lệ: số âm hoặc số 0 | `0`, `-1` | Trả về HTTP 400 hoặc 404 báo lỗi tham số không hợp lệ. |
| **EP1-ID-INV3** | Invalid | ID chứa ký tự chữ cái, ký tự đặc biệt, SQL Injection | `'abc'`, `'1; DROP TABLE products'` | Trả về HTTP 400 Bad Request, không bị lỗi SQL Injection. |

### 2.2 Phân hoạch tương đương cho biến `quantity` ($V_2$)

Theo đặc tả nghiệp vụ thương mại điện tử, số lượng mua hàng phải là số nguyên dương hợp lệ, nằm trong khả năng đáp ứng của kho hàng (giả định kho hàng cho phép tối đa 99 sản phẩm/đơn):

| Phân vùng (Partition) | Kiểu miền (Type) | Mô tả phân vùng toán học | Giá trị đại diện mẫu | Hành vi mong đợi (Expected Behavior) |
| :--- | :--- | :--- | :--- | :--- |
| **EP2-QTY-V1** | Valid | Số nguyên dương trong khoảng hợp lệ: $1 \le quantity \le 99$ | `1`, `5`, `50` | Cho phép thêm vào giỏ hàng thành công với đúng số lượng. |
| **EP2-QTY-INV1** | Invalid | Số lượng bằng không: $quantity = 0$ | `0` | Hệ thống từ chối, hiển thị thông báo: "Số lượng tối thiểu là 1". |
| **EP2-QTY-INV2** | Invalid | Số lượng âm: $quantity < 0$ | `-1`, `-10` | Hệ thống từ chối, hiển thị cảnh báo lỗi không hợp lệ. |
| **EP2-QTY-INV3** | Invalid | Số lượng vượt quá giới hạn tối đa: $quantity > 99$ | `100`, `999` | Hệ thống từ chối, cảnh báo vượt quá giới hạn mua tối đa. |
| **EP2-QTY-INV4** | Invalid | Số thực có phần thập phân: $quantity \in \mathbb{R} \setminus \mathbb{Z}$ | `1.5`, `2.7` | Hệ thống làm tròn hoặc từ chối yêu cầu nhập số nguyên. |
| **EP2-QTY-INV5** | Invalid | Dữ liệu rỗng, chuỗi ký tự hoặc ký tự đặc biệt | `""`, `"abc"`, `"!@#"` | Hệ thống không chấp nhận, reset về giá trị mặc định là 1. |

### 2.3 Phân hoạch tương đương cho trạng thái tương tác `clickCount` ($V_3$)

| Phân vùng (Partition) | Kiểu miền (Type) | Mô tả trạng thái | Hành vi mong đợi (Expected Behavior) |
| :--- | :--- | :--- | :--- |
| **EP3-CLK-V1** | Valid | Lần nhấn đầu tiên (First click) | Thêm sản phẩm vào giỏ ngay lập tức, nút hiển thị "Đã thêm". |
| **EP3-CLK-V2** | Valid | Các lần nhấn tiếp theo sau khi đã thêm | Tiếp tục cộng dồn số lượng vào giỏ hàng bình thường. |

---

## 3. Phân Tích Giá Trị Biên (Boundary Value Analysis - BVA)

Phân tích giá trị biên tập trung vào các điểm chuyển đổi giữa miền hợp lệ và không hợp lệ của biến `quantity`. Áp dụng kỹ thuật phân tích biên **2-point BVA** (On, Off) và **3-point BVA** (On, Off-below, Off-above / In).

### 3.1 Biên dưới của `quantity` (Ngưỡng chuyển đổi tại giá trị tối thiểu hợp lệ $Min = 1$)
- **Miền không hợp lệ:** $(-\infty, 0]$
- **Miền hợp lệ:** $[1, 99]$
- **Điểm biên khảo sát:**
  - $quantity = 1$ (**On-boundary / Min valid**): Giá trị nhỏ nhất được phép mua. Mong đợi: Cho phép thêm 1 sản phẩm.
  - $quantity = 0$ (**Off-boundary below / Max invalid**): Giá trị lớn nhất trong miền không hợp lệ. Mong đợi: Báo lỗi, không cho thêm.
  - $quantity = 2$ (**In-boundary / Typical valid**): Giá trị liền kề bên trong miền hợp lệ. Mong đợi: Cho phép thêm 2 sản phẩm.
  - $quantity = -1$ (**Extreme negative invalid**): Giá trị âm liền kề dưới 0. Mong đợi: Báo lỗi số lượng âm.

### 3.2 Biên trên của `quantity` (Ngưỡng chuyển đổi tại giá trị tối đa quy ước $Max = 99$)
- **Miền hợp lệ:** $[1, 99]$
- **Miền không hợp lệ:** $[100, +\infty)$
- **Điểm biên khảo sát:**
  - $quantity = 98$ (**In-boundary**): Giá trị liền kề cận trên. Mong đợi: Cho phép thêm.
  - $quantity = 99$ (**On-boundary / Max valid**): Giá trị tối đa cho phép mua. Mong đợi: Cho phép thêm.
  - $quantity = 100$ (**Off-boundary above / Min invalid**): Giá trị vượt ngưỡng đầu tiên. Mong đợi: Báo lỗi vượt quá giới hạn đặt hàng.
  - $quantity = 2147483648$ ($2^{31}$, **Integer Overflow**): Tràn số nguyên 32-bit. Mong đợi: Hệ thống xử lý an toàn, không crash.

### 3.3 Bảng tổng hợp các giá trị biên (BVA Matrix)

| Biến kiểm thử | Giá trị kiểm thử | Loại giá trị biên (Classification) | Trạng thái kỳ vọng |
| :--- | :---: | :--- | :--- |
| `quantity` | `-1` | Negative Out-of-bounds | Không hợp lệ (Invalid - Reject) |
| `quantity` | `0` | Immediate Off-boundary below | Không hợp lệ (Invalid - Reject) |
| `quantity` | `1` | On-boundary (Min Valid) | Hợp lệ (Valid - Accept) |
| `quantity` | `2` | In-boundary (Min + 1) | Hợp lệ (Valid - Accept) |
| `quantity` | `98` | In-boundary (Max - 1) | Hợp lệ (Valid - Accept) |
| `quantity` | `99` | On-boundary (Max Valid) | Hợp lệ (Valid - Accept) |
| `quantity` | `100` | Immediate Off-boundary above | Không hợp lệ (Invalid - Reject) |
| `clickCount` | `0` (Lần 1) | Trạng thái khởi tạo (Initial state) | Hợp lệ (Phải thực hiện thêm vào giỏ) |
| `clickCount` | `1` (Lần 2) | Trạng thái sau 1 lần bấm | Hợp lệ (Tiếp tục thêm vào giỏ) |

---

## 4. Bảng Kịch Bản Kiểm Thử Chi Tiết (Detailed Test Cases)

| Test Case ID | Tên kịch bản kiểm thử | Phân loại | Tiền điều kiện | Dữ liệu đầu vào (Inputs) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) | Kết quả thực tế trên SUT (Actual Result) | Đánh giá (Verdict) | Ghi chú lỗi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-FR06-01** | Xem chi tiết sản phẩm hợp lệ có ID số lẻ | Domain (EP1-ID-V1) | CSDL có sản phẩm ID=1 | URL: `/products/1` | 1. Điều hướng tới `/products/1`<br>2. Quan sát giao diện và thông tin trả về. | Hiển thị tên "iPhone 15 Pro Max", hình ảnh, mô tả, giá 30.000.000 ₫ dạng số. | Hiển thị đúng sản phẩm, giá định dạng tiền tệ chính xác. | **PASS** | Hoạt động bình thường. |
| **TC-FR06-02** | Xem chi tiết sản phẩm có ID số chẵn (Kiểm tra kiểu dữ liệu giá) | Domain (EP1-ID-V2) | CSDL có sản phẩm ID=2 | URL: `/products/2` | 1. Gửi `GET /api/products/2`<br>2. Kiểm tra `typeof res.data.price`. | Trường `price` phải có kiểu dữ liệu là `number` để tránh lỗi tính toán. | API backend chuyển `price` thành chuỗi `"28000000"`, may mắn UI có `Number()` bọc ngoài nên UI hiển thị được, nhưng sai chuẩn API. | **FAIL** | Lỗi seeded backend: `if (row.id % 2 === 0) row.price = row.price.toString()`. |
| **TC-FR06-03** | Xem chi tiết sản phẩm với ID không tồn tại | Domain (EP1-ID-INV1) | ID=9999 không có trong DB | URL: `/products/9999` | 1. Điều hướng tới `/products/9999`<br>2. Quan sát phản hồi API và giao diện. | Backend trả về HTTP 404; Giao diện hiển thị thông báo lỗi "Sản phẩm không tồn tại". | Backend trả về HTTP 200 `{}`; Giao diện hiển thị chữ "Sản phẩm không tồn tại (Lỗi trắng trang do data rỗng)". | **FAIL** | Backend trả mã HTTP 200 sai chuẩn RESTful. |
| **TC-FR06-04** | Thêm vào giỏ hàng ngay ở lần bấm chuột đầu tiên | Domain (EP3-CLK-V1) | Đang ở trang chi tiết sản phẩm ID=1, giỏ hàng trống | Click lần 1 vào nút "Thêm vào giỏ hàng" | 1. Nhập số lượng 1<br>2. Nhấn nút "Thêm vào giỏ hàng" lần thứ 1<br>3. Kiểm tra giỏ hàng. | Sản phẩm được thêm ngay vào giỏ hàng, nút hiển thị "Đã thêm". | Không có bất kỳ phản hồi nào, sản phẩm không được thêm vào giỏ do `clickCount === 0`. | **FAIL** | **BUG NGHIÊM TRỌNG:** Nuốt sự kiện click đầu tiên của người dùng. |
| **TC-FR06-05** | Nhấn thêm vào giỏ hàng ở lần bấm chuột thứ hai | Domain (EP3-CLK-V2) | Đã nhấn lần 1 (`clickCount = 1`) | Click lần 2 vào nút "Thêm vào giỏ hàng" | 1. Nhấn nút "Thêm vào giỏ hàng" lần thứ 2<br>2. Quan sát giỏ hàng. | Sản phẩm được thêm vào giỏ hàng với số lượng đã chọn. | Sản phẩm được thêm vào giỏ hàng, nút chuyển "Đã thêm" trong 2s, reset `clickCount=0`. | **PASS** | Chạy được nhưng phụ thuộc vào bug ở lần bấm 1. |
| **TC-FR06-06** | Kiểm tra giá trị biên dưới hợp lệ của số lượng ($quantity = 1$) | BVA On-Boundary | Trang chi tiết sản phẩm ID=1 | $quantity = 1$ | 1. Đặt số lượng = 1<br>2. Nhấn Thêm vào giỏ hàng (vượt qua bug click 1). | Thêm 1 sản phẩm vào giỏ, tổng tiền = 1 * đơn giá. | Thêm 1 sản phẩm vào giỏ thành công. | **PASS** | Biên chuẩn tối thiểu. |
| **TC-FR06-07** | Kiểm tra giá trị biên liền kề hợp lệ ($quantity = 2$) | BVA In-Boundary | Trang chi tiết sản phẩm ID=1 | $quantity = 2$ | 1. Đặt số lượng = 2<br>2. Nhấn Thêm vào giỏ hàng. | Thêm 2 sản phẩm vào giỏ hàng. | Thêm 2 sản phẩm vào giỏ thành công. | **PASS** | Hoạt động đúng. |
| **TC-FR06-08** | Kiểm tra giá trị biên không hợp lệ ($quantity = 0$) | BVA Off-Boundary below | Trang chi tiết sản phẩm ID=1 | $quantity = 0$ | 1. Nhập số lượng 0 vào ô input<br>2. Nhấn Thêm vào giỏ hàng. | Báo lỗi: "Số lượng phải lớn hơn 0", không cho phép thêm vào giỏ. | Hệ thống thêm sản phẩm có số lượng = 0 vào giỏ hàng! | **FAIL** | **BUG NGHIÊM TRỌNG:** Thiếu validation biên dưới, cho phép số lượng 0. |
| **TC-FR06-09** | Kiểm tra giá trị âm ($quantity = -1$) | BVA Negative Out-of-bounds | Trang chi tiết sản phẩm ID=1 | $quantity = -1$ | 1. Nhập số lượng -1 vào ô input<br>2. Nhấn Thêm vào giỏ hàng. | Báo lỗi: "Số lượng không hợp lệ", chặn hành động thêm. | Hệ thống thêm sản phẩm có số lượng = -1 vào giỏ, làm sai lệch tổng tiền giỏ hàng (`reduce`). | **FAIL** | **BUG NGHIÊM TRỌNG:** Ô input nhận số âm, CartContext tính trừ tiền. |
| **TC-FR06-10** | Kiểm tra nhập dữ liệu chuỗi ký tự không phải số | Domain (EP2-QTY-INV5) | Trang chi tiết sản phẩm ID=1 | $quantity = \text{"abc"}$ | 1. Nhập `"abc"` vào ô số lượng<br>2. Nhấn Thêm vào giỏ hàng. | Chặn ký tự chữ hoặc chuyển thành 1, báo lỗi hợp lệ. | Giá trị `parseInt("abc")` ra `NaN`, lưu vào giỏ hàng làm `cartTotal` hiển thị `NaN`. | **FAIL** | Thiếu kiểm tra `isNaN` khi parse số lượng. |
| **TC-FR06-11** | Kiểm tra giá trị số thực có dấu thập phân | Domain (EP2-QTY-INV4) | Trang chi tiết sản phẩm ID=1 | $quantity = 2.5$ | 1. Nhập `2.5` vào ô số lượng<br>2. Nhấn Thêm vào giỏ hàng. | Yêu cầu số nguyên hoặc tự động làm tròn chuẩn. | `parseInt(2.5)` âm thầm chuyển thành `2` mà không cảnh báo cho người dùng. | **PASS\*** | Chấp nhận được ở mức độ cơ bản nhưng nên có phản hồi UX rõ ràng hơn. |
| **TC-FR06-12** | Kiểm tra giá trị biên lớn ($quantity = 1000$) | BVA Large Value | Trang chi tiết sản phẩm ID=1 | $quantity = 1000$ | 1. Nhập `1000`<br>2. Nhấn Thêm vào giỏ hàng. | Cảnh báo vượt quá số lượng kho hàng cho phép trong 1 đơn hàng. | Hệ thống thêm thành công 1000 sản phẩm vào giỏ không cần kiểm tra tồn kho. | **FAIL** | Thiếu kiểm tra ràng buộc số lượng tối đa với tồn kho thực tế. |

---

## 5. Phân Tích Khoảng Trống Của AI (AI Gap Analysis)

Trong quá trình sử dụng các công cụ sinh test case tự động bằng AI (chẳng hạn như GitHub Copilot, ChatGPT tiêu chuẩn khi chỉ nhận prompt chung chung: *"Viết test case cho trang chi tiết sản phẩm"*), các công cụ AI thường bỏ sót các ca kiểm thử quan trọng và các lỗi tiềm ẩn sau:

### 5.1 Giả định hệ thống vận hành theo "Happy Path" và code đã hoàn hảo
- **Bỏ sót lỗi `clickCount === 0`:**
  - *Tại sao AI bỏ sót:* Khi nhìn thấy một nút có gắn hàm `onClick={handleAddToCart}`, AI thường mặc định giả định rằng một lần click chuột đơn lẻ sẽ kích hoạt hành động nghiệp vụ thêm vào giỏ hàng. Nếu không thực hiện phân tích mã nguồn dạng dòng lệnh (data-flow & control-flow tracing) hoặc không chạy kịch bản thực tế, AI không thể dự đoán được đoạn code cố tình cài cắm:
    ```javascript
    if (clickCount === 0) {
      setClickCount(1);
      return; // Không làm gì cả ở lần đầu tiên
    }
    ```
  - *Hậu quả:* Các bộ test sinh bởi AI thông thường chỉ click 1 lần và ghi nhận test case fail hoặc không hề thiết kế kịch bản kiểm tra trạng thái tương tác qua các lần nhấn liên tiếp.

### 5.2 Thiếu kiểm tra giá trị biên âm và giá trị 0 trên thẻ `<input type="number">`
- **Bỏ sót lỗ hổng số lượng âm và số lượng bằng 0:**
  - *Tại sao AI bỏ sót:* Trong HTML5, thẻ `<input type="number">` thường được các mô hình ngôn ngữ lớn (LLM) suy đoán là đã có sẵn cơ chế bảo vệ của trình duyệt. Tuy nhiên, trên thực tế, người dùng vẫn có thể gõ trực tiếp dấu `-`, số `0`, hoặc copy-paste chuỗi ký tự vào ô input nếu lập trình viên không bổ sung các thuộc tính bắt buộc như `min="1"` và validation chặt chẽ ở handler Javascript.
  - *Hậu quả:* AI chỉ sinh các test case với số lượng hợp lệ như $1, 2, 5$, hoàn toàn bỏ quên ca kiểm thử độc hại (negative testing) làm tổng giá trị giỏ hàng bị âm (`CartContext: cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)`).

### 5.3 Bỏ qua bất đồng bộ kiểu dữ liệu (Data Type Coercion) từ Backend
- **Bỏ sót lỗi kiểu chuỗi của trường `price` với ID chẵn:**
  - *Tại sao AI bỏ sót:* AI giả định schema cơ sở dữ liệu SQLite định nghĩa `price INTEGER` thì API luôn trả về số `28000000`. AI không lường trước được backend có logic làm sai lệch kiểu dữ liệu: `if (row.id % 2 === 0) row.price = row.price.toString()`.
  - Mặc dù JavaScript có cơ chế ép kiểu lỏng lẻo (loose typing), việc chuỗi ký tự lọt vào giỏ hàng có thể dẫn đến hiện tượng nối chuỗi (string concatenation) thay vì phép cộng số học khi tính tổng tiền nếu không dùng `Number()`.

---

## 6. Kết Luận & Đề Xuất Khắc Phục (Conclusion & Recommendations)

1. **Khắc phục lỗi Frontend `ProductDetail.jsx`:**
   - Xóa bỏ hoàn toàn biến cờ `clickCount` và logic chặn lần click đầu tiên để nút "Thêm vào giỏ hàng" phản hồi ngay lập tức.
   - Thêm thuộc tính `min="1"` và `step="1"` vào thẻ `<input type="number">`.
   - Bổ sung logic kiểm tra đầu vào trước khi thêm:
     ```javascript
     const val = parseInt(quantity, 10);
     if (isNaN(val) || val <= 0) {
       alert("Vui lòng nhập số lượng hợp lệ (tối thiểu 1)");
       return;
     }
     ```
2. **Khắc phục lỗi Backend `server.js`:**
   - Chuẩn hóa trường `price` luôn luôn là kiểu số (`Number(row.price)`), loại bỏ dòng ép kiểu chuỗi ở ID chẵn.
   - Khi không tìm thấy sản phẩm theo ID, trả về mã trạng thái HTTP 404: `res.status(404).json({ error: "Sản phẩm không tồn tại" })`.
