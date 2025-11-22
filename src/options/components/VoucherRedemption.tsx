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
    <div className="space-y-4">
      {/* Voucher Input Card */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 shadow-md">
        <div className="flex items-center mb-4">
          <FaTicketAlt className="text-3xl text-purple-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Redeem Voucher</h3>
            <p className="text-sm text-gray-600">Enter your voucher code to get credits or balance</p>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter voucher code (e.g., WELCOME10)"
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg font-mono tracking-wider uppercase"
            style={{ letterSpacing: '0.1em' }}
          />

          <button
            onClick={handleRedeem}
            disabled={loading || !voucherCode.trim()}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              loading || !voucherCode.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="inline animate-spin mr-2" />
                Redeeming...
              </>
            ) : (
              <>
                <FaTicketAlt className="inline mr-2" />
                Redeem Voucher
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-700 font-medium">{success}</p>
              {result && (
                <div className="mt-2 text-sm text-green-600">
                  {result.creditsAdded > 0 && (
                    <p>✨ Credits added: +{result.creditsAdded}</p>
                  )}
                  {result.balanceAdded > 0 && (
                    <p>💰 Balance added: +Rp {result.balanceAdded.toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <FaTimes className="text-red-500 mt-1 mr-3 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>💡 Tip:</strong> Voucher codes are case-insensitive. You can get voucher codes from:
        </p>
        <ul className="mt-2 ml-4 text-sm text-blue-600 space-y-1">
          <li>• Promotional campaigns</li>
          <li>• Special events</li>
          <li>• Email newsletters</li>
          <li>• Social media giveaways</li>
        </ul>
      </div>

      {/* Alternative Action */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Don't have a voucher code?</p>
        <a
          href="http://localhost:8090/dashboard/balance/topup"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Top-up Balance
        </a>
      </div>
    </div>
  );
}
