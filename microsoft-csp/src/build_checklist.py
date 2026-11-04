"""Dựng file Excel checklist hồ sơ đăng ký đại lý Microsoft CSP. Cách dùng: python3 build_checklist.py <out.xlsx>"""
import sys
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule

OUT = sys.argv[1]
# Đã chốt / giả định (theo phản hồi 04/11/2026): đầu việc -> (trạng thái, ghi chú)
DONE = {
    'Rà soát Tập đoàn': ('Hoàn thành', 'Chưa có Partner ID: đăng ký mới cho VNPT-Media'),
    'Chốt tên miền': ('Hoàn thành', 'vnptmedia.vn'),
    'Chỉ định Primary contact': ('Đang làm', 'Đang dùng đầu mối giả định, cần chốt người cụ thể'),
}
FILLED = {
    1: 'Chưa có. Đăng ký mới',
    2: 'vnptmedia.vn',
    3: 'Giả định, cần chốt',
    4: 'Giả định, cần chốt',
    5: 'Anh Hưng (cần họ tên đầy đủ, chức danh)',
    6: 'Giả định, cần chốt',
    7: 'Giả định: 2-3 NPP lấy từ danh sách Indirect Provider trên Partner Center',
    8: '20/11/2026 (giả định)',
}
F = 'Times New Roman'
HDR = PatternFill('solid', fgColor='1F4E79')
GRP = PatternFill('solid', fgColor='DDEBF7')
thin = Side(style='thin', color='999999')
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical='top')
CEN = Alignment(wrap_text=True, vertical='top', horizontal='center')

TASKS = [
    ('Bước 0. Chủ trương nội bộ', [
        ('Trình Lãnh đạo Trung tâm phê duyệt chủ trương', 'Tờ trình 01 đã ký', 'KTND', date(2026, 11, 9), date(2026, 11, 20)),
        ('Rà soát Tập đoàn/VNPT-Media đã có Partner ID, tài khoản Partner Center chưa', 'Kết quả rà soát (có/không, Partner ID)', 'PTKD', date(2026, 11, 9), date(2026, 11, 13)),
        ('Xin ý kiến Ban Pháp chế Tổng Công ty', 'Văn bản ý kiến pháp chế', 'PTKD', date(2026, 11, 16), date(2026, 11, 27)),
        ('Xin giấy ủy quyền của VNPT-Media cho Giám đốc Trung tâm (đăng ký, chấp nhận thỏa thuận Microsoft, ký hợp đồng NPP)', 'Giấy ủy quyền', 'PTKD', date(2026, 11, 16), date(2026, 11, 30)),
        ('Kiểm tra ngành nghề mua bán phần mềm trên ĐKDN VNPT-Media (4651, 4741, 6201, 6209)', 'Bản ĐKDN, ghi chú mã ngành', 'PTKD', date(2026, 11, 9), date(2026, 11, 13)),
    ]),
    ('Bước 1. Tài khoản và hồ sơ pháp lý', [
        ('Chốt tên miền dùng cho tenant đối tác', 'Tên miền', 'VH', date(2026, 11, 23), date(2026, 11, 25)),
        ('Tạo tenant Microsoft Entra ID; tạo 2 tài khoản Global Admin', 'Tenant ID, danh sách admin', 'VH', date(2026, 11, 25), date(2026, 11, 30)),
        ('Bật MFA cho toàn bộ tài khoản quản trị', 'Ảnh chụp cấu hình MFA', 'VH', date(2026, 11, 25), date(2026, 11, 30)),
        ('Chỉ định Primary contact, security contact, đầu mối kế toán', 'Danh sách đầu mối', 'KTND', date(2026, 11, 23), date(2026, 11, 27)),
        ('Scan bộ hồ sơ pháp lý: ĐKDN, ủy quyền, giấy tờ người đại diện, xác nhận công tác người liên hệ', 'Thư mục hồ sơ scan', 'KTND', date(2026, 11, 30), date(2026, 12, 4)),
    ]),
    ('Bước 2. Microsoft AI Cloud Partner Program', [
        ('Đăng ký tại partner.microsoft.com bằng tài khoản Global Admin; khai thông tin pháp nhân khớp ĐKDN', 'Partner Global Account ID, Location Partner ID', 'KTND', date(2026, 12, 7), date(2026, 12, 9)),
        ('Chấp nhận Microsoft AI Cloud Partner Program Agreement', 'Trạng thái Agreement', 'KTND', date(2026, 12, 7), date(2026, 12, 9)),
        ('Hoàn tất xác minh email, nhân viên, pháp nhân (vetting)', 'Trạng thái Verification: Authorized', 'KTND', date(2026, 12, 9), date(2026, 12, 25)),
    ]),
    ('Bước 3. Nhà phân phối CSP', [
        ('Lấy danh sách Indirect Provider tại Việt Nam trên Partner Center', 'Danh sách NPP', 'KTND', date(2026, 11, 23), date(2026, 11, 27)),
        ('Gửi công văn đề nghị hợp tác tới 2-3 NPP', 'Công văn 02 đã phát hành', 'KTND', date(2026, 11, 30), date(2026, 12, 4)),
        ('So sánh điều kiện NPP (sheet So sánh NPP)', 'Bảng so sánh có điểm', 'KTND', date(2026, 12, 7), date(2026, 12, 15)),
        ('Đàm phán, trình ký hợp đồng đại lý với NPP được chọn', 'Hợp đồng đại lý', 'KTND', date(2026, 12, 15), date(2026, 12, 25)),
    ]),
    ('Bước 4. Đăng ký CSP Indirect Reseller', [
        ('Partner Center > Settings > Programs > CSP > Indirect reseller', 'Hồ sơ đăng ký đã nộp', 'KTND', date(2026, 12, 28), date(2026, 12, 30)),
        ('Chấp nhận Microsoft Partner Agreement; Legal info = Active', 'Trạng thái Active', 'KTND', date(2026, 12, 28), date(2027, 1, 5)),
        ('Chấp nhận lời mời quan hệ reseller từ NPP', 'Quan hệ NPP hiển thị trong Partner Center', 'KTND', date(2027, 1, 4), date(2027, 1, 8)),
        ('Kiểm tra Partner Center security score: không còn mục bắt buộc chưa đạt', 'Ảnh chụp security score', 'VH', date(2027, 1, 4), date(2027, 1, 8)),
    ]),
    ('Bước 5. Sản phẩm và quy trình B2B', [
        ('Chốt danh mục: M365 Business/E3/E5, Copilot; Windows, Office, Server bản vĩnh viễn', 'Danh mục sản phẩm', 'KTND', date(2027, 1, 4), date(2027, 1, 15)),
        ('Xây bảng giá bán, chính sách chiết khấu kênh; trình phê duyệt', 'Bảng giá đã duyệt', 'KTND', date(2027, 1, 11), date(2027, 1, 22)),
        ('Quy trình bán: báo giá, hợp đồng, tạo/liên kết tenant khách hàng (GDAP), đặt hàng, hóa đơn, gia hạn', 'Quy trình bán hàng', 'PTKD', date(2027, 1, 11), date(2027, 1, 22)),
        ('Đào tạo quy tắc New Commerce (cam kết tháng/năm, chỉ hủy trong 7 ngày)', 'Tài liệu đào tạo', 'KTND', date(2027, 1, 18), date(2027, 1, 29)),
        ('Thống nhất hạch toán, xuất hóa đơn, thuế, đối soát với NPP', 'Quy trình đối soát, hạch toán', 'KT', date(2027, 1, 11), date(2027, 1, 29)),
        ('Mở bán khách hàng tổ chức trên các kênh', 'Đơn hàng đầu tiên', 'PTKD', date(2027, 2, 1), date(2027, 2, 28)),
    ]),
    ('Bước 6. Kênh khách hàng cá nhân (B2C)', [
        ('Làm việc với NPP về hợp đồng ESD/bán lẻ M365 Personal, Family', 'Điều kiện ESD', 'PTKD', date(2027, 1, 11), date(2027, 2, 26)),
        ('Đề nghị Microsoft Việt Nam về chương trình hợp tác với nhà mạng (bán kèm gói cước, thu qua tài khoản viễn thông)', 'Biên bản làm việc', 'PTKD', date(2027, 1, 18), date(2027, 3, 15)),
        ('Kịch bản gói bán kèm, kênh bán (My VNPT, đại lý, tổng đài), quy trình cấp mã', 'Kịch bản kinh doanh B2C', 'KTND', date(2027, 2, 15), date(2027, 3, 31)),
    ]),
    ('Bước 7. Năng lực đối tác', [
        ('Thi chứng chỉ MS-900, MS-102, Copilot cho đội kỹ thuật/bán hàng', 'Danh sách chứng chỉ', 'PTSP', date(2027, 1, 4), date(2027, 4, 30)),
        ('Theo dõi điểm năng lực Solutions Partner for Modern Work (mục tiêu ≥ 70)', 'Điểm năng lực', 'KTND', date(2027, 3, 1), date(2027, 6, 30)),
        ('Cân nhắc mua gói Partner Success Core/Expanded', 'Đề xuất mua gói', 'KTND', date(2027, 2, 1), date(2027, 2, 28)),
    ]),
    ('Bước 8. Duy trì', [
        ('Gia hạn MAICPP hằng năm; đánh giá lại điều kiện CSP (doanh thu ≥ ~1.000 USD/12 tháng, bảo mật, vetting)', 'Trạng thái gia hạn', 'KTND', date(2027, 11, 1), date(2027, 12, 31)),
        ('Đối soát hằng tháng với NPP; báo cáo doanh thu', 'Biên bản đối soát tháng', 'TH', None, None),
    ]),
]


def hdr(ws, row, titles, widths):
    for i, (t, w) in enumerate(zip(titles, widths), 1):
        c = ws.cell(row, i, t)
        c.font = Font(name=F, bold=True, color='FFFFFF', size=11)
        c.fill = HDR; c.alignment = CEN; c.border = BOX
        ws.column_dimensions[c.column_letter].width = w


wb = Workbook()
ws = wb.active
ws.title = 'Checklist'
ws['A1'] = 'CHECKLIST ĐĂNG KÝ ĐẠI LÝ CHÍNH THỨC MICROSOFT (CSP INDIRECT RESELLER)'
ws['A1'].font = Font(name=F, bold=True, size=14)
ws['A2'] = 'Pháp nhân: Tổng Công ty Truyền thông (VNPT-Media); đơn vị vận hành: VNPT VAS. Ngày dự kiến là đề xuất, chỉnh theo thực tế.'
ws['A2'].font = Font(name=F, italic=True, size=10)
titles = ['STT', 'Đầu việc', 'Hồ sơ / đầu ra', 'Đơn vị chủ trì', 'Người phụ trách', 'Bắt đầu', 'Hạn', 'Trạng thái', 'Ghi chú']
hdr(ws, 4, titles, [6, 62, 34, 12, 18, 12, 12, 15, 30])
r = 5
first = r
for group, items in TASKS:
    ws.cell(r, 1, group).font = Font(name=F, bold=True)
    for col in range(1, 10):
        ws.cell(r, col).fill = GRP; ws.cell(r, col).border = BOX
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=9)
    r += 1
    for i, (task, out, unit, s, e) in enumerate(items, 1):
        st, note = next((v for k, v in DONE.items() if task.startswith(k)), ('Chưa bắt đầu', ''))
        vals = [f'{group.split(".")[0].split()[1]}.{i}', task, out, unit, '', s, e, st, note]
        for col, v in enumerate(vals, 1):
            c = ws.cell(r, col, v)
            c.font = Font(name=F, size=11); c.border = BOX
            c.alignment = CEN if col in (1, 4, 6, 7, 8) else WRAP
            if col in (6, 7) and v:
                c.number_format = 'dd/mm/yyyy'
        if s is None:
            ws.cell(r, 6, 'Hằng tháng'); ws.cell(r, 7, 'Hằng tháng')
        r += 1
last = r - 1
dv = DataValidation(type='list', formula1='"Chưa bắt đầu,Đang làm,Hoàn thành,Vướng mắc"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f'H{first}:H{last}')
rng = f'H{first}:H{last}'
ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"Hoàn thành"'], fill=PatternFill('solid', fgColor='C6EFCE')))
ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"Đang làm"'], fill=PatternFill('solid', fgColor='FFEB9C')))
ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"Vướng mắc"'], fill=PatternFill('solid', fgColor='FFC7CE')))
# Tổng hợp tiến độ
r += 1
ws.cell(r, 2, 'TỔNG HỢP TIẾN ĐỘ').font = Font(name=F, bold=True)
for k, st in enumerate(['Chưa bắt đầu', 'Đang làm', 'Hoàn thành', 'Vướng mắc'], 1):
    ws.cell(r + k, 2, st).font = Font(name=F)
    c = ws.cell(r + k, 3, f'=COUNTIF({rng},B{r + k})'); c.font = Font(name=F)
ws.cell(r + 5, 2, 'Tỷ lệ hoàn thành').font = Font(name=F, bold=True)
c = ws.cell(r + 5, 3, f'=IFERROR(C{r + 3}/COUNTA({rng}),0)'); c.number_format = '0%'; c.font = Font(name=F, bold=True)
ws.freeze_panes = 'C5'

# Sheet so sánh NPP
s2 = wb.create_sheet('So sánh NPP')
s2['A1'] = 'SO SÁNH NHÀ PHÂN PHỐI CSP (chấm điểm 1-5, trọng số tổng 100%)'
s2['A1'].font = Font(name=F, bold=True, size=13)
hdr(s2, 3, ['Tiêu chí', 'Trọng số', 'NPP A', 'NPP B', 'NPP C', 'Ghi chú'], [52, 10, 12, 12, 12, 40])
crit = [
    ('Chiết khấu / biên lợi nhuận Microsoft 365, Copilot', 0.20),
    ('Chiết khấu bản quyền vĩnh viễn (Windows, Office, Server)', 0.10),
    ('Có kênh ESD/bán lẻ cho gói cá nhân (B2C)', 0.15),
    ('Hạn mức công nợ, điều kiện bảo lãnh', 0.15),
    ('Kỳ thanh toán, đồng tiền, hóa đơn, xử lý thuế', 0.10),
    ('Cổng đặt hàng, API tích hợp hệ thống VNPT', 0.10),
    ('Hỗ trợ kỹ thuật cấp 2, đào tạo, chứng chỉ', 0.10),
    ('Hỗ trợ marketing, ưu đãi Microsoft chuyển cho đại lý', 0.10),
]
for i, (name, w) in enumerate(crit, 4):
    s2.cell(i, 1, name); s2.cell(i, 2, w).number_format = '0%'
    for col in range(1, 7):
        s2.cell(i, col).font = Font(name=F); s2.cell(i, col).border = BOX
        s2.cell(i, col).alignment = WRAP if col in (1, 6) else CEN
t = 4 + len(crit)
s2.cell(t, 1, 'Tổng trọng số / Điểm có trọng số').font = Font(name=F, bold=True)
c = s2.cell(t, 2, f'=SUM(B4:B{t - 1})'); c.number_format = '0%'; c.font = Font(name=F, bold=True)
for col in 'CDE':
    c = s2[f'{col}{t}']; c.value = f'=SUMPRODUCT($B$4:$B${t - 1},{col}4:{col}{t - 1})'
    c.number_format = '0.00'; c.font = Font(name=F, bold=True)
for col in range(1, 7):
    s2.cell(t, col).border = BOX; s2.cell(t, col).fill = GRP
dv2 = DataValidation(type='whole', operator='between', formula1='1', formula2='5', allow_blank=True)
s2.add_data_validation(dv2); dv2.add(f'C4:E{t - 1}')

# Sheet thông tin cần bổ sung
s3 = wb.create_sheet('Cần bổ sung')
s3['A1'] = 'THÔNG TIN CẦN ANH/CHỊ CUNG CẤP'
s3['A1'].font = Font(name=F, bold=True, size=13)
hdr(s3, 3, ['STT', 'Thông tin', 'Dùng cho', 'Giá trị'], [6, 55, 40, 40])
need = [
    ('VNPT/VNPT-Media đã có Partner ID chưa?', 'Bước 0, quyết định đăng ký mới hay thêm location'),
    ('Tên miền dùng cho tenant đối tác', 'Bước 1'),
    ('Họ tên, email 2 Global Admin', 'Bước 1, 2, 4'),
    ('Primary contact, security contact, đầu mối kế toán', 'Bước 1, 4'),
    ('Người ký công văn gửi NPP (chức danh, họ tên)', 'Công văn 02'),
    ('Đầu mối liên hệ ghi trong công văn (họ tên, điện thoại, email)', 'Công văn 02'),
    ('Danh sách NPP dự kiến gửi công văn', 'Bước 3'),
    ('Hạn phản hồi đề nghị NPP', 'Công văn 02'),
]
for i, (a, b) in enumerate(need, 4):
    for col, v in enumerate([i - 3, a, b, FILLED.get(i - 3, '')], 1):
        c = s3.cell(i, col, v); c.font = Font(name=F); c.border = BOX
        c.alignment = CEN if col == 1 else WRAP

wb.save(OUT)
print('saved', OUT)
