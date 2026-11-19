import React, { useEffect, useRef, useState } from 'react';
import SlideCommit from './SlideCommit';

// SlideCommit rộng theo khung chứa (SlideCommit gốc cần width cố định tính bằng px)
export default function FluidSlideCommit({ minWidth = 200, ...props }) {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.max(minWidth, Math.floor(el.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minWidth]);

  return (
    <div ref={boxRef} style={{ width: '100%' }}>
      {/* key theo width để SlideCommit tính lại hành trình khi đổi kích thước */}
      {width > 0 && <SlideCommit key={width} width={width} {...props} />}
    </div>
  );
}
