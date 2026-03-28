import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    
    try {
      setLoading(true);
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[var(--bg-base)]">
      <div 
        className="w-full max-w-[400px] animate-fade-in bg-[var(--bg-surface)] rounded-[var(--radius-lg)]"
        style={{ padding: '40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>◆</span>
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              SurveyLab
            </span>
          </div>
          <h1 className="text-[24px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium mb-[6px]" style={{ color: 'var(--text-primary)' }}>Username</label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="admin"
              className="w-full text-sm outline-none transition-shadow"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand)';
                e.target.style.boxShadow = '0 0 0 3px var(--brand-light)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[6px]" style={{ color: 'var(--text-primary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full text-sm outline-none transition-shadow"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand)';
                e.target.style.boxShadow = '0 0 0 3px var(--brand-light)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white text-[14px] font-medium flex items-center justify-center gap-2 transition-colors duration-150 relative overflow-hidden group"
            style={{ 
              background: loading ? 'var(--border-strong)' : 'var(--brand)',
              borderRadius: 'var(--radius-sm)',
              padding: '11px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = 'var(--brand-hover)' }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = 'var(--brand)' }}
          >
            {loading && <div className="h-4 w-4 rounded-full border-2 border-white/80 border-t-white animate-custom-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 text-[13px] text-center font-medium animate-fade-in" style={{ color: 'var(--danger)' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
