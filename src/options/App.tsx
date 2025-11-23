import { useState, useEffect } from 'react';
import { FaCog, FaRobot, FaBook, FaUser, FaCoins, FaCreditCard, FaPalette, FaFileAlt } from 'react-icons/fa';
import { isAuthenticated, getAuthData, type AuthData } from '../shared/storage';
import { getProfile } from '../shared/api';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import BalancePage from './components/BalancePage';
import SessionsPage from './components/SessionsPage';
import HistoryPage from './components/HistoryPage';
import BubblePreferences from './components/BubblePreferences';
import KnowledgeManager from './components/KnowledgeManager';
import './styles.css';

type TabType = 'profile' | 'balance' | 'sessions' | 'history' | 'knowledge' | 'preferences';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      console.log('[Options] Checking authentication...');
      const isAuth = await isAuthenticated();
      console.log('[Options] Is authenticated:', isAuth);
      setAuthenticated(isAuth);
      
      if (isAuth) {
        const data = await getAuthData();
        console.log('[Options] Auth data:', data);
        setAuthData(data);
        
        // Refresh user data from server
        try {
          const profileResult = await getProfile();
          console.log('[Options] Profile result:', profileResult);
          if (profileResult.success && profileResult.data) {
            // Update auth data with fresh user info
            if (data) {
              data.user = profileResult.data;
              setAuthData({ ...data });
              console.log('[Options] Updated auth data with profile');
            }
          }
        } catch (profileError) {
          console.error('[Options] Profile fetch error:', profileError);
          // Continue anyway with cached data
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[Options] checkAuth error:', error);
      setLoading(false);
      setAuthenticated(false);
    }
  }

  function handleLoginSuccess() {
    checkAuth();
  }

  function handleLogout() {
    setAuthenticated(false);
    setAuthData(null);
    setActiveTab('profile');
  }

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <FaCog className="fa-spin" style={{ fontSize: '48px', color: '#4CAF50' }} />
            <p style={{ marginTop: '20px', color: '#666' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <FaRobot className="logo-icon" />
            <div>
              <h1>GenovaAI Extension</h1>
              <div className="subtitle">
                Welcome, {authData?.user.name || authData?.user.email}
              </div>
            </div>
          </div>
          {authData?.user && (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ 
                display: 'flex', 
                gap: '10px',
                padding: '8px 15px',
                background: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCoins style={{ color: '#4CAF50' }} />
                  <span><strong>{authData.user.credits || 0}</strong> credits</span>
                </div>
                <div style={{ borderLeft: '1px solid #ddd', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCreditCard style={{ color: '#2196F3' }} />
                  <span>Rp <strong>{authData.user.balance ? parseFloat(authData.user.balance.toString()).toLocaleString('id-ID') : '0'}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '5px',
        borderBottom: '2px solid #e0e0e0',
        padding: '0 30px',
        background: 'white',
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '3px solid #4CAF50' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'profile' ? '600' : '500',
            color: activeTab === 'profile' ? '#4CAF50' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaUser style={{ marginRight: '8px' }} />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'balance' ? '3px solid #2196F3' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'balance' ? '600' : '500',
            color: activeTab === 'balance' ? '#2196F3' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaCreditCard style={{ marginRight: '8px' }} />
          Balance
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'sessions' ? '3px solid #9C27B0' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'sessions' ? '600' : '500',
            color: activeTab === 'sessions' ? '#9C27B0' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaCog style={{ marginRight: '8px' }} />
          Sessions
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #FF9800' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'history' ? '600' : '500',
            color: activeTab === 'history' ? '#FF9800' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaBook style={{ marginRight: '8px' }} />
          History
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'knowledge' ? '3px solid #00BCD4' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'knowledge' ? '600' : '500',
            color: activeTab === 'knowledge' ? '#00BCD4' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaFileAlt style={{ marginRight: '8px' }} />
          Knowledge
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'preferences' ? '3px solid #E91E63' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'preferences' ? '600' : '500',
            color: activeTab === 'preferences' ? '#E91E63' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaPalette style={{ marginRight: '8px' }} />
          Preferences
        </button>
      </div>

      <div className="app-content">
        {activeTab === 'profile' && <ProfilePage authData={authData} onLogout={handleLogout} />}
        {activeTab === 'balance' && <BalancePage authData={authData} />}
        {activeTab === 'sessions' && <SessionsPage />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'knowledge' && <KnowledgeManager />}
        {activeTab === 'preferences' && <BubblePreferences />}
      </div>

      <footer className="app-footer">
        <p>GenovaAI v2.0 – AI-Powered Quiz Assistant</p>
        <p className="footer-hint">Connected to backend server</p>
      </footer>
    </div>
  );
}

export default App;
