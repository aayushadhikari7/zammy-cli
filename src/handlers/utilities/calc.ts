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
 * Tokenizer for math expressions
 */
type Token = { type: 'number'; value: number } | { type: 'op'; value: string } | { type: 'paren'; value: string };

function tokenize(expression: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers (including decimals)
    if (/\d/.test(char) || (char === '.' && /\d/.test(expression[i + 1]))) {
      let numStr = '';
      while (i < expression.length && (/\d/.test(expression[i]) || expression[i] === '.')) {
        numStr += expression[i];
        i++;
      }
      const value = parseFloat(numStr);
      if (isNaN(value)) return null;
      tokens.push({ type: 'number', value });
      continue;
    }

    // Operators
    if (['+', '-', '*', '/', '%', '^'].includes(char)) {
      tokens.push({ type: 'op', value: char });
      i++;
      continue;
    }

    // Parentheses
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char });
      i++;
      continue;
    }

    // Invalid character
    return null;
  }

  return tokens;
}

/**
 * Recursive descent parser for math expressions
 * Grammar:
 *   expr   = term (('+' | '-') term)*
 *   term   = power (('*' | '/' | '%') power)*
 *   power  = unary ('^' power)?
 *   unary  = '-'? factor
 *   factor = number | '(' expr ')'
 */
class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): number | null {
    const result = this.expr();
    if (this.pos !== this.tokens.length) return null; // Leftover tokens
    return result;
  }

  private current(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token | undefined {
    return this.tokens[this.pos++];
  }

  private expr(): number | null {
    let left = this.term();
    if (left === null) return null;

    while (this.current()?.type === 'op' && ['+', '-'].includes(this.current()!.value)) {
      const op = this.consume()!.value;
      const right = this.term();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }

    return left;
  }

  private term(): number | null {
    let left = this.power();
    if (left === null) return null;

    while (this.current()?.type === 'op' && ['*', '/', '%'].includes(this.current()!.value)) {
      const op = this.consume()!.value;
      const right = this.power();
      if (right === null) return null;
      if ((op === '/' || op === '%') && right === 0) return null; // Division by zero
      left = op === '*' ? left * right : op === '/' ? left / right : left % right;
    }

    return left;
  }

  private power(): number | null {
    const base = this.unary();
    if (base === null) return null;

    if (this.current()?.type === 'op' && this.current()!.value === '^') {
      this.consume();
      const exp = this.power(); // Right associative
      if (exp === null) return null;
      return Math.pow(base, exp);
    }

    return base;
  }

  private unary(): number | null {
    if (this.current()?.type === 'op' && this.current()!.value === '-') {
      this.consume();
      const val = this.factor();
      if (val === null) return null;
      return -val;
    }
    return this.factor();
  }

  private factor(): number | null {
    const token = this.current();

    if (token?.type === 'number') {
      this.consume();
      return token.value;
    }

    if (token?.type === 'paren' && token.value === '(') {
      this.consume();
      const result = this.expr();
      if (result === null) return null;
      if (this.current()?.type !== 'paren' || this.current()!.value !== ')') {
        return null; // Missing closing paren
      }
      this.consume();
      return result;
    }

    return null;
  }
}

/**
 * Safe math expression evaluator (no eval or Function!)
 */
function evaluate(expression: string): number | null {
  const tokens = tokenize(expression);
  if (!tokens || tokens.length === 0) return null;

  const parser = new Parser(tokens);
  const result = parser.parse();

  if (result === null || !isFinite(result)) return null;

  return result;
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
