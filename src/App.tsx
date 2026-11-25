import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  loadDemoStore,
  resetWorkspaceToSeed,
  saveDemoStore,
  type DemoStoreState,
} from './dataStore';
import { seedWorkspaceIfNeeded } from './seedData';
import type {
  Activity,
  AppSessionUser,
  Family,
  Goal,
  Multiplier,
  ReportDocument,
  UserRole,
} from './types';
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

const DEMO_SESSION_KEY = 'andmoz_active_demo_session_v1';
const DEMO_PASS = 'Andmoz2026!';

function resolveRoleFromEmail(email: string): UserRole {
  const normalized = email.trim().toLowerCase();
  if (
    normalized === 'admin@andmoz.org.mz' ||
    normalized === 'faduklourencooliveira@gmail.com' ||
    normalized.startsWith('admin')
  ) {
    return 'administrador';
  }
  return 'gestor';
}

function MainApp() {
  const [sessionUser, setSessionUser] = useState<AppSessionUser | null>(() => {
    try {
      const saved = localStorage.getItem(DEMO_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved) as AppSessionUser;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    try {
      const saved = localStorage.getItem(DEMO_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppSessionUser;
        return parsed.role === 'administrador' ? 'dashboard' : 'families';
      }
    } catch {
      // ignore
    }
    return 'families';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [dataLoading, setDataLoading] = useState(false);

  // Firebase state
  const [fbGoals, setFbGoals] = useState<Goal[]>([]);
  const [fbFamilies, setFbFamilies] = useState<Family[]>([]);
  const [fbMultipliers, setFbMultipliers] = useState<Multiplier[]>([]);
  const [fbActivities, setFbActivities] = useState<Activity[]>([]);
  const [fbDocuments, setFbDocuments] = useState<ReportDocument[]>([]);

  // Shared Demo store state (used when authMode === 'demo')
  const [demoStore, setDemoStore] = useState<DemoStoreState>(() => loadDemoStore());

  const handleDemoChange = (updater: (prev: DemoStoreState) => DemoStoreState) => {
    setDemoStore((prev) => {
      const next = updater(prev);
      saveDemoStore(next);
      return next;
    });
  };

  // Sync demo store changes across browser tabs in real time
  useEffect(() => {
    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === 'andmoz_nutrifamily_demo_store_v3') {
        setDemoStore(loadDemoStore());
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Listen to Firebase Auth state (for Google Sign-In or Email/Password when enabled in Firebase Console)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || 'utilizador@andmoz.org.mz';
        const role = resolveRoleFromEmail(email);
        setSessionUser({
          uid: firebaseUser.uid,
          displayName:
            firebaseUser.displayName ||
            (role === 'administrador' ? 'Administrador ANDMoz' : 'Gestor de Projectos'),
          email,
          role,
          authMode: 'firebase',
          photoURL: firebaseUser.photoURL,
        });
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore real-time listeners when authenticated with Firebase
  useEffect(() => {
    if (!sessionUser || sessionUser.authMode !== 'firebase') {
      return;
    }

    let cancelled = false;
    let unsubGoals: (() => void) | undefined;
    let unsubFamilies: (() => void) | undefined;
    let unsubMultipliers: (() => void) | undefined;
    let unsubActivities: (() => void) | undefined;
    let unsubDocuments: (() => void) | undefined;

    const initFirebaseListeners = async () => {
      setDataLoading(true);
      try {
        await seedWorkspaceIfNeeded(sessionUser.uid, sessionUser.displayName);
      } catch (error) {
        if (!cancelled) {
          setAuthError(
            error instanceof Error
              ? error.message
              : 'Não foi possível preparar os dados iniciais.'
          );
        }
      }

      if (cancelled) return;

      unsubGoals = onSnapshot(
        query(collection(db, 'goals'), where('ownerId', '==', sessionUser.uid)),
        (snap) => {
          setFbGoals(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Goal, 'id'>) })));
          setDataLoading(false);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'goals')
      );

      unsubFamilies = onSnapshot(
        query(collection(db, 'families'), where('ownerId', '==', sessionUser.uid)),
        (snap) => {
          setFbFamilies(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Family, 'id'>) }))
          );
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'families')
      );

      unsubMultipliers = onSnapshot(
        query(collection(db, 'multipliers'), where('ownerId', '==', sessionUser.uid)),
        (snap) => {
          setFbMultipliers(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Multiplier, 'id'>) }))
          );
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'multipliers')
      );

      unsubActivities = onSnapshot(
        query(collection(db, 'activities'), where('ownerId', '==', sessionUser.uid)),
        (snap) => {
          setFbActivities(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Activity, 'id'>) }))
          );
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'activities')
      );

      unsubDocuments = onSnapshot(
        query(collection(db, 'documents'), where('ownerId', '==', sessionUser.uid)),
        (snap) => {
          setFbDocuments(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ReportDocument, 'id'>),
            }))
          );
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'documents')
      );
    };

    void initFirebaseListeners();

    return () => {
      cancelled = true;
      unsubGoals?.();
      unsubFamilies?.();
      unsubMultipliers?.();
      unsubActivities?.();
      unsubDocuments?.();
    };
  }, [sessionUser]);

  // Ensure Gestor can only access the 3 operational registration & submission sections
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

  const startDemoSession = (role: UserRole, customEmail?: string) => {
    const demoUser: AppSessionUser =
      role === 'administrador'
        ? {
            uid: 'demo_admin',
            displayName: 'Faduko Oliveira (Coordenação)',
            email: customEmail || 'admin@andmoz.org.mz',
            role: 'administrador',
            authMode: 'demo',
          }
        : {
            uid: 'demo_gestor',
            displayName: 'Carlos Machava (Campo)',
            email: customEmail || 'gestor@andmoz.org.mz',
            role: 'gestor',
            authMode: 'demo',
          };

    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
    } catch {
      // ignore
    }
    setDemoStore(loadDemoStore());
    setSessionUser(demoUser);
    setActiveSection(role === 'administrador' ? 'dashboard' : 'families');
  };

  const handleDemoLogin = async (role: UserRole) => {
    setIsSigningIn(true);
    setAuthError(null);
    const email = role === 'administrador' ? 'admin@andmoz.org.mz' : 'gestor@andmoz.org.mz';

    try {
      // Attempt Firebase Email/Password auth first if enabled in Firebase Console
      try {
        await signInWithEmailAndPassword(auth, email, DEMO_PASS);
        setActiveSection(role === 'administrador' ? 'dashboard' : 'families');
        return;
      } catch (err) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, DEMO_PASS);
            await updateProfile(cred.user, {
              displayName:
                role === 'administrador'
                  ? 'Faduko Oliveira (Coordenação)'
                  : 'Carlos Machava (Campo)',
            });
            setActiveSection(role === 'administrador' ? 'dashboard' : 'families');
            return;
          } catch {
            // Fall through to local demo workspace if email/password provider is not yet enabled
          }
        }
      }

      startDemoSession(role, email);
    } finally {
      setIsSigningIn(false);
    }
  };

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
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      setActiveSection(
        resolveRoleFromEmail(cleanEmail) === 'administrador' ? 'dashboard' : 'families'
      );
      return;
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/wrong-password') {
        setAuthError('Palavra-passe incorrecta. Tente novamente.');
        setIsSigningIn(false);
        return;
      }

      // Check demo credentials cleanly when Firebase Email/Password provider is disabled
      if (
        (cleanEmail === 'admin@andmoz.org.mz' || cleanEmail === 'gestor@andmoz.org.mz') &&
        password !== DEMO_PASS
      ) {
        setAuthError(
          `Palavra-passe incorrecta para conta de demonstração. Utilize "${DEMO_PASS}" ou os botões rápidos.`
        );
        setIsSigningIn(false);
        return;
      }

      if (code === 'auth/operation-not-allowed' || password === DEMO_PASS) {
        startDemoSession(resolveRoleFromEmail(cleanEmail), cleanEmail);
        setIsSigningIn(false);
        return;
      }

      setAuthError(
        'Não foi possível validar as credenciais. Para demonstração imediata utilize os botões rápidos abaixo.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || '';
      setActiveSection(
        resolveRoleFromEmail(email) === 'administrador' ? 'dashboard' : 'families'
      );
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? `Erro no acesso Google: ${error.message}`
          : 'Não foi possível iniciar sessão com a conta Google.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      // ignore
    }
    if (auth.currentUser) {
      await signOut(auth);
    }
    setSessionUser(null);
    setActiveSection('dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-9 h-9 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">A carregar Plataforma NutriFamily +...</p>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <LoginScreen
        onEmailPasswordLogin={handleEmailPasswordLogin}
        onDemoLogin={handleDemoLogin}
        onGoogleLogin={handleGoogleLogin}
        errorMessage={authError}
        isSigningIn={isSigningIn}
      />
    );
  }

  const goals = sessionUser.authMode === 'firebase' ? fbGoals : demoStore.goals;
  const families = sessionUser.authMode === 'firebase' ? fbFamilies : demoStore.families;
  const multipliers =
    sessionUser.authMode === 'firebase' ? fbMultipliers : demoStore.multipliers;
  const activities =
    sessionUser.authMode === 'firebase' ? fbActivities : demoStore.activities;
  const documents = sessionUser.authMode === 'firebase' ? fbDocuments : demoStore.documents;

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
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {sessionUser.authMode === 'firebase' && dataLoading && goals.length === 0 ? (
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
              onDemoChange={handleDemoChange}
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
                  onDemoChange={handleDemoChange}
                />
              )}
              {activeSection === 'families' && (
                <FamiliesView
                  user={sessionUser}
                  families={families}
                  multipliers={multipliers}
                  onDemoChange={handleDemoChange}
                />
              )}
              {activeSection === 'multipliers' && (
                <MultipliersView
                  user={sessionUser}
                  multipliers={multipliers}
                  onDemoChange={handleDemoChange}
                />
              )}
              {activeSection === 'activities' && (
                <ActivitiesView
                  user={sessionUser}
                  activities={activities}
                  multipliers={multipliers}
                  onDemoChange={handleDemoChange}
                />
              )}
              {activeSection === 'documents' && (
                <DocumentsView
                  user={sessionUser}
                  documents={documents}
                  onDemoChange={handleDemoChange}
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
                  onDemoChange={handleDemoChange}
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
          onRestoreDemoData={() => resetWorkspaceToSeed(sessionUser, handleDemoChange)}
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
