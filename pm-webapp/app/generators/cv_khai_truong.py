import shutil, os
from docx import Document
from .helpers import rp_doc, cell_set, del_row, clone_row

TEMPLATE = os.path.join(os.path.dirname(__file__), '..', 'templates', '4_cv_khai_truong.docx')


def generate(data: dict, output_path: str):
    shutil.copy(TEMPLATE, output_path)
    doc = Document(output_path)

    svc       = data['service_name']
    svc_short = svc.replace('Bundle Add-on ', '').replace('Bundle Add-On ', '')
    partner   = data['partner_name']
    website   = data['website']
    channel   = data['usage_channel']
    pkgs      = data['packages']
    contact   = data.get('contact_name', 'Nguyễn Mạnh Thắng')
    phone     = data.get('contact_phone', '0943.029.193')
    email     = data.get('contact_email', 'nmanhthang@vnpt.vn')

    # CV references
    cv_so     = data.get('cv_trien_khai_so', '___/VNPT-Media-VAS')
    cv_ngay   = data.get('cv_trien_khai_ngay', '___/___/2026')
    feedback  = data.get('vnp_feedback_cvs', '___/KHCN-DVSCN ngày ___/___/2026')
    svc_id    = data.get('service_code_id', '___________________')
    launch_dt = data.get('launch_date', '___/___/2026')

    rp_doc(doc, [
        ('iCallme', svc_short), ('iCallMe', svc_short),
        ('ICALLME', svc_short.upper()), ('Icallme', svc_short),
        ('icallme.vn', website.replace('https://', '').replace('http://', '')),
        ('https://www.icallme.vn/', website),
        ('https://www.icallme.vn', website),
        ('Công ty cổ phần Công Nghệ Thung Lũng Silicon', partner),
        ('Cong ty co phan Cong Nghe Thung Lung Silicon', partner),
        ('Application', channel),
        # CV references
        ('DCO0A3VMADVK674', svc_id),
        ('569/VNPT-Media-VAS', cv_so),
        ('22/07/2025', cv_ngay),
        ('2980/KHCN-DVSCN ngày 28/07/2025', feedback),
        ('2980/KHCN-DVSCN', feedback.split(';')[0] if ';' in feedback else feedback),
        ('28/07/2025', cv_ngay),
        # Third reference CV (remove if not needed)
        ('3727/KHCN-DVSCN ngày 15/09/2025 V/v Làm rõ nội dung tỷ lệ phân bổ doanh thu dịch vụ Bundle Add-on iCallme;\n', ''),
        ('3727/KHCN-DVSCN ngày 15/09/2025', ''),
        ('15/09/2025', ''),
        # Launch date
        ('năm 2025', 'năm 2026'),
        # Contact
        ('Nguyễn Mạnh Thắng', contact),
        ('0943.029.193', phone),
        ('nmanhthang@vnpt.vn', email),
        # Package codes
        ('ICM5', 'UNGOI'), ('ICM25', 'UNGOI'), ('ICM50', 'UNGOI'), ('ICM100', 'UNGOI'),
        ('mã License', 'tài khoản VIP (SĐT + mật khẩu)'),
        ('mã license', 'tài khoản VIP (SĐT + mật khẩu)'),
    ])

    # Replace "UNGOI" with first package code
    rp_doc(doc, [('UNGOI', pkgs[0]['code'])])

    # Update package tables
    for tbl in doc.tables:
        if len(tbl.rows) < 2 or len(tbl.columns) < 4:
            continue
        hdr = tbl.rows[0].cells[0].text.strip()
        if hdr not in ('TT', 'STT'):
            continue
        while len(tbl.rows) > 1 + len(pkgs):
            del_row(tbl, len(tbl.rows) - 1)
        while len(tbl.rows) < 1 + len(pkgs):
            clone_row(tbl, len(tbl.rows) - 1)
        for i, pkg in enumerate(pkgs):
            row = tbl.rows[i + 1]
            cell_set(row.cells[0], str(i + 1))
            if len(row.cells) >= 5:
                cell_set(row.cells[1], pkg['code'])
                cell_set(row.cells[2], pkg['price'])
                cell_set(row.cells[3], f"{pkg['duration']} {pkg['duration_type']}")
                cell_set(row.cells[4], _uu_dai(pkg, data.get('usage_channel', ''), website))

    # Update syntax table (2-col table with Nội dung / Cú pháp header)
    for tbl in doc.tables:
        if len(tbl.rows) < 2 or len(tbl.columns) != 2:
            continue
        if 'Nội dung' in tbl.rows[0].cells[0].text or 'nội dung' in tbl.rows[0].cells[0].text:
            if len(tbl.rows) >= 2:
                dk_syn = '\n'.join([
                    f"<{p['code']}> hoặc DK <{p['code']}> gửi 888"
                    + (f"\nCú pháp phụ: {p['alt_codes']}" if p.get('alt_codes') else '')
                    for p in pkgs])
                cell_set(tbl.rows[1].cells[1], dk_syn)
            if len(tbl.rows) >= 3:
                huy_syn = '\n'.join([f"HUY {p['code']} gửi 888" for p in pkgs])
                cell_set(tbl.rows[2].cells[1], huy_syn)
            break

    doc.save(output_path)


def _uu_dai(pkg, channel, website):
    lines = [f"- {pkg['data']} Data (hết lưu lượng dừng truy cập)(*)"]
    if pkg.get('cp_benefit'):
        lines.append(f"- {pkg['cp_benefit']}")
    return '\n'.join(lines)
