import { useState } from 'react';
import { CheckCircle2, Database, RotateCcw, Settings, X } from 'lucide-react';
import type { AppSessionUser } from '../types';

interface AdminSettingsModalProps {
  open: boolean;
  user: AppSessionUser;
  familiesCount: number;
  multipliersCount: number;
  documentsCount: number;
  onClose: () => void;
  onRestoreDemoData: () => Promise<void>;
}

export function AdminSettingsModal({
  open,
  user,
  familiesCount,
  multipliersCount,
  documentsCount,
  onClose,
  onRestoreDemoData,
}: AdminSettingsModalProps) {
  const [confirmStep, setConfirmStep] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoredMessage, setRestoredMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirmRestore = async () => {
    setRestoring(true);
    setErrorMsg(null);
    try {
      await onRestoreDemoData();
      setConfirmStep(false);
      setRestoredMessage(
        'Dados iniciais de demonstração do projecto NutriFamily + restaurados com sucesso.'
      );
      window.setTimeout(() => setRestoredMessage(null), 5000);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível restaurar os dados iniciais.'
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-settings-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4EB] text-[#2E7D32] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 id="admin-settings-title" className="text-base font-semibold text-slate-900">
                Configurações da Plataforma (Administrador)
              </h3>
              <p className="text-xs text-slate-500">
                ANDMoz M&amp;A — NutriFamily + · Quelimane, Zambézia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmStep(false);
              onClose();
            }}
            aria-label="Fechar configurações"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-[#F8FAF9] space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Database className="w-4 h-4 text-[#2E7D32]" />
            <span>Estado da Persistência de Dados</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {user.authMode === 'firebase'
              ? 'Sincronização activa com Firebase Firestore e cópia local de demonstração em localStorage.'
              : 'Persistência local activa em localStorage do navegador entre recarregamentos da página.'}
          </p>
          <p className="text-slate-500 font-mono-num pt-1">
            Registos actuais: {familiesCount} famílias · {multipliersCount} multiplicadores ·{' '}
            {documentsCount} documentos
          </p>
        </div>

        {restoredMessage && (
          <div className="p-3 rounded-lg bg-[#EAF4EB] border border-[#C8E6C9] text-xs font-medium text-[#2E7D32] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{restoredMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-800">
              Reposição de Dados de Demonstração
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Repõe as famílias, multiplicadores, metas, actividades e documentos iniciais de
              Quelimane, substituindo edições e novos cadastros de teste.
            </p>
          </div>

          {!confirmStep ? (
            <button
              type="button"
              onClick={() => setConfirmStep(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Dados Iniciais de Demonstração</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 space-y-3">
              <p className="text-xs text-amber-900 font-medium">
                Confirma que pretende restaurar os dados iniciais de demonstração? Os registos de
                teste adicionados serão substituídos pelo conjunto padrão de Quelimane.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() => void handleConfirmRestore()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  {restoring ? 'A restaurar...' : 'Confirmar Restauro'}
                </button>
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() => setConfirmStep(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => {
              setConfirmStep(false);
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
