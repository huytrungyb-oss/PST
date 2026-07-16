import os, tempfile, uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# ── Models ────────────────────────────────────────────────────────────────────
class Package(BaseModel):
    code: str
    price: str
    duration: str
    duration_type: str = "ngày"
    data: str
    cp_benefit: Optional[str] = ""
    alt_codes: Optional[str] = ""


class ServiceData(BaseModel):
    # Core info
    service_name: str
    partner_name: str
    service_desc: Optional[str] = ""
    website: str
    usage_channel: str = "Web/Wap/App"
    benefit_type: str = "account"
    service_code: str = "888"
    packages: List[Package]
    # CV VNP extras
    data_unit_price: Optional[str] = "2.796"
    expected_launch: Optional[str] = "Tháng ___/2026"
    contact_name: Optional[str] = "Nguyễn Mạnh Thắng"
    contact_phone: Optional[str] = "0943.029.193"
    contact_email: Optional[str] = "nmanhthang@vnpt.vn"
    # UAT extras
    test_person: Optional[str] = "Nguyễn Lan Hương"
    test_location: Optional[str] = "Số 97 đường Nguyễn Chí Thanh, Phường Láng, TP Hà Nội"
    # CV khai trương extras
    cv_trien_khai_so: Optional[str] = "___/VNPT-Media-VAS"
    cv_trien_khai_ngay: Optional[str] = "___/___/2026"
    vnp_feedback_cvs: Optional[str] = "___/KHCN-DVSCN ngày ___/___/2026"
    service_code_id: Optional[str] = "___________________"
    launch_date: Optional[str] = "___/___/2026"


# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(title="PM Service Tool – VNPT VAS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def root():
    idx = STATIC_DIR / "index.html"
    if idx.exists():
        return FileResponse(str(idx))
    return {"status": "PM Service Tool API running"}


# ── Helper ─────────────────────────────────────────────────────────────────────
def pkg_list(data: ServiceData) -> list:
    return [p.model_dump() for p in data.packages]


def make_response(data: ServiceData, generator_fn, fname_prefix: str):
    d = data.model_dump()
    d['packages'] = pkg_list(data)

    tmp = Path(tempfile.gettempdir()) / f"{uuid.uuid4().hex}.docx"
    try:
        generator_fn(d, str(tmp))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo file: {str(e)}")

    safe_name = data.service_name.replace(' ', '_').replace('/', '_')
    filename  = f"{fname_prefix}_{safe_name}.docx"
    return FileResponse(
        str(tmp),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"}
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.post("/api/generate/kbdv")
async def gen_kbdv(data: ServiceData):
    from .generators import kbdv
    return make_response(data, kbdv.generate, "KBDV")


@app.post("/api/generate/cv-vnp")
async def gen_cv_vnp(data: ServiceData):
    from .generators import cv_vnp
    return make_response(data, cv_vnp.generate, "CV_ThongBaoTrienKhai")


@app.post("/api/generate/uat")
async def gen_uat(data: ServiceData):
    from .generators import uat
    return make_response(data, uat.generate, "UAT")


@app.post("/api/generate/cv-khai-truong")
async def gen_cv_kt(data: ServiceData):
    from .generators import cv_khai_truong
    return make_response(data, cv_khai_truong.generate, "CV_KhaiTruong")


@app.post("/api/generate/all")
async def gen_all(data: ServiceData):
    """Generate all 4 documents and return as zip"""
    import zipfile
    from .generators import kbdv, cv_vnp, uat, cv_khai_truong

    d = data.model_dump()
    d['packages'] = pkg_list(data)
    safe = data.service_name.replace(' ', '_').replace('/', '_')

    tmp_dir  = Path(tempfile.gettempdir()) / uuid.uuid4().hex
    tmp_dir.mkdir()
    zip_path = tmp_dir / f"TaiLieu_{safe}.zip"

    files = [
        (kbdv.generate,          f"1_KBDV_{safe}.docx"),
        (cv_vnp.generate,        f"2_CV_ThongBaoTrienKhai_{safe}.docx"),
        (uat.generate,           f"3_UAT_{safe}.docx"),
        (cv_khai_truong.generate, f"4_CV_KhaiTruong_{safe}.docx"),
    ]

    errors = []
    with zipfile.ZipFile(str(zip_path), 'w') as zf:
        for gen_fn, fname in files:
            fp = tmp_dir / fname
            try:
                gen_fn(d, str(fp))
                zf.write(str(fp), fname)
            except Exception as e:
                errors.append(f"{fname}: {e}")

    if errors:
        raise HTTPException(status_code=500, detail="\n".join(errors))

    return FileResponse(
        str(zip_path),
        media_type="application/zip",
        filename=f"TaiLieu_{safe}.zip"
    )


@app.get("/api/health")
async def health():
    from .generators import kbdv
    import os
    tmpl_dir = Path(kbdv.TEMPLATE).parent
    files = list(tmpl_dir.glob("*.docx"))
    return {
        "status": "ok",
        "templates": [f.name for f in files]
    }
