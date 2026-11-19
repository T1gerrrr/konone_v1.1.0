// Chỉ chạy khi `npm start` (dev server). Gắn các hàm trong thư mục /api để dev cục bộ giống Vercel,
// nên không cần `vercel dev`. Khi build/deploy file này KHÔNG được đưa vào.
//
// Cần tạo file .env.local (đã được .gitignore) ở thư mục gốc dự án:
//   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}   (JSON trên một dòng)
//   ADMIN_EMAILS=email-cua-ban@gmail.com
//   (và các biến SMTP nếu muốn thử gửi OTP, giống cấu hình trên Vercel)
const path = require('path');
const express = require('express');

module.exports = function setupProxy(app) {
  app.use('/api', express.json({ limit: '1mb' }));
  app.all('/api/:name', async (req, res) => {
    const name = String(req.params.name || '').replace(/[^a-z0-9-]/gi, '');
    let handler;
    try {
      handler = require(path.join(__dirname, '..', 'api', `${name}.js`));
    } catch (err) {
      return res.status(404).json({ error: `Không có API "${name}"`, code: 'dev/not-found' });
    }
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[api/${name}]`, err);
      if (!res.headersSent) res.status(500).json({ error: err.message || 'Lỗi máy chủ', code: 'dev/failed' });
    }
  });
};
