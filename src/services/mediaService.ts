import { supabase } from '../lib/supabase'

export const mediaService = {
  async upload(ownerId: string, fileType: string, storageUrl: string, meta?: { width?: number; height?: number; duration?: number; size?: number }): Promise<string | null> {
    const { data, error } = await supabase.from('media').insert({
      owner_id: ownerId,
      storage_url: storageUrl,
      file_type: fileType,
      width: meta?.width || 0,
      height: meta?.height || 0,
      duration: meta?.duration || null,
      size: meta?.size || 0,
    }).select('id').single()
    if (error || !data) return null
    return (data as any).id
  },

  async getById(mediaId: string): Promise<any | null> {
    const { data, error } = await supabase.from('media').select('*').eq('id', mediaId).single()
    if (error) return null
    return data
  },

  async getByOwner(ownerId: string): Promise<any[]> {
    const { data } = await supabase.from('media').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false })
    return data || []
  },
}
