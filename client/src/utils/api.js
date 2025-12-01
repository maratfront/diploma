const API_BASE = 'http://127.0.0.1:8000/api';
const SECURITY_API_BASE = `${API_BASE}/security`;

async function authorizedRequest(path, options = {}) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${API_BASE}${path}`;

  const res = await fetch(url, {
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
    }
    throw new Error(detail);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export async function authorizedPost(path, body = {}) {
  return authorizedRequest(`${SECURITY_API_BASE}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function authorizedGet(path) {
  return authorizedRequest(`${SECURITY_API_BASE}${path}`, {
    method: 'GET',
  });
}

export async function fetchAlgorithms() {
  return authorizedGet('/algorithm-comparison/');
}

export async function fetchWebImplementations() {
  return authorizedGet('/web-implementations/');
}

export async function fetchCryptoCategories() {
  return authorizedGet('/crypto-categories/');
}

export async function fetchCryptoAlgorithms() {
  return authorizedGet('/crypto-algorithms/');
}

export { API_BASE, SECURITY_API_BASE };
