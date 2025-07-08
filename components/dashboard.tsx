"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmployeesTab } from "./employees-tab"
import { TimeTrackingTab } from "./time-tracking-tab"
import { ReportsTab } from "./reports-tab"
import { supabase } from "@/lib/supabase"
import { Clock, Users, BarChart3, LogOut, ExternalLink } from "lucide-react"
import { RegisterPointTab } from "./register-point-tab"

export function Dashboard() {
  const { user, profile, logout } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const [employeeCount, setEmployeeCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadCompanyData()
      loadEmployeeCount()
    }
  }, [user])

  const loadCompanyData = async () => {
    if (!user) return

    const { data } = await supabase.from("companies").select("*").eq("user_id", user.id).single()

    setCompany(data)
  }

  const loadEmployeeCount = async () => {
    if (!user) return

    const { data: companyData } = await supabase.from("companies").select("id").eq("user_id", user.id).single()

    if (companyData) {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyData.id)

      setEmployeeCount(count || 0)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-atec-png_1-AAeR15EfXiAGtFSGwsY99zuEfdCz4e.png"
                alt="ATEC Softwares"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ponto Digital</h1>
                {company && <p className="text-sm text-gray-600">{company.name}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://google.com", "_blank")}
                className="hidden sm:flex"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Fazer Upgrade
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeCount}/20</div>
              <p className="text-xs text-muted-foreground">Limite máximo de funcionários</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Hoje</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Pontos registrados hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Disponível</div>
              <p className="text-xs text-muted-foreground">Exportação em PDF</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="employees">Funcionários</TabsTrigger>
            <TabsTrigger value="timetracking">Ponto</TabsTrigger>
            <TabsTrigger value="register-point">Registrar</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeesTab onEmployeeCountChange={loadEmployeeCount} />
          </TabsContent>

          <TabsContent value="timetracking">
            <TimeTrackingTab />
          </TabsContent>

          <TabsContent value="register-point">
            <RegisterPointTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
