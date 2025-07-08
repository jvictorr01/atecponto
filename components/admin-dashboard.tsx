"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  LogOut,
  Building2,
  Users,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  Search,
  AlertTriangle,
  Calendar,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { formatCNPJ } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface CompanyWithStats {
  id: string
  name: string
  email: string
  cnpj: string
  whatsapp: string
  status: string
  blocked_at: string | null
  blocked_reason: string | null
  created_at: string
  employee_count: number
}

export function AdminDashboard() {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithStats | null>(null)
  const [blockReason, setBlockReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const { admin, logout } = useAdminAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Função para carregar empresas
    loadCompanies()
  
    // Criar canal realtime com Supabase
    const channel = supabase
      .channel("realtime:companies")
      .on(
        "postgres_changes",
        {
          event: "*", // escuta insert, update e delete
          schema: "public",
          table: "companies",
        },
        (payload) => {
          console.log("📡 Realtime update recebido:", payload)
          loadCompanies()
        }
      )
      .subscribe()
  
    // Cleanup no unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    // Filtrar empresas baseado no termo de busca
    const filtered = companies.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      company.cnpj.includes(searchTerm) ||
      (company.whatsapp && company.whatsapp.includes(searchTerm))
    )
    setFilteredCompanies(filtered)
  }, [companies, searchTerm])

  const loadCompanies = async () => {
    setLoading(true)
    setDebugInfo("Iniciando carregamento...")
  
    try {
      const res = await fetch("/api/admin/get-companies")
      const data = await res.json()
  
      if (!res.ok) {
        throw new Error(data.error || "Erro ao buscar empresas")
      }
  
      console.log("✅ Empresas carregadas:", data.companies.length)
      setDebugInfo(`${data.companies.length} empresas carregadas com sucesso`)
      setCompanies(data.companies)
  
      // ✅ Atualizar o filtro com base no searchTerm atual
      const filtered = data.companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        company.cnpj.includes(searchTerm) ||
        (company.whatsapp && company.whatsapp.includes(searchTerm))
      )
      setFilteredCompanies(filtered)
  
      if (data.companies.length === 0) {
        toast({
          title: "Nenhuma empresa encontrada",
          description: "Não há empresas cadastradas no sistema",
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error("💥 Erro na função loadCompanies:", error)
      toast({
        title: "Erro inesperado",
        description: error.message || "Falha ao carregar empresas",
        variant: "destructive",
      })
      setCompanies([])
      setFilteredCompanies([])
    } finally {
      setLoading(false)
    }
  }  

  const handleBlockCompany = async () => {
    if (!selectedCompany || !blockReason.trim()) {
      toast({
        title: "Erro",
        description: "Informe o motivo do bloqueio",
        variant: "destructive",
      })
      return
    }
  
    setActionLoading(true)
  
    try {
      const res = await fetch("/api/admin/block-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          reason: blockReason,
        }),
      })
  
      const result = await res.json()
  
      if (!res.ok) throw new Error(result.error || "Erro ao bloquear empresa")
  
      toast({
        title: "Empresa bloqueada",
        description: `${selectedCompany.name} foi bloqueada com sucesso`,
      })
      loadCompanies()
    } catch (err: any) {
      toast({
        title: "Erro ao bloquear empresa",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setBlockDialogOpen(false)
      setSelectedCompany(null)
      setBlockReason("")
    }
  }  

  const handleUnblockCompany = async (company: CompanyWithStats) => {
    setActionLoading(true)
  
    try {
      const res = await fetch("/api/admin/unblock-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      })
  
      const result = await res.json()
  
      if (!res.ok) throw new Error(result.error || "Erro ao desbloquear empresa")
  
      toast({
        title: "Empresa desbloqueada",
        description: `${company.name} foi desbloqueada com sucesso`,
      })
  
      loadCompanies()
    } catch (err: any) {
      toast({
        title: "Erro ao desbloquear empresa",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }  

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return
  
    setActionLoading(true)
  
    try {
      const res = await fetch("/api/admin/delete-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: selectedCompany.id }),
      })
  
      const result = await res.json()
  
      if (!res.ok) {
        throw new Error(result.error || "Erro ao excluir empresa")
      }
  
      toast({
        title: "Empresa excluída",
        description: `${selectedCompany.name} foi excluída permanentemente`,
      })
      loadCompanies()
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao excluir empresa",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setDeleteDialogOpen(false)
      setSelectedCompany(null)
    }
  }

  const openBlockDialog = (company: CompanyWithStats) => {
    setSelectedCompany(company)
    setBlockReason("")
    setBlockDialogOpen(true)
  }

  const openDeleteDialog = (company: CompanyWithStats) => {
    setSelectedCompany(company)
    setDeleteDialogOpen(true)
  }

  const openDetailsDialog = (company: CompanyWithStats) => {
    setSelectedCompany(company)
    setDetailsDialogOpen(true)
  }

  const totalCompanies = companies.length
  const activeCompanies = companies.filter((c) => c.status === "active" || !c.status).length
  const blockedCompanies = companies.filter((c) => c.status === "blocked").length
  const totalEmployees = companies.reduce((sum, c) => sum + c.employee_count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-atec-png_1-CliCtKZll3t1sbKhd3btg5wYSmHDM7.png"
                alt="ATEC Softwares"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Backoffice Admin</h1>
                <p className="text-sm text-gray-600">Painel de Administração</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={loadCompanies} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Olá, {admin?.username}</p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info */}
        {debugInfo && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-blue-800">Debug: {debugInfo}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompanies}</div>
              <p className="text-xs text-muted-foreground">Empresas cadastradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCompanies}</div>
              <p className="text-xs text-muted-foreground">Funcionando normalmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Bloqueadas</CardTitle>
              <Ban className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{blockedCompanies}</div>
              <p className="text-xs text-muted-foreground">Acesso suspenso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Em todas as empresas</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email, CNPJ ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas Cadastradas ({filteredCompanies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#09893E] mx-auto mb-4"></div>
                Carregando empresas...
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "Nenhuma empresa encontrada com os critérios de busca." : "Nenhuma empresa cadastrada."}
                <br />
                <Button variant="outline" onClick={loadCompanies} className="mt-4 bg-transparent">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Funcionários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center space-x-1">
                            <span>📧</span>
                            <span>{company.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>📱</span>
                            <span>{company.whatsapp || company.whatsapp || "N/A"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{company.cnpj ? formatCNPJ(company.cnpj) : "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{company.employee_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.status === "active" || !company.status ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            Bloqueada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{new Date(company.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openDetailsDialog(company)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {company.status === "active" || !company.status ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openBlockDialog(company)}
                              disabled={actionLoading}
                            >
                              <Ban className="h-4 w-4 text-orange-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnblockCompany(company)}
                              className="text-green-600 hover:text-green-700"
                              disabled={actionLoading}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(company)}
                            className="text-red-600 hover:text-red-700"
                            disabled={actionLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog para ver detalhes */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Empresa</DialogTitle>
            <DialogDescription>Informações completas da empresa selecionada</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome da Empresa</Label>
                  <p className="text-sm text-gray-600">{selectedCompany.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {selectedCompany.status === "active" || !selectedCompany.status ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <Ban className="h-3 w-3 mr-1" />
                        Bloqueada
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600">{selectedCompany.email || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">WhatsApp</Label>
                  <p className="text-sm text-gray-600">
                    {selectedCompany.whatsapp || selectedCompany.whatsapp || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">CNPJ</Label>
                  <p className="text-sm text-gray-600">
                    {selectedCompany.cnpj ? formatCNPJ(selectedCompany.cnpj) : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Funcionários Cadastrados</Label>
                  <p className="text-sm text-gray-600">{selectedCompany.employee_count}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Data de Cadastro</Label>
                <p className="text-sm text-gray-600">{new Date(selectedCompany.created_at).toLocaleString("pt-BR")}</p>
              </div>

              {selectedCompany.status === "blocked" && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <Label className="text-sm font-medium text-red-800">Empresa Bloqueada</Label>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-red-700">Data do Bloqueio:</Label>
                      <p className="text-xs text-red-600">
                        {selectedCompany.blocked_at
                          ? new Date(selectedCompany.blocked_at).toLocaleString("pt-BR")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-red-700">Motivo:</Label>
                      <p className="text-xs text-red-600">{selectedCompany.blocked_reason || "Não informado"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para bloquear empresa */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Empresa</DialogTitle>
            <DialogDescription>
              Você está prestes a bloquear a empresa "{selectedCompany?.name}". Esta ação impedirá o acesso ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blockReason">Motivo do bloqueio</Label>
              <Input
                id="blockReason"
                placeholder="Informe o motivo do bloqueio..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBlockCompany} disabled={actionLoading}>
              <Ban className="h-4 w-4 mr-2" />
              {actionLoading ? "Bloqueando..." : "Bloquear Empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para excluir */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa Permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong>. Ao excluir a empresa "{selectedCompany?.name}", você também
              excluirá:
              <br />
              <br />• Todos os funcionários cadastrados ({selectedCompany?.employee_count})
              <br />• Todos os registros de ponto
              <br />• Todas as configurações de horário
              <br />• A conta de login da empresa
              <br />
              <br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-[#09893E] hover:bg-[#07722E]"
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {actionLoading ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
