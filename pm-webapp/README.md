# PM Service Tool – VNPT VAS

Web app tạo tài liệu dịch vụ Bundle Add-on đúng format mẫu gốc.

## Deploy lên Render.com (miễn phí, ~5 phút)

### Bước 1 — Tạo GitHub repo
1. Vào github.com → New repository → Đặt tên `pm-service-tool` → Create
2. Upload toàn bộ thư mục này vào repo (drag & drop)

### Bước 2 — Deploy lên Render
1. Vào render.com → đăng nhập bằng GitHub
2. Bấm **New → Web Service**
3. Chọn repo `pm-service-tool`
4. Render tự detect `render.yaml` → bấm **Deploy**

### Bước 3 — Lấy URL
Sau ~3 phút: URL dạng `https://pm-service-tool-xxxx.onrender.com`

Share link này cho toàn bộ team — không cần cài đặt gì!

## Chạy local (để test)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
# Mở http://localhost:8000
```

## Cấu trúc

```
pm-service-tool/
├── app/
│   ├── main.py              # FastAPI app
│   ├── generators/
│   │   ├── helpers.py       # Shared docx utilities
│   │   ├── kbdv.py          # KBDV generator
│   │   ├── cv_vnp.py        # CV gửi VNP generator
│   │   ├── uat.py           # UAT generator
│   │   └── cv_khai_truong.py # CV Khai trương generator
│   └── templates/           # 4 file .docx mẫu gốc (KHÔNG XÓA)
│       ├── 1_kbdv.docx
│       ├── 2_cv_vnp.docx
│       ├── 3_uat.docx
│       └── 4_cv_khai_truong.docx
├── static/
│   └── index.html           # Frontend
├── requirements.txt
└── render.yaml
```

## Lưu ý quan trọng

- `app/templates/` chứa file mẫu gốc — **không xóa, không đổi tên**
- App copy file mẫu làm nền rồi thay nội dung → đảm bảo 100% format gốc
- Mỗi lần tạo file đều copy template mới → file trước không ảnh hưởng file sau
