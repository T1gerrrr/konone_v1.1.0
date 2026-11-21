import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { resolveAboutTag, tagIconUrl } from '../constants/aboutTags';
import './WebAboutAdvanced.css';

// ===== Chữ có định dạng đơn giản, KHÔNG dùng innerHTML =====
// **đậm**  *nghiêng*  [chữ](https://liên-kết)  — xuống dòng giữ nguyên
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

function renderInline(line, keyBase) {
  return line.split(INLINE_RE).filter((p) => p !== '').map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={key}>{part.slice(1, -1)}</em>;
    const m = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (m) {
      return (
        <a key={key} href={m[2]} target="_blank" rel="noopener noreferrer nofollow">
          {m[1]}
        </a>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export function RichAboutText({ text }) {
  const lines = String(text || '').split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className={line.trim() ? '' : 'wa-blank'}>
          {line.trim() ? renderInline(line, i) : ' '}
        </p>
      ))}
    </>
  );
}

// ===== Đồng hồ múi giờ =====
function zoneParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const o = {};
  dtf.formatToParts(date).forEach((p) => {
    o[p.type] = p.value;
  });
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
}

// Độ lệch (phút) của múi giờ so với UTC tại thời điểm `date`
function zoneOffsetMin(date, timeZone) {
  const p = zoneParts(date, timeZone);
  const asUtc = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - (date.getTime() - date.getMilliseconds())) / 60000);
}

function gmtLabel(min) {
  const sign = min < 0 ? '-' : '+';
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

const pad2 = (n) => String(n).padStart(2, '0');

function ClockCard({ timeZone, color }) {
  const { language } = useLanguage();
  const vi = language === 'vi';
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  let tz = timeZone || 'UTC';
  let parts;
  try {
    parts = zoneParts(now, tz);
  } catch (e) {
    tz = 'UTC';
    parts = zoneParts(now, tz);
  }
  const ownerOff = zoneOffsetMin(now, tz);
  const viewerOff = -now.getTimezoneOffset();
  const diffH = (ownerOff - viewerOff) / 60;
  const diffTxt = diffH === 0 ? (vi ? 'cùng giờ' : 'same time') : `${diffH > 0 ? '+' : '-'}${Math.abs(diffH)}h`;

  const dateTxt = new Date(Date.UTC(parts.y, parts.mo - 1, parts.d, 12)).toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

  const secDeg = parts.s * 6;
  const minDeg = parts.mi * 6 + parts.s * 0.1;
  const hourDeg = (parts.h % 12) * 30 + parts.mi * 0.5;

  return (
    <div className="wa-card wa-clock-card" style={{ color }}>
      <span className="wa-clock-label">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        {vi ? 'Múi giờ' : 'Timezone'}
      </span>

      <svg className="wa-clock-face" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="47" fill="#111114" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="8"
            x2="50"
            y2={i % 3 === 0 ? 15 : 12}
            stroke="rgba(255,255,255,0.75)"
            strokeWidth={i % 3 === 0 ? 2.4 : 1.4}
            transform={`rotate(${i * 30} 50 50)`}
          />
        ))}
        <line x1="50" y1="50" x2="50" y2="28" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" transform={`rotate(${hourDeg} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="17" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
        <line x1="50" y1="58" x2="50" y2="13" stroke="#ff4d4d" strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
        <circle cx="50" cy="50" r="2.6" fill="#ff4d4d" />
      </svg>

      <div className="wa-clock-text">
        <strong>{`${pad2(parts.h)}:${pad2(parts.mi)}:${pad2(parts.s)}`}</strong>
        <span>{`${dateTxt} · ${gmtLabel(ownerOff)}`}</span>
        <small>{`${vi ? 'Giờ của bạn' : 'Your time'}: ${pad2(now.getHours())}:${pad2(now.getMinutes())} (${diffTxt})`}</small>
      </div>
    </div>
  );
}

// ===== Chip =====
function Chip({ raw }) {
  const tag = resolveAboutTag(raw);
  const [failed, setFailed] = useState(false);
  if (!tag) return null;
  const icon = tagIconUrl(tag);
  return (
    <span className="wa-chip">
      {icon && !failed && (
        <img src={icon} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      )}
      {tag.name}
    </span>
  );
}

// ===== Trang Giới thiệu nâng cao =====
export default function WebAboutAdvanced({ profile, badges = [], textColor = '#ffffff', glowBadges = true }) {
  const { language } = useLanguage();
  const vi = language === 'vi';
  const title = profile.webAboutTitle || (vi ? 'Về tôi' : 'About Me');
  const text = String(profile.webAboutText || '').trim();
  const tags = useMemo(
    () => (Array.isArray(profile.webAboutTags) ? profile.webAboutTags : []).slice(0, 16),
    [profile.webAboutTags]
  );
  const showClock = profile.webAboutClock !== false;
  const name = profile.displayName || profile.username || 'KonOne';
  const status = String(profile.webAboutStatus || '').trim() || (profile.username ? `@${profile.username}` : '');

  return (
    <div className="wa-wrap" style={{ color: textColor }}>
      <h2 className="wa-title">{title}</h2>

      {text && (
        <div className="wa-card wa-text-card">
          <RichAboutText text={text} />
        </div>
      )}

      <div className={`wa-row${showClock ? '' : ' is-single'}`}>
        <div className="wa-card wa-profile-card">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="wa-avatar" />
          ) : (
            <img src="/logo-konone-v1.png" alt="" className="wa-avatar" />
          )}
          <div className="wa-profile-meta">
            <div className="wa-profile-name-row">
              <strong>{name}</strong>
              {badges.length > 0 && (
                <span className="wa-badge-box">
                  {badges.map((b) => (
                    <span
                      key={b.key}
                      className="guns-badge-ico"
                      title={b.label}
                      style={{ filter: glowBadges ? `drop-shadow(0 0 6px ${textColor})` : 'none' }}
                    >
                      {b.icon}
                    </span>
                  ))}
                </span>
              )}
            </div>
            {status && <em className="wa-status">{status}</em>}
          </div>
        </div>

        {showClock && <ClockCard timeZone={profile.webAboutTimezone} color={textColor} />}
      </div>

      {tags.length > 0 && (
        <div className="wa-chips">
          {tags.map((raw) => (
            <Chip key={raw} raw={raw} />
          ))}
        </div>
      )}
    </div>
  );
}
