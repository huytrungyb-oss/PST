# Đặc tả API v1 – VNPT Content Hub (MBG) cho MVNO

*Phiên bản: 1.0 (dự thảo) · Ngày: 04/11/2026 · Đơn vị: VNPT-Media (VNPT VAS) · Tài liệu gốc: [Nghiên cứu MVNE – Content Hub](nghien-cuu-mvne-content-hub-mbg.md)*

---

## 1. Phạm vi và nguyên tắc

### 1.1. Phạm vi
Tài liệu quy định giao diện kết nối giữa **hệ thống của MVNO** và **MBG (Media Bundle Gateway) – VNPT Content Hub** để cấp, gia hạn, thu hồi và tra cứu quyền lợi nội dung, cùng quy trình và định dạng file đối soát.

### 1.2. Nguyên tắc
1. **MVNO tự trừ cước** trên OCS/BSS riêng: bán hàng, trừ cước, gia hạn, retry khi thiếu tiền, hoàn cước, gửi MT tới thuê bao đều do MVNO thực hiện.
2. **MBG chỉ cấp quyền lợi nội dung** theo 2 hình thức: **theo chu kỳ (CYCLE)** và **theo lượt (USAGE)**. MBG không trừ cước, không cộng data.
3. MVNO **chỉ gọi API cấp quyền sau khi đã trừ cước thành công**. Mọi lệnh mang `txn_id` duy nhất của MVNO; MBG xử lý **idempotent** theo `txn_id`.
4. Thuê bao được định danh bằng **`sub_token`** (số điện thoại đã mã hoá HMAC). MBG và CP **không nhận số điện thoại dạng rõ**.
5. Quyền lợi theo chu kỳ có `expire_at`; nếu quá `expire_at` **7 ngày** (ân hạn) mà không nhận `renew`, MBG **tự thu hồi**.
6. **Giả định**: toàn bộ CP kích hoạt quyền lợi bằng license/mã, không cần số điện thoại. Ngoại lệ dùng trường `msisdn_enc_for_cp` (mục 3.4).

### 1.3. Thuật ngữ

| Thuật ngữ | Ý nghĩa |
|---|---|
| Tenant | Một MVNO kết nối vào MBG, có `tenant_id` riêng (ví dụ `POTTEL`, `ITEL`, `WINTEL`, `VNSKY`, `LOCAL`) |
| `sub_token` | Mã định danh thuê bao = HMAC-SHA256(khoá tenant, số điện thoại chuẩn hoá) |
| `txn_id` | Mã giao dịch trừ cước duy nhất do MVNO sinh, là khoá idempotency |
| Gói (package) | SKU bán buôn của một nội dung cho một tenant, mã `package_code` |
| Quyền lợi (entitlement) | Quyền dùng nội dung của một `sub_token` với một gói, mã `entitlement_id` do MBG sinh |
| CYCLE | Hình thức theo chu kỳ (ngày/tuần/tháng/năm) |
| USAGE | Hình thức theo lượt (dùng 1 lần) |
| Ân hạn (GRACE) | 7 ngày sau `expire_at`, quyền lợi vẫn còn hiệu lực chờ lệnh `renew` |
| Log MBG | Nhật ký cấp quyền của MBG – căn cứ tính phần A (giá sàn) |
| CDR MVNO | Bản ghi trừ cước của MVNO – căn cứ tính phần B (chia sẻ 70%) |

---

## 2. Kết nối và bảo mật

### 2.1. Môi trường

| Môi trường | Base URL (dự kiến) | Mục đích |
|---|---|---|
| Sandbox | `https://sandbox-contenthub.vnptmedia.vn/v1` | Tích hợp, kiểm thử; CP giả lập |
| Production | `https://contenthub.vnptmedia.vn/v1` | Vận hành thật |

Giao thức: HTTPS, TLS ≥ 1.2, JSON UTF-8, thời gian theo ISO 8601 có múi giờ `+07:00`, số tiền là số nguyên VND.

### 2.2. Xác thực hai lớp
1. **mTLS**: MVNO dùng chứng thư client do VNPT-Media cấp cho từng tenant; MBG từ chối kết nối không có chứng thư hợp lệ. Whitelist IP nguồn của MVNO.
2. **OAuth2 Client Credentials**: `POST /v1/oauth/token` với `client_id`, `client_secret`, `grant_type=client_credentials`. Access token JWT, hiệu lực 3.600 giây, gửi qua `Authorization: Bearer <token>`. Token gắn với `tenant_id`; gọi sai tenant trả `403 / 1003`.

### 2.3. Header bắt buộc

| Header | Bắt buộc | Mô tả |
|---|---|---|
| `Authorization` | Có | `Bearer <access_token>` |
| `X-Tenant-Id` | Có | Mã tenant, phải trùng tenant trong token |
| `X-Request-Id` | Có | UUID v4, duy nhất cho mỗi lần gọi (kể cả gọi lại) – phục vụ truy vết |
| `X-Timestamp` | Có | Unix epoch (giây). Lệch quá ±300 giây so với giờ MBG → `401 / 1004` |
| `X-Signature` | Có | `hex(HMAC-SHA256(signing_key, X-Timestamp + "\n" + METHOD + "\n" + PATH + "\n" + sha256_hex(body)))`; body rỗng dùng sha256 của chuỗi rỗng |
| `Content-Type` | Với POST | `application/json; charset=utf-8` |

Chống replay: MBG lưu `X-Request-Id` trong 10 phút; trùng `X-Request-Id` → `409 / 1005`. (Gọi lại một giao dịch phải dùng **cùng `txn_id`** nhưng **`X-Request-Id` mới**.)

### 2.4. Giới hạn tải theo tenant

| Nhóm API | Giới hạn mặc định | Vượt ngưỡng |
|---|---|---|
| Ghi (`activate`, `renew`, `deactivate`, `grant`) | 200 TPS/tenant, burst 400 | `429 / 1006`, header `Retry-After` |
| Đọc (`GET`) | 100 TPS/tenant | `429 / 1006` |

Giới hạn điều chỉnh theo hợp đồng. Tải của một tenant được cô lập (quota, circuit breaker), không ảnh hưởng tenant khác và luồng VinaPhone.

---

## 3. Chuẩn định danh thuê bao `sub_token`

### 3.1. Công thức
```
msisdn_chuan_hoa = "84" + 9 số (bỏ 0 đầu, bỏ +, bỏ khoảng trắng)   ví dụ 0888000111 → 84888000111
sub_token        = lowercase_hex( HMAC-SHA256( khoa_tenant, msisdn_chuan_hoa ) )   → 64 ký tự [0-9a-f]
```
- `khoa_tenant`: chuỗi bí mật ≥ 32 byte ngẫu nhiên, **do MVNO sinh và giữ**; không gửi cho MBG/CP.
- Cùng thuê bao luôn ra cùng `sub_token` trong một tenant; khác tenant ra mã khác → không ghép được dữ liệu chéo.

### 3.2. Ví dụ Python
```python
import hmac, hashlib, re

def normalize_msisdn(raw: str) -> str:
    d = re.sub(r"\D", "", raw)
    if d.startswith("84"):
        d = d[2:]
    d = d.lstrip("0")
    if len(d) != 9:
        raise ValueError("Số điện thoại không hợp lệ")
    return "84" + d

def sub_token(tenant_key: bytes, raw_msisdn: str) -> str:
    return hmac.new(tenant_key, normalize_msisdn(raw_msisdn).encode(), hashlib.sha256).hexdigest()

# Khoá demo (chỉ dùng cho tài liệu): b"demo-key-POTTEL-2026"
print(sub_token(b"demo-key-POTTEL-2026", "0888 000 111"))
# 2e940534772aee4811e699f5e697c41753ccdb3b6ef8c71728ca52de0a3c3631
```

### 3.3. Đổi khoá (key rotation)
1. MVNO sinh khoá mới, thông báo VNPT-Media trước **30 ngày** ngày chuyển đổi, kèm `key_version` mới.
2. MVNO gửi file ánh xạ `old_sub_token,new_sub_token` cho toàn bộ thuê bao đang có quyền lợi (ACTIVE/GRACE) qua SFTP. MBG cập nhật ánh xạ trong cửa sổ bảo trì đã thống nhất.
3. Trong **giai đoạn song song 7 ngày**, mọi request gửi kèm `key_version`; MBG chấp nhận cả `sub_token` theo khoá cũ và mới, tự quy đổi qua bảng ánh xạ.
4. Hết giai đoạn song song, MBG chỉ chấp nhận `key_version` mới; request khoá cũ trả `400 / 2003`.
5. CP chỉ nhìn thấy `entitlement_id`/license, nên đổi khoá **không ảnh hưởng CP**.

### 3.4. Ngoại lệ CP cần số điện thoại
Theo giả định, không CP nào cần số điện thoại. Nếu phát hiện ngoại lệ khi tích hợp CP, MVNO gửi thêm trường tuỳ chọn:
- `msisdn_enc_for_cp`: số điện thoại chuẩn hoá được mã hoá **RSA-OAEP-SHA256 bằng khoá công khai của CP đó** (base64). MBG **chỉ chuyển tiếp**, không giải mã, không lưu sau khi CP xác nhận.
- Gói thuộc CP ngoại lệ có cờ `requires_msisdn_for_cp = true` trong `GET /v1/catalog`; thiếu trường này → `400 / 2004`.

---

## 4. Máy trạng thái quyền lợi

### 4.1. Theo chu kỳ (CYCLE)

```
               activate (OK)                     now > expire_at
   (không có) ─────────────► ACTIVE ──────────────────────────────► GRACE (7 ngày)
                               ▲  │                                   │   │
                    renew (OK) │  │ deactivate                        │   │ now > expire_at + 7 ngày
                               │  ▼                                   │   ▼
                               │ REVOKED ◄────── deactivate ──────────┘  EXPIRED
                               └─────────────── renew (OK) ───────────┘   (MBG tự thu hồi,
                                                                           webhook entitlement.expired_auto)
   REVOKED / EXPIRED ──activate (txn_id mới)──► ACTIVE (quyền lợi mới)
```

| Trạng thái hiện tại | Sự kiện | Trạng thái mới | Hành động MBG |
|---|---|---|---|
| (không có) | `activate` thành công | ACTIVE | Kích hoạt tại CP, trả license |
| ACTIVE | `renew` thành công | ACTIVE | Gia hạn `expire_at` tại CP |
| ACTIVE | `now > expire_at` | GRACE | Giữ quyền lợi tại CP, không gửi gì |
| GRACE | `renew` thành công | ACTIVE | Gia hạn; `valid_from` của kỳ mới = thời điểm `renew` (`charged_at`) |
| GRACE | `now > expire_at + 7 ngày` | EXPIRED | Thu hồi tại CP, webhook `entitlement.expired_auto` |
| ACTIVE / GRACE | `deactivate` | REVOKED | Thu hồi tại CP |
| ACTIVE / GRACE | CP thu hồi/lỗi | REVOKED | Webhook `entitlement.revoked` hoặc `cp.error` |
| REVOKED / EXPIRED | `renew` | (giữ nguyên) | Từ chối `409 / 3002` – MVNO phải gọi `activate` |
| REVOKED / EXPIRED | `activate` | ACTIVE | Tạo quyền lợi mới (`entitlement_id` mới) |

Một `sub_token` chỉ có **tối đa 1 quyền lợi ACTIVE/GRACE cho mỗi `package_code`**; `activate` trùng → `409 / 3001`.

### 4.2. Theo lượt (USAGE)

| Trạng thái | Ý nghĩa |
|---|---|
| GRANTED | Đã cấp mã/link, chưa dùng (nếu CP báo được) |
| USED | CP xác nhận đã dùng |
| EXPIRED | Quá `expire_at` của mã/link (mặc định 24 giờ, cấu hình theo gói) |
| FAILED | Cấp không thành công – **không tính tiền**, MVNO hoàn cước |

---

## 5. Danh sách API

| # | Method | Path | Chức năng |
|---|---|---|---|
| 1 | POST | `/v1/oauth/token` | Lấy access token |
| 2 | GET | `/v1/catalog` | Danh mục gói của tenant |
| 3 | POST | `/v1/subscriptions/activate` | Kích hoạt quyền lợi theo chu kỳ |
| 4 | POST | `/v1/subscriptions/renew` | Gia hạn kỳ mới |
| 5 | POST | `/v1/subscriptions/deactivate` | Thu hồi (khách huỷ / MVNO hết retry) |
| 6 | GET | `/v1/subscriptions/{sub_token}` | Tra cứu quyền lợi của thuê bao |
| 7 | POST | `/v1/usage/grant` | Cấp quyền theo lượt |
| 8 | GET | `/v1/usage/{txn_id}` | Tra cứu giao dịch theo lượt |

### 5.0. Cấu trúc phản hồi chung

```json
{
  "request_id": "6f1d6a3e-2b8c-4b7f-9c1a-1f0e2d3c4b5a",
  "code": "0000",
  "message": "Thành công",
  "data": { }
}
```
`code = "0000"` là thành công; mã khác xem mục 7.

### 5.1. `GET /v1/catalog`

Trả các gói tenant được phép bán. Tham số tuỳ chọn: `type=CYCLE|USAGE`, `status=ACTIVE|DISCONTINUED`.

```json
{
  "request_id": "…", "code": "0000", "message": "Thành công",
  "data": {
    "packages": [
      {
        "package_code": "ICM30", "name": "iCallme Premium 30 ngày", "cp_code": "ICALLME",
        "type": "CYCLE", "cycle_unit": "DAY", "cycle_length": 30,
        "floor_price": 15000, "share_rate": 0.70,
        "suggested_retail_price": 30000,
        "requires_msisdn_for_cp": false,
        "status": "ACTIVE", "effective_from": "2026-12-01T00:00:00+07:00", "effective_to": null
      },
      {
        "package_code": "VSU5", "name": "vnStudy 1 bài học", "cp_code": "VNSTUDY",
        "type": "USAGE", "usage_valid_hours": 24,
        "floor_price": 3000, "share_rate": 0.70,
        "suggested_retail_price": 5000,
        "requires_msisdn_for_cp": false,
        "status": "ACTIVE", "effective_from": "2026-12-01T00:00:00+07:00", "effective_to": null
      }
    ]
  }
}
```
`floor_price` (giá sàn) và `share_rate` (tỷ lệ chia sẻ) dùng cho đối soát; giá bán lẻ do MVNO tự quyết.

### 5.2. `POST /v1/subscriptions/activate`

**Request**
```json
{
  "txn_id": "PT20261201000001",
  "sub_token": "2e940534772aee4811e699f5e697c41753ccdb3b6ef8c71728ca52de0a3c3631",
  "key_version": 1,
  "package_code": "ICM30",
  "charged_amount": 30000,
  "charged_at": "2026-12-01T08:15:02+07:00",
  "channel": "SMS",
  "expire_at": "2026-12-31T08:15:01+07:00",
  "msisdn_enc_for_cp": null
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `txn_id` | string(≤40) | Có | Mã giao dịch trừ cước của MVNO, duy nhất trong tenant; khoá idempotency |
| `sub_token` | string(64) | Có | Mục 3 |
| `key_version` | int | Có | Phiên bản khoá HMAC |
| `package_code` | string(≤20) | Có | Mã gói trong catalog, `type = CYCLE` |
| `charged_amount` | int | Có | Số tiền MVNO đã trừ (VND, gồm VAT); có thể 0 nếu khuyến mại – vẫn tính giá sàn |
| `charged_at` | datetime | Có | Thời điểm trừ cước thành công |
| `channel` | enum | Có | `SMS`, `APP`, `WEB`, `USSD`, `POS`, `CSKH`, `OTHER` |
| `expire_at` | datetime | Không | Mặc định = `charged_at` + độ dài chu kỳ − 1 giây; nếu gửi phải khớp ±60 giây |
| `msisdn_enc_for_cp` | string | Có điều kiện | Chỉ khi gói có `requires_msisdn_for_cp = true` (mục 3.4) |

**Response 200**
```json
{
  "request_id": "…", "code": "0000", "message": "Thành công",
  "data": {
    "txn_id": "PT20261201000001",
    "entitlement_id": "ENT-7f3a91c2",
    "status": "ACTIVE",
    "valid_from": "2026-12-01T08:15:02+07:00",
    "expire_at": "2026-12-31T08:15:01+07:00",
    "grace_until": "2027-01-07T08:15:01+07:00",
    "license_code": "ICM-8K2P-Q7XD-41MZ",
    "content_url": "https://www.icallme.vn/activate",
    "content_message": "Ma kich hoat iCallme: ICM-8K2P-Q7XD-41MZ. Tai ung dung tai https://www.icallme.vn/activate. Goi co hieu luc den 31/12/2026.",
    "idempotent_replay": false
  }
}
```
`content_message`: nội dung gợi ý (không dấu, ≤ 320 ký tự) để MVNO gửi MT bằng brandname của MVNO. MVNO có thể tự soạn.

### 5.3. `POST /v1/subscriptions/renew`

**Request**
```json
{
  "txn_id": "PT20261231000777",
  "sub_token": "2e940534772aee4811e699f5e697c41753ccdb3b6ef8c71728ca52de0a3c3631",
  "key_version": 1,
  "package_code": "ICM30",
  "entitlement_id": "ENT-7f3a91c2",
  "charged_amount": 30000,
  "charged_at": "2026-12-31T08:15:05+07:00",
  "channel": "AUTO_RENEW"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `txn_id` | string | Có | Mã giao dịch trừ cước kỳ mới (khác `txn_id` kỳ trước) |
| `sub_token`, `key_version`, `package_code` | | Có | Như `activate` |
| `entitlement_id` | string | Không | Nếu không gửi, MBG tìm quyền lợi ACTIVE/GRACE theo `sub_token` + `package_code` |
| `charged_amount`, `charged_at` | | Có | Như `activate` |
| `channel` | enum | Có | Thường là `AUTO_RENEW` |

Chỉ hợp lệ khi quyền lợi đang **ACTIVE hoặc GRACE**. Kỳ mới: `valid_from = charged_at`, `expire_at = charged_at + chu kỳ − 1 giây`. Response giống `activate` (không có `license_code` mới nếu CP giữ nguyên license).

### 5.4. `POST /v1/subscriptions/deactivate`

```json
{
  "txn_id": "PT20261201000005",
  "sub_token": "2e940534772aee4811e699f5e697c41753ccdb3b6ef8c71728ca52de0a3c3631",
  "key_version": 1,
  "package_code": "ICM30",
  "reason": "USER_CANCEL",
  "requested_at": "2026-12-01T20:40:00+07:00"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `txn_id` | string | Có | Mã yêu cầu huỷ của MVNO (idempotent) |
| `reason` | enum | Có | `USER_CANCEL` (khách huỷ), `RENEW_FAILED` (hết retry), `SUB_TERMINATED` (thuê bao rời mạng/huỷ số), `MVNO_ADMIN` |
| `requested_at` | datetime | Có | Thời điểm phát sinh yêu cầu |

Response: `status = REVOKED`. Huỷ quyền lợi đã REVOKED/EXPIRED trả `0000` với `idempotent_replay = true` (không lỗi). **Lưu ý:** khi thuê bao rời mạng/huỷ số, MVNO **bắt buộc** gọi `deactivate` với `SUB_TERMINATED` trước khi số được cấp lại.

### 5.5. `GET /v1/subscriptions/{sub_token}`

Tham số tuỳ chọn: `package_code`, `status`, `key_version`. Dùng cho CSKH (tổng đài MVNO tự tính `sub_token` từ số khách cung cấp).

```json
{
  "request_id": "…", "code": "0000", "message": "Thành công",
  "data": {
    "sub_token": "2e94…3631",
    "entitlements": [
      {
        "entitlement_id": "ENT-7f3a91c2", "package_code": "ICM30", "status": "REVOKED",
        "valid_from": "2026-12-01T08:15:02+07:00", "expire_at": "2026-12-01T20:40:01+07:00",
        "grace_until": null, "last_txn_id": "PT20261201000005",
        "history": [
          { "txn_id": "PT20261201000001", "action": "ACTIVATE", "result_code": "0000", "at": "2026-12-01T08:15:03+07:00" },
          { "txn_id": "PT20261201000005", "action": "DEACTIVATE", "result_code": "0000", "at": "2026-12-01T20:40:01+07:00" }
        ]
      }
    ]
  }
}
```
Lịch sử trả tối đa 90 ngày; dữ liệu cũ hơn tra qua file đối soát.

### 5.6. `POST /v1/usage/grant`

**Request**
```json
{
  "txn_id": "PT20261201000003",
  "sub_token": "6da409bd7c31ce6526c43f5334a6a9c844d5b9d5329dbb1e0dec4e4c8a7049b8",
  "key_version": 1,
  "package_code": "VSU5",
  "item_id": "LESSON-MATH6-012",
  "charged_amount": 5000,
  "charged_at": "2026-12-01T10:22:45+07:00",
  "channel": "APP"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `txn_id`, `sub_token`, `key_version` | | Có | Như trên |
| `package_code` | string | Có | Gói `type = USAGE` |
| `item_id` | string | Không | Mã nội dung cụ thể (bài học, video…), nếu gói cho chọn |
| `charged_amount`, `charged_at`, `channel` | | Có | Như trên |

**Response 200**
```json
{
  "request_id": "…", "code": "0000", "message": "Thành công",
  "data": {
    "txn_id": "PT20261201000003",
    "usage_id": "USG-9d22e014",
    "status": "GRANTED",
    "access_code": "VS-73KD9Q",
    "content_url": "https://family.vnstudy.vn/redeem?c=VS-73KD9Q",
    "expire_at": "2026-12-02T10:22:45+07:00",
    "content_message": "Ma bai hoc vnStudy: VS-73KD9Q, hieu luc 24 gio. Truy cap https://family.vnstudy.vn/redeem",
    "idempotent_replay": false
  }
}
```
Lỗi cấp (CP lỗi, hết nội dung…) trả mã ở mục 7 với cột "Hoàn cước = Có"; giao dịch ghi `FAILED`, **không tính tiền** (`billable = 0`).

### 5.7. `GET /v1/usage/{txn_id}`

Trả trạng thái giao dịch theo lượt (`GRANTED`, `USED`, `EXPIRED`, `FAILED`) cùng `access_code`, `expire_at`, `result_code`. Dùng sau timeout hoặc cho CSKH.

### 5.8. Idempotency (áp dụng mọi API ghi)

| Tình huống | MBG xử lý |
|---|---|
| `txn_id` mới | Xử lý bình thường |
| Trùng `txn_id`, **cùng nội dung** (sub_token, package_code, action, charged_amount) | Không xử lý lại; trả **đúng kết quả lần đầu**, `idempotent_replay = true`, HTTP 200 |
| Trùng `txn_id`, **khác nội dung** | `409 / 1007` – MVNO kiểm tra lại sinh `txn_id` |
| Lần đầu đang xử lý dở | `409 / 1008` (`IN_PROGRESS`), `Retry-After: 2` |

`txn_id` được giữ để chống trùng **tối thiểu 180 ngày**.

---

## 6. Webhook MBG → MVNO

### 6.1. Cấu hình
MVNO đăng ký một URL HTTPS nhận webhook (qua MVNO Portal hoặc biên bản kỹ thuật) và nhận `webhook_secret` riêng.

### 6.2. Định dạng

```http
POST https://api.mvno.example/contenthub/webhook
X-Event-Id: EVT-20270107-000123
X-Event-Type: entitlement.expired_auto
X-Timestamp: 1799305201
X-Signature: hex(HMAC-SHA256(webhook_secret, X-Timestamp + "\n" + body))
```
```json
{
  "event_id": "EVT-20270107-000123",
  "event_type": "entitlement.expired_auto",
  "tenant_id": "POTTEL",
  "occurred_at": "2027-01-07T09:00:11+07:00",
  "data": {
    "entitlement_id": "ENT-1b0c55e8",
    "sub_token": "5f8b2bc5de4c9d0b27d8c662024e710418d384d8015e78c6f6b96fd8c0f6155e",
    "package_code": "VSF30",
    "expire_at": "2026-12-31T09:00:10+07:00",
    "grace_until": "2027-01-07T09:00:10+07:00",
    "reason": "NO_RENEW_IN_GRACE"
  }
}
```

### 6.3. Loại sự kiện

| `event_type` | Khi nào | MVNO cần làm |
|---|---|---|
| `entitlement.expired_auto` | Quá `expire_at` + 7 ngày không nhận `renew` | Đồng bộ trạng thái; ngừng gia hạn gói này trên OCS |
| `entitlement.revoked` | CP hoặc VNPT-Media thu hồi (vi phạm, khiếu nại, yêu cầu pháp lý) | Đồng bộ trạng thái; ngừng gia hạn; thông báo khách nếu cần |
| `cp.error` | CP lỗi, quyền lợi tạm thời không dùng được quá 30 phút | Thông tin cho CSKH; cân nhắc tạm ngừng bán gói |
| `package.discontinued` | Gói ngừng cung cấp (báo trước tối thiểu 30 ngày, kèm `effective_to`) | Ngừng bán mới; xử lý thuê bao đang dùng theo hợp đồng |

### 6.4. Phản hồi và retry
- MVNO trả **HTTP 2xx trong 5 giây** là thành công; nội dung phản hồi bị bỏ qua.
- Không thành công: MBG gửi lại tối đa **8 lần**, khoảng cách 1, 2, 5, 10, 30, 60, 120, 240 phút. Sau đó đánh dấu `FAILED`, hiển thị trên Portal; MVNO có thể đồng bộ qua `GET /v1/subscriptions/{sub_token}` và file log hằng ngày.
- MVNO **phải xử lý trùng theo `event_id`** (có thể nhận một sự kiện nhiều lần).
- MVNO kiểm tra `X-Signature` và `X-Timestamp` (±300 giây) trước khi xử lý.

---

## 7. Mã lỗi chuẩn

| HTTP | `code` | Ý nghĩa | MVNO có nên hoàn cước? | Gọi lại? |
|---|---|---|---|---|
| 200 | `0000` | Thành công | Không | – |
| 400 | `1001` | Thiếu trường / sai định dạng | **Có** | Không (sửa request) |
| 401 | `1002` | Token không hợp lệ/hết hạn | Chưa – lấy token mới rồi gọi lại | Có |
| 403 | `1003` | Tenant không khớp / không có quyền | **Có** | Không |
| 401 | `1004` | Sai chữ ký hoặc timestamp lệch > 300 giây | Chưa – sửa rồi gọi lại | Có |
| 409 | `1005` | Trùng `X-Request-Id` | Chưa – sinh `X-Request-Id` mới | Có |
| 429 | `1006` | Vượt giới hạn tải | Chưa – chờ `Retry-After` | Có |
| 409 | `1007` | Trùng `txn_id` khác nội dung | Kiểm tra nội bộ | Không |
| 409 | `1008` | Giao dịch đang xử lý | Chưa | Có, cùng `txn_id` |
| 400 | `2001` | `package_code` không tồn tại / không thuộc tenant | **Có** | Không |
| 400 | `2002` | Gói đã ngừng cung cấp | **Có** | Không |
| 400 | `2003` | `sub_token` sai định dạng / `key_version` hết hiệu lực | **Có** | Không |
| 400 | `2004` | Thiếu `msisdn_enc_for_cp` với gói bắt buộc | **Có** | Không |
| 409 | `3001` | Đã có quyền lợi ACTIVE/GRACE cùng gói | **Có** (với `activate`) | Không |
| 409 | `3002` | `renew` khi quyền lợi đã REVOKED/EXPIRED | **Có** – hoặc gọi `activate` thay thế | Không |
| 404 | `3003` | Không tìm thấy quyền lợi để gia hạn/huỷ | **Có** (với `renew`) | Không |
| 502 | `5001` | CP lỗi, không cấp được quyền | **Có** | Có thể, cùng `txn_id`, tối đa 3 lần trong 10 phút |
| 504 | `5002` | CP timeout | Chưa – gọi lại cùng `txn_id` hoặc tra cứu | Có |
| 502 | `5003` | CP hết nội dung/hết license | **Có** | Không |
| 500 | `9000` | Lỗi hệ thống MBG | Chưa – gọi lại cùng `txn_id` | Có |
| 503 | `9001` | MBG bảo trì | Chưa – gọi lại sau | Có |

Nguyên tắc: **chỉ hoàn cước khi MBG trả mã lỗi xác định "Có"** hoặc khi tra cứu sau timeout xác nhận giao dịch `FAILED`/không tồn tại sau 15 phút. Mọi giao dịch lỗi có `billable = 0` trong log MBG, không tính đối soát.

---

## 8. SLA và xử lý timeout

| Chỉ tiêu | Cam kết |
|---|---|
| Độ sẵn sàng API (tháng) | ≥ 99,9% (trừ bảo trì báo trước 3 ngày làm việc, ngoài giờ 0h–5h) |
| Thời gian phản hồi p95 – API ghi | ≤ 1.500 ms (gồm thời gian gọi CP) |
| Thời gian phản hồi p95 – API đọc | ≤ 300 ms |
| Thời gian phản hồi p99 – API ghi | ≤ 3.000 ms |
| Gửi webhook sau sự kiện | ≤ 60 giây |
| File đối soát ngày | Trước 06:00 ngày D+1 |
| Phản hồi sự cố P1 (toàn bộ tenant không cấp được quyền) | ≤ 15 phút, khắc phục/giải pháp tạm ≤ 2 giờ |

**Khuyến nghị cho MVNO:**
- Timeout phía MVNO: kết nối 3 giây, đọc **5 giây**.
- Khi timeout/lỗi mạng/`5002`/`9000`: **gọi lại với cùng `txn_id`** (X-Request-Id mới) theo backoff 2 → 4 → 8 → 16 giây, tối đa 4 lần; nhờ idempotency, không phát sinh cấp trùng.
- Hết số lần gọi lại: tra cứu `GET /v1/usage/{txn_id}` hoặc `GET /v1/subscriptions/{sub_token}`. Nếu sau 15 phút vẫn không có giao dịch → hoàn cước và ghi nhận `charge_result = REFUNDED` trong CDR.
- Không tự gọi `activate` với `txn_id` mới cho cùng một lần trừ cước.

---

## 9. Đối soát

### 9.1. Công thức (theo tháng, theo tenant, theo gói)

```
Phải trả VNPT-Media = MAX( A ; B )
  A = floor_price × qty_mbg
      qty_mbg  = số chu kỳ (ACTIVATE + RENEW) hoặc số lượt (GRANT) thành công, billable = 1, theo log MBG
  B = 70% × mvno_revenue
      mvno_revenue = tổng charged_amount có charge_result = SUCCESS theo CDR MVNO (đã trừ giao dịch REFUNDED)

  Lệch số lượng: diff_pct = |qty_mbg − qty_mvno| / qty_mbg × 100
  diff_pct > 1%  → detail_recon_flag = 1 → đối soát chi tiết theo txn_id trước khi chốt số
```
`floor_price` và `share_rate` lấy theo catalog tại thời điểm `charged_at`. Giá sàn trong tài liệu (15.000đ/chu kỳ, 3.000đ/lượt) là **giả định**, chờ chốt theo từng gói. Số tiền tính bằng VND. Cơ sở thuế (chưa/đã gồm VAT) của giá sàn và doanh thu phần B **theo hợp đồng – term sheet mục 4.3 và 4.5, còn chốt**; số liệu mẫu trong tài liệu này dùng số tiền đã gồm VAT chỉ để minh hoạ.

### 9.2. Quy trình

| Bước | Thời hạn | Bên thực hiện | Nội dung |
|---|---|---|---|
| D1 | 06:00 ngày D+1 | MBG | Đẩy `log_cap_quyen_mbg_<TENANT>_<YYYYMMDD>.csv` lên SFTP thư mục `/outbound/` của tenant |
| D2 | 10:00 ngày D+1 | MVNO | Đẩy `cdr_mvno_<TENANT>_<YYYYMMDD>.csv` lên SFTP `/inbound/` |
| D3 | 12:00 ngày D+1 | MBG | So khớp tự động theo `txn_id`; xuất `lech_<TENANT>_<YYYYMMDD>.csv` gồm giao dịch chỉ có ở một bên hoặc khác số tiền/kết quả; cảnh báo nếu lệch > 1% |
| D4 | Trong 3 ngày làm việc | Hai bên | Xử lý giao dịch lệch ngày (gọi bù API, hoàn cước, ghi chú) |
| M1 | Ngày 05 tháng M+1 | MBG | Xuất `ket_qua_doi_soat_<TENANT>_<YYYYMM>.csv` (bản nháp) |
| M2 | Ngày 10 tháng M+1 | Hai bên | Gói có `detail_recon_flag = 1`: đối soát chi tiết theo `txn_id`; điều chỉnh `qty`/`mvno_revenue` có biên bản |
| M3 | Ngày 15 tháng M+1 | Hai bên | Ký biên bản đối soát; VNPT-Media xuất hoá đơn `amount_payable` |
| M4 | Theo hợp đồng | MVNO | Thanh toán; VNPT-Media phân chia cho CP theo hợp đồng CP hiện hành |

Kênh truyền file: **SFTP** (khoá SSH riêng mỗi tenant) là mặc định; tuỳ chọn API `POST /v1/recon/cdr` (upload) và `GET /v1/recon/files` (tải) ở phiên bản sau. File kèm `<tên file>.sha256` để kiểm tra toàn vẹn.

### 9.3. Định dạng file chung
- CSV, **UTF-8 không BOM**, phân cách dấu phẩy, dòng đầu là header, xuống dòng `LF`.
- Thời gian ISO 8601 `+07:00`; tiền là số nguyên VND; số thập phân dùng dấu chấm.
- Tên file: `<loai>_<TENANT>_<YYYYMMDD|YYYYMM>.csv`; file lớn tách `_<seq>` (ví dụ `_001`), tối đa 1.000.000 dòng/file.
- Ngày D tính theo `charged_at` (CDR) và `processed_at` (log MBG) trong khoảng 00:00:00–23:59:59 giờ Việt Nam; giao dịch rơi lệch ngày được khớp ở cửa sổ ±1 ngày.

### 9.4. `cdr_mvno_<TENANT>_<YYYYMMDD>.csv` (MVNO gửi)

| Cột | Kiểu | Mô tả |
|---|---|---|
| `tenant_id` | string | Mã tenant |
| `txn_id` | string | Mã giao dịch, trùng với `txn_id` đã gọi API |
| `sub_token` | string(64) | Mục 3 |
| `package_code` | string | Mã gói |
| `type` | enum | `CYCLE` / `USAGE` |
| `action` | enum | `ACTIVATE`, `RENEW`, `DEACTIVATE`, `GRANT` |
| `charged_amount` | int | Số tiền trừ (VND, gồm VAT); `DEACTIVATE` = 0 |
| `currency` | string | `VND` |
| `charged_at` | datetime | Thời điểm trừ cước |
| `charge_result` | enum | `SUCCESS`, `REFUNDED` (đã hoàn do MBG lỗi), `FAILED` |
| `channel` | enum | Kênh bán |
| `cycle_start`, `cycle_end` | datetime | Kỳ hiệu lực (chỉ `CYCLE`) |

### 9.5. `log_cap_quyen_mbg_<TENANT>_<YYYYMMDD>.csv` (MBG xuất)

| Cột | Kiểu | Mô tả |
|---|---|---|
| `tenant_id`, `txn_id`, `sub_token`, `package_code`, `type`, `action` | | Như CDR |
| `mbg_entitlement_id` | string | `entitlement_id` (CYCLE) hoặc `usage_id` (USAGE) |
| `result_code` | string | Mã kết quả mục 7 |
| `entitlement_status` | enum | Trạng thái sau xử lý |
| `valid_from`, `expire_at`, `grace_until` | datetime | Hiệu lực |
| `cp_code` | string | CP cung cấp |
| `processed_at` | datetime | Thời điểm MBG xử lý xong |
| `billable` | 0/1 | 1 = tính vào `qty_mbg` (ACTIVATE/RENEW/GRANT thành công) |

### 9.6. `ket_qua_doi_soat_<TENANT>_<YYYYMM>.csv` (MBG xuất, hai bên ký)

| Cột | Mô tả |
|---|---|
| `tenant_id`, `period` | Tenant, kỳ `YYYYMM` |
| `package_code`, `type` | Gói, hình thức; dòng `TOTAL` cộng tổng |
| `floor_price`, `share_rate` | Giá sàn, tỷ lệ chia sẻ (0.70) |
| `qty_mbg` | Số chu kỳ/lượt `billable = 1` theo log MBG |
| `qty_mvno` | Số giao dịch `SUCCESS` (ACTIVATE/RENEW/GRANT) theo CDR MVNO |
| `diff_qty`, `diff_pct` | Chênh lệch tuyệt đối, % (làm tròn 2 số) |
| `detail_recon_flag` | 1 nếu `diff_pct` > 1 |
| `mvno_revenue` | Doanh thu theo CDR MVNO |
| `amount_a_floor` | A = `floor_price` × `qty_mbg` |
| `amount_b_share` | B = `share_rate` × `mvno_revenue` |
| `amount_payable` | MAX(A; B) |
| `payable_basis` | `A` hoặc `B` |

### 9.7. File mẫu
Thư mục [`mau-doi-soat/`](mau-doi-soat/):
- `cdr_mvno_POTTEL_20261201.csv` – CDR ngày của MVNO.
- `log_cap_quyen_mbg_POTTEL_20261201.csv` – log cấp quyền ngày của MBG (khớp từng `txn_id` với CDR; giao dịch `PT20261201000004` CP lỗi `5003` → MVNO hoàn cước, `billable = 0`).
- `ket_qua_doi_soat_POTTEL_202612.csv` – kết quả tháng (số liệu giả định):

| Gói | qty MBG | qty MVNO | Lệch | Doanh thu MVNO | A | B (70%) | Phải trả |
|---|---|---|---|---|---|---|---|
| ICM30 (CYCLE, sàn 15.000) | 10.000 | 10.000 | 0,00% | 300.000.000 | 150.000.000 | 210.000.000 | **210.000.000** (B) |
| VSF30 (CYCLE, sàn 15.000, bán KM 20.000) | 5.000 | 4.980 | 0,40% | 99.600.000 | 75.000.000 | 69.720.000 | **75.000.000** (A) |
| VSU5 (USAGE, sàn 3.000) | 20.000 | 19.500 | 2,50% → đối soát chi tiết | 97.500.000 | 60.000.000 | 68.250.000 | **68.250.000** (B) |
| **Tổng** | | | | 497.100.000 | 285.000.000 | 347.970.000 | **353.250.000** |

Lưu ý: MAX(A;B) tính **theo từng gói** rồi cộng, nên tổng phải trả (353.250.000) lớn hơn MAX của hai tổng (347.970.000).

---

## 10. Quy trình tích hợp một MVNO mới

1. Ký hợp đồng/term sheet; VNPT-Media cấp `tenant_id`, chứng thư mTLS, `client_id/secret`, `signing_key`, tài khoản SFTP; MVNO khai báo IP, URL webhook, `key_version` đầu tiên.
2. Kiểm thử trên Sandbox theo bộ ca: activate/renew/deactivate, trùng `txn_id`, timeout + gọi lại, GRACE → EXPIRED (sandbox rút ân hạn còn 10 phút), usage grant thành công/lỗi `5003`, webhook, file đối soát 1 ngày.
3. UAT chạy thật với nhóm thuê bao nội bộ MVNO; nghiệm thu bằng biên bản.
4. Mở bán; theo dõi đối soát ngày trong 2 tuần đầu.
