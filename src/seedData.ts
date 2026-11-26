import type {
  Activity,
  ActivityCategory,
  ActivityStatus,
  ClubName,
  DocumentStatus,
  DocumentType,
  Family,
  GardenStatus,
  Goal,
  GoalPillar,
  GoalStatus,
  Multiplier,
  MultiplierSpecialty,
  MultiplierStatus,
  NutritionStatus,
  ReportDocument,
  TrainingStatus,
} from './types';

function makeUtf8DataUrl(text: string, mime = 'text/plain;charset=utf-8'): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export interface SeedGoal {
  id: string;
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

export interface SeedMultiplier {
  id: string;
  code: string;
  fullName: string;
  community: string;
  clubName: ClubName;
  specialty: MultiplierSpecialty;
  phone: string;
  trainingStatus: TrainingStatus;
  homeVisitsCount: number;
  muacScreeningsCount: number;
  riskCasesReferred: number;
  familiesAssigned: number;
  sessionsHeld: number;
  status: MultiplierStatus;
  notes: string;
  adminValidated: boolean;
}

export interface SeedFamily {
  id: string;
  code: string;
  headOfHousehold: string;
  community: string;
  clubName: ClubName;
  membersCount: number;
  childrenUnder5: number;
  hasPcd: boolean;
  hasElderly: boolean;
  gardenStatus: GardenStatus;
  dietaryDiversityImproved: boolean;
  hasBioGarden: boolean;
  inSavingsGroup: boolean;
  multiplierName: string;
  nutritionStatus: NutritionStatus;
  registrationDate: string;
  notes: string;
  enrolledMonth: number;
  adminValidated: boolean;
}

export interface SeedActivity {
  id: string;
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

export interface SeedDocument {
  id: string;
  title: string;
  docType: DocumentType;
  activityDate: string;
  community: string;
  projectMonth: number;
  uploadedBy: string;
  uploadedByRole: 'Gestor de Projectos' | 'Administrador';
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  contentDataUrl: string;
  notes: string;
  status: DocumentStatus;
}

export const SEED_GOALS: SeedGoal[] = [
  {
    id: 'goal_01',
    code: 'NF-M01',
    title: 'Famílias inscritas e acompanhadas no programa nutricional',
    pillar: 'Nutrição Materno-Infantil',
    targetValue: 450,
    currentValue: 368,
    unit: 'famílias',
    targetMonth: 12,
    status: 'No Prazo',
    notes: 'Cobertura contínua em 8 bairros prioritários de Quelimane.',
  },
  {
    id: 'goal_02',
    code: 'NF-M02',
    title: 'Rastreios nutricionais MUAC a crianças menores de 5 anos',
    pillar: 'Nutrição Materno-Infantil',
    targetValue: 1200,
    currentValue: 945,
    unit: 'rastreios',
    targetMonth: 12,
    status: 'No Prazo',
    notes: 'Rastreios trimestrais realizados em coordenação com as US locais.',
  },
  {
    id: 'goal_03',
    code: 'NF-M03',
    title: 'Hortas domésticas adaptadas (canteiros elevados) instaladas',
    pillar: 'Inclusão Produtiva & Hortas',
    targetValue: 320,
    currentValue: 214,
    unit: 'hortas',
    targetMonth: 10,
    status: 'Em Risco',
    notes: 'Necessita reforço de kits de rega em Icídua e Maquival devido à estiagem.',
  },
  {
    id: 'goal_04',
    code: 'NF-M04',
    title: 'Demonstrações culinárias com alimentos locais enriquecidos',
    pillar: 'Nutrição Materno-Infantil',
    targetValue: 96,
    currentValue: 82,
    unit: 'sessões',
    targetMonth: 12,
    status: 'No Prazo',
    notes: 'Receitas com moringa, batata-doce de polpa alaranjada e amendoim.',
  },
  {
    id: 'goal_05',
    code: 'NF-M05',
    title: 'Grupos de Poupança e Resiliência (VSLA) em funcionamento',
    pillar: 'Resiliência Alimentar & VSLA',
    targetValue: 24,
    currentValue: 19,
    unit: 'grupos',
    targetMonth: 11,
    status: 'No Prazo',
    notes: 'Ciclos activos de micro-poupança com fundo social de emergência alimentar.',
  },
  {
    id: 'goal_06',
    code: 'NF-M06',
    title: 'Multiplicadores comunitários formados e certificados',
    pillar: 'Capacitação Comunitária',
    targetValue: 30,
    currentValue: 30,
    unit: 'activistas',
    targetMonth: 4,
    status: 'Concluída',
    notes: 'Formação inicial de base concluída no 1.º trimestre em Quelimane.',
  },
  {
    id: 'goal_07',
    code: 'NF-M07',
    title: 'Famílias com melhoria na diversidade alimentar (≥ 5 grupos)',
    pillar: 'Resiliência Alimentar & VSLA',
    targetValue: 80,
    currentValue: 58,
    unit: '%',
    targetMonth: 12,
    status: 'Em Risco',
    notes: 'Monitorização de linha intermédia aponta necessidade de foco no bairro Coalane.',
  },
  {
    id: 'goal_08',
    code: 'NF-M08',
    title: 'Visitas domiciliárias de seguimento pós-alta nutricional',
    pillar: 'Capacitação Comunitária',
    targetValue: 600,
    currentValue: 492,
    unit: 'visitas',
    targetMonth: 12,
    status: 'No Prazo',
    notes: 'Registo mensal assegurado pelos multiplicadores de bairro.',
  },
];

export const SEED_MULTIPLIERS: SeedMultiplier[] = [
  {
    id: 'mult_01',
    code: 'MC-001',
    fullName: 'Rosa da Conceição Mabunda',
    community: 'Chuabo Dembe',
    clubName: 'Clube 1',
    specialty: 'Nutrição Materno-Infantil',
    phone: '+258 84 312 4590',
    trainingStatus: 'Certificado',
    homeVisitsCount: 84,
    muacScreeningsCount: 142,
    riskCasesReferred: 6,
    familiesAssigned: 68,
    sessionsHeld: 24,
    status: 'Activo',
    notes: 'Coordena Clube 1 em Chuabo Dembe com acompanhamento regular a famílias com idosos.',
    adminValidated: true,
  },
  {
    id: 'mult_02',
    code: 'MC-002',
    fullName: 'Sérgio Armando Mucavele',
    community: 'Micajune',
    clubName: 'Clube 2',
    specialty: 'Agroecologia & Hortas',
    phone: '+258 82 549 1120',
    trainingStatus: 'Certificado',
    homeVisitsCount: 72,
    muacScreeningsCount: 118,
    riskCasesReferred: 4,
    familiesAssigned: 62,
    sessionsHeld: 21,
    status: 'Activo',
    notes: 'Especialista na construção de canteiros elevados inclusivos para agregados com PCD.',
    adminValidated: true,
  },
  {
    id: 'mult_03',
    code: 'MC-003',
    fullName: 'Fátima Júlia Nhampossa',
    community: 'Coalane',
    clubName: 'Clube 3',
    specialty: 'Poupança & Resiliência (VSLA)',
    phone: '+258 84 778 9034',
    trainingStatus: 'Certificado',
    homeVisitsCount: 65,
    muacScreeningsCount: 130,
    riskCasesReferred: 8,
    familiesAssigned: 55,
    sessionsHeld: 19,
    status: 'Activo',
    notes: 'Referenciou 8 casos pediátricos para o Centro de Saúde de Coalane.',
    adminValidated: true,
  },
  {
    id: 'mult_04',
    code: 'MC-004',
    fullName: 'Bernardo Luís Sitoe',
    community: 'Icídua',
    clubName: 'Clube 4',
    specialty: 'Agroecologia & Hortas',
    phone: '+258 87 204 6618',
    trainingStatus: 'Certificado',
    homeVisitsCount: 59,
    muacScreeningsCount: 96,
    riskCasesReferred: 3,
    familiesAssigned: 54,
    sessionsHeld: 17,
    status: 'Activo',
    notes: 'Actua nos Clubes 4 e 6 em Icídua e Maquival na assistência técnica a hortas.',
    adminValidated: true,
  },
  {
    id: 'mult_05',
    code: 'MC-005',
    fullName: 'Domingas Alberto Chissano',
    community: 'Torrone Novo',
    clubName: 'Clube 5',
    specialty: 'Nutrição Materno-Infantil',
    phone: '+258 84 910 3342',
    trainingStatus: 'Certificado',
    homeVisitsCount: 78,
    muacScreeningsCount: 126,
    riskCasesReferred: 5,
    familiesAssigned: 64,
    sessionsHeld: 22,
    status: 'Activo',
    notes: 'Responsável pelas sessões Nutri-SMS e demonstrações culinárias no Clube 5.',
    adminValidated: true,
  },
  {
    id: 'mult_06',
    code: 'MC-006',
    fullName: 'Célia Ernesto Macuácua',
    community: 'Sangariveira',
    clubName: 'Clube 7',
    specialty: 'Poupança & Resiliência (VSLA)',
    phone: '+258 86 431 7820',
    trainingStatus: 'Em formação',
    homeVisitsCount: 34,
    muacScreeningsCount: 58,
    riskCasesReferred: 2,
    familiesAssigned: 38,
    sessionsHeld: 11,
    status: 'Em Formação',
    notes: 'Em estágio prático supervisionado de triagem MUAC e registos comunitários.',
    adminValidated: false,
  },
];

export const SEED_FAMILIES: SeedFamily[] = [
  {
    id: 'fam_01',
    code: 'FAM-QLM-001',
    headOfHousehold: 'Marta António Joaquim',
    community: 'Chuabo Dembe',
    clubName: 'Clube 1',
    membersCount: 6,
    childrenUnder5: 2,
    hasPcd: false,
    hasElderly: true,
    gardenStatus: 'Instalada e Funcional',
    dietaryDiversityImproved: true,
    hasBioGarden: true,
    inSavingsGroup: true,
    multiplierName: 'Rosa da Conceição Mabunda',
    nutritionStatus: 'Estável',
    registrationDate: '2026-01-22',
    notes: 'Canteiro elevado em pleno rendimento com couve, moringa e tomate.',
    enrolledMonth: 1,
    adminValidated: true,
  },
  {
    id: 'fam_02',
    code: 'FAM-QLM-002',
    headOfHousehold: 'Helena Samuel Vicente',
    community: 'Micajune',
    clubName: 'Clube 2',
    membersCount: 5,
    childrenUnder5: 2,
    hasPcd: true,
    hasElderly: false,
    gardenStatus: 'Instalada e Funcional',
    dietaryDiversityImproved: true,
    hasBioGarden: true,
    inSavingsGroup: true,
    multiplierName: 'Sérgio Armando Mucavele',
    nutritionStatus: 'Graduada',
    registrationDate: '2026-02-04',
    notes: 'Agregado inclusivo (PCD); horta adaptada em canteiro elevado com fácil acesso.',
    enrolledMonth: 2,
    adminValidated: true,
  },
  {
    id: 'fam_03',
    code: 'FAM-QLM-003',
    headOfHousehold: 'Beatriz Manuel Elias',
    community: 'Coalane',
    clubName: 'Clube 3',
    membersCount: 7,
    childrenUnder5: 3,
    hasPcd: false,
    hasElderly: true,
    gardenStatus: 'Planeada',
    dietaryDiversityImproved: false,
    hasBioGarden: false,
    inSavingsGroup: true,
    multiplierName: 'Fátima Júlia Nhampossa',
    nutritionStatus: 'Acompanhamento Prioritário',
    registrationDate: '2026-03-10',
    notes: 'Aguarda entrega de estacas e cobertura morta para montagem do canteiro.',
    enrolledMonth: 3,
    adminValidated: true,
  },
  {
    id: 'fam_04',
    code: 'FAM-QLM-004',
    headOfHousehold: 'Lúcia Francisco Ernesto',
    community: 'Icídua',
    clubName: 'Clube 4',
    membersCount: 4,
    childrenUnder5: 1,
    hasPcd: false,
    hasElderly: false,
    gardenStatus: 'Em Manutenção',
    dietaryDiversityImproved: true,
    hasBioGarden: true,
    inSavingsGroup: false,
    multiplierName: 'Bernardo Luís Sitoe',
    nutritionStatus: 'Estável',
    registrationDate: '2026-04-06',
    notes: 'Em manutenção de estrutura de madeira e reforço de rega gota-a-gota.',
    enrolledMonth: 4,
    adminValidated: true,
  },
  {
    id: 'fam_05',
    code: 'FAM-QLM-005',
    headOfHousehold: 'Joana Pedro Carlos',
    community: 'Torrone Novo',
    clubName: 'Clube 5',
    membersCount: 8,
    childrenUnder5: 2,
    hasPcd: true,
    hasElderly: true,
    gardenStatus: 'Instalada e Funcional',
    dietaryDiversityImproved: true,
    hasBioGarden: true,
    inSavingsGroup: true,
    multiplierName: 'Domingas Alberto Chissano',
    nutritionStatus: 'Estável',
    registrationDate: '2026-05-14',
    notes: 'Agregado com idoso e criança PCD; participa activamente nas sessões Nutri-SMS.',
    enrolledMonth: 5,
    adminValidated: true,
  },
  {
    id: 'fam_06',
    code: 'FAM-QLM-006',
    headOfHousehold: 'Anabela Augusto Mateus',
    community: 'Sangariveira',
    clubName: 'Clube 7',
    membersCount: 5,
    childrenUnder5: 2,
    hasPcd: false,
    hasElderly: false,
    gardenStatus: 'Planeada',
    dietaryDiversityImproved: false,
    hasBioGarden: false,
    inSavingsGroup: false,
    multiplierName: 'Célia Ernesto Macuácua',
    nutritionStatus: 'Acompanhamento Prioritário',
    registrationDate: '2026-06-18',
    notes: 'Criança de 18 meses em vigilância MUAC quinzenal.',
    enrolledMonth: 6,
    adminValidated: false,
  },
  {
    id: 'fam_07',
    code: 'FAM-QLM-007',
    headOfHousehold: 'Teresa Alberto Simão',
    community: 'Maquival',
    clubName: 'Clube 6',
    membersCount: 6,
    childrenUnder5: 1,
    hasPcd: false,
    hasElderly: true,
    gardenStatus: 'Instalada e Funcional',
    dietaryDiversityImproved: true,
    hasBioGarden: true,
    inSavingsGroup: true,
    multiplierName: 'Bernardo Luís Sitoe',
    nutritionStatus: 'Graduada',
    registrationDate: '2026-07-09',
    notes: 'Consumo diário de 5+ grupos alimentares confirmado na última visita.',
    enrolledMonth: 7,
    adminValidated: true,
  },
  {
    id: 'fam_08',
    code: 'FAM-QLM-008',
    headOfHousehold: 'Amélia José Domingos',
    community: 'Namuinho',
    clubName: 'Clube 1',
    membersCount: 4,
    childrenUnder5: 1,
    hasPcd: false,
    hasElderly: false,
    gardenStatus: 'Instalada e Funcional',
    dietaryDiversityImproved: true,
    hasBioGarden: true,
    inSavingsGroup: true,
    multiplierName: 'Rosa da Conceição Mabunda',
    nutritionStatus: 'Estável',
    registrationDate: '2026-08-19',
    notes: 'Horta doméstica produtiva com batata-doce de polpa alaranjada.',
    enrolledMonth: 8,
    adminValidated: true,
  },
  {
    id: 'fam_09',
    code: 'FAM-QLM-009',
    headOfHousehold: 'Graça Paulo Filipe',
    community: 'Coalane',
    clubName: 'Clube 3',
    membersCount: 6,
    childrenUnder5: 2,
    hasPcd: true,
    hasElderly: false,
    gardenStatus: 'Em Manutenção',
    dietaryDiversityImproved: false,
    hasBioGarden: false,
    inSavingsGroup: true,
    multiplierName: 'Fátima Júlia Nhampossa',
    nutritionStatus: 'Acompanhamento Prioritário',
    registrationDate: '2026-09-12',
    notes: 'Necessita apoio técnico para reposição de composto orgânico no canteiro.',
    enrolledMonth: 9,
    adminValidated: false,
  },
  {
    id: 'fam_10',
    code: 'FAM-QLM-010',
    headOfHousehold: 'Cláudia Raimundo Lucas',
    community: 'Chuabo Dembe',
    clubName: 'Clube 1',
    membersCount: 5,
    childrenUnder5: 1,
    hasPcd: false,
    hasElderly: false,
    gardenStatus: 'Instalada e Funcional',
    dietaryDiversityImproved: true,
    hasBioGarden: true,
    inSavingsGroup: true,
    multiplierName: 'Rosa da Conceição Mabunda',
    nutritionStatus: 'Graduada',
    registrationDate: '2026-10-05',
    notes: 'Família modelo no Clube 1; apoia vizinhos na preparação de papas enriquecidas.',
    enrolledMonth: 10,
    adminValidated: true,
  },
];

export const SEED_ACTIVITIES: SeedActivity[] = [
  {
    id: 'act_01',
    title: 'Levantamento de linha de base e cadastro familiar em Chuabo Dembe',
    category: 'Rastreio Nutricional (MUAC)',
    community: 'Chuabo Dembe',
    activityDate: '2026-01-18',
    projectMonth: 1,
    multiplierName: 'Rosa da Conceição Mabunda',
    womenCount: 42,
    menCount: 14,
    childrenCount: 58,
    summary: 'Cadastro inicial de 42 agregados e triagem antropométrica infantil com fita MUAC.',
    status: 'Validado',
  },
  {
    id: 'act_02',
    title: 'Seminário de certificação de multiplicadores comunitários ANDMoz',
    category: 'Formação de Multiplicadores',
    community: 'Torrone Novo',
    activityDate: '2026-02-11',
    projectMonth: 2,
    multiplierName: 'Domingas Alberto Chissano',
    womenCount: 20,
    menCount: 10,
    childrenCount: 0,
    summary: 'Capacitação técnica de 30 activistas em nutrição comunitária, agroecologia e registo M&A.',
    status: 'Validado',
  },
  {
    id: 'act_03',
    title: 'Instalação de canteiros biointensivos e viveiro de moringa',
    category: 'Oficina de Horta Biointensiva',
    community: 'Micajune',
    activityDate: '2026-03-15',
    projectMonth: 3,
    multiplierName: 'Sérgio Armando Mucavele',
    womenCount: 35,
    menCount: 18,
    childrenCount: 12,
    summary: 'Montagem de 28 canteiros demonstrativos com cobertura morta e compostagem orgânica.',
    status: 'Validado',
  },
  {
    id: 'act_04',
    title: 'Demonstração culinária de papas fortificadas com folha de moringa',
    category: 'Demonstração Culinária',
    community: 'Coalane',
    activityDate: '2026-04-21',
    projectMonth: 4,
    multiplierName: 'Fátima Júlia Nhampossa',
    womenCount: 48,
    menCount: 6,
    childrenCount: 34,
    summary: 'Preparação participativa de refeições ricas em micronutrientes para crianças dos 6 aos 24 meses.',
    status: 'Validado',
  },
  {
    id: 'act_05',
    title: 'Constituição de 4 novos grupos de poupança e crédito comunitário',
    category: 'Grupo de Poupança e Resiliência',
    community: 'Sangariveira',
    activityDate: '2026-05-19',
    projectMonth: 5,
    multiplierName: 'Célia Ernesto Macuácua',
    womenCount: 52,
    menCount: 12,
    childrenCount: 0,
    summary: 'Formação de comités de gestão e entrega de caixas de poupança com três cadeados.',
    status: 'Validado',
  },
  {
    id: 'act_06',
    title: 'Jornada de rastreio nutricional e encaminhamento pediátrico',
    category: 'Rastreio Nutricional (MUAC)',
    community: 'Icídua',
    activityDate: '2026-06-14',
    projectMonth: 6,
    multiplierName: 'Bernardo Luís Sitoe',
    womenCount: 56,
    menCount: 15,
    childrenCount: 79,
    summary: 'Avaliação de 79 crianças; identificação e seguimento de 5 casos com risco moderado.',
    status: 'Validado',
  },
  {
    id: 'act_07',
    title: 'Oficina de multiplicação de rama de batata-doce polpa alaranjada',
    category: 'Oficina de Horta Biointensiva',
    community: 'Maquival',
    activityDate: '2026-07-22',
    projectMonth: 7,
    multiplierName: 'Bernardo Luís Sitoe',
    womenCount: 39,
    menCount: 21,
    childrenCount: 8,
    summary: 'Distribuição de estacas resistentes à seca a 45 famílias produtoras.',
    status: 'Validado',
  },
  {
    id: 'act_08',
    title: 'Feira comunitária de receitas locais e higiene alimentar',
    category: 'Demonstração Culinária',
    community: 'Namuinho',
    activityDate: '2026-08-17',
    projectMonth: 8,
    multiplierName: 'Rosa da Conceição Mabunda',
    womenCount: 64,
    menCount: 19,
    childrenCount: 45,
    summary: 'Troca de saberes culinários entre mães-modelo e demonstração de conservação solar.',
    status: 'Validado',
  },
  {
    id: 'act_09',
    title: 'Avaliação intercalar dos grupos VSLA e fundo de segurança alimentar',
    category: 'Grupo de Poupança e Resiliência',
    community: 'Coalane',
    activityDate: '2026-09-25',
    projectMonth: 9,
    multiplierName: 'Fátima Júlia Nhampossa',
    womenCount: 61,
    menCount: 14,
    childrenCount: 0,
    summary: 'Auditoria participativa das cadernetas de poupança com taxa de reembolso de 98%.',
    status: 'Validado',
  },
  {
    id: 'act_10',
    title: 'Reciclagem de multiplicadores em registo digital e visitas domiciliárias',
    category: 'Formação de Multiplicadores',
    community: 'Micajune',
    activityDate: '2026-10-16',
    projectMonth: 10,
    multiplierName: 'Sérgio Armando Mucavele',
    womenCount: 22,
    menCount: 11,
    childrenCount: 0,
    summary: 'Sessão de alinhamento trimestral e revisão de fichas de acompanhamento familiar.',
    status: 'Submetido',
  },
  {
    id: 'act_11',
    title: 'Rastreio de seguimento nutricional e graduação de famílias modelo',
    category: 'Rastreio Nutricional (MUAC)',
    community: 'Chuabo Dembe',
    activityDate: '2026-11-12',
    projectMonth: 11,
    multiplierName: 'Rosa da Conceição Mabunda',
    womenCount: 54,
    menCount: 16,
    childrenCount: 67,
    summary: 'Reavaliação antropométrica mostrando melhoria de peso/idade em 91% das crianças.',
    status: 'Submetido',
  },
  {
    id: 'act_12',
    title: 'Sessão de encerramento anual e partilha de resultados comunitários',
    category: 'Grupo de Poupança e Resiliência',
    community: 'Torrone Novo',
    activityDate: '2026-12-08',
    projectMonth: 12,
    multiplierName: 'Domingas Alberto Chissano',
    womenCount: 70,
    menCount: 25,
    childrenCount: 30,
    summary: 'Planeamento da distribuição de dividendos VSLA e consolidação do relatório final.',
    status: 'Planeado',
  },
];

const docText1 = `ANDMoz - Associação Nutrição em Desenvolvimento
Relatório de Formação Técnica - Clube 2 Micajune
Data da Actividade: 2026-10-16
Responsável: Carlos Machava (Gestor de Projectos)

Resumo:
- Sessão prática de capacitação dos multiplicadores em visitas domiciliárias e uso da fita MUAC.
- Revisão das fichas de acompanhamento de 62 famílias.`;

const docText2 = `Comunidade;Criancas_Avaliadas;Verde_Normal;Amarelo_Risco_Moderado;Encaminhadas_US
Chuabo Dembe;67;61;5;1
Coalane;48;41;6;1
Icídua;54;49;4;1`;

const docText3 = `Lista de Presença - Reunião Clube NutriFamily 3 (Coalane)
Data: 2026-11-05
Multiplicadora: Fátima Júlia Nhampossa
Total Participantes: 54 adultos e 34 crianças acompanhadas.`;

export const SEED_DOCUMENTS: SeedDocument[] = [
  {
    id: 'doc_01',
    title: 'Relatório de Formação Técnica — Multiplicadores de Micajune',
    docType: 'Formação Técnica',
    activityDate: '2026-10-16',
    community: 'Micajune',
    projectMonth: 10,
    uploadedBy: 'Carlos Machava',
    uploadedByRole: 'Gestor de Projectos',
    fileName: 'Relatorio_Formacao_Tecnica_Micajune.txt',
    mimeType: 'text/plain',
    fileSizeBytes: docText1.length,
    contentDataUrl: makeUtf8DataUrl(docText1),
    notes: 'Capacitação técnica de multiplicadores em registo digital e vigilância MUAC.',
    status: 'Revisto',
  },
  {
    id: 'doc_02',
    title: 'Boletim Alerta Nutri-SMS e Triagem MUAC — Novembro',
    docType: 'Alerta Nutri-SMS / Vigilância Nutricional',
    activityDate: '2026-11-12',
    community: 'Chuabo Dembe',
    projectMonth: 11,
    uploadedBy: 'Carlos Machava',
    uploadedByRole: 'Gestor de Projectos',
    fileName: 'Alerta_NutriSMS_MUAC_Novembro.csv',
    mimeType: 'text/csv',
    fileSizeBytes: docText2.length,
    contentDataUrl: makeUtf8DataUrl(docText2, 'text/csv;charset=utf-8'),
    notes: 'Consolidado de rastreios e casos encaminhados à Unidade Sanitária.',
    status: 'Enviado',
  },
  {
    id: 'doc_03',
    title: 'Lista de Presença — Reunião Clube NutriFamily 3 (Coalane)',
    docType: 'Lista de Presença',
    activityDate: '2026-11-05',
    community: 'Coalane',
    projectMonth: 11,
    uploadedBy: 'Carlos Machava',
    uploadedByRole: 'Gestor de Projectos',
    fileName: 'Lista_Presenca_Clube3_Coalane.txt',
    mimeType: 'text/plain',
    fileSizeBytes: docText3.length,
    contentDataUrl: makeUtf8DataUrl(docText3),
    notes: 'Registo de presenças da reunião mensal do Clube NutriFamily 3.',
    status: 'Enviado',
  },
];

export function buildLocalDemoSeed(ownerId = 'demo_shared'): {
  goals: Goal[];
  families: Family[];
  multipliers: Multiplier[];
  activities: Activity[];
  documents: ReportDocument[];
} {
  return {
    goals: SEED_GOALS.map((g) => ({ ...g, ownerId })),
    families: SEED_FAMILIES.map((f) => ({ ...f, ownerId })),
    multipliers: SEED_MULTIPLIERS.map((m) => ({ ...m, ownerId })),
    activities: SEED_ACTIVITIES.map((a) => ({ ...a, ownerId })),
    documents: SEED_DOCUMENTS.map((d) => ({ ...d, ownerId })),
  };
}
