import React, { useEffect, useRef, useState } from 'react';
import { MILESTONES, EVENT_START, EVENT_END } from '../constants/inviteEvent';
import './InviteMilestones.css';

const ICONS = {
  diamond: (<><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20" /><path d="M12 21 8 9l4-6 4 6z" /></>),
  play: (<><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3z" /></>),
  wave: (<><circle cx="12" cy="12" r="10" /><path d="M7 9.5c3.5-1 7.5-.6 10.5 1.2" /><path d="M7.5 12.8c3-.8 6-.4 8.5 1" /><path d="M8 15.8c2.4-.5 4.5-.2 6.5.8" /></>),
  crown: (<><path d="M3 18 2 7l5.5 4L12 4l4.5 7L22 7l-1 11z" /><path d="M3 21h18" /></>),
  headphones: (<><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><rect x="2" y="14" width="5" height="7" rx="2" /><rect x="17" y="14" width="5" height="7" rx="2" /></>),
  check: <polyline points="20 6 9 17 4 12" />,
  flag: (<><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>),
  lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>)
};

function Svg({ name, size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

const fmtDate = (d, lang) =>
  d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

export default function InviteMilestones({ info, language, eligible, onClaim }) {
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const [now, setNow] = useState(() => new Date());
  const [choice, setChoice] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null); // { id, text }

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const milestones = info?.milestones || MILESTONES;
  const eventStart = info?.event ? new Date(info.event.start) : EVENT_START;
  const eventEnd = info?.event ? new Date(info.event.end) : EVENT_END;
  const uses = info?.uses || 0;
  const state = now < eventStart ? 'upcoming' : now > eventEnd ? 'ended' : 'active';
  const daysLeft = Math.max(0, Math.ceil((eventEnd - now) / 86400000));
  const nextIdx = milestones.findIndex((m) => uses < m.need);
  const next = nextIdx === -1 ? null : milestones[nextIdx];
  const nextPct = next ? Math.min(100, (uses / next.need) * 100) : 100;

  // Robot đứng ở vị trí hiện tại: cột 0 = điểm xuất phát, cột i = cột mốc thứ i
  const COL = 232;
  const cols = milestones.length + 1;
  let lastIdx = 0; // chỉ số cột đã đạt gần nhất
  milestones.forEach((m, i) => {
    if (uses >= m.need) lastIdx = i + 1;
  });
  const prevNeed = lastIdx === 0 ? 0 : milestones[lastIdx - 1].need;
  const nextNeed = lastIdx < milestones.length ? milestones[lastIdx].need : null;
  const frac = nextNeed ? (uses - prevNeed) / (nextNeed - prevNeed) : 0;
  const robotX = (lastIdx + 0.5) * COL + frac * COL;
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, robotX - el.clientWidth / 2), behavior: 'smooth' });
  }, [robotX]);

  async function claim(m) {
    setBusy(m.id);
    setMsg(null);
    try {
      await onClaim(m.id, choice[m.id]);
    } catch (err) {
      setMsg({ id: m.id, text: err.message });
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="ms">
      <div className="ms-banner">
        <div className="ms-banner-top">
          <span className="ms-tag">{L('SỰ KIỆN', 'EVENT')}</span>
          <span className={`ms-state ${state}`}>
            {state === 'active' && L(`Còn ${daysLeft} ngày`, `${daysLeft} days left`)}
            {state === 'upcoming' && L('Sắp diễn ra', 'Coming soon')}
            {state === 'ended' && L('Đã kết thúc', 'Ended')}
          </span>
        </div>
        <h2>{L('Mời bạn bè — Nhận quà Premium', 'Invite friends — Win Premium gifts')}</h2>
        <div className="ms-dates">
          <Svg name="calendar" size={15} />
          {fmtDate(eventStart, language)} → {fmtDate(eventEnd, language)}
        </div>
        <div className="ms-next-text">
          {next ? (
            <>
              <strong>{uses.toLocaleString()}</strong> / {next.need.toLocaleString()} {L('lượt mời', 'invites')} · {L('còn', 'need')}{' '}
              <strong>{(next.need - uses).toLocaleString()}</strong> {L('để nhận', 'for')} {next.title[language] || next.title.vi}
            </>
          ) : (
            L('Bạn đã đạt mọi cột mốc!', 'You reached every milestone!')
          )}
        </div>
        <div className="ms-bar"><i style={{ width: `${nextPct}%` }} /></div>
      </div>

      <div className="ms-scroll" ref={scrollRef}>
        <div className="ms-track" style={{ width: cols * COL }}>
          {/* Đường đi: đường ray + các nút + robot cùng một hệ tọa độ nên luôn thẳng hàng */}
          <div className="ms-lane">
            <div className="ms-rail" style={{ left: COL / 2, width: (cols - 1) * COL }} />
            <div className="ms-rail-fill" style={{ left: COL / 2, width: Math.max(0, robotX - COL / 2) }} />

            <div className="ms-node reached" style={{ left: COL / 2 }}><Svg name="flag" size={16} /></div>
            {milestones.map((m, idx) => {
              const reached = uses >= m.need;
              const mine = info?.myClaims?.[m.id];
              const nodeIcon = mine ? 'check' : reached || idx === nextIdx ? m.icon : 'lock';
              return (
                <div
                  key={m.id}
                  className={`ms-node tone-${m.tone} ${reached ? 'reached' : ''} ${mine ? 'claimed' : ''}`}
                  style={{ left: (idx + 1.5) * COL }}
                >
                  <Svg name={nodeIcon} size={nodeIcon === 'lock' ? 14 : 17} />
                </div>
              );
            })}

            <div className="ms-robot" style={{ left: robotX }} title={L('Vị trí của bạn', 'Your position')}>
              <div className="ms-bubble" aria-label={L(`${uses} lượt mời`, `${uses} invites`)}>{uses.toLocaleString()}</div>
              <svg viewBox="0 0 48 64" width="40" height="54" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="24" y1="3" x2="24" y2="10" />
                <circle cx="24" cy="3" r="2" fill="currentColor" />
                <rect x="10" y="10" width="28" height="19" rx="6" />
                <circle cx="18" cy="19" r="2.4" fill="currentColor" />
                <circle cx="30" cy="19" r="2.4" fill="currentColor" />
                <line x1="19" y1="25" x2="29" y2="25" />
                <rect x="13" y="32" width="22" height="16" rx="4" />
                <circle cx="24" cy="40" r="2" />
                <path d="M13 36 7 42" />
                <path d="M35 36l6 6" />
                <path d="M19 48v10" />
                <path d="M29 48v10" />
                <path d="M15 58h8" />
                <path d="M25 58h8" />
              </svg>
            </div>
          </div>

          <ol className="ms-cols" style={{ gridTemplateColumns: `repeat(${cols}, ${COL}px)` }}>
            <li className="ms-col"><div className="ms-start-label">{L('Xuất phát', 'Start')}</div></li>
            {milestones.map((m) => {
              const reached = uses >= m.need;
              const taken = info?.claimed?.[m.id] || 0;
              const left = Math.max(0, m.slots - taken);
              const mine = info?.myClaims?.[m.id];
              const full = left === 0 && !mine;
              const canClaim = reached && !mine && !full && state === 'active' && eligible;
              const needChoice = m.choices.length > 1;
              return (
                <li key={m.id} className={`ms-col ms-item tone-${m.tone} ${reached ? 'reached' : ''} ${mine ? 'claimed' : ''} ${full ? 'full' : ''}`}>
                  <div className="ms-card">
                    <div className="ms-need">{L('Mời', 'Invite')} <b>{m.need.toLocaleString()}</b> {L('người', 'people')}</div>
                    <h3>{m.title[language] || m.title.vi}</h3>
                    <span className={`ms-slots ${left === 0 ? 'out' : left <= 2 ? 'low' : ''}`}>
                      {left === 0 ? L('Hết slot', 'Sold out') : `${left}/${m.slots} slot`}
                    </span>

                    {needChoice && canClaim && (
                      <div className="ms-choices">
                        {m.choices.map((c) => (
                          <button key={c.key} type="button" className={choice[m.id] === c.key ? 'on' : ''} onClick={() => setChoice((st) => ({ ...st, [m.id]: c.key }))}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="ms-foot">
                      {mine ? (
                        <span className="ms-done">
                          {mine.status === 'granted'
                            ? L('Đã cộng Premium vào tài khoản', 'Premium added to your account')
                            : L('Đã giữ slot — KonOne sẽ liên hệ qua email', 'Slot reserved — KonOne will email you')}
                        </span>
                      ) : canClaim ? (
                        <button type="button" className="ms-claim" disabled={busy === m.id || (needChoice && !choice[m.id])} onClick={() => claim(m)}>
                          {busy === m.id ? L('Đang xử lý…', 'Processing…') : needChoice && !choice[m.id] ? L('Chọn quà để nhận', 'Pick a gift') : L('Nhận quà', 'Claim')}
                        </button>
                      ) : reached && full ? (
                        <span className="ms-hint">{L('Đã có người nhận hết', 'All slots taken')}</span>
                      ) : reached && state !== 'active' ? (
                        <span className="ms-hint">{L('Sự kiện không diễn ra', 'Event not active')}</span>
                      ) : reached && !eligible ? (
                        <span className="ms-hint">{L('Cần hồ sơ public để nhận', 'Public profile required')}</span>
                      ) : (
                        <span className="ms-hint">{L(`Còn ${(m.need - uses).toLocaleString()} lượt mời`, `${(m.need - uses).toLocaleString()} invites to go`)}</span>
                      )}
                    </div>
                    {msg?.id === m.id && <div className="ms-err">{msg.text}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <p className="ms-rules">
        {L(
          '* Chỉ tính người được mời đã xác minh email và tạo hồ sơ public. Quà có số slot giới hạn: ai đạt mốc và nhận trước sẽ được giữ slot.',
          '* Only invitees with a verified email and a public profile count. Gifts have limited slots: first to reach and claim wins.'
        )}
      </p>
    </section>
  );
}
