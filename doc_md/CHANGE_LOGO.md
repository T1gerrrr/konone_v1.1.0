# Hướng dẫn thay đổi Logo

## 📝 Những gì đã được cập nhật

✅ **Đã cập nhật:**
- Title trong `index.html`: "KonOne - User Profile"
- Manifest.json: "KonOne - User Profile"
- Description: "KonOne - User Profile Application"

## 🎨 Logo files cần thay thế

Bạn cần thay thế các file logo React mặc định trong thư mục `public/`:

1. **favicon.ico** - Icon hiển thị trên browser tab (16x16, 32x32, 64x64)
2. **logo192.png** - Logo 192x192 pixels (cho Android)
3. **logo512.png** - Logo 512x512 pixels (cho iOS và PWA)

## 📂 Cách thay đổi logo

### Cách 1: Thay thế bằng file logo của bạn

1. **Chuẩn bị logo của bạn:**
   - Format: PNG hoặc SVG
   - Kích thước: 
     - favicon.ico: 16x16, 32x32, hoặc 64x64
     - logo192.png: 192x192 pixels
     - logo512.png: 512x512 pixels

2. **Thay thế files:**
   - Copy file logo của bạn vào thư mục `public/`
   - Đổi tên thành:
     - `favicon.ico`
     - `logo192.png`
     - `logo512.png`
   - Ghi đè lên các file cũ

3. **Tạo favicon.ico từ PNG:**
   - Bạn có thể dùng tool online: https://www.favicon-generator.org/
   - Upload logo PNG của bạn
   - Download file favicon.ico đã generate

### Cách 2: Dùng tool online

1. Truy cập: https://realfavicongenerator.net/
2. Upload logo của bạn
3. Cấu hình các tùy chọn
4. Download và thay thế các file trong `public/`

### Cách 3: Tạo từ SVG

Nếu bạn có logo SVG, có thể convert sang PNG:

1. Mở SVG trong browser
2. Inspect element và export thành PNG với kích thước phù hợp
3. Hoặc dùng tool: https://cloudconvert.com/svg-to-png

## 🎯 Logo hiện tại trong UI

Logo đang được hiển thị trong ứng dụng sử dụng:
- **Icon**: ✈ (máy bay emoji)
- **Text**: "KonOne"

Logo này xuất hiện ở:
- Header của Home page
- Sidebar của Dashboard
- Profile Editor
- Public Profile

Nếu bạn muốn thay đổi logo trong UI, cần:
1. Thay icon emoji ✈ bằng logo image
2. Hoặc cập nhật CSS để dùng logo image

## 📸 File locations

```
public/
├── favicon.ico          ← Browser tab icon
├── logo192.png          ← Android icon
├── logo512.png          ← iOS/PWA icon
└── logo.svg             ← SVG logo (đã tạo placeholder)
```

## ✅ Checklist

- [ ] Đã cập nhật title trong browser
- [ ] Đã cập nhật manifest.json
- [ ] Đã chuẩn bị logo files (favicon.ico, logo192.png, logo512.png)
- [ ] Đã thay thế files trong thư mục `public/`
- [ ] Đã test trên browser (xem favicon trên tab)
- [ ] Đã test trên mobile (install as PWA)

## 🔄 Sau khi thay đổi

1. **Restart development server:**
   ```bash
   npm start
   ```

2. **Hard refresh browser:**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Clear browser cache** nếu favicon không hiển thị

4. **Rebuild cho production:**
   ```bash
   npm run build
   ```

## 💡 Tips

- Logo nên có nền trong suốt (transparent background)
- Sử dụng màu sắc tương phản với nền để dễ nhìn
- Test trên nhiều devices và browsers khác nhau
- Đảm bảo logo hiển thị rõ ở kích thước nhỏ (16x16)

---

**Lưu ý:** Logo files sẽ được copy vào folder `build/` khi bạn chạy `npm run build`. Đảm bảo rebuild sau khi thay đổi logo.

