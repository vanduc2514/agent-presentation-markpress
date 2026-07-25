# Presentation Template (Mẫu Trình Chiếu)

[![en](https://img.shields.io/badge/lang-en-blue.svg)](README.md)

Một mẫu để xây dựng **bài trình chiếu impress.js** từ Markdown — viết slide trong `.md`, nhận file HTML độc lập và triển khai lên GitHub Pages tự động.

Được phát triển dựa trên [markpress](https://github.com/davidecaminati/markpress).

## Sử dụng Mẫu Này

1. Nhấn **Use this template** → **Create a new repository**
2. Clone repository mới
3. Cài đặt dependencies
4. Bắt đầu viết slide

```sh
npm install
npm run build      # → output/index.html
npm run preview    # mở trong trình duyệt
```

Yêu cầu Node.js 20. Nếu bạn dùng [mise](https://mise.jdx.dev/), chạy `mise install` trước.

## Cấu trúc Dự án

```
slides/
  presentation.en.md  # nguồn slide tiếng Anh
  presentation.vi.md  # nguồn slide tiếng Việt
  images/             # hình ảnh được tham chiếu trong slide
build.cjs             # script build — tùy chỉnh theme tại đây
package.json
mise.toml             # định phiên bản Node.js
.github/
  workflows/
    deploy-pages.yml  # tự động triển khai lên GitHub Pages khi push lên main
.agents/
  skills/             # kỹ năng AI agent cho viết và tạo kiểu slide
research/             # ghi chú brainstorm và nghiên cứu
scripts/              # script tiện ích (ví dụ: generate-pdf.cjs)
```

## Tùy chỉnh

### Thay đổi tiêu đề trình chiếu

Chỉnh sửa block `<!--markpress-opt-->` ở đầu `slides/presentation.en.md` (và block tương ứng trong `slides/presentation.vi.md`):

```markdown
<!--markpress-opt
{
  "autoSplit": false,
  "sanitize": false,
  "title": "Tiêu đề Trình chiếu của Bạn"
}
markpress-opt-->
```

### Màu sắc, phông chữ và bố cục

Tất cả chủ đề (bảng màu, phông chữ, vị trí slide, biến CSS) được thực hiện trong `build.cjs`.

Xem [`.agents/skills/markpress-styling/SKILL.md`](.agents/skills/markpress-styling/SKILL.md) để tham khảo đầy đủ.

## GitHub Pages

Workflow đi kèm (`deploy-pages.yml`) sẽ build và triển khai mỗi khi push lên `main`.

Bật GitHub Pages trong repository của bạn:
- **Settings** → **Pages** → **Source**: `GitHub Actions`

## Viết Slide

Slide được viết trong `slides/presentation.en.md` (tiếng Anh) và `slides/presentation.vi.md` (tiếng Việt), phân cách bằng `------` (sáu dấu gạch ngang).

Xem [`.agents/skills/markpress-content/SKILL.md`](.agents/skills/markpress-content/SKILL.md) để được hướng dẫn đầy đủ.
