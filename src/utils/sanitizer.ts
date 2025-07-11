import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure DOMPurify
const purifyConfig = {
  ALLOWED_TAGS: [
    // Block elements
    'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code', 'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Inline elements
    'a', 'b', 'strong', 'i', 'em', 'span', 'br',
    'del', 'ins', 'sub', 'sup', 'kbd', 'mark',
    // Custom elements for syntax highlighting
    'syntax-highlight'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class', 'id', 'style',
    'title', 'aria-label', 'data-*'
  ],
  ALLOW_DATA_ATTR: true,
  ADD_ATTR: ['target'], // For links
  ADD_TAGS: ['syntax-highlight'], // For code highlighting
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: true,
  USE_PROFILES: { html: true }
};

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
  smartLists: true,
  smartypants: true,
  headerIds: false,
  mangle: false,
  highlight: function(code, lang) {
    return code;
  }
});

/**
 * Safely converts markdown to sanitized HTML
 */
export function markdownToSafeHTML(markdown: string, options: marked.MarkedOptions = {}): string {
  try {
    if (!markdown) return '';

    // First convert markdown to HTML
    const rawHTML = marked.parse(markdown, {
      gfm: true,
      breaks: true,
      pedantic: false,
      smartLists: true,
      smartypants: true,
      headerIds: false,
      mangle: false,
      ...options
    });

    // Then sanitize the HTML
    return DOMPurify.sanitize(rawHTML, purifyConfig);
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Return sanitized plain text as fallback
    return DOMPurify.sanitize(markdown, {
      ALLOWED_TAGS: ['p'],
      ALLOWED_ATTR: []
    });
  }
}

/**
 * Sanitizes raw HTML content
 */
export function sanitizeHTML(html: string): string {
  try {
    return DOMPurify.sanitize(html, purifyConfig);
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p'],
      ALLOWED_ATTR: []
    });
  }
}

/**
 * Safely renders code blocks with syntax highlighting
 */
export function sanitizeCodeBlock(code: string, language?: string): string {
  try {
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return DOMPurify.sanitize(
      `<pre><code class="language-${language || 'plaintext'}">${escapedCode}</code></pre>`,
      purifyConfig
    );
  } catch (error) {
    console.error('Error sanitizing code block:', error);
    return DOMPurify.sanitize(code, {
      ALLOWED_TAGS: ['pre', 'code'],
      ALLOWED_ATTR: ['class']
    });
  }
}

/**
 * Creates a custom renderer for marked with sanitization
 */
export function createSafeMarkedRenderer(): marked.Renderer {
  const renderer = new marked.Renderer();

  renderer.paragraph = (text) => 
    sanitizeHTML(`<p>${text}</p>`);
  
  renderer.heading = (text, level) => 
    sanitizeHTML(`<h${level}>${text}</h${level}>`);
  
  renderer.link = (href, title, text) => 
    sanitizeHTML(`<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`);
  
  renderer.list = (body, ordered) => 
    sanitizeHTML(`<${ordered ? 'ol' : 'ul'}>${body}</${ordered ? 'ol' : 'ul'}>`);
  
  renderer.listitem = (text) => 
    sanitizeHTML(`<li>${text}</li>`);
  
  renderer.code = (code, language) => 
    sanitizeCodeBlock(code, language);
  
  renderer.blockquote = (quote) => 
    sanitizeHTML(`<blockquote>${quote}</blockquote>`);
  
  renderer.table = (header, body) => 
    sanitizeHTML(`<table><thead>${header}</thead><tbody>${body}</tbody></table>`);
  
  renderer.tablerow = (content) => 
    sanitizeHTML(`<tr>${content}</tr>`);
  
  renderer.tablecell = (content, { header }) => 
    sanitizeHTML(`<${header ? 'th' : 'td'}>${content}</${header ? 'th' : 'td'}>`);

  return renderer;
}