import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  Search,
  Sprout,
  Trash2,
  X,
} from 'lucide-react';
import { removeFamilyRecord, saveFamilyRecord, type DemoStoreState } from '../dataStore';
import {
  clampText,
  DATE_REGEX,
  GARDEN_STATUS_OPTIONS,
  NUTRIFAMILY_CLUBS,
  QUELIMANE_COMMUNITIES,
  sanitizeCode,
  type AppSessionUser,
  type ClubName,
  type Family,
  type GardenStatus,
  type Multiplier,
  type NutritionStatus,
} from '../types';
import { downloadCsv } from '../utils/csvExport';
import { exportFamiliesPdf } from '../utils/pdfExport';

interface FamiliesViewProps {
  user: AppSessionUser;
  families: Family[];
  multipliers: Multiplier[];
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void;
}

interface FamilyFormState {
  code: string;
  headOfHousehold: string;
  community: string;
  clubName: ClubName;
  multiplierName: string;
  childrenUnder5: number;
  membersCount: number;
  hasPcd: boolean;
  hasElderly: boolean;
  gardenStatus: GardenStatus;
  dietaryDiversityImproved: boolean;
  inSavingsGroup: boolean;
  nutritionStatus: NutritionStatus;
  registrationDate: string;
  notes: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthFromIsoDate(dateStr: string): number {
  const parsed = Number(dateStr.split('-')[1]);
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 12) {
    return parsed;
  }
  return 11;
}

export function FamiliesView({
  user,
  families,
  multipliers,
  onDemoChange,
}: FamiliesViewProps) {
  const isAdmin = user.role === 'administrador';

  const [search, setSearch] = useState('');
  const [communityFilter, setCommunityFilter] = useState('Todas');
  const [clubFilter, setClubFilter] = useState('Todos');
  const [gardenFilter, setGardenFilter] = useState('Todos');

  // Inline form for Gestor (always open) and collapsible for Admin
  const [adminShowCreateForm, setAdminShowCreateForm] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [deletingFamily, setDeletingFamily] = useState<Family | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const defaultMultiplier = multipliers[0]?.fullName || 'Rosa da Conceição Mabunda';

  const buildInitialForm = (): FamilyFormState => ({
    code: `FAM-QLM-${String(families.length + 1).padStart(3, '0')}`,
    headOfHousehold: '',
    community: QUELIMANE_COMMUNITIES[0],
    clubName: 'Clube 1',
    multiplierName: multipliers[0]?.fullName || 'Rosa da Conceição Mabunda',
    childrenUnder5: 1,
    membersCount: 5,
    hasPcd: false,
    hasElderly: false,
    gardenStatus: 'Instalada e Funcional',
    dietaryDiversityImproved: true,
    inSavingsGroup: false,
    nutritionStatus: 'Estável',
    registrationDate: todayIsoDate(),
    notes: '',
  });

  const [form, setForm] = useState<FamilyFormState>(buildInitialForm);

  const filteredFamilies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return families
      .filter((f) => {
        if (communityFilter !== 'Todas' && f.community !== communityFilter) return false;
        if (clubFilter !== 'Todos' && f.clubName !== clubFilter) return false;
        if (gardenFilter !== 'Todos' && f.gardenStatus !== gardenFilter) return false;
        if (
          q &&
          !f.headOfHousehold.toLowerCase().includes(q) &&
          !f.code.toLowerCase().includes(q) &&
          !f.community.toLowerCase().includes(q) &&
          !f.clubName.toLowerCase().includes(q) &&
          !f.multiplierName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.registrationDate.localeCompare(a.registrationDate) || a.code.localeCompare(b.code));
  }, [clubFilter, communityFilter, families, gardenFilter, search]);

  const summary = useMemo(() => {
    const totalUnder5 = filteredFamilies.reduce((acc, f) => acc + f.childrenUnder5, 0);
    const pcdOrElderly = filteredFamilies.filter((f) => f.hasPcd || f.hasElderly).length;
    const functionalGardens = filteredFamilies.filter(
      (f) => f.gardenStatus === 'Instalada e Funcional'
    ).length;
    const improvedDiet = filteredFamilies.filter((f) => f.dietaryDiversityImproved).length;
    return { totalUnder5, pcdOrElderly, functionalGardens, improvedDiet };
  }, [filteredFamilies]);

  const handleCreateInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.headOfHousehold.trim().length < 2) {
      setFormError('Indique o nome completo do chefe ou responsável do agregado.');
      return;
    }

    const safeDate = DATE_REGEX.test(form.registrationDate)
      ? form.registrationDate
      : todayIsoDate();

    setSaving(true);
    setFormError(null);

    try {
      const sanitizedCode = sanitizeCode(form.code, 'FAM-QLM');
      await saveFamilyRecord(
        user,
        {
          code: sanitizedCode,
          headOfHousehold: clampText(form.headOfHousehold, 2, 120, 'Agregado Familiar'),
          community: clampText(form.community, 2, 80, 'Chuabo Dembe'),
          clubName: form.clubName,
          membersCount: Math.min(40, Math.max(1, Math.round(Number(form.membersCount) || 4))),
          childrenUnder5: Math.min(20, Math.max(0, Math.round(Number(form.childrenUnder5) || 0))),
          hasPcd: Boolean(form.hasPcd),
          hasElderly: Boolean(form.hasElderly),
          gardenStatus: form.gardenStatus,
          dietaryDiversityImproved: Boolean(form.dietaryDiversityImproved),
          hasBioGarden: form.gardenStatus === 'Instalada e Funcional',
          inSavingsGroup: Boolean(form.inSavingsGroup),
          multiplierName: clampText(form.multiplierName, 2, 120, defaultMultiplier),
          nutritionStatus: form.nutritionStatus,
          registrationDate: safeDate,
          notes: form.notes.trim().slice(0, 400),
          enrolledMonth: monthFromIsoDate(safeDate),
          adminValidated: isAdmin,
        },
        null,
        onDemoChange
      );

      setSuccessNotice(`Família ${sanitizedCode} registada com sucesso e disponível para a Administração.`);
      window.setTimeout(() => setSuccessNotice(null), 4000);
      setForm({
        ...buildInitialForm(),
        code: `FAM-QLM-${String(families.length + 2).padStart(3, '0')}`,
      });
      if (isAdmin) {
        setAdminShowCreateForm(false);
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Erro ao guardar a família. Verifique a ligação ao Supabase.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFamily || !isAdmin) return;
    if (editingFamily.headOfHousehold.trim().length < 2) {
      setFormError('Indique o nome do chefe/responsável do agregado.');
      return;
    }

    const safeDate = DATE_REGEX.test(editingFamily.registrationDate)
      ? editingFamily.registrationDate
      : todayIsoDate();

    setSaving(true);
    setFormError(null);

    try {
      await saveFamilyRecord(
        user,
        {
          code: sanitizeCode(editingFamily.code, 'FAM-QLM'),
          headOfHousehold: clampText(editingFamily.headOfHousehold, 2, 120, 'Agregado Familiar'),
          community: clampText(editingFamily.community, 2, 80, 'Chuabo Dembe'),
          clubName: editingFamily.clubName,
          membersCount: Math.min(40, Math.max(1, Math.round(Number(editingFamily.membersCount) || 4))),
          childrenUnder5: Math.min(20, Math.max(0, Math.round(Number(editingFamily.childrenUnder5) || 0))),
          hasPcd: Boolean(editingFamily.hasPcd),
          hasElderly: Boolean(editingFamily.hasElderly),
          gardenStatus: editingFamily.gardenStatus,
          dietaryDiversityImproved: Boolean(editingFamily.dietaryDiversityImproved),
          hasBioGarden: editingFamily.gardenStatus === 'Instalada e Funcional',
          inSavingsGroup: Boolean(editingFamily.inSavingsGroup),
          multiplierName: clampText(editingFamily.multiplierName, 2, 120, defaultMultiplier),
          nutritionStatus: editingFamily.nutritionStatus,
          registrationDate: safeDate,
          notes: editingFamily.notes.trim().slice(0, 400),
          enrolledMonth: monthFromIsoDate(safeDate),
          adminValidated: Boolean(editingFamily.adminValidated),
        },
        editingFamily.id,
        onDemoChange
      );
      setEditingFamily(null);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Erro ao actualizar o registo da família no Supabase.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFamily || !isAdmin) return;
    try {
      await removeFamilyRecord(user, deletingFamily.id, onDemoChange);
      setDeletingFamily(null);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Erro ao remover a família no Supabase.'
      );
      setDeletingFamily(null);
    }
  };

  const handleExport = () => {
    downloadCsv(
      'andmoz_nutrifamily_familias.csv',
      [
        'Código',
        'Chefe/Responsável',
        'Comunidade',
        'Clube NutriFamily',
        'Multiplicador',
        'Crianças 0-5 Anos',
        'Possui PCD',
        'Possui Idoso',
        'Estado Horta Adaptada',
        'Melhoria Diversidade Alimentar',
        'Data de Registo',
        'Observações',
        'Validação',
      ],
      filteredFamilies.map((f) => [
        f.code,
        f.headOfHousehold,
        f.community,
        f.clubName,
        f.multiplierName,
        f.childrenUnder5,
        f.hasPcd ? 'Sim' : 'Não',
        f.hasElderly ? 'Sim' : 'Não',
        f.gardenStatus,
        f.dietaryDiversityImproved ? 'Sim' : 'Não',
        f.registrationDate,
        f.notes,
        f.adminValidated ? 'Validado pela Administração' : 'Pendente',
      ])
    );
  };

  const showInlineForm = !isAdmin || adminShowCreateForm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Cadastro de Famílias Beneficiárias
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isAdmin
              ? 'Agregados familiares acompanhados nos Clubes NutriFamily (Quelimane)'
              : 'Registe cada família beneficiária e acompanhe abaixo os registos já submetidos'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => exportFamiliesPdf(user.displayName, filteredFamilies)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#2E7D32]" />
              <span>Baixar Lista PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminShowCreateForm((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{adminShowCreateForm ? 'Ocultar Formulário' : 'Registar Família'}</span>
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
                Formulário de Cadastro de Família Beneficiária
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Preencha os dados do agregado familiar para registo imediato na plataforma
              </p>
            </div>
            <span className="text-xs font-medium text-[#2E7D32] whitespace-nowrap shrink-0">
              Secção 1 de 3
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
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Código da Família *
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="FAM-QLM-001"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Chefe / Responsável do Agregado *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.headOfHousehold}
                  onChange={(e) => setForm({ ...form, headOfHousehold: e.target.value })}
                  placeholder="Ex.: Amélia António Mucavele"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Data de Registo *
                </label>
                <input
                  type="date"
                  required
                  value={form.registrationDate}
                  onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Comunidade / Localidade (Quelimane) *
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
                  Clube NutriFamily Associado *
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
                  Multiplicador Comunitário Responsável *
                </label>
                <select
                  value={form.multiplierName}
                  onChange={(e) => setForm({ ...form, multiplierName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  {multipliers.length > 0 ? (
                    multipliers.map((m) => (
                      <option key={m.id} value={m.fullName}>
                        {m.fullName} ({m.clubName})
                      </option>
                    ))
                  ) : (
                    <option value={defaultMultiplier}>{defaultMultiplier}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  N.º de Crianças (0 aos 5 anos) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  required
                  value={form.childrenUnder5}
                  onChange={(e) => setForm({ ...form, childrenUnder5: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Possui Pessoa com Deficiência (PCD)?
                </label>
                <select
                  value={form.hasPcd ? 'sim' : 'nao'}
                  onChange={(e) => setForm({ ...form, hasPcd: e.target.value === 'sim' })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Possui Idoso no Agregado?
                </label>
                <select
                  value={form.hasElderly ? 'sim' : 'nao'}
                  onChange={(e) => setForm({ ...form, hasElderly: e.target.value === 'sim' })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Horta Doméstica Adaptada (Canteiro elevado)
                </label>
                <select
                  value={form.gardenStatus}
                  onChange={(e) =>
                    setForm({ ...form, gardenStatus: e.target.value as GardenStatus })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  {GARDEN_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Melhoria na Diversidade Alimentar?
                </label>
                <select
                  value={form.dietaryDiversityImproved ? 'sim' : 'nao'}
                  onChange={(e) =>
                    setForm({ ...form, dietaryDiversityImproved: e.target.value === 'sim' })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
              <div className="lg:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações de Campo
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Registe detalhes sobre acessibilidade da horta, acompanhamento nutricional ou necessidades da família..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Total de Membros
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={form.membersCount}
                    onChange={(e) => setForm({ ...form, membersCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.inSavingsGroup}
                    onChange={(e) => setForm({ ...form, inSavingsGroup: e.target.checked })}
                    className="w-4 h-4 accent-[#2E7D32]"
                  />
                  Participa em Grupo VSLA
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2E7D32] hover:bg-[#256628] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{saving ? 'A guardar registo...' : 'Submeter Cadastro da Família'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Summary metrics bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-xs text-slate-500 block">Famílias Submetidas</span>
          <span className="text-lg font-bold text-slate-900 font-mono-num">
            {filteredFamilies.length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-xs text-slate-500 block">Crianças (0–5 Anos)</span>
          <span className="text-lg font-bold text-slate-900 font-mono-num">
            {summary.totalUnder5}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-xs text-slate-500 block">Inclusão (PCD / Idosos)</span>
          <span className="text-lg font-bold text-slate-900 font-mono-num">
            {summary.pcdOrElderly}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-xs text-slate-500 block">Hortas Activas · Diversidade +</span>
          <span className="text-lg font-bold text-slate-900 font-mono-num">
            {summary.functionalGardens} · {summary.improvedDiet}
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
              placeholder="Pesquisar código, chefe, bairro ou clube..."
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
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            aria-label="Filtrar por Clube NutriFamily"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#2E7D32]"
          >
            <option value="Todos">Todos os Clubes</option>
            {NUTRIFAMILY_CLUBS.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {['Todos', ...GARDEN_STATUS_OPTIONS].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setGardenFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                gardenFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'Instalada e Funcional' ? 'Horta Funcional' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Listing below form (read-only for Gestor; editable for Admin) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Registos Submetidos ({filteredFamilies.length})
          </h3>
          {!isAdmin && (
            <span className="text-xs text-slate-500">
              Visualização dos registos submetidos · Alterações globais exclusivas da Administração
            </span>
          )}
        </div>

        {filteredFamilies.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Nenhuma família encontrada com os filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAF9] text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Código · Data</th>
                  <th className="py-3 px-4 min-w-[190px]">Responsável do Agregado</th>
                  <th className="py-3 px-4 whitespace-nowrap">Comunidade · Clube</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Crianças (0–5)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Inclusão (PCD / Idoso)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Horta Adaptada</th>
                  <th className="py-3 px-4 whitespace-nowrap">Diversidade</th>
                  <th className="py-3 px-4 whitespace-nowrap">Multiplicador</th>
                  {isAdmin && (
                    <th className="py-3 px-4 text-right whitespace-nowrap">Acções</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredFamilies.map((family) => {
                  const inclusionTags = [
                    family.hasPcd ? 'PCD' : null,
                    family.hasElderly ? 'Idoso' : null,
                  ].filter(Boolean);

                  return (
                    <tr key={family.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <span className="font-mono-num text-xs font-semibold text-slate-800 block">
                          {family.code}
                        </span>
                        <span className="font-mono-num text-[11px] text-slate-500">
                          {family.registrationDate}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className="font-medium text-slate-900 block">
                          {family.headOfHousehold}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {family.adminValidated ? 'Validado pela Administração' : 'Aguarda validação'}
                          {family.notes ? ` · ${family.notes}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap align-top">
                        <span className="block font-medium">{family.community}</span>
                        <span className="text-slate-500">{family.clubName}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-xs font-semibold text-slate-800 whitespace-nowrap align-top">
                        {family.childrenUnder5}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap align-top">
                        {inclusionTags.length > 0 ? (
                          <span className="font-medium text-slate-800">
                            Sim ({inclusionTags.join(' · ')})
                          </span>
                        ) : (
                          <span className="text-slate-400">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap align-top">
                        {family.gardenStatus === 'Instalada e Funcional' ? (
                          <span className="inline-flex items-center gap-1 font-medium text-[#2E7D32]">
                            <Sprout className="w-3.5 h-3.5" />
                            Instalada e Funcional
                          </span>
                        ) : family.gardenStatus === 'Em Manutenção' ? (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Em Manutenção
                          </span>
                        ) : (
                          <span className="text-slate-500">Planeada</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap align-top">
                        {family.dietaryDiversityImproved ? (
                          <span className="inline-flex items-center gap-1 font-medium text-[#2E7D32]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sim
                          </span>
                        ) : (
                          <span className="text-slate-500">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap align-top">
                        {family.multiplierName}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right whitespace-nowrap align-top">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFormError(null);
                                setEditingFamily(family);
                              }}
                              aria-label={`Editar ${family.headOfHousehold}`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-[#2E7D32] hover:bg-[#EAF4EB] cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingFamily(family)}
                              aria-label={`Remover ${family.headOfHousehold}`}
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
        )}
      </div>

      {/* Edit Modal (Admin Only) */}
      {editingFamily && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-slate-900">
                Editar Família ({editingFamily.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingFamily(null)}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={editingFamily.code}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, code: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Chefe / Responsável do Agregado
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFamily.headOfHousehold}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, headOfHousehold: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Comunidade
                  </label>
                  <select
                    value={editingFamily.community}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, community: e.target.value })
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
                    value={editingFamily.clubName}
                    onChange={(e) =>
                      setEditingFamily({
                        ...editingFamily,
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
                    Multiplicador
                  </label>
                  <select
                    value={editingFamily.multiplierName}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, multiplierName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {multipliers.map((m) => (
                      <option key={m.id} value={m.fullName}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Crianças 0–5
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={editingFamily.childrenUnder5}
                    onChange={(e) =>
                      setEditingFamily({
                        ...editingFamily,
                        childrenUnder5: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Horta Adaptada
                  </label>
                  <select
                    value={editingFamily.gardenStatus}
                    onChange={(e) =>
                      setEditingFamily({
                        ...editingFamily,
                        gardenStatus: e.target.value as GardenStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {GARDEN_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Estado Nutricional
                  </label>
                  <select
                    value={editingFamily.nutritionStatus}
                    onChange={(e) =>
                      setEditingFamily({
                        ...editingFamily,
                        nutritionStatus: e.target.value as NutritionStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Estável">Estável</option>
                    <option value="Acompanhamento Prioritário">Prioritário</option>
                    <option value="Graduada">Graduada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data de Registo
                  </label>
                  <input
                    type="date"
                    value={editingFamily.registrationDate}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, registrationDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFamily.hasPcd}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, hasPcd: e.target.checked })
                    }
                    className="accent-[#2E7D32]"
                  />
                  Possui Pessoa com Deficiência (PCD)
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFamily.hasElderly}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, hasElderly: e.target.checked })
                    }
                    className="accent-[#2E7D32]"
                  />
                  Possui Idoso
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFamily.dietaryDiversityImproved}
                    onChange={(e) =>
                      setEditingFamily({
                        ...editingFamily,
                        dietaryDiversityImproved: e.target.checked,
                      })
                    }
                    className="accent-[#2E7D32]"
                  />
                  Diversidade Alimentar Melhorada
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#2E7D32] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFamily.adminValidated}
                    onChange={(e) =>
                      setEditingFamily({
                        ...editingFamily,
                        adminValidated: e.target.checked,
                      })
                    }
                    className="accent-[#2E7D32]"
                  />
                  Validado pela Administração
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={editingFamily.notes}
                  onChange={(e) =>
                    setEditingFamily({ ...editingFamily, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingFamily(null)}
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
      {deletingFamily && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Confirmar Remoção de Registo
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem a certeza que pretende remover a família de{' '}
              <span className="font-semibold text-slate-900">{deletingFamily.headOfHousehold}</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingFamily(null)}
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
