"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Clock, Users, UserX, Search, Calendar, TrendingUp } from "lucide-react"
import { authenticatedFetch } from "@/lib/auth"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Tipo para usuarios pendientes del backend
type PendingUser = {
  id: number
  name: string
  email: string
  last_date: string | null
  days_since: number | null
}

export default function PendingUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<PendingUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dayThreshold, setDayThreshold] = useState(4)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener usuarios pendientes del backend
  const fetchPendingUsers = async (days: number) => {
    try {
      setLoading(true)
      setError(null)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/reportes/usuarios-pendientes?days=${days}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: PendingUser[] = await response.json()
      setPendingUsers(data)
      setFilteredUsers(data)
    } catch (error: any) {
      console.error("Error fetching pending users:", error)
      setError(error.message || "Error al cargar usuarios pendientes")
      setPendingUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    fetchPendingUsers(dayThreshold)
  }, [dayThreshold])

  // Filtrar usuarios por término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(pendingUsers)
    } else {
      const filtered = pendingUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, pendingUsers])

  // Función helper para obtener días desde último registro
  const getDaysSinceLastRegistration = (user: PendingUser): number => {
    return user.days_since || 0
  }

  // Función helper para obtener nivel de prioridad
  const getPriorityLevel = (user: PendingUser): "high" | "medium" | "low" => {
    const daysSince = getDaysSinceLastRegistration(user)
    if (daysSince >= 7) return "high"
    if (daysSince >= 5) return "medium"
    return "low"
  }

  // Función helper para obtener color del badge
  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "default"
    }
  }

  // Función helper para obtener texto de prioridad
  const getPriorityText = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "Alta"
      case "medium":
        return "Media"
      case "low":
        return "Baja"
    }
  }

  // Calcular estadísticas
  const totalPendingUsers = filteredUsers.length
  const highPriorityUsers = filteredUsers.filter((user) => getPriorityLevel(user) === "high").length
  const mediumPriorityUsers = filteredUsers.filter((user) => getPriorityLevel(user) === "medium").length
  const lowPriorityUsers = filteredUsers.filter((user) => getPriorityLevel(user) === "low").length

  const averageDaysSince =
    filteredUsers.length > 0
      ? Math.round(
          filteredUsers.reduce((sum, user) => sum + getDaysSinceLastRegistration(user), 0) / filteredUsers.length,
        )
      : 0

  return (
    <div className="min-h-screen bg-white">
      <div className="space-y-6 sm:space-y-8 fade-in-up p-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
              <UserX className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Usuarios Pendientes</h1>
              <p className="text-sm sm:text-base text-gray-700">
                <span className="font-semibold" style={{ color: "#004072" }}>
                  INVOKE
                </span>{" "}
                • Usuarios que no han registrado horas recientemente
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              className="w-full sm:w-auto text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: "#004072" }}
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="h-5 w-5" />
              Configuración de Filtros
            </CardTitle>
            <CardDescription className="text-gray-700">
              Ajusta los parámetros para identificar usuarios pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dayThreshold" className="text-gray-900 font-medium">
                  Días sin registrar
                </Label>
                <Input
                  id="dayThreshold"
                  type="number"
                  min="1"
                  max="30"
                  value={dayThreshold}
                  onChange={(e) => setDayThreshold(Number(e.target.value))}
                  className="h-10 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-white text-gray-900"
                />
                <p className="text-xs text-gray-700">
                  Usuarios que no han registrado horas en los últimos {dayThreshold} días
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search" className="text-gray-900 font-medium">
                  Buscar usuario
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-white text-gray-900"
                    placeholderTextColor="text-gray-500"
                    style={{
                      "--placeholder-color": "text-gray-500",
                      "::placeholder": {
                        color: "text-gray-500",
                      },
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => fetchPendingUsers(dayThreshold)}
                disabled={loading}
                className="text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                style={{ backgroundColor: "#004072" }}
              >
                {loading ? <span className="text-gray-900">Cargando...</span> : "Actualizar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPendingUsers}</p>
                </div>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#004072" }}>
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Prioridad Alta</p>
                  <p className="text-2xl font-bold text-red-600">{highPriorityUsers}</p>
                </div>
                <div className="p-1.5 rounded-lg bg-red-600">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Prioridad Media</p>
                  <p className="text-2xl font-bold text-yellow-600">{mediumPriorityUsers}</p>
                </div>
                <div className="p-1.5 rounded-lg bg-yellow-600">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Promedio Días</p>
                  <p className="text-2xl font-bold text-gray-900">{averageDaysSince}</p>
                </div>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#004072" }}>
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
                <UserX className="h-5 w-5 text-white" />
              </div>
              Lista de Usuarios Pendientes
            </CardTitle>
            <CardDescription className="text-gray-700">
              {filteredUsers.length > 0
                ? `${filteredUsers.length} usuario${filteredUsers.length !== 1 ? "s" : ""} sin registrar horas en los últimos ${dayThreshold} días`
                : "No hay usuarios pendientes con los filtros actuales"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div
                  className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "#004072", borderTopColor: "transparent" }}
                ></div>
                <span className="ml-2 text-gray-900">Cargando usuarios pendientes...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 font-medium">{error}</p>
                <Button onClick={() => fetchPendingUsers(dayThreshold)} className="mt-4" variant="outline">
                  Reintentar
                </Button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium text-green-600">¡Excelente!</p>
                <p className="text-gray-700">No hay usuarios pendientes con los filtros actuales</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-900 font-medium">Usuario</TableHead>
                      <TableHead className="text-gray-900 font-medium">Email</TableHead>
                      <TableHead className="text-gray-900 font-medium">Último Registro</TableHead>
                      <TableHead className="text-gray-900 font-medium">Días Sin Registrar</TableHead>
                      <TableHead className="text-gray-900 font-medium">Prioridad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const priority = getPriorityLevel(user)
                      const daysSince = getDaysSinceLastRegistration(user)

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                          <TableCell className="text-gray-700">{user.email}</TableCell>
                          <TableCell>
                            {user.last_date ? (
                              <span className="text-sm text-gray-700">
                                {new Date(user.last_date).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            ) : (
                              <span className="text-gray-700 text-sm">Nunca</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-900">{daysSince} días</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(priority)}>{getPriorityText(priority)}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
