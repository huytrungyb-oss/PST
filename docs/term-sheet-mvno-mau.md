# TERM SHEET (BẢN ĐIỀU KHOẢN CHÍNH) – MẪU

## Hợp tác cung cấp nội dung số bán buôn qua VNPT Content Hub

*Phiên bản: mẫu 01 · Ngày: [...] · Tình trạng: **không ràng buộc pháp lý**, trừ các mục Bảo mật thông tin (mục 13) và Luật áp dụng (mục 15)*

---

## 1. Các bên

| | Bên A – Bên cung cấp | Bên B – Bên phân phối |
|---|---|---|
| Tên | Tổng Công ty Truyền thông (VNPT-Media) | [Tên MVNO] |
| Địa chỉ | [...] | [...] |
| Mã số thuế | [...] | [...] |
| Đại diện | [Họ tên, chức vụ] | [Họ tên, chức vụ] |
| Giấy phép viễn thông | – | [Số giấy phép, ngày cấp] |

## 2. Đối tượng hợp tác

2.1. Bên A cung cấp cho Bên B quyền **phân phối bán buôn các gói nội dung số** (danh mục tại Phụ lục 1) tới thuê bao di động của Bên B, theo 2 hình thức:
- **Theo chu kỳ:** quyền sử dụng nội dung trong một chu kỳ (ngày/tuần/tháng/năm);
- **Theo lượt:** quyền sử dụng nội dung một lần (một mã, một đường dẫn, một kết quả).

2.2. **Bên B tự bán, tự định giá bán lẻ và tự trừ cước** trên hệ thống tính cước của Bên B. Bên A **không** trừ cước, không cộng dung lượng data, không gửi tin nhắn tới thuê bao của Bên B.

2.3. Bên B được tự kết hợp gói nội dung với gói cước/data của Bên B, dưới thương hiệu của Bên B, theo quy định tại mục 11.

## 3. Phân vai trách nhiệm

| Nội dung | Bên A (VNPT-Media) | Bên B (MVNO) |
|---|---|---|
| Danh mục, mô tả gói, tài liệu truyền thông | Cung cấp | Sử dụng, bản địa hoá theo thương hiệu |
| Bán hàng, kênh đăng ký | – | Chịu trách nhiệm |
| Trừ cước, hoá đơn với thuê bao | – | Chịu trách nhiệm |
| Gia hạn chu kỳ, thử lại khi thiếu tiền | – | Chịu trách nhiệm; gọi API gia hạn khi trừ cước thành công |
| Cấp/gia hạn/thu hồi quyền lợi nội dung | Chịu trách nhiệm (qua nền tảng MBG và CP) | Gọi API theo đặc tả |
| Tin nhắn tới thuê bao | Trả nội dung cần gửi (license, đường dẫn, hướng dẫn) | Gửi bằng đầu số/brandname của Bên B |
| CSKH | Tuyến 2 (lỗi quyền lợi nội dung) | Tuyến 1 (toàn bộ yêu cầu của thuê bao) |
| Hoàn cước khi cấp quyền lỗi | Trả mã lỗi chuẩn; loại giao dịch khỏi đối soát | Hoàn cước cho thuê bao theo quy định của Bên B |
| Hợp đồng với nhà cung cấp nội dung (CP) | Chịu trách nhiệm, bảo đảm quyền phân phối | – |
| Đối soát | Cung cấp log cấp quyền | Cung cấp CDR/doanh thu theo gói |

## 4. Giá và phương thức tính tiền

4.1. Mỗi kỳ đối soát (tháng dương lịch), với từng gói, Bên B thanh toán cho Bên A:

```
Số tiền phải trả = MAX( A ; B )

A = Giá sàn của gói × Số chu kỳ (hoặc số lượt) cấp quyền thành công
    theo log của nền tảng MBG trong kỳ
B = 70% × Doanh thu của gói theo CDR/đối soát của Bên B trong kỳ
```

4.2. **Giá sàn** theo từng gói, từng hình thức quy định tại **Phụ lục 2**. Bên A có quyền điều chỉnh giá sàn, thông báo trước [30] ngày; điều chỉnh không áp dụng cho các chu kỳ đã cấp.

4.3. **Doanh thu** tại phần B là doanh thu Bên B thu từ thuê bao cho gói nội dung [trước/sau] thuế GTGT [...], sau khi trừ các khoản hoàn cước do lỗi của Bên A. Trường hợp Bên B kết hợp gói nội dung với gói cước khác, tỷ lệ phân bổ doanh thu cho phần nội dung là [...]% giá gói kết hợp hoặc theo cách thức thống nhất tại Phụ lục 2.

4.4. Giao dịch cấp quyền lỗi (Bên A trả mã lỗi) **không** được tính vào A và B.

4.5. Giá chưa bao gồm thuế GTGT. Đồng tiền thanh toán: VNĐ.

## 5. Đối soát, hoá đơn, thanh toán

| Bước | Thời hạn (đề xuất) | Bên thực hiện |
|---|---|---|
| Gửi số liệu log cấp quyền (A) | Ngày [5] tháng kế tiếp | Bên A |
| Gửi CDR/doanh thu theo gói (B) | Ngày [5] tháng kế tiếp | Bên B |
| So khớp, lập biên bản đối soát | Ngày [10] | Hai bên |
| Xác nhận biên bản | Trong [5] ngày làm việc kể từ khi nhận; quá hạn không phản hồi coi như chấp nhận số liệu của bên gửi | Hai bên |
| Xuất hoá đơn | Sau khi ký biên bản | Bên A |
| Thanh toán | Trong [15] ngày kể từ ngày nhận hoá đơn hợp lệ | Bên B |

5.1. **Ngưỡng lệch 1%:** nếu chênh lệch số lượng chu kỳ/lượt giữa log MBG và CDR Bên B **vượt 1%**, hai bên đối soát chi tiết theo từng mã giao dịch (`txn_id`). Trong thời gian đối soát chi tiết, phần không tranh chấp vẫn được thanh toán đúng hạn.

5.2. **Quyền kiểm toán CDR:** Bên A có quyền yêu cầu kiểm tra CDR liên quan đến gói nội dung tối đa [1] lần/năm (hoặc khi lệch >1% trong [2] kỳ liên tiếp), báo trước [10] ngày làm việc. Chi phí do Bên A chịu, trừ khi phát hiện Bên B báo thiếu trên [...]%.

5.3. Chậm thanh toán: lãi chậm trả [...]%/tháng trên số tiền chậm trả; quá [60] ngày Bên A được tạm ngừng cấp quyền mới sau khi báo trước [10] ngày.

## 6. Kỹ thuật

6.1. Kết nối qua **API v1** của Bên A: `activate`, `renew`, `deactivate`, `grant_once`, `query` và webhook; giao thức HTTPS, xác thực [OAuth2/mTLS]; đặc tả tại Phụ lục 3.

6.2. **Định danh thuê bao bằng `sub_token`:** Bên B không gửi số điện thoại dạng rõ. `sub_token = HMAC-SHA256(khoá bí mật của Bên B, số điện thoại chuẩn hoá)`. Khoá do Bên B quản lý; quy trình thay khoá theo Phụ lục 3.

6.3. **Idempotency:** mỗi giao dịch có `txn_id` duy nhất do Bên B sinh; gọi lại cùng `txn_id` không phát sinh cấp quyền mới.

6.4. **Ân hạn 7 ngày:** quyền theo chu kỳ hết hiệu lực tại `expire_at`. Nếu không nhận được lệnh `renew` trong vòng **7 ngày** sau `expire_at`, Bên A tự thu hồi quyền.

6.5. Bên A cung cấp môi trường sandbox; hai bên nghiệm thu (UAT) trước khi đưa vào khai thác.

## 7. Chất lượng dịch vụ (SLA) và phạt

| Chỉ tiêu | Cam kết của Bên A (đề xuất) |
|---|---|
| Độ sẵn sàng API/tháng | ≥ [99,5]% (không tính bảo trì có báo trước [48] giờ) |
| Thời gian phản hồi API (p95) | ≤ [1] giây |
| Tỷ lệ cấp quyền thành công | ≥ [99]% |
| Phản hồi sự cố P1 / P2 / P3 | [15 phút] / [30 phút] / [4 giờ] |

7.1. Không đạt độ sẵn sàng cam kết: giảm trừ [...]% số tiền phải trả của kỳ, tối đa [...]%.
7.2. Bên B cam kết gọi API đúng đặc tả, đúng giới hạn tần suất; Bên A không chịu trách nhiệm với lỗi do Bên B gọi sai đặc tả.
7.3. Tổng mức phạt trong một kỳ không vượt quá [8]% giá trị phần nghĩa vụ bị vi phạm (theo quy định pháp luật thương mại hiện hành – Pháp chế xác nhận).

## 8. Dữ liệu cá nhân

8.1. `sub_token` là **dữ liệu đã được bút danh hoá**, vẫn được xem là dữ liệu cá nhân và được bảo vệ theo quy định pháp luật về bảo vệ dữ liệu cá nhân.
8.2. Bên A không thu thập, không lưu số điện thoại dạng rõ; không tìm cách khôi phục số điện thoại từ `sub_token`.
8.3. Bên B chịu trách nhiệm thu thập sự đồng ý của thuê bao cho việc cung cấp dịch vụ nội dung.
8.4. Hai bên ký **Thoả thuận xử lý dữ liệu cá nhân** (Phụ lục 4): mục đích, phạm vi, thời hạn lưu trữ [...], biện pháp bảo vệ, thông báo vi phạm trong [72] giờ.
8.5. Trường hợp ngoại lệ một CP cần số điện thoại để kích hoạt: Bên B gửi số điện thoại được mã hoá bằng khoá công khai của CP đó; Bên A chỉ chuyển tiếp, không giải mã.

## 9. CSKH và khiếu nại

9.1. Bên B tiếp nhận mọi khiếu nại của thuê bao (tuyến 1), tra cứu qua API `query`.
9.2. Lỗi quyền lợi nội dung chuyển Bên A (tuyến 2): phản hồi trong [8] giờ làm việc, xử lý trong [24] giờ.
9.3. **Hoàn cước:** khi Bên A trả mã lỗi hoặc xác nhận lỗi cấp quyền do Bên A/CP, Bên B hoàn cước cho thuê bao; giao dịch đó được loại khỏi A và B. Trường hợp Bên B đã hoàn cước do lỗi của Bên A đối với giao dịch đã tính tiền, số tiền tương ứng được bù trừ ở kỳ đối soát kế tiếp.
9.4. Hai bên cung cấp đầu mối CSKH, kỹ thuật, đối soát (Phụ lục 5).

## 10. Nghĩa vụ về nội dung

10.1. Bên A bảo đảm có đủ quyền phân phối nội dung qua Bên B và nội dung tuân thủ pháp luật.
10.2. Bên A thông báo trước [30] ngày khi ngừng cung cấp một nội dung/gói; quyền đang hiệu lực được duy trì đến hết chu kỳ hoặc phương án thay thế thống nhất.

## 11. Quảng cáo, thương hiệu

11.1. Bên B bán gói dưới thương hiệu của Bên B; được sử dụng tên, logo của nội dung/CP theo bộ nhận diện do Bên A cung cấp.
11.2. Nội dung quảng cáo, tin nhắn giới thiệu tới thuê bao do Bên B thực hiện, tuân thủ quy định về quảng cáo và tin nhắn; tài liệu có sử dụng thương hiệu nội dung gửi Bên A xác nhận trong [3] ngày làm việc.
11.3. Không bên nào được sử dụng thương hiệu của bên kia ngoài phạm vi hợp tác.

## 12. Thời hạn và chấm dứt

12.1. Thời hạn: [01] năm kể từ ngày ký hợp đồng chính thức; tự động gia hạn [01] năm nếu không bên nào thông báo chấm dứt trước [60] ngày.
12.2. Chấm dứt trước hạn: theo thoả thuận; hoặc một bên vi phạm nghiêm trọng không khắc phục trong [30] ngày kể từ khi nhận thông báo; hoặc một bên mất giấy phép kinh doanh liên quan.
12.3. Khi chấm dứt: Bên B ngừng bán gói mới; quyền đang hiệu lực được duy trì đến hết chu kỳ đã trả tiền [hoặc phương án khác]; hai bên hoàn tất đối soát và thanh toán trong [30] ngày.

## 13. Bảo mật thông tin *(có hiệu lực ràng buộc từ khi ký term sheet)*

Hai bên giữ bí mật nội dung term sheet, thông tin giá, số liệu đối soát, tài liệu kỹ thuật và khoá bảo mật; không tiết lộ cho bên thứ ba khi chưa có chấp thuận bằng văn bản, trừ theo yêu cầu của cơ quan nhà nước có thẩm quyền. Nghĩa vụ kéo dài [02] năm sau khi chấm dứt.

## 14. Bước tiếp theo

| Việc | Thời hạn |
|---|---|
| Ký term sheet | [...] |
| Bên A cung cấp đặc tả API v1 và sandbox | [...] |
| Hoàn thiện, ký hợp đồng chính thức và các phụ lục | [...] |
| UAT, đưa vào khai thác | [...] |

## 15. Luật áp dụng và giải quyết tranh chấp *(có hiệu lực ràng buộc)*

Pháp luật Việt Nam. Tranh chấp được giải quyết bằng thương lượng trong [30] ngày; không thành thì đưa ra [Toà án nhân dân có thẩm quyền tại Hà Nội / Trung tâm Trọng tài Quốc tế Việt Nam (VIAC)].

---

## Phụ lục

**Phụ lục 1 – Danh mục gói nội dung**

| Mã gói (Bên A) | Nội dung / CP | Hình thức | Chu kỳ | Quyền lợi | Cách kích hoạt |
|---|---|---|---|---|---|
| [...] | iCallme Premium | Theo chu kỳ | Tháng | [...] | License |
| [...] | vnStudy | Theo chu kỳ | Ngày/Tháng/Năm | [...] | License/tài khoản |
| [...] | [...] | Theo lượt | – | [...] | Mã/đường dẫn dùng 1 lần |

**Phụ lục 2 – Bảng giá sàn** *(để trống, chốt trước khi ký; giá minh hoạ là giả định)*

| Mã gói | Hình thức | Giá sàn A (VNĐ, chưa VAT) | Tỷ lệ phần B | Phân bổ doanh thu khi kết hợp gói |
|---|---|---|---|---|
| [...] | Theo chu kỳ (tháng) | [...] *(giả định minh hoạ: 15.000/chu kỳ)* | 70% | [...] |
| [...] | Theo lượt | [...] | 70% | [...] |

**Phụ lục 3 – Đặc tả API v1, chuẩn `sub_token`, quy trình thay khoá, mẫu file đối soát**

**Phụ lục 4 – Thoả thuận xử lý dữ liệu cá nhân**

**Phụ lục 5 – Đầu mối liên hệ (CSKH, kỹ thuật, đối soát, pháp chế)**

---

> **Ghi chú:** Đây là bản mẫu nội bộ. **Cần Pháp chế VNPT-Media rà soát** (đặc biệt mức phạt, lãi chậm trả, điều khoản dữ liệu cá nhân, cơ quan giải quyết tranh chấp) **trước khi gửi đối tác.**
