import { describe, it, expect } from 'vitest';
import { generatePassword, calculateStrength } from './password.js';

describe('password handler', () => {
  describe('generatePassword', () => {
    it('should generate password with default length of 16', () => {
      const result = generatePassword();
      expect(result.length).toBe(16);
      expect(result.password).toHaveLength(16);
    });

    it('should generate password with specified length', () => {
      const result = generatePassword(24);
      expect(result.length).toBe(24);
      expect(result.password).toHaveLength(24);
    });

    it('should cap minimum length at 4', () => {
      const result = generatePassword(2);
      expect(result.length).toBe(4);
    });

    it('should cap maximum length at 128', () => {
      const result = generatePassword(200);
      expect(result.length).toBe(128);
    });

    it('should include uppercase by default', () => {
      // Generate multiple to increase chance of having uppercase
      let hasUppercase = false;
      for (let i = 0; i < 10; i++) {
        const result = generatePassword(32);
        if (/[A-Z]/.test(result.password)) {
          hasUppercase = true;
          break;
        }
      }
      expect(hasUppercase).toBe(true);
    });

    it('should include lowercase by default', () => {
      let hasLowercase = false;
      for (let i = 0; i < 10; i++) {
        const result = generatePassword(32);
        if (/[a-z]/.test(result.password)) {
          hasLowercase = true;
          break;
        }
      }
      expect(hasLowercase).toBe(true);
    });

    it('should include numbers by default', () => {
      let hasNumbers = false;
      for (let i = 0; i < 10; i++) {
        const result = generatePassword(32);
        if (/[0-9]/.test(result.password)) {
          hasNumbers = true;
          break;
        }
      }
      expect(hasNumbers).toBe(true);
    });

    it('should respect no uppercase option', () => {
      const result = generatePassword(100, { uppercase: false });
      expect(result.password).not.toMatch(/[A-Z]/);
    });

    it('should respect no lowercase option', () => {
      const result = generatePassword(100, { lowercase: false });
      expect(result.password).not.toMatch(/[a-z]/);
    });

    it('should respect no numbers option', () => {
      const result = generatePassword(100, { numbers: false });
      expect(result.password).not.toMatch(/[0-9]/);
    });

    it('should respect no symbols option', () => {
      const result = generatePassword(100, { symbols: false });
      expect(result.password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    });

    it('should include strength assessment', () => {
      const result = generatePassword(16);
      expect(result.strength).toBeDefined();
      expect(result.strength.score).toBeGreaterThanOrEqual(0);
      expect(result.strength.label).toMatch(/^(Weak|Fair|Good|Strong)$/);
    });
  });

  describe('calculateStrength', () => {
    it('should rate short passwords as weak', () => {
      const strength = calculateStrength('abc');
      expect(strength.label).toBe('Weak');
    });

    it('should rate simple passwords as fair', () => {
      const strength = calculateStrength('password123');
      expect(['Weak', 'Fair']).toContain(strength.label);
    });

    it('should rate complex passwords as strong', () => {
      const strength = calculateStrength('Str0ng!P@ssw0rd#2024');
      expect(strength.label).toBe('Strong');
    });

    it('should increase score for length', () => {
      const short = calculateStrength('aB1!');
      const long = calculateStrength('aB1!aB1!aB1!aB1!aB1!');
      expect(long.score).toBeGreaterThan(short.score);
    });

    it('should increase score for character variety', () => {
      const simple = calculateStrength('aaaaaaaaaaaaaaaa');
      const varied = calculateStrength('aA1!bB2@cC3#dD4$');
      expect(varied.score).toBeGreaterThan(simple.score);
    });
  });
});
