# Hướng dẫn cấu hình Cloudinary

## Bước 1: Tạo tài khoản Cloudinary

1. Truy cập https://cloudinary.com và đăng ký tài khoản miễn phí
2. Đăng nhập vào Cloudinary Dashboard

## Bước 2: Lấy thông tin Cloudinary

1. Trong Dashboard, bạn sẽ thấy:
   - **Cloud Name**: Tên cloud của bạn (ví dụ: `dxyz123`)
   - **API Key**: Khóa API (không bắt buộc nếu dùng unsigned preset)

## Bước 3: Tạo Upload Preset

1. Vào **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Đặt tên preset (ví dụ: `KonOne-upload`)
4. Chọn **Signing mode**: **Unsigned** (để upload từ client không cần server)
5. Trong **Folder**, nhập: `profiles` (tùy chọn)
6. Click **Save**

## Bước 4: Cấu hình trong code

Mở file `src/config/cloudinary.js` và thay thế:

```javascript
export const cloudinaryConfig = {
  cloudName: 'your-cloud-name', // Thay bằng cloud name của bạn
  uploadPreset: 'your-upload-preset', // Tên preset vừa tạo
};
```

**Ví dụ:**
```javascript
export const cloudinaryConfig = {
  cloudName: 'dxyz123',
  uploadPreset: 'KonOne-upload',
};
```

## Lưu ý

- Upload preset phải là **Unsigned** để upload từ client
- Cloudinary miễn phí có giới hạn: 25GB storage, 25GB bandwidth/tháng
- Ảnh sẽ được tự động tối ưu và resize bởi Cloudinary

