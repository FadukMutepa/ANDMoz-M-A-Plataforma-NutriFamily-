import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  OFFICIAL_PROJECT_TARGETS,
  type Activity,
  type Family,
  type Goal,
  type Multiplier,
  type ReportDocument,
} from '../types';

interface PdfExportPayload {
  generatedBy: string;
  goals: Goal[];
  families: Family[];
  multipliers: Multiplier[];
  activities: Activity[];
  documents: ReportDocument[];
}

function drawInstitutionalHeader(doc: jsPDF, subtitle: string, generatedBy: string): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const emittedAt = `${now.toLocaleDateString('pt-PT')} às ${now.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  doc.setFillColor(46, 125, 50);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text('ANDMoz — Associação Nutrição em Desenvolvimento | Projecto NutriFamily +', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${subtitle} · Quelimane, Província da Zambézia, Moçambique`, 14, 19);
  doc.text(`Emitido por: ${generatedBy} · Data/Hora de Emissão: ${emittedAt}`, 14, 25);
}

function addPageNumbers(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'ANDMoz M&A — Plataforma NutriFamily + · Documento Oficial de Monitoria e Avaliação',
      14,
      pageHeight - 8
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

function buildOfficialSummaryRows(families: Family[], multipliers: Multiplier[]) {
  const functionalGardens = families.filter(
    (f) => f.gardenStatus === 'Instalada e Funcional' || f.hasBioGarden
  ).length;
  const pcdAndElderlyCount = families.reduce(
    (acc, f) => acc + (f.hasPcd ? 1 : 0) + (f.hasElderly ? 1 : 0),
    0
  );
  const certifiedMultipliers = multipliers.filter(
    (m) => m.trainingStatus === 'Certificado'
  ).length;
  const activeClubs = new Set([
    ...families.map((f) => f.clubName),
    ...multipliers.map((m) => m.clubName),
  ]).size;
  const totalRiskReferred = multipliers.reduce((acc, m) => acc + m.riskCasesReferred, 0);
  const referralRate = totalRiskReferred > 0 ? 100 : 0;

  return [
    [
      'Famílias Beneficiárias Cadastradas',
      `${families.length}`,
      `${OFFICIAL_PROJECT_TARGETS.families} famílias`,
      `${Math.round((families.length / OFFICIAL_PROJECT_TARGETS.families) * 100)}%`,
    ],
    [
      'Hortas Domésticas Inclusivas Funcionais',
      `${functionalGardens}`,
      `${OFFICIAL_PROJECT_TARGETS.functionalGardens} hortas`,
      `${Math.round((functionalGardens / OFFICIAL_PROJECT_TARGETS.functionalGardens) * 100)}%`,
    ],
    [
      'Inclusão de Pessoas com Deficiência (PCD) e Idosos',
      `${pcdAndElderlyCount} (${families.filter((f) => f.hasPcd).length} PCD · ${families.filter((f) => f.hasElderly).length} Idosos)`,
      `Mín. ${OFFICIAL_PROJECT_TARGETS.inclusionPcdElderly} beneficiários`,
      `${Math.round((pcdAndElderlyCount / OFFICIAL_PROJECT_TARGETS.inclusionPcdElderly) * 100)}%`,
    ],
    [
      'Multiplicadores Comunitários Formados / Certificados',
      `${certifiedMultipliers} (${multipliers.length} registados)`,
      `${OFFICIAL_PROJECT_TARGETS.certifiedMultipliers} multiplicadores`,
      `${Math.round((certifiedMultipliers / OFFICIAL_PROJECT_TARGETS.certifiedMultipliers) * 100)}%`,
    ],
    [
      'Clubes NutriFamily Activos',
      `${activeClubs}`,
      `${OFFICIAL_PROJECT_TARGETS.activeClubs} clubes`,
      `${Math.round((activeClubs / OFFICIAL_PROJECT_TARGETS.activeClubs) * 100)}%`,
    ],
    [
      'Encaminhamento de Casos de Risco Nutricional (US)',
      `${totalRiskReferred} caso(s) encaminhado(s)`,
      `${OFFICIAL_PROJECT_TARGETS.riskReferralRate}%`,
      `${referralRate}%`,
    ],
  ];
}

export function exportNutriFamilyPdf({
  generatedBy,
  goals,
  families,
  multipliers,
  documents,
}: PdfExportPayload): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawInstitutionalHeader(doc, 'Relatório Consolidado do Projecto (12 Meses)', generatedBy);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Indicadores Oficiais NutriFamily + (Metas vs. Resultados Alcançados)', 14, 39);

  autoTable(doc, {
    startY: 42,
    head: [['Indicador do Projecto', 'Resultado Alcançado', 'Meta Oficial', 'Alcance']],
    body: buildOfficialSummaryRows(families, multipliers),
    headStyles: { fillColor: [46, 125, 50], fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  const afterSummaryY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Quadro Lógico de Metas de 12 Meses', 14, afterSummaryY + 10);

  autoTable(doc, {
    startY: afterSummaryY + 13,
    head: [['Código', 'Indicador', 'Pilar', 'Realizado / Meta', 'Alcance', 'Estado']],
    body: goals.map((g) => [
      g.code,
      g.title,
      g.pillar,
      `${g.currentValue} / ${g.targetValue} ${g.unit}`,
      `${Math.round((g.currentValue / g.targetValue) * 100)}%`,
      g.status,
    ]),
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  const afterGoalsY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 160;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`3. Famílias Beneficiárias Registadas (${families.length})`, 14, afterGoalsY + 10);

  autoTable(doc, {
    startY: afterGoalsY + 13,
    head: [['Código', 'Responsável', 'Comunidade · Clube', 'Crianças 0–5', 'PCD/Idoso', 'Horta', 'Validação']],
    body: families.map((f) => [
      f.code,
      f.headOfHousehold,
      `${f.community} · ${f.clubName}`,
      String(f.childrenUnder5),
      `${f.hasPcd ? 'PCD' : '-'} / ${f.hasElderly ? 'Idoso' : '-'}`,
      f.gardenStatus,
      f.adminValidated ? 'Validado' : 'Pendente',
    ]),
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`4. Multiplicadores Comunitários (${multipliers.length})`, 14, 18);

  autoTable(doc, {
    startY: 21,
    head: [['Nome Completo', 'Comunidade · Clube', 'Certificação', 'Visitas', 'MUAC', 'Risco US', 'Validação']],
    body: multipliers.map((m) => [
      m.fullName,
      `${m.community} · ${m.clubName}`,
      m.trainingStatus,
      String(m.homeVisitsCount),
      String(m.muacScreeningsCount),
      String(m.riskCasesReferred),
      m.adminValidated ? 'Validado' : 'Pendente',
    ]),
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  const afterMultY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`5. Central de Relatórios e Documentos (${documents.length})`, 14, afterMultY + 10);

  autoTable(doc, {
    startY: afterMultY + 13,
    head: [['Data', 'Título', 'Categoria', 'Comunidade', 'Estado']],
    body: documents.map((d) => [
      d.activityDate,
      d.title,
      d.docType,
      d.community,
      d.status === 'Revisto' ? 'Revisto pela Administração' : 'Enviado pelo Gestor',
    ]),
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  addPageNumbers(doc);
  doc.save(`ANDMoz_NutriFamily_Consolidado_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportFamiliesPdf(generatedBy: string, families: Family[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  drawInstitutionalHeader(doc, 'Lista Oficial de Famílias Beneficiárias', generatedBy);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(
    `Total: ${families.length} famílias · Crianças 0–5: ${families.reduce((a, f) => a + f.childrenUnder5, 0)} · Hortas Funcionais: ${families.filter((f) => f.gardenStatus === 'Instalada e Funcional').length}`,
    14,
    38
  );

  autoTable(doc, {
    startY: 42,
    head: [
      [
        'Código',
        'Chefe de Agregado',
        'Comunidade',
        'Clube',
        'Crianças 0–5',
        'PCD / Idoso',
        'Horta Adaptada',
        'Diversidade',
        'Multiplicador',
        'Validação',
      ],
    ],
    body: families.map((f) => [
      f.code,
      f.headOfHousehold,
      f.community,
      f.clubName,
      String(f.childrenUnder5),
      `${f.hasPcd ? 'PCD' : '-'} / ${f.hasElderly ? 'Idoso' : '-'}`,
      f.gardenStatus,
      f.dietaryDiversityImproved ? 'Sim' : 'Não',
      f.multiplierName,
      f.adminValidated ? 'Validado' : 'Pendente',
    ]),
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  addPageNumbers(doc);
  doc.save(`ANDMoz_NutriFamily_Familias_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportMultipliersPdf(generatedBy: string, multipliers: Multiplier[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawInstitutionalHeader(doc, 'Lista Oficial de Multiplicadores Comunitários', generatedBy);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(
    `Total: ${multipliers.length} multiplicadores · Certificados: ${multipliers.filter((m) => m.trainingStatus === 'Certificado').length} · Triagens MUAC: ${multipliers.reduce((a, m) => a + m.muacScreeningsCount, 0)}`,
    14,
    38
  );

  autoTable(doc, {
    startY: 42,
    head: [
      [
        'Código',
        'Nome Completo',
        'Comunidade · Clube',
        'Contacto',
        'Certificação',
        'Visitas',
        'MUAC',
        'Risco US',
        'Validação',
      ],
    ],
    body: multipliers.map((m) => [
      m.code,
      m.fullName,
      `${m.community} · ${m.clubName}`,
      m.phone,
      m.trainingStatus,
      String(m.homeVisitsCount),
      String(m.muacScreeningsCount),
      String(m.riskCasesReferred),
      m.adminValidated ? 'Validado' : 'Pendente',
    ]),
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });

  addPageNumbers(doc);
  doc.save(`ANDMoz_NutriFamily_Multiplicadores_${new Date().toISOString().slice(0, 10)}.pdf`);
}
