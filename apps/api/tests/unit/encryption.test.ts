jest.mock('../../src/config/env', () => ({
  env: {
    ENCRYPTION_KEY: 'a'.repeat(32),
  },
}));

import { encrypt, decrypt } from '../../src/utils/encryption';

describe('Encryption Utils', () => {
  it('should encrypt and decrypt a string', () => {
    const original = 'my-secret-password';
    const encrypted = encrypt(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':'); // format: iv:tag:encrypted

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertexts for the same input', () => {
    const text = 'same-text';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);

    // Different IVs produce different ciphertexts
    expect(enc1).not.toBe(enc2);

    // But both decrypt to the same value
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  it('should handle special characters', () => {
    const original = 'pässwörd!@#$%^&*() éàü';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it('should handle empty string', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });
});
