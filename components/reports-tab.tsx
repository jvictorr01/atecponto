"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Download, FileText, CalendarIcon, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { formatMinutesToHours, intervalToMinutes } from "@/lib/time-calculations"
import { generatePDFReport } from "@/lib/pdf-generator"
import { Calendar } from "@/components/ui/calendar"
import { CaptionProps } from "react-day-picker"
import { ptBR } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface Employee { id: string; name: string; cpf: string }
interface TimeRecord { id: string; date: string; entry_time: string|null; lunch_start: string|null; lunch_end: string|null; exit_time: string|null; extra_hours: string; missing_hours: string; employee: { name: string; cpf: string } }
interface WorkSchedule { day_of_week: number; entry_time: string|null; lunch_start: string|null; lunch_end: string|null; exit_time: string|null }
interface DayCalculation { date: string; dayOfWeek: number; schedule: WorkSchedule|null; record: TimeRecord|null; expectedHours: number; workedHours: number; extraHours: number; missingHours: number }

interface CustomCaptionProps extends CaptionProps {
  onMonthChange?: (date: Date) => void;
  locale?: any;
}

function CustomCaption({ displayMonth, locale, onMonthChange }: CustomCaptionProps) {
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(displayMonth.getFullYear(), i).toLocaleString(locale ?? "pt-BR", { month: "long" })
  )
  return (
    <div className="flex justify-center items-center gap-4 mb-4">
      <select
        className="rounded-md border px-2 py-1 text-sm capitalize"
        value={displayMonth.getMonth()}
        onChange={e => onMonthChange?.(new Date(displayMonth.getFullYear(), +e.target.value))}
      >
        {months.map((m, i) => (
          <option key={i} value={i}>
            {m}
          </option>
        ))}
      </select>
      <select
        className="rounded-md border px-2 py-1 text-sm"
        value={displayMonth.getFullYear()}
        onChange={e => onMonthChange?.(new Date(+e.target.value, displayMonth.getMonth()))}
      >
        {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ReportsTab() {
  const [selectedRange, setSelectedRange] = useState<{ from?: Date; to?: Date }>({})
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([])
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([])
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [calculations, setCalculations] = useState<DayCalculation[]>([])
  const { user } = useAuth()
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => { loadEmployees(); loadCompany(); loadWorkSchedules() }, [user])
  useEffect(() => { if (selectedEmployee) loadTimeRecords() }, [selectedEmployee, selectedRange])
  useEffect(() => { if (timeRecords.length && workSchedules.length) calculateReport() }, [timeRecords, workSchedules])

  // Formata Date para 'YYYY-MM-DD'
  const formatISO = (d: Date) => format(d, "yyyy-MM-dd")

  async function loadCompany() {
    const { data } = await supabase.from("companies").select("*").eq("user_id", user?.id).single()
    setCompany(data)
  }

  async function loadEmployees() {
    const { data: c } = await supabase.from("companies").select("id").eq("user_id", user?.id).single()
    const { data: emps } = await supabase.from("employees").select("id,name,cpf").eq("company_id", c.id).order("name")
    setEmployees(emps || [])
  }

  async function loadWorkSchedules() {
    const { data: c } = await supabase.from("companies").select("id").eq("user_id", user?.id).single()
    const { data: sched } = await supabase.from("work_schedules").select("*").eq("company_id", c.id).order("day_of_week")
    setWorkSchedules(sched || [])
  }

  async function loadTimeRecords() {
    if (!selectedEmployee || !selectedRange.from || !selectedRange.to) return
    setLoading(true)
    const start = formatISO(selectedRange.from)
    const end = formatISO(selectedRange.to)
    const { data } = await supabase
      .from("time_records")
      .select("*,employee:employees(name,cpf)")
      .eq("employee_id", selectedEmployee)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false })
    setTimeRecords(data || [])
    setLoading(false)
  }

function calculateReport() {
  if (!selectedRange.from || !selectedRange.to) return;

  // Cria datas puramente em UTC (00:00 UTC do dia selecionado)
  const from = selectedRange.from;
  const to   = selectedRange.to;
  const start = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  const end   = new Date(Date.UTC(to.getFullYear(),   to.getMonth(),   to.getDate()));
  // tornamos 'end' exclusivo
  end.setUTCDate(end.getUTCDate() + 1);

  const days: DayCalculation[] = [];

  for (
    let d = new Date(start);
    d < end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    // monta 'YYYY-MM-DD' direto do ISO (sempre em UTC)
    const dateStr = d.toISOString().slice(0, 10);
    const dow     = d.getUTCDay();
    const sched   = workSchedules.find(s => s.day_of_week === dow) || null;
    const rec     = timeRecords.find(r => r.date === dateStr) || null;

    let exp  = 0;
    let work = 0;

    if (sched?.entry_time && sched.exit_time) {
      exp = intervalToMinutes(sched.exit_time) - intervalToMinutes(sched.entry_time);
      if (sched.lunch_start && sched.lunch_end) {
        exp -= intervalToMinutes(sched.lunch_end) - intervalToMinutes(sched.lunch_start);
      }
    }

    if (rec?.entry_time && rec.exit_time) {
      work = intervalToMinutes(rec.exit_time) - intervalToMinutes(rec.entry_time);
      if (rec.lunch_start && rec.lunch_end) {
        work -= intervalToMinutes(rec.lunch_end) - intervalToMinutes(rec.lunch_start);
      }
    }

    days.push({
      date:           dateStr,
      dayOfWeek:      dow,
      schedule:       sched,
      record:         rec,
      expectedHours:  exp,
      workedHours:    work,
      extraHours:     rec ? intervalToMinutes(rec.extra_hours || "0") : 0,
      missingHours:   rec ? intervalToMinutes(rec.missing_hours || "0") : (exp > 0 ? exp : 0),
    });
  }

  setCalculations(days);
}



  // força to = from quando clica duas vezes no mesmo dia
  function handleRangeSelect(range: { from?: Date; to?: Date }) {
    if (range.from && !range.to) {
      setSelectedRange({ from: range.from, to: range.from })
    } else {
      setSelectedRange(range)
    }
    // limpa tabela enquanto seleciona
    setTimeRecords([])
    setCalculations([])
  }

  async function generatePDFReportHandler() {
    if (!company || !selectedEmployee || !selectedRange.from || !selectedRange.to) return

    const emp = employees.find(e => e.id === selectedEmployee)!
    // organiza por dia da semana para passar ao PDF
    const workByDay: Record<number, WorkSchedule> = {}
    workSchedules.forEach(s => (workByDay[s.day_of_week] = s))

    const reportRecords = calculations.map(c => ({
      date:         c.date,
      entry_time:   c.record?.entry_time   ?? "",
      lunch_start:  c.record?.lunch_start  ?? "",
      lunch_end:    c.record?.lunch_end    ?? "",
      exit_time:    c.record?.exit_time    ?? "",
      extra_hours:   formatMinutesToHours(c.extraHours),
      missing_hours: formatMinutesToHours(c.missingHours),
    }))

    await generatePDFReport({
      company: { name: company.name, cnpj: company.cnpj },
      employee: { name: emp.name, cpf: emp.cpf },
      period: {
        startDate: formatISO(selectedRange.from),
        endDate: formatISO(selectedRange.to),
      },
      workSchedule: workByDay,
      timeRecords: reportRecords,
    })
  }

  // Totais
  const totalExpected = calculations.reduce((s, c) => s + c.expectedHours, 0)
  const totalWorked   = calculations.reduce((s, c) => s + c.workedHours, 0)
  const totalExtra    = calculations.reduce((s, c) => s + c.extraHours, 0)
  const totalMissing  = calculations.reduce((s, c) => s + c.missingHours, 0)

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Relatórios Detalhados de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Funcionário */}
            <div>
              <label className="text-sm font-medium">Funcionário</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Período */}
            <div>
              <label className="text-sm font-medium">Período</label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedRange.from && selectedRange.to
                        ? `${format(selectedRange.from, "dd/MM/yyyy")} → ${format(selectedRange.to, "dd/MM/yyyy")}`
                        : <span>Escolha o período</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="range"
                      selected={selectedRange}
                      onSelect={handleRangeSelect}
                      locale={ptBR}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      components={{
                        Caption: (props) => (
                          <CustomCaption
                            {...props}
                            onMonthChange={setCalendarMonth}
                            locale={ptBR}
                          />
                        )
                      }}
                      classNames={{
                        head_row: "grid grid-cols-7",
                        head_cell: "text-center text-muted-foreground text-xs font-semibold uppercase",
                        row: "grid grid-cols-7 w-full mb-1",
                        cell: "aspect-square w-full flex items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground",
                        day_selected: "bg-primary text-white hover:bg-primary/90",
                        day_today: "border border-primary",
                        day_outside: "text-muted-foreground opacity-50",
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {/* Botão de reset */}
                <Button variant="ghost" size="sm" onClick={() => setSelectedRange({})}>
                  Limpar
                </Button>
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={generatePDFReportHandler} disabled={!selectedEmployee || loading} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
          {/* Cards de totais */}
          {selectedEmployee && calculations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Clock, value: totalExpected, label: "Deveria Trabalhar", color: "blue-600" },
                { icon: Clock, value: totalWorked,   label: "Horas Trabalhadas", color: "gray-600" },
                { icon: TrendingUp, value: totalExtra, label: "Horas Extras", color: "green-600" },
                { icon: TrendingDown, value: totalMissing, label: "Faltas", color: "red-600" },
              ].map(({ icon: Icon, value, label, color }) => (
                <Card key={label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 text-${color}`} />
                      <div>
                        <div className={`text-2xl font-bold text-${color}`}>
                          {formatMinutesToHours(value)}
                        </div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Tabela detalhada */}
      {selectedEmployee && calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
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
                    <TableHead>Deveria</TableHead>
                    <TableHead>Trabalhadas</TableHead>
                    <TableHead>Extras</TableHead>
                    <TableHead>Faltas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.map(calc => (
                    <TableRow key={calc.date}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(calc.date + "T00:00:00").toLocaleDateString("pt-BR")}

                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(calc.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short" })}

                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatMinutesToHours(calc.expectedHours)}</TableCell>
                      <TableCell>{formatMinutesToHours(calc.workedHours)}</TableCell>
                      <TableCell className="text-green-600">{formatMinutesToHours(calc.extraHours)}</TableCell>
                      <TableCell className="text-red-600">{formatMinutesToHours(calc.missingHours)}</TableCell>
                      <TableCell>
                        {calc.record
                          ? calc.record.entry_time && calc.record.exit_time
                            ? <span className="text-green-600">Completo</span>
                            : <span className="text-yellow-600">Parcial</span>
                          : calc.expectedHours > 0
                            ? <span className="text-red-600">Ausente</span>
                            : <span className="text-gray-500">Sem expediente</span>}
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
