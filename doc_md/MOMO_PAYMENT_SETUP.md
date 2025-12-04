# Hướng dẫn Tích hợp Thanh toán MoMo

## 📋 Tổng quan

Ứng dụng đã được tích hợp UI và logic để thanh toán Premium qua MoMo. Tuy nhiên, để hoàn thiện hệ thống, bạn cần setup backend server để xử lý thanh toán MoMo vì cần Secret Key (không thể để trên frontend).

## 🏗️ Kiến trúc

```
Frontend (React) → Backend API → MoMo Payment Gateway → Callback → Backend → Update Firestore
```

## 🔧 Bước 1: Đăng ký tài khoản MoMo Business

1. Truy cập: https://business.momo.vn/
2. Đăng ký tài khoản doanh nghiệp
3. Hoàn tất xác thực và phê duyệt
4. Nhận thông tin:
   - **Partner Code**
   - **Access Key**
   - **Secret Key**

## 🔧 Bước 2: Setup Backend Server

### Yêu cầu

- Node.js server (Express.js)
- Firebase Admin SDK (để update Firestore)
- MoMo Payment SDK

### Cấu trúc Backend

```
backend/
├── server.js
├── routes/
│   └── momo.js
├── config/
│   └── momo.js
└── package.json
```

### Ví dụ Backend API Endpoints

#### 1. POST `/api/momo/create`

Tạo payment request đến MoMo.

**Request:**
```json
{
  "amount": 99000,
  "orderId": "PREMIUM_user123_1234567890",
  "orderInfo": "Premium 1 Tháng - KonOne",
  "packageId": "1month",
  "returnUrl": "https://yourdomain.com/premium?payment=success",
  "notifyUrl": "https://yourdomain.com/api/momo/callback"
}
```

**Response:**
```json
{
  "payUrl": "https://payment.momo.vn/v2/gateway/pay?...",
  "orderId": "PREMIUM_user123_1234567890"
}
```

#### 2. POST `/api/momo/callback`

Nhận callback từ MoMo sau khi thanh toán.

#### 3. GET `/api/momo/status/:orderId`

Kiểm tra trạng thái thanh toán.

## 📝 Bước 3: Cấu hình Frontend

### Environment Variables

Thêm vào file `.env` hoặc `.env.local`:

```env
REACT_APP_MOMO_API_URL=http://localhost:3001/api/momo
```

Hoặc production:
```env
REACT_APP_MOMO_API_URL=https://your-backend-api.com/api/momo
```

## 🔄 Bước 4: Flow Thanh toán

1. **User chọn gói Premium** → Click "Thanh toán MoMo"
2. **Frontend gọi API** → `POST /api/momo/create`
3. **Backend tạo payment request** → Gọi MoMo API
4. **MoMo trả về payment URL** → Redirect user đến MoMo
5. **User thanh toán trên MoMo**
6. **MoMo gửi callback** → `POST /api/momo/callback`
7. **Backend xử lý callback** → Update Firestore (Premium status)
8. **User được redirect về** → `/premium?payment=success&orderId=xxx`
9. **Frontend kiểm tra** → Kích hoạt Premium

## 🔐 Bước 5: Setup Firestore Collections

### Collection: `orders`

Lưu thông tin đơn hàng:

```javascript
{
  userId: "user123",
  profileId: "profile123",
  packageId: "1month",
  packageName: "Premium 1 Tháng",
  
  days: 30,
  amount: 99000,
  orderId: "PREMIUM_user123_1234567890",
  status: "pending", 
  paymentMethod: "momo",
  createdAt: Timestamp,
  completedAt: Timestamp
}
```

### Collection: `profiles` (đã có)

Cần thêm các fields:
- `premiumOrderId`: ID của order đã thanh toán
- `premiumPackage`: ID của gói đã mua

## 💻 Ví dụ Backend Code (Node.js + Express)

### 1. Install dependencies

```bash
npm install express cors dotenv momo-nodejs-sdk firebase-admin
```

### 2. `server.js`

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const momoRoutes = require('./routes/momo');
app.use('/api/momo', momoRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

### 3. `routes/momo.js`

```javascript
const express = require('express');
const router = express.Router();
const momoPayment = require('../config/momo');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('../firebase-service-account.json'))
});

router.post('/create', async (req, res) => {
  try {
    const { amount, orderId, orderInfo, returnUrl, notifyUrl } = req.body;
    
    // Tạo payment request đến MoMo
    const paymentUrl = await momoPayment.createPayment({
      amount,
      orderId,
      orderInfo,
      returnUrl,
      notifyUrl,
    });
    
    res.json({ payUrl: paymentUrl, orderId });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/callback', async (req, res) => {
  try {
    const { orderId, resultCode, amount } = req.body;
    
    if (resultCode === '0') {
      // Thanh toán thành công
      // Cập nhật order trong Firestore
      // Kích hoạt Premium cho user
      
      const db = admin.firestore();
      const ordersRef = db.collection('orders');
      const orderSnapshot = await ordersRef.where('orderId', '==', orderId).get();
      
      if (!orderSnapshot.empty) {
        const orderDoc = orderSnapshot.docs[0];
        const orderData = orderDoc.data();
        
        // Update order status
        await orderDoc.ref.update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Kích hoạt Premium
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + orderData.days);
        
        await db.collection('profiles').doc(orderData.profileId).update({
          isPremium: true,
          premiumExpiresAt: expiresAt,
          premiumActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          premiumPackage: orderData.packageId,
          premiumOrderId: orderId,
        });
      }
    }
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error handling callback:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    // Kiểm tra status từ MoMo
    // Hoặc từ Firestore
    res.json({ status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 4. `config/momo.js`

```javascript
const momo = require('momo-nodejs-sdk');

// MoMo Config
const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const environment = process.env.MOMO_ENVIRONMENT || 'sandbox'; // sandbox hoặc production

async function createPayment({ amount, orderId, orderInfo, returnUrl, notifyUrl }) {
  // Tạo payment request
  // Xem docs: https://developers.momo.vn/v3/vi/docs/payment/api/credit/onetime/
  
  const requestId = orderId;
  const requestType = "captureWallet";
  
  // ... MoMo payment logic
  
  return paymentUrl;
}

module.exports = {
  createPayment,
};
```

## 🔑 Environment Variables (Backend)

Tạo file `.env` trong backend:

```env
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENVIRONMENT=sandbox
PORT=3001

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## ✅ Checklist

- [ ] Đã đăng ký tài khoản MoMo Business
- [ ] Đã nhận được Partner Code, Access Key, Secret Key
- [ ] Đã setup backend server
- [ ] Đã cấu hình Firebase Admin SDK
- [ ] Đã test trong môi trường sandbox
- [ ] Đã setup callback URL trên MoMo Dashboard
- [ ] Đã test flow thanh toán hoàn chỉnh
- [ ] Đã deploy backend lên production
- [ ] Đã cập nhật REACT_APP_MOMO_API_URL trong frontend

## 📚 Tài liệu tham khảo

- MoMo Developers: https://developers.momo.vn/v3/vi/docs/payment/api/credit/onetime/
- MoMo Business: https://business.momo.vn/
- MoMo API Documentation: https://developers.momo.vn/

## 🔄 Testing

### Test trong Sandbox

1. MoMo cung cấp test accounts
2. Dùng test phone numbers và amounts
3. Kiểm tra callback được gửi đúng chưa

### Test Flow

1. Chọn gói Premium
2. Click "Thanh toán MoMo"
3. Redirect đến MoMo test page
4. Thanh toán bằng test account
5. Kiểm tra Premium đã được kích hoạt chưa

## ⚠️ Lưu ý quan trọng

1. **Secret Key phải được giữ bí mật** - Chỉ để trên backend
2. **HTTPS là bắt buộc** trong production
3. **Callback URL** phải là HTTPS và public accessible
4. **Xử lý timeout** - MoMo có thể không gửi callback ngay
5. **Idempotency** - Xử lý duplicate callbacks
6. **Logging** - Log tất cả payment transactions để debug

## 🚀 Deploy Backend

Bạn có thể deploy backend lên:
- **Vercel Serverless Functions**
- **Firebase Cloud Functions**
- **Heroku**
- **AWS Lambda**
- **DigitalOcean App Platform**
- Hoặc bất kỳ Node.js hosting nào

---

**Sau khi setup backend, hệ thống thanh toán MoMo sẽ hoạt động hoàn chỉnh!**

