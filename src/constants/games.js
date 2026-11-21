// Game có sẵn cho thẻ "Đang chơi" ở bố cục Basic.
// `slug`: tên icon trên Simple Icons (logo trắng đơn sắc). Không có slug -> hiện chữ viết tắt.
export const GAME_PRESETS = [
  { id: 'lol', name: 'League of Legends', slug: 'leagueoflegends', short: 'LoL' },
  { id: 'valorant', name: 'Valorant', slug: 'valorant', short: 'VAL' },
  { id: 'gta5', name: 'Grand Theft Auto V', slug: 'rockstargames', short: 'V' },
  { id: 'gta4', name: 'Grand Theft Auto IV', slug: 'rockstargames', short: 'IV' },
  { id: 'deltaforce', name: 'Delta Force', slug: '', short: 'DF' },
  { id: 'cs2', name: 'Counter-Strike 2', slug: 'counterstrike', short: 'CS2' },
  { id: 'minecraft', name: 'Minecraft', slug: 'minecraft', short: 'MC' },
  { id: 'fortnite', name: 'Fortnite', slug: 'fortnite', short: 'FN' },
  { id: 'roblox', name: 'Roblox', slug: 'roblox', short: 'RBX' },
  { id: 'genshin', name: 'Genshin Impact', slug: 'genshinimpact', short: 'GI' },
  { id: 'pubg', name: 'PUBG', slug: 'pubg', short: 'PUBG' },
  { id: 'steam', name: 'Steam', slug: 'steam', short: 'ST' }
];

export const GAME_BY_ID = Object.fromEntries(GAME_PRESETS.map((g) => [g.id, g]));

export function isHttpUrl(v) {
  return /^https?:\/\//i.test(String(v || '').trim());
}

// Trả về { name, logo, short } để hiển thị, hoặc null nếu chưa chọn game
export function resolveGame(profile = {}) {
  if (!profile.gameEnabled) return null;
  const key = profile.gameKey || '';
  if (key === 'custom') {
    const name = String(profile.gameName || '').trim();
    if (!name) return null;
    return {
      name,
      logo: isHttpUrl(profile.gameLogo) ? String(profile.gameLogo).trim() : '',
      short: name.slice(0, 3).toUpperCase()
    };
  }
  const g = GAME_BY_ID[key];
  if (!g) return null;
  return {
    name: g.name,
    logo: g.slug ? `https://cdn.simpleicons.org/${g.slug}/ffffff` : '',
    short: g.short
  };
}
