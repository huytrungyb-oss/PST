# Hook nhắc chấm phiếu (n8n)

Workflow n8n **"Nhắc chấm phiếu – quá hạn / sắp đến hạn chấm"** nhắc người chấm qua Telegram
khi phiếu chưa chấm bị quá hạn, đến hạn hôm nay, hoặc sắp đến hạn (mặc định ≤ 3 ngày).

- n8n: `https://n8n.daotaodoanhnghiep.net/workflow/A3ZTyENN49D5Wv5H`
- Mã nguồn (n8n Workflow SDK): `nhac-cham-phieu.workflow.js`
- Dữ liệu: n8n **Data table** `Phieu can cham` (không cần Google Sheet hay DB ngoài)

## Bảng `Phieu can cham`

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `ma_phieu` | string | Mã phiếu, dùng để đánh dấu đã chấm (bắt buộc) |
| `ten_phieu` | string | Tên phiếu |
| `dich_vu` | string | Dịch vụ liên quan (Data Account, Bundle Addon, ...) |
| `nguoi_cham` | string | Người phải chấm |
| `han_cham` | date | Hạn chấm. Hook nhận `dd/MM/yyyy` hoặc ISO |
| `trang_thai` | string | `Chưa chấm` (mặc định). `Đã chấm` / `Xong` / `Hủy` thì không nhắc nữa |
| `ghi_chu` | string | Ghi chú |

Có thể sửa trực tiếp trên n8n (menu **Data tables**) hoặc gọi hook bên dưới.

## Lịch và hook

| Việc | Cách gọi |
|---|---|
| Nhắc tự động | 8h sáng mỗi ngày (Schedule Trigger). Đặt **Settings → Timezone = Asia/Ho_Chi_Minh** |
| Nhắc ngay | `GET /webhook/nhac-cham-phieu` |
| Thêm phiếu cần chấm | `POST /webhook/them-phieu` với JSON các cột ở trên |
| Đánh dấu đã chấm | `POST /webhook/da-cham-phieu` với `{"ma_phieu": "P-001"}` (tuỳ chọn thêm `"trang_thai"`) |

Ví dụ:

```bash
BASE=https://n8n.daotaodoanhnghiep.net/webhook

curl "$BASE/nhac-cham-phieu"

curl -X POST "$BASE/them-phieu" -H "Content-Type: application/json" -d '{
  "ma_phieu": "P-001",
  "ten_phieu": "Phiếu đánh giá UAT Bundle Addon",
  "dich_vu": "Bundle Addon",
  "nguoi_cham": "Huy Trung",
  "han_cham": "10/11/2026"
}'

curl -X POST "$BASE/da-cham-phieu" -H "Content-Type: application/json" -d '{"ma_phieu": "P-001"}'
```

Tin nhắn Telegram gom theo nhóm: 🔴 quá hạn chấm, 🟠 phải chấm hôm nay, 🟡 sắp đến hạn chấm, ⚪ chưa có hạn.
Nếu không có phiếu thuộc 3 nhóm đầu thì không gửi gì (tránh spam).

## Kích hoạt lần đầu

1. Mở workflow trên n8n, vào node **"Gửi nhắc chấm Telegram"** → chọn/tạo credential *Telegram API* với token bot bản tin (bot đã dùng ở workflow "Telegram – Gửi tin chào thử").
2. Kiểm tra `CHAT_ID` ở đầu node **"Phân loại & soạn tin nhắc chấm"** (mặc định là chat của anh Huy Trung). Muốn nhắc nhóm thì thay bằng chat ID nhóm.
3. Settings → Timezone = `Asia/Ho_Chi_Minh`, rồi bật **Active**.
4. Gọi `GET /webhook/nhac-cham-phieu` để test. Bảng đang có 3 dòng mẫu `MAU-01..03`, xoá sau khi test.

## Tuỳ chỉnh

Đầu node **"Phân loại & soạn tin nhắc chấm"**:

- `NHAC_TRUOC_NGAY`: nhắc trước hạn bao nhiêu ngày (mặc định 3)
- `CHAT_ID`: nơi nhận tin
- `TRANG_THAI_DA_CHAM`: các trạng thái được coi là xong, không nhắc

## Cập nhật workflow từ mã nguồn

Sửa `nhac-cham-phieu.workflow.js` rồi dùng n8n MCP (`validate_workflow` → `update_workflow` với id `A3ZTyENN49D5Wv5H`),
hoặc dán lại vào n8n AI builder. Không commit token bot vào repo; token nằm trong credential của n8n.
