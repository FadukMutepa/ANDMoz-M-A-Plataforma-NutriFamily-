import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  ChevronDown,
  Download,
  FileDown,
  FileText,
  HeartHandshake,
  Home,
  Printer,
  ShieldAlert,
  Sprout,
  Users,
} from 'lucide-react';
import {
  NUTRIFAMILY_CLUBS,
  OFFICIAL_PROJECT_TARGETS,
  QUELIMANE_COMMUNITIES,
  type Activity,
  type AppSessionUser,
  type Family,
  type Goal,
  type Multiplier,
  type ReportDocument,
} from '../types';
import { downloadCsv } from '../utils/csvExport';
import { downloadDataUrlAsFile } from '../utils/fileHelpers';
import { DashboardCharts } from './DashboardCharts';
import type { NavSection } from './Sidebar';

interface DashboardViewProps {
  user: AppSessionUser;
  goals: Goal[];
  families: Family[];
  multipliers: Multiplier[];
  activities: Activity[];
  documents: ReportDocument[];
  onNavigate: (section: NavSection) => void;
  onExportPdf: () => void;
  onExportFamiliesPdf: () => void;
  onExportMultipliersPdf: () => void;
}

const CALENDAR_MONTHS = [
  { month: 1, short: 'Jan', label: 'Janeiro' },
  { month: 2, short: 'Fev', label: 'Fevereiro' },
  { month: 3, short: 'Mar', label: 'Março' },
  { month: 4, short: 'Abr', label: 'Abril' },
  { month: 5, short: 'Mai', label: 'Maio' },
  { month: 6, short: 'Jun', label: 'Junho' },
  { month: 7, short: 'Jul', label: 'Julho' },
  { month: 8, short: 'Ago', label: 'Agosto' },
  { month: 9, short: 'Set', label: 'Setembro' },
  { month: 10, short: 'Out', label: 'Outubro' },
  { month: 11, short: 'Nov', label: 'Novembro' },
  { month: 12, short: 'Dez', label: 'Dezembro' },
] as const;

function parseCalendarMonth(dateStr: string, fallbackMonth: number): number {
  const match = /^\d{4}-(\d{2})-\d{2}$/.exec(dateStr);
  if (match) {
    const parsed = Number(match[1]);
    if (parsed >= 1 && parsed <= 12) return parsed;
  }
  return Math.min(12, Math.max(1, fallbackMonth || 1));
}

export function DashboardView({
  user,
  goals,
  families,
  multipliers,
  activities,
  documents,
  onNavigate,
  onExportPdf,
  onExportFamiliesPdf,
  onExportMultipliersPdf,
}: DashboardViewProps) {
  const isAdmin = user.role === 'administrador';
  const [comparisonScale, setComparisonScale] = useState<'percent' | 'absolute'>('percent');
  const [distributionGroupBy, setDistributionGroupBy] = useState<'community' | 'club'>('community');
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);

  const stats = useMemo(() => {
    const totalFamilies = families.length;
    const functionalGardens = families.filter(
      (f) => f.gardenStatus === 'Instalada e Funcional' || f.hasBioGarden
    ).length;
    const plannedGardens = families.filter((f) => f.gardenStatus === 'Planeada').length;
    const maintenanceGardens = families.filter((f) => f.gardenStatus === 'Em Manutenção').length;

    const pcdCount = families.filter((f) => f.hasPcd).length;
    const elderlyCount = families.filter((f) => f.hasElderly).length;
    const inclusionBeneficiaries = pcdCount + elderlyCount;
    const childrenUnder5 = families.reduce((acc, f) => acc + f.childrenUnder5, 0);

    const certifiedMultipliers = multipliers.filter(
      (m) => m.trainingStatus === 'Certificado'
    ).length;
    const inTrainingMultipliers = multipliers.filter(
      (m) => m.trainingStatus === 'Em formação'
    ).length;

    const activeClubs = new Set([
      ...families.map((f) => f.clubName),
      ...multipliers.map((m) => m.clubName),
    ]).size;

    const totalMuac = multipliers.reduce((acc, m) => acc + m.muacScreeningsCount, 0);
    const totalVisits = multipliers.reduce((acc, m) => acc + m.homeVisitsCount, 0);
    const totalRiskReferred = multipliers.reduce((acc, m) => acc + m.riskCasesReferred, 0);
    const riskReferralRate = totalRiskReferred > 0 ? 100 : 0;

    const atRiskGoals = goals.filter((g) => g.status === 'Em Risco');
    const pendingValidationFamilies = families.filter((f) => !f.adminValidated).length;
    const pendingValidationMultipliers = multipliers.filter((m) => !m.adminValidated).length;
    const pendingDocs = documents.filter((d) => d.status === 'Enviado');

    return {
      totalFamilies,
      functionalGardens,
      plannedGardens,
      maintenanceGardens,
      pcdCount,
      elderlyCount,
      inclusionBeneficiaries,
      childrenUnder5,
      certifiedMultipliers,
      inTrainingMultipliers,
      totalMultipliers: multipliers.length,
      activeClubs,
      totalMuac,
      totalVisits,
      totalRiskReferred,
      riskReferralRate,
      atRiskGoals,
      pendingValidationFamilies,
      pendingValidationMultipliers,
      pendingDocs,
    };
  }, [documents, families, goals, multipliers]);

  const targetComparisonData = useMemo(() => {
    const items = [
      {
        indicator: 'Famílias',
        fullName: 'Famílias Beneficiárias Cadastradas',
        resultado: stats.totalFamilies,
        meta: OFFICIAL_PROJECT_TARGETS.families,
        unit: 'famílias',
      },
      {
        indicator: 'Hortas',
        fullName: 'Hortas Domésticas Funcionais',
        resultado: stats.functionalGardens,
        meta: OFFICIAL_PROJECT_TARGETS.functionalGardens,
        unit: 'hortas',
      },
      {
        indicator: 'PCD/Idosos',
        fullName: 'Inclusão PCD e Idosos',
        resultado: stats.inclusionBeneficiaries,
        meta: OFFICIAL_PROJECT_TARGETS.inclusionPcdElderly,
        unit: 'benef.',
      },
      {
        indicator: 'Multiplicadores',
        fullName: 'Multiplicadores Certificados',
        resultado: stats.certifiedMultipliers,
        meta: OFFICIAL_PROJECT_TARGETS.certifiedMultipliers,
        unit: 'mult.',
      },
      {
        indicator: 'Clubes',
        fullName: 'Clubes NutriFamily Activos',
        resultado: stats.activeClubs,
        meta: OFFICIAL_PROJECT_TARGETS.activeClubs,
        unit: 'clubes',
      },
      {
        indicator: 'Risco US',
        fullName: 'Encaminhamento de Risco Nutricional',
        resultado: stats.riskReferralRate,
        meta: OFFICIAL_PROJECT_TARGETS.riskReferralRate,
        unit: '%',
      },
    ];

    return items.map((item) => ({
      ...item,
      alcancePct: item.meta > 0 ? Math.min(100, Math.round((item.resultado / item.meta) * 100)) : 0,
      metaPct: 100,
    }));
  }, [stats]);

  const distributionData = useMemo(() => {
    if (distributionGroupBy === 'club') {
      return NUTRIFAMILY_CLUBS.map((club) => {
        const clubFamilies = families.filter((f) => f.clubName === club);
        const hortas = clubFamilies.filter(
          (f) => f.gardenStatus === 'Instalada e Funcional' || f.hasBioGarden
        ).length;
        const pcdElderly = clubFamilies.filter((f) => f.hasPcd || f.hasElderly).length;
        return {
          name: club,
          familias: clubFamilies.length,
          hortas,
          pcdElderly,
        };
      });
    }

    const communities = Array.from(
      new Set([...QUELIMANE_COMMUNITIES, ...families.map((f) => f.community)])
    );
    return communities
      .map((community) => {
        const commFamilies = families.filter((f) => f.community === community);
        const hortas = commFamilies.filter(
          (f) => f.gardenStatus === 'Instalada e Funcional' || f.hasBioGarden
        ).length;
        const pcdElderly = commFamilies.filter((f) => f.hasPcd || f.hasElderly).length;
        return {
          name: community,
          familias: commFamilies.length,
          hortas,
          pcdElderly,
        };
      })
      .sort((a, b) => b.familias - a.familias);
  }, [distributionGroupBy, families]);

  const vulnerabilityData = useMemo(() => {
    return [
      { name: 'Crianças 0–5 anos', value: stats.childrenUnder5 },
      { name: 'Pessoas com Deficiência (PCD)', value: stats.pcdCount },
      { name: 'Idosos', value: stats.elderlyCount },
    ];
  }, [stats.childrenUnder5, stats.elderlyCount, stats.pcdCount]);

  const totalVulnerabilityCount = vulnerabilityData.reduce((acc, item) => acc + item.value, 0);

  const monthlyEvolutionData = useMemo(() => {
    const activeActivityMonths = new Set(
      activities.map((a) => parseCalendarMonth(a.activityDate, a.projectMonth))
    );
    const divisor = Math.max(1, activeActivityMonths.size);
    const visitsPerActiveMonth = Math.round(stats.totalVisits / divisor);
    const muacPerActiveMonth = Math.round(stats.totalMuac / divisor);

    let cumulativeFamilies = 0;
    let cumulativeGardens = 0;
    let cumulativeMonitored = 0;

    return CALENDAR_MONTHS.map(({ month, short, label }) => {
      const monthFamilies = families.filter(
        (f) => parseCalendarMonth(f.registrationDate, f.enrolledMonth) === month
      );
      const monthGardens = monthFamilies.filter(
        (f) => f.gardenStatus === 'Instalada e Funcional' || f.hasBioGarden
      ).length;
      const monthActs = activities.filter(
        (a) => parseCalendarMonth(a.activityDate, a.projectMonth) === month
      );
      const monthChildren = monthFamilies.reduce((acc, f) => acc + f.childrenUnder5, 0);

      cumulativeFamilies += monthFamilies.length;
      cumulativeGardens += monthGardens;

      const hasMonthActivity =
        monthActs.length > 0 ||
        monthFamilies.length > 0 ||
        month <= Math.max(6, ...activeActivityMonths);
      const monthlyVisits =
        monthActs.length > 0
          ? visitsPerActiveMonth + monthActs.length * 4
          : monthFamilies.length > 0
          ? monthFamilies.length * 3
          : 0;
      const monthlyCases =
        monthActs.length > 0 ? muacPerActiveMonth + monthChildren : monthChildren;

      if (hasMonthActivity) {
        cumulativeMonitored += monthlyCases;
      }

      return {
        month,
        short,
        label,
        hortasAcumuladas: cumulativeGardens,
        familiasAcumuladas: cumulativeFamilies,
        visitasMes: monthlyVisits,
        casosMonitorizados: cumulativeMonitored,
      };
    });
  }, [activities, families, stats.totalMuac, stats.totalVisits]);

  const handleExportIndicatorsCsv = () => {
    downloadCsv(
      `ANDMoz_Indicadores_NutriFamily_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Indicador Oficial', 'Resultado Alcançado', 'Meta Oficial', 'Unidade', 'Alcance (%)'],
      targetComparisonData.map((row) => [
        row.fullName,
        row.resultado,
        row.meta,
        row.unit,
        `${row.alcancePct}%`,
      ])
    );
  };

  const kpiCards = [
    {
      label: 'Famílias Beneficiárias Cadastradas',
      value: stats.totalFamilies,
      targetLabel: `Meta: ${OFFICIAL_PROJECT_TARGETS.families} famílias`,
      pct: Math.min(100, Math.round((stats.totalFamilies / OFFICIAL_PROJECT_TARGETS.families) * 100)),
      detail: `${stats.childrenUnder5} crianças 0–5 anos · ${stats.pendingValidationFamilies} por validar`,
      icon: Home,
      isWarning: false,
    },
    {
      label: 'Hortas Domésticas Inclusivas Funcionais',
      value: stats.functionalGardens,
      targetLabel: `Meta: ${OFFICIAL_PROJECT_TARGETS.functionalGardens} hortas`,
      pct: Math.min(
        100,
        Math.round((stats.functionalGardens / OFFICIAL_PROJECT_TARGETS.functionalGardens) * 100)
      ),
      detail: `${stats.plannedGardens} planeadas · ${stats.maintenanceGardens} em manutenção`,
      icon: Sprout,
      isWarning: false,
    },
    {
      label: 'Inclusão de PCD e Idosos',
      value: stats.inclusionBeneficiaries,
      targetLabel: `Meta: mín. ${OFFICIAL_PROJECT_TARGETS.inclusionPcdElderly} beneficiários`,
      pct: Math.min(
        100,
        Math.round(
          (stats.inclusionBeneficiaries / OFFICIAL_PROJECT_TARGETS.inclusionPcdElderly) * 100
        )
      ),
      detail: `${stats.pcdCount} Pessoa(s) c/ Deficiência · ${stats.elderlyCount} Idoso(s)`,
      icon: HeartHandshake,
      isWarning: false,
    },
    {
      label: 'Multiplicadores Formados / Certificados',
      value: stats.certifiedMultipliers,
      targetLabel: `Meta: ${OFFICIAL_PROJECT_TARGETS.certifiedMultipliers} multiplicadores`,
      pct: Math.min(
        100,
        Math.round(
          (stats.certifiedMultipliers / OFFICIAL_PROJECT_TARGETS.certifiedMultipliers) * 100
        )
      ),
      detail: `${stats.totalMultipliers} registados (${stats.inTrainingMultipliers} em formação)`,
      icon: Award,
      isWarning: false,
    },
    {
      label: 'Clubes NutriFamily Activos',
      value: stats.activeClubs,
      targetLabel: `Meta: ${OFFICIAL_PROJECT_TARGETS.activeClubs} clubes`,
      pct: Math.min(
        100,
        Math.round((stats.activeClubs / OFFICIAL_PROJECT_TARGETS.activeClubs) * 100)
      ),
      detail: `Cobertura em ${new Set(families.map((f) => f.community)).size} bairros de Quelimane`,
      icon: Users,
      isWarning: false,
    },
    {
      label: 'Encaminhamento Casos de Risco',
      value: `${stats.riskReferralRate}%`,
      targetLabel: `Meta: ${OFFICIAL_PROJECT_TARGETS.riskReferralRate}%`,
      pct: stats.riskReferralRate,
      detail: `${stats.totalRiskReferred} caso(s) encaminhado(s) à US · ${stats.totalMuac} MUAC`,
      icon: ShieldAlert,
      isWarning: stats.riskReferralRate < 100,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header + Highlighted PDF Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Executivo — NutriFamily + (Resultados vs. Metas)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Quelimane, Província da Zambézia · Actualização automática em tempo real
          </p>
        </div>

        {isAdmin && (
          <div className="no-print flex flex-wrap items-center gap-2 shrink-0 relative">
            <button
              type="button"
              onClick={handleExportIndicatorsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV Indicadores</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir</span>
            </button>

            <div className="relative flex items-center">
              <button
                type="button"
                onClick={onExportPdf}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold rounded-l-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Baixar Relatório em PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfMenuOpen((prev) => !prev)}
                aria-label="Mais opções de exportação em PDF"
                aria-expanded={pdfMenuOpen}
                className="inline-flex items-center justify-center px-2.5 py-2 bg-[#256628] hover:bg-[#1E5320] text-white border-l border-white/20 rounded-r-lg transition-colors cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {pdfMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30">
                  <button
                    type="button"
                    onClick={() => {
                      setPdfMenuOpen(false);
                      onExportPdf();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-[#EAF4EB] hover:text-[#2E7D32] flex items-center gap-2 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>Relatório Consolidado do Projecto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfMenuOpen(false);
                      onExportFamiliesPdf();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-[#EAF4EB] hover:text-[#2E7D32] flex items-center gap-2 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>Lista de Famílias (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfMenuOpen(false);
                      onExportMultipliersPdf();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-[#EAF4EB] hover:text-[#2E7D32] flex items-center gap-2 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>Lista de Multiplicadores (PDF)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6 Official KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-slate-600 leading-snug">
                  {kpi.label}
                </span>
                <Icon className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono-num">
                  {kpi.value}
                </span>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {kpi.targetLabel}
                </span>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    kpi.isWarning ? 'bg-[#D97706]' : 'bg-[#2E7D32]'
                  }`}
                  style={{ width: `${kpi.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mt-2">
                <span className="truncate">{kpi.detail}</span>
                <span className="font-mono-num font-semibold text-slate-700 shrink-0">
                  {kpi.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Recharts Charts Module */}
      <DashboardCharts
        targetComparisonData={targetComparisonData}
        comparisonScale={comparisonScale}
        onChangeComparisonScale={setComparisonScale}
        distributionData={distributionData}
        distributionGroupBy={distributionGroupBy}
        onChangeDistributionGroupBy={setDistributionGroupBy}
        vulnerabilityData={vulnerabilityData}
        totalVulnerabilityCount={totalVulnerabilityCount}
        monthlyEvolutionData={monthlyEvolutionData}
      />

      {/* Quick Actions to Admin Areas 2 & 3 + Alerts / Recent Documents */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Central de Relatórios e Documentos Recebidos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {stats.pendingDocs.length} documento(s) aguarda(m) revisão da Administração
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Abrir Central ({documents.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {documents.slice(0, 4).map((d) => (
              <div key={d.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{d.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {d.activityDate} · {d.docType} · {d.community} · {d.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadDataUrlAsFile(d.contentDataUrl, d.fileName)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2E7D32] bg-[#EAF4EB] hover:bg-[#DCEEE0] rounded-md shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Validação Administrativa e Metas em Atenção
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {stats.pendingValidationFamilies} família(s) e{' '}
                {stats.pendingValidationMultipliers} multiplicador(es) por validar
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('admin_editor')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Abrir Espaço de Edição</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.atRiskGoals.length > 0 ? (
            <div className="divide-y divide-slate-200 border border-amber-200 bg-amber-50/50 rounded-lg">
              {stats.atRiskGoals.map((goal) => {
                const pct = Math.round((goal.currentValue / goal.targetValue) * 100);
                return (
                  <div
                    key={goal.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {goal.code} — {goal.title}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {goal.notes || goal.pillar}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-6 sm:pl-0">
                      <span className="text-xs font-semibold text-amber-700 font-mono-num">
                        {goal.currentValue}/{goal.targetValue} {goal.unit} ({pct}%)
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Prazo: Mês {goal.targetMonth}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 border border-[#C8E6C9] bg-[#EAF4EB] rounded-lg text-xs text-[#2E7D32] font-medium">
              Todas as metas do quadro lógico encontram-se no prazo previsto.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onExportFamiliesPdf}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Lista Famílias PDF</span>
            </button>
            <button
              type="button"
              onClick={onExportMultipliersPdf}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Multiplicadores PDF</span>
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#2E7D32] hover:bg-[#256628] rounded-lg cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Consolidado PDF</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
