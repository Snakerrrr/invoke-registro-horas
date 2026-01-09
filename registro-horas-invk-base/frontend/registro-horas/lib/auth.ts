// Tipos actualizados para coincidir con tu backend
export type AuthUser = {
  id: string
  name: string
  email: string
  role: "consultor" | "administrador"
  role_id: number
  token: string
  lastLogin?: string
  authSource?: "backend" | "demo" // Track authentication source
}

export type LoginCredentials = {
  email: string
  password: string
  rememberMe?: boolean
}

export type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// URL del backend (configurable)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"

// Test credentials for demonstration
const TEST_CREDENTIALS = {
  "admin@demo.com": {
    password: "admin123",
    user: {
      id: "demo-admin-1",
      name: "Administrador Demo",
      email: "admin@demo.com",
      role: "administrador" as const,
      role_id: 2,
      token: "demo-admin-token-" + Date.now(),
    },
  },
  "consultor@demo.com": {
    password: "consultor123",
    user: {
      id: "demo-consultor-1",
      name: "Consultor Demo",
      email: "consultor@demo.com",
      role: "consultor" as const,
      role_id: 1,
      token: "demo-consultor-token-" + Date.now(),
    },
  },
  "juan@empresa.com": {
    password: "password123",
    user: {
      id: "demo-consultor-2",
      name: "Juan Pérez",
      email: "juan@empresa.com",
      role: "consultor" as const,
      role_id: 1,
      token: "demo-consultor-token-" + Date.now(),
    },
  },
  "ana@empresa.com": {
    password: "adminPass2024",
    user: {
      id: "demo-admin-2",
      name: "Ana García",
      email: "ana@empresa.com",
      role: "administrador" as const,
      role_id: 2,
      token: "demo-admin-token-" + Date.now(),
    },
  },
}

// Validación de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validación de contraseña
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una letra mayúscula")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una letra minúscula")
  }
  if (!/\d/.test(password)) {
    errors.push("Debe contener al menos un número")
  }

  return { isValid: errors.length === 0, errors }
}

// Authenticate with test credentials
const authenticateWithTestCredentials = async (
  email: string,
  password: string,
): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const testCred = TEST_CREDENTIALS[email as keyof typeof TEST_CREDENTIALS]

  if (!testCred || testCred.password !== password) {
    return { success: false, error: "Credenciales de prueba inválidas" }
  }

  const authUser: AuthUser = {
    ...testCred.user,
    lastLogin: new Date().toISOString(),
    authSource: "demo",
  }

  return { success: true, user: authUser }
}

// Authenticate with backend
const authenticateWithBackend = async (
  email: string,
  password: string,
): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  try {
    console.log("🔗 Intentando autenticación con backend para:", email)

    const response = await fetch(`${BACKEND_URL}/api/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const data = await response.json()
    console.log("📥 Respuesta completa del backend:", data)

    if (!response.ok) {
      console.error("❌ Error en respuesta del backend:", data)
      return {
        success: false,
        error: data.message || "Credenciales inválidas",
      }
    }

    // Debug: Mostrar los datos del usuario recibidos
    console.log("👤 Datos del usuario recibidos:", data.user)
    console.log("🔑 Role recibido del backend:", data.user.role)

    // Validar que el role sea válido
    const backendRole = data.user.role
    if (backendRole !== "administrador" && backendRole !== "consultor") {
      console.error("❌ Role inválido recibido del backend:", backendRole)
      return {
        success: false,
        error: "Role de usuario inválido",
      }
    }

    // Mapear role string a role_id para compatibilidad interna
    const role_id = backendRole === "administrador" ? 2 : 1

    console.log("✅ Role mapeado:", backendRole, "-> role_id:", role_id)

    // Crear objeto de usuario
    const authUser: AuthUser = {
      id: data.user.id.toString(),
      name: data.user.name,
      email: data.user.email,
      role: backendRole, // Usar directamente el role del backend
      role_id: role_id, // Mapear para compatibilidad
      token: data.token,
      lastLogin: new Date().toISOString(),
      authSource: "backend",
    }

    console.log("🎯 Usuario final creado:", authUser)
    console.log("🎯 Rol final asignado:", authUser.role)
    console.log("🎯 Role ID final asignado:", authUser.role_id)

    return { success: true, user: authUser }
  } catch (error) {
    console.error("💥 Error de conexión con backend:", error)
    return {
      success: false,
      error: "Error de conexión con el servidor",
    }
  }
}

// Función principal de autenticación (híbrida)
export const authenticateUser = async (
  credentials: LoginCredentials,
): Promise<{
  success: boolean
  user?: AuthUser
  error?: string
}> => {
  const { email, password } = credentials

  console.log("🚀 Iniciando autenticación para:", email)

  // Validación básica
  if (!email || !password) {
    return { success: false, error: "Email y contraseña son requeridos" }
  }

  if (!validateEmail(email)) {
    return { success: false, error: "Formato de email inválido" }
  }

  // Check if it's a test credential first
  const isTestCredential = email in TEST_CREDENTIALS

  if (isTestCredential) {
    console.log("🎭 Usando credenciales de prueba para:", email)
    return await authenticateWithTestCredentials(email, password)
  }

  // Try backend authentication
  console.log("🔗 Intentando autenticación con backend para:", email)
  const backendResult = await authenticateWithBackend(email, password)

  if (backendResult.success) {
    console.log("✅ Autenticación exitosa con backend")
    console.log("👤 Usuario autenticado:", backendResult.user)
    return backendResult
  }

  console.log("❌ Falló autenticación con backend")
  // If backend fails, provide helpful error message
  return {
    success: false,
    error: "Credenciales inválidas. Verifica tu email y contraseña, o usa las credenciales de prueba.",
  }
}

// Check if user is using demo credentials
export const isDemoUser = (user: AuthUser | null): boolean => {
  return user?.authSource === "demo"
}

// Get authentication source label
export const getAuthSourceLabel = (user: AuthUser | null): string => {
  if (!user) return ""
  return user.authSource === "demo" ? "Modo Demo" : "Backend"
}

// Gestión de sesión
export const getStoredAuth = (): AuthUser | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem("invoke_auth") || sessionStorage.getItem("invoke_auth")
    if (!stored) {
      console.log("📭 No hay datos de autenticación almacenados")
      return null
    }

    const parsed = JSON.parse(stored)
    console.log("📥 Datos de autenticación recuperados:", parsed.user)
    console.log("📥 Rol recuperado:", parsed.user.role)

    // Verificar expiración (24 horas)
    const sessionAge = Date.now() - new Date(parsed.timestamp).getTime()
    if (sessionAge > 24 * 60 * 60 * 1000) {
      console.log("⏰ Sesión expirada, limpiando datos")
      localStorage.removeItem("invoke_auth")
      sessionStorage.removeItem("invoke_auth")
      return null
    }

    return parsed.user
  } catch (error) {
    console.error("💥 Error al recuperar datos de autenticación:", error)
    return null
  }
}

export const storeAuth = (user: AuthUser, rememberMe = false): void => {
  if (typeof window === "undefined") return

  console.log("💾 Almacenando autenticación para usuario:", user.name)
  console.log("💾 Rol a almacenar:", user.role)
  console.log("💾 Role ID a almacenar:", user.role_id)

  const authData = {
    user,
    timestamp: new Date().toISOString(),
    rememberMe,
  }

  if (rememberMe) {
    localStorage.setItem("invoke_auth", JSON.stringify(authData))
    console.log("💾 Guardado en localStorage")
  } else {
    sessionStorage.setItem("invoke_auth", JSON.stringify(authData))
    console.log("💾 Guardado en sessionStorage")
  }

  // Verificar que se guardó correctamente
  const verification = rememberMe ? localStorage.getItem("invoke_auth") : sessionStorage.getItem("invoke_auth")

  if (verification) {
    const verifiedData = JSON.parse(verification)
    console.log("✅ Verificación de almacenamiento exitosa. Rol guardado:", verifiedData.user.role)
  } else {
    console.error("❌ Error: No se pudo verificar el almacenamiento")
  }
}

export const clearAuth = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("invoke_auth")
  sessionStorage.removeItem("invoke_auth")
}

export const logoutUser = async (): Promise<void> => {
  clearAuth()
}

// Función para obtener el token del usuario autenticado
export const getAuthToken = (): string | null => {
  const user = getStoredAuth()
  return user?.token || null
}

// Función helper para hacer requests autenticados
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  const user = getStoredAuth()

  // For demo users, we might want to handle requests differently
  if (user?.authSource === "demo") {
    console.log("🎭 Demo user making request to:", url)
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  })
}

// Password-reset (stub)
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
  if (!validateEmail(email)) {
    return { success: false, error: "Formato de email inválido" }
  }

  // Check if it's a test credential
  if (email in TEST_CREDENTIALS) {
    await new Promise((r) => setTimeout(r, 1000))
    return { success: true }
  }

  // For backend users, you could implement real password reset
  await new Promise((r) => setTimeout(r, 1000))
  return { success: true }
}
