# Hướng dẫn thêm domain www.tigerkon.fun vào Firebase

## 🎯 Domain cần thêm

- `www.tigerkon.fun`
- `tigerkon.fun` (khuyến khích thêm cả 2 để tránh lỗi)

## 📋 Các bước thực hiện

### Bước 1: Mở Firebase Console

1. Truy cập: https://console.firebase.google.com
2. Đăng nhập bằng Google account
3. Chọn project: **khoatk-user-app**

### Bước 2: Vào Authentication Settings

1. Click vào **"Authentication"** ở menu bên trái
2. Click vào tab **"Settings"** (ở trên cùng)
3. Scroll xuống phần **"Authorized domains"**

### Bước 3: Thêm domain

1. Click vào nút **"Add domain"** (màu xanh, ở phía dưới danh sách)
2. Nhập domain: `www.tigerkon.fun`
   - ⚠️ **LƯU Ý:** Chỉ nhập domain, KHÔNG có:
     - ❌ `https://www.tigerkon.fun` (sai)
     - ❌ `www.tigerkon.fun/` (sai)
     - ✅ `www.tigerkon.fun` (đúng)
3. Click **"Add"**

### Bước 4: Thêm domain không có www (tùy chọn nhưng khuyến khích)

Nếu bạn cũng dùng domain `tigerkon.fun` (không có www), cần thêm cả domain đó:

1. Click **"Add domain"** lại
2. Nhập: `tigerkon.fun`
3. Click **"Add"**

## ✅ Danh sách domains cần có

Sau khi thêm xong, danh sách **Authorized domains** nên có:

- ✅ `localhost` (tự động có)
- ✅ `khoatk-user-app.firebaseapp.com` (tự động có)
- ✅ `www.tigerkon.fun` (bạn vừa thêm)
- ✅ `tigerkon.fun` (nên thêm nếu dùng cả 2)

Nếu có domain Vercel khác, cũng cần thêm:
- ✅ `your-project.vercel.app` (nếu có)

## ⏱️ Sau khi thêm

1. **Đợi 2-5 phút** để Firebase cập nhật cấu hình
2. **Refresh** lại trang https://www.tigerkon.fun/
3. **Test lại** các tính năng:
   - Đăng ký tài khoản
   - Gửi email verification
   - Đăng nhập
   - Reset password

## 🔍 Kiểm tra

1. Vào lại Firebase Console → Authentication → Settings
2. Scroll xuống phần "Authorized domains"
3. Đảm bảo `www.tigerkon.fun` đã xuất hiện trong danh sách

## ⚠️ Lưu ý quan trọng

### www vs non-www

- `www.tigerkon.fun` và `tigerkon.fun` là **2 domain khác nhau** trong Firebase
- Nếu bạn redirect từ `tigerkon.fun` → `www.tigerkon.fun`, vẫn nên thêm cả 2
- Hoặc chỉ thêm domain mà người dùng thực sự truy cập

### Custom Domain trên Vercel

1. Đảm bảo domain đã được cấu hình trên Vercel:
   - Vào Vercel Dashboard → Project → Settings → Domains
   - Kiểm tra `www.tigerkon.fun` đã được add và verified chưa

2. Đảm bảo DNS đã được cấu hình đúng:
   - Domain trỏ đúng về Vercel
   - SSL certificate đã được cấp (tự động)

## 🐛 Nếu vẫn lỗi sau khi thêm

1. **Kiểm tra lại domain:**
   - Copy đúng từ danh sách (không có https://)
   - Không có typo

2. **Đợi thêm thời gian:**
   - Firebase có thể mất 5-10 phút
   - Thử lại sau 10 phút

3. **Clear cache:**
   - Hard refresh (Ctrl+Shift+R hoặc Cmd+Shift+R)
   - Thử incognito/private mode

4. **Kiểm tra console:**
   - Mở Developer Tools (F12)
   - Xem có lỗi gì không

## 📸 Hình ảnh minh họa

Vị trí nút "Add domain":
```
Firebase Console
├── Authentication
│   └── Settings (tab)
│       └── Authorized domains (scroll xuống)
│           └── [Add domain] ← Click đây
```

## ✅ Checklist

- [ ] Đã vào Firebase Console
- [ ] Đã chọn project: khoatk-user-app
- [ ] Đã vào Authentication → Settings
- [ ] Đã tìm thấy phần "Authorized domains"
- [ ] Đã click "Add domain"
- [ ] Đã nhập: `www.tigerkon.fun` (không có https://)
- [ ] Domain đã xuất hiện trong danh sách
- [ ] Đã đợi 2-5 phút
- [ ] Đã refresh và test lại trên https://www.tigerkon.fun/

---

**Sau khi hoàn thành, các tính năng Firebase Auth sẽ hoạt động bình thường trên domain của bạn! 🎉**

