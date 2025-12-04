# Hướng dẫn Fix Lỗi Firebase Auth trên Vercel

## ❌ Lỗi thường gặp

```
Cannot send email: Firebase: Domain not allowlisted by project (auth/unauthorized-continue-uri)
```

Hoặc:

```
Firebase: Error (auth/unauthorized-domain)
```

## 🔍 Nguyên nhân

Firebase Auth chỉ hoạt động trên các domain đã được **whitelist** trong Firebase Console. Khi deploy lên Vercel, domain mới (ví dụ: `your-project.vercel.app`) chưa được thêm vào danh sách Authorized Domains, nên Firebase từ chối các request từ domain đó.

## ✅ Giải pháp: Thêm Vercel Domain vào Firebase

### Bước 1: Lấy domain Vercel của bạn

1. Đăng nhập vào **Vercel Dashboard**: https://vercel.com/dashboard
2. Chọn project của bạn
3. Domain sẽ hiển thị ở đầu trang, có dạng:
   - `your-project-name.vercel.app` (production)
   - Hoặc `your-project-name-git-main-your-username.vercel.app`

**Ví dụ:**
- Production: `my-app.vercel.app`
- Preview: `my-app-git-feature-username.vercel.app`

### Bước 2: Thêm domain vào Firebase Console

1. **Mở Firebase Console**
   - Truy cập: https://console.firebase.google.com
   - Đăng nhập bằng Google account

2. **Chọn Project**
   - Chọn project: **khoatk-user-app**
   - (Hoặc project Firebase của bạn)

3. **Vào Authentication Settings**
   - Click vào **"Authentication"** ở menu bên trái
   - Click vào tab **"Settings"**
   - Scroll xuống phần **"Authorized domains"**

4. **Thêm Domain Vercel**
   - Click vào nút **"Add domain"**
   - Nhập domain Vercel của bạn (ví dụ: `my-app.vercel.app`)
   - Click **"Add"**
   - Domain sẽ xuất hiện trong danh sách

### Bước 3: Kiểm tra danh sách Authorized Domains

Đảm bảo bạn có các domain sau trong danh sách:

✅ **Bắt buộc có:**
- `localhost` (cho development - tự động có)
- `khoatk-user-app.firebaseapp.com` (Firebase hosting - tự động có)

✅ **Cần thêm:**
- `your-project.vercel.app` (domain Vercel production - **BẠN PHẢI THÊM**)
- Preview domains nếu bạn muốn test (tùy chọn)

### Bước 4: Đợi và Test lại

1. **Đợi 2-5 phút** để Firebase cập nhật cấu hình
2. **Refresh** lại trang web trên Vercel
3. **Test lại** tính năng gửi email/authentication

## 📝 Các trường hợp đặc biệt

### 1. Preview Deployments

Nếu bạn dùng preview deployments (tự động tạo khi có pull request), mỗi preview có domain riêng:

- Format: `your-project-git-branch-username.vercel.app`
- Vấn đề: Domain này thay đổi mỗi lần deploy preview
- Giải pháp:
  - **Cách 1:** Chỉ test trên production domain
  - **Cách 2:** Thêm từng preview domain vào Firebase (không khuyến khích)
  - **Cách 3:** Dùng custom domain (xem phần dưới)

### 2. Custom Domain

Nếu bạn đã setup custom domain (ví dụ: `www.tigerkon.fun`, `myapp.com`):

1. Thêm custom domain vào Firebase Authorized Domains
2. **Lưu ý:** Nếu dùng cả `www.domain.com` và `domain.com`, cần thêm cả 2
3. Đảm bảo DNS đã được cấu hình đúng trên Vercel
4. Test lại trên custom domain

**Ví dụ cụ thể cho domain `www.tigerkon.fun`:**
- Vào Firebase Console → Authentication → Settings → Authorized domains
- Click "Add domain"
- Nhập: `www.tigerkon.fun` (KHÔNG có https://)
- Click "Add"
- Nếu cần, thêm cả `tigerkon.fun` (không có www)

### 3. Multiple Projects/Environments

Nếu bạn có nhiều môi trường (staging, production):

1. Thêm domain của **TẤT CẢ** môi trường vào Firebase
2. Hoặc tạo Firebase project riêng cho mỗi môi trường

## 🔧 Troubleshooting

### Domain đã thêm nhưng vẫn lỗi?

1. **Kiểm tra lại domain:**
   - Copy đúng domain từ Vercel (không có `https://` hay `/`)
   - Ví dụ đúng: `my-app.vercel.app`
   - Ví dụ sai: `https://my-app.vercel.app`

2. **Kiểm tra cache:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R hoặc Cmd+Shift+R)
   - Thử incognito/private mode

3. **Đợi thêm thời gian:**
   - Firebase có thể mất 5-10 phút để cập nhật
   - Thử lại sau 10 phút

4. **Kiểm tra Firebase Console:**
   - Vào lại Firebase → Authentication → Settings
   - Đảm bảo domain đã xuất hiện trong danh sách
   - Không có typo

### Không tìm thấy nút "Add domain"?

1. Đảm bảo bạn đang ở đúng section:
   - Authentication → Settings → Authorized domains (scroll xuống)
   
2. Kiểm tra quyền truy cập:
   - Đảm bảo bạn có quyền Owner/Editor trong Firebase project

3. Thử refresh lại trang Firebase Console

## 📋 Checklist

- [ ] Đã lấy domain Vercel từ Vercel Dashboard
- [ ] Đã vào Firebase Console → Authentication → Settings
- [ ] Đã tìm thấy phần "Authorized domains"
- [ ] Đã click "Add domain"
- [ ] Đã nhập đúng domain (không có https://)
- [ ] Domain đã xuất hiện trong danh sách
- [ ] Đã đợi 2-5 phút
- [ ] Đã refresh và test lại

## 🎯 Sau khi fix

Sau khi thêm domain, các tính năng sau sẽ hoạt động:
- ✅ Email verification
- ✅ Password reset
- ✅ Social login (nếu có)
- ✅ Tất cả các tính năng Firebase Auth khác

## 📚 Tài liệu tham khảo

- Firebase Auth Domains: https://firebase.google.com/docs/auth/web/email-auth#next_steps
- Vercel Domains: https://vercel.com/docs/concepts/projects/domains
- Authorized Domains: https://console.firebase.google.com/project/_/authentication/settings

---

**Lưu ý:** Lỗi này chỉ xảy ra khi deploy lên domain mới. Nếu test trên `localhost`, không cần thêm vì Firebase tự động có domain này.

