// Cấu hình HIỂN THỊ sự kiện mời bạn. Server (api/_lib/inviteEvent.js) mới là nơi kiểm tra thật —
// đổi mốc / slot / thời gian thì sửa cả hai file.
export const EVENT_START = new Date('2026-11-20T00:00:00+07:00');
export const EVENT_END = new Date('2026-12-29T23:59:59.999+07:00');

export const MILESTONES = [
  {
    id: 'm10', need: 10, slots: 5, tone: 'coral', icon: 'diamond',
    title: { vi: 'KonOne Premium 30 ngày', en: 'KonOne Premium 30 days' }, choices: []
  },
  {
    id: 'm30', need: 30, slots: 5, tone: 'youtube', icon: 'play',
    title: { vi: 'YouTube Premium 30 ngày', en: 'YouTube Premium 30 days' }, choices: []
  },
  {
    id: 'm40', need: 40, slots: 2, tone: 'spotify', icon: 'wave',
    title: { vi: 'Spotify Premium 30 ngày', en: 'Spotify Premium 30 days' }, choices: []
  },
  {
    id: 'm100', need: 100, slots: 1, tone: 'gold', icon: 'crown',
    title: { vi: 'YouTube hoặc Spotify Premium 360 ngày', en: 'YouTube or Spotify Premium 360 days' },
    choices: [
      { key: 'youtube', label: 'YouTube' },
      { key: 'spotify', label: 'Spotify' }
    ]
  },
  {
    id: 'm100k', need: 100000, slots: 1, tone: 'violet', icon: 'headphones',
    title: { vi: 'AirPods Pro 2', en: 'AirPods Pro 2' }, choices: []
  }
];
