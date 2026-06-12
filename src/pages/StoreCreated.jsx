
import './StoreCreated.css'; // optional styling file you can create later

export default function StoreCreated({ navigate }) {
  // This page is shown after successful OTP verification.
  // You can extend it with a full store‑creation form later.
  const goToBusiness = () => {
    if (navigate) navigate('business');
  };

  return (
    <div className="store-created">
      <h2>Store Verified ✓</h2>
      <p>Your phone number has been verified. You can now create your store.</p>
      <button className="glow-btn" onClick={goToBusiness}>Go to Business Dashboard</button>
    </div>
  );
}
