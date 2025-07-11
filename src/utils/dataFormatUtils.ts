// Utility to format JSON data
export const formatData = (text: string): string => {
  // Remove any leading/trailing whitespace
  const trimmed = text.trim();
  
  try {
    // Parse and stringify to ensure valid JSON
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If not valid JSON, return the original text
    return trimmed;
  }
};