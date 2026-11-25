export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length > 0) {
        resolve(reader.result);
      } else {
        reject(new Error('Não foi possível ler o conteúdo do ficheiro.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Erro ao carregar o ficheiro seleccionado no navegador.'));
    };
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  if (!dataUrl.startsWith('data:')) {
    return new Blob([dataUrl], { type: 'text/plain;charset=utf-8' });
  }

  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    return new Blob([dataUrl], { type: 'application/octet-stream' });
  }

  const header = dataUrl.slice(5, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);
  const mime = header.split(';')[0] || 'application/octet-stream';
  const isBase64 = header.includes(';base64');

  if (!isBase64) {
    return new Blob([decodeURIComponent(payload)], { type: mime });
  }

  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function downloadDataUrlAsFile(dataUrl: string, fileName: string): void {
  const blob = dataUrlToBlob(dataUrl);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName || 'documento_nutrifamily';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
