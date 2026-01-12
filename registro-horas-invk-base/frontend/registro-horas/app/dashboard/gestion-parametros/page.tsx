"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Trash2,
  Globe,
  Building2,
  Edit,
  FileSpreadsheet,
  ArrowLeft,
  Clock,
  User,
  ChevronDown,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ExcelExporter } from "@/lib/excel-export"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Función para convertir código de país ISO a bandera emoji
const getCountryFlag = (countryCode: string): string => {
  const countryFlags: { [key: string]: string } = {
    // América
    AR: "🇦🇷", // Argentina
    BO: "🇧🇴", // Bolivia
    BR: "🇧🇷", // Brasil
    CL: "🇨🇱", // Chile
    CO: "🇨🇴", // Colombia
    CR: "🇨🇷", // Costa Rica
    CU: "🇨🇺", // Cuba
    DO: "🇩🇴", // República Dominicana
    EC: "🇪🇨", // Ecuador
    SV: "🇸🇻", // El Salvador
    GT: "🇬🇹", // Guatemala
    HN: "🇭🇳", // Honduras
    MX: "🇲🇽", // México
    NI: "🇳🇮", // Nicaragua
    PA: "🇵🇦", // Panamá
    PY: "🇵🇾", // Paraguay
    PE: "🇵🇪", // Perú
    UY: "🇺🇾", // Uruguay
    VE: "🇻🇪", // Venezuela
    US: "🇺🇸", // Estados Unidos
    CA: "🇨🇦", // Canadá

    // Europa
    ES: "🇪🇸", // España
    FR: "🇫🇷", // Francia
    DE: "🇩🇪", // Alemania
    IT: "🇮🇹", // Italia
    PT: "🇵🇹", // Portugal
    GB: "🇬🇧", // Reino Unido
    IE: "🇮🇪", // Irlanda
    NL: "🇳🇱", // Países Bajos
    BE: "🇧🇪", // Bélgica
    CH: "🇨🇭", // Suiza
    AT: "🇦🇹", // Austria
    SE: "🇸🇪", // Suecia
    NO: "🇳🇴", // Noruega
    DK: "🇩🇰", // Dinamarca
    FI: "🇫🇮", // Finlandia
    PL: "🇵🇱", // Polonia
    CZ: "🇨🇿", // República Checa
    HU: "🇭🇺", // Hungría
    RO: "🇷🇴", // Rumania
    BG: "🇧🇬", // Bulgaria
    HR: "🇭🇷", // Croacia
    SI: "🇸🇮", // Eslovenia
    SK: "🇸🇰", // Eslovaquia
    EE: "🇪🇪", // Estonia
    LV: "🇱🇻", // Letonia
    LT: "🇱🇹", // Lituania
    GR: "🇬🇷", // Grecia
    CY: "🇨🇾", // Chipre
    MT: "🇲🇹", // Malta
    LU: "🇱🇺", // Luxemburgo
    IS: "🇮🇸", // Islandia

    // Asia
    CN: "🇨🇳", // China
    JP: "🇯🇵", // Japón
    KR: "🇰🇷", // Corea del Sur
    IN: "🇮🇳", // India
    ID: "🇮🇩", // Indonesia
    TH: "🇹🇭", // Tailandia
    VN: "🇻🇳", // Vietnam
    PH: "🇵🇭", // Filipinas
    MY: "🇲🇾", // Malasia
    SG: "🇸🇬", // Singapur
    TW: "🇹🇼", // Taiwán
    HK: "🇭🇰", // Hong Kong
    MO: "🇲🇴", // Macao
    PK: "🇵🇰", // Pakistán
    BD: "🇧🇩", // Bangladesh
    LK: "🇱🇰", // Sri Lanka
    MM: "🇲🇲", // Myanmar
    KH: "🇰🇭", // Camboya
    LA: "🇱🇦", // Laos
    NP: "🇳🇵", // Nepal
    BT: "🇧🇹", // Bután
    MV: "🇲🇻", // Maldivas
    AF: "🇦🇫", // Afganistán
    IR: "🇮🇷", // Irán
    IQ: "🇮🇶", // Irak
    SA: "🇸🇦", // Arabia Saudí
    AE: "🇦🇪", // Emiratos Árabes Unidos
    QA: "🇶🇦", // Catar
    KW: "🇰🇼", // Kuwait
    BH: "🇧🇭", // Baréin
    OM: "🇴🇲", // Omán
    YE: "🇾🇪", // Yemen
    JO: "🇯🇴", // Jordania
    LB: "🇱🇧", // Líbano
    SY: "🇸🇾", // Siria
    IL: "🇮🇱", // Israel
    PS: "🇵🇸", // Palestina
    TR: "🇹🇷", // Turquía
    GE: "🇬🇪", // Georgia
    AM: "🇦🇲", // Armenia
    AZ: "🇦🇿", // Azerbaiyán
    KZ: "🇰🇿", // Kazajistán
    UZ: "🇺🇿", // Uzbekistán
    TM: "🇹🇲", // Turkmenistán
    KG: "🇰🇬", // Kirguistán
    TJ: "🇹🇯", // Tayikistán
    MN: "🇲🇳", // Mongolia
    RU: "🇷🇺", // Rusia

    // África
    ZA: "🇿🇦", // Sudáfrica
    EG: "🇪🇬", // Egipto
    NG: "🇳🇬", // Nigeria
    KE: "🇰🇪", // Kenia
    ET: "🇪🇹", // Etiopía
    GH: "🇬🇭", // Ghana
    TZ: "🇹🇿", // Tanzania
    UG: "🇺🇬", // Uganda
    DZ: "🇩🇿", // Argelia
    MA: "🇲🇦", // Marruecos
    TN: "🇹🇳", // Túnez
    LY: "🇱🇾", // Libia
    SD: "🇸🇩", // Sudán
    SS: "🇸🇸", // Sudán del Sur
    ZW: "🇿🇼", // Zimbabue
    BW: "🇧🇼", // Botsuana
    NA: "🇳🇦", // Namibia
    ZM: "🇿🇲", // Zambia
    MW: "🇲🇼", // Malaui
    MZ: "🇲🇿", // Mozambique
    MG: "🇲🇬", // Madagascar
    MU: "🇲🇺", // Mauricio
    SC: "🇸🇨", // Seychelles
    RE: "🇷🇪", // Reunión
    YT: "🇾🇹", // Mayotte
    KM: "🇰🇲", // Comoras
    DJ: "🇩🇯", // Yibuti
    SO: "🇸🇴", // Somalia
    ER: "🇪🇷", // Eritrea
    RW: "🇷🇼", // Ruanda
    BI: "🇧🇮", // Burundi
    TD: "🇹🇩", // Chad
    CF: "🇨🇫", // República Centroafricana
    CM: "🇨🇲", // Camerún
    GQ: "🇬🇶", // Guinea Ecuatorial
    GA: "🇬🇦", // Gabón
    CG: "🇨🇬", // República del Congo
    CD: "🇨🇩", // República Democrática del Congo
    AO: "🇦🇴", // Angola
    ST: "🇸🇹", // Santo Tomé y Príncipe
    CV: "🇨🇻", // Cabo Verde
    GW: "🇬🇼", // Guinea-Bisáu
    GN: "🇬🇳", // Guinea
    SL: "🇸🇱", // Sierra Leona
    LR: "🇱🇷", // Liberia
    CI: "🇨🇮", // Costa de Marfil
    BF: "🇧🇫", // Burkina Faso
    ML: "🇲🇱", // Malí
    NE: "🇳🇪", // Níger
    SN: "🇸🇳", // Senegal
    GM: "🇬🇲", // Gambia
    GH: "🇬🇭", // Ghana
    TG: "🇹🇬", // Togo
    BJ: "🇧🇯", // Benín

    // Oceanía
    AU: "🇦🇺", // Australia
    NZ: "🇳🇿", // Nueva Zelanda
    FJ: "🇫🇯", // Fiyi
    PG: "🇵🇬", // Papúa Nueva Guinea
    NC: "🇳🇨", // Nueva Caledonia
    VU: "🇻🇺", // Vanuatu
    SB: "🇸🇧", // Islas Salomón
    TO: "🇹🇴", // Tonga
    WS: "🇼🇸", // Samoa
    KI: "🇰🇮", // Kiribati
    TV: "🇹🇻", // Tuvalu
    NR: "🇳🇷", // Nauru
    PW: "🇵🇼", // Palaos
    FM: "🇫🇲", // Micronesia
    MH: "🇲🇭", // Islas Marshall
    CK: "🇨🇰", // Islas Cook
    NU: "🇳🇺", // Niue
    TK: "🇹🇰", // Tokelau
    PF: "🇵🇫", // Polinesia Francesa
    WF: "🇼🇫", // Wallis y Futuna
    AS: "🇦🇸", // Samoa Americana
    GU: "🇬🇺", // Guam
    MP: "🇲🇵", // Islas Marianas del Norte
  }

  const upperCode = countryCode.toUpperCase()
  return countryFlags[upperCode] || "🏳️"
}

// Tipo para los parámetros del backend
type BackendParameter = {
  id: number
  tipo: "pais" | "pm" | "tipo_hora" | "proyecto"
  nombre: string
  codigo: string | null
  icono: string | null
  created_at: string
  relacionado_id: number | null
  cliente: string | null // Este campo se usará para proyectos, pero no para PMs directamente en el frontend
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
  // El campo 'client' se elimina de aquí, la asociación será implícita por proyectos
}

export default function ManageParametersPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [hourTypes, setHourTypes] = useState<HourType[]>([])
  const [productManagers, setProductManagers] = useState<ProductManager[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Estados para nuevos países
  const [newCountryName, setNewCountryName] = useState("")
  const [newCountryCode, setNewCountryCode] = useState("")
  const [newCountryFlag, setNewCountryFlag] = useState("")
  const [newCountryNameError, setNewCountryNameError] = useState<string | null>(null)
  const [newCountryCodeError, setNewCountryCodeError] = useState<string | null>(null)
  const [newCountryFlagError, setNewCountryFlagError] = useState<string | null>(null)

  // Estados para nuevos proyectos
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectClient, setNewProjectClient] = useState("")
  const [newProjectPM, setNewProjectPM] = useState("")
  const [newProjectCountry, setNewProjectCountry] = useState("")
  const [newProjectNameError, setNewProjectNameError] = useState<string | null>(null)
  const [newProjectClientError, setNewProjectClientError] = useState<string | null>(null)
  const [newProjectPMError, setNewProjectPMError] = useState<string | null>(null)
  const [newProjectCountryError, setNewProjectCountryError] = useState<string | null>(null)

  // Estados para nuevos tipos de hora
  const [newHourTypeName, setNewHourTypeName] = useState("")
  const [newHourTypeNameError, setNewHourTypeNameError] = useState<string | null>(null)

  // Estados para nuevos product managers
  const [newPMName, setNewPMName] = useState("")
  const [newPMNameError, setNewPMNameError] = useState<string | null>(null)

  const [isExporting, setIsExporting] = useState(false)

  // Estados para edición
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingHourType, setEditingHourType] = useState<HourType | null>(null)
  const [editingProductManager, setEditingProductManager] = useState<ProductManager | null>(null)

  // Estados para los formularios de edición
  const [editCountryName, setEditCountryName] = useState("")
  const [editCountryCode, setEditCountryCode] = useState("")
  const [editCountryFlag, setEditCountryFlag] = useState("")

  const [editProjectName, setEditProjectName] = useState("")
  const [editProjectClient, setEditProjectClient] = useState("")
  const [editProjectPM, setEditProjectPM] = useState("")
  const [editProjectCountry, setEditProjectCountry] = useState("")

  const [editHourTypeName, setEditHourTypeName] = useState("")

  const [editPMName, setEditPMName] = useState("")

  // Estados para colapsables
  const [isCountriesOpen, setIsCountriesOpen] = useState(true)
  const [isProductManagersOpen, setIsProductManagersOpen] = useState(true)
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)
  const [isHourTypesOpen, setIsHourTypesOpen] = useState(true)

  // Función helper para obtener el nombre del PM por ID
  const getPmName = (pmId: number | null, allParameters: BackendParameter[]): string => {
    if (!pmId) return "Sin asignar"
    const pm = allParameters.find((p) => p.id === pmId && p.tipo === "pm")
    return pm?.nombre || "Sin asignar"
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
        .filter((p) => p.tipo === "pais")
        .map((p) => ({
          id: p.id,
          name: p.nombre,
          code: p.codigo || "",
          flag: p.icono || "🏳️",
        }))

      const pmsData: ProductManager[] = parameters
        .filter((p) => p.tipo === "pm")
        .map((p) => ({
          id: p.id,
          name: p.nombre,
          // 'client' ya no se mapea aquí
        }))

      // Procesar proyectos usando la función helper para obtener el nombre del PM
      const projectsData: Project[] = parameters
        .filter((p) => p.tipo === "proyecto")
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
        .filter((p) => p.tipo === "tipo_hora")
        .map((p) => ({
          id: p.id,
          name: p.nombre,
        }))

      // Establecer los estados
      setCountries(countriesData)
      setProductManagers(pmsData)
      setProjects(projectsData)
      setHourTypes(hourTypesData)

      console.log("Parámetros cargados:", {
        countries: countriesData.length,
        productManagers: pmsData.length,
        projects: projectsData.length,
        hourTypes: hourTypesData.length,
      })

      // Debug: mostrar proyectos con sus PMs
      projectsData.forEach((project) => {
        console.log(
          `Proyecto: ${project.name}, PM ID: ${project.productManagerId}, PM Name: ${project.productManagerName}`,
        )
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

  useEffect(() => {
    fetchParameters()
  }, [])

  // Función para crear parámetro
  const createParameter = async (tipo: string, data: any) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"

      // Preparar el payload según el tipo
      const payload: any = {
        tipo,
        nombre: data.nombre,
        activo: data.activo || true,
      }

      // Añadir campos específicos según el tipo
      if (tipo === "pais") {
        payload.codigo = data.codigo
        payload.icono = data.icono
      } else if (tipo === "pm") {
        // 'cliente' ya no se envía para PMs
      } else if (tipo === "proyecto") {
        payload.cliente = data.cliente
        payload.project_manager_name = data.project_manager_name // Enviar el nombre del PM
        payload.relacionado_id = data.relacionado_id
      }

      console.log("Enviando payload:", payload)

      const response = await authenticatedFetch(`${backendUrl}/api/parametros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al crear parámetro")
      }

      await fetchParameters() // Recargar datos
      return true
    } catch (error) {
      console.error("Error creating parameter:", error)
      return false
    }
  }

  // Función para actualizar parámetro
  const updateParameter = async (id: number, tipo: string, data: any) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"

      // Preparar el payload según el tipo
      const payload: any = {
        tipo,
        nombre: data.nombre,
        activo: data.activo !== undefined ? data.activo : true,
      }

      // Añadir campos específicos según el tipo
      if (tipo === "pais") {
        payload.codigo = data.codigo
        payload.icono = data.icono
      } else if (tipo === "pm") {
        // 'cliente' ya no se envía para PMs
      } else if (tipo === "proyecto") {
        payload.cliente = data.cliente
        payload.project_manager_name = data.project_manager_name
        payload.relacionado_id = data.relacionado_id
      }

      console.log("Actualizando parámetro:", payload)

      const response = await authenticatedFetch(`${backendUrl}/api/parametros/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar parámetro")
      }

      await fetchParameters() // Recargar datos
      return true
    } catch (error) {
      console.error("Error updating parameter:", error)
      return false
    }
  }

  // Función para eliminar parámetro
  const deleteParameter = async (id: number) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
      const response = await authenticatedFetch(`${backendUrl}/api/parametros/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar parámetro")
      }

      await fetchParameters() // Recargar datos
      return true
    } catch (error) {
      console.error("Error deleting parameter:", error)
      return false
    }
  }

  const handleAddCountry = async () => {
    let hasError = false
    setNewCountryNameError(null)
    setNewCountryCodeError(null)
    setNewCountryFlagError(null)

    if (!newCountryName.trim()) {
      setNewCountryNameError("El nombre del país es obligatorio.")
      hasError = true
    }
    if (!newCountryCode.trim()) {
      setNewCountryCodeError("El código del país es obligatorio.")
      hasError = true
    } else if (newCountryCode.trim().length !== 2) {
      setNewCountryCodeError("El código debe tener 2 caracteres.")
      hasError = true
    }

    // Auto-generar bandera si no se proporciona
    const finalFlag = newCountryFlag.trim() || getCountryFlag(newCountryCode.trim())

    if (hasError) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }

    const success = await createParameter("pais", {
      nombre: newCountryName,
      codigo: newCountryCode.toUpperCase(),
      icono: finalFlag,
      activo: true,
    })

    if (success) {
      setNewCountryName("")
      setNewCountryCode("")
      setNewCountryFlag("")
      setNewCountryNameError(null)
      setNewCountryCodeError(null)
      setNewCountryFlagError(null)
      toast({
        title: "¡Éxito!",
        description: `País ${newCountryName} añadido correctamente con bandera ${finalFlag}.`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo añadir el país.",
        variant: "destructive",
      })
    }
  }

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country)
    setEditCountryName(country.name)
    setEditCountryCode(country.code)
    setEditCountryFlag(country.flag)
  }

  const handleUpdateCountry = async () => {
    if (!editingCountry || !editCountryName || !editCountryCode) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos del país.",
        variant: "destructive",
      })
      return
    }

    // Auto-generar bandera si no se proporciona
    const finalFlag = editCountryFlag.trim() || getCountryFlag(editCountryCode.trim())

    const success = await updateParameter(editingCountry.id, "pais", {
      nombre: editCountryName,
      codigo: editCountryCode.toUpperCase(),
      icono: finalFlag,
      activo: true,
    })

    if (success) {
      setEditingCountry(null)
      setEditCountryName("")
      setEditCountryCode("")
      setEditCountryFlag("")
      toast({
        title: "¡Éxito!",
        description: `País ${editCountryName} actualizado correctamente.`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el país.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEditCountry = () => {
    setEditingCountry(null)
    setEditCountryName("")
    setEditCountryCode("")
    setEditCountryFlag("")
  }

  const handleDeleteCountry = async (id: number) => {
    const countryToDelete = countries.find((c) => c.id === id)
    const projectsInCountry = projects.filter((p) => p.countryId === id)

    if (projectsInCountry.length > 0) {
      toast({
        title: "No se puede eliminar",
        description: `El país ${countryToDelete?.name} tiene ${projectsInCountry.length} proyecto(s) asociado(s).`,
        variant: "destructive",
      })
      return
    }

    if (confirm(`¿Estás seguro de que quieres eliminar ${countryToDelete?.name}?`)) {
      const success = await deleteParameter(id)
      if (success) {
        toast({
          title: "País eliminado",
          description: `${countryToDelete?.name} ha sido eliminado correctamente.`,
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el país.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddProductManager = async () => {
    let hasError = false
    setNewPMNameError(null)

    if (!newPMName.trim()) {
      setNewPMNameError("El nombre del Product Manager es obligatorio.")
      hasError = true
    }

    if (hasError) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }

    const success = await createParameter("pm", {
      nombre: newPMName,
      activo: true,
    })

    if (success) {
      setNewPMName("")
      setNewPMNameError(null)
      toast({
        title: "¡Éxito!",
        description: `Product Manager ${newPMName} añadido correctamente.`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo añadir el Product Manager.",
        variant: "destructive",
      })
    }
  }

  const handleEditProductManager = (pm: ProductManager) => {
    setEditingProductManager(pm)
    setEditPMName(pm.name)
  }

  const handleUpdateProductManager = async () => {
    if (!editingProductManager || !editPMName) {
      toast({
        title: "Error de validación",
        description: "Por favor, ingresa el nombre del Product Manager.",
        variant: "destructive",
      })
      return
    }

    const success = await updateParameter(editingProductManager.id, "pm", {
      nombre: editPMName,
      activo: true,
    })

    if (success) {
      setEditingProductManager(null)
      setEditPMName("")
      toast({
        title: "¡Éxito!",
        description: `Product Manager ${editPMName} actualizado correctamente.`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el Product Manager.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEditProductManager = () => {
    setEditingProductManager(null)
    setEditPMName("")
  }

  const handleDeleteProductManager = async (id: number) => {
    const pmToDelete = productManagers.find((pm) => pm.id === id)
    const projectsWithPM = projects.filter((p) => p.productManagerId === id)

    if (projectsWithPM.length > 0) {
      toast({
        title: "No se puede eliminar",
        description: `El Product Manager ${pmToDelete?.name} tiene ${projectsWithPM.length} proyecto(s) asociado(s).`,
        variant: "destructive",
      })
      return
    }

    if (confirm(`¿Estás seguro de que quieres eliminar ${pmToDelete?.name}?`)) {
      const success = await deleteParameter(id)
      if (success) {
        toast({
          title: "Product Manager eliminado",
          description: `${pmToDelete?.name} ha sido eliminado correctamente.`,
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el Product Manager.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddProject = async () => {
    let hasError = false
    setNewProjectNameError(null)
    setNewProjectClientError(null)
    setNewProjectPMError(null)
    setNewProjectCountryError(null)

    if (!newProjectName.trim()) {
      setNewProjectNameError("El nombre del proyecto es obligatorio.")
      hasError = true
    }
    if (!newProjectClient.trim()) {
      setNewProjectClientError("El cliente es obligatorio.")
      hasError = true
    }
    if (!newProjectPM) {
      setNewProjectPMError("El Product Manager es obligatorio.")
      hasError = true
    }
    if (!newProjectCountry) {
      setNewProjectCountryError("El país es obligatorio.")
      hasError = true
    }

    if (hasError) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }

    // Encontrar el nombre del Product Manager seleccionado
    const selectedPM = productManagers.find((pm) => pm.id.toString() === newProjectPM)
    if (!selectedPM) {
      toast({
        title: "Error",
        description: "Product Manager no encontrado.",
        variant: "destructive",
      })
      return
    }

    console.log("Creando proyecto con PM:", selectedPM.name)

    const success = await createParameter("proyecto", {
      nombre: newProjectName,
      cliente: newProjectClient,
      project_manager_name: selectedPM.name, // Enviar el nombre del PM
      relacionado_id: Number.parseInt(newProjectCountry),
      activo: true,
    })

    if (success) {
      setNewProjectName("")
      setNewProjectClient("")
      setNewProjectPM("")
      setNewProjectCountry("")
      setNewProjectNameError(null)
      setNewProjectClientError(null)
      setNewProjectPMError(null)
      setNewProjectCountryError(null)
      toast({
        title: "¡Éxito!",
        description: `Proyecto ${newProjectName} añadido correctamente.`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo añadir el proyecto.",
        variant: "destructive",
      })
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setEditProjectName(project.name)
    setEditProjectClient(project.client)
    setEditProjectPM(project.productManagerId.toString())
    setEditProjectCountry(project.countryId.toString())
  }

  const handleUpdateProject = async () => {
    if (!editingProject || !editProjectName || !editProjectClient || !editProjectPM || !editProjectCountry) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos del proyecto.",
        variant: "destructive",
      })
      return
    }

    // Encontrar el nombre del Product Manager seleccionado
    const selectedPM = productManagers.find((pm) => pm.id.toString() === editProjectPM)
    if (!selectedPM) {
      toast({
        title: "Error",
        description: "Product Manager no encontrado.",
        variant: "destructive",
      })
      return
    }

    const success = await updateParameter(editingProject.id, "proyecto", {
      nombre: editProjectName,
      cliente: editProjectClient,
      project_manager_name: selectedPM.name,
      relacionado_id: Number.parseInt(editProjectCountry),
      activo: true,
    })

    if (success) {
      setEditingProject(null)
      setEditProjectName("")
      setEditProjectClient("")
      setEditProjectPM("")
      setEditProjectCountry("")
      toast({
        title: "¡Éxito!",
        description: `Proyecto ${editProjectName} actualizado correctamente.`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el proyecto.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEditProject = () => {
    setEditingProject(null)
    setEditProjectName("")
    setEditProjectClient("")
    setEditProjectPM("")
    setEditProjectCountry("")
  }

  const handleDeleteProject = async (id: number) => {
    const projectToDelete = projects.find((p) => p.id === id)
    if (confirm(`¿Estás seguro de que quieres eliminar el proyecto ${projectToDelete?.name}?`)) {
      const success = await deleteParameter(id)
      if (success) {
        toast({
          title: "Proyecto eliminado",
          description: `${projectToDelete?.name} ha sido eliminado correctamente.`,
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el proyecto.",
          variant: "destructive",
        })
      }
    }
  }

  const toggleProjectStatus = async (project: Project) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
    const action = project.status === "active" ? "desactivar" : "reactivar"
    const endpoint = `${backendUrl}/api/parametros/proyecto/${project.id}/${action}`

    try {
      const response = await authenticatedFetch(endpoint, {
        method: "PATCH", // Cambiado de PUT a PATCH
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error al ${action} el proyecto`)
      }

      const result = await response.json()
      toast({
        title: "¡Éxito!",
        description: result.message,
      })
      await fetchParameters() // Recargar datos para reflejar el cambio de estado
    } catch (error: any) {
      console.error(`Error al ${action} el proyecto:`, error)
      toast({
        title: "Error",
        description: `No se pudo ${action} el proyecto: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleAddHourType = async () => {
    let hasError = false
    setNewHourTypeNameError(null)

    if (!newHourTypeName.trim()) {
      setNewHourTypeNameError("El nombre del tipo de hora es obligatorio.")
      hasError = true
    }

    if (hasError) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }

    const success = await createParameter("tipo_hora", {
      nombre: newHourTypeName,
      activo: true,
    })

    if (success) {
      setNewHourTypeName("")
      setNewHourTypeNameError(null)
      toast({
        title: "¡Éxito!",
        description: `Tipo de hora ${newHourTypeName} añadido correctamente.`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo añadir el tipo de hora.",
        variant: "destructive",
      })
    }
  }

  const handleEditHourType = (hourType: HourType) => {
    setEditingHourType(hourType)
    setEditHourTypeName(hourType.name)
  }

  const handleUpdateHourType = async () => {
    if (!editingHourType || !editHourTypeName) {
      toast({
        title: "Error de validación",
        description: "Por favor, ingresa el nombre del tipo de hora.",
        variant: "destructive",
      })
      return
    }

    const success = await updateParameter(editingHourType.id, "tipo_hora", {
      nombre: editHourTypeName,
      activo: true,
    })

    if (success) {
      setEditingHourType(null)
      setEditHourTypeName("")
      toast({
        title: "¡Éxito!",
        description: `Tipo de hora ${editHourTypeName} actualizado correctamente.`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el tipo de hora.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEditHourType = () => {
    setEditingHourType(null)
    setEditHourTypeName("")
  }

  const handleDeleteHourType = async (id: number) => {
    const typeToDelete = hourTypes.find((ht) => ht.id === id)
    if (confirm(`¿Estás seguro de que quieres eliminar el tipo ${typeToDelete?.name}?`)) {
      const success = await deleteParameter(id)
      if (success) {
        toast({
          title: "Tipo eliminado",
          description: `${typeToDelete?.name} ha sido eliminado correctamente.`,
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el tipo de hora.",
          variant: "destructive",
        })
      }
    }
  }

  const getCountryName = (countryId: number) => {
    return countries.find((c) => c.id === countryId)?.name || "País desconocido"
  }

  const getCountryFlag = (countryId: number) => {
    return countries.find((c) => c.id === countryId)?.flag || "🏳️"
  }

  const getProjectsByCountry = (countryId: number) => {
    return projects.filter((p) => p.countryId === countryId)
  }

  // Nueva función para obtener los clientes asociados a un PM a través de sus proyectos
  const getPmClients = (pmId: number): string[] => {
    const clients = projects.filter((project) => project.productManagerId === pmId).map((project) => project.client)
    return Array.from(new Set(clients)) // Devuelve clientes únicos
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      // Convertir datos del backend al formato del exportador
      const exportCountries = countries.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        code: c.code,
        flag: c.flag,
      }))

      const exportProjects = projects.map((p) => ({
        id: p.id.toString(),
        name: p.name,
        client: p.client,
        productManager: p.productManagerName,
        countryId: p.countryId.toString(),
        status: p.status,
      }))

      const exportHourTypes = hourTypes.map((ht) => ({
        id: ht.id.toString(),
        name: ht.name,
      }))

      await ExcelExporter.exportParameters(exportCountries, exportProjects, exportHourTypes)
      toast({
        title: "¡Exportación exitosa!",
        description: "El archivo Excel de parámetros ha sido generado con 3 hojas separadas.",
      })
    } catch (error) {
      toast({
        title: "Error en la exportación",
        description: "Hubo un problema al generar el archivo Excel. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "#004072", borderTopColor: "transparent" }}
          />
          <p className="text-gray-900">Cargando parámetros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Gestionar Parámetros</h1>
              <p className="text-sm sm:text-base text-gray-700">
                <span className="font-semibold" style={{ color: "#004072" }}>
                  INVOKE
                </span>{" "}
                • Configura países, proyectos y tipos de hora
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
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
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar Parámetros
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white border border-gray-200">
                <DropdownMenuLabel className="font-semibold text-gray-900">Exportar Configuración</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleExportExcel}
                  className="cursor-pointer p-3 text-gray-900"
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="mr-3 h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">Exportar a Excel (.xlsx)</div>
                    <div className="text-xs text-gray-600 mt-1">Países, proyectos y tipos de hora</div>
                    <div className="text-xs text-blue-600 mt-1">✓ 3 hojas separadas • ✓ Formato automático</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Countries Management */}
        <Collapsible open={isCountriesOpen} onOpenChange={setIsCountriesOpen} className="space-y-2">
          <Card className="bg-gray-900 border border-gray-700 shadow-lg animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-white font-semibold">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#004072" }}>
                  <Globe className="h-4 w-4 text-white" />
                </div>
                Países
              </CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown
                    className={`h-4 w-4 text-white transition-transform ${isCountriesOpen ? "rotate-180" : ""}`}
                  />
                  <span className="sr-only">Toggle Countries</span>
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CardDescription className="px-6 pb-4 text-gray-300">
              Gestiona los países donde opera la empresa
            </CardDescription>
            <CollapsibleContent className="CollapsibleContent">
              <CardContent className="space-y-6">
                {/* Add New Country */}
                <div className="grid gap-4">
                  <Label className="text-base text-white font-medium">Añadir Nuevo País</Label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Nombre del país"
                        value={newCountryName}
                        onChange={(e) => {
                          setNewCountryName(e.target.value)
                          setNewCountryNameError(null)
                        }}
                        className={`${newCountryNameError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400`}
                      />
                      {newCountryNameError && <p className="text-red-500 text-xs mt-1">{newCountryNameError}</p>}
                    </div>
                    <div>
                      <Input
                        placeholder="Código (ES, MX, etc.)"
                        value={newCountryCode}
                        onChange={(e) => {
                          const code = e.target.value
                          setNewCountryCode(code)
                          setNewCountryCodeError(null)
                          // Auto-completar bandera basada en el código
                          if (code.length === 2) {
                            const autoFlag = getCountryFlag(code)
                            setNewCountryFlag(autoFlag)
                          }
                        }}
                        maxLength={2}
                        className={`${newCountryCodeError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400`}
                      />
                      {newCountryCodeError && <p className="text-red-500 text-xs mt-1">{newCountryCodeError}</p>}
                    </div>
                    <div>
                      <Input
                        placeholder="Bandera (🇪🇸)"
                        value={newCountryFlag}
                        onChange={(e) => {
                          setNewCountryFlag(e.target.value)
                          setNewCountryFlagError(null)
                        }}
                        maxLength={2}
                        className={`${newCountryFlagError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400`}
                      />
                      {newCountryFlagError && <p className="text-red-500 text-xs mt-1">{newCountryFlagError}</p>}
                    </div>
                    <Button
                      onClick={handleAddCountry}
                      className="w-full text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                      style={{ backgroundColor: "#004072" }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Añadir
                    </Button>
                  </div>
                </div>

                {/* Countries List */}
                <div className="space-y-3">
                  <Label className="text-base text-white font-medium">Países Existentes</Label>
                  {countries.length === 0 ? (
                    <p className="text-gray-300">No hay países definidos.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {countries.map((country) => {
                        const projectCount = getProjectsByCountry(country.id).length
                        return (
                          <Card
                            key={country.id}
                            className={`border border-gray-700 hover:border-primary/70 transition-colors ${
                              editingCountry?.id === country.id ? "border-primary/70 bg-gray-800" : ""
                            }`}
                          >
                            <CardContent className="p-4">
                              {editingCountry?.id === country.id ? (
                                // Modo edición
                                <div className="space-y-3">
                                  <Input
                                    placeholder="Nombre del país"
                                    value={editCountryName}
                                    onChange={(e) => setEditCountryName(e.target.value)}
                                    className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Código"
                                      value={editCountryCode}
                                      onChange={(e) => {
                                        const code = e.target.value
                                        setEditCountryCode(code)
                                        // Auto-completar bandera basada en el código
                                        if (code.length === 2) {
                                          const autoFlag = getCountryFlag(code)
                                          setEditCountryFlag(autoFlag)
                                        }
                                      }}
                                      maxLength={2}
                                      className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                                    />
                                    <Input
                                      placeholder="Bandera"
                                      value={editCountryFlag}
                                      onChange={(e) => setEditCountryFlag(e.target.value)}
                                      maxLength={2}
                                      className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleUpdateCountry}
                                      size="sm"
                                      className="text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                                      style={{ backgroundColor: "#004072" }}
                                    >
                                      Guardar
                                    </Button>
                                    <Button
                                      onClick={handleCancelEditCountry}
                                      variant="outline"
                                      size="sm"
                                      className="active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // Modo vista
                                <>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                                        alt={`Bandera de ${country.name}`}
                                        className="w-8 h-5 mr-2"
                                      />
                                      <div>
                                        <h4 className="font-semibold text-white">{country.name}</h4>
                                        <p className="text-sm text-gray-400">{country.code}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEditCountry(country)}
                                        className="h-8 w-8 active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteCountry(country.id)}
                                        className="h-8 w-8 active:scale-[0.98] active:bg-destructive/70"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs text-gray-400 border-gray-500">
                                    {projectCount} proyecto{projectCount !== 1 ? "s" : ""}
                                  </Badge>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Product Managers Management */}
        <Collapsible open={isProductManagersOpen} onOpenChange={setIsProductManagersOpen} className="space-y-2">
          <Card
            className="bg-gray-900 border border-gray-700 shadow-lg animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-white font-semibold">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#004072" }}>
                  <User className="h-4 w-4 text-white" />
                </div>
                Product Managers
              </CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown
                    className={`h-4 w-4 text-white transition-transform ${isProductManagersOpen ? "rotate-180" : ""}`}
                  />
                  <span className="sr-only">Toggle Product Managers</span>
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CardDescription className="px-6 pb-4 text-gray-300">
              Gestiona los Product Managers y sus clientes asociados (a través de proyectos)
            </CardDescription>
            <CollapsibleContent className="CollapsibleContent">
              <CardContent className="space-y-6">
                {/* Add New PM */}
                <div className="grid gap-4">
                  <Label className="text-base text-white font-medium">Añadir Nuevo Product Manager</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Nombre del PM"
                        value={newPMName}
                        onChange={(e) => {
                          setNewPMName(e.target.value)
                          setNewPMNameError(null)
                        }}
                        className={`${newPMNameError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400`}
                      />
                      {newPMNameError && <p className="text-red-500 text-xs mt-1">{newPMNameError}</p>}
                    </div>
                    <Button
                      onClick={handleAddProductManager}
                      className="w-full text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                      style={{ backgroundColor: "#004072" }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Añadir
                    </Button>
                  </div>
                </div>

                {/* PMs List */}
                <div className="space-y-3">
                  <Label className="text-base text-white font-medium">Product Managers Existentes</Label>
                  {productManagers.length === 0 ? (
                    <p className="text-gray-300">No hay Product Managers definidos.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {productManagers.map((pm) => {
                        const projectCount = projects.filter((p) => p.productManagerId === pm.id).length
                        const pmClients = getPmClients(pm.id) // Obtener clientes asociados
                        return (
                          <Card
                            key={pm.id}
                            className={`border border-gray-700 hover:border-primary/70 transition-colors ${
                              editingProductManager?.id === pm.id ? "border-primary/70 bg-gray-800" : ""
                            }`}
                          >
                            <CardContent className="p-4">
                              {editingProductManager?.id === pm.id ? (
                                // Modo edición
                                <div className="space-y-3">
                                  <Input
                                    placeholder="Nombre del PM"
                                    value={editPMName}
                                    onChange={(e) => setEditPMName(e.target.value)}
                                    className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleUpdateProductManager}
                                      size="sm"
                                      className="text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                                      style={{ backgroundColor: "#004072" }}
                                    >
                                      Guardar
                                    </Button>
                                    <Button
                                      onClick={handleCancelEditProductManager}
                                      variant="outline"
                                      size="sm"
                                      className="active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // Modo vista
                                <>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-white">{pm.name}</h4>
                                      {pmClients.length > 0 ? (
                                        <p className="text-sm text-gray-400">Clientes: {pmClients.join(", ")}</p>
                                      ) : (
                                        <p className="text-sm text-gray-400">Sin clientes asociados</p>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEditProductManager(pm)}
                                        className="h-8 w-8 active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteProductManager(pm.id)}
                                        className="h-8 w-8 active:scale-[0.98] active:bg-destructive/70"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs text-gray-400 border-gray-500">
                                    {projectCount} proyecto{projectCount !== 1 ? "s" : ""}
                                  </Badge>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Projects Management */}
        <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen} className="space-y-2">
          <Card
            className="bg-gray-900 border border-gray-700 shadow-lg animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-white font-semibold">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#004072" }}>
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                Proyectos
              </CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown
                    className={`h-4 w-4 text-white transition-transform ${isProjectsOpen ? "rotate-180" : ""}`}
                  />
                  <span className="sr-only">Toggle Projects</span>
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CardDescription className="px-6 pb-4 text-gray-300">
              Gestiona los proyectos y su asociación con países y Product Managers
            </CardDescription>
            <CollapsibleContent className="CollapsibleContent">
              <CardContent className="space-y-6">
                {/* Add New Project */}
                <div className="grid gap-4">
                  <Label className="text-base text-white font-medium">Añadir Nuevo Proyecto</Label>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div>
                      <Input
                        placeholder="Nombre del Proyecto"
                        value={newProjectName}
                        onChange={(e) => {
                          setNewProjectName(e.target.value)
                          setNewProjectNameError(null)
                        }}
                        className={`${newProjectNameError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400`}
                      />
                      {newProjectNameError && <p className="text-red-500 text-xs mt-1">{newProjectNameError}</p>}
                    </div>
                    <div>
                      <Input
                        placeholder="Cliente"
                        value={newProjectClient}
                        onChange={(e) => {
                          setNewProjectClient(e.target.value)
                          setNewProjectClientError(null)
                        }}
                        className={`${newProjectClientError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400`}
                      />
                      {newProjectClientError && <p className="text-red-500 text-xs mt-1">{newProjectClientError}</p>}
                    </div>
                    <div>
                      <Select
                        value={newProjectPM}
                        onValueChange={(value) => {
                          setNewProjectPM(value)
                          setNewProjectPMError(null)
                        }}
                      >
                        <SelectTrigger
                          className={`${newProjectPMError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100`}
                        >
                          <SelectValue placeholder="Product Manager" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 text-gray-100">
                          {productManagers.map((pm) => (
                            <SelectItem key={pm.id} value={pm.id.toString()}>
                              {pm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newProjectPMError && <p className="text-red-500 text-xs mt-1">{newProjectPMError}</p>}
                    </div>
                    <div>
                      <Select
                        value={newProjectCountry}
                        onValueChange={(value) => {
                          setNewProjectCountry(value)
                          setNewProjectCountryError(null)
                        }}
                      >
                        <SelectTrigger
                          className={`${newProjectCountryError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100`}
                        >
                          <SelectValue placeholder="País" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 text-gray-100">
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id.toString()}>
                              <img
                                src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                alt={`Bandera de ${country.name}`}
                                className="inline-block w-5 h-3 mr-2"
                              />{" "}
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newProjectCountryError && <p className="text-red-500 text-xs mt-1">{newProjectCountryError}</p>}
                    </div>
                    <Button
                      onClick={handleAddProject}
                      className="w-full text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                      style={{ backgroundColor: "#004072" }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Añadir
                    </Button>
                  </div>
                </div>

                {/* Projects by Country */}
                <div className="space-y-4">
                  <Label className="text-base text-white font-medium">Proyectos por País</Label>
                  {countries.map((country) => {
                    const countryProjects = getProjectsByCountry(country.id)
                    return (
                      <Card key={country.id} className="border border-gray-700 bg-gray-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2 text-white font-semibold">
                            <img
                              src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                              alt={`Bandera de ${country.name}`}
                              className="w-6 h-4 mr-2"
                            />
                            {country.name}
                            <Badge variant="outline" className="text-gray-400 border-gray-500">
                              {countryProjects.length} proyectos
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {countryProjects.length === 0 ? (
                            <p className="text-gray-300 text-sm">No hay proyectos en este país</p>
                          ) : (
                            <div className="space-y-2">
                              {countryProjects.map((project) => (
                                <div key={project.id}>
                                  {editingProject?.id === project.id ? (
                                    // Modo edición
                                    <div className="p-3 rounded-lg bg-gray-700 border border-gray-600 space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                          placeholder="Nombre del Proyecto"
                                          value={editProjectName}
                                          onChange={(e) => setEditProjectName(e.target.value)}
                                          className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                                        />
                                        <Input
                                          placeholder="Cliente"
                                          value={editProjectClient}
                                          onChange={(e) => setEditProjectClient(e.target.value)}
                                          className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                                        />
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Select value={editProjectPM} onValueChange={setEditProjectPM}>
                                          <SelectTrigger className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100">
                                            <SelectValue placeholder="Product Manager" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-gray-800 text-gray-100">
                                            {productManagers.map((pm) => (
                                              <SelectItem key={pm.id} value={pm.id.toString()}>
                                                {pm.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Select value={editProjectCountry} onValueChange={setEditProjectCountry}>
                                          <SelectTrigger className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100">
                                            <SelectValue placeholder="País" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-gray-800 text-gray-100">
                                            {countries.map((country) => (
                                              <SelectItem key={country.id} value={country.id.toString()}>
                                                <img
                                                  src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                                  alt={`Bandera de ${country.name}`}
                                                  className="inline-block w-5 h-3 mr-2"
                                                />{" "}
                                                {country.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={handleUpdateProject}
                                          size="sm"
                                          className="text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                                          style={{ backgroundColor: "#004072" }}
                                        >
                                          Guardar
                                        </Button>
                                        <Button
                                          onClick={handleCancelEditProject}
                                          variant="outline"
                                          size="sm"
                                          className="active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100"
                                        >
                                          Cancelar
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    // Modo vista
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700 border border-gray-600">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-semibold text-sm text-white">{project.name}</h4>
                                          <Badge
                                            variant={project.status === "active" ? "default" : "secondary"}
                                            className="text-xs"
                                          >
                                            {project.status === "active" ? "Activo" : "Inactivo"}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                          {project.client} • {project.productManagerName}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditProject(project)}
                                          className="active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700"
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          Editar
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => toggleProjectStatus(project)}
                                          className="active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700"
                                        >
                                          {project.status === "active" ? "Desactivar" : "Activar"}
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDeleteProject(project.id)}
                                          className="active:scale-[0.98] active:bg-destructive/70"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Hour Types Management */}
        <Collapsible open={isHourTypesOpen} onOpenChange={setIsHourTypesOpen} className="space-y-2">
          <Card
            className="bg-gray-900 border border-gray-700 shadow-lg animate-slide-up"
            style={{ animationDelay: "400ms" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-white font-semibold">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#004072" }}>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                Tipos de Hora
              </CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown
                    className={`h-4 w-4 text-white transition-transform ${isHourTypesOpen ? "rotate-180" : ""}`}
                  />
                  <span className="sr-only">Toggle Hour Types</span>
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CardDescription className="px-6 pb-4 text-gray-300">
              Añade o elimina tipos de hora para los registros.
            </CardDescription>
            <CollapsibleContent className="CollapsibleContent">
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newHourTypeName" className="text-white font-medium">
                    Añadir Nuevo Tipo de Hora
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="newHourTypeName"
                      placeholder="Nombre del Tipo de Hora"
                      value={newHourTypeName}
                      onChange={(e) => {
                        setNewHourTypeName(e.target.value)
                        setNewHourTypeNameError(null)
                      }}
                      className={`${newHourTypeNameError ? "border-red-500" : ""} transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400`}
                    />
                    <Button
                      onClick={handleAddHourType}
                      className="text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                      style={{ backgroundColor: "#004072" }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Añadir
                    </Button>
                  </div>
                  {newHourTypeNameError && <p className="text-red-500 text-xs mt-1">{newHourTypeNameError}</p>}
                </div>
                <div className="grid gap-2">
                  <h3 className="font-medium text-white">Tipos de Hora Existentes:</h3>
                  {hourTypes.length === 0 ? (
                    <p className="text-gray-300">No hay tipos de hora definidos.</p>
                  ) : (
                    <ul className="grid gap-2">
                      {hourTypes.map((type) => (
                        <li key={type.id} className="flex items-center justify-between rounded-md bg-gray-800 p-2">
                          {editingHourType?.id === type.id ? (
                            // Modo edición
                            <div className="flex items-center gap-2 w-full">
                              <Input
                                value={editHourTypeName}
                                onChange={(e) => setEditHourTypeName(e.target.value)}
                                className="flex-1 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                              />
                              <Button
                                onClick={handleUpdateHourType}
                                size="sm"
                                className="text-white hover:opacity-90 transition-all duration-300 shadow-lg active:scale-[0.98]"
                                style={{ backgroundColor: "#004072" }}
                              >
                                Guardar
                              </Button>
                              <Button
                                onClick={handleCancelEditHourType}
                                variant="outline"
                                size="sm"
                                className="active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100"
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            // Modo vista
                            <>
                              <span className="text-white">{type.name}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditHourType(type)}
                                  className="active:scale-[0.98] active:bg-gray-700 bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteHourType(type.id)}
                                  className="active:scale-[0.98] active:bg-destructive/70"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  )
}
