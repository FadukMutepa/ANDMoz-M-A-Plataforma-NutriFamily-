import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  removeActivityRecord,
  saveActivityRecord,
  type DemoStoreState,
} from '../dataStore';
import {
  ACTIVITY_CATEGORIES,
  clampText,
  DATE_REGEX,
  PROJECT_MONTHS,
  QUELIMANE_COMMUNITIES,
  type Activity,
  type ActivityCategory,
  type ActivityStatus,
  type AppSessionUser,
  type Multiplier,
} from '../types';
import { downloadCsv } from '../utils/csvExport';

interface ActivitiesViewProps {
  user: AppSessionUser;
  activities: Activity[];
  multipliers: Multiplier[];
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void;
}

interface ActivityFormState {
  title: string;
  category: ActivityCategory;
  community: string;
  activityDate: string;
  projectMonth: number;
  multiplierName: string;
  womenCount: number;
  menCount: number;
  childrenCount: number;
  summary: string;
  status: ActivityStatus;
}

export function ActivitiesView({
  user,
  activities,
  multipliers,
  onDemoChange,
}: ActivitiesViewProps) {
  const isAdmin = user.role === 'administrador';

  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultMultiplier = multipliers[0]?.fullName || 'Rosa da Conceição Mabunda';

  const [form, setForm] = useState<ActivityFormState>({
    title: '',
    category: ACTIVITY_CATEGORIES[0],
    community: QUELIMANE_COMMUNITIES[0],
    activityDate: '2026-11-25',
    projectMonth: 11,
    multiplierName: defaultMultiplier,
    womenCount: 30,
    menCount: 10,
    childrenCount: 20,
    summary: '',
    status: 'Submetido',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities
      .filter((a) => {
        if (monthFilter !== 'Todos' && a.projectMonth !== Number(monthFilter)) return false;
        if (categoryFilter !== 'Todas' && a.category !== categoryFilter) return false;
        if (statusFilter !== 'Todos' && a.status !== statusFilter) return false;
        if (
          q &&
          !a.title.toLowerCase().includes(q) &&
          !a.community.toLowerCase().includes(q) &&
          !a.multiplierName.toLowerCase().includes(q) &&
          !a.summary.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.activityDate.localeCompare(a.activityDate));
  }, [activities, categoryFilter, monthFilter, search, statusFilter]);

  const openCreateModal = () => {
    setEditingActivity(null);
    setForm({
      title: '',
      category: ACTIVITY_CATEGORIES[0],
      community: QUELIMANE_COMMUNITIES[0],
      activityDate: new Date().toISOString().slice(0, 10),
      projectMonth: 11,
      multiplierName: multipliers[0]?.fullName || 'Rosa da Conceição Mabunda',
      womenCount: 25,
      menCount: 8,
      childrenCount: 18,
      summary: '',
      status: 'Submetido',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    if (!isAdmin) return;
    setEditingActivity(act);
    setForm({
      title: act.title,
      category: act.category,
      community: act.community,
      activityDate: act.activityDate,
      projectMonth: act.projectMonth,
      multiplierName: act.multiplierName,
      womenCount: act.womenCount,
      menCount: act.menCount,
      childrenCount: act.childrenCount,
      summary: act.summary,
      status: act.status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingActivity && !isAdmin) return;
    if (form.title.trim().length < 3) {
      setFormError('Indique o título da actividade realizada.');
      return;
    }
    if (form.summary.trim().length < 3) {
      setFormError('Escreva um resumo dos resultados alcançados no terreno.');
      return;
    }
    if (!DATE_REGEX.test(form.activityDate)) {
      setFormError('Data inválida. Utilize o formato AAAA-MM-DD.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await saveActivityRecord(
        user,
        {
          title: clampText(form.title, 3, 160, 'Actividade NutriFamily +'),
          category: form.category,
          community: clampText(form.community, 2, 80, 'Chuabo Dembe'),
          activityDate: form.activityDate,
          projectMonth: Math.min(12, Math.max(1, Math.round(Number(form.projectMonth)))),
          multiplierName: clampText(form.multiplierName, 2, 120, defaultMultiplier),
          womenCount: Math.min(5000, Math.max(0, Math.round(Number(form.womenCount)))),
          menCount: Math.min(5000, Math.max(0, Math.round(Number(form.menCount)))),
          childrenCount: Math.min(5000, Math.max(0, Math.round(Number(form.childrenCount)))),
          summary: clampText(form.summary, 3, 600, 'Actividade realizada com sucesso.'),
          status: isAdmin ? form.status : 'Submetido',
        },
        editingActivity?.id || null,
        onDemoChange
      );
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleValidateQuick = async (act: Activity) => {
    if (!isAdmin) return;
    await saveActivityRecord(
      user,
      {
        title: act.title,
        category: act.category,
        community: act.community,
        activityDate: act.activityDate,
        projectMonth: act.projectMonth,
        multiplierName: act.multiplierName,
        womenCount: act.womenCount,
        menCount: act.menCount,
        childrenCount: act.childrenCount,
        summary: act.summary,
        status: 'Validado',
      },
      act.id,
      onDemoChange
    );
  };

  const handleDelete = async () => {
    if (!deletingActivity || !isAdmin) return;
    await removeActivityRecord(user, deletingActivity.id, onDemoChange);
    setDeletingActivity(null);
  };

  const handleExport = () => {
    downloadCsv(
      'andmoz_nutrifamily_actividades.csv',
      [
        'Data',
        'Mês Projecto',
        'Título',
        'Categoria',
        'Comunidade',
        'Multiplicador',
        'Mulheres',
        'Homens',
        'Crianças',
        'Total Participantes',
        'Estado',
        'Resumo',
      ],
      filtered.map((a) => [
        a.activityDate,
        `Mês ${a.projectMonth}`,
        a.title,
        a.category,
        a.community,
        a.multiplierName,
        a.womenCount,
        a.menCount,
        a.childrenCount,
        a.womenCount + a.menCount + a.childrenCount,
        a.status,
        a.summary,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Relatórios de Actividades de Campo
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isAdmin
              ? 'Registo mensal, validação técnica e exportação de sessões comunitárias'
              : 'Submeta relatórios de sessões comunitárias para validação da Administração'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin && (
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar CSV</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Actividade</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar actividade ou bairro..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Filtrar por mês"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#2E7D32]"
          >
            <option value="Todos">Todos os 12 meses</option>
            {PROJECT_MONTHS.map((m) => (
              <option key={m.month} value={String(m.month)}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoria"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#2E7D32]"
          >
            <option value="Todas">Todas as categorias</option>
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {['Todos', 'Planeado', 'Submetido', 'Validado'].map((st) => (
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

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-slate-800">
            Nenhuma actividade registada para estes critérios.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-lg hover:bg-[#256628] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Primeira Actividade</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAF9] text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Data / Mês</th>
                  <th className="py-3 px-4 min-w-[260px]">Actividade &amp; Resumo</th>
                  <th className="py-3 px-4 whitespace-nowrap">Comunidade</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Participantes (M/H/C)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Estado</th>
                  {isAdmin && (
                    <th className="py-3 px-4 text-right whitespace-nowrap">Acções</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((act) => {
                  const total = act.womenCount + act.menCount + act.childrenCount;
                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <span className="block font-mono-num text-xs font-semibold text-slate-800">
                          {act.activityDate}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-mono-num">
                          Mês {act.projectMonth} de 12
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-medium text-slate-900 leading-snug">
                          {act.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {act.category} · {act.multiplierName}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {act.summary}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap align-top">
                        {act.community}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num text-xs whitespace-nowrap align-top">
                        <span className="font-semibold text-slate-900 block">
                          {total} total
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {act.womenCount}M / {act.menCount}H / {act.childrenCount}C
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        {act.status === 'Validado' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2E7D32]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Validado
                          </span>
                        ) : act.status === 'Submetido' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            Submetido
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500">Planeado</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                          <div className="inline-flex items-center gap-1.5">
                            {act.status !== 'Validado' && (
                              <button
                                type="button"
                                onClick={() => void handleValidateQuick(act)}
                                className="px-2.5 py-1 text-[11px] font-medium text-[#2E7D32] bg-[#EAF4EB] hover:bg-[#DCEEE0] rounded-md cursor-pointer"
                              >
                                Validar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditModal(act)}
                              aria-label={`Editar ${act.title}`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-[#2E7D32] hover:bg-[#EAF4EB] cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingActivity(act)}
                              aria-label={`Remover ${act.title}`}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-slate-900">
                {editingActivity ? 'Editar Relatório de Actividade' : 'Registar Actividade de Campo'}
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Título da Actividade
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex.: Demonstração culinária com moringa em Coalane"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as ActivityCategory })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                  >
                    {ACTIVITY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Comunidade / Bairro
                  </label>
                  <select
                    value={form.community}
                    onChange={(e) => setForm({ ...form, community: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                  >
                    {QUELIMANE_COMMUNITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={form.activityDate}
                    onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mês Projecto
                  </label>
                  <select
                    value={form.projectMonth}
                    onChange={(e) => setForm({ ...form, projectMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                  >
                    {PROJECT_MONTHS.map((m) => (
                      <option key={m.month} value={m.month}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                  {isAdmin ? (
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as ActivityStatus })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                    >
                      <option value="Planeado">Planeado</option>
                      <option value="Submetido">Submetido</option>
                      <option value="Validado">Validado</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value="Submetido"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Multiplicador Responsável
                </label>
                <select
                  value={form.multiplierName}
                  onChange={(e) => setForm({ ...form, multiplierName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  {multipliers.length > 0 ? (
                    multipliers.map((m) => (
                      <option key={m.id} value={m.fullName}>
                        {m.fullName}
                      </option>
                    ))
                  ) : (
                    <option value={defaultMultiplier}>{defaultMultiplier}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mulheres</label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    required
                    value={form.womenCount}
                    onChange={(e) => setForm({ ...form, womenCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Homens</label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    required
                    value={form.menCount}
                    onChange={(e) => setForm({ ...form, menCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Crianças</label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    required
                    value={form.childrenCount}
                    onChange={(e) => setForm({ ...form, childrenCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resumo e Evidências de Campo
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={600}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Principais resultados, encaminhamentos ou lições aprendidas..."
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
                  {saving ? 'A guardar...' : 'Submeter Actividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation (Admin Only) */}
      {deletingActivity && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Confirmar Remoção de Relatório
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem a certeza que pretende remover o relatório{' '}
              <span className="font-semibold text-slate-900">{deletingActivity.title}</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingActivity(null)}
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
