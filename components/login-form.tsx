"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface LoginFormProps {
  onToggle: () => void
}

export function LoginForm({ onToggle }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await login(email, password)

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
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-atec-png_1-AAeR15EfXiAGtFSGwsY99zuEfdCz4e.png"
            alt="ATEC Softwares"
            className="h-16 w-auto"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Ponto Digital</CardTitle>
        <CardDescription>Faça login para acessar o sistema de controle de ponto</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{" "}
            <button onClick={onToggle} className="text-[#09893E] hover:underline font-medium">
              Cadastre-se
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
