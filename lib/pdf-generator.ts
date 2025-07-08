import jsPDF from "jspdf"
import "jspdf-autotable"
import { formatCNPJ } from "./utils"

interface PDFReportData {
  company: {
    name: string
    cnpj: string
  }
  employee: {
    name: string
    cpf: string
  }
  period: {
    startDate: string
    endDate: string
  }
  workSchedule: {
    [key: number]: {
      entry_time: string | null
      lunch_start: string | null
      lunch_end: string | null
      exit_time: string | null
    }
  }
  timeRecords: Array<{
    date: string
    entry_time: string | null
    lunch_start: string | null
    lunch_end: string | null
    exit_time: string | null
    extra_hours: string
    missing_hours: string
  }>
}

const DAYS_OF_WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"]

// Função auxiliar para carregar imagem como base64
async function loadImageAsDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Não foi possível obter contexto do canvas"))
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const dataURL = canvas.toDataURL("image/jpeg", 0.8)
        resolve(dataURL)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error("Falha ao carregar imagem"))
    }

    img.src = url
  })
}

// Função fallback para quando o logo não carrega
function addLogoFallback(doc: jsPDF, pageWidth: number) {
  doc.setFontSize(8)
  doc.setFont("arial", "bold")
  doc.text("ATECPONTO", pageWidth - 35, 12)
  doc.setFontSize(6)
  doc.text("CONTROLE DE PONTO", pageWidth - 35, 17)
  doc.text("www.atecponto.com.br", pageWidth - 35, 21)
}

// Função principal agora é assíncrona
export async function generatePDFReport(data: PDFReportData): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Configurar fonte Arial como padrão
  doc.setFont("arial", "normal")

  // Header - Nome da empresa (lado esquerdo)
  doc.setFontSize(10)
  doc.setFont("arial", "bold")
  doc.text(data.company.name.toUpperCase(), 10, 15)

  // Tentar carregar e adicionar logo
  try {
    const logoUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-07-07%20at%2016.11.28-uzCp5iQs896Njst0Mm5WAhchpTgh7G.jpeg"
    const logoBase64 = await loadImageAsDataURL(logoUrl)
    doc.addImage(logoBase64, "JPEG", pageWidth - 45, 5, 35, 35)
  } catch (error) {
    console.log("Erro ao carregar logo, usando fallback:", error)
    addLogoFallback(doc, pageWidth)
  }

  // CNPJ
  doc.setFontSize(11)
  doc.setFont("arial", "bold")
  doc.text(formatCNPJ(data.company.cnpj), 10, 30)

  // Período
  const startDate = new Date(data.period.startDate).toLocaleDateString("pt-BR")
  const endDate = new Date(data.period.endDate).toLocaleDateString("pt-BR")
  doc.setFontSize(9)
  doc.setFont("arial", "normal")
  doc.text(`Período: de ${startDate} a ${endDate}`, 10, 37)

  // Nome do funcionário
  doc.setFontSize(9)
  doc.text(`Nome: ${data.employee.name}`, 10, 44)

  // Turno de trabalho
  doc.setFontSize(9)
  doc.setFont("arial", "bold")
  doc.text("Turno de trabalho", 10, 55)

  // Tabela de horários da semana (com margem direita)
  let currentY = 60

  // Headers da tabela de horários (larguras balanceadas com margem)
  doc.setFontSize(7)
  doc.setFont("arial", "bold")
  const colWidths = [18, 18, 18, 18, 18] // Total: 90mm, deixando margem direita
  let currentX = 10

  const scheduleHeaders = ["Dia", "Entrada", "Almoço Início", "Almoço Fim", "Saída"]
  scheduleHeaders.forEach((header, index) => {
    doc.rect(currentX, currentY, colWidths[index], 5)
    doc.text(header, currentX + colWidths[index] / 2, currentY + 3.5, { align: "center" })
    currentX += colWidths[index]
  })

  currentY += 5

  // Dados da tabela de horários
  doc.setFont("arial", "normal")
  DAYS_OF_WEEK.forEach((day, index) => {
    const schedule = data.workSchedule[index]
    const rowData = [
      day,
      schedule?.entry_time || "--:--",
      schedule?.lunch_start || "--:--",
      schedule?.lunch_end || "--:--",
      schedule?.exit_time || "--:--",
    ]

    currentX = 10
    rowData.forEach((cell, cellIndex) => {
      doc.rect(currentX, currentY, colWidths[cellIndex], 5)
      doc.text(cell, currentX + colWidths[cellIndex] / 2, currentY + 3.5, { align: "center" })
      currentX += colWidths[cellIndex]
    })
    currentY += 5
  })

  currentY += 8

  // Cabeçalho da tabela principal (ajustado para não grudar na borda direita)
  doc.setFontSize(6)
  doc.setFont("arial", "bold")

  // Larguras ajustadas para deixar margem direita (total ~170mm, deixando 20mm de margem)
  const mainColWidths = [22, 14, 14, 14, 14, 14, 14, 16, 16, 16, 36]

  // Primeira linha de headers
  currentX = 10
  const mainHeaders = ["", "Faixa 1", "", "Faixa 2", "", "Extra", "", "Total", "Total", "Total", "Observações"]

  mainHeaders.forEach((header, index) => {
    if (header && (index === 0 || index === 7 || index === 8 || index === 9 || index === 10)) {
      doc.rect(currentX, currentY, mainColWidths[index], 4)
      doc.text(header, currentX + mainColWidths[index] / 2, currentY + 2.5, { align: "center" })
    } else if (header === "Faixa 1") {
      doc.rect(currentX, currentY, mainColWidths[index] + mainColWidths[index + 1], 4)
      doc.text(header, currentX + (mainColWidths[index] + mainColWidths[index + 1]) / 2, currentY + 2.5, {
        align: "center",
      })
    } else if (header === "Faixa 2") {
      doc.rect(currentX, currentY, mainColWidths[index] + mainColWidths[index + 1], 4)
      doc.text(header, currentX + (mainColWidths[index] + mainColWidths[index + 1]) / 2, currentY + 2.5, {
        align: "center",
      })
    } else if (header === "Extra") {
      doc.rect(currentX, currentY, mainColWidths[index] + mainColWidths[index + 1], 4)
      doc.text(header, currentX + (mainColWidths[index] + mainColWidths[index + 1]) / 2, currentY + 2.5, {
        align: "center",
      })
    }
    currentX += mainColWidths[index]
  })

  currentY += 4

  // Segunda linha de headers
  currentX = 10
  const subHeaders = [
    "Data",
    "Entrada",
    "Saída",
    "Entrada",
    "Saída",
    "Entrada",
    "Saída",
    "Normal",
    "Extra",
    "Falta",
    "Observações",
  ]

  subHeaders.forEach((header, index) => {
    doc.rect(currentX, currentY, mainColWidths[index], 4)
    doc.text(header, currentX + mainColWidths[index] / 2, currentY + 2.5, { align: "center" })
    currentX += mainColWidths[index]
  })

  currentY += 4

  // Dados dos registros de ponto
  doc.setFont("arial", "normal")
  doc.setFontSize(6)

  // Gerar dados para todos os dias do mês
  const startDate2 = new Date(data.period.startDate)
  const endDate2 = new Date(data.period.endDate)
  const currentDate = new Date(startDate2)

  let totalNormal = 0
  let totalExtra = 0
  let totalFalta = 0
  let totalFaltas = 0

  while (currentDate <= endDate2 && currentY < pageHeight - 50) {
    const dateStr = currentDate.toISOString().split("T")[0]
    const dayOfWeek = currentDate.getDay()
    const dayName = DAYS_OF_WEEK[dayOfWeek]
    const dayNumber = currentDate.getDate().toString().padStart(2, "0")
    const monthNumber = (currentDate.getMonth() + 1).toString().padStart(2, "0")

    // Buscar registro do dia
    const record = data.timeRecords.find((r) => r.date === dateStr)
    const schedule = data.workSchedule[dayOfWeek]

    // Calcular horas
    let normalHours = "00:00"
    let extraHours = "00:00"
    let faltaHours = "00:00"

    if (schedule && schedule.entry_time && schedule.exit_time) {
      if (record && record.entry_time && record.exit_time) {
        // Calcular horas trabalhadas
        const entryMinutes = timeToMinutes(record.entry_time)
        const exitMinutes = timeToMinutes(record.exit_time)
        let workedMinutes = exitMinutes - entryMinutes

        // Subtrair almoço se houver
        if (record.lunch_start && record.lunch_end) {
          const lunchStart = timeToMinutes(record.lunch_start)
          const lunchEnd = timeToMinutes(record.lunch_end)
          workedMinutes -= lunchEnd - lunchStart
        }

        // Calcular horas esperadas
        const expectedEntry = timeToMinutes(schedule.entry_time)
        const expectedExit = timeToMinutes(schedule.exit_time)
        let expectedMinutes = expectedExit - expectedEntry

        if (schedule.lunch_start && schedule.lunch_end) {
          const expectedLunchStart = timeToMinutes(schedule.lunch_start)
          const expectedLunchEnd = timeToMinutes(schedule.lunch_end)
          expectedMinutes -= expectedLunchEnd - expectedLunchStart
        }

        if (workedMinutes >= expectedMinutes) {
          normalHours = minutesToTime(Math.min(workedMinutes, expectedMinutes))
          if (workedMinutes > expectedMinutes) {
            extraHours = minutesToTime(workedMinutes - expectedMinutes)
            totalExtra += workedMinutes - expectedMinutes
          }
          totalNormal += Math.min(workedMinutes, expectedMinutes)
        } else {
          normalHours = minutesToTime(workedMinutes)
          faltaHours = minutesToTime(expectedMinutes - workedMinutes)
          totalNormal += workedMinutes
          totalFalta += expectedMinutes - workedMinutes
        }
      } else {
        // Não registrou ponto - falta total
        const expectedEntry = timeToMinutes(schedule.entry_time)
        const expectedExit = timeToMinutes(schedule.exit_time)
        let expectedMinutes = expectedExit - expectedEntry

        if (schedule.lunch_start && schedule.lunch_end) {
          const expectedLunchStart = timeToMinutes(schedule.lunch_start)
          const expectedLunchEnd = timeToMinutes(schedule.lunch_end)
          expectedMinutes -= expectedLunchEnd - expectedLunchStart
        }

        faltaHours = minutesToTime(expectedMinutes)
        totalFalta += expectedMinutes
        totalFaltas++
      }
    }

    // Linha da tabela
    const rowData = [
      `${dayNumber}/${monthNumber} ${dayName}`,
      record?.entry_time || "00:00",
      record?.lunch_start || "00:00",
      record?.lunch_end || "00:00",
      record?.exit_time || "00:00",
      "00:00", // Extra entrada
      "00:00", // Extra saída
      normalHours,
      extraHours,
      faltaHours,
      "", // Observações
    ]

    currentX = 10
    rowData.forEach((cell, index) => {
      doc.rect(currentX, currentY, mainColWidths[index], 4)
      doc.text(cell, currentX + mainColWidths[index] / 2, currentY + 2.5, { align: "center" })
      currentX += mainColWidths[index]
    })

    currentY += 4
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Linha de totais
  currentY += 1
  doc.setFont("arial", "bold")

  const totalsData = [
    "Totais",
    "",
    "",
    "",
    "",
    "",
    "",
    minutesToTime(totalNormal),
    minutesToTime(totalExtra),
    minutesToTime(totalFalta),
    `Faltas: ${totalFaltas}`,
  ]

  currentX = 10
  totalsData.forEach((cell, index) => {
    doc.rect(currentX, currentY, mainColWidths[index], 4)
    doc.text(cell, currentX + mainColWidths[index] / 2, currentY + 2.5, { align: "center" })
    currentX += mainColWidths[index]
  })

  // Footer - Textos centralizados e em negrito
  const footerY = pageHeight - 35
  doc.setFontSize(8)
  doc.setFont("arial", "bold")

  // Centralizar os textos do rodapé
  doc.text(
    "Este documento é apenas um demonstrativo baseado em informações incluídas pelo usuário",
    pageWidth / 2,
    footerY + 5,
    { align: "center" },
  )
  doc.text("cadastrado de forma manual. Não tem validade jurídica.", pageWidth / 2, footerY + 10, { align: "center" })
  doc.text(
    "Para um plano profissional de tratamento de ponto com aplicativos www.atecponto.com.br",
    pageWidth / 2,
    footerY + 15,
    { align: "center" },
  )

  // Salvar PDF (agora após aguardar o logo)
  const fileName = `relatorio-ponto-${data.employee.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`
  doc.save(fileName)
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}
