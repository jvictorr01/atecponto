"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Download, FileText, Calendar, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { formatMinutesToHours, intervalToMinutes } from "@/lib/time-calculations"
import { generatePDFReport } from "@/lib/pdf-generator"

interface Employee {
  id: string
  name: string
  cpf: string
}

interface TimeRecord {
  id: string
  date: string
  entry_time: string | null
  lunch_start: string | null
  lunch_end: string | null
  exit_time: string | null
  extra_hours: string
  missing_hours: string
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

interface DayCalculation {
  date: string
  dayOfWeek: number
  schedule: WorkSchedule | null
  record: TimeRecord | null
  expectedHours: number
  workedHours: number
  extraHours: number
  missingHours: number
}

export function ReportsTab() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([])
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([])
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("monthly")
  const [calculations, setCalculations] = useState<DayCalculation[]>([])
  const { user } = useAuth()

  useEffect(() => {
    loadEmployees()
    loadCompanyData()
    loadWorkSchedules()
  }, [user])

  useEffect(() => {
    if (selectedEmployee) {
      loadTimeRecords()
    }
  }, [selectedEmployee, reportPeriod])

  useEffect(() => {
    if (timeRecords.length > 0 && workSchedules.length > 0) {
      calculateDetailedReport()
    }
  }, [timeRecords, workSchedules])

  const loadCompanyData = async () => {
    if (!user) return

    try {
      const { data } = await supabase.from("companies").select("*").eq("user_id", user.id).single()
      setCompany(data)
    } catch (error) {
      console.error("Erro ao carregar empresa:", error)
    }
  }

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

  const loadWorkSchedules = async () => {
    if (!user) return

    try {
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", user.id).single()

      if (company) {
        const { data: schedulesData } = await supabase
          .from("work_schedules")
          .select("*")
          .eq("company_id", company.id)
          .order("day_of_week")

        setWorkSchedules(schedulesData || [])
      }
    } catch (error) {
      console.error("Erro ao carregar horários:", error)
    }
  }

  const loadTimeRecords = async () => {
    if (!selectedEmployee) return

    setLoading(true)

    try {
      let dateFilter = ""
      const today = new Date()

      switch (reportPeriod) {
        case "daily":
          dateFilter = today.toISOString().split("T")[0]
          break
        case "weekly":
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          dateFilter = weekStart.toISOString().split("T")[0]
          break
        case "monthly":
          dateFilter = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-01`
          break
      }

      const { data: recordsData } = await supabase
        .from("time_records")
        .select(`
          *,
          employee:employees(name, cpf)
        `)
        .eq("employee_id", selectedEmployee)
        .gte("date", dateFilter)
        .order("date", { ascending: false })

      setTimeRecords(recordsData || [])
    } catch (error) {
      console.error("Erro ao carregar registros:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDetailedReport = () => {
    const today = new Date()
    const calculations: DayCalculation[] = []

    // Determinar período baseado na seleção
    let startDate: Date
    let endDate: Date

    switch (reportPeriod) {
      case "daily":
        startDate = new Date(today)
        endDate = new Date(today)
        break
      case "weekly":
        startDate = new Date(today)
        startDate.setDate(today.getDate() - today.getDay())
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        break
      case "monthly":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      default:
        return
    }

    // Iterar por cada dia do período
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      const dayOfWeek = d.getDay()

      // Buscar horário configurado para o dia
      const schedule = workSchedules.find((s) => s.day_of_week === dayOfWeek)

      // Buscar registro de ponto para o dia
      const record = timeRecords.find((r) => r.date === dateStr)

      // Calcular horas esperadas
      let expectedHours = 0
      if (schedule && schedule.entry_time && schedule.exit_time) {
        const entryMinutes = timeToMinutes(schedule.entry_time)
        const exitMinutes = timeToMinutes(schedule.exit_time)
        let totalMinutes = exitMinutes - entryMinutes

        // Subtrair tempo de almoço se configurado
        if (schedule.lunch_start && schedule.lunch_end) {
          const lunchStartMinutes = timeToMinutes(schedule.lunch_start)
          const lunchEndMinutes = timeToMinutes(schedule.lunch_end)
          totalMinutes -= lunchEndMinutes - lunchStartMinutes
        }

        expectedHours = totalMinutes
      }

      // Calcular horas trabalhadas
      let workedHours = 0
      if (record && record.entry_time && record.exit_time) {
        const entryMinutes = timeToMinutes(record.entry_time)
        const exitMinutes = timeToMinutes(record.exit_time)
        let totalMinutes = exitMinutes - entryMinutes

        // Subtrair tempo de almoço se registrado
        if (record.lunch_start && record.lunch_end) {
          const lunchStartMinutes = timeToMinutes(record.lunch_start)
          const lunchEndMinutes = timeToMinutes(record.lunch_end)
          totalMinutes -= lunchEndMinutes - lunchStartMinutes
        }

        workedHours = Math.max(0, totalMinutes)
      }

      calculations.push({
        date: dateStr,
        dayOfWeek,
        schedule,
        record,
        expectedHours,
        workedHours,
        extraHours: record ? intervalToMinutes(record.extra_hours || "0") : 0,
        missingHours: record ? intervalToMinutes(record.missing_hours || "0") : expectedHours > 0 ? expectedHours : 0,
      })
    }

    setCalculations(calculations)
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const generatePDFReportHandler = async () => {
    if (!selectedEmployee || !company) return

    const employee = employees.find((e) => e.id === selectedEmployee)
    if (!employee) return

    // Determinar período
    const today = new Date()
    let startDate: Date
    let endDate: Date

    switch (reportPeriod) {
      case "daily":
        startDate = new Date(today)
        endDate = new Date(today)
        break
      case "weekly":
        startDate = new Date(today)
        startDate.setDate(today.getDate() - today.getDay())
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        break
      case "monthly":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      default:
        return
    }

    // Organizar horários por dia da semana
    const workScheduleByDay: { [key: number]: any } = {}
    workSchedules.forEach((schedule) => {
      workScheduleByDay[schedule.day_of_week] = schedule
    })

    const reportData = {
      company: {
        name: company.name,
        cnpj: company.cnpj,
      },
      employee: {
        name: employee.name,
        cpf: employee.cpf,
      },
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      workSchedule: workScheduleByDay,
      timeRecords: timeRecords,
    }

    try {
      await generatePDFReport(reportData)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      // Adicionar toast de erro se necessário
    }
  }

  const totalExpected = calculations.reduce((sum, calc) => sum + calc.expectedHours, 0)
  const totalWorked = calculations.reduce((sum, calc) => sum + calc.workedHours, 0)
  const totalExtra = calculations.reduce((sum, calc) => sum + calc.extraHours, 0)
  const totalMissing = calculations.reduce((sum, calc) => sum + calc.missingHours, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Relatórios Detalhados de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Funcionário</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select
                value={reportPeriod}
                onValueChange={(value: "daily" | "weekly" | "monthly") => setReportPeriod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={generatePDFReportHandler} disabled={!selectedEmployee || loading} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {selectedEmployee && calculations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{formatMinutesToHours(totalExpected)}</div>
                      <p className="text-sm text-muted-foreground">Deveria Trabalhar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{formatMinutesToHours(totalWorked)}</div>
                      <p className="text-sm text-muted-foreground">Horas Trabalhadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{formatMinutesToHours(totalExtra)}</div>
                      <p className="text-sm text-muted-foreground">Horas Extras</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">{formatMinutesToHours(totalMissing)}</div>
                      <p className="text-sm text-muted-foreground">Faltas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployee && calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Detalhamento por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando registros...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Deveria Trabalhar</TableHead>
                    <TableHead>Horas Trabalhadas</TableHead>
                    <TableHead>Horas Extras</TableHead>
                    <TableHead>Faltas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.map((calc) => (
                    <TableRow key={calc.date}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{new Date(calc.date).toLocaleDateString("pt-BR")}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(calc.date).toLocaleDateString("pt-BR", { weekday: "short" })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-600 font-medium">{formatMinutesToHours(calc.expectedHours)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600 font-medium">{formatMinutesToHours(calc.workedHours)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">{formatMinutesToHours(calc.extraHours)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">{formatMinutesToHours(calc.missingHours)}</span>
                      </TableCell>
                      <TableCell>
                        {calc.record ? (
                          calc.record.entry_time && calc.record.exit_time ? (
                            <span className="text-green-600 text-sm">Completo</span>
                          ) : (
                            <span className="text-yellow-600 text-sm">Parcial</span>
                          )
                        ) : calc.expectedHours > 0 ? (
                          <span className="text-red-600 text-sm">Ausente</span>
                        ) : (
                          <span className="text-gray-500 text-sm">Sem expediente</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
