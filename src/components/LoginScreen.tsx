import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Sprout,
} from 'lucide-react';

interface LoginScreenProps {
  onEmailPasswordLogin: (email: string, password: string) => Promise<void>;
  errorMessage: string | null;
  isSigningIn: boolean;
}

export function LoginScreen({
  onEmailPasswordLogin,
  errorMessage,
  isSigningIn,
}: LoginScreenProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onEmailPasswordLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] relative flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* Subtle institutional ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 15%, rgba(76, 175, 80, 0.09), transparent 42%), radial-gradient(circle at 85% 85%, rgba(46, 125, 50, 0.08), transparent 45%)',
        }}
      />

      <div className="relative w-full max-w-[440px]">
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.12)] overflow-hidden">
          {/* Top institutional accent band */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#2E7D32] via-[#4CAF50] to-[#2E7D32]" />

          <div className="p-7 sm:p-9">
            {/* Brand Identity */}
            <div className="flex flex-col items-center text-center">
              {!logoFailed ? (
                <div className="mb-3 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/image_8073a94b.png"
                    alt="Logotipo institucional da AND MOZ"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="h-24 sm:h-28 w-auto max-w-[240px] object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#2E7D32] flex items-center justify-center text-white mb-4 shadow-sm">
                  <Sprout className="w-8 h-8" />
                </div>
              )}

              <h1 className="text-sm font-semibold text-slate-800 mt-1 [text-wrap:balance]">
                Associação Nutrição em Desenvolvimento
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quelimane · Província da Zambézia
              </p>
            </div>

            <div className="my-6 border-t border-slate-100" />

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Institutional Login Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  E-mail institucional
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="utilizador@andmoz.org.mz"
                    className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-[#F8FAF9]/60 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Palavra-passe
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 min-h-[44px] text-sm text-slate-900 bg-[#F8FAF9]/60 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? 'Ocultar palavra-passe'
                        : 'Mostrar palavra-passe'
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] bg-[#2E7D32] hover:bg-[#256628] active:bg-[#1E5621] disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <span>{isSigningIn ? 'A autenticar...' : 'Entrar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500 text-center">
          AND MOZ · Associação Nutrição em Desenvolvimento · Quelimane, Moçambique
        </p>
      </div>
    </div>
  );
}
