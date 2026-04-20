// Turkish phone number formatting and validation
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Handle Turkish phone numbers starting with 0 or country code
  let cleaned = digits;
  if (cleaned.startsWith('90') && cleaned.length > 10) {
    cleaned = '0' + cleaned.slice(2);
  }
  if (!cleaned.startsWith('0') && cleaned.length <= 10) {
    cleaned = '0' + cleaned;
  }
  
  // Format: 0XXX XXX XX XX
  if (cleaned.length <= 1) return cleaned;
  if (cleaned.length <= 4) return cleaned.slice(0, 1) + cleaned.slice(1);
  if (cleaned.length <= 7) return cleaned.slice(0, 4) + ' ' + cleaned.slice(4);
  if (cleaned.length <= 9) return cleaned.slice(0, 4) + ' ' + cleaned.slice(4, 7) + ' ' + cleaned.slice(7);
  return cleaned.slice(0, 4) + ' ' + cleaned.slice(4, 7) + ' ' + cleaned.slice(7, 9) + ' ' + cleaned.slice(9, 11);
}

export function cleanPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidTurkishPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  // Must be 11 digits starting with 0, second digit 5 for mobile or 2-4 for landline
  return /^0[2-5]\d{9}$/.test(digits);
}

// Turkish tax number validation (Vergi Kimlik Numarası)
export function isValidTaxNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;
  
  // 10-digit: Corporate tax number
  if (digits.length === 10) {
    return /^\d{10}$/.test(digits);
  }
  
  // 11-digit: TC Kimlik No - algorithmic check
  if (digits.length === 11) {
    if (digits[0] === '0') return false;
    const d = digits.split('').map(Number);
    const sum1 = ((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10;
    if (sum1 !== d[9]) return false;
    const sum2 = d.slice(0, 10).reduce((a: number, b: number) => a + b, 0) % 10;
    if (sum2 !== d[10]) return false;
    return true;
  }
  return false;
}

export function formatTaxNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}
