# zip-ingest: nạp file zip khổng lồ vào second brain trong Claude

Dùng khi bạn có một file zip rất lớn (ví dụ 134GB) mà **cả hai máy đều không đủ chỗ** để giải nén, thậm chí không đủ chỗ để copy.

## Cách hoạt động

```
[Máy A: data.zip 134GB] --LAN share--> [Máy B: ingest.py] --> brain/ (chỉ text, vài GB)
                                          | lấy ra 1 file -> chuyển thành .md -> xoá file tạm
```

- Zip có mục lục ở cuối file, nên script đọc được **từng file một**. Không cần giải nén hết, không cần copy file zip.
- Chỗ trống cần có = **file lớn nhất bên trong zip** + phần text đầu ra.
- Có thể chạy ngay trên máy A nếu không muốn dùng mạng LAN.
- Dừng lúc nào cũng được (Ctrl+C). Chạy lại đúng lệnh cũ thì script làm tiếp từ chỗ dừng.

| Loại file | Xử lý |
|---|---|
| pdf, docx/doc, xlsx/xls, pptx/ppt, html, epub, msg, rtf, odt, ipynb | chuyển sang Markdown bằng `markitdown` |
| txt, md, csv, json, xml, log, code... | đọc thẳng (tự nhận UTF-8, UTF-16, cp1258) |
| eml | lấy tiêu đề, người gửi, nội dung, danh sách đính kèm |
| pst / ost (Outlook) | cần `readpst`; mỗi email thành 1 file `.md` |
| zip lồng trong zip | xử lý đệ quy |
| ảnh, video, nhạc, exe, iso... | **không chuyển**, chỉ ghi tên vào mục lục để Claude biết nó tồn tại |

## Bước 1: Cài đặt (trên máy chạy script)

```bash
pip install -r requirements.txt
# Nếu trong zip có file Outlook .pst:
#   Ubuntu/WSL: sudo apt install pst-utils     macOS: brew install libpst
```

## Bước 2: Chia sẻ file zip qua mạng LAN (nếu chạy từ máy khác)

Trên máy A (Windows): chuột phải thư mục chứa zip → Properties → Sharing → Share.
Trên máy B, đường dẫn sẽ có dạng `\\TEN-MAY-A\TenShare\data.zip`.

## Bước 3: Quét thử trước (không ghi gì)

```bash
python ingest.py "\\\\TEN-MAY-A\\TenShare\\data.zip" ./brain --dry-run
```
Bước này cho biết bao nhiêu file sẽ được chuyển và bao nhiêu file bị bỏ qua (media...). Nếu cần, bạn lọc thêm:

```bash
--exclude "Backup/" --exclude "\.bak$"     # bỏ thư mục hoặc đuôi không cần
--include "^TaiLieu/"                       # chỉ lấy một nhánh thư mục
--name-encoding cp1258                      # khi tên file tiếng Việt bị lỗi font
--temp-dir E:\tmp                           # đặt file tạm ở ổ còn trống nhiều nhất
--max-output-mb 2000                        # dừng khi đầu ra đạt 2GB (chạy lại để tiếp tục)
```

## Bước 4: Chạy thật

```bash
python ingest.py "\\\\TEN-MAY-A\\TenShare\\data.zip" ./brain
```

Kết quả:
```
brain/
  INDEX.md        <- bản đồ toàn kho: thư mục, loại file, dung lượng, trạng thái
  _state.jsonl    <- danh sách TỪNG file (kể cả file bị bỏ qua) + lỗi nếu có
  docs/...        <- text Markdown, giữ nguyên cấu trúc thư mục gốc
```

## Bước 5: Đưa vào Claude

Claude không nhận 134GB, nhưng kết quả sau khi lọc chỉ còn vài GB text. Có 3 cách, nên kết hợp:

1. **Google Drive (hợp nhất cho kho lớn).** Đặt thư mục `brain/` trong Google Drive (Drive for desktop chế độ *Stream files* nên tốn rất ít ổ cứng). Trong Claude, bật connector Google Drive, Claude sẽ tìm và đọc file khi bạn hỏi.
2. **Claude Project (Project knowledge).** Upload `INDEX.md` cùng những tài liệu quan trọng nhất. Project knowledge có giới hạn dung lượng, nên đừng upload toàn bộ `docs/`.
3. **Repo GitHub này (cho Claude Code).** Commit `brain/` vào một thư mục của repo, Claude Code đọc và tìm kiếm được trực tiếp. Lưu ý: GitHub chặn file trên 100MB, repo nên dưới vài GB, và đừng đưa dữ liệu nhạy cảm vào repo public.

Gợi ý: mỗi khi hỏi Claude, hãy bảo nó *"đọc INDEX.md trước"* để nó biết dữ liệu nào nằm ở đâu.
