import { GAME_PRESETS } from './games';

// Vai trò của trang "Giới thiệu nâng cao" và các chip có sẵn cho từng vai trò.
// `slug`: icon trên Simple Icons (nếu có). Không tải được icon thì chip chỉ hiện chữ.
export const ABOUT_ROLES = [
  { id: '', vi: 'Không chọn', en: 'None' },
  { id: 'developer', vi: 'Developer (Ngôn ngữ)', en: 'Developer (Languages)' },
  { id: 'gamer', vi: 'Gamer (Game)', en: 'Gamer (Games)' },
  { id: 'streamer', vi: 'Streamer', en: 'Streamer' }
];

const DEV_TAGS = [
  { id: 'python', name: 'Python', slug: 'python' },
  { id: 'javascript', name: 'JavaScript', slug: 'javascript' },
  { id: 'typescript', name: 'TypeScript', slug: 'typescript' },
  { id: 'nextjs', name: 'Next.js', slug: 'nextdotjs', mono: true },
  { id: 'react', name: 'React', slug: 'react' },
  { id: 'nodejs', name: 'Node.js', slug: 'nodedotjs' },
  { id: 'go', name: 'Go', slug: 'go' },
  { id: 'rust', name: 'Rust', slug: 'rust', mono: true },
  { id: 'php', name: 'PHP', slug: 'php' },
  { id: 'java', name: 'Java', slug: 'openjdk' },
  { id: 'kotlin', name: 'Kotlin', slug: 'kotlin' },
  { id: 'swift', name: 'Swift', slug: 'swift' },
  { id: 'cpp', name: 'C++', slug: 'cplusplus' },
  { id: 'csharp', name: 'C#', slug: 'csharp' },
  { id: 'lua', name: 'Lua', slug: 'lua' },
  { id: 'html', name: 'HTML', slug: 'html5' },
  { id: 'css', name: 'CSS', slug: 'css3' },
  { id: 'redis', name: 'Redis', slug: 'redis' },
  { id: 'mongodb', name: 'MongoDB', slug: 'mongodb' },
  { id: 'mysql', name: 'MySQL', slug: 'mysql' },
  { id: 'postgresql', name: 'PostgreSQL', slug: 'postgresql' },
  { id: 'docker', name: 'Docker', slug: 'docker' },
  { id: 'git', name: 'Git', slug: 'git' },
  { id: 'unity', name: 'Unity', slug: 'unity', mono: true },
  { id: 'godot', name: 'Godot', slug: 'godotengine' }
];

const GAME_TAGS = GAME_PRESETS.map((g) => ({ id: g.id, name: g.name, slug: g.slug, mono: true }));

const STREAM_TAGS = [
  { id: 'twitch', name: 'Twitch', slug: 'twitch' },
  { id: 'youtube', name: 'YouTube', slug: 'youtube' },
  { id: 'kick', name: 'Kick', slug: 'kick' },
  { id: 'tiktok', name: 'TikTok', slug: 'tiktok', mono: true },
  { id: 'facebook', name: 'Facebook Gaming', slug: 'facebook' },
  { id: 'obs', name: 'OBS Studio', slug: 'obsstudio', mono: true },
  { id: 'discord', name: 'Discord', slug: 'discord' },
  { id: 'streamlabs', name: 'Streamlabs', slug: 'streamlabs' }
];

export const ABOUT_TAGS_BY_ROLE = {
  developer: DEV_TAGS,
  gamer: GAME_TAGS,
  streamer: STREAM_TAGS
};

const ALL_TAGS = [...DEV_TAGS, ...GAME_TAGS, ...STREAM_TAGS];

// Chip lưu dạng chuỗi: "id" của chip có sẵn, hoặc "custom:Tên" cho chip tự nhập
export function resolveAboutTag(raw) {
  const v = String(raw || '');
  if (v.startsWith('custom:')) return { id: v, name: v.slice(7), slug: '' };
  return ALL_TAGS.find((t) => t.id === v) || null;
}

export function tagIconUrl(tag) {
  if (!tag || !tag.slug) return '';
  return tag.mono ? `https://cdn.simpleicons.org/${tag.slug}/ffffff` : `https://cdn.simpleicons.org/${tag.slug}`;
}

export const ABOUT_TIMEZONES = [
  'Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Kolkata',
  'Asia/Dubai', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Moscow', 'America/Sao_Paulo',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Australia/Sydney', 'UTC'
];
