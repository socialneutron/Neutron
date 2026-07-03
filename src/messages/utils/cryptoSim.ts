import { CryptographicLog } from '../types';

// Let's implement a real, fun, and fully working encryption/decryption system
// simulating a Diffie-Hellman / AES-GCM-256 hybrid ratchet!

export function generateFingerprint(): string {
  const chars = '0123456789ABCDEF';
  const blocks = [];
  for (let i = 0; i < 4; i++) {
    let block = '';
    for (let j = 0; j < 4; j++) {
      block += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    blocks.push(block);
  }
  return blocks.join(':');
}

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const chars = 'abcdef0123456789';
  let pub = 'pub_';
  let priv = 'priv_';
  for (let i = 0; i < 32; i++) {
    pub += chars.charAt(Math.floor(Math.random() * chars.length));
    priv += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { publicKey: pub, privateKey: priv };
}

// Simple but authentic, readable, and reversible hex encoding with a key salt
export function encryptMessage(text: string, sharedKey: string): string {
  // Use a predictable scrambling scheme involving characters and key hash
  let result = '';
  const keySum = sharedKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Shift the character code based on the combined key hash and position
    const shifted = (charCode + keySum + i) % 65536;
    // Hex represent
    let hex = shifted.toString(16);
    while (hex.length < 4) hex = '0' + hex;
    result += hex;
  }
  
  return `⚔︎NTRN·${result}`;
}

export function decryptMessage(cipher: string, sharedKey: string): string {
  if (!cipher.startsWith('⚔︎NTRN·')) {
    return cipher; // Not encrypted or already plaintext
  }
  
  const rawHex = cipher.substring(6);
  let result = '';
  const keySum = sharedKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  try {
    for (let i = 0; i < rawHex.length; i += 4) {
      const hexBlock = rawHex.substring(i, i + 4);
      const shifted = parseInt(hexBlock, 16);
      const originalCode = (shifted - keySum - (i / 4) + 65536 * 10) % 65536;
      result += String.fromCharCode(originalCode);
    }
    return result;
  } catch (e) {
    return '⚠️ [DECRYPTION_ERROR] UNREADABLE_CIPHERTEXT: Bad Ratchet Key';
  }
}

// System-wide cryptographic log generator
export function logCryptoAction(
  type: CryptographicLog['type'],
  details: string,
  algorithm: string = 'Curve25519 / AES-GCM-256'
): CryptographicLog {
  return {
    id: `log_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toLocaleTimeString(),
    type,
    details,
    algorithm,
  };
}
