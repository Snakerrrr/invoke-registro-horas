"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { isDemoUser, getAuthSourceLabel } from "@/lib/auth"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function UserHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const isDemo = isDemoUser(user)
  const authSource = getAuthSourceLabel(user)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex items-center justify-end p-4 bg-white border-b border-gray-200">
      <SidebarTrigger className="mr-4 bg-gray-100 hover:bg-gray-200 border border-black text-gray-900" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-10 px-3 bg-gray-100 hover:bg-gray-200 border border-black" // Changed border-gray-200 to border-black
          >
            <Avatar className="h-8 w-8 rounded-lg border border-gray-200">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
              <AvatarFallback className="rounded-lg font-semibold text-white" style={{ backgroundColor: "#004072" }}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left text-sm leading-tight">
              <div className="font-semibold text-gray-900">{user?.name || "Usuario"}</div>
              <div className="text-xs text-gray-500">{user?.email || "usuario@ejemplo.com"}</div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg bg-white border border-gray-200 shadow-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg border border-gray-200">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                <AvatarFallback className="rounded-lg font-semibold text-white" style={{ backgroundColor: "#004072" }}>
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-gray-900">{user?.name || "Usuario"}</span>
                <span className="truncate text-xs text-gray-500">{user?.email || "usuario@ejemplo.com"}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-100" />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50">
              <Link href="/dashboard/perfil" className="flex items-center gap-2 text-gray-900">
                <User className="h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-gray-100" />
          <div className="px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Rol:</span>
              <Badge
                variant="secondary"
                className="text-xs text-white"
                style={{ backgroundColor: "#004072", borderColor: "#004072" }}
              >
                {user?.role === "administrador" ? "Admin" : "Consultor"}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Fuente:</span>
              <Badge
                variant={isDemo ? "outline" : "default"}
                className="text-xs"
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
          <DropdownMenuSeparator className="bg-gray-100" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="hover:bg-red-50 hover:text-red-700 cursor-pointer text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
