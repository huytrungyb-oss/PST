# Lộ trình VNPT VAS trở thành đại lý chính thức của Microsoft

Phương án đã chốt:

| Hạng mục | Lựa chọn |
|---|---|
| Pháp nhân | **Tổng Công ty Truyền thông (VNPT-Media)**. **Đã có tài khoản đối tác Microsoft** (hiện trên danh bạ Find Partners của Microsoft), giả định do **Ban CNTT Tổng Công ty** quản trị. VNPT VAS vận hành theo ủy quyền, **không đăng ký đối tác mới** |
| Mô hình | **CSP Indirect Reseller** (mua qua nhà phân phối CSP tại Việt Nam). Chỉ lên Direct Bill khi đủ ngưỡng doanh thu |
| Sản phẩm | Microsoft 365 / Copilot (thuê bao); Windows, Office bản vĩnh viễn; gói cá nhân B2C |

> Số liệu và điều kiện chương trình Microsoft lấy theo Microsoft Learn / Partner Center tại thời điểm 11/2026. Microsoft điều chỉnh chương trình theo năm tài chính (bắt đầu 01/7), cần kiểm tra lại trong Partner Center trước khi nộp.

## Điều kiện Microsoft đang áp dụng (FY26)

**Indirect Reseller** (mô hình chọn):
- Có tài khoản Microsoft AI Cloud Partner Program (MAICPP) đã xác minh (vetting) đầy đủ; quốc gia của Location Partner ID là Việt Nam.
- Người khởi tạo đăng ký phải có quyền **Global Admin** trên tenant đối tác; chấp nhận **Microsoft Partner Agreement (MPA)**.
- Bảo mật bắt buộc trong Partner Center: bật **MFA** cho toàn bộ tài khoản quản trị; khai báo **đầu mối an ninh (security contact)**.
- Có quan hệ đã chấp nhận với ít nhất một **nhà phân phối CSP (Indirect Provider)** tại Việt Nam. Không có nhà phân phối thì không đặt hàng được.
- Duy trì doanh thu tối thiểu khoảng **1.000 USD trong 12 tháng gần nhất** ở cấp tenant reseller; đánh giá lại hằng năm.

**Direct Bill** (để tham chiếu khi mở rộng): ≥ **1 triệu USD** doanh thu CSP Direct Bill 12 tháng gần nhất ở cấp Partner Global Account, có ít nhất 1 **Solutions Partner designation**, đạt yêu cầu bảo mật, có năng lực hỗ trợ và tự động hóa thanh toán. Không đạt thì chuyển về Indirect và chờ 1 năm mới đăng ký lại.

**Lưu ý quan trọng về B2C:** chương trình CSP chỉ bán cho **khách hàng tổ chức** (có tenant doanh nghiệp). Gói cá nhân (Microsoft 365 Personal/Family) không đi qua CSP mà qua kênh **bán lẻ / phân phối điện tử (ESD)** của nhà phân phối, hoặc thỏa thuận hợp tác riêng với Microsoft cho nhà mạng. Đây là hồ sơ riêng, xử lý ở Bước 6.

## Các bước chi tiết

### Bước 0. Chủ trương nội bộ (tuần 1-2)
1. Trình Lãnh đạo Trung tâm phê duyệt chủ trương (**[01-To-trinh-chu-truong-Microsoft-CSP.docx](01-To-trinh-chu-truong-Microsoft-CSP.docx)**).
2. ~~Rà soát Partner ID~~: **VNPT-Media đã có** tài khoản đối tác Microsoft (danh bạ Find Partners trên marketplace.microsoft.com hiện "TỔNG CÔNG TY TRUYỀN THÔNG - Chi nhánh Tập đoàn Bưu chính Viễn thông Việt Nam").
3. Xin ý kiến Ban Pháp chế Tổng Công ty và giấy ủy quyền của VNPT-Media cho Giám đốc Trung tâm: kinh doanh bản quyền Microsoft nhân danh Tổng Công ty, ký hợp đồng với nhà phân phối.
4. Kiểm tra ngành nghề trên Giấy chứng nhận ĐKDN của VNPT-Media có hoạt động mua bán phần mềm (ví dụ 4651, 4741, 6201, 6209). Thiếu thì bổ sung.

### Bước 1. Rà soát tài khoản đối tác với Ban CNTT (tuần 1-3)
Đơn vị quản trị đang **giả định là Ban CNTT Tổng Công ty**, cần xác nhận trước.
1. Xác định người giữ quyền **Global Admin** của tài khoản Partner Center.
2. Lấy **Partner Global Account (PGA) ID**, **Location Partner ID**, trạng thái xác minh (phải là Authorized).
3. **Địa điểm đăng ký phải là Việt Nam.** Danh bạ đang hiện "United States"; có thể do bộ lọc tìm kiếm, nhưng nếu hồ sơ thật sự khai Mỹ thì phải thêm/sửa location Việt Nam, vì CSP chỉ giao dịch được ở nước trùng với location.
4. Xem **Settings → Programs**: đã có CSP chưa, mô hình nào (Indirect Reseller hay Direct Bill), đang liên kết nhà phân phối nào.
5. Bảo mật: MFA cho tài khoản quản trị, security contact, Partner Center security score không còn mục bắt buộc chưa đạt.
6. Đề nghị Ban CNTT cấp tài khoản Partner Center cho VNPT VAS với vai trò **Sales agent** (đặt hàng) và **Admin agent** (quản trị khách hàng), bật MFA.

### Bước 2. Tư cách CSP (tuần 3-5)
- **Nếu đã là Indirect Reseller:** chỉ xác nhận trạng thái Active và ngưỡng doanh thu khoảng 1.000 USD/12 tháng; chuyển sang Bước 3.
- **Nếu chưa:** Global Admin vào Settings → Programs → Cloud Solution Provider → **Indirect reseller**, chấp nhận **Microsoft Partner Agreement**, kiểm tra Legal info = **Active**. Không phải tạo tài khoản hay xác minh pháp nhân lại.

### Bước 3. Nhà phân phối CSP (tuần 3-7)
1. **Nếu VNPT-Media đã có nhà phân phối:** đánh giá điều kiện hiện tại (chiết khấu, công nợ, danh mục) rồi quyết định dùng tiếp hay bổ sung.
2. **Nếu cần nhà phân phối mới:** lấy danh sách Indirect Provider tại Việt Nam trong Partner Center; gửi công văn đề nghị hợp tác (**[02-Cong-van-de-nghi-hop-tac-NPP.docx](02-Cong-van-de-nghi-hop-tac-NPP.docx)**) tới 2-3 nhà phân phối để so sánh.
3. Tiêu chí so sánh: chiết khấu/biên lợi nhuận theo nhóm sản phẩm; hạn mức công nợ, điều kiện bảo lãnh; kỳ thanh toán, đồng tiền (VND/USD); có danh mục bản quyền vĩnh viễn và kênh ESD cho B2C không; cổng đặt hàng và API tích hợp; hỗ trợ kỹ thuật, đào tạo; xử lý thuế (GTGT, thuế nhà thầu nước ngoài do nhà phân phối chịu).
4. Ký hợp đồng đại lý; chấp nhận lời mời quan hệ reseller trên Partner Center.

### Bước 4. Sẵn sàng giao dịch (tuần 7-8)
1. Đặt thử một đơn hàng nội bộ qua nhà phân phối trên Partner Center để kiểm tra quyền, giá, hóa đơn.

### Bước 5. Danh mục sản phẩm, giá và quy trình bán B2B (tuần 7-9)
1. Danh mục: Microsoft 365 Business Basic/Standard/Premium, Apps for business, E3/E5, Copilot; bản quyền vĩnh viễn (Windows 11 Pro nâng cấp, Office LTSC, Windows Server, SQL Server) theo danh mục "Software" của CSP.
2. Nắm quy tắc **New Commerce (NCE)**: cam kết tháng/năm/3 năm; chỉ hủy hoặc giảm số lượng trong 7 ngày đầu; giá cam kết năm thấp hơn tháng.
3. Quản trị tenant khách hàng qua **GDAP** (quyền quản trị phân quyền theo thời hạn), không dùng quyền quản trị toàn phần.
4. Xây bảng giá bán VNPT VAS, chính sách chiết khấu cho kênh bán của VNPT, quy trình: báo giá → hợp đồng/đơn hàng → tạo tenant hoặc liên kết tenant khách → đặt hàng qua nhà phân phối → xuất hóa đơn → gia hạn.
5. Thống nhất với P.KT: hạch toán, xuất hóa đơn, đối soát công nợ hằng tháng với nhà phân phối.

### Bước 6. Kênh B2C (tuần 7-12, hồ sơ riêng)
1. Làm việc với nhà phân phối về hợp đồng **ESD/bán lẻ** gói Microsoft 365 Personal/Family (mã kích hoạt điện tử).
2. Nếu muốn bán kèm gói cước/Data và thu qua tài khoản viễn thông: đề nghị Microsoft Việt Nam (qua nhà phân phối hoặc đầu mối đối tác) về chương trình hợp tác với nhà mạng. Đây là thỏa thuận thương mại riêng, chưa có mẫu chuẩn.
3. Khi có thỏa thuận, xây kịch bản gói, kênh bán (My VNPT, đại lý, tổng đài) và quy trình cấp mã.

### Bước 7. Năng lực và quyền lợi đối tác (tháng 2-6)
1. Đào tạo, thi chứng chỉ cho đội kỹ thuật/bán hàng (MS-900, MS-102, chứng chỉ Copilot) để tích điểm năng lực.
2. Mục tiêu **Solutions Partner for Modern Work** (điểm năng lực ≥ 70/100: số khách hàng, khách hàng tăng mới, kỹ năng, triển khai sử dụng). Đây là điều kiện để nhận ưu đãi và là bậc cần để lên Direct Bill sau này.
3. Cân nhắc mua gói quyền lợi đối tác (Partner Success Core/Expanded) để có bản quyền nội bộ, hỗ trợ kỹ thuật.
4. Chỉ dùng logo/huy hiệu Microsoft theo hướng dẫn thương hiệu đối tác.

### Bước 8. Vận hành và duy trì
1. Phối hợp Ban CNTT gia hạn MAICPP hằng năm; đánh giá lại điều kiện CSP hằng năm (doanh thu tối thiểu, bảo mật, vetting).
2. Đối soát hằng tháng với nhà phân phối; báo cáo doanh thu Lãnh đạo Trung tâm.
3. Tuân thủ quy định chống tham nhũng của Microsoft khi bán cho khách hàng khối nhà nước (VNPT là doanh nghiệp nhà nước nên hồ sơ có thể bị rà soát kỹ hơn).

## Những việc cần anh/chị cung cấp hoặc tự thực hiện

Các bước sau phải do người có thẩm quyền làm trực tiếp, không làm thay được:
- Làm việc với Ban CNTT để rà soát tài khoản đối tác và xin cấp quyền Partner Center (em không truy cập được).
- Xin ủy quyền VNPT-Media, ký hợp đồng với nhà phân phối.
- Đã chốt: VNPT-Media đã có tài khoản đối tác Microsoft (không đăng ký mới); tên miền `vnptmedia.vn`; người ký công văn: anh Hưng.
- Đang dùng giả định, cần chốt trước khi phát hành: đơn vị quản trị tài khoản đối tác (Ban CNTT); họ tên đầy đủ và chức danh anh Hưng; đầu mối liên hệ, Global Admin, security contact; danh sách nhà phân phối nhận công văn; hạn phản hồi 20/11/2026; số văn bản.

## Bộ hồ sơ trong thư mục

| File | Nội dung |
|---|---|
| `01-To-trinh-chu-truong-Microsoft-CSP.docx` | Tờ trình xin chủ trương (kèm PL01 mô hình, PL02 lộ trình, PL03 RACI) |
| `02-Cong-van-de-nghi-hop-tac-NPP.docx` | Công văn đề nghị hợp tác gửi nhà phân phối CSP |
| `03-Checklist-ho-so-Microsoft-CSP.xlsx` | Bảng theo dõi từng bước, hồ sơ, người phụ trách, hạn, trạng thái |

## Nguồn tham khảo
- [Enroll as an indirect reseller – Microsoft Learn](https://learn.microsoft.com/en-us/partner-center/enroll/enroll-as-indirect-reseller)
- [CSP authorization requirements – Microsoft](https://partner.microsoft.com/en-pr/partnership/cloud-solution-provider-requirements)
- [Direct bill eligibility requirements – Microsoft Learn](https://learn.microsoft.com/en-us/partner-center/enroll/direct-bill-eligibility-requirements)
- [Indirect reseller tasks in Partner Center – Microsoft Learn](https://learn.microsoft.com/en-us/partner-center/indirect-reseller-tasks-in-partner-center)
- [CSP overview – Microsoft Learn](https://learn.microsoft.com/partner-center/enroll/csp-overview)
