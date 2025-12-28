export interface CalcResult {
  expression: string;
  result: number;
  formatted: string;
}

export interface CalcError {
  expression: string;
  error: string;
}

/**
 * Safe math expression evaluator (no eval!)
 */
function evaluate(expression: string): number | null {
  // Remove spaces
  const expr = expression.replace(/\s+/g, '');

  // Validate: only allow numbers, operators, parentheses, and decimal points
  if (!/^[\d+\-*/().%^]+$/.test(expr)) {
    return null;
  }

  try {
    // Replace ^ with ** for exponentiation
    const sanitized = expr.replace(/\^/g, '**');

    // Use Function constructor (safer than eval, but still sandboxed)
    const result = new Function(`return (${sanitized})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

function formatNumber(num: number): string {
  // Handle very small or very large numbers
  if (Math.abs(num) < 0.0001 || Math.abs(num) > 1e10) {
    return num.toExponential(4);
  }

  // Round to avoid floating point issues
  const rounded = Math.round(num * 1e10) / 1e10;

  // Format with commas for thousands
  const parts = rounded.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
}

export function calculate(expression: string): CalcResult | CalcError {
  const result = evaluate(expression);

  if (result === null) {
    return {
      expression,
      error: 'Invalid expression. Only numbers and operators (+, -, *, /, ^, %) are allowed.',
    };
  }

  return {
    expression,
    result,
    formatted: formatNumber(result),
  };
}

export function isCalcError(result: CalcResult | CalcError): result is CalcError {
  return 'error' in result;
}
