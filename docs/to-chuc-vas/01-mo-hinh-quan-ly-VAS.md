# Mô hình quản lý khối dịch vụ VAS (12 nhân sự, 3 nhóm)

> Phạm vi: Bundle · Game · Thông tin giải trí · Video · SMS MO/MT subscription\
> Quy mô: 7 nhân sự hiện có + 5 nhân sự tiếp nhận = 12 người, dưới 1 trưởng phòng.\
> Giữ nguyên 3 nhóm hiện có của phòng: **Phát triển dịch vụ mới · Quản lý dịch vụ · Thanh toán & quản lý hợp đồng**. Các chức năng kỹ thuật, CSKH/khiếu nại, kinh doanh/kênh bán, pháp chế, kế toán do đơn vị khác đảm nhiệm — phòng giữ vai trò **chủ dịch vụ, đặt yêu cầu và giám sát**.

---

## 1. Khuyến nghị tóm tắt (đọc phần này là đủ)

1. **Giữ nguyên 3 nhóm, không lập thêm nhóm mới.** Toàn bộ dịch vụ tiếp nhận được "cắm" vào đúng 3 dòng việc sẵn có.
2. **Phân bổ 12 người theo khối lượng việc, không chia đều:**

| Nhóm | Số người | Lý do |
|---|---|---|
| **1. Quản lý dịch vụ** | **6** | Nhận thêm cả 5 cụm dịch vụ đang chạy — khối lượng tăng nhiều nhất, là nơi giữ doanh thu hằng ngày |
| **2. Phát triển dịch vụ mới** | **3** | Mảng VAS đang bão hòa, cần ít dịch vụ mới nhưng chắc; làm theo dự án |
| **3. Thanh toán & quản lý hợp đồng** | **3** | Số hợp đồng CP và kỳ đối soát tăng theo số dịch vụ tiếp nhận; là vị trí "chạm tiền" |

3. **Mỗi dịch vụ đang chạy có đúng 1 người quản lý chính và 1 người dự phòng** — không dịch vụ nào "vô chủ" hay phụ thuộc 1 người.
4. **Quy định rõ điểm bàn giao giữa 3 nhóm** (mục 4) và **đầu mối với từng đơn vị ngoài phòng** (mục 5) — đây là chỗ dễ rơi việc nhất khi các chức năng khác không nằm trong phòng.

---

## 2. Sơ đồ tổ chức đề xuất

**TRƯỞNG PHÒNG** điều hành trực tiếp 3 trưởng nhóm:

| 1. QUẢN LÝ DỊCH VỤ (6) | 2. PHÁT TRIỂN DỊCH VỤ MỚI (3) | 3. THANH TOÁN & QUẢN LÝ HỢP ĐỒNG (3) |
|---|---|---|
| **QL1** Trưởng nhóm + quản lý DV **Bundle** | **PT1** Trưởng nhóm: nghiên cứu thị trường, lộ trình dịch vụ mới, thẩm định ý tưởng | **TT1** Trưởng nhóm: ký mới, gia hạn, phụ lục, thanh lý hợp đồng CP/đối tác |
| **QL2** Quản lý DV **SMS MO/MT subscription** | **PT2** Triển khai DV mới nhóm Bundle/Video/Game (KBDV, UAT, công văn) | **TT2** Đối soát doanh thu chia sẻ với CP/đối tác |
| **QL3** Quản lý DV **Thông tin giải trí** | **PT3** Triển khai DV mới nhóm SMS/nội dung; thẩm định hồ sơ CP mới | **TT3** Thanh toán, theo dõi công nợ, lưu trữ hồ sơ chứng từ |
| **QL4** Quản lý DV **Video** | | |
| **QL5** Quản lý DV **Game** | | |
| **QL6** Số liệu & kiểm soát chất lượng: báo cáo doanh thu, kiểm tra kịch bản CP, đầu mối nhận khiếu nại từ CSKH | | |

### Ghi chú về nhóm Quản lý dịch vụ

- SMS MO/MT sub và Thông tin giải trí tách 2 người vì đây là mảng **nhiều mã dịch vụ, nhiều CP, rủi ro khiếu nại "bị trừ tiền" và tin nhắn rác cao nhất**. Nếu số lượng dịch vụ ít, gộp QL2 + QL3 làm một và chuyển 1 người sang nhóm Phát triển hoặc Thanh toán.
- QL6 là "con mắt" chung của nhóm: mỗi sáng gửi số liệu, phát hiện bất thường, tổng hợp khiếu nại do CSKH chuyển sang. Không có vị trí này, 5 người quản lý dịch vụ sẽ mỗi người làm báo cáo một kiểu.
- Nếu sau khi có số liệu, một dịch vụ chiếm >40% doanh thu, cân nhắc cho trưởng nhóm thôi kiêm dịch vụ đó để tập trung điều phối.

---

## 3. Bố trí 7 người cũ và 5 người mới

**Nguyên tắc:** người cũ giữ trưởng nhóm và các vị trí cần quan hệ/kinh nghiệm của phòng; người mới được xếp theo **chính dịch vụ họ mang theo**.

| Tình huống | Cách bố trí |
|---|---|
| 5 người mới **đi kèm các dịch vụ được chuyển về** (thường gặp) | Xếp phần lớn vào **nhóm Quản lý dịch vụ**, mỗi người tiếp tục quản lý đúng dịch vụ đã làm (QL2–QL5). Người cũ của phòng làm **dự phòng** cho các dịch vụ đó để học dần. 1 người mới từng làm đối soát/hợp đồng → nhóm Thanh toán. |
| 5 người mới **không có kinh nghiệm dịch vụ cụ thể** | Người cũ đảm nhận QL1–QL3, TT1–TT2, PT1. Người mới vào QL4–QL6, PT2/PT3, TT3, mỗi người có 1 người cũ kèm cặp trong 60 ngày. |

Luôn giữ: **3 trưởng nhóm là người cũ** (hiểu quy trình của phòng); **TT2 (đối soát)** là người cẩn thận nhất; **không nhóm nào toàn người mới hoặc toàn người cũ**.

### Ma trận dự phòng chéo

| Dịch vụ / việc | Người chính | Dự phòng |
|---|---|---|
| Bundle | QL1 | PT2 |
| SMS MO/MT sub | QL2 | QL3 |
| Thông tin giải trí | QL3 | QL2 |
| Video | QL4 | QL5 |
| Game | QL5 | QL4 |
| Số liệu & kiểm soát chất lượng | QL6 | TT2 |
| Hợp đồng | TT1 | TT3 |
| Đối soát | TT2 | TT1 |
| Thanh toán, công nợ | TT3 | TT2 |

---

## 4. Điểm bàn giao giữa 3 nhóm — vòng đời một dịch vụ

| Giai đoạn | Ý tưởng → Thẩm định | Ký hợp đồng | Triển khai | Ra mắt (kèm 1–3 tháng) | Vận hành → Đánh giá → Dừng |
|---|---|---|---|---|---|
| **Nhóm chủ trì** | Phát triển | Thanh toán & HĐ | Phát triển | Phát triển → Quản lý DV | Quản lý DV |

Nhóm Thanh toán & HĐ phụ trách hợp đồng, đối soát, thanh toán **suốt vòng đời** dịch vụ.

| Mốc | Nhóm giao | Nhóm nhận | Điều kiện bàn giao |
|---|---|---|---|
| Có CP/đối tác cho DV mới | Phát triển | Thanh toán & HĐ | Hồ sơ CP đã thẩm định, phương án chia sẻ doanh thu đã duyệt |
| Hợp đồng ký xong | Thanh toán & HĐ | Phát triển | Hợp đồng/phụ lục có hiệu lực, đã lưu hồ sơ |
| **Ra mắt dịch vụ** | Phát triển | Quản lý DV | **Giai đoạn kèm 1–3 tháng:** Phát triển vẫn chịu trách nhiệm cùng; bàn giao hẳn khi dịch vụ chạy ổn định, có biên bản (mô tả DV, kịch bản, đầu mối kỹ thuật, chỉ tiêu) |
| Hằng tháng | Quản lý DV | Thanh toán & HĐ | Số liệu doanh thu/sản lượng chốt kỳ, xác nhận các khoản hoàn tiền/giảm trừ |
| Quyết định dừng dịch vụ | Quản lý DV đề xuất, Trưởng phòng duyệt | Thanh toán & HĐ | Thanh lý hợp đồng, đối soát kỳ cuối, chốt công nợ |

---

## 5. Phối hợp với đơn vị ngoài phòng

Phòng **không làm thay** các đơn vị này, nhưng **phải là bên đặt yêu cầu, theo dõi và chịu trách nhiệm kết quả cuối** đối với dịch vụ của mình. Mỗi đơn vị có **1 đầu mối cố định** trong phòng.

| Đơn vị ngoài phòng | Họ làm | Phòng làm | Đầu mối trong phòng |
|---|---|---|---|
| **Kỹ thuật / vận hành hệ thống** (SDP, tính cước, đầu số) | Cấu hình, giám sát hệ thống, khắc phục sự cố | Báo sự cố, xác nhận ảnh hưởng doanh thu, nghiệm thu sau khắc phục, yêu cầu cấu hình DV mới | QL6 (sự cố chung), người quản lý từng DV |
| **CSKH / tổng đài** | Tiếp nhận và trả lời khiếu nại, hoàn tiền theo quy trình | Cung cấp kịch bản trả lời, xác minh nguyên nhân, xử lý gốc rễ với CP, theo dõi tỷ lệ khiếu nại | QL6 |
| **Kinh doanh / Marketing / kênh bán** | Chương trình bán hàng, khuyến mại, truyền thông | Đề xuất gói/chương trình, cung cấp thông tin DV, duyệt nội dung đúng kịch bản | Người quản lý từng DV; PT1 cho DV mới |
| **Pháp chế** | Rà soát hợp đồng, tư vấn tuân thủ | Gửi hồ sơ, tiếp thu ý kiến, cập nhật quy định mới cho nhóm | TT1 |
| **Tài chính – Kế toán** | Hạch toán, chi trả, hóa đơn | Lập hồ sơ thanh toán, đối chiếu công nợ | TT3 |
| **Đơn vị cấp trên / nhà mạng** | Phê duyệt dịch vụ, chính sách | Công văn, KBDV, báo cáo định kỳ | PT2/PT3 (DV mới), QL6 (báo cáo) |

> Nên thống nhất bằng văn bản (biên bản phối hợp hoặc quy chế) với Kỹ thuật và CSKH: thời gian phản hồi sự cố, khiếu nại; ai được quyết định tạm dừng dịch vụ khi có sự cố trừ cước sai.

---

## 6. Ai làm gì — bảng RACI

R = Người làm · **A = Người chịu trách nhiệm cuối (chỉ 1)** · C = Được hỏi ý kiến · I = Được thông báo · *Ngoài* = đơn vị ngoài phòng

| Công việc | Trưởng phòng | Quản lý DV | Phát triển | Thanh toán & HĐ | Ngoài phòng |
|---|---|---|---|---|---|
| Kế hoạch doanh thu năm/quý | **A** | R | C | C | I |
| Nghiên cứu, đề xuất DV mới | A (duyệt) | C | **R** | C | C (Kinh doanh) |
| Thẩm định CP/đối tác mới | A (duyệt) | C | **R** | R | C (Pháp chế) |
| Ký/gia hạn/thanh lý hợp đồng | **A** (ký) | C | C | R | C (Pháp chế) |
| Triển khai DV mới (KBDV, UAT, công văn) | I | C | **A**/R | I | R (Kỹ thuật) |
| Quản lý doanh thu, thuê bao DV đang chạy | I | **A**/R | I | I | — |
| Kiểm tra kịch bản, tuân thủ của CP | I | **A**/R (QL6) | C | C | C (Pháp chế) |
| Xử lý sự cố trừ cước sai | I (ngay) | **A** (điều phối) | I | C | R (Kỹ thuật) |
| Khiếu nại, hoàn tiền | I | **A** (xử lý gốc rễ) | I | C | R (CSKH) |
| Chương trình khuyến mại cho DV | I | **A**/C | I | I | R (Kinh doanh) |
| Đối soát doanh thu chia sẻ | I | C (cấp số liệu) | I | **A**/R (TT2) | — |
| Thanh toán CP, theo dõi công nợ | A (ký) | I | I | **R** (TT3) | R (Kế toán) |
| Báo cáo doanh thu tuần/tháng | I | **A**/R (QL6) | I | C | I |
| Đề xuất dừng DV yếu kém | **A** | R | C | C | I |

---

## 7. KPI theo vị trí (gợi ý — 3 chỉ số/người là đủ)

| Vị trí | KPI 1 | KPI 2 | KPI 3 |
|---|---|---|---|
| Trưởng phòng | Doanh thu toàn khối so kế hoạch | Tỷ lệ khiếu nại toàn khối | Không có vi phạm bị cơ quan quản lý xử lý |
| QL1 Trưởng nhóm Quản lý DV | Doanh thu nhóm DV đang chạy so kế hoạch | Doanh thu Bundle | Báo cáo/đề xuất danh mục đúng hạn |
| QL2–QL5 Quản lý từng DV | Doanh thu DV so kế hoạch | Thuê bao active & tỷ lệ hủy (churn) | Tỷ lệ khiếu nại của DV |
| QL6 Số liệu & chất lượng | Báo cáo đúng hạn, chính xác | Số CP/kịch bản kiểm tra mỗi tháng | Số bất thường phát hiện trước khi bị phản ánh |
| PT1 Trưởng nhóm Phát triển | Doanh thu từ DV mới (12 tháng đầu) | Số DV mới ra mắt đúng kế hoạch | Tỷ lệ DV mới đạt chỉ tiêu sau 6 tháng |
| PT2, PT3 Triển khai DV mới | % dự án đúng hạn | Hồ sơ (KBDV, công văn) đạt ngay lần đầu | Lỗi phát sinh sau ra mắt |
| TT1 Trưởng nhóm Thanh toán & HĐ | % hợp đồng còn hiệu lực, đủ hồ sơ | Không có hợp đồng hết hạn mà DV vẫn chạy | Thời gian ký hợp đồng/phụ lục |
| TT2 Đối soát | Chênh lệch đối soát < 1% | Đối soát xong đúng hạn | Số kỳ đối soát còn treo |
| TT3 Thanh toán & công nợ | Thanh toán đúng hạn | 0 sai sót chi trả | Công nợ quá hạn giảm |

**Định nghĩa nhanh:** *Churn* = số thuê bao hủy trong tháng ÷ số thuê bao đầu tháng. *ARPU* = doanh thu ÷ số thuê bao bình quân.

---

## 8. Nhịp vận hành (lịch họp & báo cáo)

| Tần suất | Việc | Người tham gia | Thời lượng | Đầu ra |
|---|---|---|---|---|
| Hằng ngày | Bảng số liệu: doanh thu, đăng ký/hủy, khiếu nại hôm qua | QL6 gửi, cả phòng xem | 0 phút họp | Cảnh báo nếu lệch >15% so với trung bình 7 ngày |
| Hằng tuần (thứ Hai) | Giao ban phòng | Trưởng phòng + 3 trưởng nhóm | 30 phút | 3 việc ưu tiên/nhóm, rủi ro cần quyết |
| Hằng tuần | Họp nội bộ từng nhóm | Trưởng nhóm + thành viên | 30 phút | Phân việc tuần |
| Hằng tháng | Rà soát danh mục dịch vụ | Trưởng phòng + nhóm Quản lý DV + TT2 | 90 phút | Mỗi DV: Đầu tư / Duy trì / Thử nghiệm / Dừng |
| Hằng tháng | Họp phối hợp với Kỹ thuật & CSKH | QL6 + quản lý DV liên quan | 30–60 phút | Sự cố, khiếu nại lặp lại, việc tồn |
| Hằng tháng | 1:1 với từng trưởng nhóm | Trưởng phòng + từng trưởng nhóm | 30 phút | Con người, vướng mắc |
| Hằng quý | Rà soát KPI & kế hoạch quý sau | Cả phòng | Nửa ngày | Kế hoạch quý, điều chỉnh phân công |

### Cách xếp loại danh mục dịch vụ hằng tháng

|  | Doanh thu đang tăng | Doanh thu đang giảm |
|---|---|---|
| **Doanh thu lớn** | **Đầu tư** – đề xuất khuyến mại, kênh bán với Kinh doanh | **Duy trì/tối ưu** – giữ chân thuê bao, đàm phán lại tỷ lệ chia sẻ |
| **Doanh thu nhỏ** | **Thử nghiệm có kiểm soát** – đặt mốc 3 tháng | **Dừng** – kế hoạch đóng DV an toàn, thanh lý hợp đồng |

> Dịch vụ nào có **khiếu nại tăng cùng lúc doanh thu tăng đột biến** → kiểm tra ngay, thường là dấu hiệu đăng ký ngoài ý muốn của thuê bao.

---

## 9. Rủi ro lớn nhất và cách phòng

| Rủi ro | Dấu hiệu | Cách phòng |
|---|---|---|
| Mất kiến thức khi tiếp nhận | Không ai biết đầu mối, mật khẩu, lịch sử sự cố của DV mới về | Checklist bàn giao bắt buộc (Phần II), ký biên bản từng DV |
| Rơi việc ở ranh giới với đơn vị ngoài phòng | Sự cố/khiếu nại "đá bóng" qua lại, không ai chốt | Đầu mối cố định (mục 5), biên bản phối hợp có thời hạn phản hồi |
| Khiếu nại "bị trừ tiền", tin nhắn rác | Khiếu nại tăng, cơ quan quản lý phản ánh | QL6 kiểm tra kịch bản CP hằng tháng; tuân thủ Nghị định 91/2020/NĐ-CP và văn bản sửa đổi (nhờ pháp chế xác nhận bản hiện hành) |
| DV mới "bỏ rơi" sau ra mắt | Phát triển chuyển sang dự án khác, Quản lý DV chưa nắm | Giai đoạn kèm 1–3 tháng và biên bản bàn giao (mục 4) |
| Hợp đồng hết hạn nhưng DV vẫn chạy / thất thoát đối soát | Không có phụ lục, chênh lệch số liệu kéo dài | TT1 lập lịch hợp đồng sắp hết hạn trước 90 ngày; TT2 đối soát tháng, ngưỡng cảnh báo 1% |
| Xung đột người cũ – người mới | Hai "phe", giấu thông tin | Ghép cặp dự phòng cũ–mới, mục tiêu chung của phòng |
| Trưởng phòng quá tải | Phải trả lời mọi câu hỏi | Ủy quyền rõ cho 3 trưởng nhóm; trưởng phòng chỉ quyết các việc cột "A" của mình ở mục 6 |

---

## 10. Dữ liệu cần thu thập để chốt mô hình

Gửi danh sách này cho bên bàn giao và nhóm hiện tại, hạn 2 tuần:

1. Danh sách toàn bộ dịch vụ: tên, mã dịch vụ, đầu số, gói cước, giá, đối tác CP, ngày ra mắt.
2. Doanh thu, thuê bao active, đăng ký mới, hủy theo **từng dịch vụ, từng tháng, 12 tháng gần nhất**.
3. Số khiếu nại & số tiền hoàn theo từng dịch vụ, 12 tháng.
4. Danh sách hợp đồng CP: thời hạn, tỷ lệ chia sẻ, tình trạng đối soát/công nợ.
5. Đầu mối kỹ thuật, CSKH, kinh doanh đang hỗ trợ từng dịch vụ.
6. Hồ sơ 12 nhân sự: kinh nghiệm, dịch vụ đang làm, điểm mạnh, nguyện vọng (dùng bảng năng lực trong file Excel đi kèm).

Khi có dữ liệu, có thể gọi agent `vas-revenue-analyst` để phân tích và `vas-org-advisor` để điều chỉnh mô hình (xem `HUONG-DAN-DUNG-AGENT.md`).
