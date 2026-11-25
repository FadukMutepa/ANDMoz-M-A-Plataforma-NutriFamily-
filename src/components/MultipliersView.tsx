import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Clock,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { removeMultiplierRecord, saveMultiplierRecord, type DemoStoreState } from '../dataStore';
import {
  clampText,
  MULTIPLIER_SPECIALTIES,
  NUTRIFAMILY_CLUBS,
  QUELIMANE_COMMUNITIES,
  sanitizeCode,
  type AppSessionUser,
  type ClubName,
  type Multiplier,
  type MultiplierSpecialty,
  type MultiplierStatus,
  type TrainingStatus,
} from '../types';
import { downloadCsv } from '../utils/csvExport';
import { exportMultipliersPdf } from '../utils/pdfExport';

interface MultipliersViewProps {
  user: AppSessionUser;
  multipliers: Multiplier[];
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void;
}

interface MultiplierFormState {
  code: string;
  fullName: string;
  phone: string;
  community: string;
  clubName: ClubName;
  specialty: MultiplierSpecialty;
  trainingStatus: TrainingStatus;
  homeVisitsCount: number;
  muacScreeningsCount: number;
  riskCasesReferred: number;
  familiesAssigned: number;
  sessionsHeld: number;
  notes: string;
}

export function MultipliersView({
  user,
  multipliers,
  onDemoChange,
}: MultipliersViewProps) {
  const isAdmin = user.role === 'administrador';

  const [search, setSearch] = useState('');
  const [communityFilter, setCommunityFilter] = useState('Todas');
  const [trainingFilter, setTrainingFilter] = useState('Todos');

  const [adminShowForm, setAdminShowForm] = useState(false);
  const [editingMultiplier, setEditingMultiplier] = useState<Multiplier | null>(null);
  const [deletingMultiplier, setDeletingMultiplier] = useState<Multiplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const buildInitialForm = (): MultiplierFormState => ({
    code: `MC-${String(multipliers.length + 1).padStart(3, '0')}`,
    fullName: '',
    phone: '+258 84 ',
    community: QUELIMANE_COMMUNITIES[0],
    clubName: 'Clube 1',
    specialty: 'Nutrição Materno-Infantil',
    trainingStatus: 'Certificado',
    homeVisitsCount: 12,
    muacScreeningsCount: 18,
    riskCasesReferred: 0,
    familiesAssigned: 20,
    sessionsHeld: 4,
    notes: '',
  });

  const [form, setForm] = useState<MultiplierFormState>(buildInitialForm);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return multipliers
      .filter((m) => {
        if (communityFilter !== 'Todas' && m.community !== communityFilter) return false;
        if (trainingFilter !== 'Todos' && m.trainingStatus !== trainingFilter) return false;
        if (
          q &&
          !m.fullName.toLowerCase().includes(q) &&
          !m.code.toLowerCase().includes(q) &&
          !m.community.toLowerCase().includes(q) &&
          !m.clubName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [communityFilter, multipliers, search, trainingFilter]);

  const totals = useMemo(() => {
    return {
      visits: filtered.reduce((acc, m) => acc + m.homeVisitsCount, 0),
      muac: filtered.reduce((acc, m) => acc + m.muacScreeningsCount, 0),
      risks: filtered.reduce((acc, m) => acc + m.riskCasesReferred, 0),
      certified: filtered.filter((m) => m.trainingStatus === 'Certificado').length,
    };
  }, [filtered]);

  const handleCreateInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) {
      setFormError('Indique o nome completo do multiplicador comunitário.');
      return;
    }
    if (form.phone.trim().length < 6) {
      setFormError('Indique um número de contacto telefónico válido.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const code = sanitizeCode(form.code, 'MC');
      const status: MultiplierStatus =
        form.trainingStatus === 'Certificado' ? 'Activo' : 'Em Formação';

      await saveMultiplierRecord(
        user,
        {
          code,
          fullName: clampText(form.fullName, 2, 120, 'Multiplicador Comunitário'),
          community: clampText(form.community, 2, 80, 'Chuabo Dembe'),
          clubName: form.clubName,
          specialty: form.specialty,
          phone: clampText(form.phone, 6, 30, '+258 84 000 0000'),
          trainingStatus: form.trainingStatus,
          homeVisitsCount: Math.min(5000, Math.max(0, Math.round(Number(form.homeVisitsCount) || 0))),
          muacScreeningsCount: Math.min(5000, Math.max(0, Math.round(Number(form.muacScreeningsCount) || 0))),
          riskCasesReferred: Math.min(1000, Math.max(0, Math.round(Number(form.riskCasesReferred) || 0))),
          familiesAssigned: Math.min(500, Math.max(0, Math.round(Number(form.familiesAssigned) || 20))),
          sessionsHeld: Math.min(1000, Math.max(0, Math.round(Number(form.sessionsHeld) || 1))),
          status,
          notes: form.notes.trim().slice(0, 400),
          adminValidated: isAdmin,
        },
        null,
        onDemoChange
      );

      setSuccessNotice(`Dados do multiplicador ${form.fullName.trim()} registados com sucesso.`);
      window.setTimeout(() => setSuccessNotice(null), 4000);
      setForm({
        ...buildInitialForm(),
        code: `MC-${String(multipliers.length + 2).padStart(3, '0')}`,
      });
      if (isAdmin) {
        setAdminShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMultiplier || !isAdmin) return;
    if (editingMultiplier.fullName.trim().length < 2) {
      setFormError('Indique o nome completo do multiplicador.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await saveMultiplierRecord(
        user,
        {
          code: sanitizeCode(editingMultiplier.code, 'MC'),
          fullName: clampText(editingMultiplier.fullName, 2, 120, 'Multiplicador'),
          community: clampText(editingMultiplier.community, 2, 80, 'Chuabo Dembe'),
          clubName: editingMultiplier.clubName,
          specialty: editingMultiplier.specialty,
          phone: clampText(editingMultiplier.phone, 6, 30, '+258 84 000 0000'),
          trainingStatus: editingMultiplier.trainingStatus,
          homeVisitsCount: Math.min(5000, Math.max(0, Math.round(Number(editingMultiplier.homeVisitsCount) || 0))),
          muacScreeningsCount: Math.min(5000, Math.max(0, Math.round(Number(editingMultiplier.muacScreeningsCount) || 0))),
          riskCasesReferred: Math.min(1000, Math.max(0, Math.round(Number(editingMultiplier.riskCasesReferred) || 0))),
          familiesAssigned: Math.min(500, Math.max(0, Math.round(Number(editingMultiplier.familiesAssigned) || 0))),
          sessionsHeld: Math.min(1000, Math.max(0, Math.round(Number(editingMultiplier.sessionsHeld) || 0))),
          status: editingMultiplier.status,
          notes: editingMultiplier.notes.trim().slice(0, 400),
          adminValidated: Boolean(editingMultiplier.adminValidated),
        },
        editingMultiplier.id,
        onDemoChange
      );
      setEditingMultiplier(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMultiplier || !isAdmin) return;
    await removeMultiplierRecord(user, deletingMultiplier.id, onDemoChange);
    setDeletingMultiplier(null);
  };

  const handleExportCsv = () => {
    downloadCsv(
      'andmoz_nutrifamily_multiplicadores.csv',
      [
        'Código',
        'Nome Completo',
        'Contacto',
        'Comunidade',
        'Clube',
        'Certificação',
        'Visitas Domiciliárias',
        'Triagens MUAC',
        'Casos Risco (US)',
        'Observações',
        'Validação',
      ],
      filtered.map((m) => [
        m.code,
        m.fullName,
        m.phone,
        m.community,
        m.clubName,
        m.trainingStatus,
        m.homeVisitsCount,
        m.muacScreeningsCount,
        m.riskCasesReferred,
        m.notes,
        m.adminValidated ? 'Validado pela Administração' : 'Pendente',
      ])
    );
  };

  const showInlineForm = !isAdmin || adminShowForm;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Registo de Dados dos Multiplicadores Comunitários
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isAdmin
              ? 'Activistas capacitados pela ANDMoz: visitas domiciliárias, triagens MUAC e encaminhamentos à Unidade Sanitária'
              : 'Insira os dados recolhidos dos multiplicadores comunitários nos Clubes NutriFamily'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => exportMultipliersPdf(user.displayName, filtered)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Baixar Lista PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminShowForm((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{adminShowForm ? 'Ocultar Formulário' : 'Novo Multiplicador'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Inline Registration Form */}
      {showInlineForm && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-[#F8FAF9] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Formulário de Dados de Multiplicador Comunitário
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registe certificação, visitas domiciliárias e triagens nutricionais com Fita MUAC
              </p>
            </div>
            <span className="text-xs font-medium text-[#2E7D32] whitespace-nowrap shrink-0">
              Secção 2 de 3
            </span>
          </div>

          <form onSubmit={(e) => void handleCreateInline(e)} className="p-6 space-y-5">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}
            {successNotice && (
              <div className="p-3 rounded-lg bg-[#EAF4EB] border border-[#C8E6C9] text-xs font-medium text-[#2E7D32] flex items-center gap-2">
                <Award className="w-4 h-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo do Multiplicador *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Ex.: Helena Joaquim Sitoe"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contacto Telefónico *
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+258 84 000 0000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Código Interno
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Comunidade de Actuação *
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Clube NutriFamily Vinculado *
                </label>
                <select
                  value={form.clubName}
                  onChange={(e) => setForm({ ...form, clubName: e.target.value as ClubName })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  {NUTRIFAMILY_CLUBS.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estado da Formação / Certificação *
                </label>
                <select
                  value={form.trainingStatus}
                  onChange={(e) =>
                    setForm({ ...form, trainingStatus: e.target.value as TrainingStatus })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  <option value="Certificado">Certificado</option>
                  <option value="Em formação">Em formação</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Área Focal
                </label>
                <select
                  value={form.specialty}
                  onChange={(e) =>
                    setForm({ ...form, specialty: e.target.value as MultiplierSpecialty })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  {MULTIPLIER_SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Visitas Domiciliárias Realizadas no Período *
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  required
                  value={form.homeVisitsCount}
                  onChange={(e) => setForm({ ...form, homeVisitsCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Triagens Nutricionais (Fita MUAC) Realizadas *
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  required
                  value={form.muacScreeningsCount}
                  onChange={(e) =>
                    setForm({ ...form, muacScreeningsCount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Casos de Risco Encaminhados à Unidade Sanitária *
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  required
                  value={form.riskCasesReferred}
                  onChange={(e) => setForm({ ...form, riskCasesReferred: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
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
                placeholder="Descreva o acompanhamento das famílias, retorno da Unidade Sanitária ou necessidades do clube..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2E7D32] hover:bg-[#256628] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{saving ? 'A guardar...' : 'Registar Dados do Multiplicador'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-xs text-slate-500 block">Multiplicadores Certificados</span>
          <span className="text-lg font-bold text-slate-900 font-mono-num">
            {totals.certified}
            <span className="text-xs font-normal text-slate-400">/{filtered.length}</span>
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-xs text-slate-500 block">Visitas Domiciliárias</span>
          <span className="text-lg font-bold text-slate-900 font-mono-num">
            {totals.visits}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-xs text-slate-500 block">Triagens Fita MUAC</span>
          <span className="text-lg font-bold text-slate-900 font-mono-num">
            {totals.muac}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-xs text-slate-500 block">Encaminhamentos à US</span>
          <span className="text-lg font-bold text-amber-700 font-mono-num">
            {totals.risks}
          </span>
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
              placeholder="Pesquisar multiplicador, clube ou comunidade..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
            />
          </div>
          <select
            value={communityFilter}
            onChange={(e) => setCommunityFilter(e.target.value)}
            aria-label="Filtrar por comunidade"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#2E7D32]"
          >
            <option value="Todas">Todas as comunidades</option>
            {QUELIMANE_COMMUNITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {['Todos', 'Certificado', 'Em formação'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setTrainingFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                trainingFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* List of Multipliers */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
          Nenhum multiplicador encontrado com os filtros actuais.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="min-w-0">
                    <span className="font-mono-num text-xs text-slate-500 block">
                      {m.code} · {m.community} · {m.clubName}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 truncate mt-0.5">
                      {m.fullName}
                    </h3>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setEditingMultiplier(m);
                        }}
                        aria-label={`Editar ${m.fullName}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-[#2E7D32] hover:bg-[#EAF4EB] cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingMultiplier(m)}
                        aria-label={`Remover ${m.fullName}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 text-xs mb-3">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 font-mono-num">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {m.phone}
                  </span>

                  {m.trainingStatus === 'Certificado' ? (
                    <span className="inline-flex items-center gap-1 font-medium text-[#2E7D32]">
                      <Award className="w-3.5 h-3.5" />
                      Certificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                      <Clock className="w-3.5 h-3.5" />
                      Em formação
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div>
                    <span className="block text-sm font-bold text-slate-900 font-mono-num">
                      {m.homeVisitsCount}
                    </span>
                    <span className="block text-[11px] text-slate-500">Visitas</span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 font-mono-num">
                      {m.muacScreeningsCount}
                    </span>
                    <span className="block text-[11px] text-slate-500">Fita MUAC</span>
                  </div>
                  <div>
                    <span
                      className={`block text-sm font-bold font-mono-num ${
                        m.riskCasesReferred > 0 ? 'text-amber-700' : 'text-slate-900'
                      }`}
                    >
                      {m.riskCasesReferred}
                    </span>
                    <span className="block text-[11px] text-slate-500">Risco US</span>
                  </div>
                </div>

                {m.notes && (
                  <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                    {m.notes}
                  </p>
                )}
              </div>

              {m.riskCasesReferred > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{m.riskCasesReferred} caso(s) encaminhado(s) à Unidade Sanitária</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal (Admin Only) */}
      {editingMultiplier && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-slate-900">
                Editar Multiplicador ({editingMultiplier.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingMultiplier(null)}
                aria-label="Fechar"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveEditModal(e)} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMultiplier.fullName}
                    onChange={(e) =>
                      setEditingMultiplier({ ...editingMultiplier, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contacto Telefónico
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMultiplier.phone}
                    onChange={(e) =>
                      setEditingMultiplier({ ...editingMultiplier, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Comunidade
                  </label>
                  <select
                    value={editingMultiplier.community}
                    onChange={(e) =>
                      setEditingMultiplier({ ...editingMultiplier, community: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {QUELIMANE_COMMUNITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Clube</label>
                  <select
                    value={editingMultiplier.clubName}
                    onChange={(e) =>
                      setEditingMultiplier({
                        ...editingMultiplier,
                        clubName: e.target.value as ClubName,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {NUTRIFAMILY_CLUBS.map((club) => (
                      <option key={club} value={club}>
                        {club}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Formação / Certificação
                  </label>
                  <select
                    value={editingMultiplier.trainingStatus}
                    onChange={(e) =>
                      setEditingMultiplier({
                        ...editingMultiplier,
                        trainingStatus: e.target.value as TrainingStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Certificado">Certificado</option>
                    <option value="Em formação">Em formação</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Visitas Domiciliárias
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingMultiplier.homeVisitsCount}
                    onChange={(e) =>
                      setEditingMultiplier({
                        ...editingMultiplier,
                        homeVisitsCount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Triagens MUAC
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingMultiplier.muacScreeningsCount}
                    onChange={(e) =>
                      setEditingMultiplier({
                        ...editingMultiplier,
                        muacScreeningsCount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Casos Risco (US)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingMultiplier.riskCasesReferred}
                    onChange={(e) =>
                      setEditingMultiplier({
                        ...editingMultiplier,
                        riskCasesReferred: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações de Campo
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={editingMultiplier.notes}
                  onChange={(e) =>
                    setEditingMultiplier({ ...editingMultiplier, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#2E7D32] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMultiplier.adminValidated}
                  onChange={(e) =>
                    setEditingMultiplier({
                      ...editingMultiplier,
                      adminValidated: e.target.checked,
                    })
                  }
                  className="accent-[#2E7D32]"
                />
                Validado pela Administração
              </label>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingMultiplier(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2E7D32] hover:bg-[#256628] rounded-lg cursor-pointer"
                >
                  {saving ? 'A guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation (Admin Only) */}
      {deletingMultiplier && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Confirmar Remoção
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem a certeza que pretende remover o multiplicador{' '}
              <span className="font-semibold text-slate-900">{deletingMultiplier.fullName}</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingMultiplier(null)}
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
