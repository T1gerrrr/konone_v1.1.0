# Hướng dẫn kiểm tra Email Verification

## Tình trạng hiện tại
✅ Code đang chạy đúng - log hiển thị "Sending verification email to: khoaho20605@gmail.com"
❓ Email chưa đến

## Các bước kiểm tra

### 1. Kiểm tra Console Logs
Mở Developer Console (F12) và xem:
- ✅ "Sending verification email to: khoaho20605@gmail.com" - Đã thấy
- ❓ "Verification email sent successfully" - Có thấy không?
- ❓ Có lỗi nào không?

### 2. Kiểm tra Email (QUAN TRỌNG)
1. **Kiểm tra Spam/Junk folder** - Email có thể bị filter
2. **Kiểm tra All Mail** (nếu dùng Gmail)
3. **Tìm email từ**: `noreply@khoatk-user-app.firebaseapp.com`
4. **Tiêu đề email**: "Verify your email for khoatk-user-app"
5. **Đợi 1-5 phút** - Email có thể bị delay

### 3. Kiểm tra Firebase Console

#### Bước 1: Vào Authentication
1. https://console.firebase.google.com
2. Chọn project: **khoatk-user-app**
3. Vào **Authentication** → **Users**
4. Tìm user với email: khoaho20605@gmail.com
5. Kiểm tra:
   - Email verified: **false** (chưa xác thực)
   - Provider: Email/Password

#### Bước 2: Kiểm tra Settings
1. Vào **Authentication** → **Settings**
2. Scroll xuống **Authorized domains**
3. Đảm bảo có:
   - ✅ `localhost`
   - ✅ `khoatk-user-app.firebaseapp.com`

#### Bước 3: Kiểm tra Templates
1. Vào **Authentication** → **Templates**
2. Click **Email address verification**
3. Đảm bảo:
   - ✅ Template đã được **enabled**
   - ✅ Có thể preview email

### 4. Test lại

#### Cách 1: Gửi lại email từ Dashboard
1. Đăng nhập vào Dashboard
2. Click nút "Gửi lại email" (nếu có)
3. Hoặc tạo component để gửi lại

#### Cách 2: Gửi lại từ Firebase Console
1. Vào **Authentication** → **Users**
2. Tìm user khoaho20605@gmail.com
3. Click vào user
4. Click **Send email verification** (nếu có)

#### Cách 3: Test với email khác
1. Thử đăng ký với email khác (Gmail khác, Outlook)
2. Xem email có đến không
3. Nếu đến → vấn đề với email cụ thể
4. Nếu không → vấn đề cấu hình Firebase

### 5. Kiểm tra Quota
Firebase free tier:
- 100 emails/ngày cho email verification
- Nếu vượt quá, email sẽ không được gửi
- Kiểm tra trong Firebase Console → Usage

### 6. Debug trong Code
Thêm vào Register.js để xem chi tiết:

```javascript
console.log('User object:', userCredential.user);
console.log('Email verified:', userCredential.user.emailVerified);
console.log('Provider data:', userCredential.user.providerData);
```

## Các nguyên nhân phổ biến

### 1. Email vào Spam (90% trường hợp)
- ✅ Kiểm tra Spam/Junk folder
- ✅ Thêm `noreply@khoatk-user-app.firebaseapp.com` vào whitelist

### 2. Firebase chưa được cấu hình
- ✅ Kiểm tra Authorized domains
- ✅ Kiểm tra Email template enabled

### 3. Email provider block
- Một số email provider có thể block Firebase emails
- Thử email khác (Gmail, Outlook thường ổn)

### 4. Quota đã hết
- Firebase free tier: 100 emails/ngày
- Đợi đến ngày mai hoặc upgrade

### 5. Delay
- Email có thể mất 1-5 phút
- Đợi thêm vài phút

## Giải pháp tạm thời

Nếu email không đến, bạn có thể:
1. **Bỏ qua email verification** - Cho phép đăng nhập mà không cần xác thực
2. **Gửi lại email** - Từ Dashboard hoặc Firebase Console
3. **Dùng email khác** - Test với email khác

## Kiểm tra ngay

1. ✅ Mở Gmail: khoaho20605@gmail.com
2. ✅ Kiểm tra Spam/Junk folder
3. ✅ Tìm email từ "noreply@khoatk-user-app"
4. ✅ Đợi 5 phút rồi kiểm tra lại
5. ✅ Kiểm tra Console logs xem có "Verification email sent successfully" không

## Liên hệ hỗ trợ

Nếu vẫn không thấy email sau khi:
- ✅ Đã kiểm tra Spam
- ✅ Đã đợi 5 phút
- ✅ Đã kiểm tra Firebase Console
- ✅ Đã thử email khác

Thì có thể cần:
- Kiểm tra Firebase project settings
- Liên hệ Firebase support
- Hoặc dùng email provider khác

