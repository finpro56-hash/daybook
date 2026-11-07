/**
 * Encryption utilities using Web Crypto API (AES-256-GCM, PBKDF2-SHA256 600,000 iterations)
 */

const ITERATIONS = 600000;
const KEY_LENGTH = 256;

export function validatePassphrase(passphrase: string): { valid: boolean; error?: string } {
  if (!passphrase || passphrase.length < 12) {
    return { valid: false, error: 'Passphrase must be at least 12 characters long.' };
  }
  return { valid: true };
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: object, passphrase: string): Promise<string> {
  const validation = validatePassphrase(passphrase);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  // Package salt, iv, and ciphertext into a base64 string or json object
  const bundle = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  };

  return btoa(JSON.stringify(bundle));
}

export async function decryptData(encryptedBase64: string, passphrase: string): Promise<object> {
  const validation = validatePassphrase(passphrase);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let bundle: { salt: number[]; iv: number[]; ciphertext: number[] };
  try {
    bundle = JSON.parse(atob(encryptedBase64));
  } catch {
    throw new Error('Invalid encrypted backup format.');
  }

  const salt = new Uint8Array(bundle.salt);
  const iv = new Uint8Array(bundle.iv);
  const ciphertext = new Uint8Array(bundle.ciphertext);

  const key = await deriveKey(passphrase, salt);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  } catch {
    throw new Error('Incorrect passphrase or corrupted backup data.');
  }
}
