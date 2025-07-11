// Regular expressions for detecting PII
const PII_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone numbers (various formats)
  phone: /(?:\+\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
  
  // Social Security Numbers (sensitive - full mask)
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  
  // Credit card numbers (sensitive - full mask)
  creditCard: /\b\d{4}[-. ]?\d{4}[-. ]?\d{4}[-. ]?\d{4}\b/g,
  
  // Driver's license numbers (sensitive - full mask)
  driverLicense: /\b[A-Z]\d{7}\b/g,
  
  // Passport numbers (sensitive - full mask)
  passport: /\b[A-Z]\d{8}\b/g,
  
  // Bank account numbers (sensitive - full mask)
  bankAccount: /\b\d{8,17}\b/g,
  
  // Names (with titles)
  name: /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
  
  // URLs (keep domain)
  url: /(https?:\/\/[^\s]+)/g,
  
  // Physical addresses (mask only number)
  address: /\b\d+\s+[A-Za-z\s,]+(?:street|st|avenue|ave|road|rd|highway|hwy|square|sq|trail|trl|drive|dr|court|ct|parkway|pkwy|circle|cir|boulevard|blvd)\b/gi,
};

// Sensitive PII types that need full masking
const SENSITIVE_PII = ['ssn', 'creditCard', 'driverLicense', 'passport', 'bankAccount'];

// Function to mask PII data
export const maskPII = (text: string): string => {
  let maskedText = text;
  
  // Apply each PII pattern
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    maskedText = maskedText.replace(pattern, (match) => {
      // Full masking for sensitive data
      if (SENSITIVE_PII.includes(type)) {
        return '*'.repeat(match.length);
      }
      
      // Partial masking for email and phone
      if (type === 'email') {
        const [username, domain] = match.split('@');
        const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
        return `${maskedUsername}@${domain}`;
      }
      
      if (type === 'phone') {
        return match.replace(/\d(?=\d{4})/g, '*');
      }
      
      // Special handling for URLs - keep domain
      if (type === 'url') {
        try {
          const url = new URL(match);
          return `${url.protocol}//${url.hostname}/***`;
        } catch {
          return '***[REDACTED_URL]***';
        }
      }
      
      // Special handling for addresses - mask only the number
      if (type === 'address') {
        return match.replace(/\b\d+\b/, '***');
      }
      
      // Default masking with type indicator for other types
      return `***[REDACTED_${type.toUpperCase()}]***`;
    });
  }
  
  return maskedText;
};

// Function to check if text contains PII
export const containsPII = (text: string): boolean => {
  return Object.values(PII_PATTERNS).some(pattern => pattern.test(text));
};

// Function to get PII summary
export const getPIISummary = (text: string): { hasPII: boolean; types: string[] } => {
  const types = Object.entries(PII_PATTERNS)
    .filter(([_, pattern]) => pattern.test(text))
    .map(([type]) => type);
  
  return {
    hasPII: types.length > 0,
    types
  };
};