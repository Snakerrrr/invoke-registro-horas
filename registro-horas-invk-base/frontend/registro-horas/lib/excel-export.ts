import { format } from "date-fns"
import { es } from "date-fns/locale"

// Simulamos la funcionalidad de Excel export usando una librería ligera
// En un entorno real, usarías xlsx o exceljs
export type ExcelColumn = {
  header: string
  key: string
  width?: number
  type?: "string" | "number" | "date" | "boolean"
  format?: string
}

export type ExcelWorksheet = {
  name: string
  columns: ExcelColumn[]
  data: any[]
  autoFilter?: boolean
  freezeRows?: number
  freezeCols?: number
}

export type ExcelExportOptions = {
  filename: string
  worksheets: ExcelWorksheet[]
  metadata?: {
    title?: string
    subject?: string
    creator?: string
    company?: string
  }
}

export class ExcelExporter {
  private static formatCellValue(value: any, type?: string): any {
    if (value === null || value === undefined) {
      return ""
    }

    switch (type) {
      case "date":
        if (value instanceof Date) {
          return value
        }
        if (typeof value === "string") {
          const date = new Date(value)
          return isNaN(date.getTime()) ? value : date
        }
        return value
      case "number":
        return typeof value === "number" ? value : Number.parseFloat(value) || 0
      case "boolean":
        return Boolean(value)
      default:
        return String(value)
    }
  }

  private static generateExcelContent(options: ExcelExportOptions): string {
    // Simulamos la generación de un archivo Excel usando formato CSV mejorado
    // que Smartsheet puede importar como Excel
    let content = ""

    // Metadata
    if (options.metadata) {
      content += `# Excel Export - ${options.metadata.title || options.filename}\n`
      content += `# Creator: ${options.metadata.creator || "INVOKE Hours Management System"}\n`
      content += `# Company: ${options.metadata.company || "INVOKE"}\n`
      content += `# Generated: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}\n`
      content += `# Subject: ${options.metadata.subject || "Data Export"}\n`
      content += `#\n`
    }

    options.worksheets.forEach((worksheet, index) => {
      if (index > 0) {
        content += `\n# WORKSHEET: ${worksheet.name}\n`
      }

      // Headers
      const headers = worksheet.columns.map((col) => `"${col.header}"`)
      content += headers.join(",") + "\n"

      // Data rows
      worksheet.data.forEach((row) => {
        const values = worksheet.columns.map((col) => {
          const value = row[col.key] || ""
          const formattedValue = this.formatCellValue(value, col.type)

          if (col.type === "date" && formattedValue instanceof Date) {
            return `"${format(formattedValue, "dd/MM/yyyy", { locale: es })}"`
          }

          if (
            typeof formattedValue === "string" &&
            (formattedValue.includes(",") || formattedValue.includes('"') || formattedValue.includes("\n"))
          ) {
            return `"${formattedValue.replace(/"/g, '""')}"`
          }

          return formattedValue
        })
        content += values.join(",") + "\n"
      })

      if (index < options.worksheets.length - 1) {
        content += "\n"
      }
    })

    return content
  }

  static async exportToExcel(options: ExcelExportOptions): Promise<void> {
    try {
      // En un entorno real, aquí usarías una librería como xlsx o exceljs
      // Por ahora, generamos un archivo compatible con Excel que Smartsheet puede importar
      const content = this.generateExcelContent(options)

      // Crear blob con tipo Excel
      const blob = new Blob([content], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Crear enlace de descarga
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `${options.filename}.xlsx`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      throw new Error("Error al exportar a Excel. Por favor, inténtalo de nuevo.")
    }
  }

  // Exportación específica para registros de horas
  static async exportHourRegistrations(registrations: any[]): Promise<void> {
    const worksheet: ExcelWorksheet = {
      name: "Registros de Horas",
      autoFilter: true,
      freezeRows: 1,
      columns: [
        { header: "ID Registro", key: "id", width: 15, type: "string" },
        { header: "Fecha", key: "date", width: 12, type: "date" },
        { header: "Consultor", key: "consultorName", width: 20, type: "string" },
        { header: "Proyecto", key: "projectName", width: 25, type: "string" },
        { header: "Cliente", key: "clientName", width: 20, type: "string" },
        { header: "Product Manager", key: "productManagerName", width: 20, type: "string" },
        { header: "Tipo de Hora", key: "hourTypeName", width: 15, type: "string" },
        { header: "País", key: "countryName", width: 15, type: "string" },
        { header: "Horas", key: "hours", width: 10, type: "number" },
        { header: "Descripción", key: "description", width: 40, type: "string" },
        { header: "Fecha Creación", key: "createdAt", width: 15, type: "date" },
      ],
      data: registrations.map((reg) => ({
        id: reg.id,
        date: new Date(reg.date),
        consultorName: reg.consultorName,
        projectName: reg.projectName,
        clientName: reg.clientName,
        productManagerName: reg.productManagerName,
        hourTypeName: reg.hourTypeName,
        countryName: reg.countryName,
        hours: reg.hours,
        description: reg.description,
        createdAt: new Date(reg.createdAt),
      })),
    }

    await this.exportToExcel({
      filename: `INVOKE_Registros_Horas_${format(new Date(), "yyyyMMdd_HHmm")}`,
      worksheets: [worksheet],
      metadata: {
        title: "Registros de Horas - INVOKE",
        subject: "Exportación completa de registros de horas",
        creator: "INVOKE Hours Management System",
        company: "INVOKE",
      },
    })
  }

  // Exportación específica para gestión de usuarios
  static async exportUserManagement(users: any[]): Promise<void> {
    const worksheet: ExcelWorksheet = {
      name: "Gestión de Usuarios",
      autoFilter: true,
      freezeRows: 1,
      columns: [
        { header: "ID Usuario", key: "id", width: 15, type: "string" },
        { header: "Nombre Completo", key: "name", width: 25, type: "string" },
        { header: "Email", key: "email", width: 30, type: "string" },
        { header: "Rol", key: "role", width: 15, type: "string" },
        { header: "Estado", key: "status", width: 12, type: "string" },
        { header: "Último Registro", key: "lastHourRegistration", width: 18, type: "string" },
        { header: "Total Horas", key: "totalHours", width: 12, type: "number" },
        { header: "Fecha Creación", key: "createdAt", width: 15, type: "date" },
      ],
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === "admin" ? "Administrador" : "Consultor",
        status: "Activo",
        lastHourRegistration: user.lastHourRegistration || "Nunca",
        totalHours: user.totalHours || 0,
        createdAt: new Date(),
      })),
    }

    await this.exportToExcel({
      filename: `INVOKE_Gestion_Usuarios_${format(new Date(), "yyyyMMdd_HHmm")}`,
      worksheets: [worksheet],
      metadata: {
        title: "Gestión de Usuarios - INVOKE",
        subject: "Exportación de usuarios del sistema",
        creator: "INVOKE Hours Management System",
        company: "INVOKE",
      },
    })
  }

  // Exportación específica para matriz de horas diarias
  static async exportDailyHoursMatrix(
    dailyMatrix: any[],
    userSummaries: any[],
    dateRange: { from?: Date; to?: Date },
  ): Promise<void> {
    // Preparar datos para la matriz
    const matrixData = dailyMatrix.map((day) => {
      const row: any = {
        fecha: day.formattedDate,
        fecha_iso: new Date(day.date),
      }

      userSummaries.forEach((user) => {
        row[`user_${user.userId}`] = day.userHours[user.userId] || 0
      })

      return row
    })

    // Agregar fila de totales
    const totalRow: any = {
      fecha: "SUMA TOTAL",
      fecha_iso: "",
    }
    userSummaries.forEach((user) => {
      totalRow[`user_${user.userId}`] = user.totalHours
    })
    matrixData.push(totalRow)

    // Crear columnas dinámicamente
    const columns: ExcelColumn[] = [{ header: "Fecha", key: "fecha", width: 12, type: "string" }]

    userSummaries.forEach((user) => {
      columns.push({
        header: user.userName,
        key: `user_${user.userId}`,
        width: 12,
        type: "number",
      })
    })

    // Worksheet principal con la matriz
    const matrixWorksheet: ExcelWorksheet = {
      name: "Matriz Horas Diarias",
      autoFilter: true,
      freezeRows: 1,
      freezeCols: 1,
      columns,
      data: matrixData,
    }

    // Worksheet de resumen por usuario
    const summaryWorksheet: ExcelWorksheet = {
      name: "Resumen por Usuario",
      autoFilter: true,
      freezeRows: 1,
      columns: [
        { header: "Usuario", key: "userName", width: 25, type: "string" },
        { header: "Total Horas", key: "totalHours", width: 12, type: "number" },
        { header: "Días Activos", key: "activeDays", width: 12, type: "number" },
        { header: "Promedio Diario", key: "averageDaily", width: 15, type: "number" },
        { header: "Máximo Diario", key: "maxDaily", width: 15, type: "number" },
      ],
      data: userSummaries.map((user) => {
        const userDays = dailyMatrix.filter((day) => day.userHours[user.userId] > 0)
        const maxDaily = Math.max(...dailyMatrix.map((day) => day.userHours[user.userId] || 0))

        return {
          userName: user.userName,
          totalHours: user.totalHours,
          activeDays: userDays.length,
          averageDaily: userDays.length > 0 ? user.totalHours / userDays.length : 0,
          maxDaily: maxDaily,
        }
      }),
    }

    const periodText =
      dateRange.from && dateRange.to
        ? `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`
        : "Período personalizado"

    await this.exportToExcel({
      filename: `INVOKE_Matriz_Horas_${format(new Date(), "yyyyMMdd_HHmm")}`,
      worksheets: [matrixWorksheet, summaryWorksheet],
      metadata: {
        title: `Análisis Detallado de Horas - INVOKE`,
        subject: `Matriz de horas diarias - Período: ${periodText}`,
        creator: "INVOKE Hours Management System",
        company: "INVOKE",
      },
    })
  }

  // Exportación para parámetros del sistema
  static async exportParameters(countries: any[], projects: any[], hourTypes: any[]): Promise<void> {
    const countriesWorksheet: ExcelWorksheet = {
      name: "Países",
      autoFilter: true,
      freezeRows: 1,
      columns: [
        { header: "ID", key: "id", width: 15, type: "string" },
        { header: "Nombre", key: "name", width: 20, type: "string" },
        { header: "Código", key: "code", width: 10, type: "string" },
        { header: "Bandera", key: "flag", width: 10, type: "string" },
        { header: "Proyectos Asociados", key: "projectCount", width: 18, type: "number" },
      ],
      data: countries.map((country) => ({
        id: country.id,
        name: country.name,
        code: country.code,
        flag: country.flag,
        projectCount: projects.filter((p) => p.countryId === country.id).length,
      })),
    }

    const projectsWorksheet: ExcelWorksheet = {
      name: "Proyectos",
      autoFilter: true,
      freezeRows: 1,
      columns: [
        { header: "ID", key: "id", width: 15, type: "string" },
        { header: "Nombre", key: "name", width: 25, type: "string" },
        { header: "Cliente", key: "client", width: 20, type: "string" },
        { header: "Product Manager", key: "productManager", width: 20, type: "string" },
        { header: "País", key: "countryName", width: 15, type: "string" },
        { header: "Estado", key: "status", width: 12, type: "string" },
      ],
      data: projects.map((project) => ({
        id: project.id,
        name: project.name,
        client: project.client,
        productManager: project.productManager,
        countryName: countries.find((c) => c.id === project.countryId)?.name || "N/A",
        status: project.status === "active" ? "Activo" : "Inactivo",
      })),
    }

    const hourTypesWorksheet: ExcelWorksheet = {
      name: "Tipos de Hora",
      autoFilter: true,
      freezeRows: 1,
      columns: [
        { header: "ID", key: "id", width: 15, type: "string" },
        { header: "Nombre", key: "name", width: 25, type: "string" },
        { header: "Estado", key: "status", width: 12, type: "string" },
      ],
      data: hourTypes.map((type) => ({
        id: type.id,
        name: type.name,
        status: "Activo",
      })),
    }

    await this.exportToExcel({
      filename: `INVOKE_Parametros_Sistema_${format(new Date(), "yyyyMMdd_HHmm")}`,
      worksheets: [countriesWorksheet, projectsWorksheet, hourTypesWorksheet],
      metadata: {
        title: "Parámetros del Sistema - INVOKE",
        subject: "Configuración de países, proyectos y tipos de hora",
        creator: "INVOKE Hours Management System",
        company: "INVOKE",
      },
    })
  }

  // Exportación de reportes generales
  static async exportReports(reportData: any[], reportType: string): Promise<void> {
    const worksheet: ExcelWorksheet = {
      name: `Reporte ${reportType}`,
      autoFilter: true,
      freezeRows: 1,
      columns: [
        { header: "Período", key: "period", width: 15, type: "string" },
        { header: "Consultor", key: "consultant", width: 20, type: "string" },
        { header: "Proyecto", key: "project", width: 25, type: "string" },
        { header: "Cliente", key: "client", width: 20, type: "string" },
        { header: "Total Horas", key: "totalHours", width: 12, type: "number" },
        { header: "Promedio Diario", key: "dailyAverage", width: 15, type: "number" },
        { header: "Días Activos", key: "activeDays", width: 12, type: "number" },
      ],
      data: reportData,
    }

    await this.exportToExcel({
      filename: `INVOKE_Reporte_${reportType}_${format(new Date(), "yyyyMMdd_HHmm")}`,
      worksheets: [worksheet],
      metadata: {
        title: `Reporte ${reportType} - INVOKE`,
        subject: `Análisis de datos - ${reportType}`,
        creator: "INVOKE Hours Management System",
        company: "INVOKE",
      },
    })
  }
}
