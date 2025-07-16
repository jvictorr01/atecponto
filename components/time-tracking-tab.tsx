"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Clock, Save } from "lucide-react"

interface WorkSchedule {
  id?: string
  day_of_week: number
  entry_time: string
  lunch_start: string
  lunch_end: string
  exit_time: string
}

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

export function TimeTrackingTab() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadSchedules()
  }, [user])

  const loadSchedules = async () => {
    if (!user) return

    try {
      // Buscar empresa
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", user.id).single()

      if (company) {
        const { data: schedulesData } = await supabase
          .from("work_schedules")
          .select("*")
          .eq("company_id", company.id)
          .order("day_of_week")

        // Criar array com todos os dias da semana
        const allSchedules: WorkSchedule[] = []
        for (let i = 0; i < 7; i++) {
          const existingSchedule = schedulesData?.find((s) => s.day_of_week === i)
          allSchedules.push({
            id: existingSchedule?.id,
            day_of_week: i,
            entry_time: existingSchedule?.entry_time || "",
            lunch_start: existingSchedule?.lunch_start || "",
            lunch_end: existingSchedule?.lunch_end || "",
            exit_time: existingSchedule?.exit_time || "",
          })
        }

        setSchedules(allSchedules)
      }
    } catch (error) {
      console.error("Erro ao carregar horários:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleChange = (dayIndex: number, field: keyof WorkSchedule, value: string) => {
    setSchedules((prev) =>
      prev.map((schedule) => (schedule.day_of_week === dayIndex ? { ...schedule, [field]: value } : schedule)),
    )
  }

  const saveSchedule = async (dayIndex: number) => {
    if (!user) return

    setSaving(true)

    try {
      // Buscar empresa
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", user.id).single()

      if (!company) return

      const schedule = schedules[dayIndex]

      if (schedule.id) {
        // Atualizar horário existente
        const { error } = await supabase
          .from("work_schedules")
          .update({
            entry_time: schedule.entry_time || null,
            lunch_start: schedule.lunch_start || null,
            lunch_end: schedule.lunch_end || null,
            exit_time: schedule.exit_time || null,
          })
          .eq("id", schedule.id)

        if (error) throw error
      } else {
        // Criar novo horário
        const { data, error } = await supabase
          .from("work_schedules")
          .insert({
            company_id: company.id,
            day_of_week: dayIndex,
            entry_time: schedule.entry_time || null,
            lunch_start: schedule.lunch_start || null,
            lunch_end: schedule.lunch_end || null,
            exit_time: schedule.exit_time || null,
          })
          .select()
          .single()

        if (error) throw error

        // Atualizar o ID no estado
        setSchedules((prev) => prev.map((s) => (s.day_of_week === dayIndex ? { ...s, id: data.id } : s)))
      }

      toast({
        title: "Horário salvo",
        description: `Horário de ${DAYS_OF_WEEK[dayIndex].toLowerCase()} salvo com sucesso`,
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar horário",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando horários...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Configuração de Carga Horária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            Configure os horários de trabalho para cada dia da semana. Deixe em branco os campos dos dias que não há
            expediente.
          </p>

          <div className="space-y-6">
            {schedules.map((schedule, index) => (
              <Card key={index} className="border-l-4 border-l-[#09893E]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{DAYS_OF_WEEK[index]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`entry-${index}`}>Entrada</Label>
                      <Input
                        id={`entry-${index}`}
                        type="time"
                        value={schedule.entry_time}
                        onChange={(e) => handleScheduleChange(index, "entry_time", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`lunch-start-${index}`}>Início Almoço</Label>
                      <Input
                        id={`lunch-start-${index}`}
                        type="time"
                        value={schedule.lunch_start}
                        onChange={(e) => handleScheduleChange(index, "lunch_start", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`lunch-end-${index}`}>Fim Almoço</Label>
                      <Input
                        id={`lunch-end-${index}`}
                        type="time"
                        value={schedule.lunch_end}
                        onChange={(e) => handleScheduleChange(index, "lunch_end", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`exit-${index}`}>Saída</Label>
                      <Input
                        id={`exit-${index}`}
                        type="time"
                        value={schedule.exit_time}
                        onChange={(e) => handleScheduleChange(index, "exit_time", e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={() => saveSchedule(index)} disabled={saving} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar {DAYS_OF_WEEK[index]}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Mensagem adicional */}
                  <div className="text-center text-sm text-muted-foreground mt-6">
                    Para cadastrar mais cargas horarias, faça um upgrade em{" "}
                    <a
                      href="https://www.atecponto.com.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      www.atecponto.com.br
                    </a>
                  </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona o cálculo de horas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p>
                <strong>Horas Extras:</strong> Quando o funcionário registra ponto antes do horário definido
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <p>
                <strong>Faltas:</strong> Quando o funcionário registra ponto depois do horário definido
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p>
                <strong>Falta Total:</strong> Quando o funcionário não registra ponto
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
              <p>
                <strong>Dias sem configuração:</strong> Não são contabilizados no cálculo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
