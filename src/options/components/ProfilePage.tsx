import { FaUser, FaEnvelope, FaCoins, FaCreditCard, FaSignOutAlt, FaKey } from 'react-icons/fa';
import { type AuthData } from '../../shared/storage';
import { logoutUser, getApiKeys, addApiKey, deleteApiKey } from '../../shared/api';
import { useState, useEffect } from 'react';

interface ProfilePageProps {
  authData: AuthData | null;
  onLogout: () => void;
}

export default function ProfilePage({ authData, onLogout }: ProfilePageProps) {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [keyName, setKeyName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    try {
      const result = await getApiKeys();
      console.log('[ProfilePage] API Keys result:', result);
      if (result.success) {
        // Check if data is array or nested object
        const keys = Array.isArray(result.data) ? result.data : (result.data?.apiKeys || []);
        setApiKeys(keys);
      } else {
        console.warn('[ProfilePage] Invalid API keys data:', result);
        setApiKeys([]);
      }
    } catch (error) {
      console.error('[ProfilePage] Failed to load API keys:', error);
      setApiKeys([]);
    }
  }

  async function handleAddKey() {
    if (!newKey.trim()) return;
    
    setLoading(true);
    const result = await addApiKey(newKey, keyName);
    setLoading(false);
    
    if (result.success) {
      setNewKey('');
      setKeyName('');
      setShowAddKey(false);
      loadApiKeys();
    } else {
      alert(result.message || 'Failed to add API key');
    }
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm('Delete this API key?')) return;
    
    const result = await deleteApiKey(keyId);
    if (result.success) {
      loadApiKeys();
    }
  }

  async function handleLogout() {
    await logoutUser();
    onLogout();
  }

  if (!authData || !authData.user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
          Account Information
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaUser style={{ color: '#4CAF50', fontSize: '20px' }} />
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Name</div>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>
                {authData.user.name || 'Not set'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaEnvelope style={{ color: '#2196F3', fontSize: '20px' }} />
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Email</div>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>
                {authData.user.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div style={{
              flex: 1,
              padding: '15px',
              background: '#e8f5e9',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <FaCoins style={{ color: '#4CAF50' }} />
                <span style={{ fontSize: '13px', color: '#666' }}>Credits</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                {authData.user.credits}
              </div>
            </div>

            <div style={{
              flex: 1,
              padding: '15px',
              background: '#e3f2fd',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <FaCreditCard style={{ color: '#2196F3' }} />
                <span style={{ fontSize: '13px', color: '#666' }}>Balance</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196F3' }}>
                Rp {authData.user.balance ? parseFloat(authData.user.balance).toLocaleString('id-ID') : '0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
            <FaKey style={{ marginRight: '10px' }} />
            API Keys
          </h2>
          <button
            onClick={() => setShowAddKey(!showAddKey)}
            style={{
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {showAddKey ? 'Cancel' : 'Add Key'}
          </button>
        </div>

        {showAddKey && (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
            <input
              type="text"
              placeholder="Key name (optional)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                marginBottom: '10px',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              placeholder="AIza...."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                marginBottom: '10px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleAddKey}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              {loading ? 'Adding...' : 'Add Key'}
            </button>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No API keys added yet. Add your Gemini API key for free mode.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {apiKeys.map((key) => (
              <div key={key.id} style={{
                padding: '15px',
                background: '#f9f9f9',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    {key.keyName || 'Unnamed Key'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                    {key.maskedKey}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '15px',
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <FaSignOutAlt />
        Logout
      </button>
    </div>
  );
}
