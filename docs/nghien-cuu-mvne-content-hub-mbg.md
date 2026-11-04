# Nghiên cứu: Mô hình MVNE – Content Hub cung cấp nội dung cho các MVNO trên nền nâng cấp hệ thống MBG

*Ngày lập: 04/11/2026 · Phạm vi: VNPT VAS (VNPT-Media) · Trạng thái: bản nghiên cứu đã cập nhật các quyết định chốt; các điểm đánh dấu (?) cần xác minh*

---

## 1. Tóm tắt (BLUF)

1. **Có cơ hội thật.** Việt Nam hiện có khoảng 5–7 MVNO (iTel, Wintel, Local, VNSKY, FPT, Pottel – Bưu điện Việt Nam). Các MVNO này hầu như **chưa khai thác dịch vụ giá trị gia tăng (VAS/content)**: họ không có đội ngũ ký hợp đồng với hàng chục CP và không có nền tảng cấp – quản lý – đối soát quyền lợi nội dung.
2. **Nguyên tắc phân vai (đã chốt):** **mỗi nhà mạng dùng hệ thống trừ cước riêng**. MVNO tự bán, tự trừ cước, tự gia hạn/retry trên OCS/BSS của mình. **MBG không trừ cước, không cộng data**, chỉ đóng vai **nhà cung cấp nội dung (content provider) bán buôn**, cấp quyền lợi theo **2 hình thức: theo lượt (per-use) và theo chu kỳ (subscription)**.
3. **MBG (Media Bundle Gateway) đã có sẵn phần lõi cần thiết**: danh mục gói, quản lý vòng đời quyền lợi theo chu kỳ, cấp license/kích hoạt tài khoản tại CP, thu hồi quyền khi huỷ, log phục vụ đối soát. Phần phải nâng cấp: **đa thuê (multi-tenant)**, **API mở để MVNO gọi cấp/gia hạn/thu hồi quyền sau khi họ trừ cước xong**, **mô hình theo lượt**, và **đối soát chéo CDR của MVNO với log cấp quyền của MBG**. Các phần trừ cước Diameter, cộng data, retry gia hạn của MBG **không dùng** cho MVNO.
4. **Đề xuất:** nâng cấp MBG thành **"VNPT Content Hub for MVNO"** – MVNE ở lớp nội dung. Vì MBG không phụ thuộc OCS của nhà mạng nào, **cùng một chuẩn API phục vụ được mọi MVNO, bất kể chạy trên hạ tầng VinaPhone hay MobiFone**.
5. **Lộ trình:** (0) chốt hợp đồng mẫu và MVNO pilot; (1) API cấp quyền theo chu kỳ cho 1 MVNO; (2) bổ sung theo lượt + cổng MVNO + đối soát tự động; (3) nhân rộng nhiều MVNO và CP.
6. **Điều kiện tiên quyết còn lại:** chỉ còn **hợp đồng ba bên** MVNO – VNPT-Media – CP (đặc biệt điều khoản đối soát vì số liệu tính tiền nằm ở MVNO). Quyền phân phối của CP đã được xác nhận; **không cần cơ chế nội bộ Tập đoàn – VNPT-Media tự triển khai**.

### Các quyết định đã chốt (04/11/2026)

| # | Nội dung | Quyết định | Áp dụng tại |
|---|---|---|---|
| 1 | Phân vai trừ cước | Mỗi nhà mạng dùng hệ thống trừ cước riêng; MBG chỉ cấp nội dung theo lượt hoặc theo chu kỳ | Mục 5 |
| 2 | Mô hình giá bán buôn | **Kết hợp**: giá sàn theo log cấp quyền của MBG **và** chia sẻ doanh thu trên doanh thu MVNO; VNPT-Media nhận mức cao hơn | Mục 6.1, 6.2 |
| 3 | Thời gian ân hạn sau `expire_at` | **7 ngày**, sau đó MBG tự thu hồi quyền | Mục 5.2, 5.3 |
| 4 | Định danh thuê bao | **Số điện thoại được mã hoá**; MBG và CP không nhận số điện thoại dạng rõ | Mục 5.3, 5.5 |
| 5 | Quyền phân phối của CP qua MVNO | **Có** – hợp đồng CP hiện tại cho phép | Mục 8 |
| 6 | Nguồn lực kỹ thuật MBG | **Đủ nguồn lực** – triển khai song song, rút ngắn lộ trình | Mục 7 |
| 7 | Tỷ lệ chia sẻ doanh thu (phần B) | **70%** doanh thu gói theo CDR của MVNO thuộc về VNPT-Media | Mục 6.1, 6.2 |
| 8 | Ngưỡng lệch đối soát | **1%** chênh lệch số lượng giữa log MBG và CDR MVNO thì đối soát chi tiết theo `txn_id` | Mục 6.1 |
| 9 | CP kích hoạt bằng số điện thoại | **Giả định**: toàn bộ CP kích hoạt bằng license/mã, không cần số điện thoại; CP nào ngoại lệ dùng phương án chuyển tiếp số mã hoá | Mục 5.3 |
| 10 | Cơ chế nội bộ | **Không cần cơ chế** với Tập đoàn/VinaPhone; **VNPT-Media tự triển khai** | Mục 7, 8 |


---

## 2. Khái niệm và phân vai

| Vai trò | Định nghĩa | Ví dụ |
|---|---|---|
| **MNO** | Nhà mạng sở hữu tần số và hạ tầng | Viettel, VinaPhone, MobiFone, Vietnamobile |
| **MVNO** | Nhà mạng ảo, thuê hạ tầng MNO, bán lẻ dịch vụ dưới thương hiệu riêng | iTel, Wintel, Local, VNSKY, FPT, Pottel |
| – *Light MVNO* | Chủ yếu làm thương hiệu, bán hàng, CSKH; tính cước/OCS, core nằm ở MNO | iTel, Local, VNSKY (theo phân loại báo chí) |
| – *Full MVNO* | Tự có một phần mạng lõi (HLR/HSS, OCS, BSS) | Wintel, Pottel (theo báo chí) (?) |
| **MVNE** | Nhà cung cấp hạ tầng/nền tảng cho MVNO (BSS/OCS, provisioning, VAS…), **không bán lẻ cho người dùng cuối** | Các nhà cung cấp BSS/OCS quốc tế |
| **MVNA** | Nhà tổng hợp: mua sỉ dung lượng của MNO rồi bán lại cho nhiều MVNO | – |
| **Content Hub (VAS Aggregator)** | Một dạng MVNE ở lớp dịch vụ: gom nội dung từ nhiều CP, chuẩn hoá đăng ký – tính cước – cấp quyền – đối soát, cung cấp cho nhiều nhà mạng | **Mục tiêu của đề xuất này** |

**Định vị đề xuất:** VNPT-Media **không** làm MVNE ở lớp mạng (core, HLR, OCS – đã thuộc VinaPhone/VNPT Net) mà làm **"Service-layer MVNE"**: cung cấp danh mục nội dung + nền tảng vận hành gói nội dung cho MVNO.

---

## 3. Bối cảnh thị trường MVNO Việt Nam

| MVNO | Doanh nghiệp | Đầu số | Hạ tầng | Ghi chú cho Content Hub |
|---|---|---|---|---|
| **iTel** | Đông Dương Telecom | 087 | VinaPhone | MVNO đầu tiên, tệp thuê bao lớn nhất trong nhóm MVNO |
| **Wintel** (tiền thân Reddi) | Mobicast – Masan | 055 | VinaPhone | Gắn hệ sinh thái WinMart, hội viên |
| **Pottel** | Tổng công ty Bưu điện Việt Nam | (?) | VNPT | Cấp phép 12/2025, ra mắt khoảng 8/2026, ~13.000 điểm phục vụ; cùng hệ sinh thái nhà nước – ứng viên pilot tốt |
| **Local** | ASIM | 089 | MobiFone | Phân khúc trẻ |
| **VNSKY** | Digilife – VNPAY | 0777 (?) | MobiFone | Thế mạnh thanh toán (ví VNPAY) – hợp gói theo lượt |
| **FPT** | FPT Retail | 0775 (?) | (?) | Cần xác minh |

Vì mỗi MVNO tự trừ cước trên hệ thống riêng và MBG chỉ cấp quyền lợi nội dung, **hạ tầng sóng của MVNO (VinaPhone hay MobiFone) không ảnh hưởng tới cách tích hợp**: mọi MVNO dùng chung một chuẩn API.

Số liệu tham khảo: đến 30/4/2023 các MVNO có khoảng **2,65 triệu thuê bao (~2,1% thị trường)**; nhiều nguồn (Tạp chí Công Thương) nhận định MVNO Việt Nam **chưa khai thác tốt VAS, gói data chuyên biệt, eSIM, tích hợp fintech** → đây chính là khoảng trống mà Content Hub lấp vào.

**Nhu cầu điển hình của MVNO đối với content:**
- Tạo khác biệt cho gói cước khi không cạnh tranh được bằng giá data/sóng.
- Tăng ARPU, giữ chân thuê bao (gói tháng/năm tự gia hạn).
- Gắn với hệ sinh thái mẹ: Wintel ↔ bán lẻ WinMart; VNSKY ↔ ví VNPAY; Pottel ↔ dịch vụ bưu chính, hành chính công, nông thôn.
- Không muốn tự ký và tự tích hợp với hàng chục CP, tự đối soát với từng CP; MVNO đã có sẵn OCS/BSS để bán và trừ cước, chỉ thiếu nguồn nội dung.

---

## 4. Hiện trạng hệ thống MBG (theo hồ sơ KBDV/UAT dịch vụ Bundle hiện có)

Từ các tài liệu kịch bản kinh doanh (Bundle Add-on iCallme) và biên bản UAT (vnStudy – mã VSF10, VSF125…) trong dự án, MBG (Media Bundle Gateway) đang có các năng lực:

| Nhóm chức năng | Năng lực hiện tại | Bằng chứng |
|---|---|---|
| Kênh đăng ký | SMS MO tới đầu số **888** (`DK <mã>`, `HUY <mã>`); API cho kênh bán My VNPT, Shop.vnpt.vn, DigiShop, CCOS, CCBS, SMCS, App Employee; phân biệt kênh đăng ký | KBDV mục "Các kênh đăng ký"; log `MBG-MO`, `MBG-SMS` |
| Trừ cước | Trừ 100% giá gói qua **Diameter** vào OCS VinaPhone (trả trước trừ TK chính, trả sau ghi hoá đơn) | Log `VC_DIAMETER_CHARGE` |
| Quyền lợi data | Cộng lưu lượng vào tài khoản data khuyến mại | Mã `DC_MBG2_7GB_1D`, `DC_MBGM_6GBN` |
| Quyền lợi nội dung | Cấp license/kích hoạt tài khoản tại nền tảng CP, huỷ khi huỷ gói | iCallme license; vnStudy family |
| Vòng đời gói | Đăng ký, gia hạn theo chu kỳ, **retry 16 lần × 3 giờ** + retry theo sự kiện nạp tiền tới 62 ngày, huỷ | KBDV mục "Nguyên tắc trừ cước và gia hạn" |
| Thông báo | Gửi MT theo kịch bản cho từng sự kiện | UAT |
| Log & đối soát | Lưu lịch sử đăng ký/gia hạn/huỷ phục vụ CSKH, khiếu nại, đối soát | KBDV "Lưu ý chung" |

**Giới hạn khi phục vụ MVNO:** MBG mặc định *một nhà mạng – một OCS – một đầu số – một bộ MT – một chính sách giá – một sổ đối soát*. Mọi thứ đều gắn với VinaPhone.

---

## 5. Mô hình đề xuất: "VNPT Content Hub for MVNO"

### 5.1. Nguyên tắc phân vai

| Chức năng | MVNO | MBG / VNPT-Media | CP |
|---|---|---|---|
| Bán hàng, kênh đăng ký (SMS, app, điểm bán) | **Chịu trách nhiệm** | Cung cấp mô tả gói, mẫu nội dung truyền thông | – |
| Trừ cước, tính cước, hoá đơn | **Chịu trách nhiệm** (OCS/BSS riêng) | **Không tham gia** | – |
| Gia hạn chu kỳ, retry khi thiếu tiền | **Chịu trách nhiệm** | Nhận lệnh gia hạn/thu hồi | – |
| Cộng data (nếu MVNO muốn bundle) | **Tự làm** trên hệ thống của MVNO | Không | – |
| Tin nhắn MT tới thuê bao | Gửi bằng brandname/đầu số của MVNO | Trả về nội dung cần gửi (link, license, hướng dẫn) | – |
| Cấp/thu hồi quyền lợi nội dung | Gọi API | **Chịu trách nhiệm**: chuẩn hoá và chuyển tiếp tới CP | Kích hoạt tài khoản/license |
| CSKH | Tuyến 1 | Tuyến 2 (lỗi quyền lợi nội dung) | Tuyến 3 |
| Đối soát | Cung cấp CDR trừ cước | **Đối chiếu CDR MVNO với log cấp quyền**, chia sẻ doanh thu cho CP | Xác nhận số liệu sử dụng |

### 5.2. Hai hình thức cung cấp nội dung

| | **Theo chu kỳ (subscription)** | **Theo lượt (per-use)** |
|---|---|---|
| Ví dụ | Gói iCallme Premium tháng, vnStudy gói ngày/tháng/năm | Mua 1 bài học, 1 lượt tra cứu, 1 video, 1 lượt dùng tính năng AI |
| Đơn vị tính | Thuê bao × chu kỳ hiệu lực | Giao dịch (lượt) |
| Luồng chính | MVNO trừ cước → gọi `activate` (kèm `expire_at`) → MBG cấp quyền tại CP. Mỗi kỳ: MVNO trừ cước thành công → gọi `renew`; thất bại hết retry hoặc khách huỷ → gọi `deactivate` | MVNO trừ cước → gọi `grant_once` → MBG trả mã/link/kết quả dùng 1 lần |
| Hết hạn | MBG **tự thu hồi quyền sau `expire_at` + 7 ngày ân hạn** nếu không nhận được `renew` (chống "quên huỷ" làm thất thoát nội dung; 7 ngày đủ cho MVNO hoàn tất retry gia hạn) | Mã/link có hạn dùng ngắn |
| Đối soát | Số thuê bao-ngày có quyền lợi hợp lệ, so với số lượt trừ cước tháng/ngày của MVNO | Đối chiếu từng `transaction_id` |
| Rủi ro chính | Lệch trạng thái giữa MVNO và MBG (MVNO đã huỷ nhưng không báo) | Trùng giao dịch, trừ cước nhưng không cấp được quyền |

### 5.3. Luồng xử lý chuẩn

**Theo chu kỳ:**

```
Thuê bao        MVNO (kênh + OCS riêng)                 MBG (Content Hub)                CP
   │  DK GOI ──►│                                          │                              │
   │            │ 1. Kiểm tra điều kiện, trừ cước (OCS MVNO)│                              │
   │            │ 2. POST /subscriptions/activate ────────►│ 3. Xác thực tenant, gói      │
   │            │    {tenant, sub_token, package, txn_id,   │ 4. Tạo/kích hoạt quyền ─────►│
   │            │     charged_at, expire_at}               │◄──── license / tài khoản ────│
   │            │◄──────── {status, license, content_msg} ─│ 5. Ghi log cấp quyền         │
   │◄── MT (brandname MVNO, kèm license/link) ─            │                              │
   │            │                                          │                              │
   │    ...hết chu kỳ: MVNO tự gia hạn, retry trên OCS MVNO...                            │
   │            │ Thành công → POST /subscriptions/renew ─►│ gia hạn quyền tới expire_at mới
   │            │ Huỷ/hết retry → POST /deactivate ───────►│ thu hồi quyền tại CP ───────►│
   │            │                    (không nhận renew sau expire_at + 7 ngày) → MBG tự thu hồi
```

**Theo lượt:**

```
MVNO: trừ cước lượt (OCS MVNO) → POST /usage/grant {tenant, sub_token, item, txn_id}
MBG : kiểm tra trùng txn_id (idempotent) → gọi CP lấy mã/link/kết quả → trả về cho MVNO
Lỗi : MBG trả mã lỗi chuẩn → MVNO hoàn cước theo quy định của MVNO; giao dịch lỗi được loại khỏi đối soát
```

**Yêu cầu bắt buộc của API:** idempotent theo `txn_id` (MVNO gọi lại không cấp trùng), thời gian phản hồi ngắn để MVNO quyết định hoàn cước, webhook ngược về MVNO khi CP thu hồi/lỗi quyền lợi, và API `GET /subscriptions/{sub_token}` để tra cứu phục vụ CSKH.

**Mã hoá số điện thoại (`sub_token`):**
- MVNO không gửi số điện thoại dạng rõ. MVNO tính `sub_token = HMAC-SHA256(khoá_bí_mật_của_tenant, số_điện_thoại_chuẩn_hoá_84xxx)` và gửi kèm mọi lệnh.
- Mã này **cố định cho cùng một thuê bao** (để tra cứu, gia hạn, đối soát khớp được) và **khác nhau giữa các MVNO** (không thể ghép dữ liệu chéo tenant). Khoá bí mật do MVNO giữ, đổi khoá theo quy trình thống nhất.
- CSKH: tổng đài MVNO tự tính `sub_token` từ số khách cung cấp rồi tra cứu qua API; MBG không cần biết số điện thoại.
- Tin nhắn tới thuê bao do MVNO gửi, nên MBG không cần số điện thoại để gửi MT.
- CP chỉ nhận `sub_token` (hoặc mã license). **Lưu ý:** CP nào đăng nhập bằng số điện thoại/OTP phải chuyển sang kích hoạt bằng mã license hoặc liên kết tài khoản; nếu buộc phải có số điện thoại, MVNO gửi thêm trường số được mã hoá bằng khoá công khai của CP đó, MBG chỉ chuyển tiếp, không giải mã.
- Dữ liệu đã mã hoá vẫn được coi là dữ liệu cá nhân (dữ liệu bút danh hoá), vẫn cần thoả thuận xử lý dữ liệu giữa các bên.

### 5.4. Kiến trúc mục tiêu

```
   MVNO A (OCS/BSS riêng)   MVNO B (OCS/BSS riêng)   MVNO C ...
            │  REST/HTTPS + OAuth2/mTLS, webhook  │
            └──────────────────┬──────────────────┘
                 ┌─────────────▼─────────────┐        ┌──────────── MVNO Portal ───────────┐
                 │  API Gateway đa thuê      │◄──────►│ Danh mục · Giá bán buôn · Báo cáo │
                 │  xác thực, rate limit,    │        │ Đối soát · API key · Sandbox      │
                 │  định danh tenant         │        └───────────────────────────────────┘
                 └─────────────┬─────────────┘
                 ┌─────────────▼─────────────┐
                 │  MBG Core (multi-tenant)  │
                 │  • Catalog theo tenant    │
                 │  • Entitlement engine:    │
                 │    chu kỳ + theo lượt     │
                 │  • Tự thu hồi khi quá hạn │
                 └──────┬─────────────┬──────┘
          ┌─────────────▼───┐   ┌─────▼──────────────────────────┐
          │ CP Adapter      │   │ Đối soát & chia sẻ doanh thu    │
          │ (tái sử dụng    │   │ • Nhận CDR/đối soát từ MVNO     │
          │  kết nối CP     │   │ • So khớp với log cấp quyền     │
          │  hiện có)       │   │ • Bảng chia cho CP, hoá đơn     │
          └─────────────────┘   └────────────────────────────────┘
     CP: iCallme, vnStudy, video, nhạc, game, AI, bảo hiểm vi mô...

   Không có: Diameter charging adapter, data quota adapter, retry engine cho MVNO.
```

### 5.5. Danh mục nâng cấp MBG (gap analysis)

| # | Hạng mục | Hiện trạng | Cần nâng cấp | Mức độ |
|---|---|---|---|---|
| 1 | **Mô hình dữ liệu đa thuê** | Một nhà mạng (VinaPhone) | `tenant_id` xuyên suốt: quyền lợi, giao dịch, log, cấu hình; tách dữ liệu và phân quyền theo tenant | **Bắt buộc** |
| 2 | **API cấp quyền cho bên ngoài** | API nội bộ cho kênh bán VNPT, MBG tự trừ cước rồi cấp quyền | Tách luồng "trừ cước" khỏi luồng "cấp quyền": API `activate / renew / deactivate / grant_once / query`; OAuth2 hoặc mTLS, rate limit, sandbox, tài liệu API | **Bắt buộc** |
| 3 | **Idempotency & trạng thái** | Trạng thái do MBG tự quản lý | Khoá theo `txn_id` của MVNO; quy tắc khi lệch trạng thái; tự thu hồi khi quá `expire_at` + 7 ngày | **Bắt buộc** |
| 4 | **Mô hình theo lượt** | Chủ yếu gói chu kỳ | Entitlement dùng 1 lần: mã/link có hạn, kết quả trả ngay, xử lý lỗi để MVNO hoàn cước | **Bắt buộc** |
| 5 | Danh mục theo tenant | Một bảng giá bán lẻ | Một nội dung → nhiều SKU bán buôn theo MVNO; giá bán buôn và chu kỳ cho phép; MVNO tự đặt giá bán lẻ | **Bắt buộc** |
| 6 | Webhook về MVNO | Không có | Báo sự kiện CP thu hồi/lỗi quyền, nội dung ngừng cung cấp | Nên có |
| 7 | **Đối soát chéo** | Đối soát dựa trên log trừ cước của chính MBG | Nhận file/API đối soát từ MVNO; so khớp với log cấp quyền; xử lý chênh lệch; tính chia sẻ cho CP | **Bắt buộc** |
| 8 | MVNO Portal | Không có | Cổng tự phục vụ: danh mục, báo cáo realtime, tải đối soát, quản lý API key | Nên có |
| 9 | Bảo mật & dữ liệu cá nhân | Trong phạm vi VNPT | Định danh thuê bao bằng **`sub_token` (HMAC số điện thoại theo khoá riêng từng MVNO)**, không lưu số điện thoại dạng rõ; hỗ trợ trường số mã hoá chuyển tiếp cho CP bắt buộc; tách dữ liệu tenant, thoả thuận xử lý dữ liệu; tuân thủ Nghị định 13/2023 và Luật Bảo vệ dữ liệu cá nhân (?) | **Bắt buộc** |
| 10 | Hiệu năng & cô lập tải | Theo tải VinaPhone | Quota, circuit breaker theo tenant để sự cố một MVNO không ảnh hưởng VinaPhone | Bắt buộc |
| – | Trừ cước Diameter, cộng data, retry gia hạn | Đang có cho VinaPhone | **Giữ nguyên cho VinaPhone, không mở cho MVNO** | Không làm |

---

## 6. Mô hình kinh doanh

### 6.1. Phương án định giá cho MVNO

| Phương án | Cách tính | Phù hợp khi | Rủi ro |
|---|---|---|---|
| **Chia sẻ doanh thu (rev-share)** | MVNO giữ X%, VNPT-Media (hub + CP) nhận (100–X)% trên doanh thu MVNO thu được | MVNO muốn rủi ro thấp; giai đoạn đầu | Số liệu doanh thu do MVNO báo (cước nằm trên OCS của MVNO); cần quyền kiểm toán CDR |
| **Giá sỉ theo chu kỳ** | Đơn giá cố định/thuê bao/chu kỳ, **đếm theo log cấp quyền của MBG** | Gói chu kỳ; MVNO tự định giá bán lẻ, tự bundle data | VNPT-Media không hưởng lợi khi MVNO bán giá cao; ưu điểm: số liệu tính tiền do MBG nắm |
| **Giá sỉ theo lượt** | Đơn giá/lượt cấp thành công theo log MBG | Gói theo lượt | Cần chống trùng giao dịch (`txn_id`) |
| **Mua sỉ license theo lô** | Bán trước N license | Khuyến mại, hội viên, quà tặng | MVNO tồn kho license |
| **Phí nền tảng + rev-share** | Phí tích hợp/tháng + % doanh thu | MVNO lớn cần tuỳ biến | Khó đàm phán với MVNO nhỏ |

**Đã chốt: kết hợp giá sàn theo log MBG và chia sẻ doanh thu.** Mỗi kỳ đối soát (tháng), với từng MVNO và từng gói:

```
Phải trả VNPT-Media = MAX( A ; B )
  A = Giá sàn × Số chu kỳ (hoặc số lượt) cấp quyền thành công theo log MBG
  B = Tỷ lệ chia sẻ × Doanh thu gói đó theo CDR đối soát của MVNO
```

- **A bảo vệ VNPT-Media**: luôn có doanh thu tối thiểu theo số liệu MBG tự nắm, kể cả khi MVNO bán giảm giá, khuyến mại hoặc số liệu doanh thu báo thiếu.
- **B chia phần tăng trưởng**: khi MVNO bán giá cao, VNPT-Media hưởng theo tỷ lệ.
- Đối soát: MBG tính A từ log; MVNO gửi CDR/doanh thu để tính B; chênh lệch số lượng giữa log MBG và CDR MVNO vượt ngưỡng **1%** (đã chốt) thì đối soát chi tiết theo `txn_id`. Hợp đồng có điều khoản quyền kiểm toán CDR.
- Giá sàn và tỷ lệ chia sẻ quy định riêng theo gói, theo hình thức (chu kỳ/lượt) và có thể theo MVNO.

### 6.2. Dòng tiền (minh hoạ, số giả định)

Giả định: gói nội dung tháng, **giá sàn 15.000đ/chu kỳ (giả định)**, **tỷ lệ chia sẻ 70% (đã chốt)**; trong tháng MBG ghi nhận 10.000 chu kỳ cấp quyền thành công.

| Tình huống | Giá bán lẻ MVNO | Doanh thu MVNO (CDR) | A = giá sàn | B = 70% doanh thu | VNPT-Media nhận |
|---|---|---|---|---|---|
| MVNO bán giá chuẩn | 30.000đ | 300 triệu | 150 triệu | 210 triệu | **210 triệu** (B) |
| MVNO khuyến mại | 20.000đ | 200 triệu | 150 triệu | 140 triệu | **150 triệu** (A) |
| CDR MVNO báo thiếu 3.000 chu kỳ | 30.000đ | 210 triệu | 150 triệu | 147 triệu | **150 triệu** (A) + đối soát chi tiết vì lệch 30% > 1% |

```
VNPT-Media nhận MAX(A;B) ──► CP: theo hợp đồng CP hiện hành
                         └─► VNPT-Media: phần còn lại (vận hành hub, CSKH tuyến 2)
```

Tỷ lệ 70% đã chốt; **giá sàn 15.000đ là giả định**, cần chốt cụ thể theo từng gói. Phần VNPT-Media nhận được phân chia tiếp cho CP theo hợp đồng CP hiện hành.

### 6.3. Gợi ý danh mục nội dung theo MVNO

| MVNO | Gợi ý nội dung |
|---|---|
| Pottel (Bưu điện) | Chống lừa đảo cuộc gọi (iCallme) cho người cao tuổi, học tập (vnStudy), y tế/bảo hiểm vi mô, nội dung nông nghiệp, dịch vụ công |
| Wintel (Masan) | Giải trí (video, nhạc), gói hội viên kết hợp ưu đãi mua sắm |
| iTel | Giải trí giá rẻ, game (MVNO tự ghép với gói data của mình) |
| VNSKY (VNPAY) | Nội dung trả phí theo lượt qua ví, AI trợ lý, an toàn tài chính |
| Local | Gói học tập, giải trí cho phân khúc trẻ |

---

## 7. Lộ trình triển khai

Với **đủ nguồn lực kỹ thuật MBG**, quyền phân phối CP đã có và **VNPT-Media tự triển khai (không cần cơ chế nội bộ)**, lộ trình chạy song song: giai đoạn 0 và 1 chồng lấn (vừa đàm phán vừa phát triển), theo lượt làm song song với theo chu kỳ.

| Giai đoạn | Thời gian (ước tính) | Nội dung | Đầu ra |
|---|---|---|---|
| **0. Hợp đồng & pilot** | Tháng 1 | Chọn MVNO pilot; chốt mẫu hợp đồng ba bên, công thức MAX(A;B), quy trình đối soát; chốt chuẩn `sub_token`; chốt giá sàn từng gói | Kế hoạch triển khai VNPT-Media phê duyệt, term sheet, đặc tả API v1 |
| **1. Theo chu kỳ** | Tháng 1–3 | Hạng mục 1, 2, 3, 5, 9: multi-tenant, API `activate/renew/deactivate/query`, idempotency, tự thu hồi sau `expire_at` + 7 ngày, `sub_token`; 2–3 CP sẵn sàng (iCallme, vnStudy…) | 1 MVNO chạy thật gói chu kỳ, đối soát tháng đầu |
| **2. Theo lượt + vận hành** | Tháng 2–4 (song song) | Hạng mục 4, 6, 7: `grant_once`, webhook, đối soát chéo tự động tính MAX(A;B) | Gói theo lượt chạy thật; đối soát tự động |
| **3. Nhân rộng** | Tháng 4–6 | Hạng mục 8, 10: MVNO Portal, sandbox tự phục vụ; mở rộng CP | ≥3 MVNO; tích hợp MVNO mới trong vài tuần |

**Chỉ số theo dõi:** số MVNO kết nối; số thuê bao có quyền lợi hợp lệ theo tenant; số lượt cấp theo lượt; tỷ lệ cấp quyền thành công; tỷ lệ lệch đối soát; doanh thu bán buôn theo tenant/CP; thời gian tích hợp một MVNO mới.

---

## 8. Rủi ro và câu hỏi mở

| Rủi ro | Mô tả | Giảm thiểu |
|---|---|---|
| **Số liệu tính tiền nằm ở MVNO** | VNPT-Media không tự thấy được doanh thu thực tế, phụ thuộc số liệu MVNO báo | Công thức MAX(A;B): giá sàn A tính theo log MBG luôn đảm bảo mức tối thiểu; quyền kiểm toán CDR cho phần B |
| **Lệch trạng thái** | MVNO huỷ/không gia hạn nhưng không gọi API → thuê bao vẫn dùng nội dung miễn phí | Mọi quyền lợi có `expire_at`; MBG tự thu hồi sau 7 ngày ân hạn; đối soát ngày. Rủi ro tồn dư: tối đa 7 ngày dùng miễn phí/thuê bao – chấp nhận được, đổi lại không cắt nhầm khi MVNO đang retry |
| **Cấp quyền lỗi sau khi đã trừ cước** | Thuê bao bị trừ tiền nhưng không có nội dung → khiếu nại | Mã lỗi chuẩn, cam kết thời gian phản hồi, MVNO hoàn cước theo quy định của MVNO |
| **Dữ liệu cá nhân** | Định danh thuê bao giữa 3 bên | Đã chốt mã hoá số điện thoại (`sub_token`); MBG không lưu số rõ; thoả thuận xử lý dữ liệu |
| **CP cần số điện thoại để đăng nhập** | Một số CP kích hoạt bằng số điện thoại/OTP | Giả định toàn bộ CP kích hoạt bằng license; nếu phát hiện ngoại lệ khi tích hợp thì dùng trường số mã hoá bằng khoá công khai của CP, MBG chỉ chuyển tiếp |
| **Quy mô nhỏ** | Tổng thuê bao MVNO chỉ vài triệu | API chuẩn một lần, tích hợp MVNO mới với chi phí thấp |

**Còn mở (chốt trong giai đoạn 0):**
1. Mức giá sàn cụ thể cho từng gói và từng hình thức (theo chu kỳ, theo lượt) – hiện dùng giả định 15.000đ/chu kỳ để minh hoạ.

---

## 9. Bước tiếp theo đề xuất

1. Lập kế hoạch chi tiết và phân công đội kỹ thuật MBG cho các hạng mục bắt buộc ở mục 5.5 (chạy song song theo chu kỳ và theo lượt).
2. Soạn đặc tả API v1 (`activate / renew / deactivate / grant_once / query`), chuẩn `sub_token` và mẫu file đối soát tính MAX(A;B).
3. Khi tích hợp từng CP, kiểm tra lại giả định kích hoạt bằng license; ghi nhận ngoại lệ (nếu có).
4. Chốt giá sàn từng gói và tiếp cận 1 MVNO làm pilot (Pottel/iTel/Wintel hoặc VNSKY – mô hình không phụ thuộc hạ tầng).
5. Soạn kế hoạch triển khai của VNPT-Media và term sheet mẫu (đã có đủ 10 quyết định để đưa vào).

---

## Nguồn tham khảo

- Tạp chí Công Thương – [Thực trạng và xu hướng phát triển mạng di động ảo (MVNO) tại Việt Nam](https://tapchicongthuong.vn/thuc-trang-va-xu-huong-phat-trien-mang-di-dong-ao--mvno--tai-thi-truong-vien-thong-viet-nam-138416.htm)
- VnExpress – [Các mạng di động ảo Việt Nam đang kinh doanh ra sao?](https://vnexpress.net/cac-mang-di-dong-ao-viet-nam-dang-kinh-doanh-ra-sao-4525748.html)
- Dân trí – [Việt Nam có thêm mạng di động mới](https://dantri.com.vn/cong-nghe/viet-nam-co-them-mang-di-dong-moi-20260815221438692.htm)
- Báo Tin tức – [Thị trường viễn thông Việt Nam thay đổi ra sao với mạng di động ảo và Starlink?](https://baotintuc.vn/thuc-hien-nghi-quyet-57/thi-truong-vien-thong-viet-nam-thich-ung-voi-mang-di-dong-ao-va-starlink-20260828232058522.htm)
- TTXVN – [Việt Nam có thêm một mạng di động ảo](https://chinhsachcuocsong.vnanet.vn/viet-nam-co-them-mot-mang-di-dong-ao/33145.html)
- Diginow – [Light MVNO và Full MVNO là gì?](https://diginow.vn/mang-di-dong-ao-light-mvno-va-full-mvno-la-gi/)
- VietNamNet – [Vietnam's second mobile virtual network debuts](https://vietnamnet.vn/en/vietnams-second-mobile-virtual-network-debuts-646325.html)
- Yozzo – [Mobile Virtual Network Enabler (MVNE) – A Comprehensive Guide](https://www.yozzo.com/mvno-knowledge-hub/mobile-virtual-network-enabler-mvne/)
- Ecosmob – [Key difference between MNO, MVNO, MVNE, MVNA](https://www.ecosmob.com/key-difference-between-mno-mvno-mvne-mvna/)
- EarnBill – [Independent MVNO OCS vs Dependent MNO OCS](https://earnbill.com/blogs/mvno-online-charging-system-ocs/)
- Total Telecom – [ASPIDER-NGI delivers carrier billing gateway to 2degrees](https://totaltele.com/aspider-ngi-delivers-carrier-billing-gateway-to-2degrees/)
- Tài liệu nội bộ trong repo: `pm-webapp/app/templates/1_kbdv.docx` (KBDV Bundle Add-on iCallme), `pm-webapp/app/templates/3_uat.docx` (UAT vnStudy)
