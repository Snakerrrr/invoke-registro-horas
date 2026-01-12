export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "consultant" | "pending"
  country: string
}

export interface Project {
  id: string
  name: string
  client: string
  productManager: string
}

export interface HourType {
  id: string
  name: string
  billable: boolean
}

export interface HourRegistration {
  id: string
  date: string // ISO date string
  consultorId: string
  consultorName: string
  projectId: string
  projectName: string
  clientName: string
  productManagerName: string
  hourTypeId: string
  hourTypeName: string
  countryName: string
  hours: number
  description: string
}

// Mock data storage (in-memory for demonstration)
let mockUsers: User[] = [
  {
    id: "user-1",
    name: "Test Admin",
    email: "test1@admin.com",
    role: "admin",
    country: "Chile",
  },
  {
    id: "user-2",
    name: "Usuario Consultor",
    email: "test2@admin.com",
    role: "consultant",
    country: "Perú",
  },
  {
    id: "user-3",
    name: "Pending User",
    email: "pending@example.com",
    role: "pending",
    country: "Argentina",
  },
]

let mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Hardening Bastión",
    client: "Cliente A",
    productManager: "PM Uno",
  },
  {
    id: "proj-2",
    name: "Ansible automatización",
    client: "Cliente B",
    productManager: "PM Dos",
  },
  {
    id: "proj-3",
    name: "Implementación Zabbix",
    client: "Cliente C",
    productManager: "PM Tres",
  },
  {
    id: "proj-4",
    name: "ALOJA",
    client: "Cliente D",
    productManager: "PM Cuatro",
  },
  {
    id: "proj-5",
    name: "lllkkd",
    client: "Cliente E",
    productManager: "PM Cinco",
  },
]

let mockHourTypes: HourType[] = [
  { id: "type-1", name: "Facturable", billable: true },
  { id: "type-2", name: "No Facturable", billable: false },
  { id: "type-3", name: "Vacaciones", billable: false },
]

let mockCountries: string[] = ["Chile", "Perú", "Argentina", "Colombia", "México", "España"]

let mockHourRegistrations: HourRegistration[] = [
  {
    id: "reg-1",
    date: "2025-07-01T00:00:00.000Z",
    consultorId: "user-1",
    consultorName: "Test Admin",
    projectId: "proj-1",
    projectName: "Hardening Bastión",
    clientName: "Cliente A",
    productManagerName: "PM Uno",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Chile",
    hours: 8,
    description: "Trabajo en configuración de seguridad del bastión.",
  },
  {
    id: "reg-2",
    date: "2025-07-01T00:00:00.000Z",
    consultorId: "user-2",
    consultorName: "Usuario Consultor",
    projectId: "proj-2",
    projectName: "Ansible automatización",
    clientName: "Cliente B",
    productManagerName: "PM Dos",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Perú",
    hours: 6,
    description: "Desarrollo de playbooks para automatización de despliegues.",
  },
  {
    id: "reg-3",
    date: "2025-07-02T00:00:00.000Z",
    consultorId: "user-1",
    consultorName: "Test Admin",
    projectId: "proj-3",
    projectName: "Implementación Zabbix",
    clientName: "Cliente C",
    productManagerName: "PM Tres",
    hourTypeId: "type-2",
    hourTypeName: "No Facturable",
    countryName: "Argentina",
    hours: 4,
    description: "Reunión interna de planificación de proyecto Zabbix.",
  },
  {
    id: "reg-4",
    date: "2025-07-03T00:00:00.000Z",
    consultorId: "user-1",
    consultorName: "Test Admin",
    projectId: "proj-1",
    projectName: "Hardening Bastión",
    clientName: "Cliente A",
    productManagerName: "PM Uno",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Chile",
    hours: 7,
    description: "Revisión de logs de seguridad y ajustes de firewall.",
  },
  {
    id: "reg-5",
    date: "2025-07-03T00:00:00.000Z",
    consultorId: "user-2",
    consultorName: "Usuario Consultor",
    projectId: "proj-4",
    projectName: "ALOJA",
    clientName: "Cliente D",
    productManagerName: "PM Cuatro",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Perú",
    hours: 5,
    description: "Soporte a cliente en plataforma ALOJA.",
  },
  {
    id: "reg-6",
    date: "2025-07-04T00:00:00.000Z",
    consultorId: "user-1",
    consultorName: "Test Admin",
    projectId: "proj-2",
    projectName: "Ansible automatización",
    clientName: "Cliente B",
    productManagerName: "PM Dos",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Chile",
    hours: 6,
    description: "Debugging de scripts Ansible.",
  },
  {
    id: "reg-7",
    date: "2025-07-04T00:00:00.000Z",
    consultorId: "user-2",
    consultorName: "Usuario Consultor",
    projectId: "proj-3",
    projectName: "Implementación Zabbix",
    clientName: "Cliente C",
    productManagerName: "PM Tres",
    hourTypeId: "type-2",
    hourTypeName: "No Facturable",
    countryName: "Argentina",
    hours: 3,
    description: "Capacitación interna sobre nuevas funcionalidades de Zabbix.",
  },
  {
    id: "reg-8",
    date: "2025-07-05T00:00:00.000Z",
    consultorId: "user-1",
    consultorName: "Test Admin",
    projectId: "proj-1",
    projectName: "Hardening Bastión",
    clientName: "Cliente A",
    productManagerName: "PM Uno",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Chile",
    hours: 8,
    description: "Implementación de políticas de seguridad.",
  },
  {
    id: "reg-9",
    date: "2025-07-05T00:00:00.000Z",
    consultorId: "user-2",
    consultorName: "Usuario Consultor",
    projectId: "proj-5",
    projectName: "lllkkd",
    clientName: "Cliente E",
    productManagerName: "PM Cinco",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Perú",
    hours: 7,
    description: "Revisión de código y pruebas unitarias.",
  },
  {
    id: "reg-10",
    date: "2025-06-28T00:00:00.000Z",
    consultorId: "user-1",
    consultorName: "Test Admin",
    projectId: "proj-4",
    projectName: "ALOJA",
    clientName: "Cliente D",
    productManagerName: "PM Cuatro",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Colombia",
    hours: 5,
    description: "Soporte técnico remoto.",
  },
  {
    id: "reg-11",
    date: "2025-06-20T00:00:00.000Z",
    consultorId: "user-1",
    consultorName: "Test Admin",
    projectId: "proj-1",
    projectName: "Hardening Bastión",
    clientName: "Cliente A",
    productManagerName: "PM Uno",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Chile",
    hours: 8,
    description: "Auditoría de seguridad inicial.",
  },
  {
    id: "reg-12",
    date: "2025-05-15T00:00:00.000Z",
    consultorId: "user-2",
    consultorName: "Usuario Consultor",
    projectId: "proj-2",
    projectName: "Ansible automatización",
    clientName: "Cliente B",
    productManagerName: "PM Dos",
    hourTypeId: "type-1",
    hourTypeName: "Facturable",
    countryName: "Perú",
    hours: 7,
    description: "Diseño de arquitectura de automatización.",
  },
  {
    id: "reg-13",
    date: "2025-04-10T00:00:00.000Z",
    consultorId: "user-1",
    consultorName: "Test Admin",
    projectId: "proj-3",
    projectName: "Implementación Zabbix",
    clientName: "Cliente C",
    productManagerName: "PM Tres",
    hourTypeId: "type-2",
    hourTypeName: "No Facturable",
    countryName: "Argentina",
    hours: 4,
    description: "Investigación de plugins para Zabbix.",
  },
]

// --- Getter functions ---
export const getMockUsers = (): User[] => mockUsers
export const getMockProjects = (): Project[] => mockProjects
export const getMockHourTypes = (): HourType[] => mockHourTypes
export const getMockCountries = (): string[] => mockCountries
export const getMockHourRegistrations = (): HourRegistration[] => mockHourRegistrations

// --- Setter functions (for simulating updates) ---
export const setMockUsers = (newUsers: User[]) => {
  mockUsers = newUsers
}
export const setMockProjects = (newProjects: Project[]) => {
  mockProjects = newProjects
}
export const setMockHourTypes = (newHourTypes: HourType[]) => {
  mockHourTypes = newHourTypes
}
export const setMockCountries = (newCountries: string[]) => {
  mockCountries = newCountries
}
export const setMockHourRegistrations = (newRegistrations: HourRegistration[]) => {
  mockHourRegistrations = newRegistrations
}

// --- Utility functions ---
export const exportToCsv = (data: any[], filename: string) => {
  if (!data.length) {
    console.warn("No data to export to CSV.")
    return
  }

  const header = Object.keys(data[0])
  const csv = [
    header.join(","),
    ...data.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], (key, value) => (value === null ? "" : value)))
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
