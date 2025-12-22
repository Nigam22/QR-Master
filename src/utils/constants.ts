// App constants - Replace with your actual Play Store URL after publishing
export const APP_CONSTANTS = {
  APP_NAME: 'QR Master – Scanner & Generator',
  APP_VERSION: '1.0.0',
  
  // Replace this with your actual Play Store URL after publishing
  // Example: https://play.google.com/store/apps/details?id=com.yourcompany.qrmaster
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.nrplaystudio.qrmaster',
  
  // Share text
  SHARE_TEXT: 'Check out QR Master - The best QR Scanner & Generator app! Download now:',
  
  // Support email
  SUPPORT_EMAIL: 'nigamrathore123456@gmail.com',
  
  // Privacy policy URL (replace with your actual URL)
  PRIVACY_POLICY_URL: 'https://example.com/privacy',
};

// Format timestamp to readable time
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};