import shutil, os
from docx import Document
from .helpers import rp_doc, cell_set, cell_clear, del_row, clone_row
from .helpers import mt_dk_success, mt_gh_success

TEMPLATE = os.path.join(os.path.dirname(__file__), '..', 'templates', '3_uat.docx')

CSKH = 'CSKH: 18001091 (0d/phut). Tran trong!'


def generate(data: dict, output_path: str):
    shutil.copy(TEMPLATE, output_path)
    doc = Document(output_path)

    svc       = data['service_name']
    svc_short = svc.replace('Bundle Add-on ', '').replace('Bundle Add-On ', '')
    partner   = data['partner_name']
    website   = data['website']
    benefit   = data['benefit_type']
    pkgs      = data['packages']
    tester    = data.get('test_person', 'Nguyễn Lan Hương')
    location  = data.get('test_location', 'Số 97 đường Nguyễn Chí Thanh, TP Hà Nội')
    partner_u = partner.upper()

    # Global text replacements
    rp_doc(doc, [
        ('BIÊN BẢN TEST NGHIỆM THU UAT DỊCH VỤ', 'BIÊN BẢN TEST NGHIỆM THU UAT DỊCH VỤ'),
        ('vnStudy', svc_short), ('vnstudy', svc_short.lower()),
        ('VNSTUDY', svc_short.upper()), ('VnStudy', svc_short),
        ('family.vnStudy.vn', website.replace('https://', '').replace('http://', '')),
        ('https://family.vnStudy.vn ', website + ' '),
        ('https://family.vnStudy.vn', website),
        ('CÔNG TY CP GIẢI PHÁP CÔNG NGHỆ iNET', partner_u),
        ('Công ty CP Giải pháp Công nghệ iNET', partner),
        ('Nguyễn Thị Bích Huyền', '............................................'),
        ('Nguyễn Lan Hương', tester),
        # Old package codes (longest first)
        ('12VSF125', pkgs[-1]['code'] if len(pkgs) > 1 else pkgs[0]['code']),
        ('6VSF125', pkgs[-1]['code'] if len(pkgs) > 1 else pkgs[0]['code']),
        ('3VSF125', pkgs[-1]['code'] if len(pkgs) > 1 else pkgs[0]['code']),
        ('VSF125', pkgs[-1]['code'] if len(pkgs) > 1 else pkgs[0]['code']),
        ('VSF10', pkgs[0]['code']),
        ('VSHT', pkgs[-1]['code'] if len(pkgs) > 1 else pkgs[0]['code']),
        ('VSMT', pkgs[-1]['code'] if len(pkgs) > 1 else pkgs[0]['code']),
        # Prices & data
        ('10.000đ', pkgs[0]['price']),
        ('10.000 đ', pkgs[0]['price']),
        ('125.000đ', pkgs[-1]['price'] if len(pkgs) > 1 else pkgs[0]['price']),
        ('có bao gồm cả thuê bao EZCOM', 'không bao gồm thuê bao EZCOM'),
        ('Thông tin dịch vụ vnStudy', f'Thông tin dịch vụ {svc_short}'),
    ])

    # Update Table 1 - Service info
    _update_svc_table(doc.tables[1], pkgs, website, svc_short, svc, benefit)

    # Update test case tables
    if len(doc.tables) >= 4:
        _update_test_table(doc.tables[3], pkgs[0], svc_short, benefit, website)
    if len(doc.tables) >= 5 and len(pkgs) > 1:
        _update_test_table(doc.tables[4], pkgs[1], svc_short, benefit, website)
    elif len(doc.tables) >= 5:
        _update_test_table(doc.tables[4], pkgs[0], svc_short, benefit, website)

    # Update paragraph headings
    for p in doc.paragraphs:
        for pkg in pkgs:
            if p.text.strip().startswith('Gói dịch vụ:'):
                pass  # Already handled by rp_doc

    doc.save(output_path)


def _update_svc_table(t1, pkgs, website, svc_short, svc, benefit):
    if len(t1.rows) < 5:
        return

    # Website (row 2, all content cols)
    for ci in range(2, len(t1.rows[2].cells)):
        cell_set(t1.rows[2].cells[ci], website)

    # Description (row 3)
    desc = (f"Dịch vụ {svc} bao gồm các gói cước nội dung nâng cao tích hợp dịch vụ Mobile Internet "
            f"của mạng VinaPhone với quyền lợi sử dụng dịch vụ {svc_short} – "
            f"truy cập tại {website}.")
    for ci in range(2, len(t1.rows[3].cells)):
        cell_set(t1.rows[3].cells[ci], desc)

    # Package rows (row 4 = header, rows 5+ = data)
    while len(t1.rows) > 5 + len(pkgs):
        del_row(t1, len(t1.rows) - 1)
    # Row 4 = package table header - keep
    # Rows 5,6,... = package data rows
    # First ensure enough rows
    while len(t1.rows) < 5 + len(pkgs):
        clone_row(t1, len(t1.rows) - 1)

    for i, pkg in enumerate(pkgs):
        row = t1.rows[5 + i]
        alts = pkg.get('alt_codes', '')
        dk_syn = f"DK {pkg['code']} gửi 888"
        huy_syn = f"HUY {pkg['code']} gửi 888"
        if alts:
            dk_syn += f"\nCú pháp phụ: {alts}"

        cell_set(row.cells[2], pkg['code'])
        cell_set(row.cells[3], pkg['code'])
        cell_set(row.cells[4], f"{pkg['duration']} {pkg['duration_type']}")
        cell_set(row.cells[5], pkg['price'])
        cell_set(row.cells[6], dk_syn)
        cell_set(row.cells[7], huy_syn)
        cell_set(row.cells[8], _ql_text(pkg, svc_short, benefit, website))

    # Kênh đăng ký
    kenh_row_idx = 5 + len(pkgs) + 1  # after data rows + giá data row
    if len(t1.rows) > kenh_row_idx:
        for ci in range(2, len(t1.rows[kenh_row_idx].cells)):
            cell_set(t1.rows[kenh_row_idx].cells[ci],
                     'SMS, My VNPT, Shop.vnpt.vn, DigiShop, CCOS, CCBS, SMCS, App Employee')

    # Điều kiện
    dksd_idx = kenh_row_idx + 1
    if len(t1.rows) > dksd_idx:
        cond = ('Thuê bao trả trước và trả sau (không bao gồm thuê bao EZCOM) hoạt động 2 chiều '
                'trên mạng VinaPhone (không nợ đọng, huỷ, tạm ngưng, khoá 1 chiều/2 chiều).')
        for ci in range(2, len(t1.rows[dksd_idx].cells)):
            cell_set(t1.rows[dksd_idx].cells[ci], cond)


def _ql_text(pkg, svc_name, benefit, website):
    if benefit == "account":
        return (f"{pkg['data']} Data (hết lưu lượng dừng truy cập)(*); "
                f"01 tài khoản VIP sử dụng dịch vụ {svc_name} trong "
                f"{pkg['duration']} {pkg['duration_type']} tại: {website}")
    elif benefit == "license":
        return (f"{pkg['data']} Data (hết lưu lượng dừng truy cập)(*); "
                f"01 mã kích hoạt {svc_name} Premium trong "
                f"{pkg['duration']} {pkg['duration_type']}")
    else:
        return (f"{pkg['data']} Data (hết lưu lượng dừng truy cập)(*); "
                f"Quyền sử dụng {svc_name} trong "
                f"{pkg['duration']} {pkg['duration_type']} tại: {website}")


def _update_test_table(tbl, pkg, svc_name, benefit, website):
    """Update a test case table for one package."""
    code = pkg['code']
    price = pkg['price']
    dur = pkg['duration']
    durt = pkg['duration_type']
    data_val = pkg['data']

    mt_success = mt_dk_success(code, price, dur, durt, data_val, svc_name, benefit, website)
    mt_gh = mt_gh_success(code, price, dur, durt, data_val, svc_name, benefit, website)

    for ri, row in enumerate(tbl.rows):
        tt = row.cells[0].text.strip()
        # Clear TB,thời gian and Kết luận for data rows
        if tt not in ('TT', 'I', 'II', 'III', 'IV', 'V'):
            if len(row.cells) > 2: cell_clear(row.cells[2])
            if len(row.cells) > 5: cell_clear(row.cells[5])

        # Update Cú pháp column (col 3) and MT column (col 4)
        nd = row.cells[1].text if len(row.cells) > 1 else ''
        cu = row.cells[3].text if len(row.cells) > 3 else ''

        if 'Đăng ký thành công' in nd and tt == '1':
            cell_set(row.cells[3], f'MBG DK {code} gửi 888')
            cell_set(row.cells[4], mt_success)
        elif 'không đủ tiền' in nd and 'Đăng ký' in nd:
            cell_set(row.cells[3], f'DK {code} gửi 888')
            cell_set(row.cells[4],
                f'Quy khach dang ky goi cuoc {code} ({price}/{dur}{durt}) khong thanh cong do tai khoan chinh khong du tien. '
                f'Vui long nap the tai https://my.vnpt.com.vn/adv/nt va soan tin DK {code} gui 888 de dang ky lai. {CSKH}')
        elif 'trùng gói' in nd or 'không được đăng ký trùng' in nd:
            cell_set(row.cells[3], f'DK {code} gửi 888')
            cell_set(row.cells[4],
                f'Dang ky khong thanh cong do Quy khach dang co goi {code}. {CSKH}')
        elif 'không đúng loại thuê bao' in nd:
            cell_set(row.cells[3], f'MBG DK {code}')
            cell_set(row.cells[4],
                f'Quy khach dang ky goi cuoc {code} khong thanh cong do goi cuoc khong ap dung cho thue bao. '
                f'Vui long bam *091#OK de biet thong tin uu dai. {CSKH}')
        elif 'Gia hạn thành công' in nd:
            cell_set(row.cells[4], mt_gh)
        elif 'Gia hạn không thành công' in nd:
            cell_set(row.cells[4],
                f'Goi cuoc {code} ({price}/{dur}{durt}) cua Quy khach gia han khong thanh cong do khong du so du. '
                f'Vui long nap tien tai https://my.vnpt.com.vn/adv/nt. {CSKH}')
        elif 'đã dùng hết ưu đãi' in nd and 'Hủy' in nd:
            cell_set(row.cells[3], f'HUY {code} gửi 888')
            cell_set(row.cells[4],
                f'Quy khach da huy goi cuoc {code} thanh cong. {CSKH} Cam on Quy khach!')
        elif 'chưa dùng hết ưu đãi' in nd:
            cell_set(row.cells[3], f'HUY {code}')
            cell_set(row.cells[4],
                f'Quy khach con dung luong data uu dai trong goi {code}, kiem tra Data soan DATAKM gui 888. '
                f'Neu Quy khach tiep tuc muon huy, soan HUY {code} Y gui 888. {CSKH}')
        elif 'xác nhận hủy' in nd or 'nhắn tin xác nhận' in nd:
            cell_set(row.cells[3], f'HUY {code} Y')
            cell_set(row.cells[4],
                f'Quy khach da huy goi cuoc {code} thanh cong. {CSKH} Cam on Quy khach!')
        elif 'chưa đăng ký gói' in nd and 'hủy' in nd.lower():
            cell_set(row.cells[3], f'HUY {code}')
            cell_set(row.cells[4],
                f'Yeu cau huy goi {code} khong thanh cong do thue bao cua Quy khach chua dang ky goi {code}. {CSKH}')
        elif 'Sai cú pháp' in nd:
            cell_set(row.cells[3], f'DK{code}')
            cell_set(row.cells[4],
                f'Tin nhan co cu phap khong hop le. Quy khach vui long lien he CSKH: 18001091 (0d/phut) de duoc ho tro.')
        elif 'Hết ưu đãi Data' in nd:
            cell_set(row.cells[4],
                f'Goi cuoc {code} cua Quy khach da het dung luong toc do cao trong chu ky su dung. {CSKH}')
        elif 'Sử dụng dịch vụ' in nd or 'Chi tiết sử' in nd:
            cell_set(row.cells[4],
                f'- Dang nhap tai khoan vao {website}.\n'
                f'- Man hinh hien thi dich vu {svc_name}.\n'
                f'- Truy cap va su dung dich vu thanh cong.')
        elif 'hết thời hạn retry' in nd or 'tự hủy' in nd.lower():
            cell_set(row.cells[4],
                f'Goi {code} ({price}) da bi huy do tai khoan cua Quy khach khong du de gia han goi. '
                f'Vui long nap the va soan tin DK {code} gui 888 de dang ky lai. {CSKH}')
