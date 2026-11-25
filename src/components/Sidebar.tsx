import { useState } from 'react';
import {
  BarChart3,
  ClipboardList,
  Edit3,
  FileText,
  Home,
  Settings,
  Sprout,
  Target,
  Users,
  X,
} from 'lucide-react';
import type { UserRole } from '../types';

export type NavSection =
  | 'dashboard'
  | 'goals'
  | 'families'
  | 'multipliers'
  | 'activities'
  | 'documents'
  | 'admin_editor';

interface SidebarProps {
  role: UserRole;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings?: () => void;
}

const GESTOR_NAV_ITEMS: { id: NavSection; label: string; icon: typeof Home }[] = [
  { id: 'families', label: '1. Famílias Beneficiárias', icon: Home },
  { id: 'multipliers', label: '2. Multiplicadores', icon: Users },
  { id: 'documents', label: '3. Relatórios e Documentos', icon: FileText },
];

const ADMIN_NAV_ITEMS: { id: NavSection; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: '1. Dashboard Executivo', icon: BarChart3 },
  { id: 'documents', label: '2. Central de Documentos', icon: FileText },
  { id: 'admin_editor', label: '3. Visão Geral e Edição', icon: Edit3 },
  { id: 'goals', label: 'Metas (12 Meses)', icon: Target },
  { id: 'families', label: 'Famílias Beneficiárias', icon: Home },
  { id: 'multipliers', label: 'Multiplicadores', icon: Users },
  { id: 'activities', label: 'Actividades de Campo', icon: ClipboardList },
];

export function Sidebar({
  role,
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  onOpenSettings,
}: SidebarProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const items = role === 'administrador' ? ADMIN_NAV_ITEMS : GESTOR_NAV_ITEMS;

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-[260px]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {!logoFailed ? (
            <img
              src="/src/assets/images/andmoz_brand_mark_1795644743489.jpg"
              alt="ANDMoz"
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#2E7D32] flex items-center justify-center text-white shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <span className="block text-sm font-bold text-slate-900 truncate">
              ANDMoz M&amp;A
            </span>
            <span className="block text-[11px] text-slate-500 truncate">
              NutriFamily +
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fechar menu"
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {role === 'administrador' ? 'Painel do Administrador' : 'Secções de Registo'}
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2E7D32] ${
                isActive
                  ? 'bg-[#EAF4EB] text-[#2E7D32]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#2E7D32]' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-[#F8FAF9] space-y-2.5">
        <div>
          <p className="text-xs font-semibold text-slate-800">
            {role === 'administrador' ? 'Perfil Administrador' : 'Perfil Gestor de Projectos'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {role === 'administrador'
              ? 'Acesso completo: visão executiva, edição de dados e exportação PDF.'
              : 'Perfil operacional: cadastro e envio de documentos (sem edição global ou exclusão).'}
          </p>
        </div>

        {role === 'administrador' && onOpenSettings && (
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Configurações e Dados</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{navContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full">{navContent}</aside>
        </div>
      )}
    </>
  );
}
