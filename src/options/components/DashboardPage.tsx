import { useState, useEffect } from 'react';
import { FaUser, FaWallet, FaCog, FaExternalLinkAlt, FaCheckCircle, FaSignOutAlt } from 'react-icons/fa';
import { getProfile, getSessions, logoutUser } from '../../shared/api';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      console.log('[Dashboard Extension] Loading data...');
      
      // Load profile with balance and credits
      const profileResult = await getProfile();
      if (profileResult.success && profileResult.data) {
        setProfile(profileResult.data);
      }

      // Load active session from API (find the one with isActive: true)
      const sessionsResult = await getSessions();
      console.log('[Dashboard Extension] Sessions result:', sessionsResult);
      
      if (sessionsResult.success) {
        const allSessions = Array.isArray(sessionsResult.data) 
          ? sessionsResult.data 
          : (sessionsResult.data?.sessions || []);
        
        console.log('[Dashboard Extension] All sessions:', allSessions);
        
        // Find session with isActive: true
        const active = allSessions.find((s: any) => s.isActive === true);
        console.log('[Dashboard Extension] Active session:', active);
        
        setActiveSession(active || null);
      }
    } catch (error) {
      console.error('[Dashboard] Load error:', error);
    } finally {
      setLoading(false);
    }
  }

  function openServerSettings() {
    chrome.tabs.create({ url: 'https://genova.genfity.com/dashboard/settings' });
  }

  function openServerUrl() {
    chrome.tabs.create({ url: 'https://genova.genfity.com/dashboard' });
  }

  async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await logoutUser();
        // Reload to show login page
        window.location.reload();
      } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        color: '#666'
      }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header with Top Up Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '5px' }}>
            Dashboard
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Welcome to GenovaAI Extension
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={openServerUrl}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FaExternalLinkAlt />
            Manage Account
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            title="Logout"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Profile Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FaUser style={{ color: '#1976d2', fontSize: '20px' }} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Profile</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>Account Info</p>
            </div>
          </div>
          <div style={{ paddingLeft: '52px' }}>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>Name</p>
              <p style={{ fontSize: '14px', color: '#333' }}>{profile?.name || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>Email</p>
              <p style={{ fontSize: '14px', color: '#333' }}>{profile?.email || '-'}</p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#fff3e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FaWallet style={{ color: '#f57c00', fontSize: '20px' }} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Balance</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>Credits</p>
            </div>
          </div>
          <div style={{ paddingLeft: '52px' }}>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>Available Credits</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#f57c00' }}>
                {profile?.credits || 0}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>Balance (Free Pool)</p>
              <p style={{ fontSize: '14px', color: '#333' }}>
                Rp {parseFloat(profile?.balance || '0').toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Session Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: '#e8f5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FaCog style={{ color: '#4CAF50', fontSize: '20px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Current Session</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>Active Configuration</p>
          </div>
          {activeSession && (
            <div style={{
              padding: '4px 12px',
              background: '#4CAF50',
              color: 'white',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <FaCheckCircle style={{ fontSize: '10px' }} />
              Active
            </div>
          )}
        </div>

        {activeSession ? (
          <div style={{ paddingLeft: '52px' }}>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                {activeSession.sessionName}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{
                  padding: '4px 8px',
                  background: activeSession.requestMode === 'premium' ? '#e3f2fd' : activeSession.requestMode === 'free_user_key' ? '#fff3e0' : '#f3e5f5',
                  color: activeSession.requestMode === 'premium' ? '#1976d2' : activeSession.requestMode === 'free_user_key' ? '#f57c00' : '#7b1fa2',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                }}>
                  {activeSession.requestMode === 'premium' ? '💳 Premium' : activeSession.requestMode === 'free_user_key' ? '🔑 Free' : '🌐 Pool'}
                </span>
                <span style={{
                  padding: '4px 8px',
                  background: '#f5f5f5',
                  color: '#666',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  border: '1px solid #ddd',
                }}>
                  {activeSession.provider?.toUpperCase() || 'N/A'}
                </span>
                <span style={{
                  padding: '4px 8px',
                  background: '#f5f5f5',
                  color: '#666',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  border: '1px solid #ddd',
                }}>
                  {activeSession.model || 'N/A'}
                </span>
                <span style={{
                  padding: '4px 8px',
                  background: '#f5f5f5',
                  color: '#666',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  border: '1px solid #ddd',
                }}>
                  {activeSession.answerMode}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            paddingLeft: '52px',
            paddingTop: '10px',
          }}>
            <p style={{
              color: '#999',
              fontSize: '14px',
              fontStyle: 'italic',
              marginBottom: '12px',
            }}>
              No active session configured.
            </p>
            <button
              onClick={openServerSettings}
              style={{
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FaExternalLinkAlt style={{ fontSize: '11px' }} />
              Set Active Session on Server
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f9f9f9',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#666',
      }}>
        <p style={{ marginBottom: '8px' }}>
          <strong>💡 Tip:</strong> Click "Manage Account" to top up balance or manage sessions on the server dashboard.
        </p>
        <p>
          Use the <strong>Preferences</strong> tab to customize bubble UI appearance (colors, position, duration).
        </p>
      </div>
    </div>
  );
}
