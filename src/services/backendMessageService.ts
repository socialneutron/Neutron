import api from '../lib/api';
import type { EncryptedEnvelope } from '../messages/types';

export const backendMessageService = {
  async getConversations() {
    const res = await api.get('/messages/conversations');
    return res.data?.conversations || [];
  },

  async getConversation(userId: string, cursor?: string, limit = 50) {
    const res = await api.get(`/messages/conversation/${userId}`, {
      cursor,
      limit,
    });
    return res.data?.messages || [];
  },

  async send(
    receiverId: string,
    message: string,
    encryptedEnvelope?: EncryptedEnvelope
  ) {
    const body: Record<string, any> = { receiverId, message };
    if (encryptedEnvelope?.isEncrypted) {
      body.encryptedEnvelope = encryptedEnvelope;
      body.isEncrypted = true;
    }
    const res = await api.post('/messages', body);
    return res.data?.message || null;
  },

  async markRead(senderId: string) {
    await api.put(`/messages/${senderId}/read`);
    return true;
  },

  async delete(messageId: string) {
    await api.delete(`/messages/${messageId}`);
    return true;
  },

  async uploadPublicKey(publicKeyHex: string, fingerprint: string) {
    const res = await api.post('/auth/upload-key', {
      publicKey: publicKeyHex,
      fingerprint,
    });
    return res.data;
  },

  async getPublicKey(userId: string) {
    const res = await api.get(`/user/${userId}/public-key`);
    return res.data?.publicKey || null;
  },
};
