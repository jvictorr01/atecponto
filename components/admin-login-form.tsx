"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useToast } from "@/hooks/use-toast"
import { Lock } from "lucide-react"

export function AdminLoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAdminAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await login(username, password)

    if (error) {
      toast({
        title: "Erro ao fazer login",
        description: error,
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-atec-png_1-CliCtKZll3t1sbKhd3btg5wYSmHDM7.png"
              alt="ATEC Softwares"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Backoffice Admin</CardTitle>
          <CardDescription>Acesso restrito para administradores do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#09893E] hover:bg-[#07722E]" disabled={loading}>
              <Lock className="h-4 w-4 mr-2" />
              {loading ? "Entrando..." : "Entrar no Backoffice"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Sistema de administração do Ponto Digital
              <br />
              Acesso apenas para administradores autorizados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
