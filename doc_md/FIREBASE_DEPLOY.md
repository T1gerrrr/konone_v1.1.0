# Hướng dẫn Deploy Web lên Firebase Hosting

## Bước 1: Cài đặt Firebase CLI

Mở terminal và chạy lệnh sau để cài đặt Firebase CLI globally:

```bash
npm install -g firebase-tools
```

Hoặc nếu bạn dùng yarn:

```bash
yarn global add firebase-tools
```

## Bước 2: Đăng nhập Firebase

Chạy lệnh sau để đăng nhập vào Firebase:

```bash
firebase login
```

Lệnh này sẽ mở trình duyệt để bạn đăng nhập bằng tài khoản Google của mình.

## Bước 3: Khởi tạo Firebase Project (nếu chưa có)

Nếu bạn chưa có Firebase project, truy cập [Firebase Console](https://console.firebase.google.com/) và tạo project mới.

## Bước 4: Khởi tạo Firebase trong dự án

Chạy lệnh sau trong thư mục dự án:

```bash
firebase init hosting
```

Khi được hỏi, chọn các tùy chọn sau:

1. **Select a default Firebase project**: Chọn project của bạn hoặc tạo mới
2. **What do you want to use as your public directory?**: Nhập `build` (thư mục build của React)
3. **Configure as a single-page app (rewrite all urls to /index.html)?**: Chọn `Yes`
4. **Set up automatic builds and deploys with GitHub?**: Chọn `No` (hoặc Yes nếu muốn tự động deploy từ GitHub)
5. **File build/index.html already exists. Overwrite?**: Chọn `No`

## Bước 5: Cập nhật .firebaserc

Mở file `.firebaserc` và thay `your-project-id` bằng Project ID thực tế của bạn (lấy từ Firebase Console).

Ví dụ:
```json
{
  "projects": {
    "default": "konone-app-12345"
  }
}
```

## Bước 6: Build ứng dụng React

Chạy lệnh để build ứng dụng:

```bash
npm run build
```

Lệnh này sẽ tạo thư mục `build` chứa các file đã được tối ưu hóa để deploy.

## Bước 7: Deploy lên Firebase Hosting

Sau khi build xong, chạy lệnh deploy:

```bash
firebase deploy --only hosting
```

Hoặc nếu bạn muốn deploy tất cả (hosting, functions, etc.):

```bash
firebase deploy
```

## Bước 8: Kiểm tra kết quả

Sau khi deploy thành công, Firebase sẽ cung cấp URL của website, ví dụ:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## Lưu ý quan trọng:

### 1. Environment Variables
Nếu bạn sử dụng environment variables, tạo file `.env.production` trong thư mục gốc:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### 2. Cấu hình Custom Domain (Tùy chọn)

1. Vào Firebase Console > Hosting
2. Click "Add custom domain"
3. Nhập domain của bạn
4. Làm theo hướng dẫn để verify domain

### 3. Cấu hình SSL/TLS

Firebase tự động cung cấp SSL certificate cho domain của bạn.

### 4. Cập nhật Firestore Security Rules

Đảm bảo Firestore Security Rules đã được cấu hình đúng (xem file `FIRESTORE_RULES.md`).

### 5. Cấu hình Firebase Authentication

Đảm bảo các phương thức xác thực đã được bật trong Firebase Console:
- Email/Password
- Các provider khác (nếu có)

## Scripts hữu ích

Thêm vào `package.json` để dễ deploy:

```json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy --only hosting",
    "deploy:preview": "npm run build && firebase hosting:channel:deploy preview"
  }
}
```

Sau đó chỉ cần chạy:
```bash
npm run deploy
```

## Troubleshooting

### Lỗi: "Firebase CLI not found"
- Đảm bảo đã cài đặt Firebase CLI: `npm install -g firebase-tools`
- Kiểm tra PATH environment variable

### Lỗi: "Permission denied"
- Đảm bảo đã đăng nhập: `firebase login`
- Kiểm tra quyền truy cập project trong Firebase Console

### Lỗi: "Build failed"
- Kiểm tra lỗi trong terminal khi chạy `npm run build`
- Đảm bảo tất cả dependencies đã được cài đặt: `npm install`

### Website không load được
- Kiểm tra file `firebase.json` có đúng cấu hình không
- Đảm bảo `public` directory trỏ đến `build`
- Kiểm tra rewrite rules cho SPA

## Tài liệu tham khảo

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [React App Deployment](https://create-react-app.dev/docs/deployment/#firebase)

