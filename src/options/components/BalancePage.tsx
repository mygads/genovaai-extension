import { FaCoins, FaCreditCard, FaPlus, FaHistory } from 'react-icons/fa';
import { type AuthData } from '../../shared/storage';
import { getTransactions } from '../../shared/api';
import { useState, useEffect } from 'react';
import VoucherRedemption from './VoucherRedemption';

interface BalancePageProps {
  authData: AuthData | null;
}

export default function BalancePage({ authData }: BalancePageProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const limit = 10;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    const result = await getTransactions(limit, offset);
    setLoading(false);

    if (result.success) {
      const data = result.data || [];
      setTransactions(data);
      setHasMore(data.length === limit);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'SUCCESS':
      case 'COMPLETED':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'FAILED':
        return '#f44336';
      default:
        return '#666';
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'CREDIT_PURCHASE':
        return 'Credit Purchase';
      case 'BALANCE_TOPUP':
        return 'Balance Top Up';
      case 'CREDIT_USAGE':
        return 'Credit Used';
      case 'BALANCE_USAGE':
        return 'Balance Used';
      case 'WELCOME_BONUS':
        return 'Welcome Bonus';
      case 'REFUND':
        return 'Refund';
      default:
        return type;
    }
  }

  if (!authData) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50, #45a049)',
          borderRadius: '12px',
          padding: '30px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <FaCoins style={{ fontSize: '32px' }} />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Available Credits</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                {authData.user.credits}
              </div>
            </div>
          </div>
          <button
            onClick={() => window.open('http://localhost:3000/dashboard/balance', '_blank')}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <FaPlus />
            Buy Credits
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #2196F3, #1976D2)',
          borderRadius: '12px',
          padding: '30px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(33,150,243,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <FaCreditCard style={{ fontSize: '32px' }} />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Balance</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                Rp {authData.user.balance ? parseFloat(authData.user.balance).toLocaleString('id-ID') : '0'}
              </div>
            </div>
          </div>
          <button
            onClick={() => window.open('http://localhost:3000/dashboard/balance', '_blank')}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <FaPlus />
            Top Up Balance
          </button>
        </div>
      </div>

      {/* Voucher Redemption */}
      <div style={{ marginTop: '30px' }}>
        <VoucherRedemption onRedeemSuccess={() => {
          // Reload transactions after successful redemption
          loadTransactions();
        }} />
      </div>

      {/* Transactions */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '30px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <FaHistory style={{ fontSize: '20px', color: '#666' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Recent Transactions</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No transactions yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transactions.map((tx) => (
              <div key={tx.id} style={{
                padding: '15px',
                background: '#f9f9f9',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    {getTypeLabel(tx.type)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(tx.createdAt).toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: tx.type.includes('USAGE') ? '#f44336' : '#4CAF50',
                    marginBottom: '4px',
                  }}>
                    {tx.type.includes('USAGE') ? '-' : '+'}
                    {tx.type.includes('CREDIT') ? `${tx.amount} credits` : `Rp ${parseFloat(tx.amount).toLocaleString('id-ID')}`}
                  </div>
                  <div style={{
                    padding: '3px 10px',
                    background: getStatusColor(tx.status),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    display: 'inline-block',
                  }}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {transactions.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '15px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #eee',
          }}>
            <button
              onClick={() => {
                if (offset > 0) {
                  setOffset(offset - limit);
                  loadTransactions();
                }
              }}
              disabled={offset === 0}
              style={{
                padding: '8px 16px',
                background: offset === 0 ? '#e0e0e0' : '#4CAF50',
                color: offset === 0 ? '#999' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: offset === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Previous
            </button>

            <span style={{ fontSize: '14px', color: '#666' }}>
              Page {Math.floor(offset / limit) + 1}
            </span>

            <button
              onClick={() => {
                if (hasMore) {
                  setOffset(offset + limit);
                  loadTransactions();
                }
              }}
              disabled={!hasMore}
              style={{
                padding: '8px 16px',
                background: !hasMore ? '#e0e0e0' : '#4CAF50',
                color: !hasMore ? '#999' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !hasMore ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
