import { useState } from 'react';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { loginUser, registerUser } from '../../shared/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginUser({ email, password });
      
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!email || !password || !name) {
      setError('All fields are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerUser({ email, password, name });
      
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            GenovaAI
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>AI-Powered Quiz Assistant</p>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '4px',
        }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: mode === 'login' ? 'white' : 'transparent',
              color: mode === 'login' ? '#667eea' : '#666',
              fontWeight: mode === 'login' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <FaSignInAlt style={{ marginRight: '8px' }} />
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: mode === 'register' ? 'white' : 'transparent',
              color: mode === 'register' ? '#667eea' : '#666',
              fontWeight: mode === 'register' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <FaUserPlus style={{ marginRight: '8px' }} />
            Register
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            fontSize: '14px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '15px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '15px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  mode === 'login' ? handleLogin() : handleRegister();
                }
              }}
            />
            {mode === 'register' && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Minimum 8 characters
              </p>
            )}
          </div>

          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '10px',
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </div>

        {mode === 'register' && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#e3f2fd',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#1976d2',
          }}>
            <strong>Welcome Bonus:</strong> Get 10 free credits when you register!
          </div>
        )}
      </div>
    </div>
  );
}
