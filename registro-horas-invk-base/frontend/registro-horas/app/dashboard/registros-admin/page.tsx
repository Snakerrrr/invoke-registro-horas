"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Download,
  Search,
  Filter,
  Calendar,
  FileSpreadsheet,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format, subDays, subMonths } from "date-fns"
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
import { SmartsheetExporter } from "@/lib/smartsheet-export"
import { useToast } from "@/components/ui/use-toast"
import { ExcelExporter } from "@/lib/excel-export"

// Define types for backend response based on the new JSON structure
type AllHourRegistrationBackend = {
  id: number
  date: string
  hours_quantity: string // Backend returns as string
  task_description: string
  project_name: string
  hour_type_name: string
  country_name: string
  user_name: string // New field
  email: string // New field
}

// Define type for frontend consumption (camelCase and hours as number)
type AllHourRegistration = {
  id: number
  date: string
  hours: number // Converted to number
  description: string
  projectName: string
  hourTypeName: string
  countryName: string
  userName: string // New field
  email: string // New field
}

type PeriodFilter = "all" | "7d" | "1m" | "3m" | "6m"

export default function RegistrosAdminPage() {
  const [registrations, setRegistrations] = useState<AllHourRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false) // New state for export loading

  const [searchTerm, setSearchTerm] = useState("")
  const [filterProject, setFilterProject] = useState("all")
  const [filterHourType, setFilterHourType] = useState("all")
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>("all")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // You can make this configurable if needed

  const { toast } = useToast()

  // Función para formatear fecha correctamente (evitando problemas de zona horaria)
  const formatDateSafe = (dateString: string): string => {
    // Si la fecha viene en formato ISO UTC, extraer solo la parte de la fecha
    const dateOnly = dateString.includes("T") ? dateString.split("T")[0] : dateString
    const date = new Date(dateOnly + "T00:00:00") // Forzar medianoche local
    return date.toLocaleDateString("es-ES")
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Effects                                   */
  /* -------------------------------------------------------------------------- */

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const queryParams = new URLSearchParams()

      // Add period filters
      if (filterPeriod !== "all") {
        const today = new Date()
        let startDate: Date = today
        const endDate = today // 'to' date is always today

        switch (filterPeriod) {
          case "7d":
            startDate = subDays(today, 7)
            break
          case "1m":
            startDate = subMonths(today, 1)
            break
          case "3m":
            startDate = subMonths(today, 3)
            break
          case "6m":
            startDate = subMonths(today, 6)
            break
        }
        queryParams.append("from", format(startDate, "yyyy-MM-dd"))
        queryParams.append("to", format(endDate, "yyyy-MM-dd"))
      }

      // Add other filters with specified backend parameter names
      if (searchTerm.trim()) {
        queryParams.append("user", searchTerm.trim()) // Changed from 'search' to 'user'
      }
      if (filterProject !== "all") {
        queryParams.append("project", filterProject)
      }
      if (filterHourType !== "all") {
        queryParams.append("hour_type", filterHourType) // Changed from 'hourType' to 'hour_type'
      }

      const url = `${backendUrl}/api/hours?${queryParams.toString()}`
      const response = await authenticatedFetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data: AllHourRegistrationBackend[] = await response.json()
      console.log("All registrations fetched:", data)

      const mappedData: AllHourRegistration[] = data.map((reg) => ({
        id: reg.id,
        date: reg.date,
        hours: Number.parseFloat(reg.hours_quantity),
        description: reg.task_description,
        projectName: reg.project_name,
        hourTypeName: reg.hour_type_name,
        countryName: reg.country_name,
        userName: reg.user_name,
        email: reg.email,
      }))

      // Client-side sorting after fetching
      mappedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setRegistrations(mappedData)
      setCurrentPage(1) // Reset to first page on new data/filters
    } catch (error) {
      console.error("Error fetching all registrations:", error)
      toast({
        title: "Error al cargar registros",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar todos los registros desde el backend. Inténtalo de nuevo.",
        variant: "destructive",
      })
      setRegistrations([])
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, filterProject, filterHourType, filterPeriod, toast])

  useEffect(() => {
    loadRegistrations()
  }, [loadRegistrations])

  /* -------------------------------------------------------------------------- */
  /*                                  Helpers                                   */
  /* -------------------------------------------------------------------------- */

  const uniqueProjects = useMemo(() => Array.from(new Set(registrations.map((r) => r.projectName))), [registrations])
  const uniqueHourTypes = useMemo(() => Array.from(new Set(registrations.map((r) => r.hourTypeName))), [registrations])

  /* -------------------------------------------------------------------------- */
  /*                                  Filters                                   */
  /* -------------------------------------------------------------------------- */

  // filteredRegistrations now only handles client-side sorting, as filtering is done by the backend
  const filteredRegistrations = useMemo(() => {
    // The data is already filtered by the backend based on the current state of filters.
    // We just need to ensure it's sorted.
    const data = [...registrations]
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return data
  }, [registrations])

  /* -------------------------------------------------------------------------- */
  /*                                 Pagination                                 */
  /* -------------------------------------------------------------------------- */
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredRegistrations.slice(indexOfFirstItem, indexOfLastItem)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                Estadísticas                               */
  /* -------------------------------------------------------------------------- */

  const totalHours = filteredRegistrations.reduce((sum, r) => sum + r.hours, 0)
  const totalRegistrations = filteredRegistrations.length

  /* -------------------------------------------------------------------------- */
  /*                                Exportación                                */
  /* -------------------------------------------------------------------------- */

  const handleExportCSV = async () => {
    if (!filteredRegistrations.length) {
      toast({
        title: "No hay datos para exportar",
        description: "Ajusta tus filtros o espera a que se carguen los registros.",
        variant: "default",
      })
      return
    }

    setIsExporting(true)
    toast({
      title: "Exportando a Excel...",
      description: "Esto puede tardar unos segundos.",
      duration: 5000,
    })

    try {
      await ExcelExporter.exportHourRegistrations(filteredRegistrations)
      toast({
        title: "Exportación a Excel completada",
        description: "El archivo Excel se ha descargado correctamente.",
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Error al exportar Excel",
        description: "Hubo un problema al generar el archivo Excel. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportSmartsheet = () => {
    if (!filteredRegistrations.length) {
      toast({
        title: "No hay datos para exportar",
        description: "Ajusta tus filtros o espera a que se carguen los registros.",
        variant: "default",
      })
      return
    }
    setIsExporting(true)
    toast({
      title: "Exportando a Smartsheet...",
      description: "Esto puede tardar unos segundos.",
      duration: 5000,
    })
    try {
      SmartsheetExporter.exportHourRegistrations(filteredRegistrations)
      toast({
        title: "Exportación a Smartsheet completada",
        description: "El archivo para Smartsheet se ha descargado correctamente.",
      })
    } catch (error) {
      console.error("Error exporting to Smartsheet:", error)
      toast({
        title: "Error al exportar a Smartsheet",
        description: "Hubo un problema al generar el archivo para Smartsheet. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="space-y-6 sm:space-y-8">
        {/* --------------------------- Encabezado ---------------------------- */}
        <header className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Todos los Registros</h1>
              <p className="text-sm sm:text-base text-gray-700">
                <span className="font-semibold" style={{ color: "#004072" }}>
                  INVOKE
                </span>{" "}
                • Vista completa de registros de horas
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
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
                  disabled={filteredRegistrations.length === 0 || isLoading || isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{isExporting ? "Exportando..." : "Exportar Registros"}</span>
                  <span className="sm:hidden">{isExporting ? "Exportando..." : "Exportar"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200">
                <DropdownMenuLabel className="font-semibold text-gray-900">Opciones de Exportación</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleExportSmartsheet}
                  className="cursor-pointer text-gray-900"
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Exportar a Smartsheet</div>
                    <div className="text-xs text-gray-600">Formato optimizado para Smartsheet</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportCSV}
                  className="cursor-pointer text-gray-900"
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Exportar Excel Estándar</div>
                    <div className="text-xs text-gray-600">Formato Excel tradicional</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* --------------------------- Tarjetas ------------------------------ */}
        <section className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total Registros" value={totalRegistrations} />
          <StatsCard label="Total Horas" value={totalHours.toFixed(1)} />
          <StatsCard label="Proyectos" value={uniqueProjects.length} />
          <StatsCard
            label="Promedio"
            value={totalRegistrations > 0 ? (totalHours / totalRegistrations).toFixed(1) : "0"}
          />
        </section>

        {/* --------------------------- Filtros ------------------------------ */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
                <Filter className="h-5 w-5 text-white" />
              </div>
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Buscador */}
              <FilterGroup label="Buscar">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Usuario, proyecto o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </FilterGroup>

              {/* Proyecto */}
              <FilterGroup label="Proyecto">
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="border border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="Todos los proyectos" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="all" className="text-gray-900">
                      Todos los proyectos
                    </SelectItem>
                    {uniqueProjects.map((project) => (
                      <SelectItem key={project} value={project} className="text-gray-900">
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterGroup>

              {/* Tipo hora */}
              <FilterGroup label="Tipo de Hora">
                <Select value={filterHourType} onValueChange={setFilterHourType}>
                  <SelectTrigger className="border border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="all" className="text-gray-900">
                      Todos los tipos
                    </SelectItem>
                    {uniqueHourTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-gray-900">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterGroup>

              {/* Periodo */}
              <FilterGroup label="Periodo">
                <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as PeriodFilter)}>
                  <SelectTrigger className="border border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="Todos los periodos" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="all" className="text-gray-900">
                      Todos los periodos
                    </SelectItem>
                    <SelectItem value="7d" className="text-gray-900">
                      Últimos 7 días
                    </SelectItem>
                    <SelectItem value="1m" className="text-gray-900">
                      Último mes
                    </SelectItem>
                    <SelectItem value="3m" className="text-gray-900">
                      Últimos 3 meses
                    </SelectItem>
                    <SelectItem value="6m" className="text-gray-900">
                      Últimos 6 meses
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FilterGroup>
            </div>
          </CardContent>
        </Card>

        {/* --------------------------- Tabla ------------------------------- */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Registros de Horas
            </CardTitle>
            <CardDescription className="text-gray-700">
              Vista completa de todos los registros de horas del sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <EmptyState text="Cargando registros..." isLoading />
            ) : filteredRegistrations.length === 0 ? (
              <EmptyState text="No se encontraron registros" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="font-semibold text-gray-900">Fecha</TableHead>
                      <TableHead className="font-semibold text-gray-900">Usuario</TableHead>
                      <TableHead className="font-semibold text-gray-900">Email</TableHead>
                      <TableHead className="font-semibold text-gray-900">Proyecto</TableHead>
                      <TableHead className="font-semibold text-gray-900">Tipo Hora</TableHead>
                      <TableHead className="font-semibold text-gray-900">País</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Horas</TableHead>
                      <TableHead className="font-semibold text-gray-900">Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((reg) => (
                      <TableRow key={reg.id} className="border-gray-200 hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{formatDateSafe(reg.date)}</TableCell>
                        <TableCell className="text-gray-900">{reg.userName}</TableCell>
                        <TableCell className="text-gray-900">{reg.email}</TableCell>
                        <TableCell className="text-gray-900">{reg.projectName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-300 text-gray-900">
                            {reg.hourTypeName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900">{reg.countryName}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="text-white font-bold" style={{ backgroundColor: "#004072" }}>
                            {reg.hours}h
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-gray-900" title={reg.description}>
                          {reg.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-end items-center space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || isLoading}
                      className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                        className={`${
                          currentPage === i + 1
                            ? "text-white active:brightness-90"
                            : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        } active:scale-[0.98]`}
                        style={currentPage === i + 1 ? { backgroundColor: "#004072" } : {}}
                        disabled={isLoading}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || isLoading}
                      className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Sub-componentes                                */
/* -------------------------------------------------------------------------- */

interface StatsCardProps {
  label: string
  value: number | string
}
function StatsCard({ label, value }: StatsCardProps) {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <CardTitle className="text-sm font-medium text-gray-700">{label}</CardTitle>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#004072" }}>
          <Calendar className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold text-black">{value}</div>
      </CardContent>
    </Card>
  )
}

interface FilterGroupProps {
  label: string
  children: React.ReactNode
}
function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block text-gray-900">{label}</label>
      {children}
    </div>
  )
}

interface EmptyStateProps {
  text: string
  isLoading?: boolean
}
function EmptyState({ text, isLoading = false }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {isLoading ? (
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: "#004072", borderTopColor: "transparent" }}
        />
      ) : (
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
      )}
      <p className="text-lg font-semibold text-gray-900 mb-2">{text}</p>
      {!isLoading && <p className="text-sm text-gray-600">Ajusta los filtros para ver más resultados</p>}
    </div>
  )
}
