export class NotificationManager {
  static show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    notification.innerHTML = `
      <div class="notification-content">
        <div class="icon-${icons[type]} notification-icon"></div>
        <span class="notification-message">${message}</span>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <div class="icon-x"></div>
      </button>
    `;

    container.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('notification-show');
    }, 10);

    if (duration > 0) {
      setTimeout(() => {
        notification.classList.remove('notification-show');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
  }

  static success(message) {
    this.show(message, 'success');
  }

  static error(message) {
    this.show(message, 'error', 5000);
  }

  static warning(message) {
    this.show(message, 'warning', 4000);
  }

  static info(message) {
    this.show(message, 'info');
  }
}

window.NotificationManager = NotificationManager;
