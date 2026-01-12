"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Users, BarChart3, ArrowLeft } from "lucide-react"

export default function ReportsPage() {
  const reports = [
    {
      title: "Todos los Registros",
      description: "Accede a una tabla completa de todos los registros de horas con filtros avanzados.",
      icon: FileText,
      href: "/dashboard/registros-admin",
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Horas por Usuario",
      description: "Consulta el detalle de horas registradas por cada usuario con análisis temporal.",
      icon: Users,
      href: "/dashboard/horas-por-usuario",
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Análisis Avanzado",
      description: "Próximamente: Gráficos interactivos y análisis predictivo de productividad.",
      icon: BarChart3,
      href: "#",
      color: "green",
      gradient: "from-green-500 to-emerald-500",
      disabled: true,
    },
  ]

  const filteredRegistrations = []

  const handleExportSmartsheet = () => {
    console.log("Export Smartsheet")
  }

  const handleExportCSV = () => {
    console.log("Export CSV")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-extrabold text-gray-800 dark:text-gray-200 invoke-gradient-text invoke-title animate-fade-in-up">
          STAND BY
        </h1>
        <p
          className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          Esta sección de reportes avanzados está actualmente en desarrollo. Agradecemos tu paciencia.
        </p>
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto bg-transparent animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
