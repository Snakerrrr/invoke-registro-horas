"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function UnauthorizedPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md invoke-card border-0 shadow-2xl animate-scale-in">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Acceso Denegado</CardTitle>
          <CardDescription className="text-base">No tienes permisos para acceder a esta página</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              Tu rol actual: <span className="font-semibold capitalize">{user?.role}</span>
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Contacta al administrador si necesitas acceso adicional
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full invoke-gradient">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Ir al Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
