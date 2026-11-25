import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileDown,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { removeGoalRecord, saveGoalRecord, type DemoStoreState } from '../dataStore';
import {
  clampText,
  GOAL_PILLARS,
  PROJECT_MONTHS,
  sanitizeCode,
  type AppSessionUser,
  type Goal,
  type GoalPillar,
  type GoalStatus,
} from '../types';
import { downloadCsv } from '../utils/csvExport';

interface GoalsViewProps {
  user: AppSessionUser;
  goals: Goal[];
  onExportPdf: () => void;
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void;
}

interface GoalFormState {
  code: string;
  title: string;
  pillar: GoalPillar;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetMonth: number;
  status: GoalStatus;
  notes: string;
}

const DEFAULT_FORM: GoalFormState = {
  code: 'NF-M09',
  title: '',
  pillar: 'Nutrição Materno-Infantil',
  targetValue: 100,
  currentValue: 0,
  unit: 'famílias',
  targetMonth: 12,
  status: 'No Prazo',
  notes: '',
};

export function GoalsView({ user, goals, onExportPdf, onDemoChange }: GoalsViewProps) {
  const isAdmin = user.role === 'administrador';

  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  const filteredGoals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return goals
      .filter((g) => {
        if (pillarFilter !== 'Todos' && g.pillar !== pillarFilter) return false;
        if (statusFilter !== 'Todos' && g.status !== statusFilter) return false;
        if (
          q &&
          !g.title.toLowerCase().includes(q) &&
          !g.code.toLowerCase().includes(q) &&
          !g.pillar.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [goals, pillarFilter, search, statusFilter]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setForm({
      ...DEFAULT_FORM,
      code: `NF-M${String(goals.length + 1).padStart(2, '0')}`,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      code: goal.code,
      title: goal.title,
      pillar: goal.pillar,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      targetMonth: goal.targetMonth,
      status: goal.status,
      notes: goal.notes,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (form.title.trim().length < 3) {
      setFormError('O título do indicador deve ter pelo menos 3 caracteres.');
      return;
    }
    if (form.targetValue <= 0) {
      setFormError('A meta planeada deve ser superior a zero.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await saveGoalRecord(
        user,
        {
          code: sanitizeCode(form.code, 'NF'),
          title: clampText(form.title, 3, 160, 'Indicador NutriFamily +'),
          pillar: form.pillar,
          targetValue: Math.min(1000000, Math.max(1, Number(form.targetValue))),
          currentValue: Math.min(1000000, Math.max(0, Number(form.currentValue))),
          unit: clampText(form.unit, 1, 40, 'unidades'),
          targetMonth: Math.min(12, Math.max(1, Math.round(Number(form.targetMonth)))),
          status: form.status,
          notes: form.notes.trim().slice(0, 400),
        },
        editingGoal?.id || null,
        onDemoChange
      );
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGoal || !isAdmin) return;
    await removeGoalRecord(user, deletingGoal.id, onDemoChange);
    setDeletingGoal(null);
  };

  const handleExport = () => {
    downloadCsv(
      'andmoz_nutrifamily_metas_12m.csv',
      ['Código', 'Indicador', 'Pilar', 'Realizado', 'Meta', 'Unidade', 'Alcance (%)', 'Mês-Alvo', 'Estado', 'Notas'],
      filteredGoals.map((g) => [
        g.code,
        g.title,
        g.pillar,
        g.currentValue,
        g.targetValue,
        g.unit,
        `${Math.round((g.currentValue / g.targetValue) * 100)}%`,
        `Mês ${g.targetMonth}`,
        g.status,
        g.notes,
      ])
    );
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-lg mx-auto my-8">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-slate-900">
          Acesso Restrito ao Administrador
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          O perfil Gestor de Projectos não possui permissão para consultar ou alterar metas globais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Quadro Lógico de Metas (12 Meses)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Monitoria dos indicadores de resultado do projecto NutriFamily + em Quelimane
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#2E7D32]" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por código ou indicador..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value)}
            aria-label="Filtrar por pilar"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#2E7D32]"
          >
            <option value="Todos">Todos os pilares</option>
            {GOAL_PILLARS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {['Todos', 'No Prazo', 'Em Risco', 'Concluída'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Goals Table */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-slate-800">
            Nenhuma meta encontrada para os filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-lg hover:bg-[#256628] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Primeira Meta</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAF9] text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Código</th>
                  <th className="py-3 px-4 min-w-[240px]">Indicador &amp; Pilar</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Realizado / Meta</th>
                  <th className="py-3 px-4 min-w-[160px]">Progresso</th>
                  <th className="py-3 px-4 whitespace-nowrap">Prazo</th>
                  <th className="py-3 px-4 whitespace-nowrap">Estado</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredGoals.map((goal) => {
                  const pct = Math.min(
                    100,
                    Math.round((goal.currentValue / goal.targetValue) * 100)
                  );
                  return (
                    <tr key={goal.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono-num text-xs font-semibold text-slate-700 whitespace-nowrap align-top">
                        {goal.code}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-medium text-slate-900 leading-snug">
                          {goal.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {goal.pillar}
                          {goal.notes ? ` · ${goal.notes}` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num text-xs whitespace-nowrap align-top">
                        <span className="font-semibold text-slate-900">
                          {goal.currentValue}
                        </span>
                        <span className="text-slate-400">
                          {' '}
                          / {goal.targetValue} {goal.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                goal.status === 'Em Risco'
                                  ? 'bg-[#D97706]'
                                  : goal.status === 'Concluída'
                                  ? 'bg-[#2E7D32]'
                                  : 'bg-[#4CAF50]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono-num font-semibold text-slate-700 w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-mono-num whitespace-nowrap align-top">
                        Mês {goal.targetMonth}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        {goal.status === 'Concluída' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2E7D32]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Concluída
                          </span>
                        )}
                        {goal.status === 'No Prazo' && (
                          <span className="text-xs font-medium text-slate-700">
                            No Prazo
                          </span>
                        )}
                        {goal.status === 'Em Risco' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Em Risco
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(goal)}
                            aria-label={`Editar ${goal.code}`}
                            className="p-1.5 rounded-md text-slate-500 hover:text-[#2E7D32] hover:bg-[#EAF4EB] cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingGoal(goal)}
                            aria-label={`Remover ${goal.code}`}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingGoal ? `Actualizar Meta (${editingGoal.code})` : 'Registar Nova Meta (12 Meses)'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    maxLength={24}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pilar Estratégico
                  </label>
                  <select
                    value={form.pillar}
                    onChange={(e) => setForm({ ...form, pillar: e.target.value as GoalPillar })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                  >
                    {GOAL_PILLARS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descrição do Indicador
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Realizado</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={form.currentValue}
                    onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Meta 12M</label>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    required
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unidade</label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mês-Alvo</label>
                  <select
                    value={form.targetMonth}
                    onChange={(e) => setForm({ ...form, targetMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                  >
                    {PROJECT_MONTHS.map((m) => (
                      <option key={m.month} value={m.month}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as GoalStatus })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  <option value="No Prazo">No Prazo</option>
                  <option value="Em Risco">Em Risco</option>
                  <option value="Concluída">Concluída</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações de Campo
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2E7D32] hover:bg-[#256628] disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  {saving ? 'A guardar...' : 'Guardar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingGoal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Confirmar Remoção de Meta
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem a certeza que pretende remover o indicador{' '}
              <span className="font-semibold text-slate-900">{deletingGoal.code}</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingGoal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
