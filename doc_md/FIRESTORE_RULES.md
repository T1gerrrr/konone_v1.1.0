# Hướng dẫn cấu hình Firestore Security Rules

## Vấn đề
Lỗi "Missing or insufficient permissions" xảy ra khi Firestore Security Rules chưa cho phép người dùng tạo/chỉnh sửa hồ sơ.

## Giải pháp

### Bước 1: Truy cập Firebase Console
1. Vào https://console.firebase.google.com
2. Chọn project của bạn: **khoatk-user-app**

### Bước 2: Vào Firestore Database
1. Click vào **Firestore Database** ở menu bên trái
2. Click vào tab **Rules** ở trên cùng

### Bước 3: Cập nhật Rules
Copy và paste đoạn code sau vào Rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles collection
    match /profiles/{profileId} {
      // Cho phép đọc công khai (để xem public profile)
      allow read: if true;
      
      // Cho phép tạo profile mới nếu userId khớp với user đang đăng nhập
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      
      // Cho phép cập nhật profile nếu userId khớp với user đang đăng nhập
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && request.resource.data.userId == resource.data.userId;
      
      // Cho phép xóa profile nếu userId khớp với user đang đăng nhập
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Các collection khác (nếu có)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Bước 4: Publish Rules
1. Click nút **Publish** để lưu rules
2. Đợi vài giây để rules được áp dụng

## Giải thích Rules

- **allow read: if true** - Cho phép mọi người đọc profiles (để xem public profile)
- **allow create** - Chỉ cho phép tạo profile nếu:
  - User đã đăng nhập (`request.auth != null`)
  - userId trong data khớp với UID của user đang đăng nhập
- **allow update** - Chỉ cho phép cập nhật profile nếu:
  - User đã đăng nhập
  - userId trong document hiện tại khớp với UID của user
  - userId không bị thay đổi khi update
- **allow delete** - Chỉ cho phép xóa profile của chính mình

## Kiểm tra
Sau khi cập nhật rules, thử:
1. Đăng nhập với tài khoản mới
2. Tạo hồ sơ mới
3. Nếu vẫn lỗi, kiểm tra lại rules và đảm bảo đã Publish

## Lưu ý
- Rules sẽ có hiệu lực ngay sau khi Publish
- Nếu có lỗi syntax, Firebase sẽ báo lỗi trước khi cho phép Publish
- Có thể test rules trong Firebase Console bằng Rules Playground

