import {
  buildLocalDemoSeed,
  SEED_ACTIVITIES,
  SEED_DOCUMENTS,
  SEED_FAMILIES,
  SEED_GOALS,
  SEED_MULTIPLIERS,
} from './seedData';
import { supabase } from './supabaseClient';
import type {
  Activity,
  AppSessionUser,
  ClubName,
  DocumentStatus,
  DocumentType,
  Family,
  GardenStatus,
  Goal,
  Multiplier,
  MultiplierSpecialty,
  MultiplierStatus,
  NutritionStatus,
  ReportDocument,
  TrainingStatus,
} from './types';

export interface DemoStoreState {
  goals: Goal[];
  families: Family[];
  multipliers: Multiplier[];
  activities: Activity[];
  documents: ReportDocument[];
}

export function createInitialMemoryStore(): DemoStoreState {
  return buildLocalDemoSeed('demo_shared');
}

export function createDemoSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ============================================================================
// Mapeadores de linhas do Supabase (PostgreSQL -> Tipos da Aplicação)
// ============================================================================

type DbRow = Record<string, unknown>;

function mapFamilyRow(row: DbRow): Family {
  const gardenStatus = (row.estado_horta as GardenStatus) || 'Planeada';
  const registrationDate = String(row.data_registo || new Date().toISOString().slice(0, 10)).slice(
    0,
    10
  );
  return {
    id: String(row.id),
    ownerId: String(row.criado_por || 'supabase'),
    code: String(row.codigo || 'FAM-QLM-000'),
    headOfHousehold: String(row.chefe_agregado || ''),
    community: String(row.comunidade || 'Chuabo Dembe'),
    clubName: (row.clube as ClubName) || 'Clube 1',
    membersCount: Number(row.membros_agregado ?? 4),
    childrenUnder5: Number(row.criancas_0_5 ?? 0),
    hasPcd: Boolean(row.possui_pcd),
    hasElderly: Boolean(row.possui_idoso),
    gardenStatus,
    dietaryDiversityImproved: Boolean(row.diversidade_alimentar),
    hasBioGarden: gardenStatus === 'Instalada e Funcional',
    inSavingsGroup: Boolean(row.grupo_poupanca),
    multiplierName: String(row.multiplicador_responsavel || 'Rosa da Conceição Mabunda'),
    nutritionStatus: (row.estado_nutricional as NutritionStatus) || 'Estável',
    registrationDate,
    notes: String(row.observacoes || ''),
    enrolledMonth: Number(row.mes_registo || Number(registrationDate.slice(5, 7)) || 1),
    adminValidated: Boolean(row.validado_admin),
  };
}

function mapMultiplierRow(row: DbRow): Multiplier {
  const trainingStatus = (row.estado_formacao as TrainingStatus) || 'Em formação';
  return {
    id: String(row.id),
    ownerId: String(row.criado_por || 'supabase'),
    code: String(row.codigo || 'MC-000'),
    fullName: String(row.nome_completo || ''),
    community: String(row.comunidade || 'Chuabo Dembe'),
    clubName: (row.clube as ClubName) || 'Clube 1',
    specialty: (row.especialidade as MultiplierSpecialty) || 'Nutrição Materno-Infantil',
    phone: String(row.telefone || ''),
    trainingStatus,
    homeVisitsCount: Number(row.visitas_domiciliarias ?? 0),
    muacScreeningsCount: Number(row.triagens_muac ?? 0),
    riskCasesReferred: Number(row.casos_risco_encaminhados ?? 0),
    familiesAssigned: Number(row.familias_atribuidas ?? 0),
    sessionsHeld: Number(row.sessoes_realizadas ?? 0),
    status:
      (row.estado as MultiplierStatus) ||
      (trainingStatus === 'Certificado' ? 'Activo' : 'Em Formação'),
    notes: String(row.observacoes || ''),
    adminValidated: Boolean(row.validado_admin),
  };
}

function mapDocumentRow(row: DbRow): ReportDocument {
  const activityDate = String(row.data_atividade || new Date().toISOString().slice(0, 10)).slice(
    0,
    10
  );
  return {
    id: String(row.id),
    ownerId: String(row.criado_por || 'supabase'),
    title: String(row.titulo || 'Relatório de Actividade'),
    docType: (row.categoria as DocumentType) || 'Outro',
    activityDate,
    community: String(row.comunidade || 'Chuabo Dembe'),
    projectMonth: Number(row.mes_projeto || Number(activityDate.slice(5, 7)) || 1),
    uploadedBy: String(row.enviado_por || 'Gestor de Projectos'),
    uploadedByRole:
      row.perfil_envio === 'Administrador' ? 'Administrador' : 'Gestor de Projectos',
    fileName: String(row.nome_ficheiro || 'documento.txt'),
    mimeType: String(row.mime_type || 'text/plain'),
    fileSizeBytes: Number(row.tamanho_bytes ?? 0),
    contentDataUrl: String(row.conteudo_base64 || ''),
    notes: String(row.resumo || ''),
    status: (row.estado as DocumentStatus) === 'Revisto' ? 'Revisto' : 'Enviado',
  };
}

function familyPayloadToDbRow(
  payload: Omit<Family, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  userId?: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    codigo: payload.code,
    chefe_agregado: payload.headOfHousehold,
    comunidade: payload.community,
    clube: payload.clubName,
    membros_agregado: payload.membersCount,
    criancas_0_5: payload.childrenUnder5,
    possui_pcd: payload.hasPcd,
    possui_idoso: payload.hasElderly,
    estado_horta: payload.gardenStatus,
    diversidade_alimentar: payload.dietaryDiversityImproved,
    grupo_poupanca: payload.inSavingsGroup,
    multiplicador_responsavel: payload.multiplierName,
    estado_nutricional: payload.nutritionStatus,
    data_registo: payload.registrationDate,
    mes_registo: payload.enrolledMonth,
    observacoes: payload.notes,
    validado_admin: payload.adminValidated,
  };
  if (userId) {
    row.criado_por = userId;
  }
  return row;
}

function multiplierPayloadToDbRow(
  payload: Omit<Multiplier, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  userId?: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    codigo: payload.code,
    nome_completo: payload.fullName,
    telefone: payload.phone,
    comunidade: payload.community,
    clube: payload.clubName,
    especialidade: payload.specialty,
    estado_formacao: payload.trainingStatus,
    visitas_domiciliarias: payload.homeVisitsCount,
    triagens_muac: payload.muacScreeningsCount,
    casos_risco_encaminhados: payload.riskCasesReferred,
    familias_atribuidas: payload.familiesAssigned,
    sessoes_realizadas: payload.sessionsHeld,
    estado: payload.status,
    observacoes: payload.notes,
    validado_admin: payload.adminValidated,
  };
  if (userId) {
    row.criado_por = userId;
  }
  return row;
}

function documentPayloadToDbRow(
  payload: Omit<ReportDocument, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  userId?: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    titulo: payload.title,
    categoria: payload.docType,
    data_atividade: payload.activityDate,
    comunidade: payload.community,
    mes_projeto: payload.projectMonth,
    enviado_por: payload.uploadedBy,
    perfil_envio: payload.uploadedByRole,
    nome_ficheiro: payload.fileName,
    mime_type: payload.mimeType,
    tamanho_bytes: payload.fileSizeBytes,
    conteudo_base64: payload.contentDataUrl,
    resumo: payload.notes,
    estado: payload.status,
  };
  if (userId) {
    row.criado_por = userId;
  }
  return row;
}

// ============================================================================
// Carregamento inicial do Supabase (familias, multiplicadores, documentos_atividades)
// ============================================================================

export async function fetchAllSupabaseData(): Promise<{
  families: Family[];
  multipliers: Multiplier[];
  documents: ReportDocument[];
}> {
  const [famRes, multRes, docRes] = await Promise.all([
    supabase.from('familias').select('*').order('created_at', { ascending: false }),
    supabase.from('multiplicadores').select('*').order('created_at', { ascending: false }),
    supabase.from('documentos_atividades').select('*').order('created_at', { ascending: false }),
  ]);

  if (famRes.error) {
    throw new Error(`Erro ao carregar famílias (public.familias): ${famRes.error.message}`);
  }
  if (multRes.error) {
    throw new Error(
      `Erro ao carregar multiplicadores (public.multiplicadores): ${multRes.error.message}`
    );
  }
  if (docRes.error) {
    throw new Error(
      `Erro ao carregar documentos (public.documentos_atividades): ${docRes.error.message}`
    );
  }

  return {
    families: (famRes.data || []).map((row) => mapFamilyRow(row as DbRow)),
    multipliers: (multRes.data || []).map((row) => mapMultiplierRow(row as DbRow)),
    documents: (docRes.data || []).map((row) => mapDocumentRow(row as DbRow)),
  };
}

// ============================================================================
// Metas e Actividades (estado local complementar para planeamento de 12 meses)
// ============================================================================

export async function saveGoalRecord(
  user: AppSessionUser,
  payload: Omit<Goal, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId: string | null,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  onStoreChange((prev) => {
    if (existingId) {
      return {
        ...prev,
        goals: prev.goals.map((g) => (g.id === existingId ? { ...g, ...payload } : g)),
      };
    }
    const newItem: Goal = {
      id: `goal_${createDemoSessionId()}`,
      ownerId: user.uid,
      ...payload,
    };
    return { ...prev, goals: [...prev.goals, newItem] };
  });
}

export async function removeGoalRecord(
  _user: AppSessionUser,
  goalId: string,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  onStoreChange((prev) => ({
    ...prev,
    goals: prev.goals.filter((g) => g.id !== goalId),
  }));
}

export async function saveActivityRecord(
  user: AppSessionUser,
  payload: Omit<Activity, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId: string | null,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  onStoreChange((prev) => {
    if (existingId) {
      return {
        ...prev,
        activities: prev.activities.map((a) => (a.id === existingId ? { ...a, ...payload } : a)),
      };
    }
    const newItem: Activity = {
      id: `act_${createDemoSessionId()}`,
      ownerId: user.uid,
      ...payload,
    };
    return { ...prev, activities: [newItem, ...prev.activities] };
  });
}

export async function removeActivityRecord(
  _user: AppSessionUser,
  activityId: string,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  onStoreChange((prev) => ({
    ...prev,
    activities: prev.activities.filter((a) => a.id !== activityId),
  }));
}

// ============================================================================
// public.familias
// ============================================================================

export async function saveFamilyRecord(
  user: AppSessionUser,
  payload: Omit<Family, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId: string | null,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onStoreChange((prev) => {
      if (existingId) {
        return {
          ...prev,
          families: prev.families.map((f) => (f.id === existingId ? { ...f, ...payload } : f)),
        };
      }
      const newItem: Family = {
        id: `demo_fam_${createDemoSessionId()}`,
        ownerId: user.uid,
        ...payload,
      };
      return { ...prev, families: [newItem, ...prev.families] };
    });
    return;
  }

  if (existingId) {
    const { data, error } = await supabase
      .from('familias')
      .update(familyPayloadToDbRow(payload))
      .eq('id', existingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Não foi possível actualizar a família no Supabase: ${error.message}`);
    }

    const updated = mapFamilyRow(data as DbRow);
    onStoreChange((prev) => ({
      ...prev,
      families: prev.families.map((f) => (f.id === existingId ? updated : f)),
    }));
  } else {
    const { data, error } = await supabase
      .from('familias')
      .insert(familyPayloadToDbRow(payload, user.uid))
      .select()
      .single();

    if (error) {
      throw new Error(`Não foi possível cadastrar a família no Supabase: ${error.message}`);
    }

    const inserted = mapFamilyRow(data as DbRow);
    onStoreChange((prev) => ({
      ...prev,
      families: [inserted, ...prev.families.filter((f) => f.id !== inserted.id)],
    }));
  }
}

export async function removeFamilyRecord(
  user: AppSessionUser,
  familyId: string,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'supabase') {
    const { error } = await supabase.from('familias').delete().eq('id', familyId);
    if (error) {
      throw new Error(`Não foi possível remover a família no Supabase: ${error.message}`);
    }
  }

  onStoreChange((prev) => ({
    ...prev,
    families: prev.families.filter((f) => f.id !== familyId),
  }));
}

// ============================================================================
// public.multiplicadores
// ============================================================================

export async function saveMultiplierRecord(
  user: AppSessionUser,
  payload: Omit<Multiplier, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId: string | null,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onStoreChange((prev) => {
      if (existingId) {
        return {
          ...prev,
          multipliers: prev.multipliers.map((m) =>
            m.id === existingId ? { ...m, ...payload } : m
          ),
        };
      }
      const newItem: Multiplier = {
        id: `demo_mult_${createDemoSessionId()}`,
        ownerId: user.uid,
        ...payload,
      };
      return { ...prev, multipliers: [newItem, ...prev.multipliers] };
    });
    return;
  }

  if (existingId) {
    const { data, error } = await supabase
      .from('multiplicadores')
      .update(multiplierPayloadToDbRow(payload))
      .eq('id', existingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Não foi possível actualizar o multiplicador no Supabase: ${error.message}`);
    }

    const updated = mapMultiplierRow(data as DbRow);
    onStoreChange((prev) => ({
      ...prev,
      multipliers: prev.multipliers.map((m) => (m.id === existingId ? updated : m)),
    }));
  } else {
    const { data, error } = await supabase
      .from('multiplicadores')
      .insert(multiplierPayloadToDbRow(payload, user.uid))
      .select()
      .single();

    if (error) {
      throw new Error(`Não foi possível registar o multiplicador no Supabase: ${error.message}`);
    }

    const inserted = mapMultiplierRow(data as DbRow);
    onStoreChange((prev) => ({
      ...prev,
      multipliers: [inserted, ...prev.multipliers.filter((m) => m.id !== inserted.id)],
    }));
  }
}

export async function removeMultiplierRecord(
  user: AppSessionUser,
  multiplierId: string,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'supabase') {
    const { error } = await supabase.from('multiplicadores').delete().eq('id', multiplierId);
    if (error) {
      throw new Error(`Não foi possível remover o multiplicador no Supabase: ${error.message}`);
    }
  }

  onStoreChange((prev) => ({
    ...prev,
    multipliers: prev.multipliers.filter((m) => m.id !== multiplierId),
  }));
}

// ============================================================================
// public.documentos_atividades
// ============================================================================

export async function createDocumentRecord(
  user: AppSessionUser,
  payload: Omit<ReportDocument, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onStoreChange((prev) => {
      const newItem: ReportDocument = {
        id: `demo_doc_${createDemoSessionId()}`,
        ownerId: user.uid,
        ...payload,
      };
      return { ...prev, documents: [newItem, ...prev.documents] };
    });
    return;
  }

  const { data, error } = await supabase
    .from('documentos_atividades')
    .insert(documentPayloadToDbRow(payload, user.uid))
    .select()
    .single();

  if (error) {
    throw new Error(`Não foi possível enviar o documento para o Supabase: ${error.message}`);
  }

  const inserted = mapDocumentRow(data as DbRow);
  onStoreChange((prev) => ({
    ...prev,
    documents: [inserted, ...prev.documents.filter((d) => d.id !== inserted.id)],
  }));
}

export async function updateDocumentStatus(
  user: AppSessionUser,
  docId: string,
  status: ReportDocument['status'],
  notes: string,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'supabase') {
    const { error } = await supabase
      .from('documentos_atividades')
      .update({ estado: status, resumo: notes })
      .eq('id', docId);

    if (error) {
      throw new Error(`Não foi possível actualizar o documento no Supabase: ${error.message}`);
    }
  }

  onStoreChange((prev) => ({
    ...prev,
    documents: prev.documents.map((d) => (d.id === docId ? { ...d, status, notes } : d)),
  }));
}

export async function removeDocumentRecord(
  user: AppSessionUser,
  docId: string,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'supabase') {
    const { error } = await supabase.from('documentos_atividades').delete().eq('id', docId);
    if (error) {
      throw new Error(`Não foi possível remover o documento no Supabase: ${error.message}`);
    }
  }

  onStoreChange((prev) => ({
    ...prev,
    documents: prev.documents.filter((d) => d.id !== docId),
  }));
}

// ============================================================================
// Restauro / Seed inicial de demonstração (Supabase ou Memória)
// ============================================================================

export async function resetWorkspaceToSeed(
  user: AppSessionUser,
  onStoreChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  const freshSeed = buildLocalDemoSeed(user.uid);

  if (user.authMode === 'demo') {
    onStoreChange(() => freshSeed);
    return;
  }

  // Limpar e repor as 3 tabelas principais do Supabase
  const [delFam, delMult, delDoc] = await Promise.all([
    supabase.from('familias').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('multiplicadores').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase
      .from('documentos_atividades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'),
  ]);

  if (delFam.error) {
    throw new Error(`Erro ao limpar famílias no Supabase: ${delFam.error.message}`);
  }
  if (delMult.error) {
    throw new Error(`Erro ao limpar multiplicadores no Supabase: ${delMult.error.message}`);
  }
  if (delDoc.error) {
    throw new Error(`Erro ao limpar documentos no Supabase: ${delDoc.error.message}`);
  }

  const [insFam, insMult, insDoc] = await Promise.all([
    supabase
      .from('familias')
      .insert(SEED_FAMILIES.map((f) => familyPayloadToDbRow(f, user.uid)))
      .select(),
    supabase
      .from('multiplicadores')
      .insert(SEED_MULTIPLIERS.map((m) => multiplierPayloadToDbRow(m, user.uid)))
      .select(),
    supabase
      .from('documentos_atividades')
      .insert(SEED_DOCUMENTS.map((d) => documentPayloadToDbRow(d, user.uid)))
      .select(),
  ]);

  if (insFam.error) {
    throw new Error(`Erro ao inserir famílias iniciais no Supabase: ${insFam.error.message}`);
  }
  if (insMult.error) {
    throw new Error(`Erro ao inserir multiplicadores iniciais no Supabase: ${insMult.error.message}`);
  }
  if (insDoc.error) {
    throw new Error(`Erro ao inserir documentos iniciais no Supabase: ${insDoc.error.message}`);
  }

  onStoreChange(() => ({
    goals: SEED_GOALS.map((g) => ({ ...g, ownerId: user.uid })),
    activities: SEED_ACTIVITIES.map((a) => ({ ...a, ownerId: user.uid })),
    families: (insFam.data || []).map((row) => mapFamilyRow(row as DbRow)),
    multipliers: (insMult.data || []).map((row) => mapMultiplierRow(row as DbRow)),
    documents: (insDoc.data || []).map((row) => mapDocumentRow(row as DbRow)),
  }));
}
