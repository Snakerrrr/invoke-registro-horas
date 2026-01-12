"use client"

import type React from "react"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Clock, Download, Filter, Loader2 } from "lucide-react"
import { format, subDays, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { authenticatedFetch } from "@/lib/auth"
import { ExcelExporter } from "@/lib/excel-export"
import { SmartsheetExporter } from "@/lib/smartsheet-export"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Define types for backend response
interface UserBackend {
  id: string
  name: string
}

interface HourRegistrationBackendForUser {
  id: number
  date: string
  hours_quantity: string
  task_description: string
  project_name: string
  hour_type_name: string
  country_name: string
  user_name: string
  email: string
}

// Define frontend types (consistent with AllHourRegistration from RegistrosAdminPage)
type HourRegistration = {
  id: number
  date: string
  hours: number
  description: string
  projectName: string
  hourTypeName: string
  countryName: string
  userName: string
  email: string
}

type PeriodFilter = "all" | "last7Days" | "last1Month" | "last3Months" | "last6Months"

// Helper function to safely format dates, accounting for potential timezone issues
const formatDateSafe = (dateString: string): string => {
  // If the date comes in ISO UTC format, extract only the date part
  const dateOnly = dateString.includes("T") ? dateString.split("T")[0] : dateString
  const date = new Date(dateOnly + "T00:00:00") // Force local midnight
  return format(date, "dd/MM/yyyy", { locale: es })
}

// Sub-component for displaying stats cards
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
          <Clock className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold text-black">{value}</div>
      </CardContent>
    </Card>
  )
}

// Sub-component for filter groups
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

// Sub-component for empty state/loading
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
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
      )}
      <p className="text-lg font-semibold text-gray-900 mb-2">{text}</p>
      {!isLoading && <p className="text-sm text-gray-600">Ajusta los filtros para ver más resultados</p>}
    </div>
  )
}

// Define User type
type User = {
  id: string
  name: string
}

export default function HorasPorUsuarioPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [registrations, setRegistrations] = useState<HourRegistration[]>([]) // Renamed from hourRegistrations
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("all")
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Consistent with "Todos los Registros"

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Define periods for filtering
  const periods = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const last7DaysStart = subDays(todayStart, 6)
    const last1MonthStart = subMonths(todayStart, 1)
    const last3MonthsStart = subMonths(todayStart, 3)
    const last6MonthsStart = subMonths(todayStart, 6)

    return {
      all: {
        start: null,
        end: null,
        label: "Todos los periodos",
      },
      last7Days: {
        start: last7DaysStart,
        end: todayEnd,
        label: "Últimos 7 días",
      },
      last1Month: {
        start: last1MonthStart,
        end: todayEnd,
        label: "Último mes",
      },
      last3Months: {
        start: last3MonthsStart,
        end: todayEnd,
        label: "Últimos 3 meses",
      },
      last6Months: {
        start: last6MonthsStart,
        end: todayEnd,
        label: "Últimos 6 meses",
      },
    }
  }, [])

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const response = await authenticatedFetch("https://backend-invoke.azurewebsites.net/api/users")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: UserBackend[] = await response.json()
        const mappedUsers: User[] = data.map((user) => ({
          id: user.id,
          name: user.name,
        }))
        setUsers(mappedUsers)
        if (mappedUsers.length > 0) {
          setSelectedUserId(mappedUsers[0].id) // Select the first user by default
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error al cargar usuarios",
          description: "No se pudieron cargar los usuarios. Inténtalo de nuevo más tarde.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingUsers(false)
      }
    }
    if (isClient) {
      fetchUsers()
    }
  }, [isClient, toast])

  // Fetch hour registrations for the selected user and period
  const fetchRegistrations = useCallback(async () => {
    if (!selectedUserId) {
      setRegistrations([])
      return
    }

    setIsLoadingRegistrations(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const periodDates = periods[selectedPeriod]
      let url = `${backendUrl}/api/hours/user/${selectedUserId}`
      const queryParams = []

      if (periodDates.start) {
        queryParams.push(`from=${format(periodDates.start, "yyyy-MM-dd")}`)
      }
      if (periodDates.end) {
        queryParams.push(`to=${format(periodDates.end, "yyyy-MM-dd")}`)
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`
      }

      const response = await authenticatedFetch(url)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }
      const data: HourRegistrationBackendForUser[] = await response.json()
      const mappedRegistrations: HourRegistration[] = data.map((reg) => ({
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
      setRegistrations(mappedRegistrations)
      setCurrentPage(1) // Reset to first page on new data/filters
    } catch (error) {
      console.error(`Error fetching registrations for user ${selectedUserId}:`, error)
      toast({
        title: "Error al cargar registros",
        description: "No se pudieron cargar los registros de horas para el usuario seleccionado.",
        variant: "destructive",
      })
      setRegistrations([]) // Clear registrations on error
    } finally {
      setIsLoadingRegistrations(false)
    }
  }, [selectedUserId, selectedPeriod, periods, toast])

  useEffect(() => {
    if (isClient && selectedUserId) {
      fetchRegistrations()
    }
  }, [isClient, selectedUserId, selectedPeriod, fetchRegistrations])

  /* -------------------------------------------------------------------------- */
  /*                                  Filters                                   */
  /* -------------------------------------------------------------------------- */

  // The data is already filtered by the backend based on selectedUserId and selectedPeriod.
  // We just need to sort it for display.
  const filteredAndSortedRegistrations = useMemo(() => {
    const data = [...registrations]
    // Default sort order: descending by date (most recent first)
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return data
  }, [registrations])

  /* -------------------------------------------------------------------------- */
  /*                                 Pagination                                 */
  /* -------------------------------------------------------------------------- */
  const totalPages = Math.ceil(filteredAndSortedRegistrations.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredAndSortedRegistrations.slice(indexOfFirstItem, indexOfLastItem)

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

  const totalHours = filteredAndSortedRegistrations.reduce((sum, r) => sum + r.hours, 0)
  const totalRegistrationsCount = filteredAndSortedRegistrations.length
  const uniqueProjects = Array.from(new Set(filteredAndSortedRegistrations.map((reg) => reg.projectName)))

  /* -------------------------------------------------------------------------- */
  /*                                Exportación                                */
  /* -------------------------------------------------------------------------- */

  const handleExportCSV = async () => {
    if (!filteredAndSortedRegistrations.length) {
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
      await ExcelExporter.exportHourRegistrations(filteredAndSortedRegistrations)
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
    if (!filteredAndSortedRegistrations.length) {
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
      SmartsheetExporter.exportHourRegistrations(filteredAndSortedRegistrations)
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

  if (!isClient || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mr-3"
          style={{ borderColor: "#004072", borderTopColor: "transparent" }}
        />
        <span className="text-lg text-gray-900">Cargando usuarios...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <header className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Horas por Usuario</h1>
              <p className="text-sm sm:text-base text-gray-700">
                <span className="font-semibold" style={{ color: "#004072" }}>
                  INVOKE
                </span>{" "}
                • Análisis detallado de horas por consultor
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
                  disabled={filteredAndSortedRegistrations.length === 0 || isLoadingRegistrations || isExporting}
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
                  <Download className="mr-2 h-4 w-4 text-blue-600" />
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

        {/* Stats Cards */}
        <section className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total Registros" value={totalRegistrationsCount} />
          <StatsCard label="Total Horas" value={totalHours.toFixed(1)} />
          <StatsCard label="Proyectos Únicos" value={uniqueProjects.length} />
          <StatsCard
            label="Promedio Horas/Registro"
            value={totalRegistrationsCount > 0 ? (totalHours / totalRegistrationsCount).toFixed(1) : "0"}
          />
        </section>

        {/* Filters Card */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
                <Filter className="h-5 w-5 text-white" />
              </div>
              Filtros de Análisis
            </CardTitle>
            <CardDescription className="text-gray-700">
              Selecciona el consultor y el período para visualizar sus horas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Consultor */}
            <FilterGroup label="Consultor">
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isLoadingUsers}>
                <SelectTrigger className="border border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="Selecciona un consultor" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-gray-900">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterGroup>

            {/* Periodo */}
            <FilterGroup label="Período">
              <Select value={selectedPeriod} onValueChange={(value: PeriodFilter) => setSelectedPeriod(value)}>
                <SelectTrigger className="border border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="Selecciona un período" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="all" className="text-gray-900">
                    {periods.all.label}
                  </SelectItem>
                  <SelectItem value="last7Days" className="text-gray-900">
                    {periods.last7Days.label}
                  </SelectItem>
                  <SelectItem value="last1Month" className="text-gray-900">
                    {periods.last1Month.label}
                  </SelectItem>
                  <SelectItem value="last3Months" className="text-gray-900">
                    {periods.last3Months.label}
                  </SelectItem>
                  <SelectItem value="last6Months" className="text-gray-900">
                    {periods.last6Months.label}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>
          </CardContent>
        </Card>

        {/* Detailed Hour Registrations Table */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
                <Clock className="h-5 w-5 text-white" />
              </div>
              Registros de Horas Detallados
            </CardTitle>
            <CardDescription className="text-gray-700">
              Vista completa de los registros de horas para{" "}
              <span className="font-semibold" style={{ color: "#004072" }}>
                {users.find((u) => u.id === selectedUserId)?.name}
              </span>{" "}
              en el período seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRegistrations ? (
              <EmptyState text="Cargando registros..." isLoading />
            ) : filteredAndSortedRegistrations.length === 0 ? (
              <EmptyState text="No se encontraron registros para este consultor con los filtros aplicados." />
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
                      disabled={currentPage === 1 || isLoadingRegistrations}
                      className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`${
                          currentPage === pageNumber
                            ? "text-white active:brightness-90"
                            : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        } active:scale-[0.98]`}
                        style={currentPage === pageNumber ? { backgroundColor: "#004072" } : {}}
                        disabled={isLoadingRegistrations}
                      >
                        {pageNumber}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || isLoadingRegistrations}
                      className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
                    >
                      Siguiente
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
