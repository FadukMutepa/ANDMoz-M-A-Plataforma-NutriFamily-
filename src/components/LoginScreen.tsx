import { useState } from 'react';
import { ArrowRight, KeyRound, Mail, ShieldCheck, Sprout, UserCheck } from 'lucide-react';
import type { UserRole } from '../types';

interface LoginScreenProps {
  onEmailPasswordLogin: (email: string, password: string) => Promise<void>;
  onDemoLogin: (role: UserRole) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  errorMessage: string | null;
  isSigningIn: boolean;
}

export function LoginScreen({
  onEmailPasswordLogin,
  onDemoLogin,
  onGoogleLogin,
  errorMessage,
  isSigningIn,
}: LoginScreenProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onEmailPasswordLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 shadow-sm">
        {/* Brand Identity */}
        <div className="flex flex-col items-center text-center mb-7">
          {!logoFailed ? (
            <img
              src="/src/assets/images/andmoz_brand_mark_1795644743489.jpg"
              alt="Emblema institucional da ANDMoz"
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 mb-3.5"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white mb-3.5">
              <Sprout className="w-7 h-7" />
            </div>
          )}
          <h1 className="text-xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
            ANDMoz M&amp;A — NutriFamily +
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Associação Nutrição em Desenvolvimento · Quelimane, Zambézia
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
          >
            {errorMessage}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              E-mail institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="utilizador@andmoz.org.mz"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
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
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2E7D32] hover:bg-[#256628] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>{isSigningIn ? 'A autenticar...' : 'Entrar na Plataforma'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center mt-3 leading-relaxed">
          Credenciais de teste: <span className="font-mono-num">gestor@andmoz.org.mz</span> ou{' '}
          <span className="font-mono-num">admin@andmoz.org.mz</span> · Senha:{' '}
          <span className="font-mono-num">Andmoz2026!</span>
        </p>

        {/* Demo Quick Access Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-500">
              Acesso rápido de demonstração
            </span>
          </div>
        </div>

        {/* Two Distinct Role Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={isSigningIn}
            onClick={() => void onDemoLogin('gestor')}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#F8FAF9] hover:bg-[#EAF4EB] border border-slate-200 hover:border-[#4CAF50] rounded-xl text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <UserCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-slate-900">
                  Acesso Demonstração (Gestor)
                </span>
                <span className="block text-[11px] text-slate-500 truncate">
                  Perfil operacional · Inserção de registos e envio de relatórios
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            disabled={isSigningIn}
            onClick={() => void onDemoLogin('administrador')}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#F8FAF9] hover:bg-[#EAF4EB] border border-slate-200 hover:border-[#2E7D32] rounded-xl text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-slate-900">
                  Acesso Demonstração (Administrador)
                </span>
                <span className="block text-[11px] text-slate-500 truncate">
                  Perfil executivo · Visão global, edição, documentos e PDF
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            disabled={isSigningIn}
            onClick={() => void onGoogleLogin()}
            className="text-xs font-medium text-slate-600 hover:text-[#2E7D32] transition-colors cursor-pointer"
          >
            Ou entrar com Conta Google institucional (Administrador)
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 text-center">
        Programa NutriFamily + · Ciclo de 12 Meses · Quelimane, Moçambique
      </p>
    </div>
  );
}
