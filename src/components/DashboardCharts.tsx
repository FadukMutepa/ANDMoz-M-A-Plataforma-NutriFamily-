import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface TargetComparisonPoint {
  indicator: string;
  fullName: string;
  resultado: number;
  meta: number;
  unit: string;
  alcancePct: number;
  metaPct: number;
}

export interface DistributionPoint {
  name: string;
  familias: number;
  hortas: number;
  pcdElderly: number;
}

export interface VulnerabilityPoint {
  name: string;
  value: number;
}

export interface MonthlyEvolutionPoint {
  month: number;
  short: string;
  label: string;
  hortasAcumuladas: number;
  familiasAcumuladas: number;
  visitasMes: number;
  casosMonitorizados: number;
}

interface DashboardChartsProps {
  targetComparisonData: TargetComparisonPoint[];
  comparisonScale: 'percent' | 'absolute';
  onChangeComparisonScale: (scale: 'percent' | 'absolute') => void;
  distributionData: DistributionPoint[];
  distributionGroupBy: 'community' | 'club';
  onChangeDistributionGroupBy: (groupBy: 'community' | 'club') => void;
  vulnerabilityData: VulnerabilityPoint[];
  totalVulnerabilityCount: number;
  monthlyEvolutionData: MonthlyEvolutionPoint[];
}

const VULNERABILITY_COLORS = ['#2E7D32', '#D97706', '#0284C7'] as const;

export function DashboardCharts({
  targetComparisonData,
  comparisonScale,
  onChangeComparisonScale,
  distributionData,
  distributionGroupBy,
  onChangeDistributionGroupBy,
  vulnerabilityData,
  totalVulnerabilityCount,
  monthlyEvolutionData,
}: DashboardChartsProps) {
  return (
    <>
      {/* Row 1: Comparative Bar Chart (Meta vs Resultado) + Vulnerability Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Meta do Projecto vs. Resultado Alcançado por Indicador
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparação directa face às metas oficiais do NutriFamily + (12 meses)
              </p>
            </div>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start shrink-0">
              <button
                type="button"
                onClick={() => onChangeComparisonScale('percent')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  comparisonScale === 'percent'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Alcance (%)
              </button>
              <button
                type="button"
                onClick={() => onChangeComparisonScale('absolute')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  comparisonScale === 'absolute'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Valores Reais
              </button>
            </div>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={targetComparisonData}
                margin={{ top: 8, right: 12, left: -12, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="indicator"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit={comparisonScale === 'percent' ? '%' : ''}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as TargetComparisonPoint;
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs space-y-1">
                        <p className="font-semibold text-slate-900">{row.fullName}</p>
                        <p className="text-[#2E7D32] font-mono-num">
                          Resultado Alcançado: {row.resultado} {row.unit}
                        </p>
                        <p className="text-slate-600 font-mono-num">
                          Meta Oficial: {row.meta} {row.unit}
                        </p>
                        <p className="text-slate-900 font-semibold font-mono-num">
                          Alcance: {row.alcancePct}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey={comparisonScale === 'percent' ? 'alcancePct' : 'resultado'}
                  name="Resultado Alcançado"
                  fill="#2E7D32"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey={comparisonScale === 'percent' ? 'metaPct' : 'meta'}
                  name="Meta do Projecto"
                  fill="#CBD5E1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Vulnerability Profile Donut */}
        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Perfil de Vulnerabilidade</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crianças 0–5 anos, Pessoas com Deficiência (PCD) e Idosos nas famílias
            </p>

            <div className="h-52 w-full min-w-0 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vulnerabilityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={3}
                  >
                    {vulnerabilityData.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={VULNERABILITY_COLORS[idx % VULNERABILITY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} pessoa(s) / registo(s)`, 'Total']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            {vulnerabilityData.map((item, idx) => {
              const pct =
                totalVulnerabilityCount > 0
                  ? Math.round((item.value / totalVulnerabilityCount) * 100)
                  : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{
                        backgroundColor: VULNERABILITY_COLORS[idx % VULNERABILITY_COLORS.length],
                      }}
                    />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    {item.value} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Row 2: Distribution by Community/Club + 12-Month Evolution (Jan–Dez) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Distribuição de Famílias e Hortas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cobertura territorial em Quelimane e por Clube NutriFamily
              </p>
            </div>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start shrink-0">
              <button
                type="button"
                onClick={() => onChangeDistributionGroupBy('community')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  distributionGroupBy === 'community'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Comunidade
              </button>
              <button
                type="button"
                onClick={() => onChangeDistributionGroupBy('club')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  distributionGroupBy === 'club'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Clubes (1–7)
              </button>
            </div>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={95}
                  tick={{ fill: '#334155', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="familias"
                  name="Famílias"
                  fill="#4CAF50"
                  radius={[0, 4, 4, 0]}
                  barSize={10}
                />
                <Bar
                  dataKey="hortas"
                  name="Hortas Funcionais"
                  fill="#2E7D32"
                  radius={[0, 4, 4, 0]}
                  barSize={10}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6 min-w-0">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">
              Evolução Mensal (Janeiro a Dezembro)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crescimento de hortas funcionais, famílias cadastradas, visitas e casos monitorizados
            </p>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyEvolutionData}
                margin={{ top: 8, right: 12, left: -12, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="short"
                  tick={{ fill: '#475569', fontSize: 11 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fill: '#D97706', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as MonthlyEvolutionPoint;
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs space-y-1">
                        <p className="font-semibold text-slate-900">{row.label}</p>
                        <p className="text-[#2E7D32] font-mono-num">
                          Hortas Funcionais (acum.): {row.hortasAcumuladas}
                        </p>
                        <p className="text-[#4CAF50] font-mono-num">
                          Famílias Cadastradas (acum.): {row.familiasAcumuladas}
                        </p>
                        <p className="text-amber-700 font-mono-num">
                          Visitas no Mês: {row.visitasMes}
                        </p>
                        <p className="text-sky-700 font-mono-num">
                          Casos Monitorizados (acum.): {row.casosMonitorizados}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="familiasAcumuladas"
                  name="Famílias (acum.)"
                  stroke="#4CAF50"
                  fill="#EAF4EB"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="hortasAcumuladas"
                  name="Hortas Funcionais (acum.)"
                  stroke="#2E7D32"
                  fill="#C8E6C9"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="visitasMes"
                  name="Visitas no Mês"
                  stroke="#D97706"
                  fill="transparent"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="casosMonitorizados"
                  name="Casos Monitorizados (acum.)"
                  stroke="#0284C7"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  );
}
