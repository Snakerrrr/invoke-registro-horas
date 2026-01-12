"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Clock,
  UserIcon,
  Briefcase,
  Calendar,
  Loader2,
  Save,
  ArrowLeft,
  Globe,
  Building2,
  History,
  CheckCircle,
  X,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { authenticatedFetch } from "@/lib/auth"

// Tipos para los parámetros del backend
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

// Tipos para la interfaz
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

type ProductManager = {
  id: number
  name: string
  client: string
}

type User = {
  id: string
  name: string
  email: string
  role: "consultor" | "admin"
}

type RecentEntry = {
  date: string
  project: string
  hours: string
  description: string
}

type SuccessNotification = {
  show: boolean
  message: string
  details: {
    country: string
    project: string
    hours: number
    date: string
  }
}

export function HourRegistrationForm() {
  const [countries, setCountries] = useState<Country[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [hourTypes, setHourTypes] = useState<HourType[]>([])
  const [productManagers, setProductManagers] = useState<ProductManager[]>([])
  const [consultor, setConsultor] = useState<User | null>(null)
  const [recentEntry, setRecentEntry] = useState<RecentEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingRecentEntry, setLoadingRecentEntry] = useState(true)
  const [successNotification, setSuccessNotification] = useState<SuccessNotification>({
    show: false,
    message: "",
    details: { country: "", project: "", hours: 0, date: "" },
  })

  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined)
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined)
  const [selectedHourType, setSelectedHourType] = useState<string | undefined>(undefined)
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [hoursQuantity, setHoursQuantity] = useState<number | string>("")
  const [taskDescription, setTaskDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Estados para la validación visual
  const [countryError, setCountryError] = useState(false)
  const [projectError, setProjectError] = useState(false)
  const [hourTypeError, setHourTypeError] = useState(false)
  const [dateError, setDateError] = useState(false)
  const [hoursQuantityError, setHoursQuantityError] = useState(false)
  const [taskDescriptionError, setTaskDescriptionError] = useState(false)

  // Función helper para obtener el nombre del PM por ID
  const getPmName = (pmId: number | null, allParameters: BackendParameter[]): string => {
    if (!pmId) return "Sin asignar"
    const pm = allParameters.find((p) => p.id === pmId && p.tipo === "pm")
    return pm?.nombre || "Sin asignar"
  }

  // Función para mostrar notificación de éxito
  const showSuccessNotification = (country: string, project: string, hours: number, date: string) => {
    setSuccessNotification({
      show: true,
      message: "¡Horas registradas exitosamente!",
      details: { country, project, hours, date },
    })

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setSuccessNotification((prev) => ({ ...prev, show: false }))
    }, 5000)
  }

  // Función para cerrar manualmente la notificación
  const hideSuccessNotification = () => {
    setSuccessNotification((prev) => ({ ...prev, show: false }))
  }

  // Función para formatear fecha correctamente (evitando problemas de zona horaria)
  const formatDateSafe = (dateString: string): string => {
    // Si la fecha viene en formato ISO UTC, extraer solo la parte de la fecha
    const dateOnly = dateString.includes("T") ? dateString.split("T")[0] : dateString
    const date = new Date(dateOnly + "T00:00:00") // Forzar medianoche local
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Función para obtener la entrada más reciente del usuario
  const fetchRecentEntry = async () => {
    try {
      setLoadingRecentEntry(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/hours/recent`)

      if (response.ok) {
        const data = await response.json()
        console.log("Recent entry data:", data) // Para debug

        if (data) {
          setRecentEntry({
            date: data.date,
            project: data.proyecto,
            hours: data.hours,
            description: data.description,
          })
        }
      } else {
        console.log("No recent entries found or error occurred")
        setRecentEntry(null)
      }
    } catch (error) {
      console.error("Error fetching recent entry:", error)
      setRecentEntry(null)
    } finally {
      setLoadingRecentEntry(false)
    }
  }

  // Función para obtener parámetros del backend
  const fetchParameters = async () => {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/parametros`)

      if (!response.ok) {
        throw new Error("Error al obtener parámetros")
      }

      const parameters: BackendParameter[] = await response.json()

      // Separar parámetros por tipo
      const countriesData: Country[] = parameters
        .filter((p) => p.tipo === "pais" && p.activo)
        .map((p) => ({
          id: p.id,
          name: p.nombre,
          code: p.codigo || "",
          flag: p.icono || "🏳️",
        }))

      const pmsData: ProductManager[] = parameters
        .filter((p) => p.tipo === "pm" && p.activo)
        .map((p) => ({
          id: p.id,
          name: p.nombre,
          client: p.cliente || "",
        }))

      // Procesar proyectos usando la función helper para obtener el nombre del PM
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

      // Establecer los estados
      setCountries(countriesData)
      setProductManagers(pmsData)
      setProjects(projectsData)
      setHourTypes(hourTypesData)

      console.log("Parámetros cargados para registro de horas:", {
        countries: countriesData.length,
        productManagers: pmsData.length,
        projects: projectsData.length,
        hourTypes: hourTypesData.length,
      })
    } catch (error) {
      console.error("Error fetching parameters:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los parámetros del servidor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener información del usuario actual
  const fetchCurrentUser = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/auth/me`)

      if (response.ok) {
        const userData = await response.json()
        setConsultor({
          id: userData.id?.toString() || "1",
          name: userData.name || "Usuario",
          email: userData.email || "usuario@empresa.com",
          role: userData.role || "consultor",
        })
      } else {
        // Fallback si no hay endpoint de usuario actual
        setConsultor({
          id: "1",
          name: "Usuario Actual",
          email: "usuario@empresa.com",
          role: "consultor",
        })
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
      // Fallback
      setConsultor({
        id: "1",
        name: "Usuario Actual",
        email: "usuario@empresa.com",
        role: "consultor",
      })
    }
  }

  // Función para formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    const dateOnly = dateString.includes("T") ? dateString.split("T")[0] : dateString
    const date = new Date(dateOnly + "T00:00:00") // Forzar medianoche local
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  useEffect(() => {
    fetchParameters()
    fetchCurrentUser()
    fetchRecentEntry()
  }, [])

  // Filter projects when country changes
  useEffect(() => {
    if (selectedCountry) {
      const projectsForCountry = projects.filter((p) => p.countryId.toString() === selectedCountry)
      setFilteredProjects(projectsForCountry)
      // Reset selected project if it's not in the new country
      if (selectedProject && !projectsForCountry.find((p) => p.id.toString() === selectedProject)) {
        setSelectedProject(undefined)
      }
      setCountryError(false) // Clear error when country is selected
    } else {
      setFilteredProjects([])
      setSelectedProject(undefined)
    }
  }, [selectedCountry, selectedProject, projects])

  // Clear project error when project is selected
  useEffect(() => {
    if (selectedProject) {
      setProjectError(false)
    }
  }, [selectedProject])

  // Clear hour type error when hour type is selected
  useEffect(() => {
    if (selectedHourType) {
      setHourTypeError(false)
    }
  }, [selectedHourType])

  // Clear date error when date changes
  useEffect(() => {
    if (date) {
      setDateError(false)
    }
  }, [date])

  // Clear hours quantity error when it changes
  useEffect(() => {
    const parsedHours = Number.parseFloat(hoursQuantity as string)
    if (!isNaN(parsedHours) && parsedHours > 0) {
      setHoursQuantityError(false)
    }
  }, [hoursQuantity])

  // Clear task description error when it changes
  useEffect(() => {
    if (taskDescription.trim()) {
      setTaskDescriptionError(false)
    }
  }, [taskDescription])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    let hasErrors = false

    // Reset all errors
    setCountryError(false)
    setProjectError(false)
    setHourTypeError(false)
    setDateError(false)
    setHoursQuantityError(false)
    setTaskDescriptionError(false)

    // Validate required fields
    if (!selectedCountry) {
      setCountryError(true)
      hasErrors = true
    }
    if (!selectedProject) {
      setProjectError(true)
      hasErrors = true
    }
    if (!selectedHourType) {
      setHourTypeError(true)
      hasErrors = true
    }
    if (!date) {
      setDateError(true)
      hasErrors = true
    }

    const parsedHours = Number.parseFloat(hoursQuantity as string)
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setHoursQuantityError(true)
      hasErrors = true
    }
    if (!taskDescription.trim()) {
      setTaskDescriptionError(true)
      hasErrors = true
    }

    if (hasErrors) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos obligatorios y corrige los errores.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const projectData = projects.find((p) => p.id.toString() === selectedProject)
    const hourTypeData = hourTypes.find((ht) => ht.id.toString() === selectedHourType)
    const countryData = countries.find((c) => c.id.toString() === selectedCountry)

    if (!projectData || !hourTypeData || !countryData) {
      toast({
        title: "Error interno",
        description: "No se pudieron encontrar los datos seleccionados. Intenta recargar la página.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Prepare data for backend API
    const payload = {
      country: countryData.name,
      project: projectData.name,
      hour_type: hourTypeData.name,
      date: date,
      hours_quantity: parsedHours, // Use parsedHours here
      task_description: taskDescription,
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/hours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      // Show success notification
      showSuccessNotification(countryData.name, projectData.name, parsedHours, date)

      // Also show toast for immediate feedback
      toast({
        title: "¡Registro Exitoso!",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Horas registradas correctamente para {countryData.name}</span>
          </div>
        ),
      })

      // Reset form fields after successful submission
      setSelectedCountry(undefined)
      setSelectedProject(undefined)
      setSelectedHourType(undefined)
      setDate(new Date().toISOString().split("T")[0])
      setHoursQuantity("")
      setTaskDescription("")

      // Refresh recent entry after successful submission
      fetchRecentEntry()
    } catch (error: any) {
      toast({
        title: "Error al registrar",
        description: error.message || "Hubo un problema al registrar las horas. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCountryData = countries.find((c) => c.id.toString() === selectedCountry)
  const selectedProjectData = projects.find((p) => p.id.toString() === selectedProject)
  const selectedHourTypeData = hourTypes.find((ht) => ht.id.toString() === selectedHourType)

  // Determine if all fields for preview are filled
  const canShowPreview =
    selectedCountry &&
    selectedProject &&
    selectedHourType &&
    date &&
    hoursQuantity &&
    Number.parseFloat(hoursQuantity as string) > 0 &&
    taskDescription.trim()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">Cargando parámetros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in relative">
      {/* Success Notification */}
      {successNotification.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-in fade-in duration-300">
          <Card className="w-96 border border-gray-700 shadow-2xl bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#004072] rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{successNotification.message}</h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>
                      <span className="font-medium">Proyecto:</span> {successNotification.details.project}
                    </p>
                    <p>
                      <span className="font-medium">País:</span> {successNotification.details.country}
                    </p>
                    <p>
                      <span className="font-medium">Horas:</span> {successNotification.details.hours}h
                    </p>
                    <p>
                      <span className="font-medium">Fecha:</span>{" "}
                      {new Date(successNotification.details.date + "T00:00:00").toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hideSuccessNotification}
                  className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#004072] rounded-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#004072]">Registro de Horas</h1>
            <p className="text-sm sm:text-base text-gray-900">
              <span className="text-[#004072] font-semibold">INVOKE</span> • Selecciona el país y proyecto para
              registrar tu tiempo
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

      {/* Recent Entry Card */}
      <Card className="bg-gray-900 border border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-500 animate-scale-in">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <div className="p-2 bg-[#004072] rounded-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            Último Registro
          </CardTitle>
          <CardDescription className="text-gray-300">Tu entrada más reciente para referencia rápida</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecentEntry ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
              <p className="text-gray-300">Cargando último registro...</p>
            </div>
          ) : recentEntry ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                <Label className="text-sm font-medium text-gray-300">Fecha</Label>
                <p className="text-lg font-semibold mt-1 text-gray-100 dark:text-gray-100">
                  {formatDateSafe(recentEntry.date)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                <Label className="text-sm font-medium text-gray-300">Proyecto</Label>
                <p className="text-lg font-semibold mt-1 text-gray-100 dark:text-gray-100">{recentEntry.project}</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                <Label className="text-sm font-medium text-gray-300">Horas</Label>
                <p className="text-lg font-semibold mt-1 text-gray-100 dark:text-gray-100">{recentEntry.hours}h</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                <Label className="text-sm font-medium text-gray-300">Descripción</Label>
                <p className="text-sm font-medium mt-1 text-gray-100 dark:text-gray-100 line-clamp-2">
                  {recentEntry.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay registros previos</p>
              <p className="text-sm mt-2 text-gray-400">
                Tu primer registro aparecerá aquí después de completar el formulario
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Country Selection Card */}
      <Card className="bg-gray-900 border border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-500 animate-scale-in">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <div className="p-2 bg-[#004072] rounded-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            Selección de País
          </CardTitle>
          <CardDescription className="text-gray-300">Elige el país donde se desarrolla el proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          {countries.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay países disponibles</p>
              <p className="text-sm mt-2">
                <Link href="/dashboard/gestion-parametros" className="text-primary hover:underline">
                  Añade países en Gestión de Parámetros
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((country) => (
                <Card
                  key={country.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 active:scale-[0.98] border-2 ${
                    selectedCountry === country.id.toString()
                      ? "border-[#004072] bg-[#e6f2ff] shadow-lg"
                      : countryError
                        ? "border-red-500"
                        : "bg-gray-800 border-gray-700 hover:border-[#004072]/50" // Added bg-gray-800 and adjusted border
                  }`}
                  onClick={() => setSelectedCountry(country.id.toString())}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      {country.code && (
                        <img
                          src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt={`Bandera de ${country.name}`}
                          className="mb-2 w-10 h-6 rounded shadow-md"
                        />
                      )}
                      <p className="text-sm font-medium uppercase text-gray-300">{country.code}</p>{" "}
                      {/* Changed to text-gray-300 */}
                      <h3
                        className={`font-semibold text-base ${
                          selectedCountry === country.id.toString() ? "text-[#004072]" : "text-gray-100" // Changed to text-gray-100
                        }`}
                      >
                        {country.name}
                      </h3>
                    </div>
                    {selectedCountry === country.id.toString() && (
                      <Badge className="bg-[#004072] text-white mt-2">Seleccionado</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {countryError && <p className="text-red-500 text-sm mt-2">Por favor, selecciona un país.</p>}
        </CardContent>
      </Card>

      {/* Main Form Grid */}
      <div className="grid gap-6 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
        {/* User Information */}
        <Card className="bg-gray-900 border border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <div className="p-2 bg-[#004072] rounded-lg">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              Consultor
            </CardTitle>
            <CardDescription className="text-gray-300">Información del usuario actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-600/20">
                <Label className="text-sm font-medium text-gray-300">Nombre</Label>
                <p className="text-lg font-semibold mt-1 text-gray-100">{consultor?.name || "Cargando..."}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-600/20">
                <Label className="text-sm font-medium text-gray-300">Rol</Label>
                <p className="text-lg font-semibold mt-1 capitalize text-gray-100">
                  {consultor?.role === "admin" ? "Administrador" : "Consultor"}
                </p>
              </div>
              {selectedCountryData && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <Label className="text-sm font-medium text-gray-300">País Seleccionado</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCountryData?.code && (
                      <img
                        src={`https://flagcdn.com/w20/${selectedCountryData.code.toLowerCase()}.png`}
                        alt={`Bandera de ${selectedCountryData.name}`}
                        className="w-5 h-3 rounded shadow"
                      />
                    )}
                    <p className="text-lg font-semibold text-gray-100">{selectedCountryData?.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card className="lg:col-span-2 bg-gray-900 border border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-500">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <div className="p-2 bg-[#004072] rounded-lg">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              Detalles del Registro
            </CardTitle>
            <CardDescription className="text-gray-300">Completa la información de tu jornada laboral</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection */}
              {selectedCountry && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-[#004072]" />
                    <Label className="text-base font-semibold text-[#004072]">
                      Proyectos en {selectedCountryData?.name} ({filteredProjects.length}) *
                    </Label>
                  </div>

                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-300">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay proyectos activos en {selectedCountryData?.name}</p>
                      <p className="text-sm mt-2">
                        <Link href="/dashboard/gestion-parametros" className="text-primary hover:underline">
                          Añade proyectos en Gestión de Parámetros
                        </Link>
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredProjects.map((project) => (
                        <Card
                          key={project.id}
                          className={`cursor-pointer transition-all duration-300 hover:scale-105 active:scale-[0.98] border-2 ${
                            selectedProject === project.id.toString()
                              ? "border-[#004072] bg-[#e6f2ff] shadow-lg"
                              : projectError
                                ? "border-red-500"
                                : "bg-gray-800 border-gray-700 hover:border-[#004072]/50" // Added bg-gray-800 and adjusted border
                          }`}
                          onClick={() => setSelectedProject(project.id.toString())}
                        >
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-sm mb-1 text-gray-100">{project.name}</h4>{" "}
                            {/* Changed to text-gray-100 */}
                            <p className="text-xs text-gray-300 mb-2">{project.client}</p>{" "}
                            {/* Changed to text-gray-300 */}
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                                {" "}
                                {/* Changed to text-gray-300 border-gray-600 */}
                                {project.productManagerName}
                              </Badge>
                              {selectedProject === project.id.toString() && (
                                <Badge className="bg-[#004072] text-white text-xs">✓</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {projectError && <p className="text-red-500 text-sm mt-2">Por favor, selecciona un proyecto.</p>}
                </div>
              )}

              {!selectedCountry && (
                <div className="text-center py-8 text-gray-300">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un país para ver los proyectos disponibles</p>
                </div>
              )}

              {/* Hour Type and Details */}
              {selectedProject && (
                <>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-gray-100">Tipo de Hora *</Label>
                    {hourTypes.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay tipos de hora disponibles</p>
                        <p className="text-xs mt-1">
                          <Link href="/dashboard/gestion-parametros" className="text-primary hover:underline">
                            Añade tipos de hora en Gestión de Parámetros
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={selectedHourType}
                        onValueChange={setSelectedHourType}
                        required
                        // Apply error class
                        className={hourTypeError ? "border-red-500" : ""}
                      >
                        <SelectTrigger
                          className={`h-12 border-0 bg-gray-800/50 dark:bg-slate-800/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 text-gray-100 ${
                            hourTypeError ? "border-red-500 ring-red-500" : ""
                          }`}
                          aria-invalid={hourTypeError}
                        >
                          <SelectValue placeholder="Selecciona el tipo de hora" className="text-gray-100" />
                        </SelectTrigger>
                        <SelectContent>
                          {hourTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {hourTypeError && (
                      <p className="text-red-500 text-sm mt-2">Por favor, selecciona un tipo de hora.</p>
                    )}
                  </div>

                  {/* Project Information Display */}
                  {selectedProjectData && (
                    <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
                      <div>
                        <Label className="text-sm font-medium text-gray-300">Proyecto</Label>
                        <p className="text-base font-medium mt-1 text-gray-100">{selectedProjectData.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-300">Cliente</Label>
                        <p className="text-base font-medium mt-1 text-gray-100">{selectedProjectData.client}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-300">Product Manager</Label>
                        <p className="text-base font-medium mt-1 text-gray-100">
                          {selectedProjectData.productManagerName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-300">País</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedCountryData?.code && (
                            <img
                              src={`https://flagcdn.com/w20/${selectedCountryData.code.toLowerCase()}.png`}
                              alt={`Bandera de ${selectedCountryData.name}`}
                              className="w-5 h-3 rounded shadow"
                            />
                          )}
                          <p className="text-base font-medium text-gray-100">{selectedCountryData?.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date and Hours */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium text-gray-300">
                        Fecha *
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className={`h-12 border-0 bg-gray-800/50 dark:bg-slate-800/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 text-gray-100 ${
                          dateError ? "border-red-500 ring-red-500" : ""
                        }`}
                        aria-invalid={dateError}
                      />
                      {dateError && <p className="text-red-500 text-sm mt-2">Por favor, selecciona una fecha.</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hoursQuantity" className="text-sm font-medium text-gray-300">
                        Cantidad de Horas *
                      </Label>
                      <Input
                        id="hoursQuantity"
                        type="number"
                        step="0.5"
                        min="0.5"
                        placeholder="Ej: 8.0"
                        value={hoursQuantity}
                        onChange={(e) => setHoursQuantity(e.target.value)}
                        required
                        className={`h-12 border-0 bg-gray-800/50 dark:bg-slate-800/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 text-gray-100 ${
                          hoursQuantityError ? "border-red-500 ring-red-500" : ""
                        }`}
                        aria-invalid={hoursQuantityError}
                      />
                      {hoursQuantityError && (
                        <p className="text-red-500 text-sm mt-2">La cantidad de horas debe ser un número positivo.</p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="taskDescription" className="text-sm font-medium text-gray-300">
                      Descripción de la Tarea *
                    </Label>
                    <Textarea
                      id="taskDescription"
                      placeholder="Describe las tareas realizadas durante este período..."
                      rows={4}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      required
                      className={`border-0 bg-gray-800/50 dark:bg-slate-800/50 resize-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#004072]/20 focus-visible:ring-offset-2 text-gray-100 ${
                        taskDescriptionError ? "border-red-500 ring-red-500" : ""
                      }`}
                      aria-invalid={taskDescriptionError}
                    />
                    {taskDescriptionError && (
                      <p className="text-red-500 text-sm mt-2">La descripción de la tarea no puede estar vacía.</p>
                    )}
                  </div>

                  {/* Preview del Registro */}
                  {canShowPreview && (
                    <Card className="bg-gray-900 border border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                          <div className="p-2 bg-[#004072] rounded-lg">
                            <Eye className="h-5 w-5 text-white" />
                          </div>
                          Previsualización del Registro
                        </CardTitle>
                        <CardDescription className="text-gray-300">Revisa los detalles antes de enviar</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="p-3 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                            <Label className="text-sm font-medium text-gray-300">País</Label>
                            <div className="flex items-center gap-2 mt-1">
                              {selectedCountryData?.code && (
                                <img
                                  src={`https://flagcdn.com/w20/${selectedCountryData.code.toLowerCase()}.png`}
                                  alt={`Bandera de ${selectedCountryData.name}`}
                                  className="w-5 h-3 rounded shadow"
                                />
                              )}
                              <p className="text-base font-semibold mt-1 text-gray-100 dark:text-gray-100">
                                {selectedCountryData?.name}
                              </p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                            <Label className="text-sm font-medium text-gray-300">Proyecto</Label>
                            <p className="text-base font-semibold mt-1 text-gray-100 dark:text-gray-100">
                              {selectedProjectData?.name}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                            <Label className="text-sm font-medium text-gray-300">Tipo de Hora</Label>
                            <p className="text-base font-semibold mt-1 text-gray-100 dark:text-gray-100">
                              {selectedHourTypeData?.name}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                            <Label className="text-sm font-medium text-gray-300">Fecha</Label>
                            <p className="text-base font-semibold mt-1 text-gray-100 dark:text-gray-100">
                              {new Date(date + "T00:00:00").toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50">
                            <Label className="text-sm font-medium text-gray-300">Horas</Label>
                            <p className="text-base font-semibold mt-1 text-gray-100 dark:text-gray-100">
                              {hoursQuantity}h
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/50 dark:bg-slate-800/50 border border-gray-700/50 sm:col-span-2">
                            <Label className="text-sm font-medium text-gray-300">Descripción</Label>
                            <p className="text-sm font-medium mt-1 text-gray-100 dark:text-gray-100">
                              {taskDescription}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || hourTypes.length === 0 || !canShowPreview}
                      className="flex-1 h-12 text-base font-semibold bg-[#004072] hover:bg-[#003a66] text-white transition-colors duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Registrar Horas
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:w-auto h-12 bg-transparent active:bg-muted/70"
                      onClick={() => {
                        setSelectedCountry(undefined)
                        setSelectedProject(undefined)
                        setSelectedHourType(undefined)
                        setDate(new Date().toISOString().split("T")[0])
                        setHoursQuantity("")
                        setTaskDescription("")
                        // Clear all errors on form reset
                        setCountryError(false)
                        setProjectError(false)
                        setHourTypeError(false)
                        setDateError(false)
                        setHoursQuantityError(false)
                        setTaskDescriptionError(false)
                      }}
                    >
                      Limpiar Formulario
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: "400ms" }}>
        <Card className="bg-gray-900 border border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <div className="p-2 bg-[#004072] rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Consejos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#004072] rounded-full mt-2 flex-shrink-0" />
                Selecciona primero el país para ver proyectos relevantes
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#004072] rounded-full mt-2 flex-shrink-0" />
                Registra tus horas diariamente para mayor precisión
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#004072] rounded-full mt-2 flex-shrink-0" />
                Verifica el proyecto y país antes de enviar
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <div className="p-2 bg-[#004072] rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Horas registradas</span>
                <span className="text-lg font-bold text-[#004072]">0h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Meta diaria</span>
                <span className="text-lg font-bold text-gray-100">8h</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-[#004072] h-2 rounded-full" style={{ width: "0%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
