"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Trash2,
  Users,
  Edit,
  FileSpreadsheet,
  ArrowLeft,
  Eye,
  EyeOff,
  Search,
  Filter,
  Loader2,
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { authenticatedFetch } from "@/lib/auth"
import { exportToCsv } from "@/lib/mock-data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Import Avatar components

// Tipo para los usuarios del backend
type BackendUser = {
  id: number
  name: string
  email: string
  role: "administrador" | "consultor"
  role_id: number
  created_at: string
  updated_at: string
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<BackendUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [isSubmitting, setIsSubmitting] = useState(false) // Para el estado de envío del formulario

  // Estados para el formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "consultor" as "administrador" | "consultor",
  })

  // Función para obtener usuarios del backend
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch("https://backend-invoke.azurewebsites.net/api/users")

      if (!response.ok) {
        throw new Error("Error al obtener usuarios")
      }

      const usersData: BackendUser[] = await response.json()
      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios del servidor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Función para crear usuario
  const createUser = async (userData: typeof formData) => {
    try {
      setIsSubmitting(true)
      // Preparar el payload con el formato correcto que espera el backend
      const payload = {
        email: userData.email.trim(),
        password: userData.password.trim(),
        name: userData.name.trim(),
        roleName: userData.role, // Cambiar 'role' por 'roleName'
      }

      console.log("Enviando datos de creación:", payload)

      const response = await authenticatedFetch("https://backend-invoke.azurewebsites.net/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al crear usuario")
      }

      await fetchUsers() // Recargar usuarios
      return true
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para actualizar usuario
  const updateUser = async (id: number, userData: Partial<typeof formData>) => {
    try {
      setIsSubmitting(true)
      // Preparar el payload para actualización (formato original que ya funcionaba)
      const payload: any = {
        name: userData.name?.trim(),
        email: userData.email?.trim(),
      }

      // Incluir role si se proporcionó (mantener formato original)
      if (userData.role) {
        payload.role = userData.role
      }

      // Incluir contraseña solo si se proporcionó
      if (userData.password && userData.password.trim() !== "") {
        payload.password = userData.password.trim()
      }

      console.log("Enviando datos de actualización:", payload)

      const response = await authenticatedFetch(`https://backend-invoke.azurewebsites.net/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar usuario")
      }

      await fetchUsers() // Recargar usuarios
      return true
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para eliminar usuario
  const deleteUser = async (id: number) => {
    try {
      const response = await authenticatedFetch(`https://backend-invoke.azurewebsites.net/api/users/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al eliminar usuario")
      }

      await fetchUsers() // Recargar usuarios
      return true
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  // Filtrado y paginación
  const filteredAndPaginatedUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = filterRole === "all" || user.role === filterRole

      return matchesSearch && matchesRole
    })

    // Ordenar por fecha de creación (más recientes primero)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = filtered.slice(startIndex, endIndex)

    return {
      users: paginatedUsers,
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }
  }, [users, searchTerm, filterRole, currentPage, itemsPerPage])

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterRole])

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "consultor",
    })
    setEditingUser(null)
    setShowPassword(false)
  }

  const handleOpenDialog = (user?: BackendUser) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: "", // No mostramos la contraseña existente
        role: user.role,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones mejoradas
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos obligatorios.",
        variant: "destructive",
      })
      return
    }

    // Validar que el rol sea válido
    if (!["administrador", "consultor"].includes(formData.role)) {
      toast({
        title: "Error de validación",
        description: "Por favor, selecciona un rol válido.",
        variant: "destructive",
      })
      return
    }

    // Validar contraseña para usuarios nuevos
    if (!editingUser && (!formData.password || formData.password.trim() === "")) {
      toast({
        title: "Error de validación",
        description: "La contraseña es obligatoria para usuarios nuevos.",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingUser) {
        // Actualizar usuario existente
        await updateUser(editingUser.id, formData)
        toast({
          title: "¡Éxito!",
          description: `Usuario ${formData.name} actualizado correctamente.`,
        })
      } else {
        // Crear nuevo usuario
        await createUser(formData)
        toast({
          title: "¡Éxito!",
          description: `Usuario ${formData.name} creado correctamente.`,
        })
      }
      handleCloseDialog()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (user: BackendUser) => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${user.name}?`)) {
      try {
        await deleteUser(user.id)
        toast({
          title: "Usuario eliminado",
          description: `${user.name} ha sido eliminado correctamente.`,
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el usuario.",
          variant: "destructive",
        })
      }
    }
  }

  const handleExportCsv = () => {
    if (users.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay usuarios para exportar.",
        variant: "destructive",
      })
      return
    }

    // Convertir datos del backend al formato del exportador
    const exportData = users.map((user) => ({
      ID: user.id,
      Nombre: user.name,
      Email: user.email,
      Rol: user.role === "administrador" ? "Administrador" : "Consultor",
      "Fecha de Creación": new Date(user.created_at).toLocaleDateString("es-ES"),
      "Última Actualización": new Date(user.updated_at).toLocaleDateString("es-ES"),
    }))

    exportToCsv(exportData, "usuarios.csv")
    toast({
      title: "¡Exportación exitosa!",
      description: "El archivo CSV ha sido descargado.",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6 space-y-6 sm:space-y-8 animate-fade-in fade-in-up">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
            <Users className="h-6 w-6 text-white drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Gestionar Usuarios</h1>
            <p className="text-sm sm:text-base text-gray-700">
              <span className="font-semibold" style={{ color: "#004072" }}>
                INVOKE
              </span>{" "}
              • Administra los usuarios del sistema
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto bg-white border-gray-300 text-gray-900 hover:bg-muted/50 transition-all duration-300"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                style={{ backgroundColor: "#004072" }}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="backdrop-blur-sm bg-background/95 border shadow-xl">
              <DropdownMenuLabel>Exportar Usuarios</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportCsv} className="hover:bg-muted/50 transition-colors">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Users Management */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
                  <Users className="h-5 w-5 text-white" />
                </div>
                Usuarios del Sistema
              </CardTitle>
              <CardDescription className="text-gray-700">
                Gestiona los usuarios que tienen acceso al sistema de registro de horas
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                  style={{ backgroundColor: "#004072" }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] backdrop-blur-sm bg-background/95">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingUser ? "Editar Usuario" : "Añadir Nuevo Usuario"}
                    </DialogTitle>
                    <DialogDescription className="text-white">
                      {editingUser
                        ? "Modifica los datos del usuario seleccionado."
                        : "Completa los datos para crear un nuevo usuario."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-white font-medium">
                        Nombre completo *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Juan Pérez"
                        required
                        className="text-gray-900 bg-white border-gray-300 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-white font-medium">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="juan@empresa.com"
                        required
                        className="text-gray-900 bg-white border-gray-300 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password" className="text-white font-medium">
                        Contraseña {!editingUser && "*"}
                        {editingUser && " (dejar vacío para mantener actual)"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                          required={!editingUser}
                          className="text-gray-900 bg-white border-gray-300 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-offset-2 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role" className="text-white font-medium">
                        Rol *
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: "administrador" | "consultor") =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger className="text-gray-900 bg-white border-gray-300 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-offset-2">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-300">
                          <SelectItem value="consultor" className="text-gray-900">
                            Consultor
                          </SelectItem>
                          <SelectItem value="administrador" className="text-gray-900">
                            Administrador
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      className="bg-white border-gray-300 text-gray-900 transition-all duration-300 bg-transparent active:scale-[0.98] active:bg-muted/70"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="text-white hover:opacity-90 transition-all duration-300 active:scale-[0.98]"
                      style={{ backgroundColor: "#004072" }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingUser ? "Actualizar" : "Crear"} Usuario
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtros y búsqueda */}
          <div className="mb-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-gray-900 bg-white border-gray-300 pl-10 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="text-gray-900 bg-white border-gray-300 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="consultor">Consultor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 por página</SelectItem>
                  <SelectItem value="9">9 por página</SelectItem>
                  <SelectItem value="12">12 por página</SelectItem>
                  <SelectItem value="18">18 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Información de resultados */}
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>
                Mostrando {filteredAndPaginatedUsers.users.length} de {filteredAndPaginatedUsers.totalItems} usuarios
              </span>
              {(searchTerm || filterRole !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterRole("all")
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          {filteredAndPaginatedUsers.users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {users.length === 0 ? "No hay usuarios registrados" : "No se encontraron usuarios"}
              </p>
              <p className="text-sm text-gray-700">
                {users.length === 0
                  ? "Comienza añadiendo el primer usuario al sistema."
                  : "Intenta ajustar los filtros de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grid de usuarios */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndPaginatedUsers.users.map((user) => (
                  <Card
                    key={user.id}
                    className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          {" "}
                          {/* Added flex items-center gap-3 */}
                          <Avatar className="h-10 w-10">
                            {" "}
                            {/* Added Avatar */}
                            <AvatarFallback
                              className="text-white text-lg font-semibold"
                              style={{ backgroundColor: "#004072" }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-lg mb-1 text-gray-900">{user.name}</h4>
                            <p className="text-sm text-gray-700 mb-2 break-all">{user.email}</p>
                            <Badge
                              className={`text-xs transition-all duration-300 ${user.role === "administrador" ? "text-white" : "hover:bg-secondary/80"}`}
                              style={user.role === "administrador" ? { backgroundColor: "#004072" } : {}}
                            >
                              {user.role === "administrador" ? "Administrador" : "Consultor"}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted/50 transition-colors active:scale-[0.98] active:bg-muted/70"
                            >
                              <Edit className="h-4 w-4 text-gray-700" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="backdrop-blur-sm bg-background/95 border shadow-xl"
                          >
                            <DropdownMenuItem
                              onClick={() => handleOpenDialog(user)}
                              className="hover:bg-muted/50 transition-colors active:bg-muted/70"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive hover:bg-destructive/10 transition-colors active:bg-destructive/20"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="text-xs text-gray-700 space-y-1">
                        <p>Creado: {formatDate(user.created_at)}</p>
                        <p>Actualizado: {formatDate(user.updated_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Controles de paginación */}
              {filteredAndPaginatedUsers.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={!filteredAndPaginatedUsers.hasPrevPage}
                      className="bg-white border-gray-300 text-gray-900 transition-all duration-300 hover:scale-105 active:scale-[0.98] active:bg-muted/70"
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: filteredAndPaginatedUsers.totalPages }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                        className={`transition-all duration-300 hover:scale-105 active:scale-[0.98] ${filteredAndPaginatedUsers.currentPage === i + 1 ? "text-white" : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"}`}
                        style={filteredAndPaginatedUsers.currentPage === i + 1 ? { backgroundColor: "#004072" } : {}}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(filteredAndPaginatedUsers.totalPages, prev + 1))}
                      disabled={!filteredAndPaginatedUsers.hasNextPage}
                      className="bg-white border-gray-300 text-gray-900 transition-all duration-300 hover:scale-105 active:scale-[0.98] active:bg-muted/70"
                    >
                      Siguiente
                    </Button>
                  </div>
                  <div className="text-sm text-gray-700">Total: {filteredAndPaginatedUsers.totalItems} usuarios</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
