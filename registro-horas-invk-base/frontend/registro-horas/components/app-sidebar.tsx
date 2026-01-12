"use client"

import type * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Clock,
  FileText,
  Users,
  BarChart3,
  UserCog,
  Settings,
  Calendar,
  UserCheck,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { isDemoUser, getAuthSourceLabel } from "@/lib/auth"
import Image from "next/image" // Import Image component

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isDemo = isDemoUser(user)
  const authSource = getAuthSourceLabel(user)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        url: "/",
        icon: BarChart3,
        isActive: pathname === "/",
      },
      {
        title: "Registro de Horas",
        url: "/dashboard/registro",
        icon: Clock,
        isActive: pathname === "/dashboard/registro",
      },
      {
        title: "Mis Registros",
        url: "/dashboard/mis-registros",
        icon: Calendar,
        isActive: pathname === "/dashboard/mis-registros",
      },
    ]

    if (user?.role === "consultor") {
      // For consultants, "Reportes" page is removed entirely from navigation
      return { main: commonItems, admin: [] }
    }

    // For administrators, "Reportes" is included
    commonItems.push({
      title: "Reportes", // For admin, it's just "Reportes"
      url: "/dashboard/reportes",
      icon: FileText,
      isActive: pathname === "/dashboard/reportes",
    })

    // Admin items - group admin-specific items separately
    const adminItems = [
      {
        title: "Todos los Registros",
        url: "/dashboard/registros-admin",
        icon: FileText,
        isActive: pathname === "/dashboard/registros-admin",
      },
      {
        title: "Horas por Usuario",
        url: "/dashboard/horas-por-usuario",
        icon: UserCheck,
        isActive: pathname === "/dashboard/horas-por-usuario",
      },
      {
        title: "Gestionar Usuarios",
        url: "/dashboard/gestion-usuarios",
        icon: Users,
        isActive: pathname === "/dashboard/gestion-usuarios",
      },
      {
        title: "Usuarios Pendientes",
        url: "/dashboard/usuarios-pendientes",
        icon: UserCog,
        isActive: pathname === "/dashboard/usuarios-pendientes",
      },
      {
        title: "Gestionar Parámetros",
        url: "/dashboard/gestion-parametros",
        icon: Settings,
        isActive: pathname === "/dashboard/gestion-parametros",
      },
    ]

    return { main: commonItems, admin: adminItems }
  }

  const navigationItems = getNavigationItems()

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-100 bg-white">
        <div className="flex h-16 shrink-0 items-center gap-2 px-4">
          <div
            className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden" // Removed text-white and background style
          >
            <Image
              src="/logo-invoke.png"
              alt="Invoke Logo"
              width={32} // Set appropriate width
              height={32} // Set appropriate height
              className="h-full w-full object-contain" // Ensure image fits and maintains aspect ratio
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-gray-900">INVOKE</span>
            <span className="truncate text-xs" style={{ color: "#004072" }}>
              Sistema de Horas
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
            NAVEGACIÓN
          </SidebarGroupLabel>
          <SidebarMenu>
            {navigationItems.main.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  className="w-full justify-start px-3 py-2 text-sm font-medium text-gray-700 hover:text-white data-[active=true]:text-white"
                  style={{
                    ...(item.isActive ? { backgroundColor: "#004072" } : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.backgroundColor = "#e6f2ff"
                      e.currentTarget.style.color = "#004072"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.backgroundColor = ""
                      e.currentTarget.style.color = "#374151"
                    }
                  }}
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {navigationItems.admin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
              ADMINISTRACIÓN
            </SidebarGroupLabel>
            <SidebarMenu>
              {navigationItems.admin.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    className="w-full justify-start px-3 py-2 text-sm font-medium text-gray-700 hover:text-white data-[active=true]:text-white"
                    style={{
                      ...(item.isActive ? { backgroundColor: "#004072" } : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (!item.isActive) {
                        e.currentTarget.style.backgroundColor = "#e6f2ff"
                        e.currentTarget.style.color = "#004072"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.isActive) {
                        e.currentTarget.style.backgroundColor = ""
                        e.currentTarget.style.color = "#374151"
                      }
                    }}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
