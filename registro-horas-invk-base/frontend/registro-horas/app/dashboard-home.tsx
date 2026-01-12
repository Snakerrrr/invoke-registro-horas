"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Clock,
  Package2,
  Users,
  Plus,
  LineChart,
  FileText,
  TrendingUp,
  LucideCalendar,
  Zap,
  User,
  Info,
  LayoutDashboard,
  BarChart3,
  PieChartIcon,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { isDemoUser, getAuthSourceLabel, authenticatedFetch } from "@/lib/auth"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
} from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CustomCalendar } from "@/components/custom-calendar"

// Define API response types based on actual backend responses
type SummaryResponse = {
  total: number
}

type ProjectHoursResponse = {
  project: string
  total_hours: string
}

type HourTypeResponse = {
  hour_type: string
  total_hours: string
}

type RecentActivityResponse = {
  date: string
  project: string
  user: string
  hour_type: string
  hours_quantity: string
}

type HoursByMonthResponse = {
  month: string
  total_hours: string
  project?: string
}

type HoursTypeDistributionResponse = {
  hour_type: string
  total_hours: string
}

// Define the HourRegistration type for internal use
type HourRegistration = {
  id: string
  date: string
  projectName: string
  consultorName: string
  hours: number
  hourTypeName: string
  createdAt: string
  consultorId: string
}

// Función para formatear fecha correctamente (evitando problemas de zona horaria)
const formatDateSafe = (dateString: string): string => {
  const dateOnly = dateString.includes("T") ? dateString.split("T")[0] : dateString
  const date = new Date(dateOnly + "T00:00:00")
  return date.toLocaleDateString("es-ES")
}

// Función para formatear el mes para el gráfico
const formatMonthForChart = (monthString: string): string => {
  const [year, month] = monthString.split("-")
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
  return format(date, "MMM yyyy", { locale: es })
}

// Componente de skeleton para el gráfico
const ChartSkeleton = () => (
  <div className="h-80 w-full space-y-4">
    <div className="flex justify-between items-end h-64 px-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center space-y-2">
          <Skeleton
            className="w-12 bg-gradient-to-t from-gray-200 to-gray-100 animate-pulse"
            style={{
              height: `${Math.random() * 150 + 50}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: "1.5s",
            }}
          />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="flex justify-center space-x-8">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
)

// Componente de skeleton para el gráfico circular
const PieChartSkeleton = () => (
  <div className="h-80 w-full flex flex-col items-center justify-center">
    <div className="relative w-56 h-56 mb-4">
      <Skeleton className="absolute inset-0 rounded-full animate-pulse" />
      <div
        className="absolute inset-0 rounded-full border-8 border-transparent animate-spin"
        style={{
          borderTopColor: "#e5e7eb",
          animationDuration: "1.5s",
        }}
      />
    </div>
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  </div>
)

// Componente de barra animada personalizada
const AnimatedBar = (props: any) => {
  const [animatedHeight, setAnimatedHeight] = useState(0)
  const { payload, x, y, width, height } = props

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setAnimatedHeight(height)
      },
      payload?.index * 200 + 300,
    )

    return () => clearTimeout(timer)
  }, [height, payload?.index])

  return (
    <g>
      <rect
        x={x}
        y={y + height - animatedHeight}
        width={width}
        height={animatedHeight}
        fill="#004072"
        rx={4}
        ry={4}
        style={{
          transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: "drop-shadow(0 2px 4px rgba(0, 64, 114, 0.2))",
        }}
      />
      <rect
        x={x}
        y={y + height - animatedHeight}
        width={width}
        height={Math.min(animatedHeight, 8)}
        fill="url(#barGradient)"
        rx={4}
        ry={4}
        style={{
          transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </g>
  )
}

// Colores para el gráfico circular
const COLORS = ["#004072", "#0066B3", "#0088FF", "#33AAFF", "#66CCFF", "#99DDFF"]

// Colores para los proyectos en el gráfico de barras
const PROJECT_COLORS = [
  "#004072",
  "#0066B3",
  "#0088FF",
  "#33AAFF",
  "#66CCFF",
  "#99DDFF",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#82E0AA",
]

// Componente para el sector activo del gráfico circular
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 10) * cos
  const sy = cy + (outerRadius + 10) * sin
  const mx = cx + (outerRadius + 30) * cos
  const my = cy + (outerRadius + 30) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 22
  const ey = my
  const textAnchor = cos >= 0 ? "start" : "end"

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.2))",
        }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
        style={{
          filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15))",
        }}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
        fontSize={12}
      >{`${payload.name}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#666" fontSize={12}>
        {`${value} horas (${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  )
}

const getProjectColor = (project: string, index: number) => {
  return PROJECT_COLORS[index % PROJECT_COLORS.length]
}

export default function DashboardHome() {
  const [currentDate, setCurrentDate] = useState("")
  const [totalHoursThisMonth, setTotalHoursThisMonth] = useState(0)
  const [userHoursThisMonth, setUserHoursThisMonth] = useState(0)
  const [hoursToday, setHoursToday] = useState(0)
  const [activeProjectsCount, setActiveProjectsCount] = useState(0)
  const [activeUsersCount, setActiveUsersCount] = useState(0)
  const [hoursByProject, setHoursByProject] = useState<{ name: string; hours: number }[]>([])
  const [hoursByHourType, setHoursByHourType] = useState<{ name: string; hours: number }[]>([])
  const [hoursByMonth, setHoursByMonth] = useState<{ month: string; hours: number; index: number }[]>([])
  const [groupedHoursByMonth, setGroupedHoursByMonth] = useState<{
    [key: string]: { month: string; [project: string]: number; index: number }
  }>({})
  const [recentRegistrations, setRecentRegistrations] = useState<HourRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(true)
  const [isPieChartLoading, setIsPieChartLoading] = useState(true)
  const [hoursTypeDistribution, setHoursTypeDistribution] = useState<{ name: string; value: number }[]>([])
  const [activePieIndex, setActivePieIndex] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState("3m")
  const [availableProjects, setAvailableProjects] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [barChartFilter, setBarChartFilter] = useState<"all" | "projects">("all") // Changed filter type
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Memoized function to fetch pie chart data
  const fetchPieChartData = useCallback(
    async (period: string) => {
      setIsPieChartLoading(true)
      try {
        const response = await authenticatedFetch(
          `https://backend-invoke.azurewebsites.net/api/dashboard/hours-type-distribution?period=${period}`,
        )
        const data: HoursTypeDistributionResponse[] = await response.json()

        if (Array.isArray(data)) {
          const mappedData = data.map((item) => ({
            name: item.hour_type,
            value: Number.parseFloat(item.total_hours),
          }))

          setTimeout(() => {
            setHoursTypeDistribution(mappedData)
            setIsPieChartLoading(false)
          }, 800)
        } else {
          setHoursTypeDistribution([])
          setIsPieChartLoading(false)
        }
      } catch (error) {
        console.error("Error fetching pie chart data:", error)
        setHoursTypeDistribution([])
        setIsPieChartLoading(false)
      }
    },
    [user],
  )

  // Memoized function to fetch bar chart data
  const fetchBarChartData = useCallback(
    async (filterType: "all" | "projects", projects: string[] = []) => {
      // Changed filter type
      setIsChartLoading(true)
      try {
        let url = "https://backend-invoke.azurewebsites.net/api/dashboard/hours-per-month"

        if (filterType === "projects" && projects.length > 0) {
          // Consolidated logic for projects
          const projectParams = projects.map((project) => `project=${encodeURIComponent(project)}`).join("&")
          url += `?${projectParams}`
        }

        const response = await authenticatedFetch(url)
        const data: HoursByMonthResponse[] = await response.json()

        if (Array.isArray(data)) {
          if (filterType === "all") {
            const mappedData = data.map((item, index) => ({
              month: formatMonthForChart(item.month),
              hours: Number.parseFloat(item.total_hours),
              index: index,
            }))
            setTimeout(() => {
              setHoursByMonth(mappedData)
              setGroupedHoursByMonth({})
              setIsChartLoading(false)
            }, 800)
          } else {
            // filterType === "projects"
            const projectDataPromises = projects.map(async (project) => {
              const projectUrl = `https://backend-invoke.azurewebsites.net/api/dashboard/hours-per-month?project=${encodeURIComponent(project)}`
              const projectResponse = await authenticatedFetch(projectUrl)
              const projectData: HoursByMonthResponse[] = await projectResponse.json()
              return { project, data: projectData }
            })

            const allProjectData = await Promise.all(projectDataPromises)

            const grouped: { [key: string]: { month: string; [project: string]: number; index: number } } = {}
            allProjectData.forEach(({ project, data }) => {
              data.forEach((item) => {
                const monthFormatted = formatMonthForChart(item.month)
                const hours = Number.parseFloat(item.total_hours)

                if (!grouped[monthFormatted]) {
                  grouped[monthFormatted] = {
                    month: monthFormatted,
                    index: Object.keys(grouped).length,
                  }
                }
                grouped[monthFormatted][project] = hours
              })
            })
            setTimeout(() => {
              setHoursByMonth([])
              setGroupedHoursByMonth(grouped)
              setIsChartLoading(false)
            }, 800)
          }
        } else {
          setHoursByMonth([])
          setGroupedHoursByMonth({})
          setIsChartLoading(false)
        }
      } catch (error) {
        console.error("Error fetching bar chart data:", error)
        setHoursByMonth([])
        setGroupedHoursByMonth({})
        setIsChartLoading(false)
      }
    },
    [user],
  )

  // Function to fetch summary and recent activity data
  const fetchSummaryAndRecentActivity = async () => {
    setIsLoading(true)
    try {
      const [
        todayRes,
        monthRes,
        projectsCountRes,
        usersCountRes,
        recentActivityRes,
        hoursByProjectRes,
        hoursByTypeRes,
      ] = await Promise.all([
        authenticatedFetch("https://backend-invoke.azurewebsites.net/api/dashboard/summary/today"),
        authenticatedFetch("https://backend-invoke.azurewebsites.net/api/dashboard/summary/month"),
        authenticatedFetch("https://backend-invoke.azurewebsites.net/api/dashboard/summary/active-projects"),
        authenticatedFetch("https://backend-invoke.azurewebsites.net/api/dashboard/summary/active-users"),
        authenticatedFetch("https://backend-invoke.azurewebsites.net/api/dashboard/recent-activity"),
        authenticatedFetch("https://backend-invoke.azurewebsites.net/api/dashboard/hours-by-project"),
        authenticatedFetch("https://backend-invoke.azurewebsites.net/api/dashboard/hours-by-type"),
      ])

      const todayData: SummaryResponse = await todayRes.json()
      const monthData: SummaryResponse = await monthRes.json()
      const projectsCountData: SummaryResponse = await projectsCountRes.json()
      const usersCountData: SummaryResponse = await usersCountRes.json()
      const recentActivityData: RecentActivityResponse[] = await recentActivityRes.json()
      const hoursByProjectData: ProjectHoursResponse[] = await hoursByProjectRes.json()
      const hoursByTypeData: HourTypeResponse[] = await hoursByTypeRes.json()

      setHoursToday(todayData.total || 0)
      setTotalHoursThisMonth(monthData.total || 0)
      setActiveProjectsCount(projectsCountData.total || 0)
      setActiveUsersCount(usersCountData.total || 0)

      if (Array.isArray(recentActivityData)) {
        const mappedRecentActivity: HourRegistration[] = recentActivityData.map((item, index) => ({
          id: `recent-${index}`,
          date: item.date,
          projectName: item.project,
          consultorName: item.user,
          hours: Number.parseFloat(item.hours_quantity),
          hourTypeName: item.hour_type,
          createdAt: item.date,
          consultorId: item.user,
        }))
        const filteredRecentActivity =
          user?.role === "consultor"
            ? mappedRecentActivity.filter((reg) => reg.consultorName === user.name)
            : mappedRecentActivity
        setRecentRegistrations(filteredRecentActivity)
      } else {
        setRecentRegistrations([])
      }

      if (Array.isArray(hoursByProjectData)) {
        const mappedProjectHours = hoursByProjectData.map((item) => ({
          name: item.project,
          hours: Number.parseFloat(item.total_hours),
        }))
        setHoursByProject(mappedProjectHours)
        const projects = hoursByProjectData.map((item) => item.project)
        setAvailableProjects(projects)
      } else {
        setHoursByProject([])
        setAvailableProjects([])
      }

      if (Array.isArray(hoursByTypeData)) {
        const mappedHourTypes = hoursByTypeData.map((item) => ({
          name: item.hour_type,
          hours: Number.parseFloat(item.total_hours),
        }))
        setHoursByHourType(mappedHourTypes)
      } else {
        setHoursByHourType([])
      }

      if (user?.role === "consultor" && Array.isArray(recentActivityData)) {
        const userRecent = recentActivityData.filter((reg) => reg.user === user.name)
        const userHours = userRecent.reduce((sum, reg) => sum + Number.parseFloat(reg.hours_quantity), 0)
        setUserHoursThisMonth(userHours)
      } else {
        setUserHoursThisMonth(0)
      }
    } catch (error) {
      console.error("Error fetching summary and recent activity data:", error)
      setHoursToday(0)
      setTotalHoursThisMonth(0)
      setActiveProjectsCount(0)
      setActiveUsersCount(0)
      setRecentRegistrations([])
      setHoursByProject([])
      setHoursByHourType([])
      setUserHoursThisMonth(0)
      setAvailableProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch for summary and recent activity data
  useEffect(() => {
    setCurrentDate(format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }))
    if (user) {
      fetchSummaryAndRecentActivity()
    }
  }, [user])

  // Effect for Pie Chart data
  useEffect(() => {
    if (user) {
      fetchPieChartData(selectedPeriod)
    }
  }, [user, selectedPeriod, fetchPieChartData])

  // Effect for Bar Chart data
  useEffect(() => {
    if (user) {
      fetchBarChartData(barChartFilter, selectedProjects)
    }
  }, [user, barChartFilter, selectedProjects, fetchBarChartData])

  // Memoized handler for bar chart filter change
  const handleBarChartFilterChange = useCallback((filterType: "all" | "projects") => {
    // Changed filter type
    setBarChartFilter(filterType)
    if (filterType === "all") {
      setSelectedProjects([])
    }
  }, [])

  // Memoized handler for project selection
  const handleProjectSelection = useCallback(
    (project: string, checked: boolean) => {
      let newSelectedProjects: string[]

      if (checked) {
        newSelectedProjects = [...selectedProjects, project]
      } else {
        newSelectedProjects = selectedProjects.filter((p) => p !== project)
      }

      setSelectedProjects(newSelectedProjects)
    },
    [selectedProjects],
  )

  const isAdmin = user?.role === "administrador"
  const isConsultor = user?.role === "consultor"
  const isDemo = isDemoUser(user)
  const authSource = getAuthSourceLabel(user)

  // Función para obtener el título del período seleccionado
  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case "3m":
        return "últimos 3 meses"
      case "6m":
        return "últimos 6 meses"
      case "1y":
        return "último año"
      default:
        return "últimos 3 meses"
    }
  }

  // Función para obtener el título del filtro del gráfico de barras
  const getBarChartFilterTitle = () => {
    if (barChartFilter === "all") {
      return "todos los proyectos"
    } else if (barChartFilter === "projects" && selectedProjects.length > 0) {
      // Changed filter type
      return `${selectedProjects.length} proyecto${selectedProjects.length > 1 ? "s" : ""} seleccionado${selectedProjects.length > 1 ? "s" : ""}`
    }
    return "filtro personalizado"
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Demo Mode Alert */}
      {isDemo && (
        <Alert style={{ borderColor: "#004072", backgroundColor: "#e6f2ff" }}>
          <Info className="h-4 w-4" style={{ color: "#004072" }} />
          <AlertDescription style={{ color: "#003a66" }}>
            <strong>Modo Demostración:</strong> Estás usando credenciales de prueba. Los datos mostrados son simulados
            para fines de demostración.
          </AlertDescription>
        </Alert>
      )}

      {/* INVOKE Header Section - Role-specific */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          {/* INVOKE Brand Header */}
          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
            >
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1
                className="flex items-center gap-2 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold"
                style={{ color: "#004072" }}
              >
                <LayoutDashboard className="h-8 w-8 sm:h-10 sm:w-10" />
                Dashboard
              </h1>
              <p className="text-sm sm:text-base lg:text-lg font-medium" style={{ color: "#004072" }}>
                {isConsultor ? "Portal del Consultor" : "Sistema de Registro de Horas"}
              </p>
            </div>
          </div>

          <div className="space-y-2 ml-16 sm:ml-20">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Bienvenido{user ? `, ${user.name}` : ""}
            </h2>
            <div className="flex items-center gap-2 text-gray-600">
              <LucideCalendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <p className="text-sm sm:text-base lg:text-lg capitalize font-medium">{currentDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs sm:text-sm text-white"
                style={{ backgroundColor: "#004072", borderColor: "#004072" }}
              >
                {user?.role === "administrador" ? "Administrador" : "Consultor"}
              </Badge>
              <Badge
                variant={isDemo ? "outline" : "default"}
                className="text-xs sm:text-sm"
                style={{
                  borderColor: "#004072",
                  color: "#004072",
                  ...(isDemo ? {} : { backgroundColor: "#004072", color: "white" }),
                }}
              >
                {authSource}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          asChild
          size="default"
          className="hover:scale-105 transition-all duration-300 shadow-lg w-full sm:w-auto text-white"
          style={{
            background: "linear-gradient(135deg, #004072 0%, #003a66 100%)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #003a66 0%, #002d52 100%)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #004072 0%, #003a66 100%)"
          }}
        >
          <Link href="/dashboard/registro">
            <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Registrar Horas</span>
            <span className="sm:hidden">Registrar</span>
          </Link>
        </Button>
      </div>

      {/* Stats Cards - Role-specific */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Personal Hours Card - Always visible */}
        <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-semibold text-gray-600">
              <span className="hidden sm:inline">{isConsultor ? "Mis Horas del Mes" : "Horas Registradas Hoy"}</span>
              <span className="sm:hidden">{isConsultor ? "Mis Horas" : "Horas Hoy"}</span>
            </CardTitle>
            <div
              className="p-1.5 sm:p-2 rounded-lg"
              style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
            >
              {isConsultor ? (
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              ) : (
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {isConsultor ? userHoursThisMonth : hoursToday}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
              <p className="text-xs text-green-600 font-medium">
                <span className="hidden sm:inline">{isConsultor ? "Este mes" : "+20.1% vs mes anterior"}</span>
                <span className="sm:hidden">{isConsultor ? "Mes actual" : "+20.1%"}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin-only cards */}
        {isAdmin && (
          <>
            <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">Horas Totales del Mes</span>
                  <span className="sm:hidden">Total Mes</span>
                </CardTitle>
                <div
                  className="p-1.5 sm:p-2 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
                >
                  <LineChart className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalHoursThisMonth}</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">Total registradas</span>
                  <span className="sm:hidden">Registradas</span>
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">Proyectos Activos</span>
                  <span className="sm:hidden">Proyectos</span>
                </CardTitle>
                <div
                  className="p-1.5 sm:p-2 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
                >
                  <Package2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{activeProjectsCount}</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">3 en progreso</span>
                  <span className="sm:hidden">3 activos</span>
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">Usuarios Activos</span>
                  <span className="sm:hidden">Usuarios</span>
                </CardTitle>
                <div
                  className="p-1.5 sm:p-2 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{activeUsersCount}</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">Total en la empresa</span>
                  <span className="sm:hidden">En empresa</span>
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Consultant-specific additional cards */}
        {isConsultor && (
          <>
            <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">Proyectos Asignados</span>
                  <span className="sm:hidden">Proyectos</span>
                </CardTitle>
                <div
                  className="p-1.5 sm:p-2 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
                >
                  <Package2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{hoursByProject.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">Activos este mes</span>
                  <span className="sm:hidden">Activos</span>
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-600">
                  <span className="hidden sm:inline">Promedio Diario</span>
                  <span className="sm:hidden">Promedio</span>
                </CardTitle>
                <div
                  className="p-1.5 sm:p-2 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
                >
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {recentRegistrations.length > 0 && userHoursThisMonth > 0
                    ? (
                        userHoursThisMonth /
                        recentRegistrations.filter((reg) => reg.consultorName === user?.name).length
                      ).toFixed(1)
                    : "0"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">Horas por día</span>
                  <span className="sm:hidden">H/día</span>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Bar Chart - Full Width */}
      <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <div
              className="p-1.5 sm:p-2 rounded-lg"
              style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="hidden sm:inline text-gray-900">Horas por Mes</span>
            <span className="sm:hidden text-gray-900">Por Mes</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            <span className="hidden sm:inline text-gray-700">
              {isConsultor
                ? `Tu evolución mensual - ${getBarChartFilterTitle()}`
                : `Evolución mensual - ${getBarChartFilterTitle()}`}
            </span>
            <span className="sm:hidden text-gray-700">Evolución mensual</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {/* Filtros para el gráfico de barras */}
          <div className="mb-4 space-y-3">
            <Tabs
              defaultValue="all"
              onValueChange={(value) => handleBarChartFilterChange(value as "all" | "projects")} // Changed filter type
            >
              <TabsList className="grid grid-cols-2 w-full max-w-sm mx-auto">
                {" "}
                {/* Changed grid-cols to 2 */}
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="projects">Proyectos</TabsTrigger> {/* Changed trigger value and text */}
              </TabsList>
            </Tabs>

            {/* Selector de proyectos */}
            {barChartFilter === "projects" && ( // Show only for "projects" filter
              <div className="flex justify-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full max-w-sm text-white shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #004072 0%, #003a66 100%)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #003a66 0%, #002d52 100%)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #004072 0%, #003a66 100%)"
                      }}
                    >
                      {selectedProjects.length === 0
                        ? "Seleccionar proyectos"
                        : `${selectedProjects.length} proyecto${selectedProjects.length > 1 ? "s" : ""} seleccionado${selectedProjects.length > 1 ? "s" : ""}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableProjects.map((project) => (
                        <div key={project} className="flex items-center space-x-2">
                          <Checkbox
                            id={project}
                            checked={selectedProjects.includes(project)}
                            onCheckedChange={(checked) => handleProjectSelection(project, checked as boolean)}
                          />
                          <label
                            htmlFor={project}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {project}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {isChartLoading ? (
            <ChartSkeleton />
          ) : (barChartFilter === "all" ? hoursByMonth.length === 0 : Object.keys(groupedHoursByMonth).length === 0) ? (
            <div className="text-center py-12 sm:py-16">
              <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 text-sm sm:text-base">No hay datos disponibles para mostrar</p>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartFilter === "all" ? hoursByMonth : Object.values(groupedHoursByMonth)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0066cc" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#004072" stopOpacity={1} />
                    </linearGradient>
                    {selectedProjects.map((project, index) => (
                      <linearGradient
                        key={`gradient-${project}`}
                        id={`projectGradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={getProjectColor(project, index)} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={getProjectColor(project, index)} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    style={{
                      opacity: 0,
                      animation: "fadeIn 1s ease-in-out 0.5s forwards",
                    }}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#666" }}
                    axisLine={{ stroke: "#e0e0e0" }}
                    style={{
                      opacity: 0,
                      animation: "fadeIn 0.8s ease-in-out 1s forwards",
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#666" }}
                    axisLine={{ stroke: "#e0e0e0" }}
                    label={{
                      value: "Horas",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fill: "#666" },
                    }}
                    style={{
                      opacity: 0,
                      animation: "fadeIn 0.8s ease-in-out 1s forwards",
                    }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      opacity: 0.95,
                    }}
                    labelStyle={{ color: "#333", fontWeight: "bold" }}
                    formatter={(value: number, name: string) => {
                      if (barChartFilter === "all") {
                        return [`${value} horas`, "Total"]
                      } else {
                        return [`${value} horas`, name]
                      }
                    }}
                    animationDuration={200}
                  />
                  {barChartFilter === "all" ? (
                    <Bar dataKey="hours" shape={<AnimatedBar />} radius={[4, 4, 0, 0]} />
                  ) : (
                    selectedProjects.map((project, index) => (
                      <Bar
                        key={project}
                        dataKey={project}
                        fill={getProjectColor(project, index)}
                        radius={[4, 4, 0, 0]}
                        name={project}
                      />
                    ))
                  )}
                  {barChartFilter === "projects" &&
                    selectedProjects.length > 0 && ( // Changed filter type
                      <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        formatter={(value) => <span style={{ color: "#333", fontSize: "12px" }}>{value}</span>}
                      />
                    )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart and Calendar Row */}
      <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Pie Chart - Hours by Type Distribution */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div
                className="p-1.5 sm:p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
              >
                <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="hidden sm:inline text-gray-900">Por Tipo de Hora</span>
              <span className="sm:hidden text-gray-900">Por Tipo</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              <span className="hidden sm:inline text-gray-700">
                {isConsultor ? `Tu distribución en los ${getPeriodTitle()}` : `Distribución en los ${getPeriodTitle()}`}
              </span>
              <span className="sm:hidden text-gray-700">{getPeriodTitle()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Tabs defaultValue="3m" className="mb-4" onValueChange={(value) => fetchPieChartData(value)}>
              <TabsList className="grid grid-cols-3 w-full max-w-xs mx-auto">
                <TabsTrigger value="3m">3M</TabsTrigger>
                <TabsTrigger value="6m">6M</TabsTrigger>
                <TabsTrigger value="1y">1A</TabsTrigger>
              </TabsList>
            </Tabs>

            {isPieChartLoading ? (
              <PieChartSkeleton />
            ) : hoursTypeDistribution.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <PieChartIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 text-sm sm:text-base">No hay datos disponibles para mostrar</p>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {COLORS.map((color, index) => (
                        <linearGradient
                          key={`gradient-${index}`}
                          id={`colorGradient-${index}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={color} stopOpacity={1} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={hoursTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      animationBegin={200}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      isAnimationActive={true}
                      style={{
                        filter: "drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.15))",
                      }}
                    >
                      {hoursTypeDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#colorGradient-${index % COLORS.length})`}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{
                        paddingTop: "10px",
                        fontSize: "12px",
                      }}
                      formatter={(value, entry, index) => (
                        <span style={{ color: "#333", fontSize: "11px" }}>{value}</span>
                      )}
                    />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [`${value} horas`, name]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Calendar */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div
                className="p-1.5 sm:p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
              >
                <LucideCalendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-gray-900">Calendario</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              <span className="text-gray-700">Selecciona una fecha para ver detalles</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex justify-center">
              <CustomCalendar selected={selectedDate} onSelect={setSelectedDate} className="w-full max-w-sm" />
            </div>
            {selectedDate && (
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: "#e6f2ff" }}>
                <p className="text-sm" style={{ color: "#004072" }}>
                  <span className="font-medium">Fecha seleccionada:</span>{" "}
                  {selectedDate.toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Role-specific */}
      <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
          <CardHeader className="pb-4 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div
                className="p-1.5 sm:p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
              >
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="hidden sm:inline text-gray-900">
                {isConsultor ? "Mi Actividad Reciente" : "Actividad Reciente"}
              </span>
              <span className="sm:hidden text-gray-900">Reciente</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              <span className="hidden sm:inline text-gray-700">
                {isConsultor ? "Tus últimos registros de horas" : "Últimos registros del sistema"}
              </span>
              <span className="sm:hidden text-gray-700">Últimos registros</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {recentRegistrations.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 text-sm sm:text-base">
                  {isConsultor ? "No has registrado horas aún" : "No hay registros recientes"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentRegistrations.slice(0, 5).map((reg, index) => (
                  <div
                    key={reg.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-gray-100 transition-all duration-300 space-y-2 sm:space-y-0"
                    style={{
                      borderColor: "#e6f2ff",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#004072"
                      e.currentTarget.style.backgroundColor = "#e6f2ff"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e6f2ff"
                      e.currentTarget.style.backgroundColor = ""
                    }}
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{reg.projectName}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {formatDateSafe(reg.date)}
                        {isAdmin && ` • ${reg.consultorName}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:text-right">
                      <p className="font-bold text-base sm:text-lg" style={{ color: "#004072" }}>
                        {reg.hours}h
                      </p>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: "#004072", color: "#004072" }}>
                        {reg.hourTypeName}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - Role-specific */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
          <CardHeader className="pb-4 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div
                className="p-1.5 sm:p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
              >
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="hidden sm:inline text-gray-900">Acciones Rápidas</span>
              <span className="sm:hidden text-gray-900">Acciones</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              <span className="hidden sm:inline text-gray-700">
                {isConsultor ? "Funciones principales para consultores" : "Navega a las funciones principales"}
              </span>
              <span className="sm:hidden text-gray-700">Funciones principales</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 pt-0">
            <Button
              asChild
              variant="outline"
              className="h-16 sm:h-20 flex-col gap-2 hover:scale-105 transition-all duration-300 border-2 border-gray-200 hover:shadow-lg bg-white"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#004072"
                e.currentTarget.style.backgroundColor = "#e6f2ff"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.backgroundColor = "white"
              }}
            >
              <Link href="/dashboard/registro">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#004072" }} />
                <span className="font-semibold text-xs sm:text-sm" style={{ color: "#004072" }}>
                  <span className="hidden sm:inline">Registrar Horas</span>
                  <span className="sm:hidden">Registrar</span>
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-16 sm:h-20 flex-col gap-2 hover:scale-105 transition-all duration-300 border-2 border-gray-200 hover:shadow-lg bg-white"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#004072"
                e.currentTarget.style.backgroundColor = "#e6f2ff"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.backgroundColor = "white"
              }}
            >
              <Link href="/dashboard/reportes">
                <LineChart className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#004072" }} />
                <span className="font-semibold text-xs sm:text-sm" style={{ color: "#004072" }}>
                  <span className="hidden sm:inline">{isConsultor ? "Mis Reportes" : "Ver Reportes"}</span>
                  <span className="sm:hidden">Reportes</span>
                </span>
              </Link>
            </Button>
            {isAdmin && (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-16 sm:h-20 flex-col gap-2 hover:scale-105 transition-all duration-300 border-2 border-gray-200 hover:shadow-lg bg-white"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#004072"
                    e.currentTarget.style.backgroundColor = "#e6f2ff"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db"
                    e.currentTarget.style.backgroundColor = "white"
                  }}
                >
                  <Link href="/dashboard/registros-admin">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#004072" }} />
                    <span className="font-semibold text-xs sm:text-sm text-center" style={{ color: "#004072" }}>
                      <span className="hidden sm:inline">Todos los Registros</span>
                      <span className="sm:hidden">Registros</span>
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-16 sm:h-20 flex-col gap-2 hover:scale-105 transition-all duration-300 border-2 border-gray-200 hover:shadow-lg bg-white"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#004072"
                    e.currentTarget.style.backgroundColor = "#e6f2ff"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db"
                    e.currentTarget.style.backgroundColor = "white"
                  }}
                >
                  <Link href="/dashboard/gestion-usuarios">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#004072" }} />
                    <span className="font-semibold text-xs sm:text-sm text-center" style={{ color: "#004072" }}>
                      <span className="hidden sm:inline">Gestionar Usuarios</span>
                      <span className="sm:hidden">Usuarios</span>
                    </span>
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section - Role-specific */}
      <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div
                className="p-1.5 sm:p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
              >
                <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="hidden sm:inline text-gray-900">
                {isConsultor ? "Mis Proyectos" : "Horas por Proyecto"}
              </span>
              <span className="sm:hidden text-gray-900">Proyectos</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              <span className="hidden sm:inline text-gray-700">
                {isConsultor ? "Tus proyectos del mes actual" : "Distribución del mes actual"}
              </span>
              <span className="sm:hidden text-gray-700">Mes actual</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {hoursByProject.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Package2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 text-sm sm:text-base">
                  {isConsultor ? "No has trabajado en proyectos este mes" : "No hay datos disponibles"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {hoursByProject.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-100 transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#004072"
                      e.currentTarget.style.backgroundColor = "#e6f2ff"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#f3f4f6"
                      e.currentTarget.style.backgroundColor = ""
                    }}
                  >
                    <span className="font-medium text-sm sm:text-base truncate pr-2 text-gray-900">{item.name}</span>
                    <Badge
                      className="font-bold text-xs sm:text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
                    >
                      {item.hours}h
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div
                className="p-1.5 sm:p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
              >
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="hidden sm:inline text-gray-900">
                {isConsultor ? "Mis Tipos de Hora" : "Tipos de Hora"}
              </span>
              <span className="sm:hidden text-gray-900">Por Tipo</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              <span className="hidden sm:inline text-gray-700">
                {isConsultor ? "Tu distribución del mes actual" : "Distribución del mes actual"}
              </span>
              <span className="sm:hidden text-gray-700">Mes actual</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {hoursByHourType.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 text-sm sm:text-base">
                  {isConsultor ? "No has registrado horas este mes" : "No hay datos disponibles"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {hoursByHourType.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-100 transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#004072"
                      e.currentTarget.style.backgroundColor = "#e6f2ff"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#f3f4f6"
                      e.currentTarget.style.backgroundColor = ""
                    }}
                  >
                    <span className="font-medium text-sm sm:text-base truncate pr-2 text-gray-900">{item.name}</span>
                    <Badge
                      className="font-bold text-xs sm:text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
                    >
                      {item.hours}h
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
