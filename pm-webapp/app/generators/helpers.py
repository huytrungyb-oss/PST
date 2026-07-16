import copy
from docx import Document


def rp(para, old, new):
    for run in para.runs:
        if old in run.text:
            run.text = run.text.replace(old, new)


def rp_doc(doc, pairs):
    for old, new in pairs:
        for p in doc.paragraphs:
            rp(p, old, new)
        for tbl in doc.tables:
            for row in tbl.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        rp(p, old, new)


def cell_set(cell, text):
    for p in cell.paragraphs:
        if p.runs:
            p.runs[0].text = text
            for r in p.runs[1:]:
                r.text = ''
            return
    cell.paragraphs[0].add_run(text)


def cell_clear(cell):
    cell_set(cell, '')


def del_row(table, idx):
    table._tbl.remove(table.rows[idx]._tr)


def clone_row(table, source_idx):
    """Clone row at source_idx and append to table, return new row"""
    tr = table.rows[source_idx]._tr
    new_tr = copy.deepcopy(tr)
    table._tbl.append(new_tr)
    return table.rows[-1]


def ensure_pkg_rows(table, header_row_count, n_packages, template_data_rows):
    """Ensure table has exactly n_packages data rows after headers.
    header_row_count = number of header rows to keep at top.
    template_data_rows = number of data rows currently in template."""
    current = len(table.rows) - header_row_count
    # Remove excess rows (from bottom)
    while len(table.rows) - header_row_count > n_packages:
        del_row(table, len(table.rows) - 1)
    # Add missing rows by cloning last data row
    while len(table.rows) - header_row_count < n_packages:
        clone_row(table, len(table.rows) - 1)


def benefit_text(benefit_type: str, svc_name: str, website: str, pkg_code: str) -> str:
    """Generate MT2 content based on benefit type"""
    svc = svc_name.replace('Bundle Add-on ', '').replace('Bundle Add-On ', '')
    if benefit_type == "account":
        return (f"MT2: [TB] Quy khach da nhan duoc tai khoan (So dien thoai) va Mat khau [mat khau] "
                f"khi dang ky thanh cong goi {pkg_code}, dich vu {svc}. "
                f"Su dung tai {website}. "
                f"CSKH: 18001091 (0d/phut). Tran trong!")
    elif benefit_type == "license":
        return (f"MT2: [TB] Quy khach da nhan duoc ma License {svc} Premium khi dang ky thanh cong "
                f"goi {pkg_code}. Vui long truy cap {website} de kich hoat. "
                f"CSKH: 18001091 (0d/phut). Tran trong!")
    else:  # activation
        return (f"MT2: [TB] Quy khach da kich hoat thanh cong dich vu {svc} thuoc goi {pkg_code}. "
                f"Su dung tai {website}. CSKH: 18001091 (0d/phut). Tran trong!")


def mt_dk_success(pkg, price, dur, dur_type, data_val, svc_short, benefit_type, website):
    chu_ky = f"{price}/{dur}{dur_type}"
    mt1 = (f"MT1: Quy khach da dang ky thanh cong goi {pkg} cua VinaPhone ({chu_ky}), "
           f"co uu dai {data_val} Data (het luu luong dung truy cap) va quyen su dung dich vu {svc_short}. "
           f"Goi cuoc su dung den hh:mm dd/mm/yyyy, gia han tu dong. "
           f"De huy goi, soan HUY {pkg} gui 888. CSKH: 18001091 (0d/phut). Tran trong!")
    mt2 = benefit_text(benefit_type, svc_short, website, pkg)
    return f"{mt1}\n\n{mt2}"


def mt_gh_success(pkg, price, dur, dur_type, data_val, svc_short, benefit_type, website):
    if dur_type == "ngày":
        # Monthly renewal: MT1 + MT2
        chu_ky = f"{price}/{dur}{dur_type}"
        mt1 = (f"MT1: Quy khach da gia han thanh cong goi {pkg} cua VinaPhone ({chu_ky}), "
               f"co uu dai {data_val}. Goi cuoc su dung den hh:mm dd/mm/yyyy, gia han tu dong. "
               f"De huy goi, soan HUY {pkg} gui 888. CSKH: 18001091 (0d/phut). Tran trong!")
        svc_n = svc_short.replace('Bundle Add-on ', '').replace('Bundle Add-On ', '')
        mt2 = (f"MT2: [TB] Quy khach da nhan duoc quyen su dung dich vu {svc_n} thuoc goi {pkg}. "
               f"Su dung tai {website}. CSKH: 18001091 (0d/phut). Tran trong!")
        return f"{mt1}\n\n{mt2}"
    else:
        # Daily/hourly renewal: system MT every 7 days
        chu_ky = f"{price}/{dur}{dur_type}"
        return (f"MT he thong tra 7 ngay/lan: Quy khach dang su dung goi {pkg} cua VinaPhone ({chu_ky}), "
                f"co uu dai {data_val}. Goi cuoc gia han tu dong. "
                f"De huy goi, soan HUY {pkg} gui 888. CSKH: 18001091 (0d/phut). Tran trong!")
