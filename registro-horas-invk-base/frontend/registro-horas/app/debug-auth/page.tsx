"use client"

import { useAuth } from "@/contexts/auth-context"
import { getStoredAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function DebugAuthPage() {
  const { user, isAuthenticated } = useAuth()
  const [storedUser, setStoredUser] = useState<any>(null)
  const [rawStoredData, setRawStoredData] = useState<string>("")

  useEffect(() => {
    // Get stored user
    const stored = getStoredAuth()
    setStoredUser(stored)

    // Get raw stored data
    const rawLocal = localStorage.getItem("invoke_auth")
    const rawSession = sessionStorage.getItem("invoke_auth")
    setRawStoredData(rawLocal || rawSession || "No data found")
  }, [])

  const clearStorage = () => {
    localStorage.removeItem("invoke_auth")
    sessionStorage.removeItem("invoke_auth")
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug de Autenticación</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuario del Contexto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>Autenticado:</strong> {isAuthenticated ? "Sí" : "No"}
            </p>
            {user && (
              <>
                <p>
                  <strong>ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Nombre:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Rol:</strong> <Badge>{user.role}</Badge>
                </p>
                <p>
                  <strong>Role ID:</strong> {user.role_id}
                </p>
                <p>
                  <strong>Fuente:</strong> <Badge variant="outline">{user.authSource}</Badge>
                </p>
                <p>
                  <strong>Token:</strong> {user.token?.substring(0, 20)}...
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuario Almacenado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {storedUser ? (
              <>
                <p>
                  <strong>ID:</strong> {storedUser.id}
                </p>
                <p>
                  <strong>Nombre:</strong> {storedUser.name}
                </p>
                <p>
                  <strong>Email:</strong> {storedUser.email}
                </p>
                <p>
                  <strong>Rol:</strong> <Badge>{storedUser.role}</Badge>
                </p>
                <p>
                  <strong>Role ID:</strong> {storedUser.role_id}
                </p>
                <p>
                  <strong>Fuente:</strong> <Badge variant="outline">{storedUser.authSource}</Badge>
                </p>
              </>
            ) : (
              <p>No hay usuario almacenado</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos Raw del Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(JSON.parse(rawStoredData || "{}"), null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={clearStorage} variant="destructive">
          Limpiar Storage y Recargar
        </Button>
        <Button onClick={() => window.location.reload()}>Recargar Página</Button>
      </div>
    </div>
  )
}
