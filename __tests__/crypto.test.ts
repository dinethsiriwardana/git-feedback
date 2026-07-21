import { describe, it, expect, beforeAll } from 'vitest';
import { encryptText, decryptText, encryptBuffer, decryptBuffer } from '../lib/crypto';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env files (same way Next.js does)
loadEnvConfig(process.cwd());

describe('Crypto Utility Tests', () => {
  beforeAll(() => {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is missing.');
    }
  });

  describe('Text Encryption & Decryption', () => {
    it('should correctly encrypt and decrypt a string', () => {
      const originalText = 'Hello, this is a secret feedback message!';
      const encrypted = encryptText(originalText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalText);
      expect(encrypted.split(':').length).toBe(3); // iv:authTag:encryptedText

      const decrypted = decryptText(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should handle empty strings', () => {
      const originalText = '';
      const encrypted = encryptText(originalText);
      const decrypted = decryptText(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should return original text if format is invalid', () => {
      const invalidEncryptedText = 'some-random-unencrypted-text';
      const decrypted = decryptText(invalidEncryptedText);
      expect(decrypted).toBe(invalidEncryptedText);
    });
  });

  describe('Buffer Encryption & Decryption', () => {
    it('should correctly encrypt and decrypt a binary buffer', () => {
      const originalBuffer = Buffer.from('Binary data content here 12345');
      const encrypted = encryptBuffer(originalBuffer);

      expect(encrypted).toBeDefined();
      expect(Buffer.isBuffer(encrypted)).toBe(true);
      expect(encrypted.length).toBeGreaterThan(originalBuffer.length);

      const decrypted = decryptBuffer(encrypted);
      expect(decrypted.toString()).toBe(originalBuffer.toString());
    });

    it('should throw error when decrypting an invalid/short buffer', () => {
      const invalidBuffer = Buffer.from('short');
      expect(() => decryptBuffer(invalidBuffer)).toThrow('Invalid encrypted buffer format');
    });
  });
});
