"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Lock, RefreshCw, Save, Shield, UserIcon } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { authenticatedFetch } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://backend-invoke.azurewebsites.net"

/* -------------------------------------------------------------------------- */
/*                               Tipos auxiliares                             */
/* -------------------------------------------------------------------------- */
type BackendParameter = {
  id: number
  tipo: "pais" | "pm" | "tipo_hora" | "proyecto"
  nombre: string
  codigo: string | null
  icono: string | null
}

type Country = {
  id: number
  name: string
  code: string
  flag: string
}

// Updated ProfileData type to match backend field names
type ProfileData = {
  name: string
  email: string
  telefono: string // Changed from phone
  direccion: string // Changed from address
  biografia: string // Changed from bio
  pais: string // Changed from countryName
  idioma: string
  avatar_url: string // Changed from avatarUrl
}

/* -------------------------------------------------------------------------- */
/*                             Componente principal                           */
/* -------------------------------------------------------------------------- */
export default function ProfilePage() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  /* ------------------------------ Estados UI ------------------------------ */
  const [isFetching, setIsFetching] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [availableCountries, setAvailableCountries] = useState<Country[]>([])

  /* ----------------------------- Formulario perfil ----------------------------- */
  // Initializing with backend field names
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    telefono: "",
    direccion: "",
    biografia: "",
    pais: "",
    idioma: "es",
    avatar_url: "",
  })

  /* ---------------------------- Formulario password ---------------------------- */
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  /* -------------------------------------------------------------------------- */
  /*                          Funciones auxiliares                              */
  /* -------------------------------------------------------------------------- */
  const fetchProfile = useCallback(async () => {
    if (!currentUser) return
    setIsFetching(true)

    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/api/users/me`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      // Mapping backend data to frontend state using backend field names
      setProfileData({
        name: data.name ?? "",
        email: data.email ?? "",
        telefono: data.telefono ?? "", // Mapped
        direccion: data.direccion ?? "", // Mapped
        biografia: data.biografia ?? "", // Mapped
        pais: data.pais ?? "", // Mapped
        idioma: data.idioma ?? "es",
        avatar_url: data.avatar_url ?? "", // Mapped
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message ?? "No se pudo cargar el perfil.",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }, [currentUser, toast])

  const fetchCountries = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/api/parametros`)
      const data: BackendParameter[] = await res.json()
      if (!res.ok) throw new Error("Error al obtener parámetros")

      // Filtrar solo los países
      const countriesData = data.filter((param) => param.tipo === "pais")

      setAvailableCountries(
        countriesData.map((c) => ({
          id: c.id,
          name: c.nombre,
          code: c.codigo ?? "",
          flag: c.icono ?? "🏳️",
        })),
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los países.",
        variant: "destructive",
      })
    }
  }, [toast])

  /* -------------------------------- Effects -------------------------------- */
  useEffect(() => {
    fetchProfile()
    fetchCountries()
  }, [fetchProfile, fetchCountries])

  /* -------------------------------------------------------------------------- */
  /*                            Handlers de formularios                         */
  /* -------------------------------------------------------------------------- */
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)

    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Sending profileData directly as its keys now match backend
        body: JSON.stringify(profileData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      toast({
        title: "Perfil actualizado",
        description: "Tu información se guardó correctamente.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message ?? "No se pudo guardar el perfil.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingPassword(true)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      })
      setIsSavingPassword(false)
      return
    }

    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/api/users/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se cambió correctamente.",
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message ?? "No se pudo cambiar la contraseña.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
  if (!currentUser || isFetching) {
    return (
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: "white" }}>
        <RefreshCw className="animate-spin w-6 h-6 text-[#004072]" />
        <span className="ml-2 text-black">Cargando perfil...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in-up" style={{ backgroundColor: "white", minHeight: "100vh", padding: "24px" }}>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-3 items-center">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#004072" }}>
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#004072]">Mi Perfil</h1>
            <p className="text-gray-700">Gestiona tu información personal y preferencias</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="bg-white border-[#004072] text-[#004072] hover:bg-[#004072] hover:text-white"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al Dashboard
            </Link>
          </Button>
          <Badge variant="secondary" className="bg-[#004072] text-white">
            <Shield className="w-4 h-4 mr-1" />
            {currentUser.role === "administrador" ? "Administrador" : "Consultor"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full bg-white border border-gray-200">
          <TabsTrigger
            value="profile"
            className="text-gray-900 data-[state=active]:bg-[#004072] data-[state=active]:text-white"
          >
            <UserIcon className="w-4 h-4 mr-1" />
            Información Personal
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="text-gray-900 data-[state=active]:bg-[#004072] data-[state=active]:text-white"
          >
            <Lock className="w-4 h-4 mr-1" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* ----------------اريات TAB: Información personal ---------------------- */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <UserIcon className="w-5 h-5" />
                Información Personal
              </CardTitle>
              <CardDescription className="text-gray-700">Actualiza tu información de contacto</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Avatar Display */}
              <div className="flex gap-6 items-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} alt="Avatar" />
                  <AvatarFallback className="text-2xl bg-[#004072] text-white">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Separator />

              {/* Formulario */}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900 font-medium">Nombre Completo</Label>
                    <Input value={profileData.name} readOnly className="bg-gray-50 text-gray-900 border-gray-300" />
                  </div>
                  <div>
                    <Label className="text-gray-900 font-medium">Correo</Label>
                    <Input
                      value={profileData.email}
                      readOnly
                      type="email"
                      className="bg-gray-50 text-gray-900 border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900 font-medium">Teléfono</Label>
                    <Input
                      value={profileData.telefono} // Changed to telefono
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          telefono: e.target.value, // Changed to telefono
                        })
                      }
                      placeholder="+34 ..."
                      className="bg-white text-gray-900 border-gray-300 focus:border-[#004072] focus:ring-1 focus:ring-[#004072]"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-900 font-medium">País</Label>
                    <Select
                      value={profileData.pais} // Changed to pais
                      onValueChange={(value) => setProfileData({ ...profileData, pais: value })} // Changed to pais
                    >
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-[#004072] focus:ring-1 focus:ring-[#004072]">
                        <SelectValue placeholder="Selecciona país" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {availableCountries.map((c) => (
                          <SelectItem key={c.id} value={c.name} className="text-gray-900">
                            <img
                              src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                              alt={`Bandera de ${c.name}`}
                              className="inline-block w-5 h-3 mr-2"
                            />
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Dirección</Label>
                  <Input
                    value={profileData.direccion} // Changed to direccion
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        direccion: e.target.value, // Changed to direccion
                      })
                    }
                    className="bg-white text-gray-900 border-gray-300 focus:border-[#004072] focus:ring-1 focus:ring-[#004072]"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Biografía</Label>
                  <Textarea
                    rows={3}
                    value={profileData.biografia} // Changed to biografia
                    onChange={(e) => setProfileData({ ...profileData, biografia: e.target.value })} // Changed to biografia
                    className="bg-white text-gray-900 border-gray-300 focus:border-[#004072] focus:ring-1 focus:ring-[#004072]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900 font-medium">Idioma</Label>
                    <Select
                      value={profileData.idioma}
                      onValueChange={(value) => setProfileData({ ...profileData, idioma: value })}
                    >
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-[#004072] focus:ring-1 focus:ring-[#004072]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="es" className="text-gray-900">
                          Español
                        </SelectItem>
                        <SelectItem value="en" className="text-gray-900">
                          English
                        </SelectItem>
                        <SelectItem value="pt" className="text-gray-900">
                          Português
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button disabled={isSavingProfile} className="bg-[#004072] hover:bg-[#003a66] text-white">
                    {isSavingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------- TAB: Seguridad -------------------------- */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex gap-2 items-center text-black">
                <Lock className="w-5 h-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription className="text-gray-700">
                Mantén tu cuenta segura actualizando tu contraseña
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label className="text-gray-900 font-medium">Contraseña Actual</Label>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                    className="bg-white text-gray-900 border-gray-300 focus:border-[#004072] focus:ring-1 focus:ring-[#004072]"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Nueva Contraseña</Label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    required
                    className="bg-white text-gray-900 border-gray-300 focus:border-[#004072] focus:ring-1 focus:ring-[#004072]"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Confirmar Contraseña</Label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    className="bg-white text-gray-900 border-gray-300 focus:border-[#004072] focus:ring-1 focus:ring-[#004072]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isSavingPassword}
                    className="bg-white border-[#004072] text-[#004072] hover:bg-[#004072] hover:text-white"
                  >
                    {isSavingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Cambiar Contraseña
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-black">Información de Seguridad</CardTitle>
              <CardDescription className="text-gray-700">Detalles de tu cuenta</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border border-gray-200 p-4 rounded-lg bg-white">
                <div className="flex gap-3 items-center">
                  <Shield className="w-5 h-5 text-[#004072]" />
                  <div>
                    <p className="font-medium text-gray-900">Cuenta Verificada</p>
                    <p className="text-sm text-gray-600">Tu cuenta está verificada y segura</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Activa
                </Badge>
              </div>

              <div className="flex justify-between items-center border border-gray-200 p-4 rounded-lg bg-white">
                <div className="flex gap-3 items-center">
                  <Calendar className="w-5 h-5 text-[#004072]" />
                  <div>
                    <p className="font-medium text-gray-900">Último Acceso</p>
                    <p className="text-sm text-gray-600">Hoy a las 14:30</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
