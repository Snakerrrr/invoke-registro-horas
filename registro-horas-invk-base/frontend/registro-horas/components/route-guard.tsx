"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Zap } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredRole?: "administrador" | "consultor"
  adminOnly?: boolean
}

export function RouteGuard({ children, requireAuth = true, requiredRole, adminOnly = false }: RouteGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Define admin-only routes
  const adminOnlyRoutes = [
    "/dashboard/registros-admin",
    "/dashboard/gestion-usuarios",
    "/dashboard/gestion-parametros",
    "/dashboard/usuarios-pendientes",
    "/dashboard/horas-por-usuario",
    "/dashboard/configuracion",
  ]

  useEffect(() => {
    if (isLoading) return

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // If specific role is required but user doesn't have it
    if (requiredRole && user && user.role !== requiredRole) {
      router.push("/unauthorized")
      return
    }

    // Check if consultant is trying to access admin-only routes
    if (user && user.role === "consultor" && adminOnlyRoutes.includes(pathname)) {
      router.push("/unauthorized")
      return
    }

    // If admin-only flag is set and user is not admin
    if (adminOnly && user && user.role !== "administrador") {
      router.push("/unauthorized")
      return
    }

    // If user is authenticated but trying to access login page
    if (!requireAuth && isAuthenticated && pathname === "/login") {
      router.push("/")
      return
    }
  }, [isAuthenticated, isLoading, user, requireAuth, requiredRole, adminOnly, router, pathname])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 invoke-gradient rounded-full flex items-center justify-center shadow-xl animate-pulse">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-lg font-semibold invoke-gradient-text">Cargando INVOKE...</span>
            </div>
            <p className="text-sm text-muted-foreground">Verificando autenticación</p>
          </div>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // If specific role is required but user doesn't have it, don't render children
  if (requiredRole && user && user.role !== requiredRole) {
    return null
  }

  // If consultant is trying to access admin routes, don't render children
  if (user && user.role === "consultor" && adminOnlyRoutes.includes(pathname)) {
    return null
  }

  // If admin-only flag is set and user is not admin, don't render children
  if (adminOnly && user && user.role !== "administrador") {
    return null
  }

  return <>{children}</>
}
