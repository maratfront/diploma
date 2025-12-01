export class AuthService {
  static async login(email, password) {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!res.ok) {
        throw new Error('Ошибка авторизации');
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.access);

      const userData = await this.getCurrentUser();
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(first_name, last_name, patronymic, email, password, department, student_group) {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: first_name,
          last_name: last_name,
          patronymic: patronymic,
          email: email,
          password: password,
          department: department,
          student_group: student_group
        })
      });

      if (!res.ok) {
        throw new Error('Ошибка регистрации');
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.access);

      const userData = await this.getCurrentUser();
      return userData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static logout() {
    localStorage.removeItem('accessToken');
  }

  static isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }

  static async updateUser(userData) {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/user/update/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(userData)
      });

      if (!res.ok) {
        throw new Error('Ошибка обновления данных пользователя');
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Updating user data error:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!res.ok) {
        throw new Error('Ошибка получения данных пользователя');
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Fetching user data error:', error);
      throw error;
    }
  }
}
