import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      if (!displayName.trim()) {
        setError('Zadej jméno');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName.trim());
      if (error) {
        setError(error.message);
      } else {
        setSignupSuccess(true);
      }
    }
    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-md text-center">
          <span className="text-4xl mb-3 block">📧</span>
          <h2 className="text-lg font-bold text-foreground mb-2">Ověř svůj email</h2>
          <p className="text-sm text-muted-foreground">
            Poslali jsme ti ověřovací odkaz na <b>{email}</b>. Klikni na něj a pak se přihlas.
          </p>
          <button
            onClick={() => { setSignupSuccess(false); setIsLogin(true); }}
            className="mt-4 text-sm text-primary font-semibold"
          >
            Zpět na přihlášení
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-5xl block mb-2">💩</span>
          <h1 className="text-2xl font-extrabold text-foreground">Bobník Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Přihlas se ke svému účtu' : 'Vytvoř si nový účet'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 shadow-md space-y-3">
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Jméno</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Tomáš"
                className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tomas@email.cz"
              required
              className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg header-gradient text-primary-foreground font-bold text-sm disabled:opacity-60"
          >
            {loading ? '...' : isLogin ? 'Přihlásit se' : 'Vytvořit účet'}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {isLogin ? 'Nemáš účet?' : 'Už máš účet?'}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold">
              {isLogin ? 'Registruj se' : 'Přihlas se'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
