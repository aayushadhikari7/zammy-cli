export type EncodeMethod = 'base64' | 'url' | 'hex';
export type EncodeDirection = 'encode' | 'decode';

export interface EncodeResult {
  method: string;
  direction: EncodeDirection;
  input: string;
  output: string;
}

export const SUPPORTED_METHODS = ['base64', 'url', 'hex'] as const;

export function isValidMethod(method: string): method is EncodeMethod {
  return SUPPORTED_METHODS.includes(method.toLowerCase() as EncodeMethod);
}

export function encodeText(
  text: string,
  method: EncodeMethod,
  direction: EncodeDirection
): EncodeResult {
  let output: string;

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
    switch (method) {
      case 'base64':
        output = Buffer.from(text, 'base64').toString('utf-8');
        break;
      case 'url':
        output = decodeURIComponent(text);
        break;
      case 'hex':
        output = Buffer.from(text, 'hex').toString('utf-8');
        break;
    }
  }

  return {
    method: method.toUpperCase(),
    direction,
    input: text,
    output,
  };
}
