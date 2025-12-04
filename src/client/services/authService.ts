/**
 * Servicio de autenticación
 * Maneja las llamadas a los endpoints de registro e inicio de sesión
 */

const API_URL = "http://localhost:3000";

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  profileImage?: string; 
}

interface AuthResponse {
  message: string;
  user: User;
  token?: string;  // JWT devuelto por el servidor en login
}

export const authService = {
  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al registrarse");
    }

    return response.json();
  },

  /**
   * Inicia sesión con un usuario existente
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al iniciar sesión");
    }

    return response.json();
  },

  /**
   * Actualiza la imagen de perfil del usuario
   */
  async updateProfileImage(username: string, profileImage: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${username}/profile-image`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ profileImage }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al actualizar imagen de perfil");
    }

    const data: AuthResponse = await response.json();
    this.saveUser(data.user);

    return data.user;
  },

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(
    currentUsername: string,
    changes: { username?: string; email?: string }
  ): Promise<User> {
    const response = await fetch(`${API_URL}/users/${currentUsername}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(changes),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "UPDATE_ERROR");
    }

    const data: AuthResponse = await response.json();
    if (data.token) {
      this.saveToken(data.token);
    }
    this.saveUser(data.user);

    return data.user;
  },

  /**
   * Elimina la imagen de perfil del usuario
   */
  async deleteProfileImage(username: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${username}/profile-image`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al eliminar foto de perfil");
    }

    this.saveUser(data.user);
    return data.user;
  },
  /**
   * Elimina la cuenta del usuario
   */
  async deleteAccount(username: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${username}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error eliminando cuenta");
    }

    // Eliminar usuario del localStorage
    this.logout();
  },


  /**
   * Guarda el usuario en localStorage
   */
  saveUser(user: User): void {
    const savedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage ?? ""
    };

    localStorage.setItem("user", JSON.stringify(savedUser));
    localStorage.setItem("isAuthenticated", "true");
  },

  /**
   * Obtiene el usuario del localStorage
   */
  getUser(): User | null {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  /**
   * Guarda el token JWT en localStorage
   */
  saveToken(token: string): void {
    localStorage.setItem("token", token);
  },

  /**
   * Obtiene el token JWT del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem("token");
  },

  /**
   * Retorna headers con el token para peticiones autenticadas
   */
  getAuthHeaders(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    // Verificar que existe tanto el usuario como el token
    const hasUser = localStorage.getItem("isAuthenticated") === "true";
    const hasToken = this.getToken() !== null;
    return hasUser && hasToken;
  },

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");  // Limpiar JWT también
  },
};
