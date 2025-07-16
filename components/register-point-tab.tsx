"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // new
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar" // neww
import { CaptionProps } from "react-day-picker" // new
import { ptBR } from "date-fns/locale" // new
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
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  //Calendar,
  CalendarIcon, //new
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react"
import { formatCPF } from "@/lib/utils"
import { formatMinutesToHours, intervalToMinutes } from "@/lib/time-calculations"

interface Employee {
  id: string
  name: string
  cpf: string
}

interface TimeRecord {
  id: string
  employee_id: string
  date: string
  entry_time: string | null
  lunch_start: string | null
  lunch_end: string | null
  exit_time: string | null
  extra_hours: string | null
  missing_hours: string | null
  employee: {
    name: string
    cpf: string
  }
}

interface WorkSchedule {
  day_of_week: number
  entry_time: string | null
  lunch_start: string | null
  lunch_end: string | null
  exit_time: string | null
}

function CustomCaption({ displayMonth, locale, classNames, onMonthChange }: CaptionProps) {
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2025, i).toLocaleString(locale ?? "pt-BR", { month: "long" })
  )

  return (
    <div className="flex justify-center items-center gap-4 mb-4">
      <select
        className="rounded-md border px-2 py-1 text-sm capitalize"
        value={displayMonth.getMonth()}
        onChange={(e) => onMonthChange?.(new Date(displayMonth.getFullYear(), +e.target.value))}
      >
        {months.map((month, i) => (
          <option key={month} value={i}>
            {month}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border px-2 py-1 text-sm"
        value={displayMonth.getFullYear()}
        onChange={(e) => onMonthChange?.(new Date(+e.target.value, displayMonth.getMonth()))}
      >
        {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  )
}

export function RegisterPointTab() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const getLocalISODate = (date: Date = new Date()): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
  const [selectedDate, setSelectedDate] = useState<string>(getLocalISODate()) 
  const [year, month, day] = selectedDate.split("-").map(Number) // new 
  const selectedDateObject = new Date(year, month - 1, day) // ✅ Corrige o fuso // new
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([])
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pointType, setPointType] = useState<"entry_time" | "lunch_start" | "lunch_end" | "exit_time">("entry_time")
  const [manualTime, setManualTime] = useState<string>("")
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null)
  const [editingPointType, setEditingPointType] = useState<"entry_time" | "lunch_start" | "lunch_end" | "exit_time">(
    "entry_time",
  )
  const [deletingRecord, setDeletingRecord] = useState<{ record: TimeRecord; pointType: string } | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadEmployees()
  }, [user])

  useEffect(() => {
    loadDateRecords()
    loadWorkSchedule()
  }, [selectedDate, employees])

  const loadEmployees = async () => {
    if (!user) return

    try {
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", user.id).single()

      if (company) {
        const { data: employeesData } = await supabase
          .from("employees")
          .select("id, name, cpf")
          .eq("company_id", company.id)
          .order("name")

        setEmployees(employeesData || [])
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error)
    }
  }

  const loadDateRecords = async () => {
    if (!user || employees.length === 0) return

    try {
      const { data: recordsData } = await supabase
        .from("time_records")
        .select(`
          *,
          employee:employees(name, cpf)
        `)
        .eq("date", selectedDate)
        .in(
          "employee_id",
          employees.map((e) => e.id),
        )
        .order("created_at", { ascending: false })

      setTimeRecords(recordsData || [])
    } catch (error) {
      console.error("Erro ao carregar registros:", error)
    }
  }

  const loadWorkSchedule = async () => {
    if (!user) return

    try {
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", user.id).single()

      if (company) {
        // Corrigir para garantir data local e não UTC
        const [year, month, day] = selectedDate.split("-").map(Number)
        const localDate = new Date(year, month - 1, day)
        const dayOfWeek = localDate.getDay()
        const { data: scheduleData } = await supabase
          .from("work_schedules")
          .select("*")
          .eq("company_id", company.id)
          .eq("day_of_week", dayOfWeek)
          .single()

        setWorkSchedule(scheduleData)
      }
    } catch (error) {
      console.error("Erro ao carregar horário:", error)
      setWorkSchedule(null)
    }
  }

  const openPointDialog = (type: "entry_time" | "lunch_start" | "lunch_end" | "exit_time") => {
    if (!selectedEmployee) {
      toast({
        title: "Erro",
        description: "Selecione um funcionário primeiro",
        variant: "destructive",
      })
      return
    }

    setPointType(type)
    setManualTime(workSchedule?.[type] || "")
    setDialogOpen(true)
  }

  const openEditDialog = (record: TimeRecord, type: "entry_time" | "lunch_start" | "lunch_end" | "exit_time") => {
    setEditingRecord(record)
    setEditingPointType(type)
    setManualTime(record[type] || "")
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (record: TimeRecord, pointType: string) => {
    setDeletingRecord({ record, pointType })
    setDeleteDialogOpen(true)
  }

  const registerPoint = async () => {
    if (!selectedEmployee || !manualTime) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const employee = employees.find((e) => e.id === selectedEmployee)
      if (!employee) return

      // Verificar se já existe registro para a data
      const { data: existingRecord } = await supabase
        .from("time_records")
        .select("*")
        .eq("employee_id", selectedEmployee)
        .eq("date", selectedDate)
        .single()

      const updateData = {
        [pointType]: manualTime,
      }

      if (existingRecord) {
        // Atualizar registro existente
        const { error } = await supabase.from("time_records").update(updateData).eq("id", existingRecord.id)

        if (error) throw error
      } else {
        // Criar novo registro
        const { error } = await supabase.from("time_records").insert({
          employee_id: selectedEmployee,
          date: selectedDate.substring(0, 10),
          ...updateData,
        })

        if (error) throw error
      }

      // Chamar função de cálculo manualmente para garantir
      await supabase.rpc("calculate_time_differences", {
        p_employee_id: selectedEmployee,
        p_date: selectedDate,
      })

      const typeNames = {
        entry_time: "Entrada",
        lunch_start: "Início do Almoço",
        lunch_end: "Fim do Almoço",
        exit_time: "Saída",
      }  

      toast({
        title: "Ponto registrado!",
        description: `${typeNames[pointType]} de ${employee.name} às ${manualTime} em ${new Date(selectedDate).toLocaleDateString("pt-BR")}`,
      })

      setDialogOpen(false)
      setTimeout(() => {
        loadDateRecords()
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Erro ao registrar ponto",
        description: error.message || "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const editPoint = async () => {
    if (!editingRecord || !manualTime) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const updateData = {
        [editingPointType]: manualTime,
      }

      const { error } = await supabase.from("time_records").update(updateData).eq("id", editingRecord.id)

      if (error) throw error

      // Recalcular horas
      await supabase.rpc("calculate_time_differences", {
        p_employee_id: editingRecord.employee_id,
        p_date: selectedDate,
      })

      const typeNames = {
        entry_time: "Entrada",
        lunch_start: "Início do Almoço",
        lunch_end: "Fim do Almoço",
        exit_time: "Saída",
      }

      toast({
        title: "Ponto editado!",
        description: `${typeNames[editingPointType]} alterado para ${manualTime}`,
      })

      setEditDialogOpen(false)
      setEditingRecord(null)
      setTimeout(() => {
        loadDateRecords()
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Erro ao editar ponto",
        description: error.message || "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deletePoint = async () => {
    if (!deletingRecord) return

    setLoading(true)

    try {
      const updateData = {
        [deletingRecord.pointType]: null,
      }

      const { error } = await supabase.from("time_records").update(updateData).eq("id", deletingRecord.record.id)

      if (error) throw error

      // Recalcular horas
      await supabase.rpc("calculate_time_differences", {
        p_employee_id: deletingRecord.record.employee_id,
        p_date: selectedDate,
      })

      const typeNames = {
        entry_time: "Entrada",
        lunch_start: "Início do Almoço",
        lunch_end: "Fim do Almoço",
        exit_time: "Saída",
      }

      toast({
        title: "Ponto excluído!",
        description: `${typeNames[deletingRecord.pointType as keyof typeof typeNames]} foi removido`,
      })

      setDeleteDialogOpen(false)
      setDeletingRecord(null)
      setTimeout(() => {
        loadDateRecords()
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Erro ao excluir ponto",
        description: error.message || "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const recalculateHours = async (employeeId: string) => {
    try {
      await supabase.rpc("calculate_time_differences", {
        p_employee_id: employeeId,
        p_date: selectedDate,
      })

      toast({
        title: "Horas recalculadas!",
        description: "Os cálculos foram atualizados",
      })

      loadDateRecords()
    } catch (error: any) {
      toast({
        title: "Erro ao recalcular",
        description: error.message || "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const selectedEmployeeRecord = timeRecords.find((r) => r.employee_id === selectedEmployee)

  const typeNames = {
    entry_time: "Entrada",
    lunch_start: "Início do Almoço",
    lunch_end: "Fim do Almoço",
    exit_time: "Saída",
  }

  function formatDateWithWeekday(dateString: string): string {
    const [year, month, day] = dateString.split("-").map(Number)
    const localDate = new Date(year, month - 1, day)
  
    return localDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Gerar opções de dias do mês atual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const date = new Date(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`)
    return {
      value: getLocalISODate(date),
      label: `${day.toString().padStart(2, "0")} - ${date.toLocaleDateString("pt-BR", { weekday: "short" })}`,
    }
  })

  const renderTimeCell = (record: TimeRecord, field: "entry_time" | "lunch_start" | "lunch_end" | "exit_time") => {
    const value = record[field]
    return (
      <TableCell>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {value ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{value}</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Não registrado</span>
              </>
            )}
          </div>
          <div className="flex space-x-1">
            {value && (
              <>
                <Button size="sm" variant="ghost" onClick={() => openEditDialog(record, field)} className="h-6 w-6 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openDeleteDialog(record, field)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </TableCell>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Registrar Ponto Manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Seleção de Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-muted-foreground h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span>
                        {selectedDate ? format(selectedDateObject, "dd/MM/yyyy") : "Selecione a data"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border rounded-xl shadow-lg w-auto z-50 bg-white">
                      <Calendar
                        mode="single"
                        selected={selectedDateObject}
                        onSelect={(date) => {
                          if (date) setSelectedDate(getLocalISODate(date))
                        }}
                        locale={ptBR}
                        components={{
                          Caption: CustomCaption, // 👈 novo caption bonitão
                        }}
                        classNames={{
                          head_row: "grid grid-cols-7",
                          head_cell: "text-center text-muted-foreground text-xs font-semibold uppercase",
                          row: "grid grid-cols-7 w-full mb-1",
                          cell: "aspect-square w-full flex items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none",
                          day_selected: "bg-primary text-white hover:bg-primary/90",
                          day_today: "border border-primary",
                          day_outside: "text-muted-foreground opacity-50",
                        }}
                      />
                  </PopoverContent>
                </Popover>
              </div>


              {/* Seleção de Funcionário */}
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>
                            {employee.name} - {formatCPF(employee.cpf)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botões de Registro */}
            {selectedEmployee && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => openPointDialog("entry_time")}
                  variant={selectedEmployeeRecord?.entry_time ? "secondary" : "default"}
                  className="h-20 flex flex-col"
                >
                  <Clock className="h-6 w-6 mb-2" />
                  <span>Entrada</span>
                  {selectedEmployeeRecord?.entry_time && (
                    <span className="text-xs">{selectedEmployeeRecord.entry_time}</span>
                  )}
                </Button>

                <Button
                  onClick={() => openPointDialog("lunch_start")}
                  variant={selectedEmployeeRecord?.lunch_start ? "secondary" : "default"}
                  className="h-20 flex flex-col"
                >
                  <Clock className="h-6 w-6 mb-2" />
                  <span>Início Almoço</span>
                  {selectedEmployeeRecord?.lunch_start && (
                    <span className="text-xs">{selectedEmployeeRecord.lunch_start}</span>
                  )}
                </Button>

                <Button
                  onClick={() => openPointDialog("lunch_end")}
                  variant={selectedEmployeeRecord?.lunch_end ? "secondary" : "default"}
                  className="h-20 flex flex-col"
                >
                  <Clock className="h-6 w-6 mb-2" />
                  <span>Fim Almoço</span>
                  {selectedEmployeeRecord?.lunch_end && (
                    <span className="text-xs">{selectedEmployeeRecord.lunch_end}</span>
                  )}
                </Button>

                <Button
                  onClick={() => openPointDialog("exit_time")}
                  variant={selectedEmployeeRecord?.exit_time ? "secondary" : "default"}
                  className="h-20 flex flex-col"
                >
                  <Clock className="h-6 w-6 mb-2" />
                  <span>Saída</span>
                  {selectedEmployeeRecord?.exit_time && (
                    <span className="text-xs">{selectedEmployeeRecord.exit_time}</span>
                  )}
                </Button>
              </div>
            )}

            {/* Horário Configurado */}
            {workSchedule && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    Horário Configurado para {formatDateWithWeekday(selectedDate)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Entrada:</span>
                      <p>{workSchedule.entry_time || "Não definido"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Início Almoço:</span>
                      <p>{workSchedule.lunch_start || "Não definido"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Fim Almoço:</span>
                      <p>{workSchedule.lunch_end || "Não definido"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Saída:</span>
                      <p>{workSchedule.exit_time || "Não definido"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cálculo de Horas para o Funcionário Selecionado */}
            {selectedEmployeeRecord && workSchedule && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Cálculo de Horas - {employees.find((e) => e.id === selectedEmployee)?.name}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => recalculateHours(selectedEmployee)}
                      className="h-8"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Recalcular
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Horas Extras:</span>
                      <span className="text-green-600 font-bold">
                        {formatMinutesToHours(intervalToMinutes(selectedEmployeeRecord.extra_hours || "0"))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Faltas:</span>
                      <span className="text-red-600 font-bold">
                        {formatMinutesToHours(intervalToMinutes(selectedEmployeeRecord.missing_hours || "0"))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para inserir horário manual */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar {typeNames[pointType]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Input
                value={employees.find((e) => e.id === selectedEmployee)?.name || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={new Date(selectedDate).toLocaleDateString("pt-BR")} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                placeholder="00:00"
                required
              />
            </div>
            {workSchedule && workSchedule[pointType] && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Horário configurado:</strong> {workSchedule[pointType]}
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={registerPoint} disabled={loading || !manualTime}>
                {loading ? "Registrando..." : "Registrar Ponto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar horário */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {typeNames[editingPointType]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Input value={editingRecord?.employee.name || ""} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={new Date(selectedDate).toLocaleDateString("pt-BR")} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Novo Horário</Label>
              <Input
                type="time"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                placeholder="00:00"
                required
              />
            </div>
            {workSchedule && workSchedule[editingPointType] && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Horário configurado:</strong> {workSchedule[editingPointType]}
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={editPoint} disabled={loading || !manualTime}>
                {loading ? "Salvando..." : "Salvar Alteração"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para excluir */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro de Ponto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o registro de{" "}
              {deletingRecord && typeNames[deletingRecord.pointType as keyof typeof typeNames]}? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deletePoint} className="bg-red-600 hover:bg-red-700">
              {loading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Registros da Data Selecionada */}
      <Card>
        <CardHeader>
        <CardTitle>
          Registros de {formatDateWithWeekday(selectedDate)}
        </CardTitle>
        </CardHeader>
        <CardContent>
          {timeRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum ponto registrado para {formatDateWithWeekday(selectedDate)}.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Início Almoço</TableHead>
                  <TableHead>Fim Almoço</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Horas Extras</TableHead>
                  <TableHead>Faltas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employee.name}</TableCell>
                    {renderTimeCell(record, "entry_time")}
                    {renderTimeCell(record, "lunch_start")}
                    {renderTimeCell(record, "lunch_end")}
                    {renderTimeCell(record, "exit_time")}
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">
                          {formatMinutesToHours(intervalToMinutes(record.extra_hours || "0"))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-red-600 font-medium">
                          {formatMinutesToHours(intervalToMinutes(record.missing_hours || "0"))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => recalculateHours(record.employee_id)}
                        className="h-8"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
