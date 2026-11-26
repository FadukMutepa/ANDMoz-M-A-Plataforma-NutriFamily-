import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  removeActivityRecord,
  removeFamilyRecord,
  removeGoalRecord,
  removeMultiplierRecord,
  saveActivityRecord,
  saveFamilyRecord,
  saveGoalRecord,
  saveMultiplierRecord,
  type DemoStoreState,
} from '../dataStore';
import {
  ACTIVITY_CATEGORIES,
  clampText,
  DATE_REGEX,
  GARDEN_STATUS_OPTIONS,
  GOAL_PILLARS,
  MULTIPLIER_SPECIALTIES,
  NUTRIFAMILY_CLUBS,
  QUELIMANE_COMMUNITIES,
  sanitizeCode,
  type Activity,
  type ActivityCategory,
  type ActivityStatus,
  type AppSessionUser,
  type ClubName,
  type Family,
  type GardenStatus,
  type Goal,
  type GoalPillar,
  type GoalStatus,
  type Multiplier,
  type MultiplierSpecialty,
  type MultiplierStatus,
  type NutritionStatus,
  type TrainingStatus,
} from '../types';
import { downloadCsv } from '../utils/csvExport';

interface AdminEditHubViewProps {
  user: AppSessionUser;
  goals: Goal[];
  families: Family[];
  multipliers: Multiplier[];
  activities: Activity[];
  onExportPdf: () => void;
  onExportFamiliesPdf: () => void;
  onExportMultipliersPdf: () => void;
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void;
}

type EditorTab = 'families' | 'multipliers' | 'activities' | 'goals';
type ValidationFilter = 'all' | 'validated' | 'pending';

export function AdminEditHubView({
  user,
  goals,
  families,
  multipliers,
  activities,
  onExportPdf,
  onExportFamiliesPdf,
  onExportMultipliersPdf,
  onDemoChange,
}: AdminEditHubViewProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('families');
  const [search, setSearch] = useState('');
  const [communityFilter, setCommunityFilter] = useState<string>('all');
  const [clubFilter, setClubFilter] = useState<string>('all');
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>('all');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [editingMultiplier, setEditingMultiplier] = useState<Multiplier | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const notifySaved = (msg: string) => {
    setErrorNotice(null);
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(null), 3500);
  };

  const notifyError = (err: unknown, fallback: string) => {
    setSavedNotice(null);
    setErrorNotice(err instanceof Error ? err.message : fallback);
  };

  const communityOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...QUELIMANE_COMMUNITIES,
        ...families.map((f) => f.community),
        ...multipliers.map((m) => m.community),
      ])
    );
  }, [families, multipliers]);

  const filteredFamilies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return families.filter((f) => {
      const matchesSearch =
        !q ||
        f.headOfHousehold.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.community.toLowerCase().includes(q) ||
        f.clubName.toLowerCase().includes(q) ||
        f.multiplierName.toLowerCase().includes(q);
      const matchesCommunity = communityFilter === 'all' || f.community === communityFilter;
      const matchesClub = clubFilter === 'all' || f.clubName === clubFilter;
      const matchesValidation =
        validationFilter === 'all' ||
        (validationFilter === 'validated' && f.adminValidated) ||
        (validationFilter === 'pending' && !f.adminValidated);
      return matchesSearch && matchesCommunity && matchesClub && matchesValidation;
    });
  }, [clubFilter, communityFilter, families, search, validationFilter]);

  const filteredMultipliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return multipliers.filter((m) => {
      const matchesSearch =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.community.toLowerCase().includes(q) ||
        m.clubName.toLowerCase().includes(q);
      const matchesCommunity = communityFilter === 'all' || m.community === communityFilter;
      const matchesClub = clubFilter === 'all' || m.clubName === clubFilter;
      const matchesValidation =
        validationFilter === 'all' ||
        (validationFilter === 'validated' && m.adminValidated) ||
        (validationFilter === 'pending' && !m.adminValidated);
      return matchesSearch && matchesCommunity && matchesClub && matchesValidation;
    });
  }, [clubFilter, communityFilter, multipliers, search, validationFilter]);

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((a) => {
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.community.toLowerCase().includes(q) ||
        a.multiplierName.toLowerCase().includes(q);
      const matchesCommunity = communityFilter === 'all' || a.community === communityFilter;
      return matchesSearch && matchesCommunity;
    });
  }, [activities, communityFilter, search]);

  const filteredGoals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return goals.filter(
      (g) =>
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q) ||
        g.pillar.toLowerCase().includes(q)
    );
  }, [goals, search]);

  const handleQuickValidateFamily = (f: Family) => {
    const safeDate = DATE_REGEX.test(f.registrationDate)
      ? f.registrationDate
      : new Date().toISOString().slice(0, 10);
    void saveFamilyRecord(
      user,
      {
        code: sanitizeCode(f.code, 'FAM-QLM'),
        headOfHousehold: clampText(f.headOfHousehold, 2, 120, 'Agregado'),
        community: f.community,
        clubName: f.clubName,
        membersCount: Math.min(40, Math.max(1, Math.round(Number(f.membersCount) || 4))),
        childrenUnder5: Math.min(20, Math.max(0, Math.round(Number(f.childrenUnder5) || 0))),
        hasPcd: Boolean(f.hasPcd),
        hasElderly: Boolean(f.hasElderly),
        gardenStatus: f.gardenStatus,
        dietaryDiversityImproved: Boolean(f.dietaryDiversityImproved),
        hasBioGarden: f.gardenStatus === 'Instalada e Funcional',
        inSavingsGroup: Boolean(f.inSavingsGroup),
        multiplierName: clampText(f.multiplierName, 2, 120, 'Rosa da Conceição Mabunda'),
        nutritionStatus: f.nutritionStatus,
        registrationDate: safeDate,
        notes: f.notes.trim().slice(0, 400),
        enrolledMonth: f.enrolledMonth,
        adminValidated: !f.adminValidated,
      },
      f.id,
      onDemoChange
    ).then(() => {
      notifySaved(
        !f.adminValidated
          ? `Família ${f.code} marcada como Validada pela Administração.`
          : `Validação removida da família ${f.code}.`
      );
    }).catch((err) => {
      notifyError(err, 'Não foi possível validar o registo da família.');
    });
  };

  const handleQuickValidateMultiplier = (m: Multiplier) => {
    void saveMultiplierRecord(
      user,
      {
        code: sanitizeCode(m.code, 'MC'),
        fullName: clampText(m.fullName, 2, 120, 'Multiplicador'),
        community: m.community,
        clubName: m.clubName,
        specialty: m.specialty,
        phone: clampText(m.phone, 6, 30, '+258 84 000 0000'),
        trainingStatus: m.trainingStatus,
        homeVisitsCount: Math.min(5000, Math.max(0, Math.round(Number(m.homeVisitsCount) || 0))),
        muacScreeningsCount: Math.min(
          5000,
          Math.max(0, Math.round(Number(m.muacScreeningsCount) || 0))
        ),
        riskCasesReferred: Math.min(
          1000,
          Math.max(0, Math.round(Number(m.riskCasesReferred) || 0))
        ),
        familiesAssigned: Math.min(500, Math.max(0, Math.round(Number(m.familiesAssigned) || 0))),
        sessionsHeld: Math.min(1000, Math.max(0, Math.round(Number(m.sessionsHeld) || 0))),
        status: m.status,
        notes: m.notes.trim().slice(0, 400),
        adminValidated: !m.adminValidated,
      },
      m.id,
      onDemoChange
    ).then(() => {
      notifySaved(
        !m.adminValidated
          ? `Multiplicador ${m.code} marcado como Validado pela Administração.`
          : `Validação removida do multiplicador ${m.code}.`
      );
    }).catch((err) => {
      notifyError(err, 'Não foi possível validar o registo do multiplicador.');
    });
  };

  const handleExportActiveCsv = () => {
    if (activeTab === 'families') {
      downloadCsv(
        `ANDMoz_Familias_${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'Código',
          'Chefe de Agregado',
          'Comunidade',
          'Clube',
          'Multiplicador',
          'Crianças 0-5',
          'PCD',
          'Idoso',
          'Horta',
          'Diversidade Melhorada',
          'Validado pela Administração',
          'Data Registo',
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
          f.adminValidated ? 'Validado' : 'Pendente',
          f.registrationDate,
        ])
      );
      return;
    }

    if (activeTab === 'multipliers') {
      downloadCsv(
        `ANDMoz_Multiplicadores_${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'Código',
          'Nome Completo',
          'Contacto',
          'Comunidade',
          'Clube',
          'Certificação',
          'Visitas',
          'MUAC',
          'Risco US',
          'Validado pela Administração',
        ],
        filteredMultipliers.map((m) => [
          m.code,
          m.fullName,
          m.phone,
          m.community,
          m.clubName,
          m.trainingStatus,
          m.homeVisitsCount,
          m.muacScreeningsCount,
          m.riskCasesReferred,
          m.adminValidated ? 'Validado' : 'Pendente',
        ])
      );
      return;
    }

    if (activeTab === 'activities') {
      downloadCsv(
        `ANDMoz_Actividades_${new Date().toISOString().slice(0, 10)}.csv`,
        ['Data', 'Título', 'Categoria', 'Comunidade', 'Participantes', 'Estado'],
        filteredActivities.map((a) => [
          a.activityDate,
          a.title,
          a.category,
          a.community,
          a.womenCount + a.menCount + a.childrenCount,
          a.status,
        ])
      );
      return;
    }

    downloadCsv(
      `ANDMoz_Metas_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Código', 'Indicador', 'Pilar', 'Realizado', 'Meta', 'Unidade', 'Estado'],
      filteredGoals.map((g) => [
        g.code,
        g.title,
        g.pillar,
        g.currentValue,
        g.targetValue,
        g.unit,
        g.status,
      ])
    );
  };

  const pendingFamiliesCount = families.filter((f) => !f.adminValidated).length;
  const pendingMultipliersCount = multipliers.filter((m) => !m.adminValidated).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Visão Geral e Espaço de Edição de Dados
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Consulte, filtre, edite e valide registos de Famílias, Multiplicadores, Actividades e
            Metas ({pendingFamiliesCount} família(s) e {pendingMultipliersCount} multiplicador(es)
            por validar)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportActiveCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV da Lista</span>
          </button>
          <button
            type="button"
            onClick={onExportFamiliesPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>Lista Famílias PDF</span>
          </button>
          <button
            type="button"
            onClick={onExportMultipliersPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>Lista Multiplicadores PDF</span>
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Baixar Relatório em PDF</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-lg bg-[#EAF4EB] border border-[#C8E6C9] text-xs font-medium text-[#2E7D32] flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-red-500 hover:text-red-700 cursor-pointer"
            aria-label="Fechar erro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs + Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'families', label: `Todas as Famílias (${families.length})` },
                { id: 'multipliers', label: `Todos os Multiplicadores (${multipliers.length})` },
                { id: 'activities', label: `Actividades (${activities.length})` },
                { id: 'goals', label: `Metas (${goals.length})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, código, bairro ou clube..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
            />
          </div>
        </div>

        {(activeTab === 'families' || activeTab === 'multipliers' || activeTab === 'activities') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <select
              aria-label="Filtrar por comunidade"
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="all">Todas as Comunidades (Quelimane)</option>
              {communityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {activeTab !== 'activities' && (
              <>
                <select
                  aria-label="Filtrar por Clube NutriFamily"
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="all">Todos os Clubes NutriFamily</option>
                  {NUTRIFAMILY_CLUBS.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filtrar por estado de validação"
                  value={validationFilter}
                  onChange={(e) => setValidationFilter(e.target.value as ValidationFilter)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="all">Todos os Estados de Validação</option>
                  <option value="validated">Validado pela Administração</option>
                  <option value="pending">Aguardando Validação</option>
                </select>
              </>
            )}
          </div>
        )}
      </div>

      {/* Unified Edit Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'families' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAF9] text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Chefe de Agregado</th>
                  <th className="py-3 px-4">Comunidade · Clube</th>
                  <th className="py-3 px-4">Crianças 0–5 · Inclusão</th>
                  <th className="py-3 px-4">Horta</th>
                  <th className="py-3 px-4">Validação Admin</th>
                  <th className="py-3 px-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredFamilies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center text-xs text-slate-500">
                      Nenhuma família encontrada com os filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredFamilies.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono-num text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {f.code}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{f.headOfHousehold}</p>
                        <p className="text-[11px] text-slate-500">Resp.: {f.multiplierName}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {f.community} · {f.clubName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap tabular-nums">
                        {f.childrenUnder5} cr. 0–5
                        {f.hasPcd ? ' · PCD' : ''}
                        {f.hasElderly ? ' · Idoso' : ''}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {f.gardenStatus}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {f.adminValidated ? (
                          <span className="inline-flex items-center gap-1 text-[#2E7D32] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Validado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!f.adminValidated && (
                          <button
                            type="button"
                            onClick={() => handleQuickValidateFamily(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md mr-1.5 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Validar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingFamily(f)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2E7D32] bg-[#EAF4EB] hover:bg-[#DCEEE0] rounded-md mr-1.5 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void removeFamilyRecord(user, f.id, onDemoChange)
                              .then(() => notifySaved(`Família ${f.code} removida.`))
                              .catch((err) =>
                                notifyError(err, `Não foi possível remover a família ${f.code}.`)
                              )
                          }
                          className="p-1.5 text-slate-400 hover:text-red-700 rounded-md cursor-pointer"
                          aria-label={`Remover ${f.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'multipliers' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAF9] text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Nome Completo</th>
                  <th className="py-3 px-4">Comunidade · Clube</th>
                  <th className="py-3 px-4">Certificação</th>
                  <th className="py-3 px-4">Visitas · MUAC · Risco</th>
                  <th className="py-3 px-4">Validação Admin</th>
                  <th className="py-3 px-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMultipliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center text-xs text-slate-500">
                      Nenhum multiplicador encontrado com os filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredMultipliers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono-num text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {m.code}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{m.fullName}</p>
                        <p className="text-[11px] text-slate-500 font-mono-num">{m.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {m.community} · {m.clubName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap font-medium">
                        {m.trainingStatus}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap font-mono-num">
                        {m.homeVisitsCount} vis. · {m.muacScreeningsCount} MUAC ·{' '}
                        {m.riskCasesReferred} US
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {m.adminValidated ? (
                          <span className="inline-flex items-center gap-1 text-[#2E7D32] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Validado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!m.adminValidated && (
                          <button
                            type="button"
                            onClick={() => handleQuickValidateMultiplier(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md mr-1.5 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Validar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingMultiplier(m)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2E7D32] bg-[#EAF4EB] hover:bg-[#DCEEE0] rounded-md mr-1.5 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void removeMultiplierRecord(user, m.id, onDemoChange)
                              .then(() => notifySaved(`Multiplicador ${m.code} removido.`))
                              .catch((err) =>
                                notifyError(
                                  err,
                                  `Não foi possível remover o multiplicador ${m.code}.`
                                )
                              )
                          }
                          className="p-1.5 text-slate-400 hover:text-red-700 rounded-md cursor-pointer"
                          aria-label={`Remover ${m.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'activities' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAF9] text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Actividade</th>
                  <th className="py-3 px-4">Comunidade</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono-num text-xs text-slate-700">
                      {a.activityDate}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{a.title}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{a.community}</td>
                    <td className="py-3 px-4 text-xs text-slate-700">{a.status}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingActivity(a)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2E7D32] bg-[#EAF4EB] hover:bg-[#DCEEE0] rounded-md mr-1.5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void removeActivityRecord(user, a.id, onDemoChange)
                            .then(() => notifySaved('Actividade removida.'))
                            .catch((err) =>
                              notifyError(err, 'Não foi possível remover a actividade.')
                            )
                        }
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded-md cursor-pointer"
                        aria-label={`Remover ${a.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'goals' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAF9] text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Indicador</th>
                  <th className="py-3 px-4 text-right">Realizado / Meta</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredGoals.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono-num text-xs font-semibold text-slate-700">
                      {g.code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{g.title}</td>
                    <td className="py-3 px-4 text-right font-mono-num text-xs text-slate-700">
                      {g.currentValue} / {g.targetValue} {g.unit}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{g.status}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingGoal(g)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2E7D32] bg-[#EAF4EB] hover:bg-[#DCEEE0] rounded-md mr-1.5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void removeGoalRecord(user, g.id, onDemoChange)
                            .then(() => notifySaved(`Meta ${g.code} removida.`))
                            .catch((err) =>
                              notifyError(err, `Não foi possível remover a meta ${g.code}.`)
                            )
                        }
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded-md cursor-pointer"
                        aria-label={`Remover ${g.code}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Family Modal */}
      {editingFamily && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Editar Família ({editingFamily.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingFamily(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Chefe / Responsável do Agregado
                  </label>
                  <input
                    type="text"
                    value={editingFamily.headOfHousehold}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, headOfHousehold: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data Registo
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Membros</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={editingFamily.membersCount}
                    onChange={(e) =>
                      setEditingFamily({
                        ...editingFamily,
                        membersCount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
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
                    <option value="Acompanhamento Prioritário">
                      Acompanhamento Prioritário
                    </option>
                    <option value="Graduada">Graduada</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingFamily.hasPcd}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, hasPcd: e.target.checked })
                    }
                    className="accent-[#2E7D32]"
                  />
                  Possui PCD
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
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
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
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
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingFamily.inSavingsGroup}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, inSavingsGroup: e.target.checked })
                    }
                    className="accent-[#2E7D32]"
                  />
                  Grupo VSLA
                </label>
              </div>

              <div className="p-3 rounded-lg border border-[#C8E6C9] bg-[#F8FAF9]">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#2E7D32] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFamily.adminValidated}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, adminValidated: e.target.checked })
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingFamily(null)}
                className="px-4 py-2 text-xs border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const f = editingFamily;
                  const safeDate = DATE_REGEX.test(f.registrationDate)
                    ? f.registrationDate
                    : new Date().toISOString().slice(0, 10);
                  void saveFamilyRecord(
                    user,
                    {
                      code: sanitizeCode(f.code, 'FAM-QLM'),
                      headOfHousehold: clampText(f.headOfHousehold, 2, 120, 'Agregado'),
                      community: f.community,
                      clubName: f.clubName,
                      membersCount: Math.min(40, Math.max(1, Math.round(Number(f.membersCount) || 4))),
                      childrenUnder5: Math.min(
                        20,
                        Math.max(0, Math.round(Number(f.childrenUnder5) || 0))
                      ),
                      hasPcd: Boolean(f.hasPcd),
                      hasElderly: Boolean(f.hasElderly),
                      gardenStatus: f.gardenStatus,
                      dietaryDiversityImproved: Boolean(f.dietaryDiversityImproved),
                      hasBioGarden: f.gardenStatus === 'Instalada e Funcional',
                      inSavingsGroup: Boolean(f.inSavingsGroup),
                      multiplierName: clampText(f.multiplierName, 2, 120, 'Rosa da Conceição Mabunda'),
                      nutritionStatus: f.nutritionStatus,
                      registrationDate: safeDate,
                      notes: f.notes.trim().slice(0, 400),
                      enrolledMonth: f.enrolledMonth,
                      adminValidated: Boolean(f.adminValidated),
                    },
                    f.id,
                    onDemoChange
                  ).then(() => {
                    setEditingFamily(null);
                    notifySaved(`Família ${f.code} actualizada.`);
                  }).catch((err) => {
                    notifyError(err, `Não foi possível actualizar a família ${f.code}.`);
                  });
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2E7D32] rounded-lg cursor-pointer"
              >
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Multiplier Modal */}
      {editingMultiplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Editar Multiplicador ({editingMultiplier.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingMultiplier(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
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
                    value={editingMultiplier.phone}
                    onChange={(e) =>
                      setEditingMultiplier({ ...editingMultiplier, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    Certificação
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
                    Casos Risco US
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Especialidade
                  </label>
                  <select
                    value={editingMultiplier.specialty}
                    onChange={(e) =>
                      setEditingMultiplier({
                        ...editingMultiplier,
                        specialty: e.target.value as MultiplierSpecialty,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {MULTIPLIER_SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={editingMultiplier.status}
                    onChange={(e) =>
                      setEditingMultiplier({
                        ...editingMultiplier,
                        status: e.target.value as MultiplierStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Em Formação">Em Formação</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[#C8E6C9] bg-[#F8FAF9]">
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMultiplier(null)}
                className="px-4 py-2 text-xs border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const m = editingMultiplier;
                  void saveMultiplierRecord(
                    user,
                    {
                      code: sanitizeCode(m.code, 'MC'),
                      fullName: clampText(m.fullName, 2, 120, 'Multiplicador'),
                      community: m.community,
                      clubName: m.clubName,
                      specialty: m.specialty,
                      phone: clampText(m.phone, 6, 30, '+258 84 000 0000'),
                      trainingStatus: m.trainingStatus,
                      homeVisitsCount: Math.min(
                        5000,
                        Math.max(0, Math.round(Number(m.homeVisitsCount) || 0))
                      ),
                      muacScreeningsCount: Math.min(
                        5000,
                        Math.max(0, Math.round(Number(m.muacScreeningsCount) || 0))
                      ),
                      riskCasesReferred: Math.min(
                        1000,
                        Math.max(0, Math.round(Number(m.riskCasesReferred) || 0))
                      ),
                      familiesAssigned: Math.min(
                        500,
                        Math.max(0, Math.round(Number(m.familiesAssigned) || 0))
                      ),
                      sessionsHeld: Math.min(
                        1000,
                        Math.max(0, Math.round(Number(m.sessionsHeld) || 0))
                      ),
                      status: m.status,
                      notes: m.notes.trim().slice(0, 400),
                      adminValidated: Boolean(m.adminValidated),
                    },
                    m.id,
                    onDemoChange
                  ).then(() => {
                    setEditingMultiplier(null);
                    notifySaved(`Multiplicador ${m.code} actualizado.`);
                  }).catch((err) => {
                    notifyError(err, `Não foi possível actualizar o multiplicador ${m.code}.`);
                  });
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2E7D32] rounded-lg cursor-pointer"
              >
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Editar Actividade</h3>
              <button
                type="button"
                onClick={() => setEditingActivity(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  value={editingActivity.title}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={editingActivity.category}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        category: e.target.value as ActivityCategory,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {ACTIVITY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={editingActivity.status}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        status: e.target.value as ActivityStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Planeado">Planeado</option>
                    <option value="Submetido">Submetido</option>
                    <option value="Validado">Validado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resumo</label>
                <textarea
                  rows={2}
                  value={editingActivity.summary}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, summary: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingActivity(null)}
                className="px-4 py-2 text-xs border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const a = editingActivity;
                  void saveActivityRecord(
                    user,
                    {
                      title: clampText(a.title, 3, 160, 'Actividade'),
                      category: a.category,
                      community: a.community,
                      activityDate: a.activityDate,
                      projectMonth: a.projectMonth,
                      multiplierName: a.multiplierName,
                      womenCount: a.womenCount,
                      menCount: a.menCount,
                      childrenCount: a.childrenCount,
                      summary: clampText(a.summary, 3, 600, 'Actividade actualizada.'),
                      status: a.status,
                    },
                    a.id,
                    onDemoChange
                  ).then(() => {
                    setEditingActivity(null);
                    notifySaved('Actividade actualizada com sucesso.');
                  }).catch((err) => {
                    notifyError(err, 'Não foi possível actualizar a actividade.');
                  });
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2E7D32] rounded-lg cursor-pointer"
              >
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Editar Meta ({editingGoal.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Indicador</label>
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pilar</label>
                  <select
                    value={editingGoal.pillar}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, pillar: e.target.value as GoalPillar })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {GOAL_PILLARS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={editingGoal.status}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, status: e.target.value as GoalStatus })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="No Prazo">No Prazo</option>
                    <option value="Em Risco">Em Risco</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Realizado
                  </label>
                  <input
                    type="number"
                    value={editingGoal.currentValue}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, currentValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Meta 12M</label>
                  <input
                    type="number"
                    value={editingGoal.targetValue}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, targetValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="px-4 py-2 text-xs border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const g = editingGoal;
                  void saveGoalRecord(
                    user,
                    {
                      code: sanitizeCode(g.code, 'NF'),
                      title: clampText(g.title, 3, 160, 'Indicador'),
                      pillar: g.pillar,
                      targetValue: g.targetValue,
                      currentValue: g.currentValue,
                      unit: g.unit,
                      targetMonth: g.targetMonth,
                      status: g.status,
                      notes: g.notes,
                    },
                    g.id,
                    onDemoChange
                  ).then(() => {
                    setEditingGoal(null);
                    notifySaved(`Meta ${g.code} actualizada.`);
                  }).catch((err) => {
                    notifyError(err, `Não foi possível actualizar a meta ${g.code}.`);
                  });
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2E7D32] rounded-lg cursor-pointer"
              >
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
