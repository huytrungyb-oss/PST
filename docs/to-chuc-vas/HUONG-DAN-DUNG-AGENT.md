# Hướng dẫn dùng bộ agent (cho người không chuyên kỹ thuật)

Các "agent" là những trợ lý AI chuyên môn đã được cài sẵn trong thư mục `.claude/agents/` của repo này. Khi mở repo bằng Claude Code (bản web claude.ai/code, ứng dụng máy tính hoặc điện thoại), bạn chỉ cần **gõ yêu cầu bằng tiếng Việt và nêu tên agent**, ví dụ:

> Dùng agent **vas-revenue-analyst** phân tích file doanh thu tôi vừa tải lên, cho biết dịch vụ nào nên dừng.

Không cần cài đặt gì thêm.

## Nguồn agent

| Nguồn | Mức độ phổ biến (tháng 10/2026) | Đã dùng gì |
|---|---|---|
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | ~164.000 sao — bộ agent "công ty AI" lớn nhất GitHub, có đủ các phòng ban kinh doanh, vận hành, tài chính, nhân sự | 16 agent quản trị, vận hành, sản phẩm, tài chính (giấy phép MIT) |
| [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) | ~33.000 sao — bộ plugin chính thức của Anthropic cho dân văn phòng | Tham khảo; các plugin `operations`, `human-resources`, `product-management` có thể cài trong Claude Cowork |
| [wshobson/agents](https://github.com/wshobson/agents) | ~42.000 sao | Chủ yếu cho lập trình — không cần cho việc quản lý |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | ~26.000 sao | Chủ yếu cho lập trình — không cần cho việc quản lý |
| Viết riêng cho khối VAS | — | 3 agent `vas-*` hiểu đặc thù nhà mạng, CP, đầu số, đối soát |

Lưu ý: các agent tải từ GitHub viết bằng tiếng Anh nhưng vẫn trả lời tiếng Việt nếu bạn hỏi bằng tiếng Việt.

## Nên dùng agent nào cho việc gì

### Agent chuyên VAS (dùng nhiều nhất)
| Agent | Dùng khi |
|---|---|
| `vas-org-advisor` | Điều chỉnh sơ đồ tổ chức, phân vai, KPI, RACI, nhịp họp |
| `vas-revenue-analyst` | Có file Excel doanh thu/thuê bao/khiếu nại → báo cáo, phát hiện bất thường, xếp hạng dịch vụ |
| `vas-compliance-ops` | Quy trình khiếu nại, xử lý sự cố, kiểm tra CP, rà soát luồng đăng ký/hủy |

### Agent quản trị & con người
| Agent | Dùng khi |
|---|---|
| `ma-integration-manager` | Lập kế hoạch sáp nhập 2 nhóm, kế hoạch 100 ngày, theo dõi bàn giao |
| `change-management-consultant` | Truyền thông thay đổi, xử lý phản kháng của nhân sự |
| `organizational-psychologist` | Văn hóa nhóm, xung đột cũ–mới, động lực |
| `hr-onboarding` | Chương trình hội nhập 5 nhân sự mới |
| `chief-of-staff` | Tổng hợp việc, chuẩn bị họp với lãnh đạo, theo dõi cam kết |
| `operations-manager` | Thiết kế quy trình vận hành, SLA, cải tiến |
| `project-management-meeting-notes-specialist` | Dán ghi chú họp → biên bản, việc cần làm, người phụ trách |

### Agent kinh doanh & tài chính
| Agent | Dùng khi |
|---|---|
| `business-strategist` | Chiến lược danh mục, định hướng 1–3 năm |
| `product-manager` | Thiết kế gói/dịch vụ mới, lộ trình sản phẩm |
| `product-feedback-synthesizer` | Tổng hợp phản hồi, khiếu nại của khách hàng thành vấn đề cần sửa |
| `pricing-analyst` | Định giá gói cước, gói combo Bundle |
| `marketing-growth-hacker` | Ý tưởng tăng thuê bao, khuyến mại |
| `economy-designer` | Thiết kế cơ chế vật phẩm/thanh toán trong dịch vụ Game |
| `finance-fpa-analyst` | Kế hoạch doanh thu – chi phí, dự báo |
| `customer-service` | Kịch bản chăm sóc khách hàng, trả lời khiếu nại |
| `data-privacy-officer` | Bảo vệ dữ liệu cá nhân thuê bao |

## Câu lệnh mẫu có thể copy

1. `Dùng agent vas-org-advisor: đây là danh sách 12 nhân sự và kinh nghiệm của họ [dán vào]. Xếp người vào các vị trí trong docs/to-chuc-vas/01-mo-hinh-quan-ly-VAS.md và giải thích lý do.`
2. `Dùng agent vas-revenue-analyst: phân tích file doanh-thu-12-thang.xlsx, xếp mỗi dịch vụ vào Đầu tư/Duy trì/Thử nghiệm/Dừng.`
3. `Dùng agent vas-compliance-ops: viết quy trình xử lý khiếu nại "bị trừ tiền không đăng ký" dài 1 trang, có SLA và mẫu trả lời.`
4. `Dùng agent hr-onboarding: lập chương trình hội nhập 30 ngày cho 5 nhân sự mới của khối VAS.`
5. `Dùng agent change-management-consultant: soạn bài phát biểu 5 phút cho buổi họp ra mắt khối VAS mới.`
