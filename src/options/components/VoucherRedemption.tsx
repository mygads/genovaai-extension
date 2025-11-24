import React, { useState } from 'react';
import { FaTicketAlt, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

interface Props {
  onRedeemSuccess?: () => void;
}

export default function VoucherRedemption({ onRedeemSuccess }: Props) {
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleRedeem = async () => {
    if (!voucherCode.trim()) {
      setError('Please enter voucher code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResult(null);

    try {
      // TODO: Call redeem voucher API when implemented
      // For now, show placeholder message
      setTimeout(() => {
        setLoading(false);
        setSuccess('Voucher redemption feature coming soon! Please use web dashboard to redeem vouchers.');
        if (onRedeemSuccess) onRedeemSuccess();
      }, 1000);
      
      // Uncomment when API is ready:
      /*
      const response = await redeemVoucher(voucherCode);
      
      if (response.success) {
        setSuccess('Voucher redeemed successfully!');
        setResult(response.data);
        setVoucherCode('');
        
        if (onRedeemSuccess) {
          onRedeemSuccess();
        }
        
        setTimeout(() => {
          setSuccess('');
          setResult(null);
        }, 5000);
      } else {
        setError(response.error || 'Failed to redeem voucher');
      }
      */
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleRedeem();
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Voucher Input Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
          <FaTicketAlt style={{ fontSize: '32px' }} />
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>Redeem Voucher</h3>
            <p style={{ fontSize: '14px', opacity: 0.9 }}>Enter your voucher code to get credits or balance</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter voucher code (e.g., WELCOME10)"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '18px',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 'bold',
            }}
          />

          <button
            onClick={handleRedeem}
            disabled={loading || !voucherCode.trim()}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              background: loading || !voucherCode.trim() ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.95)',
              color: loading || !voucherCode.trim() ? 'rgba(255,255,255,0.7)' : '#667eea',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || !voucherCode.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                Redeeming...
              </>
            ) : (
              <>
                <FaTicketAlt />
                Redeem Voucher
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            marginTop: '15px',
            padding: '12px 16px',
            background: 'rgba(76,175,80,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}>
            <FaCheck style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '500', marginBottom: result ? '8px' : '0' }}>{success}</p>
              {result && (
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  {result.creditsAdded > 0 && <p>✨ Credits added: +{result.creditsAdded}</p>}
                  {result.balanceAdded > 0 && <p>💰 Balance added: +Rp {result.balanceAdded.toLocaleString()}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '15px',
            padding: '12px 16px',
            background: 'rgba(244,67,54,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}>
            <FaTimes style={{ flexShrink: 0, marginTop: '2px' }} />
            <p>{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div style={{
          marginTop: '15px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          fontSize: '13px',
        }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>💡 Tip:</strong> Get voucher codes from promotional campaigns, special events, or newsletters
          </p>
        </div>

        {/* Alternative Action */}
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '8px' }}>Don't have a voucher code?</p>
          <a
            href="http://https://genova.genfity.com/dashboard/balance/topup"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Top-up Balance →
          </a>
        </div>
      </div>
    </div>
  );
}
