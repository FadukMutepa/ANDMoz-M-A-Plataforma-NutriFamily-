import { FileDown, LogOut, Menu } from 'lucide-react';
import type { AppSessionUser } from '../types';
import type { NavSection } from './Sidebar';

interface HeaderProps {
  user: AppSessionUser;
  activeSection: NavSection;
  onOpenMobileMenu: () => void;
  onExportPdf?: () => void;
  onSignOut: () => Promise<void>;
}

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard Executivo e Gráficos',
  goals: 'Metas e Indicadores (12 Meses)',
  families: 'Cadastro de Famílias Beneficiárias',
  multipliers: 'Dados dos Multiplicadores Comunitários',
  activities: 'Actividades de Campo',
  documents: 'Central de Relatórios e Documentos',
  admin_editor: 'Visão Geral e Espaço de Edição',
};

export function Header({
  user,
  activeSection,
  onOpenMobileMenu,
  onExportPdf,
  onSignOut,
}: HeaderProps) {
  const initials = user.displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const roleLabel =
    user.role === 'administrador' ? 'Administrador' : 'Gestor de Projectos';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu de navegação"
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 whitespace-nowrap shrink-0">
            NutriFamily +
          </span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">
            /
          </span>
          <h1 className="font-semibold text-slate-900 truncate">
            {activeSection === 'dashboard' && user.role === 'gestor'
              ? 'Painel Operacional'
              : SECTION_TITLES[activeSection]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {user.role === 'administrador' && onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2E7D32] hover:bg-[#256628] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Baixar Relatório em PDF</span>
          </button>
        )}

        <div className="flex items-center gap-2.5 min-w-0 pl-1">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#EAF4EB] text-[#2E7D32] text-xs font-semibold flex items-center justify-center border border-[#C8E6C9] shrink-0">
              {initials || 'AM'}
            </div>
          )}
          <div className="hidden md:block text-right min-w-0">
            <span className="block text-xs font-semibold text-slate-900 truncate max-w-[170px]">
              {user.displayName}
            </span>
            <span className="block text-[11px] text-slate-500 truncate max-w-[190px]">
              {roleLabel} · {user.email}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onSignOut()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Terminar Sessão</span>
        </button>
      </div>
    </header>
  );
}
