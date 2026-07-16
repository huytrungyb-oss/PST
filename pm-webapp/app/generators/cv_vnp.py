import shutil, os
from docx import Document
from .helpers import rp_doc, cell_set, del_row, clone_row

TEMPLATE = os.path.join(os.path.dirname(__file__), '..', 'templates', '2_cv_vnp.docx')


def generate(data: dict, output_path: str):
    shutil.copy(TEMPLATE, output_path)
    doc = Document(output_path)

    svc     = data['service_name']
    svc_short = svc.replace('Bundle Add-on ', '').replace('Bundle Add-On ', '')
    partner = data['partner_name']
    website = data['website']
    pkgs    = data['packages']
    contact = data.get('contact_name', 'Nguyễn Mạnh Thắng')
    phone   = data.get('contact_phone', '0943.029.193')
    email   = data.get('contact_email', 'nmanhthang@vnpt.vn')
    launch  = data.get('expected_launch', 'Tháng ___/2026')
    unit_price = data.get('data_unit_price', '2.796')

    # Text replacements (Busuu template → new service)
    rp_doc(doc, [
        ('Bundle Add-on Busuu', svc),
        ('Bundle Add-on busuu', svc),
        ('Busuu', svc_short),
        ('busuu', svc_short.lower()),
        ('BUSUU', svc_short.upper()),
        ('busuu.com', website.replace('https://', '').replace('http://', '')),
        ('https://busuu.com', website),
        ('www.busuu.com', website),
        ('Công ty cổ phần Busuu', partner),
        ('Công ty Busuu', partner),
        ('busuu Limited', partner),
        ('Công ty TNHH Busuu', partner),
        # Contact
        ('Nguyễn Mạnh Thắng', contact),
        ('0943.029.193', phone),
        ('nmanhthang@vnpt.vn', email),
        # Unit price
        ('2.796', unit_price),
        # Launch time
        ('Tháng 8/2026', launch),
        ('Tháng 9/2026', launch),
    ])

    # Update all package tables (Busuu template has multiple copies)
    _update_pkg_tables(doc, pkgs, website)

    doc.save(output_path)


def _update_pkg_tables(doc, pkgs, website):
    """Find and update all package tables in the document."""
    for tbl in doc.tables:
        if len(tbl.rows) < 2 or len(tbl.columns) < 5:
            continue
        hdr = tbl.rows[0].cells[0].text.strip()
        if hdr not in ('TT', 'STT'):
            continue
        # Resize to header + len(pkgs) rows
        while len(tbl.rows) > 1 + len(pkgs):
            del_row(tbl, len(tbl.rows) - 1)
        while len(tbl.rows) < 1 + len(pkgs):
            clone_row(tbl, len(tbl.rows) - 1)
        # Fill data rows
        for i, pkg in enumerate(pkgs):
            row = tbl.rows[i + 1]
            cell_set(row.cells[0], str(i + 1))
            # Handle 4-col vs 5-col tables
            if len(row.cells) >= 5:
                cell_set(row.cells[1], pkg['code'])
                cell_set(row.cells[2], pkg['price'])
                cell_set(row.cells[3], f"{pkg['duration']} {pkg['duration_type']}")
                cell_set(row.cells[4], _uu_dai(pkg, website))
            elif len(row.cells) == 4:
                cell_set(row.cells[1], pkg['code'])
                cell_set(row.cells[2], pkg['price'])
                cell_set(row.cells[3], f"{pkg['duration']} {pkg['duration_type']}")


def _uu_dai(pkg, website):
    lines = [f"{pkg['data']} Data (hết lưu lượng dừng truy cập)(*)"]
    if pkg.get('cp_benefit'):
        lines.append(pkg['cp_benefit'])
    return ';\n'.join(lines)
