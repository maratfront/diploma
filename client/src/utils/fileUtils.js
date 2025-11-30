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

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = (error) => {
      reject(new Error('Ошибка чтения файла: ' + error.message));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
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