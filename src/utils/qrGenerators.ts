// QR code data generators for different types

export interface WiFiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
}

export interface UPIData {
  upiId: string;
  name: string;
  amount: string;
  note: string;
}

// Generate WiFi QR string
export const generateWiFiString = (data: WiFiData): string => {
  const escape = (str: string) => str.replace(/[\\;,:""]/g, '\\$&');
  return `WIFI:T:${data.encryption};S:${escape(data.ssid)};P:${escape(data.password)};H:${data.hidden ? 'true' : 'false'};;`;
};

// Generate vCard string for contacts
export const generateVCardString = (data: ContactData): string => {
  return `BEGIN:VCARD
VERSION:3.0
N:${data.lastName};${data.firstName}
FN:${data.firstName} ${data.lastName}
TEL:${data.phone}
EMAIL:${data.email}
ORG:${data.organization}
END:VCARD`;
};

// Generate UPI payment string
export const generateUPIString = (data: UPIData): string => {
  let upi = `upi://pay?pa=${encodeURIComponent(data.upiId)}`;
  if (data.name) upi += `&pn=${encodeURIComponent(data.name)}`;
  if (data.amount) upi += `&am=${data.amount}`;
  if (data.note) upi += `&tn=${encodeURIComponent(data.note)}`;
  return upi;
};

// Generate SMS string
export const generateSMSString = (phone: string, message: string): string => {
  return `sms:${phone}?body=${encodeURIComponent(message)}`;
};

// Generate phone call string
export const generatePhoneString = (phone: string): string => {
  return `tel:${phone}`;
};
