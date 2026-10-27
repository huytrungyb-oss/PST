# Kế hoạch SMS bán Bảo hiểm TNDS xe máy + Chương trình khuyến mại tặng thẻ/data

> Ngày lập: 27/10/2026 · Phạm vi: tập thuê bao di động, kênh SMS Brandname (MT)
>
> Nguồn phương pháp (tìm trên GitHub):
> - **coreyhaines31/marketingskills** (~56,7k sao, repo kỹ năng marketing được dùng nhiều nhất GitHub): skill `sms` (cấu trúc tin, độ dài/segment, chuỗi tin, đo lường, A/B test) và skill `offers` (Value Equation, thiết kế ưu đãi, khan hiếm thật).
> - **bulksmswrl/sms-marketing-guide**: hướng dẫn mở về phân khúc, tự động hoá, mẫu tin.
> - **fbsamples/marketing_messages_measurement** (Meta): đo lượng chuyển đổi gia tăng (incremental) bằng nhóm đối chứng.
>
> Các nguyên tắc chung trên được điều chỉnh theo quy định Việt Nam (NĐ 91/2020 về tin nhắn rác, NĐ 81/2018 về khuyến mại, Luật Kinh doanh bảo hiểm 2022, NĐ 67/2023 về bảo hiểm bắt buộc). **Các chỗ đánh dấu ⚠️ cần pháp chế/doanh nghiệp bảo hiểm xác nhận trước khi chạy.**

---

## 1. Chẩn đoán chiến dịch hôm qua: 8.000 tin → 1.500 click → 0 đơn

CTR 18,75% là **rất cao** (benchmark SMS ~8–15%). Vậy nội dung đã gây chú ý; vấn đề nằm **sau cú click**. 0/1.500 không phải "tỉ lệ thấp" — là dấu hiệu **phễu bị gãy**. Kiểm tra theo thứ tự:

| # | Giả thuyết | Cách kiểm tra (trong hôm nay) | Nếu đúng thì sửa |
|---|---|---|---|
| 1 | **Click ảo** — trình quét link của nhà mạng/điện thoại/antivirus tự mở link | So *click link rút gọn* với *pageview thật* trên landing (GA4/log server); xem click có dồn vào vài giây sau khi gửi, user-agent lạ không | Chỉ tính unique click có pageview + thời gian trên trang > 3 giây |
| 2 | **Landing page lỗi/chậm trên 3G/4G** | Mở link trên điện thoại Android giá rẻ, mạng 4G; đo tốc độ (PageSpeed mobile) | Trang < 2 giây, 1 cột, nút mua thấy ngay không cần cuộn |
| 3 | **Form quá dài** (biển số, số khung, số máy, CCCD, email…) | Đếm số trường; xem tỉ lệ bắt đầu form → gửi form | Chỉ hỏi **biển số + tên chủ xe**; SĐT tự điền |
| 4 | **Thanh toán gây ma sát** (bắt buộc thẻ/ví, OTP ngân hàng) | Xem tỉ lệ vào trang thanh toán → thành công; log lỗi cổng thanh toán | **Trừ tiền tài khoản di động** (carrier billing) làm phương thức mặc định |
| 5 | **Thiếu lòng tin** — tin nhắn có nhãn (TB), link lạ, không thấy tên DN bảo hiểm | Hỏi 5–10 người trong tập đã click | Hiện rõ logo DN bảo hiểm được cấp phép, mẫu giấy chứng nhận, số CSKH |
| 6 | **Không có lý do mua ngay** — ai đã có BH còn hạn thì không mua | — | Nhắm đúng người *sắp hết hạn*/*chưa có*; thêm quà + hạn chót thật |

**Hai lỗi nằm ngay trong tin nhắn cũ:**

1. **Tin dài 4 tin (4 segment)**: có dấu tiếng Việt → mã hoá UCS-2 (70 ký tự/tin); tin cũ ~218 ký tự = **4 MT/thuê bao**, tức 8.000 thuê bao tốn ~32.000 MT. Viết **không dấu ≤160 ký tự** = 1 MT → **giảm ~75% chi phí**; nếu giữ có dấu cho tự nhiên (mục 6) thì rút gọn tin và đo xem đơn tăng có bù được cước.
2. **Nhãn (TB) cho tin quảng cáo**: theo NĐ 91/2020, tin quảng cáo phải có nhãn **QC**, gửi trong khung **7h–22h**, **tối đa 1 tin quảng cáo/thuê bao/24h** (cùng một chủ thể quảng cáo), và có **cách từ chối**. Gắn sai nhãn có thể bị nhà mạng chặn/phạt. ⚠️ Xác nhận lại cú pháp từ chối với nhà mạng.

**Việc cần làm trước khi gửi đợt mới** (nếu không, gửi thêm chỉ đốt tiền):

- [ ] Gắn tracking theo phễu: `click → pageview → nhập biển số → trang thanh toán → thanh toán thành công` (UTM: `utm_source=sms&utm_medium=sms&utm_campaign=<tên>&utm_content=<mã tin>`)
- [ ] Mua thử 3 lần trên 3 máy khác nhau, ghi lại từng bước bị vướng
- [ ] Bật carrier billing + tự điền SĐT (header enrichment khi vào bằng 3G/4G)
- [ ] Rút form còn biển số + tên chủ xe
- [ ] Thêm kênh **mua bằng cú pháp SMS** (soạn `BH <biển số>` gửi đầu số) — không cần web, ma sát thấp nhất

---

## 2. Phân khúc tệp khách hàng

Nguyên tắc: **mỗi tin phải xứng đáng làm phiền người nhận**. Phân khúc càng hẹp, nội dung càng đúng thì càng ít tin cần gửi.

| Mã | Tệp | Cách lọc (dữ liệu nhà mạng) | Mức ưu tiên | Thông điệp chính |
|---|---|---|---|---|
| **S1** | **1.500 người đã click hôm qua** | Danh sách click unique (loại click ảo) | ★★★★★ — nóng nhất | "Bạn chưa mua xong" + quà + bỏ ma sát |
| **S2** | Thuê bao **sắp hết hạn BH** (đã mua năm trước qua kênh mình) | Ngày mua + 11 tháng | ★★★★★ | Gia hạn sớm, nhắc ngày cụ thể |
| **S3** | **Tài xế công nghệ / giao hàng** | Dùng nhiều app Grab/Be/Xanh SM/Shopee Food/GHN, data cao, di chuyển nhiều cell trong ngày | ★★★★ | Giấy tờ bắt buộc khi chạy xe hằng ngày, quà data |
| **S4** | **Sinh viên, công nhân 18–30**, trả trước | Tuổi chủ thuê bao, khu công nghiệp/làng đại học, nạp thẻ thường xuyên | ★★★★ | Giá rẻ 66k, tặng thẻ cào/data |
| **S5** | **Người đi làm 25–45, trả sau/ARPU cao** | ARPU ≥ 150k, gói data tháng | ★★★ | Tiện, mua 3 năm khỏi lo, trừ cước |
| **S6** | **Người về quê dịp Tết** | Lịch sử di chuyển tỉnh khác dịp lễ năm trước, thuê bao ngoại tỉnh tại HN/HCM/BD/ĐN | ★★★★ (mùa Tết) | An tâm về quê, CSGT tăng kiểm tra |
| **S7** | Tệp rộng còn lại (7.000 người chưa click hôm qua) | — | ★★ | Chỉ gửi lại sau khi phễu đã sửa, dùng thông điệp khác |

**Loại khỏi mọi đợt:** người đã mua, người đã từ chối nhận QC, người đã nhận QC trong 24h, thuê bao không có data/không dùng smartphone (với tin có link — dùng tin cú pháp SMS thay thế).

**Nhóm đối chứng:** mỗi đợt giữ lại 10% tệp **không gửi** để đo doanh số gia tăng thật (phương pháp của fbsamples/marketing_messages_measurement).

---

## 3. Lịch gửi tin (8 tuần: 28/10/2026 – 22/12/2026, nối vào mùa Tết)

### Khung giờ

| Khung | Lý do | Dùng cho |
|---|---|---|
| **11h00–12h30** | Nghỉ trưa, cầm điện thoại | Tất cả tệp; flash sale trưa |
| **17h30–19h00** | Tan làm, vừa đi xe xong — liên tưởng tới xe máy | S3, S4, S5 |
| **20h00–21h30** | Thư giãn, có thời gian điền form/thanh toán | S1, S2 (tệp cần hoàn tất giao dịch) |
| Cuối tuần 9h00–11h00 | Rảnh, lên kế hoạch đi chơi/về quê | S6 |
| **Tránh** | Trước 8h, sau 21h30 (luật cho phép đến 22h nhưng dễ bị phản cảm), giờ cao điểm đang lái xe 7h–8h30 | — |

**Ngày trong tháng:** ưu tiên **ngày nhận lương** (1–5, 10, 25–30) và ngày nhà mạng có khuyến mại nạp thẻ.

### Lịch theo tuần

| Tuần | Ngày | Việc | Tệp | Tin (mục 6) |
|---|---|---|---|---|
| **0** | 28–30/10 | Sửa phễu (mục 1), test mua thử, setup carrier billing, đăng ký CTKM với Sở Công Thương | — | — |
| **1** | Thứ Bảy 31/10 20h | Retarget người đã click | S1 (chia A/B 50/50) | R1 vs K1 |
| | Thứ Hai 2/11 11h | Nhắc lần 2 cho ai chưa mua | S1 còn lại | R2 |
| | Thứ Tư 4/11 20h | Lần cuối, hạn chót thật | S1 còn lại | R3 |
| **2** | 5–7/11 | Gửi **pilot 2.000 thuê bao/tệp** để tìm tin thắng | S3, S4, S5 | D1, A2, A3 (mỗi tệp 2 biến thể) |
| **3** | 11–14/11 | Nhân rộng tin thắng ×5 quy mô | Tệp thắng ở tuần 2 | Biến thể thắng |
| | 12/11 12h | Flash sale trưa (200 suất thật) | S4 | F2 |
| **4** | 18–21/11 | Người đã mua → mời bạn bè | Khách đã mua | F1 |
| | | Gia hạn | S2 | G1 |
| **5–6** | 25/11–6/12 | Combo tai nạn người ngồi trên xe (upsell) | Khách đã mua TNDS + S5 | D2 |
| | | Gửi lại tệp rộng với tin mới | S7 | A1 |
| **7–8** | 9–22/12 | Mở chương trình Tết | S6, S3 | T2, T1 |

**Quy tắc tần suất:** mỗi thuê bao **tối đa 3 tin QC/chiến dịch** và **tối đa 1 tin/24h**; nếu ai đó nhận 3 tin mà không click → nghỉ 30 ngày.

---

## 4. Cách tối ưu tin nhắn

### 4.1 Cấu trúc 1 tin (theo skill `sms`)

```
(QC) [Móc câu 5 chữ đầu] [Lợi ích cụ thể + giá] [Quà] [1 CTA + 1 link] [Cách từ chối]
```

- **5 chữ đầu quyết định đọc tiếp hay không** — nêu đúng tình huống của người nhận ("Bạn đã xem…", "Tài xế công nghệ:", "BH xe máy của bạn sắp hết hạn…").
- **1 CTA, 1 link**. Không chèn số tổng đài tính phí 1.000đ/phút vào tin bán hàng — nó tạo cảm giác "bị tính tiền" và chiếm ký tự; để số CSKH trên landing page.
- **Độ dài:** có dấu = 67 ký tự/MT, không dấu = 153–160 ký tự/MT. Mục 6 ghi sẵn số ký tự và số MT của từng tin để tính cước.
- **Link rút gọn mang thương hiệu** (vd. `tenmien.vn/bh`) thay vì link lạ → tăng lòng tin, giảm bị lọc.
- **Nói lợi ích trước, nỗi sợ sau**: "phạt 300.000đ" là móc câu tốt nhưng người ta mua vì *dễ & rẻ & có quà*. Tin cũ đã có móc câu nhưng không có lý do mua *ngay*.

### 4.2 Value Equation (skill `offers`) áp vào BH xe máy

| Đòn bẩy | Hiện tại | Cải thiện |
|---|---|---|
| Kết quả mong muốn ↑ | "Có giấy chứng nhận" | "Yên tâm khi CSGT kiểm tra, cả năm không phải nghĩ" |
| Độ tin ↑ | Không rõ DN bảo hiểm | Tên DN bảo hiểm, mẫu chứng nhận, "hợp lệ khi xuất trình trên điện thoại" |
| Thời gian ↓ | "1 phút" | Giữ — đã tốt |
| Công sức ↓ | Form + thanh toán thẻ | **Chỉ biển số + trừ TK điện thoại**, hoặc soạn SMS |

### 4.3 Kế hoạch A/B test (mỗi lần chỉ đổi 1 yếu tố)

| Thứ tự | Biến | A | B | Chỉ số quyết định |
|---|---|---|---|---|
| 1 | Kênh mua | Link web (R1) | Cú pháp SMS (K1) | Đơn/1.000 tin |
| 2 | Quà | 3GB data | Thẻ cào 10.000đ | Đơn/1.000 tin, chi phí quà/đơn |
| 3 | Móc câu | Nỗi sợ phạt | Lợi ích/quà | CTR, đơn |
| 4 | Giờ gửi | 11h30 | 20h00 | Đơn/1.000 tin |
| 5 | Gói | 1 năm 66k | 3 năm 198k + quà lớn hơn | Doanh thu/1.000 tin |

Mỗi nhánh ≥ 2.000 thuê bao để kết quả có ý nghĩa. Chọn thắng theo **đơn hàng** (không theo click — bài học hôm qua).

### 4.4 KPI mục tiêu

| Chỉ số | Hôm qua | Mục tiêu sau sửa phễu |
|---|---|---|
| MT/thuê bao | 4 | **1** |
| CTR (unique, đã lọc ảo) | 18,75% (chưa lọc) | 8–12% |
| Click → đơn | 0% | **5–10%** |
| Đơn/1.000 thuê bao | 0 | **5–10** (tệp nóng S1/S2: 20–40) |
| Tỉ lệ từ chối QC | ? | < 1%/đợt |
| Chi phí (MT + quà)/đơn | ∞ | < biên lợi nhuận/đơn (xem 5.4) |

---

## 5. Chương trình khuyến mại: tặng thẻ điện thoại & data khi mua bảo hiểm

### ⚠️ 5.0 Kiểm tra pháp lý bắt buộc trước khi chạy

1. **BH TNDS xe máy là bảo hiểm bắt buộc, phí do Nhà nước quy định (NĐ 67/2023)**. Luật KDBH 2022 cấm DN/đại lý bảo hiểm cung cấp lợi ích ngoài hợp đồng trái quy định để lôi kéo khách. Quà tặng gắn trực tiếp với bảo hiểm bắt buộc **có thể bị coi là giảm phí trá hình**. → Cấu trúc an toàn hơn: **nhà mạng** (không phải DN bảo hiểm) là đơn vị khuyến mại, tặng data/thẻ cho **thuê bao dùng dịch vụ thanh toán/kênh số của nhà mạng**; hoặc gắn quà vào **sản phẩm tự nguyện** đi kèm (BH tai nạn người ngồi trên xe). Pháp chế và DN bảo hiểm phải xác nhận bằng văn bản.
2. **NĐ 81/2018**: giá trị quà tặng **không vượt 50% giá hàng hoá** (66.000đ → quà ≤ 33.000đ; gói 3 năm 198.000đ → quà ≤ 99.000đ). Chương trình **may rủi (quay số)** phải đăng ký với Sở Công Thương (một tỉnh) hoặc Bộ Công Thương (nhiều tỉnh); khuyến mại tặng quà phải **thông báo** trước.
3. Thể lệ công khai trên landing page: thời gian, đối tượng, số suất, cách nhận quà, thời hạn cộng quà.

### 5.1 Danh mục chương trình

| # | Tên chương trình | Cơ chế | Quà | Giới hạn | Tệp | Vì sao hiệu quả |
|---|---|---|---|---|---|---|
| **KM1** | **"Mua BH – Nhận 3GB"** (chương trình nền) | Mua TNDS xe máy 1 năm 66k qua kênh nhà mạng | Gói data 3GB/7 ngày, cộng tự động trong 5 phút | 1 lần/thuê bao | Mọi tệp | Chi phí thực của data với nhà mạng rất thấp, giá trị cảm nhận cao; cộng ngay → thưởng tức thì |
| **KM2** | **"3 năm khỏi lo – Tặng thẻ 50K"** | Mua gói 3 năm 198k | Thẻ cào/nạp thẳng 50.000đ (≤50% ✓) | — | S5, S2 | Tăng giá trị đơn ×3, giảm chi phí gửi tin gia hạn 2 năm sau |
| **KM3** | **"Trưa vàng 200 suất"** | 12h–13h ngày cố định, 200 đơn đầu | Nạp 20.000đ vào TK | 200 suất/ngày, hiển thị số suất còn lại thật | S4 | Khan hiếm **thật**, không bịa đếm ngược |
| **KM4** | **"Rủ bạn cùng an tâm"** | Mỗi khách có link giới thiệu; bạn mua qua link | Cả 2 nhận 2GB | Tối đa 5 bạn/người | Khách đã mua | Khách hàng tự lan toả, chi phí thấp hơn gửi tin |
| **KM5** | **"Gia hạn sớm"** | Gia hạn trước ngày hết hạn ≥ 7 ngày | 3GB + ưu tiên nhận chứng nhận năm mới ngay | — | S2 | Giữ chân khách, gửi đúng thời điểm có nhu cầu |
| **KM6** | **"Combo an tâm 2 lớp"** | TNDS + BH tai nạn người ngồi trên xe (tự nguyện) | Gói data 30 ngày (vd. 1GB/ngày) | — | Khách đã mua TNDS, S3, S5 | Quà gắn vào phần **tự nguyện** → ít rủi ro pháp lý hơn; tăng doanh thu/đơn |
| **KM7** | **"Vững tay lái – Về quê ăn Tết"** (15/12/2026–31/1/2027) | Mỗi đơn = 1 mã dự thưởng; quay số hằng tuần | Tuần: 10 thẻ 500k; Chung cuộc: 1 xe máy/điện thoại (tuỳ ngân sách) | Phải đăng ký CTKM may rủi | S6, S3 | Mùa cao điểm kiểm tra giao thông + nhu cầu về quê |

**Khuyến nghị khởi động:** chạy **KM1 + KM3** trước (đơn giản, dễ đo), test **data vs thẻ cào** ở tuần 2, thêm **KM4, KM5, KM6** từ tuần 4, **KM7** cho Tết.

### 5.2 Quy trình trao quà

1. Thanh toán thành công → hệ thống ghi nhận SĐT người mua.
2. Cộng data/nạp tiền **tự động trong 5 phút** (qua API nạp/cộng gói của nhà mạng).
3. Gửi MT xác nhận (C1) gồm: biển số, hiệu lực, link chứng nhận, xác nhận quà đã cộng.
4. Lỗi cộng quà → tự thử lại 3 lần, sau đó đẩy về CSKH xử lý trong 24h.

### 5.3 Chống gian lận

- 1 quà/biển số + 1 quà/thuê bao; không tính đơn đã hoàn/hủy.
- Giới hạn KM4: người được giới thiệu phải là thuê bao kích hoạt > 90 ngày.
- Theo dõi bất thường: nhiều đơn cùng biển số, cùng thiết bị, cùng IP.

### 5.4 Công thức kiểm tra hiệu quả kinh tế

```
Lợi nhuận/đơn = Hoa hồng/phí giữ lại trên 1 đơn − Chi phí quà − (Số MT gửi / Số đơn) × Giá 1 MT
Hoà vốn khi:  Đơn/1.000 thuê bao ≥ (1.000 × Giá 1 MT) / (Hoa hồng − Chi phí quà)
```

Ví dụ minh hoạ (thay số thật của mình): giá MT 700đ, hoa hồng 15.000đ/đơn, quà data chi phí thực 2.000đ → hoà vốn khi ≥ 54 đơn/1.000 tin… quá cao cho tệp lạnh. Vì vậy: **tệp lạnh chỉ đáng gửi khi đã sửa phễu và chỉ với gói giá trị cao (3 năm, combo)**; tệp nóng (S1, S2) thì hoà vốn dễ.

---

## 6. Bộ tin nhắn MT (tiếng Việt có dấu, giọng tự nhiên)

Quy ước: `[LINK]` = link rút gọn ~20 ký tự; `9xxx` = đầu số thật (⚠️ xác nhận cú pháp từ chối với nhà mạng). Ký tự và số MT đã tính cả link và câu từ chối.

**Cách viết:** nói như nhân viên nhắn cho khách quen: câu ngắn, xưng "bạn" và "bên mình", nêu một lý do cụ thể để mua bây giờ, không chất nhiều tính từ, không dùng chữ in hoa hay dấu chấm than liên tục.

**Lưu ý chi phí:** tin có dấu được tính 67 ký tự/MT (khi ghép tin), nên mỗi tin dưới đây tốn 3–5 MT thay vì 1. Nên A/B test bản có dấu với bản không dấu ngắn để xem phần tăng đơn có bù được phần tăng cước không.

### 6.1 Nhắc lại người đã bấm link hôm qua (S1)

| Mã | Nội dung | Ký tự | Số MT |
|---|---|---|---|
| **R1** | (QC) Hôm qua bạn có bấm xem bảo hiểm xe máy nhưng chưa mua xong. Nếu lúc đó bị vướng thì giờ đơn giản hơn rồi: chỉ cần nhập biển số, tiền trừ thẳng vào tài khoản điện thoại, 66.000đ dùng cả năm. Mua xong được tặng thêm 3GB data. Link đây: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 302 | 5 |
| **R2** | (QC) Nhắc bạn một chút: quà 3GB data khi mua bảo hiểm xe máy chỉ còn đến hết thứ Hai. Mua mất khoảng 2 phút, không cần số khung số máy, có biển số là được: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 219 | 4 |
| **R3** | (QC) Đây là tin cuối bên mình nhắc về chuyện này: 23h59 tối nay hết quà 3GB data khi mua bảo hiểm xe máy 66.000đ. Bạn cần thì bấm vào đây nhé: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 206 | 4 |
| **K1** | (QC) Không tiện vào web thì bạn mua bảo hiểm xe máy bằng tin nhắn cũng được. Soạn BH dấu cách biển số gửi 9xxx, ví dụ BH 29X112345. Phí 66.000đ trừ vào tài khoản, giấy chứng nhận gửi về máy, kèm 3GB data. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 247 | 4 |

### 6.2 Khách mới — chương trình nền KM1 / KM2

| Mã | Tệp | Nội dung | Ký tự | Số MT |
|---|---|---|---|---|
| **A1** | S7 | (QC) Đi xe máy mà không có bảo hiểm bắt buộc thì bị phạt 200.000–300.000đ, trong khi mua cả năm chỉ 66.000đ. Bạn mua ngay trên điện thoại, tầm 2 phút, tiền trừ vào tài khoản, giấy chứng nhận lưu luôn trong máy. Tháng này mua được tặng 3GB data: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 308 | 5 |
| **A2** | S4 | (QC) Ngày nào cũng chạy xe đi học, đi làm thì nhớ mang theo bảo hiểm xe máy nhé. 66.000đ dùng cả năm, mua trên điện thoại, tiền trừ vào tài khoản. Mua trong tuần này được tặng thêm 3GB data: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 254 | 4 |
| **A3** | S5 | (QC) Mua bảo hiểm xe máy một lần cho 3 năm, 198.000đ, khỏi phải nhớ gia hạn mỗi năm. Gói 3 năm được tặng thẻ nạp 50.000đ, tiền trừ thẳng vào tài khoản điện thoại: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 226 | 4 |
| **D1** | S3 | (QC) Anh chị chạy xe công nghệ hay giao hàng thì bị CSGT dừng xe là phải xuất trình bảo hiểm xe máy. Mua trên điện thoại 66.000đ/năm, giấy chứng nhận điện tử mở ra là có. Tặng thêm 3GB data để chạy app: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 266 | 4 |

### 6.3 Các chương trình KM3–KM7

| Mã | CT | Nội dung | Ký tự | Số MT |
|---|---|---|---|---|
| **F2** | KM3 | (QC) Trưa nay từ 12h đến 13h, 200 người mua bảo hiểm xe máy đầu tiên được nạp 20.000đ vào tài khoản. Bảo hiểm 66.000đ/năm, mua 2 phút là xong: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 206 | 4 |
| **F1** | KM4 | (QC) Cảm ơn bạn đã mua bảo hiểm xe máy. Bạn gửi link này cho bạn bè, người nhà, ai mua qua link thì cả hai người đều được 2GB data: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 195 | 3 |
| **G1** | KM5 | (QC) Bảo hiểm xe máy của xe [BIỂN SỐ] hết hạn ngày [DD/MM]. Bạn gia hạn từ bây giờ để không bị hở ngày nào, giá vẫn 66.000đ, được tặng thêm 3GB data: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 213 | 4 |
| **D2** | KM6 | (QC) Bảo hiểm bắt buộc chủ yếu đền cho người khác khi bạn gây tai nạn. Còn bạn và người ngồi sau thì cần thêm bảo hiểm tai nạn. Gói cả hai 96.000đ/năm, tặng data dùng 30 ngày: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 239 | 4 |
| **T2** | KM7 mở màn | (QC) Gần Tết CSGT kiểm tra giấy tờ nhiều hơn. Bạn xem lại bảo hiểm xe máy còn hạn không nhé. Hết rồi thì mua lại 66.000đ trên điện thoại, có giấy điện tử ngay, tặng 3GB data: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 238 | 4 |
| **T1** | KM7 quay số | (QC) Tết này chạy xe về quê thì mua bảo hiểm xe máy trước khi đi nhé. Mỗi đơn 66.000đ được một mã dự thưởng, tuần nào cũng quay 10 thẻ nạp 500.000đ: [LINK]. Không muốn nhận tin nữa, soạn TC gửi 9xxx. | 212 | 4 |

> Giá combo 96.000đ ở D2 là ví dụ — thay bằng biểu phí thật của BH tai nạn người ngồi trên xe.

### 6.4 Tin giao dịch sau khi mua (không phải QC, không cần nhãn/từ chối)

| Mã | Thời điểm | Nội dung | Ký tự | Số MT |
|---|---|---|---|---|
| **C1** | Ngay khi thanh toán xong | Bạn đã mua xong bảo hiểm xe máy cho xe [BIỂN SỐ], hiệu lực từ [ngày] đến [ngày]. Giấy chứng nhận điện tử ở đây: [LINK]. 3GB data đã được cộng vào tài khoản. Cần hỗ trợ thì gọi 19001557. | 198 | 3 |
| **C2** | 1 giờ sau | Mẹo nhỏ: bạn chụp màn hình giấy chứng nhận hoặc lưu link [LINK] lại. Khi CSGT kiểm tra chỉ cần mở trên điện thoại, không cần bản giấy. | 147 | 3 |

### 6.5 Tin trả lời khi khách soạn cú pháp (MO → MT)

| Khách soạn | Hệ thống trả lời |
|---|---|
| **`BH <biển số>`** | Bạn đang mua bảo hiểm xe máy 1 năm cho xe [BIỂN SỐ], phí 66.000đ trừ vào tài khoản. Đồng ý thì soạn Y gửi 9xxx trong vòng 10 phút. Không mua thì bạn cứ bỏ qua tin này. |
| **`Y`** | Tin C1 |
| **Sai cú pháp** | Tin nhắn chưa đúng cú pháp. Bạn soạn BH dấu cách biển số, ví dụ BH 29X112345, rồi gửi 9xxx. Cần hỗ trợ thì gọi 19001557. |
| **`TC`** | Bạn đã từ chối nhận tin quảng cáo từ [Brandname]. Từ giờ bên mình sẽ không gửi nữa. (Đồng thời loại số này khỏi mọi tệp ngay.) |

> Bước xác nhận `Y` là bắt buộc để tránh trừ tiền nhầm và khiếu nại.

---

## 7. Đo lường & báo cáo sau mỗi đợt

Báo cáo theo từng **mã tin** (utm_content = R1, A2…):

| Mã tin | Tệp | Gửi | MT | Click unique (đã lọc) | Pageview | Vào thanh toán | Đơn | Đơn/1.000 | Từ chối QC | Chi phí MT | Chi phí quà | Lợi nhuận |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

So sánh nhóm nhận tin với **nhóm đối chứng 10%** để biết bao nhiêu đơn là nhờ SMS thật.

**Quy tắc ra quyết định:** tin/tệp nào sau 2 đợt có Đơn/1.000 dưới ngưỡng hoà vốn → dừng; tin thắng → nhân rộng; nếu click cao nhưng đơn thấp → sửa landing/thanh toán, **không** sửa tin.

---

## 8. Checklist khởi động (tuần này)

- [ ] Lọc click ảo khỏi 1.500 click hôm qua, tạo tệp S1
- [ ] Mua thử 3 lần, sửa landing (≤2 giây, chỉ biển số, carrier billing)
- [ ] Mở cú pháp `BH <biển số>` + bước xác nhận `Y`
- [ ] Pháp chế + DN bảo hiểm xác nhận cấu trúc KM (mục 5.0); thông báo/đăng ký CTKM với Sở Công Thương
- [ ] Đổi nhãn tin thành (QC), thêm cú pháp từ chối, viết giọng tự nhiên, kiểm số MT mỗi tin
- [ ] Setup tracking phễu + nhóm đối chứng 10%
- [ ] Gửi R1 vs K1 cho S1 vào **20h00 thứ Bảy 31/10**
