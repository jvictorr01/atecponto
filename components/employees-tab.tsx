"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Plus, Edit, Trash2 } from "lucide-react"
import { formatCPF } from "@/lib/utils"

interface Employee {
  id: string
  name: string
  cpf: string
  created_at: string
}

interface EmployeesTabProps {
  onEmployeeCountChange: () => void
}

export function EmployeesTab({ onEmployeeCountChange }: EmployeesTabProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({ name: "", cpf: "" })
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadEmployees()
  }, [user])

  const loadEmployees = async () => {
    if (!user) return

    try {
      // Primeiro, buscar a empresa do usuário
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", user.id).single()

      if (company) {
        const { data: employeesData } = await supabase
          .from("employees")
          .select("*")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })

        setEmployees(employeesData || [])
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Verificar limite de 20 funcionários
    if (!editingEmployee && employees.length >= 20) {
      toast({
        title: "Limite atingido",
        description: "Você pode cadastrar no máximo 20 funcionários",
        variant: "destructive",
      })
      return
    }

    try {
      // Buscar empresa
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", user.id).single()

      if (!company) return

      if (editingEmployee) {
        // Editar funcionário
        const { error } = await supabase
          .from("employees")
          .update({
            name: formData.name,
            cpf: formData.cpf.replace(/\D/g, ""),
          })
          .eq("id", editingEmployee.id)

        if (error) throw error

        toast({
          title: "Funcionário atualizado",
          description: "Os dados foram salvos com sucesso",
        })
      } else {
        // Criar novo funcionário
        const { error } = await supabase.from("employees").insert({
          company_id: company.id,
          name: formData.name,
          cpf: formData.cpf.replace(/\D/g, ""),
        })

        if (error) throw error

        toast({
          title: "Funcionário cadastrado",
          description: "Funcionário adicionado com sucesso",
        })
      }

      setDialogOpen(false)
      setEditingEmployee(null)
      setFormData({ name: "", cpf: "" })
      loadEmployees()
      onEmployeeCountChange()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar funcionário",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({ name: employee.name, cpf: formatCPF(employee.cpf) })
    setDialogOpen(true)
  }

  const handleDelete = async (employeeId: string) => {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) return

    try {
      const { error } = await supabase.from("employees").delete().eq("id", employeeId)

      if (error) throw error

      toast({
        title: "Funcionário excluído",
        description: "Funcionário removido com sucesso",
      })

      loadEmployees()
      onEmployeeCountChange()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir funcionário",
        variant: "destructive",
      })
    }
  }

  const formatCPFInput = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
  }

  const openDialog = () => {
    setEditingEmployee(null)
    setFormData({ name: "", cpf: "" })
    setDialogOpen(true)
  }

  if (loading) {
    return <div className="text-center py-8">Carregando funcionários...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Funcionários ({employees.length}/20)</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog} disabled={employees.length >= 20}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cpf: formatCPFInput(e.target.value) }))}
                    maxLength={14}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingEmployee ? "Salvar" : "Cadastrar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum funcionário cadastrado ainda.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{formatCPF(employee.cpf)}</TableCell>
                  <TableCell>{new Date(employee.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-700"
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
  )
}
