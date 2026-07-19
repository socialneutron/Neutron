import type { SerializedRatchetState } from './types';
import { hexToUint8Array, arrayBufferToHex } from './keygen';

async function hmacDerive(
  key: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(signature);
}

export async function chainKeyStep(
  chainKey: Uint8Array
): Promise<{ messageKey: Uint8Array; nextChainKey: Uint8Array }> {
  const messageKey = await hmacDerive(chainKey, new Uint8Array([0x01]));
  const nextChainKey = await hmacDerive(chainKey, new Uint8Array([0x02]));

  return { messageKey, nextChainKey };
}

export async function sendMessageKey(
  state: SerializedRatchetState
): Promise<{ key: Uint8Array; updatedState: SerializedRatchetState }> {
  if (!state.sendChainKey) {
    throw new Error('No send chain key - key exchange needed');
  }

  const chainKey = hexToUint8Array(state.sendChainKey);
  const { messageKey, nextChainKey } = await chainKeyStep(chainKey);

  const updatedState: SerializedRatchetState = {
    ...state,
    sendChainKey: arrayBufferToHex(nextChainKey.buffer),
    sendCount: state.sendCount + 1,
  };

  return { key: messageKey, updatedState };
}

export async function receiveMessageKey(
  state: SerializedRatchetState
): Promise<{ key: Uint8Array; updatedState: SerializedRatchetState }> {
  if (!state.recvChainKey) {
    throw new Error('No receive chain key - need ratchet step first');
  }

  const chainKey = hexToUint8Array(state.recvChainKey);
  const { messageKey, nextChainKey } = await chainKeyStep(chainKey);

  const updatedState: SerializedRatchetState = {
    ...state,
    recvChainKey: arrayBufferToHex(nextChainKey.buffer),
    recvCount: state.recvCount + 1,
  };

  return { key: messageKey, updatedState };
}

export async function skipMessageKeys(
  state: SerializedRatchetState,
  until: number
): Promise<{ key: Uint8Array; updatedState: SerializedRatchetState }> {
  if (!state.recvChainKey) {
    throw new Error('No receive chain key');
  }

  let chainKey = hexToUint8Array(state.recvChainKey);
  let messageKey = new Uint8Array(32);
  let skipCount = 0;

  for (let i = state.recvCount; i < until; i++) {
    const result = await chainKeyStep(chainKey);
    chainKey = result.nextChainKey;
    messageKey = result.messageKey;
    skipCount++;
  }

  const { messageKey: finalKey, nextChainKey } = await chainKeyStep(chainKey);

  const updatedState: SerializedRatchetState = {
    ...state,
    recvChainKey: arrayBufferToHex(nextChainKey.buffer),
    recvCount: until + 1,
    skipCount: state.skipCount + skipCount,
  };

  return { key: finalKey, updatedState };
}

export async function performDhRatchet(
  state: SerializedRatchetState,
  peerPublicKeyHex: string,
  myPrivateKey: CryptoKey
): Promise<SerializedRatchetState> {
  const ECDH_ALG = { name: 'ECDH', namedCurve: 'P-256' };
  const peerKeyBytes = hexToUint8Array(peerPublicKeyHex);
  const peerPublicKey = await crypto.subtle.importKey(
    'raw',
    peerKeyBytes,
    ECDH_ALG,
    false,
    []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    myPrivateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedBits);

  const rootKey = hexToUint8Array(state.rootKey);
  const rootInfo = new TextEncoder().encode('NeutronChat-RatchetRoot');
  const newRootKey = await hkdfSimple(sharedSecret, rootKey, rootInfo);

  const chainInfo = new TextEncoder().encode('NeutronChat-RatchetChain');
  const newSendChainKey = await hkdfSimple(newRootKey, new Uint8Array(0), chainInfo);

  return {
    rootKey: arrayBufferToHex(newRootKey.buffer),
    sendChainKey: arrayBufferToHex(newSendChainKey.buffer),
    recvChainKey: null,
    sendCount: 0,
    recvCount: state.recvCount,
    prevSendCount: state.sendCount,
    lastRatchetPubKey: peerPublicKeyHex,
    skipCount: 0,
  };
}

export async function prepareRatchetForReceive(
  state: SerializedRatchetState,
  senderPubKeyHex: string
): Promise<SerializedRatchetState> {
  if (
    state.lastRatchetPubKey === senderPubKeyHex ||
    (!state.lastRatchetPubKey && !senderPubKeyHex)
  ) {
    return state;
  }

  const rootKey = hexToUint8Array(state.rootKey);
  const sharedBits = await deriveSharedSecretFromPubKey(senderPubKeyHex);
  const rootInfo = new TextEncoder().encode('NeutronChat-RatchetRoot');
  const newRootKey = await hkdfSimple(sharedBits, rootKey, rootInfo);

  const chainInfo = new TextEncoder().encode('NeutronChat-RatchetChain');
  const newRecvChainKey = await hkdfSimple(newRootKey, new Uint8Array(0), chainInfo);

  return {
    rootKey: arrayBufferToHex(newRootKey.buffer),
    sendChainKey: state.sendChainKey,
    recvChainKey: arrayBufferToHex(newRecvChainKey.buffer),
    sendCount: state.sendCount,
    recvCount: 0,
    prevSendCount: state.prevSendCount,
    lastRatchetPubKey: senderPubKeyHex,
    skipCount: 0,
  };
}

async function deriveSharedSecretFromPubKey(pubKeyHex: string): Promise<Uint8Array> {
  const tempKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );

  const peerKeyBytes = hexToUint8Array(pubKeyHex);
  const peerPublicKey = await crypto.subtle.importKey(
    'raw',
    peerKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    tempKeyPair.privateKey,
    256
  );

  return new Uint8Array(sharedBits);
}

async function hkdfSimple(
  inputKeyMaterial: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    inputKeyMaterial.buffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return new Uint8Array(derivedBits);
}
