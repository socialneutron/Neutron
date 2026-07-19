import type { CryptoKeyPair, SerializedKeyPair } from './types';

const ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
};

const SIGN_ALGORITHM = {
  name: 'ECDSA',
  namedCurve: 'P-256',
};

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(ALGORITHM, true, ['deriveKey', 'deriveBits']);

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const fingerprintHash = await crypto.subtle.digest('SHA-256', publicKeyRaw);
  const fingerprint = formatFingerprint(arrayBufferToHex(fingerprintHash));

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

export async function serializeKeyPair(keyPair: CryptoKeyPair): Promise<SerializedKeyPair> {
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const fingerprintHash = await crypto.subtle.digest('SHA-256', publicKeyRaw);
  const fingerprint = formatFingerprint(arrayBufferToHex(fingerprintHash));

  return {
    publicKeyJwk,
    privateKeyJwk,
    fingerprint,
    createdAt: Date.now(),
  };
}

export async function deserializeKeyPair(serialized: SerializedKeyPair): Promise<CryptoKeyPair> {
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    serialized.publicKeyJwk,
    ALGORITHM,
    true,
    []
  );

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    serialized.privateKeyJwk,
    ALGORITHM,
    false,
    ['deriveKey', 'deriveBits']
  );

  return { publicKey, privateKey };
}

export async function getPublicKeyBytes(publicKey: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', publicKey);
  return new Uint8Array(raw);
}

export async function getPublicKeyHex(publicKey: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', publicKey);
  return arrayBufferToHex(raw);
}

export async function importPublicKeyFromHex(hex: string): Promise<CryptoKey> {
  const bytes = hexToUint8Array(hex);
  return crypto.subtle.importKey('raw', bytes, ALGORITHM, true, []);
}

function formatFingerprint(hex: string): string {
  const groups = hex.match(/.{1,4}/g) || [];
  return groups.slice(0, 4).join(':').toUpperCase();
}

export async function computeFingerprint(publicKeyHex: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    hexToUint8Array(publicKeyHex).buffer
  );
  return formatFingerprint(arrayBufferToHex(hash));
}

export { arrayBufferToHex, hexToUint8Array, bufferToBase64, base64ToBuffer };
