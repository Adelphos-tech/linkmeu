/**
 * Phone Number Utilities
 * Auto-detect country code from phone number patterns
 */

// Country code patterns with their details
export const countryCodes = [
  { code: '+65', country: 'Singapore', flag: '🇸🇬', pattern: /^[689]\d{7}$/, digits: 8 },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', pattern: /^[1-9]\d{8,9}$/, digits: 10 },
  { code: '+91', country: 'India', flag: '🇮🇳', pattern: /^[6-9]\d{9}$/, digits: 10 },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸', pattern: /^[2-9]\d{9}$/, digits: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', pattern: /^[1-9]\d{9,10}$/, digits: 10 },
  { code: '+61', country: 'Australia', flag: '🇦🇺', pattern: /^[2-9]\d{8}$/, digits: 9 },
  { code: '+81', country: 'Japan', flag: '🇯🇵', pattern: /^[1-9]\d{9}$/, digits: 10 },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', pattern: /^[1-9]\d{8,9}$/, digits: 10 },
  { code: '+86', country: 'China', flag: '🇨🇳', pattern: /^1[3-9]\d{9}$/, digits: 11 },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', pattern: /^8\d{9,11}$/, digits: 11 },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', pattern: /^9\d{9}$/, digits: 10 },
  { code: '+66', country: 'Thailand', flag: '🇹🇭', pattern: /^[689]\d{8}$/, digits: 9 },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', pattern: /^[1-9]\d{8,9}$/, digits: 10 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', pattern: /^5\d{8}$/, digits: 9 },
  { code: '+49', country: 'Germany', flag: '🇩🇪', pattern: /^1[5-7]\d{8,9}$/, digits: 10 },
  { code: '+33', country: 'France', flag: '🇫🇷', pattern: /^[67]\d{8}$/, digits: 9 },
];

/**
 * Detect country code from phone number
 * @param {string} phoneNumber - The phone number (digits only)
 * @returns {object|null} - Country code info or null
 */
export const detectCountryFromPhone = (phoneNumber) => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (!digits || digits.length < 7) return null;
  
  // Check if number starts with a country code
  if (phoneNumber.startsWith('+')) {
    for (const country of countryCodes) {
      if (phoneNumber.startsWith(country.code)) {
        return country;
      }
    }
  }
  
  // Try to match based on number pattern and length
  for (const country of countryCodes) {
    if (country.pattern.test(digits)) {
      return country;
    }
  }
  
  // Special detection based on first digits and length
  const len = digits.length;
  const firstDigit = digits[0];
  const firstTwo = digits.substring(0, 2);
  
  // Singapore: 8 digits starting with 6, 8, or 9
  if (len === 8 && ['6', '8', '9'].includes(firstDigit)) {
    return countryCodes.find(c => c.code === '+65');
  }
  
  // Malaysia: 9-10 digits
  if ((len === 9 || len === 10) && firstDigit === '1') {
    return countryCodes.find(c => c.code === '+60');
  }
  
  // India: 10 digits starting with 6-9
  if (len === 10 && ['6', '7', '8', '9'].includes(firstDigit)) {
    return countryCodes.find(c => c.code === '+91');
  }
  
  // USA/Canada: 10 digits starting with 2-9
  if (len === 10 && parseInt(firstDigit) >= 2) {
    return countryCodes.find(c => c.code === '+1');
  }
  
  // China: 11 digits starting with 1
  if (len === 11 && firstDigit === '1' && ['3', '4', '5', '6', '7', '8', '9'].includes(digits[1])) {
    return countryCodes.find(c => c.code === '+86');
  }
  
  // Indonesia: 10-12 digits starting with 8
  if ((len >= 10 && len <= 12) && firstDigit === '8') {
    return countryCodes.find(c => c.code === '+62');
  }
  
  // Philippines: 10 digits starting with 9
  if (len === 10 && firstDigit === '9') {
    return countryCodes.find(c => c.code === '+63');
  }
  
  return null;
};

/**
 * Format phone number with country code
 * @param {string} countryCode - The country code (e.g., '+65')
 * @param {string} phoneNumber - The phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (countryCode, phoneNumber) => {
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Format based on country
  switch (countryCode) {
    case '+65': // Singapore: XXXX XXXX
      if (digits.length === 8) {
        return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      }
      break;
    case '+91': // India: XXXXX XXXXX
      if (digits.length === 10) {
        return `${digits.slice(0, 5)} ${digits.slice(5)}`;
      }
      break;
    case '+1': // USA: (XXX) XXX-XXXX
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      break;
    case '+44': // UK: XXXX XXX XXXX
      if (digits.length >= 10) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      }
      break;
    default:
      // Generic format: groups of 4
      return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }
  
  return digits;
};

/**
 * Validate phone number for a country
 * @param {string} countryCode - The country code
 * @param {string} phoneNumber - The phone number
 * @returns {boolean} - Is valid
 */
export const validatePhoneNumber = (countryCode, phoneNumber) => {
  const digits = phoneNumber.replace(/\D/g, '');
  const country = countryCodes.find(c => c.code === countryCode);
  
  if (!country) return digits.length >= 7 && digits.length <= 15;
  
  return country.pattern.test(digits);
};

/**
 * Get placeholder for country
 * @param {string} countryCode - The country code
 * @returns {string} - Placeholder text
 */
export const getPlaceholder = (countryCode) => {
  switch (countryCode) {
    case '+65': return '9123 4567';
    case '+60': return '12 345 6789';
    case '+91': return '98765 43210';
    case '+1': return '(555) 123-4567';
    case '+44': return '7911 123456';
    case '+61': return '412 345 678';
    case '+81': return '90 1234 5678';
    case '+86': return '138 1234 5678';
    case '+971': return '50 123 4567';
    default: return 'Phone number';
  }
};
