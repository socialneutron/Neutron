import { ArrowLeft } from 'lucide-react';
import './StoreCreated.css'; // optional styling file you can create later

export default function StoreCreated({ navigate }) {
  const goToBusiness = () => {
    if (navigate) navigate('business');
  };

  return (
    <div className="store-created" style={{ background: '#05050A', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '20px' }}>
      <button onClick={() => navigate('business')} style={{ position: 'absolute', top: '20px', left: '20px', width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(7,17,36,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,210,255,0.1)', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <ArrowLeft size={20} />
      </button>
      <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>Store Verified ✓</h2>
      <p style={{ color: '#9ca3af', fontSize: '15px', margin: 0 }}>Your phone number has been verified. You can now create your store.</p>
      <button className="glow-btn" onClick={goToBusiness}>Go to Business Dashboard</button>
    </div>
  );
}
