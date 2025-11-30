const API_BASE_URL = "http://127.0.0.1:8000/api";

//token JWT
// Récupérer le token d'accès depuis localStorage
function getAuthHeaders() {
  const token = localStorage.getItem("accessToken"); // 👈 même nom que dans login

  if (!token) {
    console.warn("Aucun accessToken trouvé dans le localStorage");
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,  // 👈 important : "Bearer " + token
  };
}


async function apiGet(endpoint, auth = false) {
  const headers = {
    "Content-Type": "application/json",
    ...(auth ? getAuthHeaders() : {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

  if (!response.ok) {
    console.error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    throw new Error(`Échec du chargement ${endpoint}`);
  }

  return response.json();
}
//-----------------------------------------------------
async function apiPost(endpoint, body, auth = false) {
  const headers = {
    "Content-Type": "application/json",
    ...(auth ? getAuthHeaders() : {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  // si la réponse n'est pas JSON (ex: 204 no content), on évite une erreur
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message =
      data?.detail || data?.error || `Erreur ${response.status} sur ${endpoint}`;

    if (!data?.detail && !data?.error && typeof data === "object" && data !== null) {
      const firstKey = Object.keys(data)[0];
      const firstVal = data[firstKey];
      if (Array.isArray(firstVal) && firstVal.length > 0) {
        message = firstVal[0]; // ex : "customer with this email already exists."
      }
    }

    throw new Error(message);
  }

  return data;
}

//-----------------------------------------------------
export async function getCategories() {
  return apiGet("/categories/");
}

export async function getProducts() {
  return apiGet("/products/");
}

export async function getLimitedProducts(limit = 6) {
  const products = await apiGet("/products/");
  return products.slice(2, limit);
}

export async function getProductById(id) {
  return apiGet(`/products/${id}/`);
}

export async function getProductsWithFilters(categoryId = null, search = null) {
  const params = new URLSearchParams();
  if (categoryId) params.append("category", categoryId);
  if (search) params.append("search", search);
  const query = params.toString();
  const endpoint = query ? `/products/?${query}` : "/products/";
  return apiGet(endpoint);
}





export function signupCustomer(payload) {
  // payload attendu :
  // {
  //   full_name: "...",
  //   email: "...",
  //   password: "...",
  //   phone: "...",
  //   address: "..."
  // }
  return apiPost("/customers/signup/", payload);
}

export async function getMyProfile() {
  // /api/customers/me/ avec JWT
  return apiGet("/customers/me/", true);  // true = envoie Authorization: Bearer ...
}


// Login : POST /api/customers/login/
export async function loginWithJWT( username, password) {
  const payload = {
    username: username,   // SimpleJWT attend "username"
    password: password,
  };

  // 1) Récupérer les tokens
  const tokens = await apiPost("/auth/token/", payload, false);
  // tokens = { access: "...", refresh: "..." }

  // 2) Les stocker
  localStorage.setItem("accessToken", tokens.access);
  localStorage.setItem("refreshToken", tokens.refresh);

  // 3) Récupérer le profil du client connecté
  const profile = await getMyProfile();

  return {
    user_id: profile.user_id ?? profile.userId ?? profile.user,   // selon ton serializer
    customer_id: profile.customer_id ?? profile.id,
    full_name: profile.full_name,
    email: profile.email,
  };
}


// Récupérer toutes les notifications du user connecté
export async function getNotifications() {
  return apiGet("/notifications/",true);
}

// Marquer une notification comme lue
export async function markNotificationRead(id) {
  return apiPost(`/notifications/${id}/read/`, {}, true);
}


// 🧾 Créer une commande à partir du panier
export async function createOrderFromCart(items) {
  // items: [{ product_id, quantity }]
  return apiPost("/orders/create/", { items }, true); 
}

export async function getOrderById(orderId) {
  return apiGet(`/orders/${orderId}/`, true); // true => auth avec JWT
}