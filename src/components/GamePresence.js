import React, { useEffect, useState } from 'react';
import { resolveGame } from '../constants/games';
import { useLanguage } from '../contexts/LanguageContext';
import './GamePresence.css';

// Thẻ "Đang chơi" dưới Avatar ở bố cục Basic: avatar + chấm trạng thái, tên, dòng "Playing <game>", logo game bên phải
export default function GamePresence({ profile, textColor = '#ffffff', demo = false }) {
  const { language } = useLanguage();
  const game = resolveGame(profile);
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = game ? game.logo : '';

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  if (!game) return null;

  const vi = language === 'vi';
  const name = profile.displayName || profile.username || 'KonOne';
  const detail = String(profile.gameDetail || '').trim();
  const showLogo = game.logo && !logoFailed;

  return (
    <div
      className={`game-presence${demo ? ' is-demo' : ''}`}
      style={{ color: textColor }}
    >
      <div className="game-presence-avatar-wrap">
        {profile.avatar ? (
          <img src={profile.avatar} alt="" className="game-presence-avatar" />
        ) : (
          <img src="/logo-konone-v1.png" alt="" className="game-presence-avatar" />
        )}
        <span className="game-presence-dot" aria-hidden="true" />
      </div>

      <div className="game-presence-meta">
        <strong className="game-presence-name">{name}</strong>
        <span className="game-presence-line">
          <b>{vi ? 'Đang chơi' : 'Playing'}</b> {game.name}
        </span>
        {detail && <span className="game-presence-detail">{detail}</span>}
      </div>

      <div className="game-presence-logo" title={game.name}>
        {showLogo ? (
          <img
            src={game.logo}
            alt={game.name}
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span>{game.short}</span>
        )}
      </div>
    </div>
  );
}
