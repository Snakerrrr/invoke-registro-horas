"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react" // Importar useMemo
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Clock, Edit, Trash2, Loader2, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react" // Añadir Search, Filter, ChevronLeft, ChevronRight, y los iconos de ordenación
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { authenticatedFetch } from "@/lib/auth"
// Eliminamos las importaciones de mock-data ya que ahora cargaremos desde el backend
// import { getMockCountries, getMockProjects, getMockHourTypes, getProjectsByCountry, type Country, type Project, type HourType } from "@/lib/mock-data"

// Tipos para los parámetros del backend (copiado de hour-registration-form.tsx)
type BackendParameter = {
  id: number
  tipo: "pais" | "pm" | "tipo_hora" | "proyecto"
  nombre: string
  codigo: string | null
  icono: string | null
  created_at: string
  relacionado_id: number | null
  cliente: string | null
  activo: boolean
  project_manager_id: number | null
}

// Tipos para la interfaz (copiado de hour-registration-form.tsx)
type Country = {
  id: number
  name: string
  code: string
  flag: string
}

type Project = {
  id: number
  name: string
  client: string
  productManagerId: number
  productManagerName: string
  countryId: number
  status: "active" | "inactive"
}

type HourType = {
  id: number
  name: string
}

// Backend hour registration type based on your API response
type BackendHourRegistration = {
  id: number
  date: string
  hours_quantity: string
  task_description: string
  project_name: string
  hour_type_name: string
  country_name: string
}

export default function MisRegistrosPage() {
  const [registrations, setRegistrations] = useState<BackendHourRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingParameters, setLoadingParameters] = useState(true)
  const [editingRegistration, setEditingRegistration] = useState<BackendHourRegistration | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingRowId, setProcessingRowId] = useState<number | null>(null) // Nuevo estado para la fila en procesamiento

  // Form states for editing
  const [editCountry, setEditCountry] = useState<string | undefined>(undefined)
  const [editProject, setEditProject] = useState<string | undefined>(undefined)
  const [editHourType, setEditHourType] = useState<string | undefined>(undefined)
  const [editDate, setEditDate] = useState<string>("")
  const [editHoursQuantity, setEditHoursQuantity] = useState<number | string>("")
  const [editTaskDescription, setEditTaskDescription] = useState<string>("")

  const [countries, setCountries] = useState<Country[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [hourTypes, setHourTypes] = useState<HourType[]>([])

  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCountry, setFilterCountry] = useState("all")
  const [filterProject, setFilterProject] = useState("all")
  const [filterHourType, setFilterHourType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const { toast } = useToast()

  // Función helper para obtener el nombre del PM por ID (copiado de hour-registration-form.tsx)
  const getPmName = (pmId: number | null, allParameters: BackendParameter[]): string => {
    if (!pmId) return "Sin asignar"
    const pm = allParameters.find((p) => p.id === pmId && p.tipo === "pm")
    return pm?.nombre || "Sin asignar"
  }

  // Función para formatear fecha correctamente (evitando problemas de zona horaria)
  const formatDateSafe = (dateString: string): string => {
    // Si la fecha viene en formato ISO UTC, extraer solo la parte de la fecha
    const dateOnly = dateString.includes("T") ? dateString.split("T")[0] : dateString
    const date = new Date(dateOnly + "T00:00:00") // Forzar medianoche local
    return date.toLocaleDateString("es-ES")
  }

  // Función para obtener parámetros del backend (adaptado de hour-registration-form.tsx)
  const fetchParameters = async () => {
    try {
      setLoadingParameters(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/parametros`)

      if (!response.ok) {
        throw new Error("Error al obtener parámetros")
      }

      const parameters: BackendParameter[] = await response.json()

      const countriesData: Country[] = parameters
        .filter((p) => p.tipo === "pais" && p.activo)
        .map((p) => ({
          id: p.id,
          name: p.nombre,
          code: p.codigo || "",
          flag: p.icono || "🏳️",
        }))

      const projectsData: Project[] = parameters
        .filter((p) => p.tipo === "proyecto" && p.activo)
        .map((p) => ({
          id: p.id,
          name: p.nombre,
          client: p.cliente || "",
          productManagerId: p.project_manager_id || 0,
          productManagerName: getPmName(p.project_manager_id, parameters),
          countryId: p.relacionado_id || 0,
          status: p.activo ? "active" : "inactive",
        }))

      const hourTypesData: HourType[] = parameters
        .filter((p) => p.tipo === "tipo_hora" && p.activo)
        .map((p) => ({
          id: p.id,
          name: p.nombre,
        }))

      setCountries(countriesData)
      setProjects(projectsData)
      setHourTypes(hourTypesData)

      console.log("Parámetros cargados para edición de registros:", {
        countries: countriesData.length,
        projects: projectsData.length,
        hourTypes: hourTypesData.length,
      })
    } catch (error) {
      console.error("Error fetching parameters:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los parámetros del servidor para la edición.",
        variant: "destructive",
      })
    } finally {
      setLoadingParameters(false)
    }
  }

  useEffect(() => {
    fetchParameters()
    fetchRegistrations()
  }, [])

  // Filter projects when country changes in edit dialog
  useEffect(() => {
    if (editCountry) {
      const projectsForCountry = projects.filter((p) => p.countryId.toString() === editCountry)
      setFilteredProjects(projectsForCountry)
      if (editProject && !projectsForCountry.find((p) => p.id.toString() === editProject)) {
        setEditProject(undefined)
      }
    } else {
      setFilteredProjects([])
      setEditProject(undefined)
    }
  }, [editCountry, editProject, projects])

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/hours`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: BackendHourRegistration[] = await response.json()
      console.log("Registrations fetched:", data)
      setRegistrations(data)
    } catch (error) {
      console.error("Error fetching registrations:", error)
      toast({
        title: "Error al cargar registros",
        description: "No se pudieron cargar los registros desde el backend.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (registration: BackendHourRegistration) => {
    setEditingRegistration(registration)

    const country = countries.find((c) => c.name === registration.country_name)
    const project = projects.find((p) => p.name === registration.project_name)
    const hourType = hourTypes.find((ht) => ht.name === registration.hour_type_name)

    setEditCountry(country ? country.id.toString() : undefined)
    setEditProject(project ? project.id.toString() : undefined)
    setEditHourType(hourType ? hourType.id.toString() : undefined)

    // Formatear fecha correctamente para el input date
    const dateOnly = registration.date.includes("T") ? registration.date.split("T")[0] : registration.date
    setEditDate(dateOnly)
    setEditHoursQuantity(registration.hours_quantity)
    setEditTaskDescription(registration.task_description)
  }

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingRegistration) return

    setIsSubmitting(true)
    setProcessingRowId(editingRegistration.id) // Set processing row ID

    if (!editCountry || !editProject || !editHourType || !editDate || !editHoursQuantity || !editTaskDescription) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos requeridos.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      setProcessingRowId(null) // Reset processing row ID
      return
    }

    const projectData = projects.find((p) => p.id.toString() === editProject)
    const hourTypeData = hourTypes.find((ht) => ht.id.toString() === editHourType)
    const countryData = countries.find((c) => c.id.toString() === editCountry)

    if (!projectData || !hourTypeData || !countryData) {
      toast({
        title: "Error",
        description: "Datos no encontrados. Verifica tu selección.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      setProcessingRowId(null) // Reset processing row ID
      return
    }

    const payload = {
      country: countryData.name,
      project: projectData.name,
      hour_type: hourTypeData.name,
      date: editDate,
      hours_quantity: Number.parseFloat(editHoursQuantity as string),
      task_description: editTaskDescription,
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/hours/${editingRegistration.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "¡Éxito!",
        description: "Registro de horas actualizado correctamente.",
      })

      setEditingRegistration(null)
      await fetchRegistrations()
    } catch (error) {
      console.error("Error updating registration:", error)
      toast({
        title: "Error al actualizar",
        description:
          error instanceof Error ? error.message : "Hubo un problema al actualizar el registro. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setProcessingRowId(null) // Reset processing row ID
    }
  }

  const handleDelete = async (id: number) => {
    setIsSubmitting(true)
    setProcessingRowId(id) // Set processing row ID
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/hours/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "¡Éxito!",
        description: "Registro de horas eliminado correctamente.",
      })

      await fetchRegistrations()
    } catch (error) {
      console.error("Error deleting registration:", error)
      toast({
        title: "Error al eliminar",
        description:
          error instanceof Error ? error.message : "Hubo un problema al eliminar el registro. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setProcessingRowId(null) // Reset processing row ID
    }
  }

  // Lógica de filtrado y paginación
  const filteredAndSortedRegistrations = useMemo(() => {
    const filtered = registrations.filter((reg) => {
      const matchesSearch = searchTerm
        ? reg.task_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.country_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.hour_type_name.toLowerCase().includes(searchTerm.toLowerCase())
        : true

      const matchesCountry =
        filterCountry === "all" || reg.country_name === countries.find((c) => c.id.toString() === filterCountry)?.name
      const matchesProject =
        filterProject === "all" || reg.project_name === projects.find((p) => p.id.toString() === filterProject)?.name
      const matchesHourType =
        filterHourType === "all" ||
        reg.hour_type_name === hourTypes.find((ht) => ht.id.toString() === filterHourType)?.name

      return matchesSearch && matchesCountry && matchesProject && matchesHourType
    })

    // Ordenar por fecha descendente
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return filtered
  }, [registrations, searchTerm, filterCountry, filterProject, filterHourType, countries, projects, hourTypes])

  const totalPages = Math.ceil(filteredAndSortedRegistrations.length / itemsPerPage)
  const currentRegistrations = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return filteredAndSortedRegistrations.slice(indexOfFirstItem, indexOfLastItem)
  }, [filteredAndSortedRegistrations, currentPage, itemsPerPage])

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when items per page changes
  }

  // Reset page to 1 when filters or sort order change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCountry, filterProject, filterHourType])

  if (isLoading || loadingParameters) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: "white" }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#004072] mx-auto mb-4" />
          <span className="ml-2 text-lg text-black">Cargando datos...</span>
        </div>
      </div>
    )
  }

  const selectedCountryData = countries.find((c) => c.id.toString() === editCountry)

  return (
    <div
      className="p-6 space-y-6 sm:space-y-8 animate-fade-in fade-in-up"
      style={{ backgroundColor: "white", minHeight: "100vh" }}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#004072] rounded-lg">
            <Edit className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#004072]">Mis Registros de Horas</h1>
            <p className="text-sm sm:text-base text-gray-900">
              <span className="text-[#004072] font-semibold">INVOKE</span> • Gestiona tus entradas de tiempo
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="shrink-0 bg-white border-[#004072] text-[#004072] hover:bg-[#004072] hover:text-white transition-colors duration-200"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card
        className="bg-white border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-500 animate-slide-up"
        style={{ animationDelay: "200ms" }}
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-black">
            <div className="p-2 bg-[#004072] rounded-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-black">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Descripción, proyecto, país o tipo de hora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-0 bg-white/50 dark:bg-slate-800/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-black">País</label>
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger className="border-0 bg-white/50 dark:bg-slate-800/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2">
                  <SelectValue placeholder="Todos los países" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los países</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-black">Proyecto</label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="border-0 bg-white/50 dark:bg-slate-800/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2">
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-black">Tipo de Hora</label>
              <Select value={filterHourType} onValueChange={setFilterHourType}>
                <SelectTrigger className="border-0 bg-white/50 dark:bg-slate-800/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {hourTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-500 animate-scale-in">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Tus Registros</CardTitle>
          <CardDescription className="text-black">
            Aquí puedes ver, editar y eliminar tus registros de horas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentRegistrations.length === 0 ? (
            <div className="text-center py-12 text-black">
              <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">No se encontraron registros con los filtros aplicados.</p>
              <p className="text-sm mt-2 text-gray-700">
                Ajusta tus filtros o dirígete a{" "}
                <Link href="/dashboard/registro" className="text-[#004072] hover:underline">
                  Registro de Horas
                </Link>{" "}
                para empezar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">Fecha</TableHead>
                    <TableHead className="text-black">País</TableHead>
                    <TableHead className="text-black">Proyecto</TableHead>
                    <TableHead className="text-black">Tipo de Hora</TableHead>
                    <TableHead className="text-right text-black">Horas</TableHead>
                    <TableHead className="text-black">Descripción</TableHead>
                    <TableHead className="text-right text-black">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRegistrations.map((reg) => (
                    <TableRow
                      key={reg.id}
                      className={`hover:bg-muted/50 transition-colors ${processingRowId === reg.id ? "opacity-50 animate-pulse" : ""}`}
                    >
                      <TableCell className="font-medium text-black">{formatDateSafe(reg.date)}</TableCell>
                      <TableCell className="text-black">{reg.country_name}</TableCell>
                      <TableCell className="text-black">{reg.project_name}</TableCell>
                      <TableCell className="text-black">{reg.hour_type_name}</TableCell>
                      <TableCell className="text-right text-black">{reg.hours_quantity}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-black">{reg.task_description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            onClick={() => handleEditClick(reg)}
                            disabled={isSubmitting && processingRowId === reg.id}
                            className="active:scale-[0.98] active:bg-[#003a66] bg-[#004072] text-white hover:bg-[#003a66]"
                          >
                            {isSubmitting && processingRowId === reg.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                            <span className="sr-only">Editar</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                disabled={isSubmitting && processingRowId === reg.id}
                                className="active:scale-[0.98] active:bg-destructive/70"
                              >
                                {isSubmitting && processingRowId === reg.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-black">¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-700">
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente tu registro de horas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white border-gray-300 text-black hover:bg-gray-50">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(reg.id)}
                                  disabled={isSubmitting}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Eliminar"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              {filteredAndSortedRegistrations.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2 text-sm text-black">
                    Registros por página:
                    <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                      <SelectTrigger className="w-[70px] h-8 bg-white border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="active:scale-[0.98] bg-white border-gray-300 text-black hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {/* Page number buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(page)}
                        className={`${currentPage === page ? "bg-[#004072] text-white hover:bg-[#003a66]" : "bg-white border-gray-300 text-black hover:bg-gray-50"} active:scale-[0.98]`}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="active:scale-[0.98] bg-white border-gray-300 text-black hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRegistration} onOpenChange={() => setEditingRegistration(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Editar Registro de Horas</DialogTitle>
            <DialogDescription className="text-gray-700">
              Realiza cambios en tu registro de horas. Haz clic en guardar cuando hayas terminado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-country" className="text-right text-gray-900 font-medium">
                País
              </Label>
              <Select value={editCountry} onValueChange={setEditCountry} required className="col-span-3">
                <SelectTrigger
                  id="edit-country"
                  className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 bg-white border-gray-300 text-gray-900"
                >
                  <SelectValue placeholder="Selecciona el país" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editCountry && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-project" className="text-right text-gray-900 font-medium">
                  Proyecto
                </Label>
                <Select value={editProject} onValueChange={setEditProject} required className="col-span-3">
                  <SelectTrigger
                    id="edit-project"
                    className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 bg-white border-gray-300 text-gray-900"
                  >
                    <SelectValue placeholder="Selecciona el proyecto" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {filteredProjects.length === 0 ? (
                      <SelectItem value="no-projects-available" disabled>
                        No hay proyectos activos en {selectedCountryData?.name}
                      </SelectItem>
                    ) : (
                      filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name} ({project.client})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-hour-type" className="text-right text-gray-900 font-medium">
                Tipo de Hora
              </Label>
              <Select value={editHourType} onValueChange={setEditHourType} required className="col-span-3">
                <SelectTrigger
                  id="edit-hour-type"
                  className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 bg-white border-gray-300 text-gray-900"
                >
                  <SelectValue placeholder="Selecciona el tipo de hora" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {hourTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right text-gray-900 font-medium">
                Fecha
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
                className="col-span-3 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-hours" className="text-right text-gray-900 font-medium">
                Horas
              </Label>
              <Input
                id="edit-hours"
                type="number"
                step="0.5"
                min="0.5"
                value={editHoursQuantity}
                onChange={(e) => setEditHoursQuantity(e.target.value)}
                required
                className="col-span-3 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right text-gray-900 font-medium">
                Descripción
              </Label>
              <Textarea
                id="edit-description"
                value={editTaskDescription}
                onChange={(e) => setEditTaskDescription(e.target.value)}
                required
                className="col-span-3 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 bg-white border-gray-300 text-gray-900"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingRegistration(null)}
                className="active:scale-[0.98] bg-white border-gray-300 text-black hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="active:scale-[0.98] bg-[#004072] hover:bg-[#003a66] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
