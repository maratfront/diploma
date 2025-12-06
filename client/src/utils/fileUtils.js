export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = (error) => {
      reject(new Error('Ошибка чтения файла: ' + error.message));
    };

    reader.readAsText(file);
  });
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target.result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = (error) => {
      reject(new Error('Ошибка чтения файла: ' + error.message));
    };

    reader.readAsDataURL(file);
  });
}

export function downloadFile(content, filename, mimeType = 'text/plain') {
  let blob;

  if (content.startsWith('data:')) {
    const byteCharacters = atob(content.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    blob = new Blob([byteArray], { type: mimeType });
  } else {
    blob = new Blob([content], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function downloadBase64File(base64String, filename, mimeType) {
  const link = document.createElement('a');
  link.href = `data:${mimeType};base64,${base64String}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function validateFileSize(file, maxSizeMB = 10) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

export function isTextFile(file) {
  const textExtensions = ['txt', 'json', 'xml', 'csv', 'js', 'html', 'css', 'md'];
  const extension = getFileExtension(file.name);
  return textExtensions.includes(extension) || file.type.startsWith('text/');
}

export function isBinaryFile(file) {
  const binaryExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif'];
  const extension = getFileExtension(file.name);
  return binaryExtensions.includes(extension) ||
    file.type.startsWith('application/') ||
    file.type.startsWith('image/');
}

export function getMimeType(filename) {
  const extension = getFileExtension(filename);
  const mimeTypes = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif'
  };

  return mimeTypes[extension] || 'application/octet-stream';
}
