import type {
  SerializedKeyPair,
  SerializedRatchetState,
  EncryptedEnvelope,
  ConversationCryptoState,
  CryptoLogEntry,
} from './types';
import {
  generateKeyPair,
  serializeKeyPair,
  deserializeKeyPair,
  getPublicKeyHex,
  computeFingerprint,
} from './keygen';
import { performKeyExchange, deriveConversationKey } from './exchange';
import { sendMessageKey, receiveMessageKey, prepareRatchetForReceive } from './ratchet';
import { encryptMessage, encryptForOffline } from './encrypt';
import { decryptMessage, decryptWithKey } from './decrypt';
import {
  saveKeyPair,
  loadKeyPair,
  saveConversationState,
  loadConversationState,
  loadAllConversationStates,
  deleteConversationState,
  addCryptoLog,
  getCryptoLogs,
  deleteKeyPair as deleteKeyPairStorage,
} from './storage';
import { hexToUint8Array, arrayBufferToHex } from './keygen';

export class E2ECryptoManager {
  private keyPair: SerializedKeyPair | null = null;
  private conversationStates: Map<string, ConversationCryptoState> = new Map();
  private conversationKeys: Map<string, Uint8Array> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const existing = await loadKeyPair();
    if (existing) {
      this.keyPair = existing;
    } else {
      this.keyPair = await this.generateAndStoreKeyPair();
    }

    const states = await loadAllConversationStates();
    for (const state of states) {
      this.conversationStates.set(state.conversationId, state);
      this.conversationKeys.set(
        state.conversationId,
        hexToUint8Array(state.sharedSecret)
      );
    }

    this.initialized = true;

    await this.log('keygen', `Identity key pair loaded/created. Fingerprint: ${this.keyPair.fingerprint}`, 'ECDSA-P256+AES-256-GCM');
  }

  private async generateAndStoreKeyPair(): Promise<SerializedKeyPair> {
    const kp = await generateKeyPair();
    const serialized = await serializeKeyPair(kp);
    await saveKeyPair(serialized);
    return serialized;
  }

  getPublicKeyHex(): string | null {
    if (!this.keyPair) return null;
    return this.keyPair.publicKeyJwk.x && this.keyPair.publicKeyJwk.y
      ? (this.keyPair.publicKeyJwk.x as string) + (this.keyPair.publicKeyJwk.y as string)
      : null;
  }

  getFingerprint(): string {
    return this.keyPair?.fingerprint || 'UNKNOWN';
  }

  async getKeyPair(): Promise<CryptoKeyPair | null> {
    if (!this.keyPair) return null;
    return deserializeKeyPair(this.keyPair);
  }

  async initiateConversation(
    conversationId: string,
    peerPublicKeyHex: string
  ): Promise<{ envelope?: EncryptedEnvelope; state: ConversationCryptoState }> {
    const existing = this.conversationStates.get(conversationId);
    if (existing) {
      return { state: existing };
    }

    const kp = await deserializeKeyPair(this.keyPair!);
    const { sharedSecret, conversationKey, ratchetState, myPublicKeyHex } =
      await performKeyExchange(kp, peerPublicKeyHex, conversationId);

    const state: ConversationCryptoState = {
      conversationId,
      ratchetState,
      sharedSecret: arrayBufferToHex(sharedSecret.buffer),
      peerPublicKey: peerPublicKeyHex,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    };

    this.conversationStates.set(conversationId, state);
    this.conversationKeys.set(conversationId, conversationKey);
    await saveConversationState(state);

    await this.log(
      'key_exchange',
      `Key exchange completed with peer. Conversation: ${conversationId}`,
      'ECDH-P256 + HKDF',
      conversationId
    );

    return { state };
  }

  async encryptForConversation(
    conversationId: string,
    plaintext: string
  ): Promise<EncryptedEnvelope> {
    const state = this.conversationStates.get(conversationId);

    if (state && state.ratchetState.sendChainKey) {
      const { envelope, updatedState } = await encryptMessage(
        plaintext,
        state.ratchetState,
        this.keyPair!.fingerprint
      );

      state.ratchetState = updatedState;
      state.lastMessageAt = Date.now();
      this.conversationStates.set(conversationId, state);
      await saveConversationState(state);

      await this.log(
        'encrypt',
        `Message encrypted for conversation ${conversationId}. MsgNum: ${updatedState.sendCount}`,
        'AES-256-GCM',
        conversationId
      );

      return envelope;
    }

    const key = this.conversationKeys.get(conversationId);
    if (key) {
      const envelope = await encryptForOffline(plaintext, key);

      await this.log(
        'encrypt',
        `Message encrypted (offline mode) for ${conversationId}`,
        'AES-256-GCM',
        conversationId
      );

      return envelope;
    }

    return {
      header: { ephemeralPubKey: '', prevChainLength: 0, messageNum: 0 },
      ciphertext: plaintext,
      nonce: '',
      mac: '',
      isEncrypted: false,
    };
  }

  async decryptFromConversation(
    conversationId: string,
    envelope: EncryptedEnvelope
  ): Promise<string> {
    if (!envelope.isEncrypted) {
      return envelope.ciphertext;
    }

    const state = this.conversationStates.get(conversationId);

    if (state && state.ratchetState.recvChainKey) {
      const { plaintext, updatedState } = await decryptMessage(envelope, state.ratchetState);

      state.ratchetState = updatedState;
      state.lastMessageAt = Date.now();
      this.conversationStates.set(conversationId, state);
      await saveConversationState(state);

      await this.log(
        'decrypt',
        `Message decrypted from conversation ${conversationId}. MsgNum: ${envelope.header.messageNum}`,
        'AES-256-GCM',
        conversationId
      );

      return plaintext;
    }

    const key = this.conversationKeys.get(conversationId);
    if (key) {
      return decryptWithKey(envelope, key);
    }

    return '[No encryption key for this conversation]';
  }

  async receiveRatchetStep(
    conversationId: string,
    senderPubKeyHex: string
  ): Promise<void> {
    const state = this.conversationStates.get(conversationId);
    if (!state) return;

    const updatedState = await prepareRatchetForReceive(
      state.ratchetState,
      senderPubKeyHex
    );

    state.ratchetState = updatedState;
    this.conversationStates.set(conversationId, state);
    await saveConversationState(state);

    await this.log(
      'ratchet',
      `Receive ratchet step for ${conversationId}. New sender: ${senderPubKeyHex.substring(0, 8)}...`,
      'Double Ratchet',
      conversationId
    );
  }

  async rotateKeys(): Promise<string> {
    const newKeyPair = await this.generateAndStoreKeyPair();
    this.keyPair = newKeyPair;

    await this.log(
      'keygen',
      `Key rotation completed. New fingerprint: ${newKeyPair.fingerprint}`,
      'ECDSA-P256'
    );

    return newKeyPair.fingerprint;
  }

  getConversationFingerprint(conversationId: string): string | null {
    const state = this.conversationStates.get(conversationId);
    return state?.peerPublicKey || null;
  }

  isConversationEncrypted(conversationId: string): boolean {
    return this.conversationStates.has(conversationId);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    this.conversationStates.delete(conversationId);
    this.conversationKeys.delete(conversationId);
    await deleteConversationState(conversationId);
  }

  private async log(
    type: CryptoLogEntry['type'],
    details: string,
    algorithm: string,
    conversationId?: string
  ): Promise<void> {
    const entry: CryptoLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      details,
      algorithm,
      conversationId,
    };
    await addCryptoLog(entry);
  }

  async getCryptoLogs(limit?: number): Promise<CryptoLogEntry[]> {
    return getCryptoLogs(limit);
  }
}

let _instance: E2ECryptoManager | null = null;

export async function getE2ECryptoManager(): Promise<E2ECryptoManager> {
  if (!_instance) {
    _instance = new E2ECryptoManager();
    await _instance.initialize();
  }
  return _instance;
}

export async function resetE2ECryptoManager(): Promise<void> {
  if (_instance) {
    await deleteKeyPairStorage();
    _instance = null;
  }
}
