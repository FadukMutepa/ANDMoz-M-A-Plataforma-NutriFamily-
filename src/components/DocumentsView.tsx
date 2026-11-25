import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  createDocumentRecord,
  removeDocumentRecord,
  updateDocumentStatus,
  type DemoStoreState,
} from '../dataStore';
import {
  clampText,
  DATE_REGEX,
  DOCUMENT_TYPES,
  QUELIMANE_COMMUNITIES,
  type AppSessionUser,
  type DocumentType,
  type ReportDocument,
} from '../types';
import {
  dataUrlToBlob,
  downloadDataUrlAsFile,
  readFileAsDataUrl,
} from '../utils/fileHelpers';

interface DocumentsViewProps {
  user: AppSessionUser;
  documents: ReportDocument[];
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void;
}

function encodeTextToDataUrl(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:text/plain;charset=utf-8;base64,${btoa(binary)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

export function DocumentsView({ user, documents, onDemoChange }: DocumentsViewProps) {
  const isAdmin = user.role === 'administrador';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [adminShowUpload, setAdminShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ReportDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<ReportDocument | null>(null);

  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('Formação Técnica');
  const [activityDate, setActivityDate] = useState(todayIsoDate);
  const [community, setCommunity] = useState(QUELIMANE_COMMUNITIES[0]);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents
      .filter((d) => {
        if (typeFilter !== 'Todos' && d.docType !== typeFilter) return false;
        if (dateFilter && d.activityDate !== dateFilter) return false;
        if (statusFilter !== 'Todos' && d.status !== statusFilter) return false;
        if (
          q &&
          !d.title.toLowerCase().includes(q) &&
          !d.fileName.toLowerCase().includes(q) &&
          !d.community.toLowerCase().includes(q) &&
          !d.uploadedBy.toLowerCase().includes(q) &&
          !d.notes.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.activityDate.localeCompare(a.activityDate));
  }, [dateFilter, documents, search, statusFilter, typeFilter]);

  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewDoc) {
      setPreviewObjectUrl(null);
      return;
    }
    if (previewDoc.mimeType === 'application/pdf') {
      const blob = dataUrlToBlob(previewDoc.contentDataUrl);
      const url = URL.createObjectURL(blob);
      setPreviewObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewObjectUrl(null);
    return undefined;
  }, [previewDoc]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > 450 * 1024) {
      setFormError('O ficheiro excede o limite máximo de 450 KB para envio directo na plataforma.');
      setSelectedFile(null);
      return;
    }
    setFormError(null);
    try {
      const result = await readFileAsDataUrl(file);
      setSelectedFile({
        name: file.name.slice(0, 160),
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: result,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Não foi possível ler o ficheiro seleccionado.'
      );
      setSelectedFile(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setFormError('Indique o título do relatório ou documento.');
      return;
    }

    const safeDate = DATE_REGEX.test(activityDate) ? activityDate : todayIsoDate();
    setSaving(true);
    setFormError(null);

    const fallbackSummary = `ANDMoz M&A — Plataforma NutriFamily +\nTítulo: ${title.trim()}\nCategoria: ${docType}\nData da Actividade: ${safeDate}\nComunidade: ${community}\nSubmetido por: ${user.displayName}\nResumo Descritivo:\n${notes.trim() || 'Registo submetido sem observações adicionais.'}`;
    const filePayload = selectedFile || {
      name: `${title.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}.txt`,
      type: 'text/plain',
      size: fallbackSummary.length,
      dataUrl: encodeTextToDataUrl(fallbackSummary),
    };

    try {
      await createDocumentRecord(
        user,
        {
          title: clampText(title, 3, 160, 'Relatório de Actividade'),
          docType,
          activityDate: safeDate,
          community,
          projectMonth: monthFromIsoDate(safeDate),
          uploadedBy: clampText(user.displayName, 2, 120, 'Gestor de Projectos'),
          uploadedByRole: isAdmin ? 'Administrador' : 'Gestor de Projectos',
          fileName: clampText(filePayload.name, 3, 160, 'relatorio.txt'),
          mimeType: clampText(filePayload.type, 3, 100, 'text/plain'),
          fileSizeBytes: Math.max(1, Math.min(500000, filePayload.size)),
          contentDataUrl: filePayload.dataUrl.slice(0, 650000),
          notes: notes.trim().slice(0, 600),
          status: isAdmin ? 'Revisto' : 'Enviado',
        },
        onDemoChange
      );

      setTitle('');
      setNotes('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSuccessNotice('Relatório submetido: Enviado e Disponível para Administração.');
      window.setTimeout(() => setSuccessNotice(null), 4500);
      if (isAdmin) {
        setAdminShowUpload(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReviewed = async (docItem: ReportDocument) => {
    await updateDocumentStatus(user, docItem.id, 'Revisto', docItem.notes, onDemoChange);
  };

  const handleDelete = async () => {
    if (!deletingDoc || !isAdmin) return;
    await removeDocumentRecord(user, deletingDoc.id, onDemoChange);
    setDeletingDoc(null);
  };

  const showInlineForm = !isAdmin || adminShowUpload;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isAdmin
              ? 'Relatórios e Documentos de Actividades'
              : 'Envio de Relatórios e Documentos de Actividades'}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isAdmin
              ? 'Consulte, visualize e descarregue todos os documentos e fotos enviados pelo Gestor de Projectos'
              : 'Submeta relatórios, listas de presença e fotos de campo para consulta imediata da Administração'}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setAdminShowUpload((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{adminShowUpload ? 'Ocultar Formulário' : 'Enviar Documento'}</span>
          </button>
        )}
      </div>

      {/* Inline Submission Form */}
      {showInlineForm && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-[#F8FAF9] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Submissão de Relatório ou Comprovativo de Actividade
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suporta PDF, DOCX, XLSX, CSV e fotografias de campo até 450 KB
              </p>
            </div>
            <span className="text-xs font-medium text-[#2E7D32] whitespace-nowrap shrink-0">
              Secção 3 de 3
            </span>
          </div>

          <form onSubmit={(e) => void handleUploadSubmit(e)} className="p-6 space-y-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Título do Relatório / Documento *
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Instalação de Canteiros Elevados — Clube 2 (Micajune)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Data da Actividade *
                </label>
                <input
                  type="date"
                  required
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Categoria da Actividade *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#2E7D32]"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Comunidade / Localidade *
                </label>
                <select
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
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

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Resumo Descritivo do que foi Realizado *
              </label>
              <textarea
                rows={3}
                required
                maxLength={600}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva os resultados alcançados, participantes envolvidos e evidências recolhidas no terreno..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Upload de Ficheiro (PDF, DOCX, XLSX, CSV ou imagens/fotos de campo até 450 KB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
                onChange={(e) => void handleFileChange(e)}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-medium file:bg-[#F8FAF9] file:text-slate-700 hover:file:bg-[#EAF4EB] cursor-pointer"
              />
              {selectedFile ? (
                <p className="text-[11px] text-[#2E7D32] mt-1.5 font-mono-num">
                  Ficheiro anexado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Caso não seleccione um ficheiro externo, será gerado automaticamente um comprovativo descarregável com o resumo acima.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2E7D32] hover:bg-[#256628] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{saving ? 'A submeter...' : 'Enviar Relatório para Administração'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar título, ficheiro ou comunidade..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filtrar por categoria"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#2E7D32]"
          >
            <option value="Todos">Todas as categorias</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filtrar por data da actividade"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 font-mono-num focus:outline-none focus:border-[#2E7D32]"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="px-2.5 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {['Todos', 'Enviado', 'Revisto'].map((st) => (
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
              {st === 'Enviado' ? 'Disponível p/ Admin' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Document History List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Histórico de Relatórios e Documentos ({filtered.length})
          </h3>
          <span className="text-xs text-slate-500">
            Visualização e descarga directa disponíveis
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">
              Nenhum relatório ou documento encontrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAF9] text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 min-w-[240px]">Relatório &amp; Ficheiro</th>
                  <th className="py-3 px-4 whitespace-nowrap">Categoria · Data</th>
                  <th className="py-3 px-4 whitespace-nowrap">Comunidade</th>
                  <th className="py-3 px-4 whitespace-nowrap">Submetido por</th>
                  <th className="py-3 px-4 whitespace-nowrap">Estado</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((docItem) => {
                  const canPreview =
                    docItem.mimeType.startsWith('image/') ||
                    docItem.mimeType === 'application/pdf' ||
                    docItem.mimeType.startsWith('text/');

                  return (
                    <tr key={docItem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-medium text-slate-900">{docItem.title}</p>
                        <p className="text-xs text-slate-500 font-mono-num mt-0.5">
                          {docItem.fileName} · {formatFileSize(docItem.fileSizeBytes)}
                        </p>
                        {docItem.notes && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {docItem.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap align-top">
                        <span className="block font-medium">{docItem.docType}</span>
                        <span className="text-slate-500 font-mono-num">
                          {docItem.activityDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap align-top">
                        {docItem.community}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap align-top">
                        <span className="block font-medium text-slate-800">
                          {docItem.uploadedBy}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {docItem.uploadedByRole}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        {docItem.status === 'Revisto' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2E7D32]">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Revisto pela Administração
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            Enviado e Disponível para Administração
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                        <div className="inline-flex items-center gap-1.5">
                          {canPreview && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(docItem)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              downloadDataUrlAsFile(docItem.contentDataUrl, docItem.fileName)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar</span>
                          </button>

                          {isAdmin && docItem.status !== 'Revisto' && (
                            <button
                              type="button"
                              onClick={() => void handleMarkReviewed(docItem)}
                              className="px-2.5 py-1 text-xs font-medium text-[#2E7D32] bg-[#EAF4EB] hover:bg-[#DCEEE0] rounded-md cursor-pointer"
                            >
                              Marcar Revisto
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingDoc(docItem)}
                              aria-label={`Remover ${docItem.title}`}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900 truncate">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono-num">
                  {previewDoc.fileName} · {previewDoc.docType} · {previewDoc.activityDate}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    downloadDataUrlAsFile(previewDoc.contentDataUrl, previewDoc.fileName)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2E7D32] hover:bg-[#256628] rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descarregar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  aria-label="Fechar pré-visualização"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto bg-[#F8FAF9] flex-1">
              {previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={previewDoc.contentDataUrl}
                  alt={previewDoc.title}
                  className="max-w-full max-h-[65vh] mx-auto rounded-lg border border-slate-200 bg-white"
                />
              ) : previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewObjectUrl || previewDoc.contentDataUrl}
                  title={previewDoc.title}
                  className="w-full h-[65vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {previewDoc.notes || previewDoc.title}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation (Admin Only) */}
      {deletingDoc && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Confirmar Remoção de Documento
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem a certeza que pretende remover{' '}
              <span className="font-semibold text-slate-900">{deletingDoc.title}</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
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
