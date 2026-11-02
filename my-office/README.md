# My Office

Văn phòng isometric cho các phiên Claude Code. Mỗi phiên là một nhân viên:

- **Đang làm**: ngồi ở cụm bàn của mình, màn hình sáng, bong bóng "đang gõ".
- **Chờ bạn duyệt**: dấu `!` vàng nhảy trên đầu, hiện ở mục *Cần bạn duyệt* và cột *Hoạt động* với nút **Duyệt / Từ chối**.
- **Đang nghỉ**: đi ra phòng nghỉ hoặc quán cà phê, cầm cốc cà phê.
- **Trợ lý (sub-agent)**: nhân viên nhỏ ngồi cùng cụm bàn; hết chỗ thì vào phòng họp. Xong việc thì đi thang máy về.
- **Giám đốc** là bạn. Bấm **Hoá thân** để tự đi lại trong văn phòng (chạm vào sàn hoặc W A S D).

Kèm theo: đếm số lần đọc / sửa / chạy lệnh, chi phí API ước tính, dòng thời gian 60 phút, bảng tổng kết, chế độ ngày / đêm, chụp ảnh văn phòng, camera theo phòng (bàn làm việc, phòng họp, phòng máy chủ).

Không cần cài thư viện nào, chỉ cần **Node 18+**.

## Chạy

**Windows:** bấm đúp `start-windows.bat`. Trình duyệt tự mở http://127.0.0.1:4317. Giữ cửa sổ đen đó mở trong lúc dùng.

**Mac / Linux:**

```bash
cd my-office
node server.js
# mở http://127.0.0.1:4317
```

Server đọc transcript trong `~/.claude/projects/**/*.jsonl` (các phiên có hoạt động trong 24 giờ qua) và đẩy trạng thái lên trình duyệt mỗi 1,5 giây. Chưa có phiên nào thì cứ mở terminal chạy `claude`, nhân viên mới sẽ bước ra từ thang máy.

Muốn xem thử với dữ liệu giả lập: `http://127.0.0.1:4317/?demo`, hoặc mở thẳng file `dist/my-office.html`.

### Biến môi trường

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `OFFICE_PORT` | `4317` | Cổng web |
| `OFFICE_HOST` | `127.0.0.1` | Chỉ nghe trên máy bạn. Đừng mở ra mạng ngoài vì ai vào được trang là duyệt được lệnh. |
| `CLAUDE_PROJECTS_DIR` | `~/.claude/projects` | Nơi Claude Code lưu transcript |
| `OFFICE_LOOKBACK_HOURS` | `24` | Hiện các phiên hoạt động trong bao nhiêu giờ |

## Duyệt quyền ngay trong văn phòng

Thêm hook `PermissionRequest` vào `~/.claude/settings.json` (sửa lại đường dẫn):

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node /đường/dẫn/tới/my-office/hooks/office-approve.js",
            "timeout": 130
          }
        ]
      }
    ]
  }
}
```

Trên Windows, viết đường dẫn bằng dấu `/`, ví dụ `node C:/Users/ten/Downloads/PST/my-office/hooks/office-approve.js`.

Cách hoạt động: khi Claude xin quyền, hook gửi yêu cầu lên server rồi chờ tối đa 2 phút (`OFFICE_WAIT_MS`). Bạn bấm **Duyệt** hay **Từ chối** trên web, hook trả kết quả về Claude Code. Nếu server không chạy hoặc hết thời gian chờ, hook thoát im lặng và terminal hỏi bạn như bình thường, nên không bao giờ bị kẹt.

## Chi phí ước tính

Tính từ số token trong transcript theo bảng `PRICING` ở đầu `server.js` (USD / 1 triệu token, có tính cache read 0,1× và cache write 1,25×). Đây là con số tham khảo, hãy chỉnh bảng giá cho khớp gói bạn dùng. Nếu bạn dùng gói Pro / Max thì đây là "giá nếu trả theo API", không phải số tiền bị trừ.

## Cấu trúc

```
server.js                 server HTTP + SSE, đọc transcript, quản lý yêu cầu duyệt
hooks/office-approve.js   hook PermissionRequest cho Claude Code
public/index.html         khung giao diện
public/style.css          giao diện (tự theo sáng / tối của hệ thống)
public/office.js          engine vẽ văn phòng isometric bằng Canvas 2D
public/app.js             hai bảng bên, bộ lọc, hộp thoại, kết nối dữ liệu
public/demo.js            bộ giả lập 6 phiên mẫu
scripts/build-artifact.js gộp tất cả thành dist/my-office.html
```
