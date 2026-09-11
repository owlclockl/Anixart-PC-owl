import React, { useState } from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';
import { useAuthStore } from '../stores/auth';
import { useNavigationStore } from '../stores/navigation';

const AuthPage: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setToken, setProfile } = useAuthStore();
  const { navigate } = useNavigationStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (window.anixApi?.auth?.signIn) {
        const res = await window.anixApi.auth.signIn(login, password);
        if (res?.token) {
          setToken(res.token, res.profile?.id || 0);
          setProfile(res.profile);
          navigate('home');
        } else {
          setError('Неверный логин или пароль');
        }
      } else {
        // Mock for dev
        await new Promise(r => setTimeout(r, 800));
        if (login && password) {
          setToken('mock_token', 1);
          setProfile({ id: 1, login, avatar: './assets/icons/defaultAvatar.svg' });
          navigate('home');
        } else {
          setError('Заполните все поля');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <MetaInfo subTitle="Авторизация" />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <img src="./assets/icons/anidesk-icon.png" alt="AniDesk" width={64} height={64} />
            <h1>Вход в Anixart</h1>
            <p>Используйте ваш аккаунт Anixart</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div className="auth-error">
                <AppIcon name="info" size={16} />
                {error}
              </div>
            )}

            <div className="auth-field">
              <label>Логин или Email</label>
              <div className="auth-input-wrapper">
                <AppIcon name="user" size={18} />
                <input type="text" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Введите логин" required />
              </div>
            </div>

            <div className="auth-field">
              <label>Пароль</label>
              <div className="auth-input-wrapper">
                <AppIcon name="shield" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" required />
              </div>
            </div>

            <button type="submit" className="base-main-button primary auth-submit" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </button>

            <div className="auth-links">
              <a href="#" onClick={(e) => { e.preventDefault(); (window as any).winApi?.openLink('https://anixart.app/'); }}>Регистрация</a>
              <a href="#" onClick={(e) => { e.preventDefault(); (window as any).winApi?.openLink('https://anixart.app/'); }}>Забыли пароль?</a>
            </div>
          </form>

          <div className="auth-footer">
            <p>Неофициальный клиент. Мы не храним ваши пароли — авторизация через API Anixart.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
