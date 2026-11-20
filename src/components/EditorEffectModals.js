import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SnowEffect,
  RainEffect,
  StarsEffect,
  ParticlesEffect,
  LeavesEffect,
  AuroraEffect,
  FireworksEffect,
  MatrixEffect,
  ConfettiEffect,
  NebulaEffect
} from './Effects';
import DiamondIcon from './DiamondIcon';
import './EditorEffectModals.css';

const EFFECT_COMPONENTS = {
  snow: SnowEffect,
  particles: ParticlesEffect,
  confetti: ConfettiEffect,
  fireworks: FireworksEffect,
  rain: RainEffect,
  stars: StarsEffect,
  leaves: LeavesEffect,
  aurora: AuroraEffect,
  matrix: MatrixEffect,
  nebula: NebulaEffect
};

// key, tiếng Việt, tiếng Anh, premium?
export const BACKGROUND_EFFECTS = [
  ['none', 'Không có hiệu ứng', 'No effect', false],
  ['snow', 'Tuyết rơi', 'Snow', false],
  ['particles', 'Hạt sáng', 'Particles', false],
  ['confetti', 'Pháo giấy', 'Confetti', false],
  ['fireworks', 'Pháo hoa', 'Fireworks', false],
  ['rain', 'Mưa', 'Rain', true],
  ['stars', 'Bầu trời sao', 'Stars', true],
  ['leaves', 'Lá rơi', 'Leaves', true],
  ['aurora', 'Cực quang', 'Aurora', true],
  ['matrix', 'Matrix', 'Matrix', true],
  ['nebula', 'Tinh vân', 'Nebula', true]
];

const FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Impact', 'Trebuchet MS', 'Monaco'];

function CloseButton({ onClick, label }) {
  return (
    <button type="button" className="bg-modal-x" aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

// Hiệu ứng nền vẽ theo kích thước cửa sổ (position: fixed) -> thu nhỏ vừa khung demo
function EffectDemo({ effect }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.3);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const update = () => setScale(el.clientWidth / vw);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vw]);

  const Effect = EFFECT_COMPONENTS[effect];

  return (
    <div className="ee-demo" ref={boxRef} style={{ aspectRatio: `${vw} / ${vh}` }}>
      {Effect ? (
        <div
          className="ee-demo-stage"
          style={{ width: vw, height: vh, transform: `scale(${scale})` }}
          key={effect}
        >
          <Effect />
        </div>
      ) : (
        <span className="ee-demo-empty">Demo</span>
      )}
    </div>
  );
}

export function BackgroundEffectModal({ open, onClose, value, onChange, isPremium, L }) {
  useEscape(open, onClose);
  if (!open) return null;
  const current = BACKGROUND_EFFECTS.find((e) => e[0] === (value || 'none')) || BACKGROUND_EFFECTS[0];

  return createPortal(
    <div className="bg-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-modal ee-modal" role="dialog" aria-modal="true" aria-label={L('Hiệu ứng nền', 'Background effects')}>
        <div className="bg-modal-head">
          <strong>{L('Hiệu ứng nền', 'Background effects')}</strong>
          <CloseButton onClick={onClose} label={L('Đóng', 'Close')} />
        </div>

        <div className="ee-layout">
          <div className="ee-options" role="listbox" aria-label={L('Chọn hiệu ứng', 'Choose an effect')}>
            {BACKGROUND_EFFECTS.map(([key, vi, en, pro]) => (
              <button
                type="button"
                key={key}
                role="option"
                aria-selected={(value || 'none') === key}
                className={`ee-option${(value || 'none') === key ? ' active' : ''}`}
                onClick={() => onChange(key)}
              >
                <span>{L(vi, en)}</span>
                {pro && <DiamondIcon className="pro-diamond" />}
              </button>
            ))}
          </div>

          <div className="ee-preview">
            <EffectDemo effect={value || 'none'} />
            {current[3] && !isPremium && (
              <p className="bg-modal-note">{L('Hiệu ứng này chỉ lưu được với gói Premium.', 'This effect can only be saved with Premium.')}</p>
            )}
          </div>
        </div>

        <div className="bg-modal-foot">
          <button type="button" className="bg-modal-btn primary" onClick={onClose}>
            {L('Xong', 'Done')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function UsernameEffectModal({
  open,
  onClose,
  L,
  name,
  bio,
  textColor,
  glowOn,
  font,
  onFont,
  text3D,
  onText3D,
  nameScale,
  bioScale,
  onScale
}) {
  useEscape(open, onClose);
  if (!open) return null;

  const shadow = glowOn
    ? `0 0 14px ${textColor}aa, 0 0 26px ${textColor}44`
    : text3D
      ? '2px 2px 0 rgba(0,0,0,0.4), 4px 4px 0 rgba(0,0,0,0.2)'
      : 'none';

  const sliders = [
    ['nameScale', L('Cỡ chữ tiêu đề', 'Title size'), nameScale],
    ['bioScale', L('Cỡ chữ mô tả', 'Description size'), bioScale]
  ];

  return createPortal(
    <div className="bg-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-modal ee-modal" role="dialog" aria-modal="true" aria-label={L('Hiệu ứng tên', 'Username effects')}>
        <div className="bg-modal-head">
          <strong>{L('Hiệu ứng tên & phông chữ', 'Username effects & typography')}</strong>
          <CloseButton onClick={onClose} label={L('Đóng', 'Close')} />
        </div>

        <div className="ee-layout">
          <div className="ee-options ee-options--form">
            <label className="bg-modal-label">{L('Phông chữ', 'Font family')}</label>
            <div className="dark-input-box">
              <select value={font} onChange={(e) => onFont(e.target.value)}>
                {FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <label className="bg-modal-label bg-modal-label--gap">{L('Hiệu ứng chữ nổi 3D', '3D depth effect')}</label>
            <button
              type="button"
              className={`glow-toggle-btn full ${text3D ? 'on' : ''}`}
              onClick={() => onText3D(!text3D)}
              style={{ height: 42 }}
            >
              <span>✦</span>{' '}
              {text3D ? L('Đang bật chữ nổi 3D', '3D text enabled') : L('Bật chữ nổi 3D', 'Enable 3D text')}
            </button>

            {sliders.map(([key, text, val]) => (
              <div key={key} className="ee-slider">
                <label className="size-field-label">
                  <span>
                    {text}: <strong>{val}%</strong>
                  </span>
                  {Number(val) !== 100 && (
                    <button type="button" className="color-reset-link" onClick={() => onScale(key, 100)}>
                      {L('Mặc định', 'Reset')}
                    </button>
                  )}
                </label>
                <input
                  type="range"
                  min="60"
                  max="160"
                  step="5"
                  value={val}
                  onChange={(e) => onScale(key, Number(e.target.value))}
                  className="guns-range-slider"
                  style={{ '--val': `${((val - 60) / 100) * 100}%` }}
                />
              </div>
            ))}
          </div>

          <div className="ee-preview">
            <div className="ee-demo ee-demo--text">
              <h3
                className="ee-demo-name"
                style={{
                  color: textColor,
                  fontFamily: font || 'inherit',
                  fontSize: `${(Number(nameScale) || 100) * 0.3}px`,
                  textShadow: shadow
                }}
              >
                {name}
              </h3>
              <p
                className="ee-demo-bio"
                style={{
                  color: `${textColor}b3`,
                  fontSize: `${(Number(bioScale) || 100) * 0.13}px`
                }}
              >
                {bio}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-modal-foot">
          <button type="button" className="bg-modal-btn primary" onClick={onClose}>
            {L('Xong', 'Done')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
