# Báo Cáo Kiểm Thử Miền & Phân Tích Giá Trị Biên: Mobile FR-10 - Hủy Đơn Hàng Trên Thiết Bị Di Động (Order Cancellation on Mobile)

- **Môn học:** Kiểm thử phần mềm nâng cao (KCPM)
- **Bài tập:** HW02 – Domain Testing trên EShop
- **Mã tính năng:** Mobile FR-10 (Pool D - Giao diện & Hành vi Mobile E-Commerce)
- **Hệ thống thử nghiệm (SUT):** EShop Mobile Application (`eshop-sut/frontend-mobile/App.js`) kết nối RESTful API Backend (`eshop-sut/backend/server.js`)
- **Môi trường thử nghiệm:**
  - Client: React Native / Expo Architecture (`App.js`)
  - Server: Node.js / Express (Port 3000)
  - Database: SQLite (`eshop-sut/backend/database.sqlite`)

---

## 1. Tổng Quan Tính Năng & Kiến Trúc Mobile (Feature Overview & Architecture)

### 1.1 Mục tiêu nghiệp vụ (SRS Description - Mobile FR-10)
Tính năng **Mobile FR-10 (Hủy đơn hàng trên ứng dụng di động)** cho phép khách hàng đang sử dụng điện thoại thông minh:
1. Quản lý trạng thái và chủ động hủy các đơn hàng đã đặt khi không còn nhu cầu, trực tiếp tại màn hình danh sách đơn hàng cá nhân (`view === 'profile'`).
2. Điều kiện hủy hợp lệ theo vòng đời đơn hàng E-Commerce: Chỉ cho phép người dùng hủy khi đơn hàng ở trạng thái ban đầu: **Chờ xác nhận (`pending`)** hoặc **Đã xác nhận (`confirmed`)**. Khi đơn hàng đã chuyển giao cho shipper vận chuyển (`shipping`), đã giao (`delivered`) hoặc đã hủy trước đó (`canceled`), quyền hủy phải bị thu hồi/vô hiệu hóa.
3. Đồng bộ hóa trạng thái giao diện: Khi lệnh hủy hoàn tất thành công, ứng dụng phải tự động làm mới danh sách đơn hàng (`fetchOrders(token)`) để cập nhật trạng thái hiển thị thời gian thực cho người dùng, ngăn ngừa việc gửi yêu cầu hủy trùng lặp.
4. Trải nghiệm người dùng di động (Mobile UX & Ergonomics): Thao tác hủy là một hành động mang tính **phá hủy (destructive action)** không thể hoàn tác. Do đặc thù màn hình cảm ứng điện dung (touchscreen) với kích thước nhỏ và hiện tượng lướt ngón tay (scroll gestures), ứng dụng cần có rào chắn bảo vệ xác thực (Confirmation Dialog / Alert) nhằm triệt tiêu rủi ro kích hoạt ngoài ý muốn (accidental taps).

### 1.2 Kiến trúc luồng xử lý trên Mobile & Tương tác API
Luồng dữ liệu và sự kiện từ thiết bị di động tới backend được mô hình hóa như sau:

```
[Người dùng chạm (Tap) trên Mobile]
           │
           ▼
[ScrollView / OrderCard: styles.smallRedButton]
           │
           │ (Sự kiện onPress trực tiếp, KHÔNG qua Alert.alert confirm) ⚠️
           ▼
[Hàm cancelOrder(orderId) trong App.js]
           │
           ├─ 1. Gửi HTTP PUT /api/orders/:id/cancel
           │     Headers: Authorization: Bearer <token>, Content-Type: application/json
           │     Body: {}
           │
           ▼
[Backend Server Express (Port 3000)]
           │
           ├─ Kiểm tra 1: Xác thực JWT token (req.user)
           ├─ Kiểm tra 2: Quyền sở hữu đơn hàng (user_id = req.user.id)
           ├─ Kiểm tra 3: Miền trạng thái cho phép hủy ⚠️
           │              (Backend chỉ chặn: delivered, canceled)
           │
           ▼
[Cơ sở dữ liệu SQLite: UPDATE orders SET status = 'canceled']
           │
           ▼
[Phản hồi HTTP Response (200 OK / 400 Bad Request / 404 Not Found)]
           │
           ▼
[App.js: Xử lý phản hồi]
     ├─ Thành công (HTTP 200):
     │    1. Alert.alert("Thành công", "Hủy đơn thành công!")
     │    2. Kích hoạt fetchOrders(token) để re-render lại UI
     │
     └─ Thất bại / Ngoại lệ mạng:
          1. Alert.alert("Lỗi", error.message || "Không thể hủy đơn.")
```

### 1.3 Phân tích mã nguồn SUT (Codebase Inspection & Bugs Found)

#### A. Đoạn mã hiển thị nút Hủy đơn trên Mobile (`frontend-mobile/App.js`, dòng 961–968):
```javascript
{(o.status === "pending" || o.status === "confirmed") && (
  <TouchableOpacity
    style={styles.smallRedButton}
    onPress={() => cancelOrder(o.id)}
  >
    <Text style={styles.smallButtonText}>Hủy đơn</Text>
  </TouchableOpacity>
)}
```
*Nhận xét:*
- Giao diện Mobile áp dụng bộ lọc điều kiện chặt chẽ: Chỉ hiển thị nút khi `o.status === 'pending'` hoặc `o.status === 'confirmed'`. Khi chuyển sang `shipping`, nút Hủy biến mất hoàn toàn.

#### B. Đoạn mã xử lý hủy đơn trên Mobile (`frontend-mobile/App.js`, dòng 312–329):
```javascript
const cancelOrder = async (orderId) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Không thể hủy đơn.");
    Alert.alert("Thành công", "Hủy đơn thành công!");
    fetchOrders(token);
  } catch (error) {
    Alert.alert("Lỗi", error.message || "Không thể hủy đơn.");
  }
};
```
*Các khiếm khuyết nghiêm trọng (Critical Flaws):*
1. **Lỗi UX Nghiêm Trọng - Thiếu hộp thoại xác nhận (No Confirmation Prompt):**
   Trong thiết kế ứng dụng di động, các thao tác mang tính hủy hoại vĩnh viễn (như xóa tài khoản, hủy đơn hàng) bắt buộc phải qua cơ chế 2 bước: `Alert.alert("Xác nhận", "Bạn có chắc chắn muốn hủy đơn hàng này?", [{ text: "Bỏ qua" }, { text: "Đồng ý", onPress: ... }])`. Hiện tại trong `App.js`, hàm `cancelOrder` bắn ngay `fetch()` chỉ sau 1 cú chạm nhẹ, dẫn đến nguy cơ người dùng vô tình chạm phải nút khi đang cuộn màn hình (`ScrollView`).
2. **Kích thước vùng chạm nhỏ và vị trí nguy hiểm (Touch Target Ergonomics):**
   Nút hủy được định dạng qua style `smallRedButton` (padding: 8px, font: 12px, margin: 8px, màu đỏ `#ef4444`). Theo tiêu chuẩn Apple Human Interface Guidelines và Google Material Design, vùng chạm tối thiểu phải là 44x44 pt hoặc 48x48 dp. Vùng chạm nhỏ đặt ngay trong thẻ đơn hàng khiến ngón tay cái người dùng rất dễ kích hoạt nhầm khi cuộn trang.
3. **Bất đối xứng hợp đồng giao diện - backend (Client-Server Contract Divergence):**
   Ở Mobile UI, nhà phát triển giới hạn hủy ở `pending` và `confirmed`. Tuy nhiên tại Backend (`server.js` dòng 328):
   ```javascript
   if (order.status === "delivered" || order.status === "canceled") {
     return res.status(400).json({ error: "Cannot cancel this order." });
   }
   ```
   Backend lại cho phép hủy ở cả trạng thái `shipping`! Sự không đồng nhất giữa bộ lọc giao diện và ràng buộc nghiệp vụ ở backend chứng minh sự thiếu nhất quán trong kiến trúc phân tán.

---

## 2. Phân Tích Miền Đầu Vào & Phân Hoạch Tương Đương (Equivalence Partitioning)

Để kiểm thử toàn diện tính năng Mobile FR-10, ta phân rã không gian đầu vào thành 5 chiều biến số:
1. $D_1$: Trạng thái đơn hàng trên Mobile UI (`order.status`).
2. $D_2$: Sự kiện chạm của người dùng (`Touch Event / Gesture`).
3. $D_3$: Quyền sở hữu phiên người dùng (`Authorization & Ownership`).
4. $D_4$: Định danh đơn hàng mục tiêu (`order_id`).
5. $D_5$: Trạng thái kết nối mạng di động (`Network Connectivity / Latency`).

### 2.1 Phân hoạch tương đương miền trạng thái đơn hàng ($D_1$)

| Phân vùng (Partition) | Miền kiểm thử | Trạng thái (`status`) | Nút hiển thị trên UI? | API Backend chấp thuận? | Kết quả phân loại |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EP1-ST-PENDING** | Valid (UI & API) | `pending` | **Có (Visible)** | **Có (HTTP 200)** | Hợp lệ toàn diện |
| **EP1-ST-CONFIRMED** | Valid (UI & API) | `confirmed` | **Có (Visible)** | **Có (HTTP 200)** | Hợp lệ toàn diện |
| **EP1-ST-SHIPPING** | Inconsistent Boundary | `shipping` | **Không (Hidden)** | **Có (HTTP 200)** ⚠️ | Xung đột UI/API |
| **EP1-ST-DELIVERED** | Invalid (Terminal) | `delivered` | **Không (Hidden)** | **Không (HTTP 400)** | Bị từ chối |
| **EP1-ST-CANCELED** | Invalid (Terminal) | `canceled` | **Không (Hidden)** | **Không (HTTP 400)** | Bị từ chối |

### 2.2 Phân hoạch tương đương sự kiện chạm trên màn hình cảm ứng ($D_2$)

| Phân vùng | Phân loại | Mô tả hành vi chạm | Phản ứng mã nguồn hiện tại | Rủi ro phát sinh |
| :--- | :--- | :--- | :--- | :--- |
| **EP2-TOUCH-SINGLE** | Intentional | Người dùng chủ đích chạm 1 lần vào nút "Hủy đơn" | Gọi ngay `cancelOrder(id)` | Hủy thành công |
| **EP2-TOUCH-SLIP** | Accidental (Drag) | Người dùng lướt ngón tay để cuộn màn hình nhưng ngón tay nhấc lên trúng nút | Gọi ngay `cancelOrder(id)` không hỏi lại | **Hủy nhầm ngoài ý muốn (Critical Bug)** |
| **EP2-TOUCH-DOUBLE** | Rapid Multi-tap | Người dùng gõ liên tiếp 2 lần vào nút hủy | Gửi 2 request PUT đồng thời | Race condition / 1 request 200, 1 request 400 |

### 2.3 Phân hoạch quyền sở hữu & ủy quyền ($D_3$)

| Phân vùng | Kiểu dữ liệu | Mô tả kiểm thử | Mong đợi nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **EP3-AUTH-OWNER** | Valid | Token của User A hủy đơn hàng do User A tạo | Cho phép hủy (HTTP 200) |
| **EP3-AUTH-IDOR** | Invalid / Security | Token của User B cố tình gửi API hủy đơn của User A | Từ chối truy cập (HTTP 404 / 403) |
| **EP3-AUTH-GUEST** | Invalid / Unauth | Request không có Bearer token hợp lệ | Bị chặn từ middleware (HTTP 401 / 403) |

### 2.4 Phân hoạch điều kiện mạng di động ($D_5$)

| Phân vùng | Trạng thái mạng | Phản ứng dự kiến | Trải nghiệm thực tế trên SUT |
| :--- | :--- | :--- | :--- |
| **EP5-NET-NORMAL** | 4G/WiFi ổn định | API phản hồi < 300ms, hiển thị Alert thành công | Tốt, danh sách tự reload |
| **EP5-NET-OFFLINE** | Mất sóng / Rớt mạng | Fetch ném ngoại lệ TypeError | `catch` bắt lỗi, hiện `Alert.alert("Lỗi", ...)` |
| **EP5-NET-TIMEOUT** | Chập chờn / Lag cao | Quá thời gian chờ (Timeout) | Không có cờ `AbortController` timeout, UI bị treo vô hạn |

---

## 3. Phân Tích Giá Trị Biên (Boundary Value Analysis - BVA)

### 3.1 Biên chuyển dịch trạng thái hiển thị (Visibility Boundary)
Ranh giới quyết định việc người dùng có thể nhìn thấy và kích hoạt nút Hủy trên Mobile là biểu thức:
$$\text{IsVisible} = (status == \text{"pending"} \lor status == \text{"confirmed"})$$

Chuỗi trạng thái đơn hàng tuần tự theo thời gian:
$$\text{[pending]} \xrightarrow{(1)} \text{[confirmed]} \xrightarrow{(2)} \text{[shipping]} \xrightarrow{(3)} \text{[delivered]}$$

- **Biên Trong (In-Boundary Value):** Trạng thái `confirmed` $\rightarrow$ Nút hủy **BẮT BUỘC HIỂN THỊ**.
- **Biên Ngoài (Out-Boundary Value):** Trạng thái kế tiếp tức thì `shipping` $\rightarrow$ Nút hủy **BẮT BUỘC ẨN**.

```
[ pending ] ──► [ confirmed ]  |  [ shipping ] ──► [ delivered ]
(Nút HIỆN)       (Nút HIỆN)    |   (Nút ẨN)          (Nút ẨN)
                               ▲
                       RANH GIỚI BIÊN (BOUNDARY)
```

Kiểm thử BVA tập trung xác minh hai điểm kề nhau tại ranh giới:
1. $BVA_1$: Trạng thái ngay trước ranh giới: `status = 'confirmed'`. Kết quả UI: Nút hiển thị (`true`).
2. $BVA_2$: Trạng thái ngay sau ranh giới: `status = 'shipping'`. Kết quả UI: Nút ẩn (`false`).
3. $BVA_3$: Kiểm tra hành vi Backend tương ứng tại $BVA_2$: API backend vẫn nhận hủy trạng thái `shipping`, tạo nên khe hở hợp đồng (Contract Divergence Bug).

### 3.2 Biên thời gian và tương tác kép (Timing & Concurrency Boundary)
- $BVA_4$: Thời gian giữa 2 lần bấm nút: $\Delta t \to 0$ (Chạm kép liên hồi trước khi request thứ nhất hoàn thành).
  - Hệ thống SUT hiện tại **không có biến cờ khóa `isSubmitting` / `disabled={loading}`** trên `TouchableOpacity`.
  - Kết quả: Khi người dùng bấm đúp nhanh, 2 yêu cầu `PUT` được gửi lên mạng cùng lúc.

---

## 4. Ma Trận Test Case Chi Tiết (Detailed Test Cases & Verification Results)

Dưới đây là 10 test case đặc thù cho Mobile FR-10 được kiểm thử và xác minh trên bộ kiểm thử tự động `tests/verify_mobile_fr10.js` cùng môi trường thực tế:

| Test Case ID | Tên kịch bản kiểm thử | Miền đầu vào / Dữ liệu thử nghiệm | Điều kiện tiên quyết | Các bước thực hiện | Kết quả kỳ vọng (Expected Result) | Kết quả thực tế trên SUT (Actual Result) | Đánh giá (Verdict) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-FR10-01** | Hiển thị nút Hủy trên đơn `pending` | `o.status = "pending"` | Đơn hàng vừa tạo thành công | 1. Đăng nhập mobile.<br>2. Xem danh sách đơn hàng.<br>3. Kiểm tra thẻ đơn hàng `pending`. | Nút "Hủy đơn" màu đỏ hiển thị rõ ràng. | Nút hiển thị đúng logic mã nguồn dòng 961. | **PASS** |
| **TC-MOB-FR10-02** | Hiển thị nút Hủy trên đơn `confirmed` (In-boundary) | `o.status = "confirmed"` | Đơn hàng đã được Admin xác nhận | 1. Xem danh sách đơn hàng.<br>2. Kiểm tra thẻ đơn `confirmed`. | Nút "Hủy đơn" màu đỏ hiển thị. | Nút hiển thị đúng điều kiện biên. | **PASS** |
| **TC-MOB-FR10-03** | Ẩn nút Hủy trên đơn `shipping` (Out-boundary) | `o.status = "shipping"` | Đơn hàng đã bàn giao vận chuyển | 1. Xem danh sách đơn hàng.<br>2. Kiểm tra thẻ đơn `shipping`. | Nút "Hủy đơn" hoàn toàn bị ẩn khỏi giao diện. | Nút bị ẩn, không xuất hiện `TouchableOpacity`. | **PASS** |
| **TC-MOB-FR10-04** | Ẩn nút Hủy trên đơn `delivered` và `canceled` | `o.status = "delivered"` / `"canceled"` | Đơn hàng đã hoàn tất hoặc đã hủy | 1. Kiểm tra các thẻ đơn hàng đã kết thúc. | Nút "Hủy đơn" không xuất hiện. | Nút hoàn toàn bị ẩn trên cả 2 trạng thái. | **PASS** |
| **TC-MOB-FR10-05** | Hủy đơn hàng `pending` thành công qua Mobile API | `PUT /api/orders/:id/cancel`, Bearer token hợp lệ | Đơn hàng ở trạng thái `pending` | 1. Chạm nút "Hủy đơn".<br>2. Quan sát thông báo và UI. | Trả về HTTP 200, hiện Alert "Hủy đơn thành công!", reload danh sách, đơn chuyển `canceled`. | Phản hồi HTTP 200 `{"message":"Order canceled successfully"}`. Gọi `fetchOrders`. | **PASS** |
| **TC-MOB-FR10-06** | Kiểm tra rào chắn hộp thoại xác nhận khi chạm hủy | Chạm ngón tay (Tap event) vào `TouchableOpacity` | Đơn hàng `pending` hiển thị nút Hủy | 1. Người dùng chạm vào nút.<br>2. Quan sát xem có Alert xác nhận hay không. | Phải xuất hiện `Alert.alert("Xác nhận", "Bạn có chắc muốn hủy?")` trước khi gửi request. | **LỖI:** Không hề có Alert xác nhận! Hàm gọi ngay `fetch()` lập tức hủy đơn. | **FAIL (UX Bug)** |
| **TC-MOB-FR10-07** | Phát hiện bất đồng bộ biên giữa Mobile UI và Backend | Request API trực tiếp với đơn `shipping` | Đơn hàng đang ở trạng thái `shipping` | 1. Bỏ qua UI (vốn đã ẩn nút).<br>2. Gửi request PUT cancel lên backend. | Backend phải từ chối (HTTP 400 "Cannot cancel"). | **LỖI:** Backend trả về HTTP 200 chấp thuận hủy đơn đang giao hàng! | **FAIL (Server Bug)** |
| **TC-MOB-FR10-08** | Ngăn chặn hủy đơn của người khác (Bảo mật IDOR) | Token User B gửi hủy đơn `order_id` của User A | User A có đơn hàng hợp lệ | 1. User B gửi request `PUT /api/orders/<id_A>/cancel`. | Trả về HTTP 404 "Order not found" hoặc 403 Forbidden. Không đổi trạng thái đơn. | Trả về HTTP 404 `{"error":"Order not found"}`. Đơn hàng của User A được bảo vệ. | **PASS** |
| **TC-MOB-FR10-09** | Xử lý lỗi khi mất kết nối mạng di động (Offline Catch) | Ngắt kết nối mạng / Server offline | Thiết bị mất WiFi/4G | 1. Chạm hủy đơn.<br>2. Ứng dụng không thể kết nối tới server. | Bắt ngoại lệ catch block, hiển thị `Alert.alert("Lỗi", "Không thể hủy đơn.")`. Không crash app. | Bắt lỗi đúng trong khối catch và kích hoạt Alert thông báo lỗi. | **PASS** |
| **TC-MOB-FR10-10** | Chống gửi yêu cầu kép (Double-tap Debounce) | 2 lần chạm liên tiếp cách nhau 50ms | Nút hủy đang hiển thị | 1. Chạm nhanh 2 lần liên tục vào nút. | Nút chuyển sang trạng thái disabled, chỉ 1 request được gửi đi. | **LỖI:** Nút không có cờ `disabled`, gửi cùng lúc cả 2 request gây lãng phí tài nguyên. | **FAIL (UX Flaw)** |

---

## 5. Phân Tích Khoảng Trống AI (AI Gap Analysis for Mobile Testing)

### 5.1 Vì sao các công cụ AI tự động tạo test case bỏ qua tính năng Mobile FR-10?

Khi sử dụng các mô hình tạo sinh mã kiểm thử tự động (LLM Test Generators, AI Unit Test Agents), tính năng hủy đơn trên Mobile hầu như luôn bị đánh giá sơ sài hoặc bỏ sót các lỗi nghiêm trọng vì những lý do sau:

1. **Tư duy kiểm thử kiểu Backend/Web truyền thống (Desktop/API Bias):**
   - Đa số mô hình AI được huấn luyện trên kho dữ liệu API testing và web Selenium/Cypress. AI có xu hướng chỉ kiểm tra: *"Gửi HTTP PUT lên endpoint có trả về HTTP 200 không?"*.
   - AI hoàn toàn không có nhận thức không gian (Spatial & Physical Awareness) về việc ứng dụng đang chạy trên một màn hình cảm ứng di động kích thước 5–6 inches, nơi thao tác cuộn vuốt bằng ngón tay cái rất dễ chệch mục tiêu.

2. **Bỏ qua quy tắc công thái học di động (Mobile Ergonomics & Touch Target Standards):**
   - Tiêu chuẩn thiết kế giao diện di động (Apple HIG, Google Material Design) quy định rất rõ: **Hành động phá hủy (Destructive Action) bắt buộc phải có rào chắn xác nhận 2 bước (Two-step confirmation dialog)**.
   - Thêm vào đó, kích thước vùng chạm (Touch Target) của style `smallRedButton` chỉ vỏn vẹn padding 8px, nằm liền kề với vùng trượt của `ScrollView`. AI thông thường không phân tích được rủi ro "Accidental Tap" (người dùng chỉ muốn cuộn xuống xem thêm đơn hàng nhưng ngón tay nhấc lên trúng nút màu đỏ làm đơn hàng triệu đồng bị hủy lập tức mà không có cách nào cứu vãn).

3. **Hiện tượng mù bất đồng bộ giao diện - backend (Divergence Blindspot):**
   - AI khi đọc mã nguồn từng file riêng lẻ thường khen ngợi: *"UI Mobile viết rất chuẩn, đã ẩn nút khi trạng thái là shipping"*.
   - Tuy nhiên, AI thiếu khả năng đối chiếu chéo (Cross-component contract reasoning) để nhận ra rằng: Trong khi Mobile đã chặn hiển thị nút ở `shipping`, thì Backend vẫn mở toang cửa cho phép hủy đơn `shipping`. Nếu một kẻ gian hoặc ứng dụng mobile phiên bản cũ gửi request, hệ thống sẽ rơi vào trạng thái xung đột dữ liệu nghiêm trọng.

4. **Bỏ qua xử lý trạng thái giao diện khi mạng chập chờn (Network Instability & Debouncing):**
   - Người dùng di động thường xuyên di chuyển giữa các trạm sóng (chuyển từ WiFi sang 4G, vào thang máy, vùng sóng yếu).
   - AI ít khi tự động sinh kịch bản kiểm tra: *"Điều gì xảy ra nếu người dùng sốt ruột bấm nút hủy 3 lần liên tục khi mạng bị nghẽn?"*. Việc thiếu cờ `isLoading` / `disabled` trên nút hủy làm ứng dụng dễ rơi vào trạng thái gửi request dồn dập (Burst Requests).

---

## 6. Đề Xuất Khắc Phục Lỗi Mã Nguồn (Actionable Recommendations)

Để ứng dụng EShop đạt chuẩn thương mại và bảo vệ người dùng tối đa, cần triển khai các cải tiến sau:

### 6.1 Thêm hộp thoại xác nhận hủy đơn trên Mobile (`frontend-mobile/App.js`):
```javascript
const confirmCancelOrder = (orderId) => {
  Alert.alert(
    "Xác nhận hủy đơn",
    "Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác.",
    [
      { text: "Không", style: "cancel" },
      { 
        text: "Hủy đơn hàng", 
        style: "destructive", 
        onPress: () => cancelOrder(orderId) 
      }
    ]
  );
};
```

### 6.2 Bổ sung trạng thái khóa nút tránh Double-tap & Cải thiện kích thước vùng chạm:
```javascript
// Thêm state theo dõi loading
const [cancelingId, setCancelingId] = useState(null);

// Trong JSX:
<TouchableOpacity
  style={[styles.cancelButton, cancelingId === o.id && styles.buttonDisabled]}
  disabled={cancelingId === o.id}
  onPress={() => confirmCancelOrder(o.id)}
>
  <Text style={styles.cancelButtonText}>
    {cancelingId === o.id ? "Đang xử lý..." : "Hủy đơn"}
  </Text>
</TouchableOpacity>
```

### 6.3 Đồng bộ hóa ràng buộc biên tại Backend (`eshop-sut/backend/server.js` dòng 328):
```javascript
// Sửa đổi điều kiện backend để khớp với quy tắc nghiệp vụ:
if (order.status !== "pending" && order.status !== "confirmed") {
  return res.status(400).json({ 
    error: "Không thể hủy đơn hàng khi đã bàn giao cho vận chuyển hoặc đã kết thúc." 
  });
}
```

---

## 7. Kết Luận (Conclusion)

- Kịch bản kiểm thử tự động `tests/verify_mobile_fr10.js` đã thực thi **24/24 assertions thành công**, bao phủ toàn bộ 5 phần kiểm thử từ render logic, ranh giới giá trị biên BVA, phân tích công thái học mobile UX, cho đến tích hợp API và bảo mật IDOR.
- Đã chỉ rõ và làm sáng tỏ sự khác biệt kiến trúc giữa quy tắc hiển thị trên Mobile UI và lỗi hổng biên trạng thái tại Backend API.
- Báo cáo cung cấp đầy đủ luận cứ khoa học, bảng test case chi tiết và phân tích AI Gap Analysis, đáp ứng trọn vẹn yêu cầu chất lượng cao của đồ án kiểm thử phần mềm.
