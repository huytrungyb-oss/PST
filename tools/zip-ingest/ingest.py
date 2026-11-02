#!/usr/bin/env python3
"""
zip-ingest: đưa một file ZIP khổng lồ vào "second brain" của Claude
MÀ KHÔNG cần giải nén toàn bộ và KHÔNG cần copy file zip về máy.

Nguyên lý:
  - Đọc mục lục (central directory) của zip -> biết mọi file bên trong.
  - Lấy ra TỪNG file một vào thư mục tạm, chuyển thành Markdown, rồi xoá ngay.
  - Chỉ giữ lại text (thường chỉ vài % dung lượng gốc).
  - File không chuyển được (video, ảnh, exe...) vẫn được ghi vào mục lục
    để Claude biết nó tồn tại.
  - Có thể dừng giữa chừng và chạy lại: file đã xử lý sẽ được bỏ qua.

Dùng:
  python ingest.py "\\\\MAY-KIA\\share\\data.zip" ./brain
  python ingest.py data.zip ./brain --dry-run          # chỉ xem thống kê
  python ingest.py data.zip ./brain --max-output-mb 500 # dừng khi đủ 500MB

Chỗ trống cần có trên máy chạy script = file lớn nhất trong zip + phần text đầu ra.
"""
from __future__ import annotations

import argparse
import email
import email.policy
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from pathlib import Path, PurePosixPath

# ---------------------------------------------------------------- loại file

TEXT_EXT = {
    ".txt", ".md", ".markdown", ".rst", ".log", ".csv", ".tsv", ".json", ".jsonl",
    ".xml", ".yaml", ".yml", ".ini", ".cfg", ".conf", ".toml", ".sql", ".tex",
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".h", ".cpp", ".hpp",
    ".cs", ".go", ".rs", ".php", ".rb", ".sh", ".bat", ".ps1", ".css", ".scss",
    ".vb", ".kt", ".swift", ".r", ".m", ".srt", ".vtt",
}
# markitdown xử lý được các loại này
MARKITDOWN_EXT = {
    ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".xlsm", ".pptx", ".ppt",
    ".html", ".htm", ".epub", ".msg", ".rtf", ".odt", ".ods", ".odp", ".ipynb",
}
EMAIL_EXT = {".eml"}
PST_EXT = {".pst", ".ost"}
ARCHIVE_EXT = {".zip"}
# không có text đáng giá -> chỉ ghi vào mục lục
SKIP_EXT = {
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff", ".webp", ".heic",
    ".raw", ".cr2", ".nef", ".psd", ".ai", ".svg", ".ico",
    ".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".m4v", ".webm", ".3gp",
    ".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg", ".wma",
    ".exe", ".dll", ".msi", ".iso", ".img", ".dmg", ".bin", ".sys", ".so",
    ".rar", ".7z", ".gz", ".tar", ".bz2", ".xz", ".cab",
    ".ttf", ".otf", ".woff", ".woff2", ".db", ".sqlite", ".mdb", ".accdb",
    ".dwg", ".dxf", ".skp", ".max", ".blend", ".obj", ".fbx",
}


def human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024 or unit == "TB":
            return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}TB"


# ---------------------------------------------------------------- tên file

def fix_name(info: zipfile.ZipInfo, name_encoding: str | None) -> str:
    """Zip tạo trên Windows cũ hay lưu tên bằng codepage -> tiếng Việt bị lỗi font."""
    name = info.filename
    if name_encoding and not (info.flag_bits & 0x800):
        try:
            name = name.encode("cp437").decode(name_encoding)
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    return name


_BAD = re.compile(r'[<>:"|?*\x00-\x1f]')


def safe_out_path(root: Path, inner_name: str) -> Path:
    parts = [p for p in PurePosixPath(inner_name.replace("\\", "/")).parts
             if p not in ("", ".", "..", "/")]
    parts = [_BAD.sub("_", p).strip()[:120] or "_" for p in parts]
    p = root.joinpath(*parts) if parts else root / "_"
    return p.with_name(p.name + ".md")


# ---------------------------------------------------------------- chuyển đổi

def decode_bytes(data: bytes) -> str:
    if data.startswith(b"\xef\xbb\xbf"):
        return data[3:].decode("utf-8", "replace")
    if data.startswith((b"\xff\xfe", b"\xfe\xff")):
        return data.decode("utf-16", "replace")
    for enc in ("utf-8", "cp1258", "cp1252"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("latin-1", "replace")


_md = None


def markitdown_convert(path: str) -> str:
    global _md
    if _md is None:
        from markitdown import MarkItDown  # pip install 'markitdown[all]'
        _md = MarkItDown()
    return _md.convert(path).text_content or ""


def eml_to_md(data: bytes) -> str:
    msg = email.message_from_bytes(data, policy=email.policy.default)
    head = [f"- **{h}:** {msg[h]}" for h in ("From", "To", "Cc", "Date", "Subject") if msg[h]]
    body_part = msg.get_body(preferencelist=("plain", "html"))
    body = ""
    if body_part is not None:
        try:
            body = body_part.get_content()
        except Exception:
            body = decode_bytes(body_part.get_payload(decode=True) or b"")
        if body_part.get_content_type() == "text/html":
            body = re.sub(r"<[^>]+>", " ", body)
            body = re.sub(r"[ \t]+", " ", body)
    attachments = [a.get_filename() for a in msg.iter_attachments() if a.get_filename()]
    out = "\n".join(head) + "\n\n" + body.strip()
    if attachments:
        out += "\n\n**Đính kèm:** " + ", ".join(attachments)
    return out


def pst_to_md(path: str, out_dir: Path, rel: str, cap: int) -> int:
    """Cần `readpst` (gói pst-utils / libpst). Xuất mỗi email thành 1 file .md."""
    if not shutil.which("readpst"):
        raise RuntimeError("thiếu readpst (cài: apt install pst-utils / brew install libpst)")
    written = 0
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["readpst", "-e", "-q", "-o", tmp, path], check=True)
        for eml in Path(tmp).rglob("*.eml"):
            md = eml_to_md(eml.read_bytes())[:cap]
            target = safe_out_path(out_dir, rel + "/" + str(eml.relative_to(tmp)))
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(md, encoding="utf-8")
            written += len(md.encode("utf-8"))
    return written


# ---------------------------------------------------------------- lõi

class Ingestor:
    def __init__(self, args):
        self.a = args
        self.out = Path(args.output).resolve()
        self.docs = self.out / "docs"
        self.state_path = self.out / "_state.jsonl"
        self.done: set[str] = set()
        self.written = 0
        self.stats: dict[str, list[int]] = {}  # status -> [count, bytes]
        self.cap = args.max_chars_per_file
        if self.state_path.exists():
            for line in self.state_path.open(encoding="utf-8"):
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue
                self.done.add(rec["path"])
                self.written += rec.get("out_bytes", 0)

    def log(self, rec: dict):
        if self.a.dry_run:
            return
        with self.state_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    def bump(self, status: str, size: int):
        s = self.stats.setdefault(status, [0, 0])
        s[0] += 1
        s[1] += size

    def classify(self, ext: str, size: int) -> str:
        if ext in SKIP_EXT:
            return "skip"
        if ext in PST_EXT:
            return "pst"
        if ext in ARCHIVE_EXT:
            return "zip"
        if ext in EMAIL_EXT:
            return "eml"
        if ext in MARKITDOWN_EXT:
            return "doc"
        if ext in TEXT_EXT:
            return "text"
        return "unknown"

    def run_zip(self, zf: zipfile.ZipFile, prefix: str = ""):
        infos = [i for i in zf.infolist() if not i.is_dir()]
        total = len(infos)
        t0 = time.time()
        for n, info in enumerate(infos, 1):
            name = prefix + fix_name(info, self.a.name_encoding)
            if name in self.done:
                continue
            if self.a.max_output_mb and self.written > self.a.max_output_mb * 1024 * 1024:
                print(f"\nĐã đạt giới hạn {self.a.max_output_mb}MB đầu ra. Chạy lại để tiếp tục.")
                raise KeyboardInterrupt
            ext = PurePosixPath(name).suffix.lower()
            kind = self.classify(ext, info.file_size)
            if self.a.include and not any(re.search(p, name, re.I) for p in self.a.include):
                kind = "excluded"
            if self.a.exclude and any(re.search(p, name, re.I) for p in self.a.exclude):
                kind = "excluded"
            if kind not in ("skip", "excluded", "unknown") and info.file_size > self.a.max_file_mb * 1024 * 1024:
                kind = "too_big"
            if kind == "unknown" and info.file_size > 5 * 1024 * 1024:
                kind = "skip"

            rec = {"path": name, "size": info.file_size, "kind": kind,
                   "mtime": "%04d-%02d-%02d" % info.date_time[:3]}
            if self.a.dry_run or kind in ("skip", "excluded", "too_big"):
                rec["status"] = kind if kind in ("skip", "excluded", "too_big") else "would_convert"
                self.bump(rec["status"], info.file_size)
                self.log(rec)
                continue

            try:
                rec["out_bytes"] = self.convert(zf, info, name, kind)
                rec["status"] = "archive_done" if kind == "zip" else ("ok" if rec["out_bytes"] else "empty")
            except KeyboardInterrupt:
                raise
            except Exception as e:  # một file lỗi không được làm dừng cả 134GB
                rec["status"] = "error"
                rec["error"] = f"{type(e).__name__}: {e}"[:300]
            self.written += rec.get("out_bytes", 0)
            self.bump(rec["status"], info.file_size)
            self.log(rec)
            if n % 50 == 0 or n == total:
                el = time.time() - t0
                print(f"\r{prefix or ''}[{n}/{total}] text đầu ra: {human(self.written)} "
                      f"| {el/60:.1f} phút", end="", flush=True)
        if total:
            print()

    def write_md(self, name: str, info: zipfile.ZipInfo, body: str) -> int:
        body = body.strip()
        if not body:
            return 0
        truncated = len(body) > self.cap
        body = body[: self.cap]
        header = (f"---\nsource: \"{name}\"\nsize: {info.file_size}\n"
                  f"modified: {'%04d-%02d-%02d' % info.date_time[:3]}\n"
                  f"truncated: {str(truncated).lower()}\n---\n\n# {PurePosixPath(name).name}\n\n")
        target = safe_out_path(self.docs, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        data = (header + body + "\n").encode("utf-8")
        target.write_bytes(data)
        return len(data)

    def convert(self, zf, info, name, kind) -> int:
        if kind in ("text", "eml", "unknown"):
            with zf.open(info) as f:
                data = f.read(self.cap * 4 + 4)
            if kind == "unknown":
                if b"\x00" in data[:4096]:
                    return 0  # nhị phân -> bỏ
                kind = "text"
            text = eml_to_md(data) if kind == "eml" else decode_bytes(data)
            if PurePosixPath(name).suffix.lower() not in (".md", ".markdown", ".txt", ".eml"):
                text = f"```\n{text[: self.cap]}\n```"
            return self.write_md(name, info, text)

        # các loại cần file thật trên đĩa: lấy ra đúng 1 file vào thư mục tạm
        with tempfile.TemporaryDirectory(dir=self.a.temp_dir) as tmp:
            local = Path(tmp) / ("x" + PurePosixPath(name).suffix.lower())
            with zf.open(info) as src, local.open("wb") as dst:
                shutil.copyfileobj(src, dst, 1024 * 1024)
            if kind == "doc":
                return self.write_md(name, info, markitdown_convert(str(local)))
            if kind == "pst":
                return pst_to_md(str(local), self.docs, name, self.cap)
            if kind == "zip":
                with zipfile.ZipFile(local) as inner:
                    self.run_zip(inner, prefix=name + "/")
                return 0
        return 0

    def write_index(self):
        """INDEX.md: bản đồ toàn bộ kho để Claude định hướng trước khi đọc chi tiết."""
        if not self.state_path.exists():
            return
        latest: dict[str, dict] = {}
        for line in self.state_path.open(encoding="utf-8"):
            try:
                rec = json.loads(line)
                latest[rec["path"]] = rec
            except (json.JSONDecodeError, KeyError):
                continue
        folders: dict[str, dict] = {}
        by_status: dict[str, list[int]] = {}
        by_ext: dict[str, list[int]] = {}
        for rec in latest.values():
            parts = PurePosixPath(rec["path"]).parts
            top = "/".join(parts[: self.a.index_depth]) if len(parts) > 1 else "(gốc)"
            f = folders.setdefault(top, {"n": 0, "size": 0, "ok": 0, "ext": {}})
            f["n"] += 1
            f["size"] += rec.get("size", 0)
            f["ok"] += rec.get("status") == "ok"
            ext = PurePosixPath(rec["path"]).suffix.lower() or "(không đuôi)"
            f["ext"][ext] = f["ext"].get(ext, 0) + 1
            s = by_status.setdefault(rec.get("status", "?"), [0, 0])
            s[0] += 1
            s[1] += rec.get("size", 0)
            e = by_ext.setdefault(ext, [0, 0])
            e[0] += 1
            e[1] += rec.get("size", 0)

        lines = ["# INDEX — bản đồ kho dữ liệu", "",
                 f"Nguồn: `{self.a.zip}`  ", f"Cập nhật: {time.strftime('%Y-%m-%d %H:%M')}  ",
                 f"Tổng số file: {len(latest)} — dung lượng gốc {human(sum(r.get('size', 0) for r in latest.values()))}",
                 "", "Nội dung đã chuyển thành text nằm trong `docs/`, giữ nguyên cấu trúc thư mục gốc.",
                 "Danh sách đầy đủ từng file (kể cả file bị bỏ qua) nằm trong `_state.jsonl`.", "",
                 "## Trạng thái", "", "| Trạng thái | Số file | Dung lượng gốc |", "|---|---:|---:|"]
        for k, (c, sz) in sorted(by_status.items(), key=lambda x: -x[1][0]):
            lines.append(f"| {k} | {c} | {human(sz)} |")
        lines += ["", "## Loại file (top 30)", "", "| Đuôi | Số file | Dung lượng |", "|---|---:|---:|"]
        for k, (c, sz) in sorted(by_ext.items(), key=lambda x: -x[1][1])[:30]:
            lines.append(f"| {k} | {c} | {human(sz)} |")
        lines += ["", "## Thư mục", "", "| Thư mục | Số file | Đã có text | Dung lượng | Loại chính |",
                  "|---|---:|---:|---:|---|"]
        for k, f in sorted(folders.items(), key=lambda x: -x[1]["size"]):
            top_ext = ", ".join(e for e, _ in sorted(f["ext"].items(), key=lambda x: -x[1])[:4])
            lines.append(f"| `{k}` | {f['n']} | {f['ok']} | {human(f['size'])} | {top_ext} |")
        (self.out / "INDEX.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    p = argparse.ArgumentParser(description="Nạp file zip lớn vào second brain, không cần giải nén toàn bộ.")
    p.add_argument("zip", help="đường dẫn file zip (có thể là \\\\MAY\\share\\file.zip)")
    p.add_argument("output", help="thư mục đầu ra (vd: thư mục Google Drive hoặc repo git)")
    p.add_argument("--dry-run", action="store_true", help="chỉ quét và thống kê, không chuyển đổi")
    p.add_argument("--include", action="append", help="regex: chỉ xử lý đường dẫn khớp (lặp được)")
    p.add_argument("--exclude", action="append", help="regex: bỏ qua đường dẫn khớp (lặp được)")
    p.add_argument("--max-file-mb", type=float, default=2048,
                   help="bỏ qua file trong zip lớn hơn mức này (mặc định 2048MB)")
    p.add_argument("--max-chars-per-file", type=int, default=300_000,
                   help="cắt bớt text mỗi file (mặc định 300k ký tự)")
    p.add_argument("--max-output-mb", type=float, default=0,
                   help="dừng khi text đầu ra vượt mức này (0 = không giới hạn)")
    p.add_argument("--name-encoding", default=None,
                   help="sửa tên file lỗi font, vd: cp1258 hoặc cp1252")
    p.add_argument("--temp-dir", default=None, help="thư mục tạm (chọn ổ còn trống nhiều nhất)")
    p.add_argument("--index-depth", type=int, default=2, help="độ sâu thư mục trong INDEX.md")
    a = p.parse_args()

    Path(a.output).mkdir(parents=True, exist_ok=True)
    ing = Ingestor(a)
    if ing.done:
        print(f"Tiếp tục: đã xử lý {len(ing.done)} file trước đó, bỏ qua chúng.")
    try:
        with zipfile.ZipFile(a.zip) as zf:
            infos = [i for i in zf.infolist() if not i.is_dir()]
            print(f"Zip có {len(infos)} file, tổng {human(sum(i.file_size for i in infos))} khi giải nén.")
            ing.run_zip(zf)
    except KeyboardInterrupt:
        print("\nĐã dừng. Chạy lại đúng lệnh này để tiếp tục.")
    finally:
        print("\nTổng kết lượt chạy này:")
        for k, (c, sz) in sorted(ing.stats.items(), key=lambda x: -x[1][0]):
            print(f"  {k:<14} {c:>8} file  {human(sz):>10}")
        print(f"  text đầu ra (luỹ kế): {human(ing.written)}")
        if a.dry_run:
            print("\n(dry-run: chưa ghi gì. Bỏ --dry-run để chạy thật.)")
        else:
            ing.write_index()
            print(f"Đã ghi {Path(a.output) / 'INDEX.md'}")


if __name__ == "__main__":
    main()
