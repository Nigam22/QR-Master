import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FileText, Globe, Landmark, Mail, Phone, User, Wifi } from 'lucide-react';

export type QrTypeId =
  | 'upi'
  | 'wifi'
  | 'phone'
  | 'sms'
  | 'url'
  | 'link'
  | 'text'
  | 'contact'
  | string;

export function getQrTypeIconComponent(type: QrTypeId) {
  switch ((type || '').toLowerCase()) {
    case 'upi':
      return Landmark;
    case 'wifi':
      return Wifi;
    case 'phone':
      return Phone;
    case 'sms':
      return Mail;
    case 'url':
    case 'link':
      return Globe;
    case 'contact':
      return User;
    case 'text':
    default:
      return FileText;
  }
}

function svgToDataUri(svgMarkup: string): string {
  // Encode to base64 safely for UTF-8
  const encoded = btoa(unescape(encodeURIComponent(svgMarkup)));
  return `data:image/svg+xml;base64,${encoded}`;
}

export function getQrTypeIconDataUri(type: QrTypeId, opts?: { color?: string; size?: number }): string {
  const Icon = getQrTypeIconComponent(type);
  const color = opts?.color ?? '#111827'; // near-black
  const size = opts?.size ?? 64;

  // Lucide outputs valid SVG markup including xmlns
  const markup = renderToStaticMarkup(<Icon color={color} size={size} strokeWidth={2.25} />);
  return svgToDataUri(markup);
}


