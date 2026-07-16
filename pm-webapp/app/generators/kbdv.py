import shutil, os
from docx import Document
from .helpers import (rp_doc, cell_set, del_row, clone_row,
                      mt_dk_success, mt_gh_success, benefit_text)

TEMPLATE = os.path.join(os.path.dirname(__file__), '..', 'templates', '1_kbdv.docx')

# iCallme references to replace
ICALLME_REFS = [
    'iCallme', 'iCallMe', 'ICALLME', 'Icallme',
    'icallme.vn', 'https://www.icallme.vn/', 'https://www.icallme.vn',
    'ICM5', 'ICM25', 'ICM50', 'ICM100',
    'ICM5P', 'ICME5', 'ICM5PH', 'ICM100P', 'ICM100K', 'ICM100PH',
]
ICALLME_PARTNER = 'Công ty cổ phần Công Nghệ Thung Lũng Silicon'
ICALLME_TITLE = 'PHỤ LỤC 1: KỊCH BẢN KINH DOANH DỊCH VỤ BUNDLE DATA ACCOUNT ICALLME'


def generate(data: dict, output_path: str):
    shutil.copy(TEMPLATE, output_path)
    doc = Document(output_path)

    svc   = data['service_name']
    svc_u = svc.upper()
    svc_short = svc.replace('Bundle Add-on ', '').replace('Bundle Add-On ', '')
    partner   = data['partner_name']
    website   = data['website']
    channel   = data['usage_channel']
    benefit   = data['benefit_type']
    pkgs      = data['packages']

    # ── Build main package references list ──
    old_codes = ['ICM5', 'ICM25', 'ICM50', 'ICM100',
                 'ICM5P', 'ICME5', 'ICM5PH', 'ICM100P', 'ICM100K', 'ICM100PH',
                 'mã License', 'mã license', 'License Code', 'mã License iCallme Premium']

    # Determine the primary package code (first) for replacements
    primary_code = pkgs[0]['code'] if pkgs else 'UNGOI'

    pairs = [
        (ICALLME_TITLE,
         f'PHỤ LỤC 1: KỊCH BẢN KINH DOANH DỊCH VỤ BUNDLE ADD-ON {svc_u}'),
        ('BUNDLE DATA ACCOUNT ICALLME', f'BUNDLE ADD-ON {svc_u}'),
        (ICALLME_PARTNER, partner),
        ('iCallme', svc_short),
        ('iCallMe', svc_short),
        ('ICALLME', svc_u),
        ('Icallme', svc_short),
        ('icallme.vn', website.replace('https://', '').replace('http://', '')),
        ('https://www.icallme.vn/', website),
        ('https://www.icallme.vn', website),
        ('Application', channel),
        ('mã License iCallme Premium', _benefit_label(benefit, svc_short)),
        ('mã license', _benefit_label(benefit, svc_short)),
        ('mã License', _benefit_label(benefit, svc_short)),
        ('nhận mã License', _benefit_label_verb(benefit, svc_short)),
        ('License Code', _benefit_label(benefit, svc_short)),
    ]
    rp_doc(doc, pairs)

    # ── Package table (Table 0) ──
    t0 = doc.tables[0]
    # Keep header row (row 0), ensure exactly len(pkgs) data rows
    while len(t0.rows) > 1 + len(pkgs):
        del_row(t0, len(t0.rows) - 1)
    while len(t0.rows) < 1 + len(pkgs):
        clone_row(t0, len(t0.rows) - 1)

    for i, pkg in enumerate(pkgs):
        row = t0.rows[i + 1]
        cell_set(row.cells[0], str(i + 1))
        cell_set(row.cells[1], pkg['code'])
        cell_set(row.cells[2], pkg['price'])
        cell_set(row.cells[3], f"{pkg['duration']} {pkg['duration_type']}")
        cell_set(row.cells[4], _uu_dai_text(pkg, svc_short, benefit, website))

    # ── Syntax table (Table 1) ──
    t1 = doc.tables[1]
    if len(t1.rows) >= 2:
        dk_syntax = _build_dk_syntax(pkgs)
        cell_set(t1.rows[1].cells[1], dk_syntax)
    if len(t1.rows) >= 3:
        huy_syntax = '\n'.join([f'HUY {p["code"]} gửi 888' for p in pkgs])
        cell_set(t1.rows[2].cells[1], huy_syntax)
    if len(t1.rows) >= 4:
        cell_set(t1.rows[3].cells[1], 'DATAKM gửi 888')

    # ── MT table (Table 2 - 21 rows) ──
    _update_mt_table(doc.tables[2], pkgs, svc_short, benefit, website)

    doc.save(output_path)


def _benefit_label(benefit_type, svc_name):
    if benefit_type == "account":
        return f"tài khoản VIP {svc_name} (SĐT + mật khẩu)"
    elif benefit_type == "license":
        return f"mã kích hoạt {svc_name}"
    else:
        return f"quyền sử dụng {svc_name}"


def _benefit_label_verb(benefit_type, svc_name):
    if benefit_type == "account":
        return f"nhận tài khoản (SĐT) và mật khẩu"
    elif benefit_type == "license":
        return f"nhận mã kích hoạt {svc_name}"
    else:
        return f"kích hoạt dịch vụ {svc_name}"


def _uu_dai_text(pkg, svc_name, benefit_type, website):
    lines = [
        f"- {pkg['data']} Data (hết lưu lượng dừng truy cập)(*)",
    ]
    if benefit_type == "account":
        lines.append(f"- 01 tài khoản VIP sử dụng dịch vụ {svc_name} "
                     f"trong {pkg['duration']} {pkg['duration_type']} tại: {website}")
    elif benefit_type == "license":
        lines.append(f"- 01 mã kích hoạt {svc_name} Premium "
                     f"trong {pkg['duration']} {pkg['duration_type']}")
    else:
        lines.append(f"- Quyền sử dụng dịch vụ {svc_name} "
                     f"trong {pkg['duration']} {pkg['duration_type']} tại: {website}")
    if pkg.get('cp_benefit'):
        lines.append(f"- {pkg['cp_benefit']}")
    return '\n'.join(lines)


def _build_dk_syntax(pkgs):
    lines = []
    for p in pkgs:
        alts = p.get('alt_codes', '')
        base = f"<{p['code']}> hoặc DK <{p['code']}> gửi 888"
        if alts:
            base += f"\nCú pháp phụ gói {p['code']}: {alts}"
        lines.append(base)
    return '\n'.join(lines)


def _update_mt_table(t2, pkgs, svc_name, benefit_type, website):
    """Update the 21-row MT table with new service data."""
    if len(t2.rows) < 21:
        return

    # Use first package as primary, mention all in MO column
    p0 = pkgs[0]
    all_dk_mo = ' hoặc '.join([f"DK {p['code']}" for p in pkgs]) + ' gửi 888'
    all_huy_mo = ' hoặc '.join([f"HUY {p['code']}" for p in pkgs]) + ' gửi 888'

    mt_success_0 = mt_dk_success(
        f"<TÊN GÓI>", f"<GIÁ GÓI>", p0['duration'], p0['duration_type'],
        "<ƯU ĐÃI DATA>", svc_name, benefit_type, website)

    def row_update(row_idx, tt, nd, mo, mt):
        if row_idx >= len(t2.rows): return
        r = t2.rows[row_idx]
        if tt is not None: cell_set(r.cells[0], tt)
        if nd is not None: cell_set(r.cells[1], nd)
        if mo is not None: cell_set(r.cells[2], mo)
        if mt is not None: cell_set(r.cells[3], mt)

    CSKH = 'CSKH: 18001091 (0d/phut). Tran trong!'

    # Row 2: ĐK thành công
    row_update(2, '1 ',
        f'Đăng ký thành công gói Bundle Add-on {svc_name}',
        all_dk_mo,
        mt_success_0)
    # Row 3: ĐK KTC thiếu tiền
    row_update(3, '2 ',
        'Đăng ký không thành công do không đủ tiền trong tài khoản',
        all_dk_mo,
        f'Quy khach dang ky goi cuoc <TEN GOI> (<GIA GOI>/<CHU KY>) khong thanh cong do tai khoan chinh khong du tien. '
        f'Vui long nap the tai https://my.vnpt.com.vn/adv/nt va soan tin DK <TEN GOI> gui 888 de dang ky lai. {CSKH}')
    # Row 4: ĐK KTC trùng gói
    row_update(4, '3 ',
        'Đăng ký không thành công do trùng gói/đang có gói khác',
        all_dk_mo,
        f'Dang ky khong thanh cong do Quy khach dang co goi <TEN GOI>. '
        f'De trai nghiem cac goi cuoc data va noi dung hap dan khac, moi Quy khach truy cap https://www.dataplus.vn. {CSKH}')
    # Row 5: ĐK KTC sai loại TB
    row_update(5, '4 ',
        'Đăng ký không thành công do không đúng loại thuê bao',
        all_dk_mo,
        f'Quy khach dang ky goi cuoc <TEN GOI> khong thanh cong do goi cuoc khong ap dung cho thue bao cua Quy khach. '
        f'Vui long bam *091#OK de biet thong tin uu dai danh rieng cho thue bao. {CSKH}')
    # Row 6: ĐK KTC lỗi HT
    row_update(6, '5 ',
        'Đăng ký không thành công do lỗi hệ thống',
        all_dk_mo,
        f'Quy khach dang ky goi <TEN GOI> khong thanh cong do loi he thong, vui long thu lai sau. '
        f'VinaPhone xin loi Quy khach! CSKH: 18001091 (0d/phut).')
    # Row 7: ĐK KTC chưa xong lệnh
    row_update(7, '6 ',
        'Đăng ký không thành công do chưa hoàn thành xử lý lệnh đăng ký gói trước đó',
        all_dk_mo,
        f'Dang ky khong thanh cong do he thong dang thuc hien xu ly dang ky goi <TEN GOI> cho Quy khach. {CSKH}')

    # Determine if we have monthly packages (30 ngày) or daily (24 giờ)
    monthly_pkgs = [p for p in pkgs if p['duration_type'] == 'ngày']
    hourly_pkgs  = [p for p in pkgs if p['duration_type'] == 'giờ']

    # Row 9: GH thành công gói tháng (nếu có)
    if monthly_pkgs:
        pm = monthly_pkgs[0]
        mt_gh_m = mt_gh_success(pm['code'], pm['price'], pm['duration'], pm['duration_type'],
                                 pm['data'], svc_name, benefit_type, website)
        row_update(9, '1 ',
            f'Gia hạn thành công gói chu kỳ tháng ({pm["duration"]} ngày)',
            '', mt_gh_m)

    # Row 10: GH thành công gói ngày/giờ
    if hourly_pkgs:
        ph = hourly_pkgs[0]
        mt_gh_h = mt_gh_success(ph['code'], ph['price'], ph['duration'], ph['duration_type'],
                                  ph['data'], svc_name, benefit_type, website)
        row_update(10, '2 ',
            f'Gia hạn thành công gói chu kỳ {ph["duration_type"]} ({ph["duration"]} {ph["duration_type"]})',
            '', mt_gh_h)
    elif monthly_pkgs:
        row_update(10, '2 ',
            'Gia hạn thành công gói chu kỳ ngày',
            '', 'MT hệ thống trả 7 ngày/lần. ' + CSKH)

    # Row 11: GH KTC thiếu tiền
    row_update(11, '3 ',
        'Gia hạn không thành công do không đủ tiền trong tài khoản',
        '',
        f'Goi cuoc <TEN GOI> (<GIA GOI>/<CHU KY>) cua Quy khach gia han khong thanh cong do khong du so du. '
        f'Vui long nap tien theo huong dan tai https://my.vnpt.com.vn/adv/nt de tiep tuc huong quyen loi uu dai. {CSKH}')

    # Row 13: Hủy - đã hết data
    row_update(13, '1 ',
        'Thuê bao đã đăng ký gói, đã dùng hết ưu đãi data và nhắn tin hủy đúng cú pháp',
        all_huy_mo,
        f'Quy khach da huy goi cuoc <TEN GOI> thanh cong. '
        f'Quy khach khong duoc mien phi su dung cac dich vu noi dung di kem cua goi <TEN GOI>. '
        f'CSKH: 18001091 (0d/phut). Cam on Quy khach da tin tuong su dung dich vu cua VinaPhone!')
    # Row 14: Hủy - còn data
    row_update(14, '2 ',
        'Thuê bao đã đăng ký gói, chưa dùng hết ưu đãi data và nhắn tin hủy đúng cú pháp',
        all_huy_mo,
        f'Quy khach con dung luong data uu dai trong goi <TEN GOI>, kiem tra Data soan DATAKM gui 888. '
        f'Neu Quy khach tiep tuc muon huy, soan HUY <TEN GOI> Y gui 888. CSKH: 18001091 (0d/phut).')
    # Row 15: Xác nhận hủy
    huy_y = ' hoặc '.join([f"HUY {p['code']} Y" for p in pkgs]) + ' gửi 888'
    row_update(15, '3 ',
        'Thuê bao đã đăng ký gói và nhắn tin xác nhận hủy gói đúng cú pháp',
        huy_y,
        f'Quy khach da huy goi cuoc <TEN GOI> thanh cong. '
        f'Quy khach khong duoc mien phi su dung cac dich vu noi dung di kem cua goi <TEN GOI>. '
        f'CSKH: 18001091 (0d/phut). Cam on Quy khach da tin tuong su dung dich vu cua VinaPhone!')
    # Row 16: Chưa ĐK mà hủy
    row_update(16, '4 ',
        'Thuê bao chưa đăng ký gói và nhắn tin hủy gói đúng cú pháp',
        all_huy_mo,
        f'Yeu cau huy goi <TEN GOI> khong thanh cong do thue bao cua Quy khach chua dang ky goi <TEN GOI>. {CSKH}')
    # Row 17: Hủy do GH KTC
    row_update(17, '5 ',
        'Hủy gói do gia hạn không thành công',
        '',
        f'Goi <TEN GOI> (<GIA GOI>) da bi huy do tai khoan cua Quy khach khong du de gia han goi. '
        f'Vui long nap the va soan tin DK <TEN GOI> gui 888 de dang ky lai. {CSKH}')

    # Row 19: Sai cú pháp
    row_update(19, '1 ',
        'Sai cú pháp',
        '...',
        f'Tin nhan co cu phap khong hop le. Quy khach vui long lien he CSKH: 18001091 (0d/phut) de duoc ho tro. '
        f'Cam on Quy khach da su dung dich vu cua VinaPhone!')
    # Row 20: NĐ147
    row_update(20, '2 ',
        f'Thông báo về dịch vụ nội dung đang sử dụng theo NĐ147 vào ngày 25 hàng tháng',
        '',
        f'[TB] Quy khach dang co quyen loi su dung DV {svc_name}: goi [Ten goi] ([Gia goi/chu ky]). '
        f'Chi tiet lien he 18001091 (0d/phut). Tran trong!')

    # Footer note
