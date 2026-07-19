import type { EncryptedEnvelope, SerializedRatchetState } from './types';
import { receiveMessageKey, skipMessageKeys, prepareRatchetForReceive } from './ratchet';
import { hexToUint8Array, arrayBufferToHex } from './keygen';

export async function decryptMessage(
  envelope: EncryptedEnvelope,
  ratchetState: SerializedRatchetState
): Promise<{ plaintext: string; updatedState: SerializedRatchetState }> {
  if (!envelope.isEncrypted) {
    return { plaintext: envelope.ciphertext, updatedState: ratchetState };
  }

  let workingState = ratchetState;

  if (envelope.header.ephemeralPubKey && envelope.header.ephemeralPubKey !== ratchetState.lastRatchetPubKey) {
    workingState = await prepareRatchetForReceive(
      workingState,
      envelope.header.ephemeralPubKey
    );
  }

  if (!workingState.recvChainKey) {
    return { plaintext: '[Unable to decrypt - no receive chain]', updatedState: workingState };
  }

  const targetMsgNum = envelope.header.messageNum;
  let key: Uint8Array;

  if (targetMsgNum > workingState.recvCount) {
    const skipped = await skipMessageKeys(workingState, targetMsgNum - 1);
    key = skipped.key;
    workingState = skipped.updatedState;
  } else {
    const result = await receiveMessageKey(workingState);
    key = result.key;
    workingState = result.updatedState;
  }

  const nonce = hexToUint8Array(envelope.nonce);
  const ciphertext = hexToUint8Array(envelope.ciphertext);
  const expectedMac = hexToUint8Array(envelope.mac);

  const macKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sender = '';
  const encoder = new TextEncoder();
  const additionalData = encoder.encode(
    JSON.stringify({ sender, msgNum: targetMsgNum })
  );

  const macData = new Uint8Array([...additionalData, ...ciphertext, ...nonce]);
  const macValid = await crypto.subtle.verify('HMAC', macKey, macData, expectedMac);

  if (!macValid) {
    return { plaintext: '[Message integrity check failed]', updatedState: workingState };
  }

  const aesKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        additionalData,
        tagLength: 128,
      },
      aesKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedBuffer);

    return { plaintext, updatedState: workingState };
  } catch {
    return { plaintext: '[Decryption failed]', updatedState: workingState };
  }
}

export async function decryptWithKey(
  envelope: EncryptedEnvelope,
  conversationKey: Uint8Array
): Promise<string> {
  if (!envelope.isEncrypted) {
    return envelope.ciphertext;
  }

  const nonce = hexToUint8Array(envelope.nonce);
  const ciphertext = hexToUint8Array(envelope.ciphertext);
  const expectedMac = hexToUint8Array(envelope.mac);

  const macKey = await crypto.subtle.importKey(
    'raw',
    conversationKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const macValid = await crypto.subtle.verify('HMAC', macKey, ciphertext, expectedMac);

  if (!macValid) {
    return '[Integrity check failed]';
  }

  const aesKey = await crypto.subtle.importKey(
    'raw',
    conversationKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        tagLength: 128,
      },
      aesKey,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return '[Decryption failed]';
  }
}
