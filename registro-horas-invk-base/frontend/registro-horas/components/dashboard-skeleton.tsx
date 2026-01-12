import { CardDescription } from "@/components/ui/card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 animate-pulse-slow">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Demo Mode Alert Skeleton */}
        <Alert className="animate-slide-up border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <Skeleton className="h-4 w-full max-w-[300px]" />
          </AlertDescription>
        </Alert>

        {/* INVOKE Header Section Skeleton */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
          <div className="space-y-3">
            <div className="flex items-center gap-4 mb-2">
              <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl invoke-gradient" />
              <div>
                <Skeleton className="h-8 w-32 sm:h-10 sm:w-48 mb-1" />
                <Skeleton className="h-4 w-24 sm:h-5 sm:w-32" />
              </div>
            </div>
            <div className="space-y-2 ml-16 sm:ml-20">
              <Skeleton className="h-6 w-48 sm:h-8 sm:w-64" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          <Button
            asChild
            size="default"
            className="invoke-gradient hover:scale-105 transition-all duration-300 shadow-lg w-full sm:w-auto"
          >
            <Link href="#">
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <Skeleton className="h-4 w-24" />
            </Link>
          </Button>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="group border-0 shadow-lg invoke-card animate-scale-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
                <Skeleton className="p-1.5 sm:p-2 invoke-gradient rounded-lg h-6 w-6 sm:h-8 sm:w-8" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <Skeleton className="h-6 w-20 sm:h-8 sm:w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Recent Activity Skeleton */}
          <Card className="invoke-card border-0 shadow-xl animate-slide-up">
            <CardHeader className="pb-4 p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Skeleton className="p-1.5 sm:p-2 invoke-gradient rounded-lg h-6 w-6 sm:h-8 sm:w-8" />
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                <Skeleton className="h-4 w-48" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl invoke-card space-y-2 sm:space-y-0"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:text-right">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Skeleton */}
          <Card className="invoke-card border-0 shadow-xl animate-slide-up">
            <CardHeader className="pb-4 p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Skeleton className="p-1.5 sm:p-2 invoke-gradient rounded-lg h-6 w-6 sm:h-8 sm:w-8" />
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                <Skeleton className="h-4 w-48" />
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-16 sm:h-20 flex-col gap-2 border-2 invoke-card bg-transparent"
                >
                  <Skeleton className="h-5 w-5 sm:h-6 sm:w-6" />
                  <Skeleton className="h-4 w-20" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section Skeleton */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 animate-slide-up">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="invoke-card border-0 shadow-xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Skeleton className="p-1.5 sm:p-2 invoke-gradient rounded-lg h-6 w-6 sm:h-8 sm:w-8" />
                  <Skeleton className="h-6 w-32" />
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  <Skeleton className="h-4 w-48" />
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg invoke-card"
                      style={{ animationDelay: `${j * 100}ms` }}
                    >
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
