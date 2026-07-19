export type {
  CryptoKeyPair,
  SerializedKeyPair,
  RatchetState,
  SerializedRatchetState,
  EncryptedEnvelope,
  ConversationCryptoState,
  CryptoLogEntry,
} from './types';

export {
  generateKeyPair,
  serializeKeyPair,
  deserializeKeyPair,
  getPublicKeyBytes,
  getPublicKeyHex,
  importPublicKeyFromHex,
  computeFingerprint,
  arrayBufferToHex,
  hexToUint8Array,
  bufferToBase64,
  base64ToBuffer,
} from './keygen';

export {
  computeSharedSecret,
  deriveConversationKey,
  deriveRootAndChainKeys,
  performKeyExchange,
  dhRatchetStep,
  initRatchetState,
} from './exchange';

export {
  chainKeyStep,
  sendMessageKey,
  receiveMessageKey,
  skipMessageKeys,
  performDhRatchet,
  prepareRatchetForReceive,
} from './ratchet';

export { encryptMessage, encryptForOffline } from './encrypt';
export { decryptMessage, decryptWithKey } from './decrypt';

export {
  saveKeyPair,
  loadKeyPair,
  deleteKeyPair,
  saveConversationState,
  loadConversationState,
  loadConversationStateByPeer,
  loadAllConversationStates,
  deleteConversationState,
  addCryptoLog,
  getCryptoLogs,
  clearCryptoLogs,
} from './storage';
