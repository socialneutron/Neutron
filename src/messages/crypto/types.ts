export interface CryptoKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface SerializedKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  fingerprint: string;
  createdAt: number;
}

export interface RatchetState {
  rootKey: Uint8Array;
  sendChainKey: Uint8Array | null;
  recvChainKey: Uint8Array | null;
  sendCount: number;
  recvCount: number;
  prevSendCount: number;
  lastRatchetPubKey: string | null;
  skipCount: number;
}

export interface SerializedRatchetState {
  rootKey: string;
  sendChainKey: string | null;
  recvChainKey: string | null;
  sendCount: number;
  recvCount: number;
  prevSendCount: number;
  lastRatchetPubKey: string | null;
  skipCount: number;
}

export interface EncryptedEnvelope {
  header: {
    ephemeralPubKey: string;
    prevChainLength: number;
    messageNum: number;
  };
  ciphertext: string;
  nonce: string;
  mac: string;
  isEncrypted: boolean;
}

export interface ConversationCryptoState {
  conversationId: string;
  ratchetState: SerializedRatchetState;
  sharedSecret: string;
  peerPublicKey: string;
  createdAt: number;
  lastMessageAt: number;
}

export interface CryptoLogEntry {
  id: string;
  timestamp: string;
  type: 'keygen' | 'handshake' | 'encrypt' | 'decrypt' | 'ratchet' | 'key_exchange';
  details: string;
  algorithm: string;
  conversationId?: string;
}
