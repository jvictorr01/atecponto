"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface CreateCompanyFormProps {
  onCompanyCreated: () => void
}

export function CreateCompanyForm({ onCompanyCreated }: CreateCompanyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
  })
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const { user, profile } = useAuth()
  const { toast } = useToast()

  // Carregar CNPJ do profile quando o componente montar
  useEffect(() => {
    if (profile?.cnpj) {
      setFormData((prev) => ({
        ...prev,
        cnpj: formatCNPJ(profile.cnpj),
      }))
    }
    setLoadingProfile(false)
  }, [profile])

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!user) return

  setLoading(true)

  try {
    const cnpjNumbers = formData.cnpj.replace(/\D/g, "")

    // Atualizar o profile com o CNPJ preenchido
    await supabase.from("profiles").update({ cnpj: cnpjNumbers }).eq("id", user.id)

    // Verificar se já existe empresa com este CNPJ
    const { data: existingCompany } = await supabase.from("companies").select("id").eq("cnpj", cnpjNumbers).maybeSingle()

    if (existingCompany) {
      throw new Error("CNPJ já cadastrado")
    }

    const { error } = await supabase.from("companies").insert({
      user_id: user.id,
      name: formData.name,
      cnpj: cnpjNumbers,
    })

    if (error) throw error

    toast({
      title: "Empresa criada com sucesso!",
      description: "Agora você pode começar a gerenciar seus funcionários",
    })

    onCompanyCreated()
  } catch (error: any) {
    let errorMessage = "Tente novamente"

    if (error.message.includes("CNPJ já cadastrado") || error.message.includes("duplicate key")) {
      errorMessage = "CNPJ já cadastrado na plataforma"
    }

    toast({
      title: "Erro ao criar empresa",
      description: errorMessage,
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}


  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  }

  if (loadingProfile) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#09893E] mx-auto mb-4"></div>
            Carregando dados...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img
            src="https://i.imgur.com/VnLUASy.jpeg"
            alt="Atec Ponto"
            className="h-32 w-auto"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Criar Empresa</CardTitle>
        <CardDescription>Complete seu cadastro criando sua empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input
              id="name"
              placeholder="Nome da sua empresa"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cnpj: formatCNPJ(e.target.value),
                }))
              }
              maxLength={18}
              required
            />
            <p className="text-xs text-gray-500">CNPJ cadastrado no registro da sua conta. Não é possível alterar.</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando empresa..." : "Criar Empresa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
