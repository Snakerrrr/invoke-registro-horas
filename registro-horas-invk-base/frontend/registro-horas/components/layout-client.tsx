"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { UserHeader } from "@/components/user-header"
import { RouteGuard } from "@/components/route-guard"
import { useAuth } from "@/contexts/auth-context"

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/unauthorized"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // Admin-only routes
  const adminOnlyRoutes = [
    "/dashboard/registros-admin",
    "/dashboard/gestion-usuarios",
    "/dashboard/gestion-parametros",
    "/dashboard/usuarios-pendientes",
    "/dashboard/horas-por-usuario",
    "/dashboard/configuracion",
  ]

  const getPageName = (path: string) => {
    switch (path) {
      case "/":
        return user?.role === "consultor" ? "Mi Dashboard" : "Dashboard"
      case "/dashboard/registro":
        return "Registro de Horas"
      case "/dashboard/reportes":
        return user?.role === "consultor" ? "Mis Reportes" : "Reportes"
      case "/dashboard/registros-admin":
        return "Todos los Registros"
      case "/dashboard/gestion-usuarios":
        return "Gestionar Usuarios"
      case "/dashboard/gestion-parametros":
        return "Gestionar Parámetros"
      case "/dashboard/usuarios-pendientes":
        return "Usuarios Pendientes"
      case "/dashboard/horas-por-usuario":
        return "Horas por Usuario"
      case "/dashboard/configuracion":
        return "Configuración"
      case "/dashboard/perfil":
        return "Mi Perfil"
      default:
        return "Página"
    }
  }

  const currentPageName = getPageName(pathname)

  // For public routes, render without sidebar
  if (isPublicRoute) {
    return <RouteGuard requireAuth={false}>{children}</RouteGuard>
  }

  // Check if consultant is trying to access admin route
  const isAdminRoute = adminOnlyRoutes.includes(pathname)
  const shouldBlockAccess = user?.role === "consultor" && isAdminRoute

  // For protected routes, render with sidebar and authentication
  return (
    <RouteGuard requireAuth={true}>
      {shouldBlockAccess ? (
        <RouteGuard adminOnly={true}>{children}</RouteGuard>
      ) : (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col min-h-screen">
            <UserHeader />
            <main className="flex-1 overflow-auto bg-gray-50">
              <div className="p-3 sm:p-4 md:p-6 lg:p-8">{children}</div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
    </RouteGuard>
  )
}
