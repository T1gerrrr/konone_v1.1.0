import React from 'react';
import LightRays from './LightRays';

// Cấu hình tia sáng dùng chung cho Home, Policy, Đăng ký
export default function PageRays() {
  return (
    <LightRays
      raysOrigin="top-center"
      raysColor="#ff5757"
      raysSpeed={1}
      lightSpread={0.5}
      rayLength={3}
      glow={0.6}
      haze={0.25}
      followMouse
      mouseInfluence={0.1}
      rayDensity={1}
      tilt={0}
      raySharpness={0.35}
      atmosphere={1}
      intensity={1}
      fadeDistance={1}
      saturation={1}
      noiseAmount={0}
      distortion={0}
      pulsating={false}
      cursorShadow
      clickPulse
      intro
      lightMode={false}
    />
  );
}
