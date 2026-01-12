"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, Loader2, AlertTriangle, CheckCircle, ArrowRight, KeyRound } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { validateEmail, validatePassword, requestPasswordReset } from "@/lib/auth"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const { login, isLoading, error, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const validateForm = () => {
    const errors: string[] = []

    if (!email) {
      errors.push("El email es requerido")
    } else if (!validateEmail(email)) {
      errors.push("Formato de email inválido")
    }

    if (!password) {
      errors.push("La contraseña es requerida")
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    await login({
      email,
      password,
      rememberMe,
    })
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resetEmail || !validateEmail(resetEmail)) {
      setValidationErrors(["Ingresa un email válido"])
      return
    }

    const result = await requestPasswordReset(resetEmail)
    if (result.success) {
      setResetSent(true)
    }
  }

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  const getPasswordStrength = (pwd: string) => {
    const validation = validatePassword(pwd)
    if (pwd.length === 0) return { strength: 0, label: "", color: "" }

    const score = 4 - validation.errors.length
    if (score >= 3) return { strength: 100, label: "Fuerte", color: "bg-green-500" }
    if (score >= 2) return { strength: 75, label: "Moderada", color: "bg-blue-500" }
    if (score >= 1) return { strength: 50, label: "Débil", color: "bg-yellow-500" }
    return { strength: 25, label: "Muy débil", color: "bg-red-500" }
  }

  const passwordStrength = getPasswordStrength(password)

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animated-gradient-background">
        <Card className="w-full max-w-md invoke-card border-0 invoke-3d-card animate-scale-in">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 invoke-gradient rounded-full flex items-center justify-center mb-4 invoke-3d-logo">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold invoke-gradient-text invoke-title">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-base">
              Ingresa tu email para recibir instrucciones de recuperación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-2">¡Email enviado!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.
                  </p>
                  <Button onClick={() => setShowForgotPassword(false)} className="w-full invoke-gradient">
                    Volver al login
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="tu@empresa.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10 h-12 border-0 bg-white/50 dark:bg-slate-800/50"
                      required
                    />
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{validationErrors[0]}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button type="submit" className="w-full h-12 invoke-gradient">
                    Enviar instrucciones
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full h-12"
                  >
                    Volver al login
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-gradient-background">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center animate-slide-up">
          <div className="mx-auto w-32 h-20 flex items-center justify-center mb-6 invoke-3d-logo">
            <Image src="/logo-invoke.png" alt="INVOKE" width={128} height={80} className="drop-shadow-2xl" priority />
          </div>
          <p className="text-lg text-muted-foreground invoke-subtitle">Sistema de Registro de Horas</p>
        </div>

        {/* Login Card */}
        <Card className="invoke-card border-0 invoke-3d-card animate-scale-in">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription className="text-base">
              Accede con tu cuenta del backend o usa las credenciales de prueba
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-0 bg-white/50 dark:bg-slate-800/50"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-0 bg-white/50 dark:bg-slate-800/50"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Fortaleza:</span>
                      <span
                        className={cn(
                          "font-medium",
                          passwordStrength.strength >= 75
                            ? "text-green-600"
                            : passwordStrength.strength >= 50
                              ? "text-blue-600"
                              : passwordStrength.strength >= 25
                                ? "text-yellow-600"
                                : "text-red-600",
                        )}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={cn("h-1.5 rounded-full transition-all duration-300", passwordStrength.color)}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-medium cursor-pointer">
                  Recordar sesión
                </Label>
              </div>

              {/* Error Messages */}
              {(error || validationErrors.length > 0) && (
                <Alert variant="destructive" className="animate-slide-up">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error || validationErrors[0]}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold invoke-gradient hover:scale-105 transition-all duration-300 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
