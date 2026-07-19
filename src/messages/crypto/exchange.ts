import type { CryptoKeyPair, RatchetState, SerializedRatchetState } from './types';
import { getPublicKeyHex, hexToUint8Array, arrayBufferToHex } from './keygen';

const ECDH_ALGORITHM = { name: 'ECDH', namedCurve: 'P-256' };

const HKDF_INFO = new TextEncoder().encode('NeutronChat-v1-E2EE');
const HKDF_SALT = new TextEncoder().encode('NeutronChat-Salt-v1');

async function hkdfDerive(
  sharedSecret: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number = 32
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    sharedSecret.buffer,
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
    length * 8
  );

  return new Uint8Array(derivedBits);
}

export async function computeSharedSecret(
  privateKey: CryptoKey,
  peerPublicKeyHex: string
): Promise<Uint8Array> {
  const peerKeyBytes = hexToUint8Array(peerPublicKeyHex);
  const peerPublicKey = await crypto.subtle.importKey(
    'raw',
    peerKeyBytes,
    ECDH_ALGORITHM,
    false,
    []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    256
  );

  return new Uint8Array(sharedBits);
}

export async function deriveConversationKey(
  sharedSecret: Uint8Array,
  conversationId: string
): Promise<Uint8Array> {
  const info = new TextEncoder().encode(`NeutronChat-ConvKey-${conversationId}`);
  return hkdfDerive(sharedSecret, HKDF_SALT, info, 32);
}

export async function deriveRootAndChainKeys(
  sharedSecret: Uint8Array
): Promise<{ rootKey: Uint8Array; chainKey: Uint8Array }> {
  const rootInfo = new TextEncoder().encode('NeutronChat-RootKey');
  const rootKey = await hkdfDerive(sharedSecret, HKDF_SALT, rootInfo, 32);

  const chainInfo = new TextEncoder().encode('NeutronChat-ChainKey');
  const chainKey = await hkdfDerive(sharedSecret, HKDF_SALT, chainInfo, 32);

  return { rootKey, chainKey };
}

export async function performKeyExchange(
  myKeyPair: CryptoKeyPair,
  peerPublicKeyHex: string,
  conversationId: string
): Promise<{
  sharedSecret: Uint8Array;
  conversationKey: Uint8Array;
  ratchetState: SerializedRatchetState;
  myPublicKeyHex: string;
}> {
  const sharedSecret = await computeSharedSecret(myKeyPair.privateKey, peerPublicKeyHex);
  const conversationKey = await deriveConversationKey(sharedSecret, conversationId);
  const { rootKey, chainKey } = await deriveRootAndChainKeys(sharedSecret);
  const myPublicKeyHex = await getPublicKeyHex(myKeyPair.publicKey);

  const ratchetState: SerializedRatchetState = {
    rootKey: arrayBufferToHex(rootKey.buffer),
    sendChainKey: arrayBufferToHex(chainKey.buffer),
    recvChainKey: null,
    sendCount: 0,
    recvCount: 0,
    prevSendCount: 0,
    lastRatchetPubKey: myPublicKeyHex,
    skipCount: 0,
  };

  return {
    sharedSecret,
    conversationKey,
    ratchetState,
    myPublicKeyHex,
  };
}

export async function dhRatchetStep(
  privateKey: CryptoKey,
  peerPublicKeyHex: string,
  currentRootKey: Uint8Array
): Promise<{
  newRootKey: Uint8Array;
  newChainKey: Uint8Array;
  newPublicKeyHex: string;
}> {
  const sharedSecret = await computeSharedSecret(privateKey, peerPublicKeyHex);

  const rootInfo = new TextEncoder().encode('NeutronChat-RatchetRoot');
  const newRootKey = await hkdfDerive(sharedSecret, currentRootKey, rootInfo, 32);

  const chainInfo = new TextEncoder().encode('NeutronChat-RatchetChain');
  const newChainKey = await hkdfDerive(newRootKey, new Uint8Array(0), chainInfo, 32);

  const myPubKeyHex = await getPublicKeyHex(privateKey);

  return {
    newRootKey,
    newChainKey,
    newPublicKeyHex: myPubKeyHex,
  };
}

export function initRatchetState(
  rootKey: Uint8Array,
  chainKey: Uint8Array,
  myPublicKeyHex: string
): SerializedRatchetState {
  return {
    rootKey: arrayBufferToHex(rootKey.buffer),
    sendChainKey: arrayBufferToHex(chainKey.buffer),
    recvChainKey: null,
    sendCount: 0,
    recvCount: 0,
    prevSendCount: 0,
    lastRatchetPubKey: myPublicKeyHex,
    skipCount: 0,
  };
}
