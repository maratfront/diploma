import React from 'react'
import { NotificationManager } from './Notification.jsx'
import { getEncryptionHistory } from '../utils/storage.js'

function UserProfile({ user, onUserUpdate }) {
  try {
    const [isEditing, setIsEditing] = React.useState(false);
    const [history, setHistory] = React.useState([]);
    const [formData, setFormData] = React.useState({
      email: user?.email || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      patronymic: user?.patronymic || '',
      date_joined: user?.date_joined || '',
      department: user?.department || '',
      student_group: user?.student_group || ''
    });

    React.useEffect(() => {
      if (user) {
        setFormData({
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          patronymic: user.patronymic || '',
          date_joined: user.date_joined || '',
          department: user.department || '',
          student_group: user.student_group || ''
        });
      }
    }, [user]);

    React.useEffect(() => {
      let isMounted = true;

      const loadHistory = async () => {
        const history = await getEncryptionHistory();
        if (!isMounted) return;

        setHistory(history);
      };

      loadHistory();

      return () => {
        isMounted = false;
      };
    }, []);

    const handleSave = async () => {
      try {
        if (!formData.first_name.trim() && !formData.last_name.trim()) {
          throw new Error('Имя и фамилия не могут быть пустыми');
        }
        if (!formData.email.includes('@')) {
          throw new Error('Введите корректный email адрес');
        }

        await onUserUpdate(formData);
        setIsEditing(false);
        NotificationManager.success('Профиль успешно обновлен!');
      } catch (error) {
        console.error('Error updating profile:', error);
        NotificationManager.error('Ошибка обновления профиля: ' + error.message);
      }
    };

    const handleCancel = () => {
      if (user) {
        setFormData({
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          patronymic: user.patronymic || '',
          date_joined: user.date_joined || '',
          department: user.department || '',
          student_group: user.student_group || ''
        });
      }
      setIsEditing(false);
    };

    if (!user) {
      return (
        <div className="space-y-8 max-w-7xl mx-auto" data-name="user-profile" data-file="components/UserProfile.jsx">
          <div className="section-header">
            <h2 className="section-title">Личный кабинет</h2>
            <p className="section-subtitle">
              Загрузка данных профиля...
            </p>
          </div>
          <div className="card">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="icon-loader text-3xl text-[var(--text-secondary)] animate-spin"></div>
              </div>
              <p className="text-[var(--text-secondary)]">Загрузка данных пользователя...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="user-profile" data-file="components/UserProfile.jsx">
        <div className="section-header">
          <h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Личный кабинет</h2>
          <p className="section-subtitle text-base sm:text-lg">
            Управление профилем пользователя и статистикой активности
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="xl:col-span-2">
            <div className="card p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <div className="icon-user text-xl sm:text-2xl text-white"></div>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Профиль пользователя</h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Основная информация о пользователе</p>
                  </div>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="btn-primary w-full sm:w-auto">
                    <div className="icon-edit text-lg mr-2"></div>
                    Редактировать
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <button onClick={handleSave} className="btn-primary w-full sm:w-auto">
                      <div className="icon-check text-lg mr-2"></div>
                      Сохранить
                    </button>
                    <button onClick={handleCancel} className="btn-secondary w-full sm:w-auto">
                      <div className="icon-x text-lg mr-2"></div>
                      Отмена
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Фамилия</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="input-field"
                        placeholder="Введите вашу фамилию"
                      />
                    ) : (
                      <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                        <p className="font-medium text-[var(--text-primary)]">{formData.last_name}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Имя</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="input-field"
                        placeholder="Введите ваше имя"
                      />
                    ) : (
                      <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                        <p className="font-medium text-[var(--text-primary)]">{formData.first_name}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Отчество (при наличии)</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.patronymic}
                        onChange={(e) => setFormData({ ...formData, patronymic: e.target.value })}
                        className="input-field"
                        placeholder="Введите ваше отчество"
                      />
                    ) : (
                      <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                        <p className="font-medium text-[var(--text-primary)]">{formData.patronymic}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Email адрес</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field"
                        placeholder="Введите email"
                      />
                    ) : (
                      <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                        <p className="font-medium text-[var(--text-primary)]">{formData.email}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Факультет</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="input-field"
                        placeholder="Введите факультет"
                      />
                    ) : (
                      <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                        <p className="font-medium text-[var(--text-primary)]">{formData.department}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Группа студента</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.student_group}
                        onChange={(e) => setFormData({ ...formData, student_group: e.target.value })}
                        className="input-field"
                        placeholder="Введите группу"
                      />
                    ) : (
                      <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                        <p className="font-medium text-[var(--text-primary)]">{formData.student_group}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="card-compact p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-3 sm:mb-4">Статистика активности</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-xl">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Операций шифрования</span>
                  <span className="text-lg font-bold text-[var(--primary-color)]">{history.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-xl">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Последний вход</span>
                  <span className="text-sm text-[var(--text-secondary)]">Сегодня</span>
                </div>
              </div>
            </div>



            <div className="card-compact p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-3 sm:mb-4">Дополнительная информация</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Дата регистрации</span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('ru-RU') : 'Неизвестно'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Уровень доступа</span>
                  <span className="text-sm font-semibold text-[var(--accent-color)]">Студент</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Статус аккаунта</span>
                  <span className="text-sm font-semibold text-green-600">Активен</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('UserProfile component error:', error);
    return null;
  }
}

export default UserProfile
