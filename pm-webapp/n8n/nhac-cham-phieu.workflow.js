import { workflow, node, trigger, sticky, ifElse, nodeJson, newCredential, expr } from '@n8n/workflow-sdk';

const DATA_TABLE = { __rl: true, mode: 'list', value: 'Jn9rY6enIJoxZxRz', cachedResultName: 'Phieu can cham' };

const lichSang = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: '8h sáng mỗi ngày',
    position: [0, 0],
    parameters: { rule: { interval: [{ field: 'days', triggerAtHour: 8, triggerAtMinute: 0 }] } }
  },
  output: [{ timestamp: '2026-11-03T08:00:00+07:00' }]
});

const hookNhacNgay = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Hook: nhắc chấm ngay',
    position: [0, 220],
    parameters: { httpMethod: 'GET', path: 'nhac-cham-phieu', responseMode: 'lastNode', responseData: 'firstEntryJson' }
  },
  output: [{ query: {}, headers: {}, body: {} }]
});

const layPhieu = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Lấy danh sách phiếu',
    position: [280, 110],
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: DATA_TABLE, returnAll: true }
  },
  output: [{ id: 1, ma_phieu: 'P-001', ten_phieu: 'Tờ trình khai trương gói D30', dich_vu: 'Data Account', nguoi_cham: 'Huy Trung', han_cham: '2026-11-05T00:00:00.000Z', trang_thai: 'Chưa chấm', ghi_chu: '' }]
});

const soanTin = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Phân loại & soạn tin nhắc chấm',
    position: [540, 110],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        "const NHAC_TRUOC_NGAY = 3;\n" +
        "const CHAT_ID = 276124034;\n" +
        "const TRANG_THAI_DA_CHAM = ['đã chấm', 'da cham', 'xong', 'hoàn thành', 'hoan thanh', 'hủy', 'huỷ', 'huy', 'đóng', 'dong'];\n" +
        "const ZONE = 'Asia/Ho_Chi_Minh';\n" +
        "\n" +
        "const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\n" +
        "const parseHan = v => {\n" +
        "  if (v === null || v === undefined || v === '') return null;\n" +
        "  if (v instanceof Date) return DateTime.fromJSDate(v).setZone(ZONE);\n" +
        "  const s = String(v).trim();\n" +
        "  let d = DateTime.fromISO(s, { zone: ZONE });\n" +
        "  if (!d.isValid) d = DateTime.fromFormat(s, 'dd/MM/yyyy', { zone: ZONE });\n" +
        "  if (!d.isValid) d = DateTime.fromFormat(s, 'd/M/yyyy', { zone: ZONE });\n" +
        "  return d.isValid ? d : null;\n" +
        "};\n" +
        "\n" +
        "const today = DateTime.now().setZone(ZONE).startOf('day');\n" +
        "const rows = $input.all().map(i => i.json).filter(r => r && r.ma_phieu);\n" +
        "const chuaCham = rows.filter(r => !TRANG_THAI_DA_CHAM.includes(String(r.trang_thai || '').trim().toLowerCase()));\n" +
        "const items = chuaCham.map(r => {\n" +
        "  const han = parseHan(r.han_cham);\n" +
        "  const days = han ? Math.round(han.startOf('day').diff(today, 'days').days) : null;\n" +
        "  return { ...r, days, hanLabel: han ? han.toFormat('dd/MM/yyyy') : '' };\n" +
        "});\n" +
        "\n" +
        "const quaHan = items.filter(x => x.days !== null && x.days < 0).sort((a, b) => a.days - b.days);\n" +
        "const homNay = items.filter(x => x.days === 0);\n" +
        "const sapHan = items.filter(x => x.days !== null && x.days > 0 && x.days <= NHAC_TRUOC_NGAY).sort((a, b) => a.days - b.days);\n" +
        "const khongHan = items.filter(x => x.days === null);\n" +
        "\n" +
        "const line = (x, extra) => '• <b>' + esc(x.ma_phieu) + '</b> – ' + esc(x.ten_phieu || '(chưa đặt tên)')\n" +
        "  + (x.dich_vu ? ' [' + esc(x.dich_vu) + ']' : '')\n" +
        "  + (x.nguoi_cham ? ' – ' + esc(x.nguoi_cham) : '')\n" +
        "  + ' – ' + (x.days === null ? 'chưa có hạn chấm' : 'hạn chấm ' + x.hanLabel) + (extra ? extra(x) : '')\n" +
        "  + (x.trang_thai ? ' – <i>' + esc(x.trang_thai) + '</i>' : '');\n" +
        "const out = ['<b>📝 NHẮC CHẤM PHIẾU ngày ' + today.toFormat('dd/MM/yyyy') + '</b>', 'Chưa chấm: ' + items.length + ' phiếu'];\n" +
        "const block = (title, list, extra) => {\n" +
        "  if (!list.length) return;\n" +
        "  out.push(''); out.push('<b>' + title + ' (' + list.length + ')</b>');\n" +
        "  list.forEach(x => out.push(line(x, extra)));\n" +
        "};\n" +
        "block('🔴 QUÁ HẠN CHẤM', quaHan, x => ' (trễ ' + (-x.days) + ' ngày)');\n" +
        "block('🟠 PHẢI CHẤM HÔM NAY', homNay);\n" +
        "block('🟡 SẮP ĐẾN HẠN CHẤM ≤ ' + NHAC_TRUOC_NGAY + ' ngày', sapHan, x => ' (còn ' + x.days + ' ngày)');\n" +
        "block('⚪ CHƯA CÓ HẠN CHẤM', khongHan);\n" +
        "\n" +
        "const canNhac = quaHan.length + homNay.length + sapHan.length;\n" +
        "return [{ json: {\n" +
        "  can_nhac: canNhac > 0,\n" +
        "  text: out.join('\\n'),\n" +
        "  chat_id: CHAT_ID,\n" +
        "  so_phieu_chua_cham: items.length,\n" +
        "  qua_han: quaHan.length,\n" +
        "  hom_nay: homNay.length,\n" +
        "  sap_han: sapHan.length,\n" +
        "  chua_co_han: khongHan.length,\n" +
        "} }];\n"
    }
  },
  output: [{ can_nhac: true, text: '<b>📌 NHẮC PHIẾU ngày 03/11/2026</b>', chat_id: 276124034, so_phieu_chua_cham: 1, qua_han: 0, hom_nay: 0, sap_han: 1, chua_co_han: 0 }]
});

const coPhieuCanNhac = ifElse({
  version: 2.3,
  config: {
    name: 'Có phiếu cần nhắc chấm?',
    position: [800, 110],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.can_nhac }}'), rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      },
      looseTypeValidation: true
    }
  }
});

const guiTelegram = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Gửi nhắc chấm Telegram',
    position: [1060, 0],
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $json.chat_id }}'),
      text: expr('{{ $json.text }}'),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true }
    },
    credentials: { telegramApi: newCredential('Telegram Bot nhắc chấm phiếu') }
  },
  output: [{ ok: true, result: { message_id: 1 } }]
});

const ketQuaGui = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Kết quả: đã gửi',
    position: [1320, 0],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'kq-da-gui', name: 'da_gui', value: expr('{{ $json.ok === true }}'), type: 'boolean' },
          { id: 'kq-mo', name: 'so_phieu_chua_cham', value: nodeJson(soanTin, 'so_phieu_chua_cham'), type: 'number' },
          { id: 'kq-qua-han', name: 'qua_han', value: nodeJson(soanTin, 'qua_han'), type: 'number' },
          { id: 'kq-hom-nay', name: 'hom_nay', value: nodeJson(soanTin, 'hom_nay'), type: 'number' },
          { id: 'kq-sap-han', name: 'sap_han', value: nodeJson(soanTin, 'sap_han'), type: 'number' }
        ]
      }
    }
  },
  output: [{ da_gui: true, so_phieu_chua_cham: 1, qua_han: 0, hom_nay: 0, sap_han: 1 }]
});

const khongCoGi = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Kết quả: không có phiếu cần nhắc chấm',
    position: [1060, 220],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'kc-da-gui', name: 'da_gui', value: false, type: 'boolean' },
          { id: 'kc-mo', name: 'so_phieu_chua_cham', value: expr('{{ $json.so_phieu_chua_cham }}'), type: 'number' },
          { id: 'kc-tb', name: 'thong_bao', value: 'Không có phiếu chưa chấm quá hạn / đến hạn / sắp đến hạn', type: 'string' }
        ]
      }
    }
  },
  output: [{ da_gui: false, so_phieu_chua_cham: 0, thong_bao: 'Không có phiếu chưa chấm quá hạn / đến hạn / sắp đến hạn' }]
});

const hookThemPhieu = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Hook: thêm phiếu cần chấm',
    position: [0, 520],
    parameters: { httpMethod: 'POST', path: 'them-phieu', responseMode: 'lastNode', responseData: 'firstEntryJson' }
  },
  output: [{ body: { ma_phieu: 'P-002', ten_phieu: 'CV thông báo triển khai', dich_vu: 'Bundle Addon', nguoi_cham: 'Huy Trung', han_cham: '10/11/2026', trang_thai: 'Chưa chấm', ghi_chu: '' } }]
});

const chuanHoaPhieu = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Chuẩn hoá phiếu',
    position: [280, 520],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        "const ZONE = 'Asia/Ho_Chi_Minh';\n" +
        "const parseHan = v => {\n" +
        "  const s = String(v ?? '').trim();\n" +
        "  if (!s) return null;\n" +
        "  let d = DateTime.fromISO(s, { zone: ZONE });\n" +
        "  if (!d.isValid) d = DateTime.fromFormat(s, 'dd/MM/yyyy', { zone: ZONE });\n" +
        "  if (!d.isValid) d = DateTime.fromFormat(s, 'd/M/yyyy', { zone: ZONE });\n" +
        "  return d.isValid ? d : null;\n" +
        "};\n" +
        "const str = v => String(v ?? '').trim();\n" +
        "return $input.all().map(i => {\n" +
        "  const b = (i.json.body && typeof i.json.body === 'object') ? i.json.body : i.json;\n" +
        "  const han = parseHan(b.han_cham) || DateTime.now().setZone(ZONE).plus({ days: 7 });\n" +
        "  return { json: {\n" +
        "    ma_phieu: str(b.ma_phieu) || ('P-' + DateTime.now().setZone(ZONE).toFormat('yyyyMMdd-HHmm')),\n" +
        "    ten_phieu: str(b.ten_phieu),\n" +
        "    dich_vu: str(b.dich_vu),\n" +
        "    nguoi_cham: str(b.nguoi_cham),\n" +
        "    han_cham: han.startOf('day').toISO(),\n" +
        "    trang_thai: str(b.trang_thai) || 'Chưa chấm',\n" +
        "    ghi_chu: str(b.ghi_chu),\n" +
        "  } };\n" +
        "});\n"
    }
  },
  output: [{ ma_phieu: 'P-002', ten_phieu: 'CV thông báo triển khai', dich_vu: 'Bundle Addon', nguoi_cham: 'Huy Trung', han_cham: '2026-11-10T00:00:00.000+07:00', trang_thai: 'Chưa chấm', ghi_chu: '' }]
});

const luuPhieu = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Lưu phiếu cần chấm',
    position: [540, 520],
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: DATA_TABLE,
      columns: { mappingMode: 'autoMapInputData', value: null, matchingColumns: [], schema: [] }
    }
  },
  output: [{ id: 2, ma_phieu: 'P-002', ten_phieu: 'CV thông báo triển khai', trang_thai: 'Chưa chấm' }]
});

const hookDongPhieu = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Hook: đã chấm xong',
    position: [0, 760],
    parameters: { httpMethod: 'POST', path: 'da-cham-phieu', responseMode: 'lastNode', responseData: 'allEntries' }
  },
  output: [{ body: { ma_phieu: 'P-002', trang_thai: 'Đã chấm' } }]
});

const capNhatTrangThai = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Đánh dấu đã chấm',
    position: [280, 760],
    parameters: {
      resource: 'row',
      operation: 'update',
      dataTableId: DATA_TABLE,
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'ma_phieu', condition: 'eq', keyValue: expr('{{ String($json.body?.ma_phieu ?? $json.ma_phieu ?? "").trim() }}') }] },
      columns: {
        mappingMode: 'defineBelow',
        value: { trang_thai: expr('{{ String($json.body?.trang_thai ?? $json.trang_thai ?? "Đã chấm").trim() || "Đã chấm" }}') },
        matchingColumns: [],
        schema: []
      }
    }
  },
  output: [{ id: 2, ma_phieu: 'P-002', trang_thai: 'Đã chấm' }]
});

export default workflow('nhac-cham-phieu', 'Nhắc chấm phiếu – quá hạn / sắp đến hạn chấm')
  .add(sticky(
    '## Nhắc chấm phiếu\n' +
    '**Dữ liệu**: Data table "Phieu can cham" (Data tables → sửa trực tiếp hoặc gọi hook).\n' +
    'Cột: ma_phieu, ten_phieu, dich_vu, nguoi_cham, han_cham (ngày), trang_thai, ghi_chu.\n' +
    'Phiếu có trang_thai = Đã chấm / Xong / Hủy thì KHÔNG nhắc.\n\n' +
    '**Lịch**: 8h sáng mỗi ngày (Settings → Timezone = Asia/Ho_Chi_Minh).\n' +
    '**Hook**: GET /webhook/nhac-cham-phieu (nhắc ngay) · POST /webhook/them-phieu (JSON các cột trên) · POST /webhook/da-cham-phieu {"ma_phieu": "..."}.\n\n' +
    'Chỉnh ở đầu node "Phân loại & soạn tin nhắc chấm": NHAC_TRUOC_NGAY (mặc định 3 ngày), CHAT_ID. Token bot nằm trong credential Telegram của node "Gửi nhắc chấm Telegram".',
    [], { position: [-40, -260], width: 760, height: 240, color: 4 }
  ))
  .add(lichSang)
  .to(layPhieu)
  .to(soanTin)
  .to(coPhieuCanNhac
    .onTrue(guiTelegram.to(ketQuaGui))
    .onFalse(khongCoGi))
  .add(hookNhacNgay)
  .to(layPhieu)
  .add(hookThemPhieu)
  .to(chuanHoaPhieu)
  .to(luuPhieu)
  .add(hookDongPhieu)
  .to(capNhatTrangThai);
