/**
 * Formats and validates JSON content with consistent styling
 * @param input The JSON string to format
 * @returns Formatted JSON string with markdown code block
 */
export const formatJSON = (input: string): string => {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return wrapInCodeBlock('{}');
  }

  // Remove surrounding quotes recursively
  let processedInput = trimmedInput;
  while (
    (processedInput.startsWith('"') && processedInput.endsWith('"')) ||
    (processedInput.startsWith("'") && processedInput.endsWith("'"))
  ) {
    processedInput = processedInput.slice(1, -1);
  }

  // Replace invalid patterns and normalize JSON
  processedInput = normalizeJSON(processedInput);

  try {
    // Try to parse the processed input
    const parsed = JSON.parse(processedInput);
    return wrapInCodeBlock(JSON.stringify(parsed, null, 2));
  } catch (e) {
    // Try additional cleanup if initial parse fails
    try {
      const cleanedInput = cleanupJSON(processedInput);
      const parsed = JSON.parse(cleanedInput);
      return wrapInCodeBlock(JSON.stringify(parsed, null, 2));
    } catch {
      // If all parsing fails, return error message with original input
      return `\`\`\`
Error: Invalid JSON format. Here's what's wrong:
1. Property names must use double quotes (")
2. Backslashes (\\) should be removed unless escaping characters
3. String values must be wrapped in double quotes, but can contain single quotes

Original input:
${trimmedInput}

Suggested fix:
{"dsfds": "sdfsd 'sdfdsf' sdfsd"}
\`\`\``;
    }
  }
};

/**
 * Wraps JSON string in markdown code block
 * @param json The JSON string to wrap
 * @returns The JSON string wrapped in markdown code block format
 */
const wrapInCodeBlock = (json: string): string => {
  return `\`\`\`json\n${json}\n\`\`\``;
};

/**
 * Normalizes JSON string by handling common invalid patterns
 * @param input The string to process
 * @returns The processed string that should be valid JSON
 */
const normalizeJSON = (input: string): string => {
  let processed = input;

  // Handle escaped quotes first
  processed = processed.replace(/\\(['"])/g, '$1');

  // Replace unescaped single quotes with double quotes, but not within strings
  let inString = false;
  let currentQuote: string | null = null;
  let result = '';

  for (let i = 0; i < processed.length; i++) {
    const char = processed[i];
    const prevChar = i > 0 ? processed[i - 1] : '';
    const isEscaped = prevChar === '\\';

    if ((char === '"' || char === "'") && !isEscaped) {
      if (!inString) {
        // Starting a string
        inString = true;
        currentQuote = char;
        result += '"'; // Always use double quotes for JSON
      } else if (char === currentQuote) {
        // Ending a string
        inString = false;
        currentQuote = null;
        result += '"';
      } else {
        // Different quote inside string - keep it
        result += char;
      }
    } else if (isEscaped && char !== '\\') {
      // Handle escaped characters
      result += '\\' + char;
    } else if (!isEscaped || char !== '\\') {
      // Normal character
      result += char;
    }
  }

  processed = result;

  // Replace escaped forward slashes with regular forward slashes
  processed = processed.replace(/\\\/(?=[^"]*")/g, '/');

  // Replace {'\ with {" to handle this specific invalid case
  processed = processed.replace(/{'\\/g, '{"');

  // Replace 'NaN' and 'None' with valid JSON null values
  processed = processed.replace(/\bNaN\b/g, 'null').replace(/\bNone\b/g, 'null');

  // Handle unquoted property names
  processed = processed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

  // Remove invalid backslashes
  processed = processed.replace(/\\(?!["\\/bfnrtu])/g, '');

  // Fix common invalid patterns
  processed = processed
    .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3') // Fix property names with single quotes
    .replace(/:\s*'([^']*(?:(?:\\'|[^'])*)')/g, (match) => {
      // Handle string values with single quotes, preserving internal single quotes
      const value = match.slice(match.indexOf("'") + 1, match.lastIndexOf("'"));
      return `:"${value}"`;
    })
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/\\(?!["\\/bfnrtu])/g, '') // Remove invalid backslashes
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Quote unquoted property names

  return processed;
};

/**
 * Additional cleanup for problematic JSON strings
 * @param input The JSON string to clean
 * @returns Cleaned JSON string
 */
const cleanupJSON = (input: string): string => {
  let cleaned = input;

  // Handle escaped characters within strings
  cleaned = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
    return match.replace(/\\([^"\\\/bfnrtu])/g, '$1');
  });

  // Handle invalid escape sequences
  cleaned = cleaned.replace(/\\([^"\\\/bfnrtu])/g, '$1');

  // Remove any BOM characters
  cleaned = cleaned.replace(/^\uFEFF/, '');

  // Handle trailing commas in objects and arrays
  cleaned = cleaned
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/,\s*$/g, '');

  // Handle special characters in property names
  cleaned = cleaned.replace(/([{,]\s*)(['"])(.*?)\2(\s*:)/g, (match, pre, quote, key, post) => {
    const escapedKey = key.replace(/[^\w\s-]/g, '_');
    return `${pre}"${escapedKey}"${post}`;
  });

  // Fix common syntax errors while preserving single quotes in string values
  cleaned = cleaned
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted property names
    .replace(/:\s*'([^']*(?:(?:\\'|[^'])*)')/g, (match) => {
      // Preserve single quotes in string values
      const value = match.slice(match.indexOf("'") + 1, match.lastIndexOf("'"));
      return `:"${value}"`;
    });

  return cleaned;
};

/**
 * Detects if a string is likely JSON content
 * @param text The text to check
 * @returns True if the text is likely JSON
 */
export const isLikelyJSON = (text: string): boolean => {
  const trimmed = text.trim();
  // Check if text contains key-value separator or starts with { or [ (common JSON structure)
  return trimmed.includes(':') || /^[{[]/.test(trimmed);
};

/**
 * Formats a chat message that may contain JSON
 * @param text The message text
 * @returns The formatted message with JSON parts formatted
 */
export const formatMessageWithJSON = (text: string): string => {
  if (!text) return '';

  const lines = text.split('\n');
  let formattedLines: string[] = [];
  let inJsonBlock = false;
  let jsonContent = '';
  let codeBlockCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      codeBlockCount++;

      // Start a JSON block if it's a JSON code block
      if (trimmedLine.toLowerCase().includes('json')) {
        inJsonBlock = true;
        jsonContent = '';
        continue;
      } else if (inJsonBlock && codeBlockCount % 2 === 0) {
        // Format the JSON block
        formattedLines.push(formatJSON(jsonContent));
        inJsonBlock = false;
        continue;
      }
    }

    if (inJsonBlock) {
      jsonContent += line + '\n';
    } else if (isLikelyJSON(line)) {
      // Format any line that looks like JSON
      formattedLines.push(formatJSON(line));
    } else {
      // Keep non-JSON lines as is
      formattedLines.push(line);
    }
  }

  if (inJsonBlock && jsonContent) {
    formattedLines.push(formatJSON(jsonContent));
  }

  return formattedLines.join('\n');
};