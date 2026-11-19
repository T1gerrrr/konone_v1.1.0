import React, { useState, useEffect } from 'react';
import Lanyard from './Lanyard';
import { PLATFORM_BY_KEY } from '../constants/socialPlatforms';

function loadImg(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
      line = words[n] + ' ';
      lineCount++;
      if (lineCount >= maxLines - 1) {
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
  }
}

/**
 * Wrapper kết nối dữ liệu Hồ sơ KonOne vào component Three.js <Lanyard /> gốc của ReactBits.
 * Tự động render mặt trước (frontImage), mặt sau (backImage) và dây đeo (strapImage) từ thông tin profile.
 */
export default function LanyardCard({
  profile = {},
  interactive = true,
  compact = false,
  fullScreen = false,
  strapColor = '#111111',
  cardBgColor = '#18161c',
  badgeLabel = 'KONONE PASS',
  finish = 'glossy',
  orientation = 'portrait',
  cornerRadius = 0.3,
  strapLength = 0.5,
  strapWidth = 0.65,
  metal = 'silver',
  gravity = 1,
  damping = 0.5,
  elasticity = 0.5,
  breeze = 0.5,
  intro = true
}) {
  const [textures, setTextures] = useState({
    front: '',
    back: ''
  });

  const effectiveCardColor = cardBgColor || profile.lanyardCardColor || profile.cardColor || '#18161c';
  const effectiveStrapColor = strapColor || profile.lanyardStrapColor || '#111111';
  const effectiveTextColor = profile.textColor || '#ffffff';
  const displayName = profile.displayName || profile.username || 'KONONE';
  const username = profile.username || 'konone';
  const bio = profile.bio || 'KonOne Digital Identity Pass';
  const uidCode = (profile.userId || 'KONONE26').slice(0, 8).toUpperCase();
  const views = (profile.viewCount || 0).toLocaleString();
  const fontFamily = profile.textFontFamily || 'Inter, Segoe UI, Arial, sans-serif';

  useEffect(() => {
    let active = true;

    async function generateCardFaces() {
      const [logoImg, avatarImg, frameImg, coverImg] = await Promise.all([
        loadImg('/logo-konone-v1.png'),
        loadImg(profile.avatar || '/logo-konone-v1.png'),
        loadImg(profile.avatarFrame),
        loadImg(profile.coverImage)
      ]);

      if (!active) return;

      const W = 1024;
      const H = 1440;

      // ================= 1. MẶT TRƯỚC (FRONT IMAGE) =================
      const frontCanvas = document.createElement('canvas');
      frontCanvas.width = W;
      frontCanvas.height = H;
      const fctx = frontCanvas.getContext('2d');

      if (fctx) {
        // Nền thẻ theo màu người dùng chọn
        fctx.fillStyle = effectiveCardColor;
        fctx.fillRect(0, 0, W, H);

        // Ánh sáng trang trí góc trên & dưới
        const grad1 = fctx.createRadialGradient(W * 0.85, H * 0.12, 20, W * 0.85, H * 0.12, 520);
        grad1.addColorStop(0, `${effectiveStrapColor}55`);
        grad1.addColorStop(1, 'transparent');
        fctx.fillStyle = grad1;
        fctx.fillRect(0, 0, W, H);

        const grad2 = fctx.createRadialGradient(W * 0.15, H * 0.88, 20, W * 0.15, H * 0.88, 560);
        grad2.addColorStop(0, 'rgba(162, 28, 175, 0.28)');
        grad2.addColorStop(1, 'transparent');
        fctx.fillStyle = grad2;
        fctx.fillRect(0, 0, W, H);

        // Header brand (dưới khe móc dây)
        const headerY = 175;
        if (logoImg) {
          fctx.drawImage(logoImg, 72, headerY - 34, 52, 52);
        }
        fctx.fillStyle = effectiveTextColor;
        fctx.font = `800 32px ${fontFamily}`;
        fctx.textAlign = 'left';
        fctx.fillText(String(badgeLabel || 'KONONE PASS').toUpperCase(), logoImg ? 140 : 72, headerY + 3);

        // Chip LIVE 3D bên phải
        roundRect(fctx, W - 245, headerY - 32, 173, 52, 26);
        fctx.fillStyle = 'rgba(246, 92, 92, 0.18)';
        fctx.fill();
        fctx.lineWidth = 2.5;
        fctx.strokeStyle = 'rgba(246, 92, 92, 0.65)';
        fctx.stroke();

        fctx.fillStyle = '#fda4af';
        fctx.font = `700 24px ${fontFamily}`;
        fctx.textAlign = 'center';
        fctx.fillText('● LIVE 3D', W - 158, headerY + 2);

        // Khung Banner / Cover ở giữa trên
        const bannerX = 68;
        const bannerY = 240;
        const bannerW = W - 136;
        const bannerH = 390;

        fctx.save();
        roundRect(fctx, bannerX, bannerY, bannerW, bannerH, 42);
        fctx.clip();

        if (coverImg) {
          const scale = Math.max(bannerW / coverImg.width, bannerH / coverImg.height);
          const cw = coverImg.width * scale;
          const ch = coverImg.height * scale;
          fctx.drawImage(coverImg, bannerX + (bannerW - cw) / 2, bannerY + (bannerH - ch) / 2, cw, ch);
          fctx.fillStyle = 'rgba(10, 10, 16, 0.38)';
          fctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        } else {
          const bGrad = fctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY + bannerH);
          bGrad.addColorStop(0, '#2a151d');
          bGrad.addColorStop(0.5, '#191622');
          bGrad.addColorStop(1, '#261428');
          fctx.fillStyle = bGrad;
          fctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        }
        fctx.restore();

        // Viền khung Banner
        roundRect(fctx, bannerX, bannerY, bannerW, bannerH, 42);
        fctx.lineWidth = 3;
        fctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        fctx.stroke();

        // Avatar tròn chính giữa
        const avCx = W / 2;
        const avCy = bannerY + bannerH / 2;
        const avR = 128;

        // Vòng sáng quanh Avatar
        fctx.beginPath();
        fctx.arc(avCx, avCy, avR + 8, 0, Math.PI * 2);
        fctx.fillStyle = effectiveStrapColor === '#111111' ? '#f65c5c' : effectiveStrapColor;
        fctx.fill();

        fctx.save();
        fctx.beginPath();
        fctx.arc(avCx, avCy, avR, 0, Math.PI * 2);
        fctx.clip();

        if (avatarImg) {
          const scale = Math.max((avR * 2) / avatarImg.width, (avR * 2) / avatarImg.height);
          const aw = avatarImg.width * scale;
          const ah = avatarImg.height * scale;
          fctx.drawImage(avatarImg, avCx - aw / 2, avCy - ah / 2, aw, ah);
        } else {
          fctx.fillStyle = '#181822';
          fctx.fillRect(avCx - avR, avCy - avR, avR * 2, avR * 2);
          fctx.fillStyle = '#ffffff';
          fctx.font = `800 105px ${fontFamily}`;
          fctx.textAlign = 'center';
          fctx.textBaseline = 'middle';
          fctx.fillText(displayName.charAt(0).toUpperCase(), avCx, avCy + 6);
          fctx.textBaseline = 'alphabetic';
        }
        fctx.restore();

        // Khung Avatar Frame (nếu có)
        if (frameImg) {
          const fw = avR * 2.55;
          fctx.drawImage(frameImg, avCx - fw / 2, avCy - fw / 2, fw, fw);
        }

        // Tên hiển thị
        fctx.fillStyle = effectiveTextColor;
        fctx.font = `800 72px ${fontFamily}`;
        fctx.textAlign = 'center';
        fctx.fillText(displayName, W / 2, 742);

        // @username
        fctx.fillStyle = effectiveStrapColor === '#111111' ? '#f65c5c' : effectiveStrapColor;
        fctx.font = `600 40px ${fontFamily}`;
        fctx.fillText(`@${username}`, W / 2, 804);

        // Bio
        fctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        fctx.font = `400 35px ${fontFamily}`;
        wrapText(fctx, bio, W / 2, 882, W - 180, 48, 2);

        // Khung Presence / Location nếu có
        if (profile.presenceTitle || profile.presenceSubtitle || profile.location) {
          const pY = 1015;
          roundRect(fctx, 110, pY, W - 220, 128, 28);
          fctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          fctx.fill();
          fctx.lineWidth = 2;
          fctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          fctx.stroke();

          fctx.beginPath();
          fctx.arc(165, pY + 64, 14, 0, Math.PI * 2);
          fctx.fillStyle = '#22c55e';
          fctx.fill();

          fctx.textAlign = 'left';
          fctx.fillStyle = '#ffffff';
          fctx.font = `700 33px ${fontFamily}`;
          fctx.fillText(
            profile.presenceTitle || profile.location || 'Active on KonOne',
            205,
            pY + 56
          );

          fctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          fctx.font = `500 27px ${fontFamily}`;
          fctx.fillText(
            profile.presenceSubtitle || (profile.location ? `📍 ${profile.location}` : 'konone.fun'),
            205,
            pY + 96
          );
        }

        // Hàng Icon Mạng xã hội bên trong thẻ 3D nếu socialPosition === 'inside'
        const isInsideSocial = (profile.socialPosition || 'inside') === 'inside';
        const linkedKeys = Object.entries(profile.socialLinks || {})
          .filter(([, v]) => Boolean(v && String(v).trim()))
          .map(([k]) => k);
        const customArr = Array.isArray(profile.customLinks)
          ? profile.customLinks.filter((c) => Boolean(c?.url))
          : [];

        if (isInsideSocial && (linkedKeys.length > 0 || customArr.length > 0)) {
          const allBadges = [
            ...linkedKeys.map((k) => ({
              label: (PLATFORM_BY_KEY[k]?.name || k).slice(0, 2).toUpperCase(),
              color: PLATFORM_BY_KEY[k]?.color || '#ffffff'
            })),
            ...customArr.map((c) => ({
              label: (c.label || 'URL').slice(0, 2).toUpperCase(),
              color: '#e4e4e7'
            }))
          ].slice(0, 8);

          const pillSize = 58;
          const gap = 18;
          const totalW = allBadges.length * pillSize + (allBadges.length - 1) * gap;
          let startX = (W - totalW) / 2;
          const rowY = 1148;

          allBadges.forEach((b) => {
            roundRect(fctx, startX, rowY, pillSize, pillSize, 16);
            fctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            fctx.fill();
            fctx.lineWidth = 2;
            fctx.strokeStyle = `${b.color}88`;
            fctx.stroke();

            fctx.textAlign = 'center';
            fctx.fillStyle = b.color;
            fctx.font = `800 22px ${fontFamily}`;
            fctx.fillText(b.label, startX + pillSize / 2, rowY + 37);
            startX += pillSize + gap;
          });
        }

        // Đường kẻ đứt chân thẻ
        fctx.beginPath();
        fctx.setLineDash([14, 10]);
        fctx.moveTo(72, 1225);
        fctx.lineTo(W - 72, 1225);
        fctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        fctx.lineWidth = 2.5;
        fctx.stroke();
        fctx.setLineDash([]);

        // ID bên trái
        fctx.textAlign = 'left';
        fctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        fctx.font = `700 24px ${fontFamily}`;
        fctx.fillText('PASS ID', 76, 1285);
        fctx.fillStyle = '#ffffff';
        fctx.font = '700 36px monospace';
        fctx.fillText(`#${uidCode}`, 76, 1335);

        // Mã vạch ở giữa
        const barStartX = W / 2 - 125;
        const barWidths = [6, 12, 4, 8, 14, 4, 10, 6, 4, 12, 8, 6, 14, 4, 8, 10, 6];
        let bx = barStartX;
        fctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        barWidths.forEach((bw, idx) => {
          if (idx % 2 === 0) {
            fctx.fillRect(bx, 1272, bw, 68);
          }
          bx += bw + 7;
        });

        // Views bên phải
        fctx.textAlign = 'right';
        fctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        fctx.font = `700 24px ${fontFamily}`;
        fctx.fillText('VIEWS', W - 76, 1285);
        fctx.fillStyle = '#ffffff';
        fctx.font = '700 36px monospace';
        fctx.fillText(views, W - 76, 1335);
      }

      // ================= 2. MẶT SAU (BACK IMAGE — KHI CLICK LẬT THẺ) =================
      const backCanvas = document.createElement('canvas');
      backCanvas.width = W;
      backCanvas.height = H;
      const bctx = backCanvas.getContext('2d');

      if (bctx) {
        bctx.fillStyle = effectiveCardColor;
        bctx.fillRect(0, 0, W, H);

        const bGrad = bctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 650);
        bGrad.addColorStop(0, `${effectiveStrapColor}44`);
        bGrad.addColorStop(1, 'transparent');
        bctx.fillStyle = bGrad;
        bctx.fillRect(0, 0, W, H);

        if (logoImg) {
          bctx.drawImage(logoImg, W / 2 - 130, H / 2 - 240, 260, 260);
        }

        bctx.textAlign = 'center';
        bctx.fillStyle = effectiveTextColor;
        bctx.font = `900 68px ${fontFamily}`;
        bctx.fillText('KONONE', W / 2, H / 2 + 115);

        bctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
        bctx.font = `600 34px ${fontFamily}`;
        bctx.fillText(`konone.fun/${username}`, W / 2, H / 2 + 175);

        roundRect(bctx, W / 2 - 220, H - 230, 440, 74, 37);
        bctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        bctx.fill();
        bctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        bctx.font = `600 26px ${fontFamily}`;
        bctx.fillText('VERIFIED CREATOR PASS', W / 2, H - 183);
      }

      if (active) {
        setTextures({
          front: frontCanvas.toDataURL('image/png'),
          back: backCanvas.toDataURL('image/png')
        });
      }
    }

    generateCardFaces();
    return () => {
      active = false;
    };
  }, [
    profile.avatar,
    profile.avatarFrame,
    profile.coverImage,
    profile.displayName,
    profile.username,
    profile.bio,
    profile.presenceTitle,
    profile.presenceSubtitle,
    profile.location,
    profile.userId,
    profile.viewCount,
    profile.textFontFamily,
    profile.socialPosition,
    profile.socialLinks,
    profile.customLinks,
    effectiveCardColor,
    effectiveStrapColor,
    effectiveTextColor,
    badgeLabel,
    displayName,
    username,
    bio,
    uidCode,
    views,
    fontFamily
  ]);

  return (
    <div
      style={{
        width: fullScreen ? '100vw' : '100%',
        height: fullScreen ? '100vh' : compact ? '460px' : '600px',
        minHeight: fullScreen ? '640px' : undefined,
        position: 'relative'
      }}
    >
      <Lanyard
        frontImage={textures.front || undefined}
        backImage={textures.back || undefined}
        strapImage={profile.strapImage || undefined}
        imageFit="cover"
        cardColor={effectiveCardColor}
        orientation={orientation}
        finish={finish}
        cornerRadius={cornerRadius}
        size={compact ? 0.56 : 0.6}
        anchor="center"
        strapLength={strapLength}
        strapColor={effectiveStrapColor}
        strapWidth={strapWidth}
        metal={metal}
        gravity={gravity}
        damping={damping}
        elasticity={elasticity}
        breeze={breeze}
        interactive={interactive}
        intro={intro}
      />
    </div>
  );
}
