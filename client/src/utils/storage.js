import { NotificationManager } from '../components/Notification.jsx'

export function getEncryptionHistory() {
  try {
    const history = localStorage.getItem('encryptionHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error reading encryption history:', error);
    return [];
  }
}

export function addToHistory(operation) {
  try {
    const history = getEncryptionHistory();
    history.unshift(operation);

    if (history.length > 100) {
      history.splice(100);
    }

    localStorage.setItem('encryptionHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

export function exportHistory() {
  try {
    const history = getEncryptionHistory();
    if (history.length === 0) {
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
