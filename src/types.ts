export type UserRole = 'gestor' | 'administrador';

export interface AppSessionUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  authMode: 'supabase' | 'demo';
  photoURL?: string | null;
}

export type GoalPillar =
  | 'Nutrição Materno-Infantil'
  | 'Inclusão Produtiva & Hortas'
  | 'Resiliência Alimentar & VSLA'
  | 'Capacitação Comunitária';

export type GoalStatus = 'No Prazo' | 'Em Risco' | 'Concluída';

export type NutritionStatus = 'Estável' | 'Acompanhamento Prioritário' | 'Graduada';

export type ClubName =
  | 'Clube 1'
  | 'Clube 2'
  | 'Clube 3'
  | 'Clube 4'
  | 'Clube 5'
  | 'Clube 6'
  | 'Clube 7';

export type GardenStatus = 'Planeada' | 'Instalada e Funcional' | 'Em Manutenção';

export type TrainingStatus = 'Em formação' | 'Certificado';

export type MultiplierSpecialty =
  | 'Nutrição Materno-Infantil'
  | 'Agroecologia & Hortas'
  | 'Poupança & Resiliência (VSLA)';

export type MultiplierStatus = 'Activo' | 'Em Formação' | 'Inactivo';

export type ActivityCategory =
  | 'Demonstração Culinária'
  | 'Rastreio Nutricional (MUAC)'
  | 'Oficina de Horta Biointensiva'
  | 'Formação de Multiplicadores'
  | 'Grupo de Poupança e Resiliência';

export type ActivityStatus = 'Planeado' | 'Submetido' | 'Validado';

export type DocumentType =
  | 'Formação Técnica'
  | 'Instalação de Hortas Inclusivas'
  | 'Alerta Nutri-SMS / Vigilância Nutricional'
  | 'Reunião Clube NutriFamily'
  | 'Lista de Presença'
  | 'Outro';

export type DocumentStatus = 'Enviado' | 'Revisto';

export interface UserWorkspace {
  uid: string;
  displayName: string;
  roleTitle: string;
  seeded: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Goal {
  id: string;
  ownerId: string;
  code: string;
  title: string;
  pillar: GoalPillar;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetMonth: number;
  status: GoalStatus;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Family {
  id: string;
  ownerId: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Multiplier {
  id: string;
  ownerId: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Activity {
  id: string;
  ownerId: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportDocument {
  id: string;
  ownerId: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export const QUELIMANE_COMMUNITIES: string[] = [
  'Chuabo Dembe',
  'Micajune',
  'Coalane',
  'Icídua',
  'Torrone Novo',
  'Sangariveira',
  'Maquival',
  'Namuinho',
];

export const NUTRIFAMILY_CLUBS: ClubName[] = [
  'Clube 1',
  'Clube 2',
  'Clube 3',
  'Clube 4',
  'Clube 5',
  'Clube 6',
  'Clube 7',
];

export const GARDEN_STATUS_OPTIONS: GardenStatus[] = [
  'Planeada',
  'Instalada e Funcional',
  'Em Manutenção',
];

export const GOAL_PILLARS: GoalPillar[] = [
  'Nutrição Materno-Infantil',
  'Inclusão Produtiva & Hortas',
  'Resiliência Alimentar & VSLA',
  'Capacitação Comunitária',
];

export const MULTIPLIER_SPECIALTIES: MultiplierSpecialty[] = [
  'Nutrição Materno-Infantil',
  'Agroecologia & Hortas',
  'Poupança & Resiliência (VSLA)',
];

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'Demonstração Culinária',
  'Rastreio Nutricional (MUAC)',
  'Oficina de Horta Biointensiva',
  'Formação de Multiplicadores',
  'Grupo de Poupança e Resiliência',
];

export const DOCUMENT_TYPES: DocumentType[] = [
  'Formação Técnica',
  'Instalação de Hortas Inclusivas',
  'Alerta Nutri-SMS / Vigilância Nutricional',
  'Reunião Clube NutriFamily',
  'Lista de Presença',
  'Outro',
];

export const PROJECT_MONTHS = [
  { month: 1, label: 'Mês 1', short: 'M1' },
  { month: 2, label: 'Mês 2', short: 'M2' },
  { month: 3, label: 'Mês 3', short: 'M3' },
  { month: 4, label: 'Mês 4', short: 'M4' },
  { month: 5, label: 'Mês 5', short: 'M5' },
  { month: 6, label: 'Mês 6', short: 'M6' },
  { month: 7, label: 'Mês 7', short: 'M7' },
  { month: 8, label: 'Mês 8', short: 'M8' },
  { month: 9, label: 'Mês 9', short: 'M9' },
  { month: 10, label: 'Mês 10', short: 'M10' },
  { month: 11, label: 'Mês 11', short: 'M11' },
  { month: 12, label: 'Mês 12', short: 'M12' },
];

export const CODE_REGEX = /^[A-Z0-9-]+$/;
export const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export function sanitizeCode(raw: string, prefix: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '-').slice(0, 24);
  if (cleaned.length >= 3 && CODE_REGEX.test(cleaned)) {
    return cleaned;
  }
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}

export const OFFICIAL_PROJECT_TARGETS = {
  families: 200,
  functionalGardens: 200,
  inclusionPcdElderly: 60,
  certifiedMultipliers: 50,
  activeClubs: 7,
  riskReferralRate: 100,
} as const;

export function clampText(raw: string, min: number, max: number, fallback: string): string {
  const trimmed = raw.trim().slice(0, max);
  return trimmed.length >= min ? trimmed : fallback.slice(0, max);
}
