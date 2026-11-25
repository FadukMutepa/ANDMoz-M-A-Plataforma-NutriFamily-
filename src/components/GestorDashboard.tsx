import type { DemoStoreState } from '../dataStore';
import type { AppSessionUser, Family, Multiplier, ReportDocument } from '../types';
import { DocumentsView } from './DocumentsView';
import { FamiliesView } from './FamiliesView';
import { MultipliersView } from './MultipliersView';
import type { NavSection } from './Sidebar';

interface GestorDashboardProps {
  user: AppSessionUser;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  families: Family[];
  multipliers: Multiplier[];
  documents: ReportDocument[];
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void;
}

export function GestorDashboard({
  user,
  activeSection,
  onSelectSection,
  families,
  multipliers,
  documents,
  onDemoChange,
}: GestorDashboardProps) {
  const currentTab: 'families' | 'multipliers' | 'documents' =
    activeSection === 'multipliers' || activeSection === 'documents'
      ? activeSection
      : 'families';

  return (
    <div className="space-y-6">
      <nav
        aria-label="Secções do Gestor de Projectos"
        className="bg-white border border-slate-200 rounded-xl p-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5"
      >
        {(
          [
            {
              id: 'families',
              label: `1. Cadastro de Famílias Beneficiárias (${families.length})`,
            },
            {
              id: 'multipliers',
              label: `2. Dados dos Multiplicadores (${multipliers.length})`,
            },
            {
              id: 'documents',
              label: `3. Relatórios e Documentos (${documents.length})`,
            },
          ] as const
        ).map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectSection(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap text-left sm:text-center cursor-pointer ${
                isActive
                  ? 'bg-[#2E7D32] text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {currentTab === 'families' && (
        <FamiliesView
          user={user}
          families={families}
          multipliers={multipliers}
          onDemoChange={onDemoChange}
        />
      )}

      {currentTab === 'multipliers' && (
        <MultipliersView
          user={user}
          multipliers={multipliers}
          onDemoChange={onDemoChange}
        />
      )}

      {currentTab === 'documents' && (
        <DocumentsView
          user={user}
          documents={documents}
          onDemoChange={onDemoChange}
        />
      )}
    </div>
  );
}
