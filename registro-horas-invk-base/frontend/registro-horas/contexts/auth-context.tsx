"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  authenticateUser,
  logoutUser,
  getStoredAuth,
  storeAuth,
  type LoginCredentials,
  type AuthState,
} from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  const router = useRouter()
  const { toast } = useToast()

  const checkAuth = () => {
    console.log("🔍 Verificando autenticación almacenada...")
    const storedUser = getStoredAuth()

    if (storedUser) {
      console.log("✅ Usuario encontrado en almacenamiento:", storedUser.name)
      console.log("✅ Rol del usuario almacenado:", storedUser.role)
    } else {
      console.log("❌ No se encontró usuario almacenado")
    }

    setAuthState({
      user: storedUser,
      isAuthenticated: !!storedUser,
      isLoading: false,
      error: null,
    })
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    console.log("🔐 Iniciando proceso de login...")
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await authenticateUser(credentials)
      console.log("🔐 Resultado de autenticación:", result)

      if (result.success && result.user) {
        console.log("✅ Login exitoso para usuario:", result.user.name)
        console.log("✅ Rol del usuario:", result.user.role)
        console.log("✅ Role ID del usuario:", result.user.role_id)

        storeAuth(result.user, credentials.rememberMe || false)

        const newAuthState = {
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }

        console.log("🔄 Actualizando estado de autenticación:", newAuthState)
        setAuthState(newAuthState)

        toast({
          title: "¡Bienvenido!",
          description: `Hola ${result.user.name}, has iniciado sesión como ${result.user.role === "administrador" ? "Administrador" : "Consultor"}.`,
        })

        router.push("/")
        return { success: true }
      } else {
        console.error("❌ Error en login:", result.error)
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Error de autenticación",
        }))
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error("💥 Error inesperado en login:", error)
      const errorMessage = "Error de conexión. Intenta de nuevo."
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      await logoutUser()
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      })

      router.push("/login")
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
