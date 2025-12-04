# Hướng dẫn Deploy lên Vercel

Hướng dẫn chi tiết để deploy ứng dụng React lên Vercel thông qua Git.

## 📋 Yêu cầu

- Tài khoản GitHub/GitLab/Bitbucket
- Tài khoản Vercel (đăng ký tại https://vercel.com - miễn phí)
- Git đã được cài đặt

## 🚀 Bước 1: Chuẩn bị Git Repository

### 1.1. Kiểm tra Git status

```bash
git status
```

### 1.2. Thêm tất cả các file vào Git (nếu chưa có)

```bash
git add .
```

### 1.3. Commit các thay đổi

```bash
git commit -m "Chuẩn bị deploy lên Vercel"
```

### 1.4. Tạo repository trên GitHub/GitLab/Bitbucket

1. Đăng nhập vào GitHub/GitLab/Bitbucket
2. Tạo repository mới (ví dụ: `user-profile-app`)
3. **Không** tích vào "Initialize with README" (vì bạn đã có code rồi)

### 1.5. Push code lên Git

```bash
# Thêm remote (thay YOUR_USERNAME và REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push code lên master/main branch
git branch -M main
git push -u origin main
```

**Lưu ý:** Thay `YOUR_USERNAME` và `REPO_NAME` bằng tên thật của bạn.

## 🎯 Bước 2: Deploy lên Vercel

### Cách 1: Deploy qua Vercel Dashboard (Khuyên dùng)

1. **Đăng nhập Vercel**
   - Truy cập: https://vercel.com
   - Đăng nhập bằng GitHub/GitLab/Bitbucket account

2. **Import Project**
   - Click vào nút **"Add New..."** → **"Project"**
   - Chọn repository vừa push lên Git
   - Click **"Import"**

3. **Cấu hình Project**
   - **Framework Preset:** Tự động detect là "Create React App"
   - **Root Directory:** `./` (mặc định)
   - **Build Command:** `npm run build` (tự động)
   - **Output Directory:** `build` (tự động)
   - **Install Command:** `npm install` (tự động)

4. **Environment Variables (Tùy chọn)**
   - Nếu bạn muốn dùng environment variables cho Firebase config, thêm ở đây
   - Hiện tại code đã hardcode Firebase config nên không cần thiết

5. **Deploy**
   - Click **"Deploy"**
   - Đợi build (thường mất 1-3 phút)
   - Xong! Website của bạn sẽ có URL dạng: `https://your-project.vercel.app`

### Cách 2: Deploy qua Vercel CLI

1. **Cài đặt Vercel CLI**

```bash
npm install -g vercel
```

2. **Đăng nhập Vercel**

```bash
vercel login
```

3. **Deploy**

```bash
# Deploy lần đầu
vercel

# Deploy production
vercel --prod
```

## ⚙️ Bước 3: Cấu hình Custom Domain (Tùy chọn)

1. Vào Vercel Dashboard → Chọn project
2. Vào tab **"Settings"** → **"Domains"**
3. Thêm domain của bạn
4. Cấu hình DNS theo hướng dẫn của Vercel

## 🔧 Bước 4: Cấu hình Firebase Authorized Domains (QUAN TRỌNG!)

Sau khi deploy, **BẮT BUỘC** phải thêm domain Vercel vào Firebase, nếu không sẽ gặp lỗi:
```
Cannot send email: Firebase: Domain not allowlisted by project (auth/unauthorized-continue-uri)
```

### Cách thêm domain Vercel vào Firebase:

1. **Lấy domain Vercel của bạn:**
   - Vào Vercel Dashboard → Chọn project
   - Domain sẽ có dạng: `your-project-name.vercel.app`
   - Hoặc domain production: `your-project-name-git-main-your-username.vercel.app`

2. **Thêm vào Firebase Console:**
   - Vào **Firebase Console**: https://console.firebase.google.com
   - Chọn project: **khoatk-user-app**
   - Vào **Authentication** → **Settings**
   - Scroll xuống phần **"Authorized domains"**
   - Click nút **"Add domain"** 
   - Nhập domain Vercel của bạn (ví dụ: `your-project.vercel.app`)
   - Click **"Add"**

3. **Lưu ý:**
   - Cần thêm **TẤT CẢ** các domain Vercel:
     - Domain production: `your-project.vercel.app`
     - Domain preview (nếu dùng): `your-project-git-branch-your-username.vercel.app`
     - Custom domain (nếu có)
   - Sau khi thêm, có thể mất vài phút để áp dụng
   - Refresh lại trang và test lại

### Domains cần có trong Firebase:

✅ Đảm bảo danh sách **Authorized domains** có:
- `localhost` (cho development - tự động có)
- `khoatk-user-app.firebaseapp.com` (Firebase domain - tự động có)
- `your-project.vercel.app` (domain Vercel - **BẠN PHẢI THÊM**)
- Custom domain nếu có (nếu bạn dùng custom domain)

## 🔄 Cách hoạt động

- Mỗi khi bạn push code lên Git, Vercel sẽ tự động:
  - Build lại ứng dụng
  - Deploy version mới
  - Tạo preview URL cho mỗi commit/pull request

- **Production deployment:** Tự động deploy khi push vào `main`/`master` branch
- **Preview deployments:** Tự động tạo preview URL cho mỗi branch/pull request

## 📝 Lưu ý quan trọng

1. **Routing:** Đã cấu hình `vercel.json` để hỗ trợ React Router (SPA routing)

2. **Build folder:** Vercel sẽ tự động build và serve từ folder `build/`

3. **Environment Variables:** 
   - Nếu cần thay đổi Firebase config, nên dùng environment variables
   - Thêm vào Vercel Dashboard → Settings → Environment Variables
   - Format: `REACT_APP_*` cho Create React App

4. **Firebase Hosting vs Vercel:**
   - Bạn có thể deploy cả 2 nơi cùng lúc
   - Chỉ cần remove script `deploy` trong `package.json` nếu không dùng Firebase nữa

## 🐛 Troubleshooting

### Build fails

- Kiểm tra console logs trong Vercel Dashboard
- Đảm bảo tất cả dependencies đã được cài đặt
- Kiểm tra lỗi syntax trong code

### Routing không hoạt động

- Đã có `vercel.json` với rewrite rules
- Đảm bảo đang dùng React Router đúng cách

### Firebase Auth không hoạt động / Lỗi "Domain not allowlisted"

**Lỗi phổ biến:**
```
Cannot send email: Firebase: Domain not allowlisted by project (auth/unauthorized-continue-uri)
```

**Cách fix:**
1. ✅ Vào Firebase Console → Authentication → Settings → Authorized domains
2. ✅ Thêm domain Vercel của bạn (ví dụ: `your-project.vercel.app`)
3. ✅ Đợi 2-3 phút để Firebase cập nhật
4. ✅ Refresh lại trang và test lại
5. ✅ Nếu dùng preview deployments, cần thêm cả preview domain

**Chi tiết xem:** Phần "Bước 4: Cấu hình Firebase Authorized Domains" ở trên

### Kiểm tra Firebase config trong code
- Đảm bảo Firebase config đúng trong `src/firebase.js`
- Nếu dùng environment variables, đảm bảo đã set trong Vercel

### Environment Variables không hoạt động

- Variables phải bắt đầu bằng `REACT_APP_` để Create React App nhận diện
- Redeploy sau khi thêm/sửa environment variables

## 📚 Tài liệu tham khảo

- Vercel Docs: https://vercel.com/docs
- React Deployment: https://create-react-app.dev/docs/deployment
- Firebase Auth Setup: Xem `FIREBASE_EMAIL_SETUP.md`

## ✅ Checklist

- [ ] Code đã được push lên Git repository
- [ ] Đã tạo tài khoản Vercel
- [ ] Đã import project vào Vercel
- [ ] Đã deploy thành công
- [ ] Đã thêm Vercel domain vào Firebase Authorized Domains
- [ ] Đã test các tính năng trên production

---

**Chúc bạn deploy thành công! 🎉**

