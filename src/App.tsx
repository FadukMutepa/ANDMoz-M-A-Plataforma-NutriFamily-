import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  createInitialMemoryStore,
  fetchAllSupabaseData,
  resetWorkspaceToSeed,
  type DemoStoreState,
} from './dataStore';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import type { AppSessionUser, UserRole } from './types';
import {
  exportFamiliesPdf,
  exportMultipliersPdf,
  exportNutriFamilyPdf,
} from './utils/pdfExport';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar, type NavSection } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { GoalsView } from './components/GoalsView';
import { FamiliesView } from './components/FamiliesView';
import { MultipliersView } from './components/MultipliersView';
import { ActivitiesView } from './components/ActivitiesView';
import { DocumentsView } from './components/DocumentsView';
import { AdminEditHubView } from './components/AdminEditHubView';
import { GestorDashboard } from './components/GestorDashboard';
import { AdminSettingsModal } from './components/AdminSettingsModal';

function mapProfileRole(rawRole: unknown): UserRole {
  const normalized = String(rawRole || '')
    .trim()
    .toLowerCase();
  if (normalized === 'admin' || normalized === 'administrador') {
    return 'administrador';
  }
  return 'gestor';
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou palavra-passe incorrectos. Verifique as credenciais e tente novamente.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Conta ainda não confirmada por e-mail. Confirme o seu endereço antes de entrar.';
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Demasiadas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Falha de ligação ao servidor Supabase. Verifique a sua ligação à internet.';
  }
  return message;
}

async function fetchUserProfile(
  userId: string,
  email: string,
  fallbackName?: string
): Promise<AppSessionUser> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao consultar perfil em public.profiles: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      'Perfil não encontrado na tabela public.profiles para este utilizador. Contacte o Administrador.'
    );
  }

  const role = mapProfileRole(data.role);
  const displayName =
    String(data.nome || '').trim() ||
    fallbackName ||
    (role === 'administrador' ? 'Administrador ANDMoz' : 'Gestor de Projectos');

  return {
    uid: userId,
    displayName,
    email,
    role,
    authMode: 'supabase',
  };
}

function MainApp() {
  const [sessionUser, setSessionUser] = useState<AppSessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>('families');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Estado unificado: quando authMode === 'supabase', families/multipliers/documents vêm do PostgreSQL
  // e goals/activities mantêm o planeamento inicial de 12 meses em memória.
  const [store, setStore] = useState<DemoStoreState>(() => createInitialMemoryStore());

  const handleStoreChange = useCallback((updater: (prev: DemoStoreState) => DemoStoreState) => {
    setStore((prev) => updater(prev));
  }, []);

  const loadSupabaseData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setDataLoading(true);
    }
    setDataError(null);
    try {
      const remote = await fetchAllSupabaseData();
      setStore((prev) => ({
        ...prev,
        families: remote.families,
        multipliers: remote.multipliers,
        documents: remote.documents,
      }));
    } catch (err) {
      setDataError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os dados do projecto no Supabase.'
      );
    } finally {
      if (!options?.silent) {
        setDataLoading(false);
      }
    }
  }, []);

  // Restaurar sessão activa do Supabase e escutar alterações de autenticação
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (!cancelled) {
            setAuthError(`Não foi possível verificar a sessão Supabase: ${error.message}`);
          }
          return;
        }
        const authUser = data.session?.user;
        if (authUser && !cancelled) {
          const profile = await fetchUserProfile(
            authUser.id,
            authUser.email || 'utilizador@andmoz.org.mz',
            typeof authUser.user_metadata?.nome === 'string'
              ? authUser.user_metadata.nome
              : undefined
          );
          if (!cancelled) {
            setSessionUser(profile);
            setActiveSection(profile.role === 'administrador' ? 'dashboard' : 'families');
          }
        }
      } catch (err) {
        if (!cancelled) {
          await supabase.auth.signOut();
          setAuthError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar o perfil do utilizador.'
          );
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSessionUser((prev) => (prev?.authMode === 'demo' ? prev : null));
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const authUser = session.user;
        void fetchUserProfile(
          authUser.id,
          authUser.email || 'utilizador@andmoz.org.mz',
          typeof authUser.user_metadata?.nome === 'string'
            ? authUser.user_metadata.nome
            : undefined
        )
          .then((profile) => {
            if (!cancelled) {
              setSessionUser(profile);
              setAuthError(null);
            }
          })
          .catch(async (err) => {
            await supabase.auth.signOut();
            if (!cancelled) {
              setSessionUser(null);
              setAuthError(
                err instanceof Error
                  ? err.message
                  : 'Perfil não encontrado em public.profiles.'
              );
            }
          });
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Carregar dados iniciais e activar sincronização em tempo real do Supabase
  useEffect(() => {
    if (!sessionUser || sessionUser.authMode !== 'supabase') {
      return;
    }

    void loadSupabaseData();

    const channel = supabase
      .channel('andmoz-nutrifamily-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'familias' }, () => {
        void loadSupabaseData({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'multiplicadores' }, () => {
        void loadSupabaseData({ silent: true });
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documentos_atividades' },
        () => {
          void loadSupabaseData({ silent: true });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadSupabaseData, sessionUser]);

  // Garantir que o Gestor acede exclusivamente às 3 secções operacionais
  useEffect(() => {
    if (
      sessionUser?.role === 'gestor' &&
      activeSection !== 'families' &&
      activeSection !== 'multipliers' &&
      activeSection !== 'documents'
    ) {
      setActiveSection('families');
    }
  }, [activeSection, sessionUser]);

  const handleEmailPasswordLogin = async (email: string, password: string) => {
    setIsSigningIn(true);
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || password.length < 6) {
      setAuthError('Introduza um e-mail válido e palavra-passe com pelo menos 6 caracteres.');
      setIsSigningIn(false);
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        setAuthError(
          'Ligação ao Supabase não configurada neste ambiente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
        );
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setAuthError(translateAuthError(error.message));
        return;
      }

      if (!data.user) {
        setAuthError('Não foi possível obter os dados do utilizador autenticado.');
        return;
      }

      try {
        const profile = await fetchUserProfile(
          data.user.id,
          data.user.email || cleanEmail,
          typeof data.user.user_metadata?.nome === 'string'
            ? data.user.user_metadata.nome
            : undefined
        );
        setSessionUser(profile);
        setActiveSection(profile.role === 'administrador' ? 'dashboard' : 'families');
        return;
      } catch (profileErr) {
        await supabase.auth.signOut();
        setAuthError(
          profileErr instanceof Error
            ? profileErr.message
            : 'Perfil não encontrado na tabela public.profiles.'
        );
        return;
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (sessionUser?.authMode === 'supabase') {
      await supabase.auth.signOut();
    }
    setSessionUser(null);
    setAuthError(null);
    setDataError(null);
    setActiveSection('families');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-9 h-9 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">
            A verificar sessão na Plataforma NutriFamily +...
          </p>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <LoginScreen
        onEmailPasswordLogin={handleEmailPasswordLogin}
        errorMessage={authError}
        isSigningIn={isSigningIn}
      />
    );
  }

  const { goals, families, multipliers, activities, documents } = store;
  const isAdmin = sessionUser.role === 'administrador';

  const handleExportPdf = () => {
    if (!isAdmin) return;
    exportNutriFamilyPdf({
      generatedBy: sessionUser.displayName,
      goals,
      families,
      multipliers,
      activities,
      documents,
    });
  };

  const handleExportFamiliesPdf = () => {
    if (!isAdmin) return;
    exportFamiliesPdf(sessionUser.displayName, families);
  };

  const handleExportMultipliersPdf = () => {
    if (!isAdmin) return;
    exportMultipliersPdf(sessionUser.displayName, multipliers);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex">
      <Sidebar
        role={sessionUser.role}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenSettings={isAdmin ? () => setSettingsModalOpen(true) : undefined}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={sessionUser}
          activeSection={activeSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onExportPdf={isAdmin ? handleExportPdf : undefined}
          onRefreshData={
            sessionUser.authMode === 'supabase' ? () => void loadSupabaseData() : undefined
          }
          isRefreshing={dataLoading}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {dataError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">
                    Erro de sincronização com a base de dados Supabase
                  </p>
                  <p className="mt-0.5">{dataError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void loadSupabaseData()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold text-red-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          )}

          {sessionUser.authMode === 'supabase' && dataLoading ? (
            <div className="space-y-6" aria-busy="true">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
              <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
          ) : !isAdmin ? (
            <GestorDashboard
              user={sessionUser}
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              families={families}
              multipliers={multipliers}
              documents={documents}
              onDemoChange={handleStoreChange}
            />
          ) : (
            <>
              {activeSection === 'dashboard' && (
                <DashboardView
                  user={sessionUser}
                  goals={goals}
                  families={families}
                  multipliers={multipliers}
                  activities={activities}
                  documents={documents}
                  onNavigate={setActiveSection}
                  onExportPdf={handleExportPdf}
                  onExportFamiliesPdf={handleExportFamiliesPdf}
                  onExportMultipliersPdf={handleExportMultipliersPdf}
                />
              )}
              {activeSection === 'goals' && (
                <GoalsView
                  user={sessionUser}
                  goals={goals}
                  onExportPdf={handleExportPdf}
                  onDemoChange={handleStoreChange}
                />
              )}
              {activeSection === 'families' && (
                <FamiliesView
                  user={sessionUser}
                  families={families}
                  multipliers={multipliers}
                  onDemoChange={handleStoreChange}
                />
              )}
              {activeSection === 'multipliers' && (
                <MultipliersView
                  user={sessionUser}
                  multipliers={multipliers}
                  onDemoChange={handleStoreChange}
                />
              )}
              {activeSection === 'activities' && (
                <ActivitiesView
                  user={sessionUser}
                  activities={activities}
                  multipliers={multipliers}
                  onDemoChange={handleStoreChange}
                />
              )}
              {activeSection === 'documents' && (
                <DocumentsView
                  user={sessionUser}
                  documents={documents}
                  onDemoChange={handleStoreChange}
                />
              )}
              {activeSection === 'admin_editor' && (
                <AdminEditHubView
                  user={sessionUser}
                  goals={goals}
                  families={families}
                  multipliers={multipliers}
                  activities={activities}
                  onExportPdf={handleExportPdf}
                  onExportFamiliesPdf={handleExportFamiliesPdf}
                  onExportMultipliersPdf={handleExportMultipliersPdf}
                  onDemoChange={handleStoreChange}
                />
              )}
            </>
          )}
        </main>
      </div>

      {isAdmin && (
        <AdminSettingsModal
          open={settingsModalOpen}
          user={sessionUser}
          familiesCount={families.length}
          multipliersCount={multipliers.length}
          documentsCount={documents.length}
          onClose={() => setSettingsModalOpen(false)}
          onRestoreDemoData={() => resetWorkspaceToSeed(sessionUser, handleStoreChange)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
