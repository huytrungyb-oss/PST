# Kế hoạch triển khai VNPT Content Hub for MVNO (nâng cấp MBG)

*Ngày lập: 04/11/2026 · Đơn vị chủ trì: VNPT-Media (VNPT VAS) · Căn cứ: `docs/nghien-cuu-mvne-content-hub-mbg.md` (10 quyết định đã chốt)*

---

## 1. Tóm tắt (BLUF)

- **Mục tiêu:** trong **6 tháng**, nâng cấp MBG thành nền tảng đa thuê cung cấp nội dung bán buôn cho MVNO theo **2 hình thức: theo chu kỳ và theo lượt**; MVNO tự bán và tự trừ cước trên hệ thống riêng.
- **Đích đến:** tháng 3 có 1 MVNO pilot chạy thật gói theo chu kỳ; tháng 4 chạy thật gói theo lượt và đối soát tự động; tháng 6 có ≥3 MVNO kết nối.
- **Tổ chức:** VNPT-Media **tự triển khai**, không cần cơ chế nội bộ Tập đoàn; **đủ nguồn lực**, các luồng chạy song song.
- **Việc cần chốt ngay (tuần 1–2):** giá sàn từng gói (hiện giả định 15.000đ/chu kỳ), MVNO pilot, đặc tả API v1.

---

## 2. Mục tiêu, phạm vi, chỉ tiêu

### 2.1. Phạm vi

| Trong phạm vi | Ngoài phạm vi |
|---|---|
| 10 hạng mục nâng cấp MBG (mục 5.5 báo cáo nghiên cứu) | Trừ cước, cộng data, retry gia hạn cho MVNO (MVNO tự làm) |
| API v1: `activate / renew / deactivate / grant_once / query`, webhook | Thay đổi luồng VinaPhone hiện hữu trên MBG |
| Đối soát MAX(A;B), ngưỡng lệch 1% | Gửi MT tới thuê bao MVNO (MVNO gửi bằng brandname riêng) |
| MVNO Portal, sandbox | Phát triển nội dung mới của CP |
| Hợp đồng/term sheet với MVNO, phụ lục với CP | |

### 2.2. Chỉ tiêu 6 tháng (**đề xuất**, chốt lại khi phê duyệt kế hoạch)

| # | Chỉ tiêu | Tháng 3 | Tháng 6 |
|---|---|---|---|
| 1 | Số MVNO kết nối chạy thật | 1 | ≥3 |
| 2 | Số CP cung cấp qua Hub | 2 (iCallme, vnStudy) | ≥6 |
| 3 | Thuê bao có quyền lợi hợp lệ (theo chu kỳ) | 5.000 | 50.000 |
| 4 | Lượt cấp theo lượt/tháng | – | 20.000 |
| 5 | Tỷ lệ cấp quyền thành công | ≥99,0% | ≥99,5% |
| 6 | Thời gian phản hồi API (p95) | ≤1 giây | ≤500 ms |
| 7 | Độ sẵn sàng dịch vụ | ≥99,5% | ≥99,9% |
| 8 | Tỷ lệ kỳ đối soát lệch >1% | – | ≤1 kỳ/MVNO/quý |
| 9 | Thời gian tích hợp một MVNO mới | – | ≤4 tuần |
| 10 | Doanh thu bán buôn lũy kế | [...] | [...] (tính sau khi chốt giá sàn) |

---

## 3. Tổ chức thực hiện

### 3.1. Nguyên tắc

- VNPT-Media tự quyết và tự triển khai; Ban Chỉ đạo dự án do lãnh đạo VNPT-Media phân công.
- Nguồn lực kỹ thuật MBG bố trí đủ để chạy song song luồng **theo chu kỳ** và **theo lượt**.
- Họp điều hành tuần (PM chủ trì); báo cáo lãnh đạo 2 tuần/lần.

### 3.2. Ma trận RACI

*R: thực hiện · A: chịu trách nhiệm cuối · C: tham vấn · I: được thông báo*

| Công việc | PM | BA | Trưởng nhóm MBG | Dev backend | QA | DevOps/ATTT | Đối soát/Tài chính | Pháp chế | KD/PT đối tác | CSKH |
|---|---|---|---|---|---|---|---|---|---|---|
| Kế hoạch tổng thể, điều hành | **A/R** | C | C | I | I | I | I | I | C | I |
| Chọn MVNO pilot, đàm phán | A | I | C | – | – | – | C | C | **R** | I |
| Term sheet, hợp đồng MVNO | A | C | C | – | – | C | C | **R** | R | I |
| Phụ lục hợp đồng CP | A | C | I | – | – | – | C | **R** | R | – |
| Chốt giá sàn từng gói | **A** | C | – | – | – | – | **R** | I | R | – |
| Đặc tả nghiệp vụ & API v1 | A | **R** | **R** | C | C | C | C | – | I | C |
| Thiết kế kiến trúc đa thuê | I | C | **A/R** | R | C | C | – | – | – | – |
| Phát triển API, entitlement, CP adapter | I | C | **A** | **R** | C | C | – | – | – | – |
| Chuẩn `sub_token`, bảo mật, ATTT | I | C | A | R | C | **R** | – | C | – | – |
| Hạ tầng, giám sát, cô lập tải | I | – | A | C | C | **R** | – | – | – | – |
| Đối soát MAX(A;B) | A | R | C | R | C | – | **R** | I | I | – |
| MVNO Portal | A | **R** | C | R | C | C | C | – | C | I |
| Kiểm thử nội bộ | I | C | A | C | **R** | C | C | – | – | – |
| UAT với MVNO | **A** | R | C | C | **R** | C | C | – | C | C |
| Quy trình CSKH 3 tuyến | A | C | C | – | – | – | – | – | C | **R** |
| Vận hành, xử lý sự cố | I | – | **A** | R | – | **R** | – | – | I | C |

---

## 4. Kế hoạch chi tiết 6 tháng

### 4.1. Đối chiếu hạng mục nâng cấp (mục 5.5 báo cáo) với giai đoạn

| # | Hạng mục | Giai đoạn | Tuần |
|---|---|---|---|
| 1 | Mô hình dữ liệu đa thuê (`tenant_id`) | 1 | T2–T6 |
| 2 | API cấp quyền cho bên ngoài | 1 | T3–T9 |
| 3 | Idempotency & trạng thái, tự thu hồi sau `expire_at` + 7 ngày | 1 | T4–T9 |
| 4 | Mô hình theo lượt (`grant_once`) | 2 | T6–T13 |
| 5 | Danh mục theo tenant | 1 | T3–T7 |
| 6 | Webhook về MVNO | 2 | T8–T12 |
| 7 | Đối soát chéo MAX(A;B), ngưỡng 1% | 2 | T7–T15 |
| 8 | MVNO Portal | 3 | T13–T22 |
| 9 | Bảo mật & dữ liệu cá nhân (`sub_token`) | 1 | T2–T8 |
| 10 | Hiệu năng & cô lập tải theo tenant | 3 (khởi động từ GĐ1) | T5–T20 |

### 4.2. WBS theo tuần (T1 = tuần đầu tiên sau khi phê duyệt kế hoạch)

| Mã | Công việc | Tuần | Chủ trì | Đầu ra |
|---|---|---|---|---|
| **0** | **Giai đoạn 0 – Hợp đồng & pilot (tháng 1)** | | | |
| 0.1 | Phê duyệt kế hoạch, lập Ban Chỉ đạo, kick-off | T1 | PM | Quyết định giao nhiệm vụ |
| 0.2 | Chốt giá sàn từng gói/hình thức | T1–T2 | Đối soát/Tài chính | Bảng giá sàn (Phụ lục term sheet) |
| 0.3 | Chọn MVNO pilot, gửi term sheet, đàm phán | T1–T4 | KD/PT đối tác | Term sheet ký nháy |
| 0.4 | Phụ lục hợp đồng CP (iCallme, vnStudy) | T2–T4 | Pháp chế | Phụ lục ký |
| 0.5 | Đặc tả nghiệp vụ & API v1, chuẩn `sub_token`, mẫu file đối soát | T1–T3 | BA + Trưởng nhóm MBG | Tài liệu đặc tả API v1 |
| 0.6 | Kiểm tra giả định CP kích hoạt bằng license | T2–T3 | BA | Danh sách CP + cách kích hoạt |
| **1** | **Giai đoạn 1 – Theo chu kỳ (tháng 1–3)** | | | |
| 1.1 | Thiết kế kiến trúc đa thuê | T2–T3 | Trưởng nhóm MBG | Tài liệu kiến trúc |
| 1.2 | `tenant_id` xuyên suốt, tách dữ liệu, phân quyền | T2–T6 | Dev backend | HM1 hoàn thành |
| 1.3 | Danh mục gói theo tenant | T3–T7 | Dev backend | HM5 |
| 1.4 | API Gateway (OAuth2/mTLS, rate limit), `activate/renew/deactivate/query` | T3–T9 | Dev backend | HM2 |
| 1.5 | Idempotency `txn_id`, máy trạng thái, tự thu hồi sau 7 ngày | T4–T9 | Dev backend | HM3 |
| 1.6 | `sub_token`, mã hoá, không lưu SĐT rõ | T2–T8 | DevOps/ATTT | HM9, biên bản ATTT |
| 1.7 | Sandbox cho MVNO pilot | T6–T7 | DevOps/ATTT | Môi trường sandbox |
| 1.8 | MVNO tích hợp sandbox | T7–T9 | KD/PT đối tác + BA | Biên bản tích hợp |
| 1.9 | Kiểm thử nội bộ, hiệu năng | T8–T10 | QA | Báo cáo test |
| 1.10 | UAT với MVNO pilot | T10–T11 | QA + PM | Biên bản UAT |
| 1.11 | Go-live gói theo chu kỳ | T12 | PM | **M3** |
| **2** | **Giai đoạn 2 – Theo lượt + vận hành (tháng 2–4, song song)** | | | |
| 2.1 | `grant_once`, mã/link dùng 1 lần, mã lỗi chuẩn | T6–T13 | Dev backend | HM4 |
| 2.2 | Webhook về MVNO | T8–T12 | Dev backend | HM6 |
| 2.3 | Đối soát chéo MAX(A;B), cảnh báo lệch >1%, báo cáo chi tiết theo `txn_id` | T7–T15 | Đối soát/Tài chính + Dev | HM7 |
| 2.4 | Quy trình CSKH 3 tuyến, kịch bản tra cứu | T8–T12 | CSKH | Quy trình CSKH |
| 2.5 | Giám sát, cảnh báo, runbook sự cố | T8–T14 | DevOps/ATTT | Dashboard + runbook |
| 2.6 | UAT theo lượt + đối soát kỳ đầu | T14–T15 | QA + Đối soát | Biên bản UAT, biên bản đối soát tháng 1 |
| 2.7 | Go-live theo lượt | T16 | PM | **M4** |
| **3** | **Giai đoạn 3 – Nhân rộng (tháng 4–6)** | | | |
| 3.1 | MVNO Portal (danh mục, báo cáo, tải đối soát, API key) | T13–T22 | BA + Dev | HM8 |
| 3.2 | Cô lập tải theo tenant (quota, circuit breaker), test chịu tải | T5–T20 | DevOps/ATTT | HM10 |
| 3.3 | Mở rộng CP (≥6) | T14–T24 | KD/PT đối tác | Phụ lục CP |
| 3.4 | Ký và tích hợp MVNO thứ 2, thứ 3 | T14–T24 | KD/PT đối tác | Hợp đồng + go-live |
| 3.5 | Đánh giá 6 tháng, kế hoạch giai đoạn sau | T25–T26 | PM | Báo cáo tổng kết |

### 4.3. Mốc và tiêu chí ĐẠT

| Mốc | Tuần | Tiêu chí ĐẠT |
|---|---|---|
| **M0** – Khởi động | T1 | Kế hoạch được phê duyệt; RACI được phân công |
| **M1** – Chốt thương mại & đặc tả | T4 | Giá sàn từng gói chốt; term sheet ký nháy với MVNO pilot; đặc tả API v1 được MVNO xác nhận; phụ lục CP ký |
| **M2** – Sẵn sàng sandbox | T7 | API chu kỳ chạy trên sandbox; `sub_token` qua kiểm tra ATTT; MVNO gọi thành công 4 API |
| **M3** – Go-live theo chu kỳ | T12 | 100% kịch bản UAT nhóm chu kỳ ĐẠT; không còn lỗi mức nghiêm trọng; hợp đồng chính thức ký; CSKH tuyến 2 sẵn sàng |
| **M4** – Go-live theo lượt + đối soát | T16 | 100% kịch bản UAT nhóm theo lượt ĐẠT; đối soát kỳ đầu hoàn tất, chênh lệch ≤1% hoặc đã giải trình theo `txn_id` |
| **M5** – Portal & cô lập tải | T22 | Portal vận hành cho MVNO pilot; test chịu tải ≥2 lần tải dự kiến, sự cố một tenant không ảnh hưởng tenant khác/VinaPhone |
| **M6** – Nhân rộng | T26 | ≥3 MVNO chạy thật; đạt chỉ tiêu mục 2.2 (hoặc giải trình) |

### 4.4. Gantt (tuần)

```
Tuần                     1   4    8    12   16   20   24 26
                         |---|----|----|----|----|----|--|
GĐ0 Hợp đồng & pilot     ████                              M0(T1) M1(T4)
  0.5 Đặc tả API v1      ███
GĐ1 Theo chu kỳ           ███████████                      M2(T7) M3(T12)
  1.2 Đa thuê (HM1)       █████
  1.4 API (HM2)             ███████
  1.5 Trạng thái (HM3)       ██████
  1.6 sub_token (HM9)     ███████
  1.10 UAT chu kỳ                  ██
GĐ2 Theo lượt + vận hành       ██████████                  M4(T16)
  2.1 grant_once (HM4)         ████████
  2.3 Đối soát (HM7)            █████████
  2.6 UAT + đối soát                    ██
GĐ3 Nhân rộng                         ██████████████       M5(T22) M6(T26)
  3.1 Portal (HM8)                    ██████████
  3.2 Cô lập tải (HM10)      ████████████████
  3.4 MVNO 2, 3                         ███████████
```

---

## 5. Kế hoạch kiểm thử / UAT với MVNO pilot

**Môi trường:** sandbox (T7) → staging có dữ liệu giả lập → production với danh sách thuê bao test của MVNO.
**Điều kiện vào UAT:** test nội bộ ĐẠT 100% kịch bản mức cao; không còn lỗi nghiêm trọng.
**Điều kiện ĐẠT UAT:** 100% kịch bản mức Cao ĐẠT; mức Trung bình ≥95% và lỗi còn lại có kế hoạch khắc phục.

| # | Kịch bản | Bước chính | Kết quả mong đợi | Mức |
|---|---|---|---|---|
| U1 | Activate thành công | MVNO trừ cước → `activate` (sub_token, package, txn_id, expire_at) | Trả `status=success`, license/link; CP kích hoạt quyền; log có tenant_id | Cao |
| U2 | Activate gói không thuộc tenant | Gọi `activate` với gói chưa mở cho MVNO | Mã lỗi chuẩn, không cấp quyền | Cao |
| U3 | Renew đúng hạn | `renew` trước `expire_at` | `expire_at` mới; quyền liên tục | Cao |
| U4 | Renew trong 7 ngày ân hạn | `renew` sau `expire_at`, trước +7 ngày | Gia hạn thành công, quyền được khôi phục/giữ | Cao |
| U5 | Tự thu hồi sau 7 ngày | Không gọi `renew`, chờ quá `expire_at` + 7 ngày (giả lập thời gian) | MBG thu hồi quyền tại CP; webhook báo MVNO | Cao |
| U6 | Renew sau khi đã tự thu hồi | `renew` sau +7 ngày | Xử lý như `activate` mới hoặc mã lỗi theo đặc tả | TB |
| U7 | Deactivate | `deactivate` | Thu hồi quyền tại CP ngay; `query` trả trạng thái huỷ | Cao |
| U8 | Grant theo lượt | MVNO trừ cước → `grant_once` | Trả mã/link dùng 1 lần trong thời hạn | Cao |
| U9 | Idempotency `txn_id` | Gọi lại `activate`/`grant_once` cùng `txn_id` | Trả kết quả cũ, **không cấp trùng**, không ghi 2 lần vào log đối soát | Cao |
| U10 | Trùng `txn_id` khác nội dung | Cùng `txn_id`, khác gói | Mã lỗi xung đột | TB |
| U11 | Sai/không hợp lệ `sub_token` | Gửi token sai định dạng | Mã lỗi định dạng, không cấp quyền | Cao |
| U12 | `sub_token` của tenant khác | MVNO A gửi token/khoá của MVNO B | Không tra cứu được dữ liệu chéo tenant | Cao |
| U13 | Timeout phía CP | Giả lập CP không phản hồi | MBG trả mã lỗi trong thời gian cam kết; MVNO hoàn cước; giao dịch loại khỏi đối soát | Cao |
| U14 | Timeout phía MVNO, gọi lại | MVNO không nhận phản hồi, gọi lại cùng `txn_id` | Kết quả nhất quán (U9) | Cao |
| U15 | Xác thực | Sai API key/chứng chỉ; vượt rate limit | 401/429, không xử lý | Cao |
| U16 | Query phục vụ CSKH | `query` theo sub_token | Đúng trạng thái, hạn, lịch sử | TB |
| U17 | Webhook | CP thu hồi/ngừng nội dung | MVNO nhận webhook đúng định dạng, có retry | TB |
| U18 | Đối soát khớp | Kỳ đối soát, log MBG = CDR MVNO | Tính đúng MAX(A;B) | Cao |
| U19 | Đối soát lệch >1% | CDR MVNO thiếu >1% so với log MBG | Cảnh báo, sinh báo cáo chi tiết theo `txn_id`; A vẫn được áp | Cao |
| U20 | Đối soát lệch ≤1% | Lệch 0,5% | Chấp nhận, ghi chú, không đối soát chi tiết | TB |
| U21 | Hiệu năng | Tải đỉnh dự kiến × 2 | p95 đạt chỉ tiêu; không ảnh hưởng luồng VinaPhone | Cao |

---

## 6. Vận hành & CSKH

### 6.1. CSKH 3 tuyến

| Tuyến | Đơn vị | Phạm vi | Công cụ | Thời hạn chuyển tuyến/xử lý (đề xuất) |
|---|---|---|---|---|
| 1 | Tổng đài/CSKH của MVNO | Mọi yêu cầu của thuê bao: đăng ký, trừ cước, hoàn cước, hướng dẫn | Hệ thống MVNO; API `query` (tự tính sub_token từ SĐT khách đọc) | Chuyển tuyến 2 nếu lỗi quyền lợi nội dung: trong 4 giờ làm việc |
| 2 | CSKH VNPT-Media | Lỗi cấp/thu hồi quyền, sai trạng thái MBG | Log MBG theo tenant/sub_token, Portal | Phản hồi 8 giờ làm việc; xử lý 24 giờ |
| 3 | CP | Lỗi sử dụng nội dung trong ứng dụng CP | Hệ thống CP | Theo SLA hợp đồng CP |

Nguyên tắc: VNPT-Media không liên hệ trực tiếp thuê bao MVNO (không có SĐT rõ); hoàn cước do MVNO thực hiện theo quy định của MVNO.

### 6.2. Xử lý sự cố

| Mức | Định nghĩa | Phản hồi | Khắc phục | Thông báo |
|---|---|---|---|---|
| P1 | Toàn bộ API không phục vụ một/nhiều MVNO; cấp quyền sai hàng loạt | 15 phút | 4 giờ | MVNO, lãnh đạo VNPT-Media, CP liên quan |
| P2 | Một chức năng/CP lỗi; tỷ lệ lỗi >1% | 30 phút | 8 giờ | MVNO, CP liên quan |
| P3 | Lỗi đơn lẻ, không ảnh hưởng diện rộng | 4 giờ | 3 ngày làm việc | Theo ticket |

Quy trình: phát hiện (giám sát/MVNO báo) → phân loại mức → khoanh vùng tenant (circuit breaker) → khắc phục → thông báo → báo cáo sau sự cố (RCA) trong 3 ngày làm việc với P1/P2 → đối soát bù trừ các giao dịch bị ảnh hưởng.

### 6.3. Giám sát

| Chỉ số | Ngưỡng cảnh báo |
|---|---|
| Tỷ lệ lỗi API theo tenant | >1% trong 5 phút |
| Thời gian phản hồi p95 | >1 giây trong 5 phút |
| Tỷ lệ lỗi gọi CP theo CP | >2% trong 5 phút |
| Số quyền tự thu hồi sau 7 ngày theo ngày | Tăng bất thường >50% so với trung bình 7 ngày |
| Webhook thất bại | >5% |
| Chênh lệch log MBG – CDR MVNO (đối soát ngày) | >1% |
| Tài nguyên hệ thống (CPU, DB, hàng đợi) | Theo ngưỡng vận hành MBG hiện hành |

---

## 7. Rủi ro và phương án

| Rủi ro | Khả năng | Ảnh hưởng | Phương án |
|---|---|---|---|
| Chậm chốt giá sàn làm chậm term sheet | TB | Cao | Chốt trong T1–T2; dùng giá giả định 15.000đ/chu kỳ để đàm phán khung |
| MVNO pilot chậm tích hợp | TB | Cao | Sandbox sớm (T7), tài liệu API + bộ mẫu gọi API; chuẩn bị MVNO dự phòng |
| CP ngoại lệ cần SĐT để kích hoạt | Thấp | TB | Phương án chuyển tiếp số mã hoá bằng khoá công khai của CP |
| Lệch trạng thái MVNO – MBG | TB | TB | Ân hạn 7 ngày rồi tự thu hồi; đối soát ngày |
| CDR MVNO báo thiếu | TB | TB | Giá sàn A theo log MBG; đối soát chi tiết khi lệch >1%; quyền kiểm toán CDR |
| Ảnh hưởng luồng VinaPhone trên MBG | Thấp | Cao | Tách tài nguyên/hàng đợi theo tenant, circuit breaker, test chịu tải trước M3 |
| Rủi ro dữ liệu cá nhân | Thấp | Cao | Không lưu SĐT rõ; thoả thuận xử lý dữ liệu; đánh giá ATTT trước M2 |

## 8. Việc cần chốt

| # | Nội dung | Hạn | Chủ trì |
|---|---|---|---|
| 1 | Giá sàn từng gói, từng hình thức (hiện **giả định 15.000đ/chu kỳ**) | T2 | Đối soát/Tài chính |
| 2 | MVNO pilot (ưu tiên: Pottel, iTel, Wintel hoặc VNSKY) | T2 | KD/PT đối tác |
| 3 | Chỉ tiêu 6 tháng (mục 2.2 – đang là đề xuất) | T1 | PM |
| 4 | Thời gian phản hồi cam kết của API cấp quyền (đề xuất p95 ≤1 giây) | T3 | Trưởng nhóm MBG |
