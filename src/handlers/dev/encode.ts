export type EncodeMethod = 'base64' | 'url' | 'hex';
export type EncodeDirection = 'encode' | 'decode';

export interface EncodeResult {
  method: string;
  direction: EncodeDirection;
  input: string;
  output: string;
  error?: string;
}

export const SUPPORTED_METHODS = ['base64', 'url', 'hex'] as const;

export function isValidMethod(method: string): method is EncodeMethod {
  return SUPPORTED_METHODS.includes(method.toLowerCase() as EncodeMethod);
}

/**
 * Validate base64 string
 */
function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  // Base64 regex: only valid base64 characters and proper padding
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str) && str.length % 4 === 0;
}

/**
 * Validate hex string
 */
function isValidHex(str: string): boolean {
  if (!str || str.length === 0) return false;
  // Hex must have even length and only hex characters
  return str.length % 2 === 0 && /^[0-9A-Fa-f]+$/.test(str);
}

export function encodeText(
  text: string,
  method: EncodeMethod,
  direction: EncodeDirection
): EncodeResult {
  let output: string;
  let error: string | undefined;

  if (direction === 'encode') {
    switch (method) {
      case 'base64':
        output = Buffer.from(text).toString('base64');
        break;
      case 'url':
        output = encodeURIComponent(text);
        break;
      case 'hex':
        output = Buffer.from(text).toString('hex');
        break;
    }
  } else {
    // Decode operations need error handling
    switch (method) {
      case 'base64':
        try {
          if (!isValidBase64(text)) {
            output = '';
            error = 'Invalid base64 input';
          } else {
            output = Buffer.from(text, 'base64').toString('utf-8');
          }
        } catch (e) {
          output = '';
          error = 'Failed to decode base64: invalid input';
        }
        break;
      case 'url':
        try {
          output = decodeURIComponent(text);
        } catch (e) {
          output = '';
          error = 'Failed to decode URL: malformed URI sequence';
        }
        break;
      case 'hex':
        try {
          if (!isValidHex(text)) {
            output = '';
            error = 'Invalid hex input: must be even length and contain only 0-9, A-F';
          } else {
            output = Buffer.from(text, 'hex').toString('utf-8');
          }
        } catch (e) {
          output = '';
          error = 'Failed to decode hex: invalid input';
        }
        break;
    }
  }

  return {
    method: method.toUpperCase(),
    direction,
    input: text,
    output,
    ...(error && { error }),
  };
}
