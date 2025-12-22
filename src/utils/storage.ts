// Local storage utilities for QR history management

export interface ScanHistoryItem {
  id: string;
  content: string;
  type: 'text' | 'url' | 'phone' | 'email' | 'wifi' | 'barcode' | 'other';
  timestamp: number;
  isFavorite?: boolean;
  barcodeFormat?: string;
}

export interface GeneratedHistoryItem {
  id: string;
  content: string;
  type: string;
  qrData: string;
  timestamp: number;
  isFavorite?: boolean;
  styleId?: string;
  qrColor?: string;
}

const SCAN_HISTORY_KEY = 'qr_master_scan_history';
const GENERATED_HISTORY_KEY = 'qr_master_generated_history';

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Detect content type from scanned data
export const detectContentType = (content: string): ScanHistoryItem['type'] => {
  if (/^https?:\/\//i.test(content)) return 'url';
  if (/^tel:/i.test(content) || /^\+?[\d\s-()]+$/.test(content)) return 'phone';
  if (/^mailto:/i.test(content) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content)) return 'email';
  if (/^WIFI:/i.test(content)) return 'wifi';
  return 'text';
};

// Scan History Functions
export const getScanHistory = (): ScanHistoryItem[] => {
  try {
    const data = localStorage.getItem(SCAN_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addScanHistory = (content: string): ScanHistoryItem => {
  const history = getScanHistory();
  const newItem: ScanHistoryItem = {
    id: generateId(),
    content,
    type: detectContentType(content),
    timestamp: Date.now(),
  };
  history.unshift(newItem);
  localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  return newItem;
};

export const clearScanHistory = (): void => {
  localStorage.removeItem(SCAN_HISTORY_KEY);
};

// Generated History Functions
export const getGeneratedHistory = (): GeneratedHistoryItem[] => {
  try {
    const data = localStorage.getItem(GENERATED_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addGeneratedHistory = (
  content: string, 
  type: string, 
  qrData: string,
  styleId?: string,
  qrColor?: string
): GeneratedHistoryItem => {
  const history = getGeneratedHistory();
  const newItem: GeneratedHistoryItem = {
    id: generateId(),
    content,
    type,
    qrData,
    timestamp: Date.now(),
    isFavorite: false,
    styleId,
    qrColor,
  };
  history.unshift(newItem);
  localStorage.setItem(GENERATED_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  return newItem;
};

export const clearGeneratedHistory = (): void => {
  localStorage.removeItem(GENERATED_HISTORY_KEY);
};

export const clearAllHistory = (): void => {
  clearScanHistory();
  clearGeneratedHistory();
};

// Toggle favorite status
export const toggleFavorite = (id: string, type: 'scan' | 'generated'): void => {
  if (type === 'scan') {
    const history = getScanHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
    }
  } else {
    const history = getGeneratedHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      localStorage.setItem(GENERATED_HISTORY_KEY, JSON.stringify(history));
    }
  }
};

// Delete single history item
export const deleteHistoryItem = (id: string, type: 'scan' | 'generated'): void => {
  if (type === 'scan') {
    const history = getScanHistory().filter(h => h.id !== id);
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
  } else {
    const history = getGeneratedHistory().filter(h => h.id !== id);
    localStorage.setItem(GENERATED_HISTORY_KEY, JSON.stringify(history));
  }
};
