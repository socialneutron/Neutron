import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'

export default function ProfileBanner({ bannerUrl, isOwn, onEdit }) {
  return (
    <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#020617',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: [
              'radial-gradient(circle at 25% 40%, rgba(0,210,255,0.15) 0%, transparent 55%)',
              'radial-gradient(circle at 75% 60%, rgba(123,97,255,0.15) 0%, transparent 55%)',
              'linear-gradient(135deg, rgba(0,210,255,0.04) 0%, transparent 50%, rgba(123,97,255,0.04) 100%)',
            ].join(', '),
          }} />
          <motion.div
            animate={{
              background: [
                'linear-gradient(110deg, transparent 20%, rgba(0,210,255,0.06) 40%, transparent 60%)',
                'linear-gradient(110deg, transparent 30%, rgba(0,210,255,0.06) 50%, transparent 70%)',
                'linear-gradient(110deg, transparent 20%, rgba(0,210,255,0.06) 40%, transparent 60%)',
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0 }}
          />
        </div>
      )}

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(transparent 50%, rgba(2,6,23,0.85) 100%)',
        pointerEvents: 'none',
      }} />

      {isOwn && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onEdit?.() }}
          style={{
            position: 'absolute', bottom: 10, right: 14,
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(7,17,36,0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}
          title="Change banner"
        >
          <Camera size={14} />
        </motion.button>
      )}
    </div>
  )
}
