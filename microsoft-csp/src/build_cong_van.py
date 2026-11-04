"""Dựng công văn đề nghị hợp tác gửi nhà phân phối CSP, dùng khung tờ trình của đơn vị rồi đổi thể thức sang công văn.

Cách dùng: python3 build_cong_van.py <build_to_trinh.py> <out.docx>
"""
import copy, os, subprocess, sys, tempfile
import docx
from docx.oxml.ns import qn

BUILDER, OUT = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
GD = '[GIẢ ĐỊNH — cần xác nhận]'

CONTENT = r'''
META = {
    'so': 'Số:        /VNPT VAS-KTND',
    'ngay': 'Hà Nội, ngày      tháng 11 năm 2026',
    'trich_yeu': 'x', 'kinh_trinh': 'x',
    'noi_nhan': ['- Như trên;', '- BGĐ VNPT VAS (để b/c);', '- P.PTKD, P.KT (ph/h);', '- Lưu: TH, KTND.', '', ''],
    'title': 'Công văn đề nghị hợp tác phân phối bản quyền Microsoft',
}
# ==== BODY ====
pa('Trung tâm Dịch vụ Số cá nhân (VNPT VAS) thuộc Tổng Công ty Truyền thông (VNPT-Media), Tập đoàn Bưu chính Viễn thông Việt Nam, gửi lời chào trân trọng tới Quý Công ty.')
pa('VNPT VAS đang triển khai kinh doanh bản quyền phần mềm Microsoft cho khách hàng doanh nghiệp, hộ kinh doanh, cơ quan tổ chức và khách hàng cá nhân trên hệ thống kênh bán của VNPT. Tổng Công ty Truyền thông đăng ký tham gia chương trình Microsoft AI Cloud Partner Program và Cloud Solution Provider (CSP) với vai trò đại lý (Indirect Reseller); VNPT VAS là đơn vị vận hành theo ủy quyền của Tổng Công ty.')
pa('Được biết Quý Công ty là nhà phân phối CSP (Indirect Provider) được Microsoft công nhận tại Việt Nam, VNPT VAS đề nghị Quý Công ty xem xét hợp tác với các nội dung sau:')
h1('1. Tiếp nhận Tổng Công ty Truyền thông là đại lý CSP của Quý Công ty')
bl('Gửi lời mời thiết lập quan hệ đại lý trên Partner Center sau khi VNPT-Media hoàn tất đăng ký Indirect Reseller;')
bl('Cung cấp mẫu hợp đồng đại lý và danh mục hồ sơ Quý Công ty yêu cầu.')
h1('2. Cung cấp thông tin chính sách hợp tác')
bl('Danh mục sản phẩm và chính sách giá, chiết khấu theo từng nhóm: Microsoft 365, Copilot; bản quyền vĩnh viễn Windows, Office, Windows Server, SQL Server; Microsoft 365 cho khách hàng cá nhân qua kênh phân phối điện tử (nếu có);')
bl('Hạn mức công nợ, điều kiện bảo lãnh, thời hạn thanh toán, đồng tiền thanh toán và hóa đơn;')
bl('Quy trình đặt hàng, cổng đặt hàng và khả năng kết nối API với hệ thống bán hàng của VNPT;')
bl('Chính sách hỗ trợ kỹ thuật, đào tạo, chứng chỉ, tài liệu bán hàng và các chương trình ưu đãi của Microsoft dành cho đại lý.')
h1('3. Bố trí buổi làm việc')
pa('Đề nghị Quý Công ty bố trí buổi làm việc với VNPT VAS để trao đổi chi tiết. Thông tin phản hồi đề nghị gửi trước ngày ..../..../2026 ' + GD + '.')
pa('Đầu mối liên hệ: Ông/Bà ......................, Phòng Khai thác nội dung, điện thoại: ...................., email: .................... ' + GD + '.')
pa('Trân trọng cảm ơn sự hợp tác của Quý Công ty./.')
A(sig_tbl)
'''


def set_text(p, text, bold=None):
    runs = p.runs
    if not runs:
        p.add_run(text)
        return
    runs[0].text = text
    if bold is not None:
        runs[0].bold = bold
    for r in runs[1:]:
        r._r.getparent().remove(r._r)


with tempfile.TemporaryDirectory() as td:
    cpath = os.path.join(td, 'c.py')
    open(cpath, 'w', encoding='utf8').write(CONTENT.replace('# ==== BODY ====', '# ==== BODY ====\nGD = %r' % GD))
    tmp = os.path.join(td, 'cv.docx')
    subprocess.run([sys.executable, BUILDER, cpath, tmp], check=True)
    d = docx.Document(tmp)

body = d.element.body
T = d.tables
# Header: tên đơn vị + số + V/v; nới cột trái để tên Trung tâm nằm trên 1 dòng
_t = T[0]._tbl
for gc, w in zip(_t.find(qn('w:tblGrid')).findall(qn('w:gridCol')), (4080, 5120)):
    gc.set(qn('w:w'), str(w))
for tc, w in zip(T[0].rows[0]._tr.findall(qn('w:tc')), (4080, 5120)):
    tc.find(qn('w:tcPr')).find(qn('w:tcW')).set(qn('w:w'), str(w))
c0 = T[0].rows[0].cells[0].paragraphs
set_text(c0[0], 'TỔNG CÔNG TY TRUYỀN THÔNG', bold=False)
set_text(c0[1], 'TRUNG TÂM DỊCH VỤ SỐ CÁ NHÂN', bold=True)
for _p in c0[:2] + T[0].rows[0].cells[1].paragraphs[:1]:
    for r in _p.runs:
        r.font.size = docx.shared.Pt(12)
for r in c0[1].runs:
    r.font.size = docx.shared.Pt(11.5)
vv = copy.deepcopy(c0[2]._p)
c0[2]._p.addnext(vv)
from docx.text.paragraph import Paragraph
vvp = Paragraph(vv, c0[2]._parent)
set_text(vvp, 'V/v Đề nghị hợp tác phân phối bản quyền phần mềm Microsoft (CSP)')
vvp.alignment = 1
for r in vvp.runs:
    r.font.size = docx.shared.Pt(12)

P = d.paragraphs
# P[2] 'TỜ TRÌNH' -> bỏ; P[3] trích yếu -> Kính gửi; P[4] kính trình -> bỏ
set_text(P[3], 'Kính gửi: Công ty .................... (Nhà phân phối CSP của Microsoft tại Việt Nam) ' + GD, bold=False)
P[3].paragraph_format.space_before = docx.shared.Pt(12)
P[3].paragraph_format.space_after = docx.shared.Pt(12)
for p in (P[2], P[4]):
    p._p.getparent().remove(p._p)
# Bỏ ô "Lãnh đạo Trung tâm phê duyệt"
T[1]._tbl.getparent().remove(T[1]._tbl)

# Khối ký
sig = T[2]
right = sig.rows[0].cells[1].paragraphs
set_text(right[0], 'GIÁM ĐỐC', bold=True)
set_text(right[1], GD, bold=False)
set_text(right[-1], '[Họ và tên người ký — GIẢ ĐỊNH: cần xác nhận]', bold=True)

d.core_properties.title = 'Công văn đề nghị hợp tác phân phối bản quyền Microsoft'
d.save(OUT)
print('saved', OUT)
