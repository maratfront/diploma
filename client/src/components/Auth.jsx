import React from 'react'
import { AuthService } from '../utils/auth.js'
import ThemeToggle from './ThemeToggle.jsx'
import { NotificationManager } from './Notification.jsx'

function Auth({ onLogin, theme, onToggleTheme }) {
  try {
    const [isLogin, setIsLogin] = React.useState(true);
    const [formData, setFormData] = React.useState({
      email: '',
      first_name: '',
      last_name: '',
      patronymic: '',
      department: '',
      student_group: '',
      password: '',
      confirmPassword: ''
    });
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      try {
        if (!isLogin) {
          if (!formData.first_name.trim() && !formData.last_name.trim()) {
            throw new Error('Введите ваше имя и фамилию');
          }
          if (formData.password.length < 6) {
            throw new Error('Пароль должен содержать минимум 6 символов');
          }
          if (formData.password !== formData.confirmPassword) {
            throw new Error('Пароли не совпадают');
          }
        }

        if (!formData.email.includes('@')) {
          throw new Error('Введите корректный email адрес');
        }

        if (isLogin) {
          const user = await AuthService.login(formData.email, formData.password);
          onLogin(user);
          NotificationManager.success('Добро пожаловать !');
        } else {
          const user = await AuthService.register(formData.first_name, formData.last_name, formData.patronymic, formData.email, formData.password, formData.department, formData.student_group);
          onLogin(user);
          NotificationManager.success('Регистрация успешна! Добро пожаловать!');
        }
      } catch (err) {
        setError(err.message);
        NotificationManager.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const handleInputChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4 sm:p-6" data-name="auth" data-file="components/Auth.jsx">
        <div className="w-full max-w-md">
          <div className="card p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <div className="icon-shield text-2xl sm:text-3xl text-white"></div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text mb-2">CryptoSecure</h1>
              <p className="text-sm sm:text-base text-[var(--text-secondary)]">
                {isLogin ? 'Войдите в систему' : 'Создайте аккаунт'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Введите вашу фамилию"
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Введите ваше имя"
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Отчество (при наличии)
                  </label>
                  <input
                    type="text"
                    name="patronymic"
                    value={formData.patronymic}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Введите ваше отчество"
                  />
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Факультет
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Введите ваш факультет"
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Группа
                  </label>
                  <input
                    type="text"
                    name="student_group"
                    value={formData.student_group}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Укажите группу"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Email адрес
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Введите email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Введите пароль"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Подтвердите пароль
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Повторите пароль"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[var(--primary-color)] hover:underline"
              >
                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Auth component error:', error);
    return null;
  }
}

export default Auth
