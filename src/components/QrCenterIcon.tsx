import React from 'react';
import { getQrTypeIconComponent, type QrTypeId } from '@/utils/qrTypeIcons';

export function QrCenterIcon(props: { type: QrTypeId; qrSizePx: number; color?: string }) {
  const Icon = getQrTypeIconComponent(props.type);

  // Keep within 20–25% of QR size for scan reliability; user asked "few small".
  const ratio = 0.18;
  const iconBoxPx = Math.max(40, Math.min(Math.round(props.qrSizePx * ratio), Math.round(props.qrSizePx * 0.25)));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="rounded-full bg-white flex items-center justify-center shadow-sm"
        style={{ width: iconBoxPx, height: iconBoxPx }}
      >
        <Icon className="w-[60%] h-[60%]" style={{ color: props.color || 'hsl(var(--foreground))' }} />
      </div>
    </div>
  );
}


