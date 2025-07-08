"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Mail, Phone } from "lucide-react"

interface BlockedCompanyMessageProps {
  reason?: string
  onBackToLogin: () => void
}

export function BlockedCompanyMessage({ reason, onBackToLogin }: BlockedCompanyMessageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-600 rounded-full">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">Conta Suspensa</CardTitle>
          <CardDescription className="text-red-700">
            Sua conta foi temporariamente suspensa pelo administrador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Motivo da suspensão:</h4>
              <p className="text-sm text-red-800">{reason}</p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Para reativar sua conta:</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>Entre em contato via email: suporte@atecponto.com.br</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>Ou ligue para: (43) 99999-9999 </span>
              </div>
            </div>
          </div>

          <Button onClick={onBackToLogin} variant="outline" className="w-full mt-6 bg-transparent">
            Voltar ao Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
