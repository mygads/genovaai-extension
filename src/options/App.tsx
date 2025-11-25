import { useState, useEffect } from 'react';
import { FaCog, FaRobot, FaHome } from 'react-icons/fa';
import { isAuthenticated, getAuthData, type AuthData } from '../shared/storage';
import { getProfile } from '../shared/api';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import PreferencesPage from './components/PreferencesPage';
import './styles.css';

type TabType = 'dashboard' | 'preferences';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

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
              <h1>Genova AI Extension</h1>
              <div className="subtitle">
                Welcome, {authData?.user.name || authData?.user.email}
              </div>
            </div>
          </div>
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
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid #4CAF50' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'dashboard' ? '600' : '500',
            color: activeTab === 'dashboard' ? '#4CAF50' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaHome style={{ marginRight: '8px' }} />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'preferences' ? '3px solid #2196F3' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'preferences' ? '600' : '500',
            color: activeTab === 'preferences' ? '#2196F3' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaCog style={{ marginRight: '8px' }} />
          Preferences
        </button>
      </div>

      <div className="app-content">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'preferences' && <PreferencesPage />}
      </div>

      <footer className="app-footer">
        <p>Genova AI v2.0 - AI-Powered Quiz Assistant</p>
        <p className="footer-hint">Connected to backend server</p>
      </footer>
    </div>
  );
}

export default App;
