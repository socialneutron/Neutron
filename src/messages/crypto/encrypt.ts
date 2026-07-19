import type { EncryptedEnvelope, SerializedRatchetState } from './types';
import { sendMessageKey } from './ratchet';
import { arrayBufferToHex, bufferToBase64 } from './keygen';

export async function encryptMessage(
  plaintext: string,
  ratchetState: SerializedRatchetState,
  senderId: string
): Promise<{ envelope: EncryptedEnvelope; updatedState: SerializedRatchetState }> {
  const { key: messageKey, updatedState } = await sendMessageKey(ratchetState);

  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await crypto.subtle.importKey(
    'raw',
    messageKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const additionalData = encoder.encode(
    JSON.stringify({
      sender: senderId,
      msgNum: updatedState.sendCount - 1,
    })
  );

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      additionalData,
      tagLength: 128,
    },
    aesKey,
    plaintextBytes
  );

  const macKey = await crypto.subtle.importKey(
    'raw',
    messageKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const macData = new Uint8Array([
    ...additionalData,
    ...new Uint8Array(ciphertextBuffer),
    ...nonce,
  ]);

  const macBuffer = await crypto.subtle.sign('HMAC', macKey, macData);

  const envelope: EncryptedEnvelope = {
    header: {
      ephemeralPubKey: updatedState.lastRatchetPubKey || '',
      prevChainLength: updatedState.prevSendCount,
      messageNum: updatedState.sendCount - 1,
    },
    ciphertext: arrayBufferToHex(ciphertextBuffer),
    nonce: arrayBufferToHex(nonce.buffer),
    mac: arrayBufferToHex(macBuffer),
    isEncrypted: true,
  };

  return { envelope, updatedState };
}

export async function encryptForOffline(
  plaintext: string,
  conversationKey: Uint8Array
): Promise<EncryptedEnvelope> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await crypto.subtle.importKey(
    'raw',
    conversationKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128,
    },
    aesKey,
    plaintextBytes
  );

  const macKey = await crypto.subtle.importKey(
    'raw',
    conversationKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const macBuffer = await crypto.subtle.sign('HMAC', macKey, ciphertextBuffer);

  return {
    header: {
      ephemeralPubKey: '',
      prevChainLength: 0,
      messageNum: 0,
    },
    ciphertext: arrayBufferToHex(ciphertextBuffer),
    nonce: arrayBufferToHex(nonce.buffer),
    mac: arrayBufferToHex(macBuffer),
    isEncrypted: true,
  };
}
