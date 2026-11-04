# Nghiên cứu: Mô hình MVNE – Content Hub cung cấp nội dung cho các MVNO trên nền nâng cấp hệ thống MBG

*Ngày lập: 04/11/2026 · Phạm vi: VNPT VAS (VNPT-Media) · Trạng thái: bản nghiên cứu sơ bộ, cần xác minh các điểm đánh dấu (?)*

---

## 1. Tóm tắt (BLUF)

1. **Có cơ hội thật.** Việt Nam hiện có khoảng 5–7 MVNO, ít nhất 3 MVNO chạy trên hạ tầng VinaPhone/VNPT (iTel, Wintel, Pottel – Bưu điện Việt Nam). Các MVNO này hầu như **chưa khai thác dịch vụ giá trị gia tăng (VAS/content)**; họ không có đội ngũ ký hợp đồng với hàng chục CP và không có nền tảng đăng ký – gia hạn – đối soát gói nội dung.
2. **MBG (Media Bundle Gateway) đã có 70–80% năng lực cần thiết** của một "Content Hub": quản lý đăng ký/gia hạn/retry gói, trừ cước qua Diameter, cộng quyền lợi data, cấp license/quyền lợi sang CP, gửi MT, API cho kênh bán, log phục vụ đối soát. Điểm thiếu cốt lõi là **đa thuê (multi-tenant)**: MBG hiện được thiết kế cho một nhà mạng duy nhất là VinaPhone.
3. **Đề xuất:** nâng cấp MBG thành **"VNPT Content Hub for MVNO"** – một nền tảng MVNE ở lớp dịch vụ (service-layer MVNE), không làm MVNE mạng lõi. VNPT-Media đứng giữa: **gom content từ CP → đóng gói (content-only hoặc bundle data) → bán buôn/chia sẻ doanh thu cho MVNO**.
4. **Lộ trình 3 giai đoạn:** (1) Content-only qua API cho 1 MVNO trên mạng VinaPhone làm pilot; (2) Bundle data + content cho MVNO trên VinaPhone; (3) Mở cho MVNO trên mạng khác (content-only, charge qua API của MVNO).
5. **Điều kiện tiên quyết** không nằm ở kỹ thuật mà ở **cơ chế nội bộ VNPT** (VinaPhone đồng ý cho phép VNPT-Media bán nội dung cho thuê bao MVNO – đối thủ bán lẻ của chính VinaPhone) và **hợp đồng ba bên** MVNO – VNPT-Media – CP.

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

| MVNO | Doanh nghiệp | Đầu số | Hạ tầng | Mức liên quan tới VNPT |
|---|---|---|---|---|
| **iTel** | Đông Dương Telecom | 087 | VinaPhone | **Cao** – cùng mạng, có thể bundle data |
| **Wintel** (tiền thân Reddi) | Mobicast – Masan | 055 | VinaPhone | **Cao** – gắn hệ sinh thái WinMart, hội viên |
| **Pottel** | Tổng công ty Bưu điện Việt Nam | (?) | VNPT | **Rất cao** – cấp phép 12/2025, ra mắt khoảng 8/2026, ~13.000 điểm phục vụ; cùng hệ sinh thái nhà nước |
| **Local** | ASIM | 089 | MobiFone | Trung bình – chỉ content-only |
| **VNSKY** | Digilife – VNPAY | 0777 (?) | MobiFone | Trung bình – content-only, có thế mạnh thanh toán |
| **FPT** | FPT Retail | 0775 (?) | (?) | Cần xác minh |

Số liệu tham khảo: đến 30/4/2023 các MVNO có khoảng **2,65 triệu thuê bao (~2,1% thị trường)**; nhiều nguồn (Tạp chí Công Thương) nhận định MVNO Việt Nam **chưa khai thác tốt VAS, gói data chuyên biệt, eSIM, tích hợp fintech** → đây chính là khoảng trống mà Content Hub lấp vào.

**Nhu cầu điển hình của MVNO đối với content:**
- Tạo khác biệt cho gói cước khi không cạnh tranh được bằng giá data/sóng.
- Tăng ARPU, giữ chân thuê bao (gói tháng/năm tự gia hạn).
- Gắn với hệ sinh thái mẹ: Wintel ↔ bán lẻ WinMart; VNSKY ↔ ví VNPAY; Pottel ↔ dịch vụ bưu chính, hành chính công, nông thôn.
- Không muốn tự ký hàng chục hợp đồng CP, tự dựng hệ thống gia hạn/retry, tự đối soát.

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

### 5.1. Ba kịch bản hợp tác (theo hạ tầng của MVNO)

| | **Kịch bản A – MVNO trên VinaPhone** | **Kịch bản B – MVNO trên mạng khác** | **Kịch bản C – Bán sỉ license (B2B2C)** |
|---|---|---|---|
| Đối tượng | iTel, Wintel, Pottel | Local, VNSKY, (FPT?) | Bất kỳ MVNO/đối tác |
| Sản phẩm | Content-only **và** Bundle data + content | Content-only | Mã license/voucher nội dung |
| Trừ cước | Diameter tới OCS (OCS VinaPhone nếu light MVNO; OCS riêng của MVNO nếu full MVNO) | REST/API charge của BSS MVNO, hoặc MVNO thu tiền rồi gọi API cấp quyền | MVNO trả trước/mua sỉ theo lô |
| Quyền lợi data | Cộng data qua OCS/PCRF – **cần thoả thuận bán buôn với VinaPhone** | Không (MVNO tự cộng data nếu muốn bundle) | Không |
| Độ phức tạp tích hợp | Trung bình | Trung bình | Thấp |
| Thời gian ra thị trường | 3–6 tháng (?) | 3–6 tháng (?) | 1–2 tháng (?) |
| Ưu tiên | **Cao** | Trung bình | **Làm ngay để thử thị trường** |

### 5.2. Kiến trúc mục tiêu

```
                        ┌─────────────────────────── MVNO Portal ───────────────────────────┐
                        │ Danh mục gói · Cấu hình giá · Mẫu MT · Báo cáo · Đối soát · API key │
                        └───────────────────────────────┬────────────────────────────────────┘
 Kênh của MVNO                                          │
 (SMS shortcode riêng, App MVNO,     ┌──────────────────▼──────────────────┐
  web, điểm bán, POS bưu cục) ──────►│  Channel Adapter (SMS/API/OAuth2)   │
                                     │  → định danh tenant theo đầu số /   │
                                     │    dải thuê bao / API key           │
                                     └──────────────────┬──────────────────┘
                                     ┌──────────────────▼──────────────────┐
                                     │  MBG Core (đa thuê – multi-tenant)  │
                                     │  Product catalog per tenant         │
                                     │  Subscription engine (ĐK/GH/retry)  │
                                     │  Rule engine (điều kiện, xung đột)  │
                                     └───┬──────────────┬──────────────┬───┘
                     ┌───────────────────▼──┐  ┌────────▼────────┐  ┌──▼──────────────────────┐
                     │ Charging Adapter     │  │ Entitlement     │  │ Settlement & Reconcile   │
                     │ • Diameter Ro/Gy →   │  │ Adapter → CP    │  │ CDR theo tenant/CP/gói   │
                     │   OCS VinaPhone      │  │ (license, tài   │  │ Chia sẻ DT 3 bên         │
                     │ • Diameter → OCS MVNO│  │ khoản, API CP)  │  │ Đối soát tự động, hoá đơn│
                     │ • REST → BSS MVNO    │  └────────┬────────┘  └──────────────────────────┘
                     │ • Ví/prepaid sỉ      │           │
                     └──────────┬───────────┘     CP: iCallme, vnStudy,
                     Data quota adapter           video, nhạc, game, AI,
                     (chỉ cho Kịch bản A)         bảo hiểm vi mô, y tế...
```

### 5.3. Danh mục nâng cấp MBG (gap analysis)

| # | Hạng mục | Hiện trạng | Cần nâng cấp | Mức độ |
|---|---|---|---|---|
| 1 | **Mô hình dữ liệu đa thuê** | Một nhà mạng | Thêm `tenant_id` xuyên suốt: thuê bao, gói, giao dịch, CDR, MT, cấu hình; tách dữ liệu và phân quyền theo tenant | **Bắt buộc** |
| 2 | Định danh thuê bao thuộc MVNO | Mặc định thuê bao VinaPhone | Nhận diện theo dải số/IMSI range/đầu số MVNO; xử lý **chuyển mạng giữ số** (MNP) – không thể chỉ dựa vào đầu số | **Bắt buộc** |
| 3 | Danh mục gói theo tenant | Một bảng giá | Cùng một content, nhiều SKU: tên gói, giá, chu kỳ, mã cước, quyền lợi khác nhau theo MVNO; quản lý vòng đời giá | **Bắt buộc** |
| 4 | Charging adapter đa đích | Diameter → OCS VinaPhone | Định tuyến cước theo tenant: Diameter tới OCS VinaPhone (light MVNO) hoặc OCS riêng (full MVNO); REST charge API; mô hình trả trước sỉ | **Bắt buộc** |
| 5 | Kênh SMS/MT theo thương hiệu | Đầu số 888, MT VinaPhone | Shortcode/brandname riêng từng MVNO, mẫu MT theo tenant, tổng đài CSKH theo tenant | Bắt buộc |
| 6 | API mở cho MVNO | API nội bộ cho kênh bán VNPT | API Gateway công khai: OAuth2/API key, rate limit, webhook sự kiện (ĐK/GH/huỷ), sandbox, tài liệu API | Bắt buộc |
| 7 | Chính sách gia hạn/retry theo tenant | Cố định 16×3h + 62 ngày | Tham số hoá theo tenant (một số MVNO có quy định retry khác) | Nên có |
| 8 | Data quota adapter | Cộng data qua hệ thống VinaPhone | Chỉ áp dụng Kịch bản A; cần mã data riêng cho thuê bao MVNO và thoả thuận giá sỉ data | Theo giai đoạn |
| 9 | Đối soát & chia sẻ doanh thu | Đối soát VinaPhone – VNPT-Media – CP | Sổ đối soát theo tenant, mô hình chia sẻ nhiều tầng, báo cáo định kỳ, xuất hoá đơn, xử lý khiếu nại/hoàn tiền theo tenant | **Bắt buộc** |
| 10 | MVNO Portal | Không có | Cổng tự phục vụ: chọn gói, cấu hình giá, xem báo cáo realtime, tải đối soát | Nên có |
| 11 | Bảo mật & dữ liệu cá nhân | Trong phạm vi VNPT | Phân tách dữ liệu tenant, tối thiểu hoá dữ liệu gửi CP, ghi nhận sự đồng ý; tuân thủ Nghị định 13/2023 và Luật Bảo vệ dữ liệu cá nhân (?) | **Bắt buộc** |
| 12 | Hiệu năng & SLA | Theo tải VinaPhone | Cô lập tải theo tenant (quota, circuit breaker) để sự cố một MVNO không ảnh hưởng VinaPhone | Bắt buộc |

---

## 6. Mô hình kinh doanh

### 6.1. Phương án định giá cho MVNO

| Phương án | Cách tính | Phù hợp khi | Rủi ro |
|---|---|---|---|
| **Chia sẻ doanh thu (rev-share)** | MVNO giữ X%, VNPT-Media (hub + CP) nhận (100–X)% trên doanh thu gói nội dung | MVNO muốn rủi ro thấp; giai đoạn đầu | Doanh thu phụ thuộc năng lực bán của MVNO |
| **Giá sỉ theo thuê bao hoạt động** | Đơn giá cố định/thuê bao/tháng | MVNO tự định giá bán lẻ, gói bundle lớn | VNPT-Media không hưởng lợi khi MVNO bán giá cao |
| **Mua sỉ license theo lô** | Bán trước N license | Kịch bản C, khuyến mại, hội viên | MVNO tồn kho license |
| **Phí nền tảng + rev-share** | Phí tích hợp/tháng + % doanh thu | MVNO lớn cần tuỳ biến | Khó đàm phán với MVNO nhỏ |

**Khuyến nghị:** giai đoạn đầu dùng **rev-share có doanh thu tối thiểu cam kết (minimum guarantee) nhỏ**, kèm Kịch bản C cho các chương trình khuyến mại.

### 6.2. Dòng tiền (minh hoạ, số giả định)

Gói nội dung 30.000đ/tháng bán cho thuê bao MVNO (Kịch bản B, content-only):

```
Thuê bao trả 30.000đ ──► MVNO giữ 40% = 12.000đ (kênh, thu cước, CSKH tuyến 1)
                     └─► VNPT-Media 60% = 18.000đ
                              ├─► CP: theo hợp đồng CP hiện hành
                              └─► VNPT-Media: phần còn lại (vận hành hub, CSKH tuyến 2)
```

Tỷ lệ trên **chỉ để minh hoạ**; cần đối chiếu cơ chế kinh tế nội bộ (QĐ 55 và các phụ lục phân chia doanh thu theo công đoạn) và tham chiếu tỷ lệ đang áp dụng với VinaPhone.

### 6.3. Gợi ý danh mục nội dung theo MVNO

| MVNO | Gợi ý nội dung |
|---|---|
| Pottel (Bưu điện) | Chống lừa đảo cuộc gọi (iCallme) cho người cao tuổi, học tập (vnStudy), y tế/bảo hiểm vi mô, nội dung nông nghiệp, dịch vụ công |
| Wintel (Masan) | Giải trí (video, nhạc), gói hội viên kết hợp ưu đãi mua sắm |
| iTel | Gói data + giải trí giá rẻ, game |
| VNSKY (VNPAY) | Nội dung trả phí theo lượt qua ví, AI trợ lý, an toàn tài chính |
| Local | Gói học tập, giải trí cho phân khúc trẻ |

---

## 7. Lộ trình triển khai

| Giai đoạn | Thời gian (?) | Nội dung | Đầu ra |
|---|---|---|---|
| **0. Khảo sát & cơ chế** | 1–2 tháng | Làm việc VinaPhone về cơ chế cho phép bán VAS tới thuê bao MVNO; khảo sát nhu cầu iTel/Wintel/Pottel; rà hợp đồng CP (quyền phân phối cho bên thứ ba); khung pháp lý | Tờ trình chủ trương, term sheet với 1 MVNO pilot |
| **1. Pilot content-only** | 2–3 tháng | Multi-tenant tối thiểu (hạng mục 1, 2, 3, 6, 9); Kịch bản C (license) + API cấp quyền; 2–3 CP sẵn sàng (iCallme, vnStudy…) | 1 MVNO chạy thật, báo cáo đối soát tháng đầu |
| **2. Bundle trên VinaPhone** | 3–4 tháng | Charging adapter tới OCS tương ứng, data quota adapter, SMS/MT theo thương hiệu, retry theo tenant | Gói bundle data + content cho MVNO trên VinaPhone |
| **3. Mở rộng** | 3–6 tháng | REST charge tới BSS MVNO mạng khác; MVNO Portal tự phục vụ; mở rộng danh mục CP | Hub phục vụ ≥3 MVNO |

**Chỉ số theo dõi đề xuất:** số MVNO kết nối, số thuê bao hoạt động theo tenant, tỷ lệ gia hạn thành công, tỷ lệ huỷ trong 7 ngày, doanh thu theo tenant/CP, tỷ lệ khiếu nại, thời gian tích hợp một MVNO mới.

---

## 8. Rủi ro và câu hỏi mở

| Rủi ro | Mô tả | Giảm thiểu |
|---|---|---|
| **Xung đột lợi ích nội bộ** | VinaPhone có thể coi việc bán content cho thuê bao MVNO là hỗ trợ đối thủ bán lẻ | Định vị là doanh thu bán buôn bổ sung cho Tập đoàn; VinaPhone hưởng một phần (phí hạ tầng/charging) |
| **Quyền phân phối của CP** | Hợp đồng CP hiện có thể chỉ cho phép phân phối qua VinaPhone | Phụ lục hợp đồng mở rộng kênh phân phối |
| **Phụ thuộc hệ thống MVNO** | BSS/OCS của MVNO không chuẩn hoá, mỗi bên một API | Adapter chuẩn + SDK; ưu tiên MVNO trên VinaPhone trước |
| **Nhận diện thuê bao** | MNP làm sai lệch nhận diện theo đầu số | Dùng dữ liệu routing/IMSI hoặc để MVNO gửi định danh qua API |
| **Dữ liệu cá nhân** | Chia sẻ thuê bao giữa 3 bên | Tối thiểu hoá dữ liệu, thoả thuận xử lý dữ liệu, đánh giá tác động |
| **Quy định đăng ký dịch vụ nội dung** | Quy định về xác nhận đăng ký, tin nhắn quảng cáo, giải quyết khiếu nại | Rà soát pháp chế trước pilot; giữ nguyên chuẩn kịch bản đã nghiệm thu với VinaPhone |
| **Quy mô nhỏ** | Tổng thuê bao MVNO chỉ vài triệu | Chi phí tích hợp thấp, tái sử dụng tối đa MBG; coi đây là kênh tăng trưởng bổ sung |

**Câu hỏi cần xác minh:**
1. Hợp đồng bán buôn giữa VinaPhone và từng MVNO có quy định về VAS/nội dung bên thứ ba không?
2. iTel, Wintel, Pottel đang dùng OCS của VinaPhone hay OCS riêng? (quyết định thiết kế Charging Adapter)
3. Đầu số, hạ tầng của FPT và trạng thái hoạt động hiện tại của các MVNO.
4. Cơ chế kinh tế nội bộ áp dụng cho doanh thu từ đối tác ngoài VinaPhone.
5. Kiến trúc hiện tại của MBG (CSDL, khả năng thêm `tenant_id`, giới hạn TPS) – cần đội kỹ thuật MBG đánh giá effort.

---

## 9. Bước tiếp theo đề xuất

1. Lấy ý kiến đội kỹ thuật MBG về effort cho các hạng mục bắt buộc trong mục 5.3.
2. Gặp VinaPhone (Ban KHDN/Ban Bán buôn) thăm dò cơ chế.
3. Tiếp cận Pottel làm MVNO pilot (cùng khối nhà nước, mới ra mắt, đang cần nội dung khác biệt).
4. Soạn tờ trình chủ trương và term sheet mẫu.

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
