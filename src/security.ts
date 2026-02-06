// Security utilities for input sanitization

/**
 * Sanitize Excel cell value to prevent formula injection
 * Prepends single quote if value starts with dangerous characters
 */
export function sanitizeExcelValue(value: any): string | number {
  if (value === null || value === undefined) return '';
  
  const strValue = String(value);
  
  // Check if starts with formula characters
  if (strValue.match(/^[=+\-@]/)) {
    return "'" + strValue; // Prepend single quote to make it literal
  }
  
  return strValue;
}

/**
 * Sanitize filename for Content-Disposition header
 * Removes dangerous characters and limits to safe ASCII
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'download.xlsx';
  
  // Remove path separators and control characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')  // Remove dangerous chars
    .replace(/\r?\n/g, '_')                   // Remove newlines (CRLF injection)
    .replace(/[^\x20-\x7E]/g, '_')            // Keep only printable ASCII
    .trim();
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  // Ensure it has .xlsx extension
  if (!sanitized.toLowerCase().endsWith('.xlsx')) {
    sanitized += '.xlsx';
  }
  
  return sanitized;
}

/**
 * Validate and sanitize user inputs
 */
export function validateInput(input: string, maxLength: number = 500): string {
  if (!input) return '';
  
  const sanitized = String(input)
    .trim()
    .substring(0, maxLength);
  
  return sanitized;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 10) {
    return {
      valid: false,
      error: 'Password must be at least 10 characters long'
    };
  }
  
  // Optional: Add more complexity requirements
  // if (!/[A-Z]/.test(password)) {
  //   return { valid: false, error: 'Password must contain at least one uppercase letter' };
  // }
  
  return { valid: true };
}
