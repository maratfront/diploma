import { NotificationManager } from '../components/Notification.jsx'

const API_BASE = 'http://127.0.0.1:8000/api';

async function authorizedRequest(path, options = {}) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = 'Ошибка запроса к серверу';
    try {
      const data = await res.json();
      if (data && data.detail) {
        detail = data.detail;
      }
    } catch (e) {
      // ignore parse error
    }
    throw new Error(detail);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export async function getEncryptionHistory() {
  try {
    const data = await authorizedRequest('/security/history/', {
      method: 'GET',
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading encryption history from server:', error);
    NotificationManager.error('Не удалось загрузить историю операций');
    return [];
  }
}

export async function addToHistory(operation) {
  try {
    await authorizedRequest('/security/history/', {
      method: 'POST',
      body: JSON.stringify({
        type: operation.type,
        algorithm: operation.algorithm,
        input: operation.input,
        output: operation.output,
      }),
    });
  } catch (error) {
    console.error('Error saving operation to history on server:', error);
    // Не блокируем UX, просто логируем и показываем уведомление
    NotificationManager.warning('Операция выполнена, но не удалось сохранить её в историю');
  }
}

export function exportHistory(history) {
  try {
    if (!history || history.length === 0) {
      NotificationManager.info('История пуста, нечего экспортировать');
      return;
    }

    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `encryption_history_${Date.now()}.json`;
    link.click();

    NotificationManager.success('История экспортирована успешно!');
  } catch (error) {
    console.error('Error exporting history:', error);
    NotificationManager.error('Ошибка экспорта истории');
  }
}

export async function clearHistoryOnServer() {
  try {
    await authorizedRequest('/security/history/', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error clearing history on server:', error);
    throw error;
  }
}
