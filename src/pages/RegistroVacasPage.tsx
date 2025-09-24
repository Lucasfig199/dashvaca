import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Milk, Plus, Edit, Trash2, Grid, List, Upload, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import FarmDashboard from "@/components/FarmDashboard";
import { useToast } from "@/hooks/use-toast";
import { registrarVacaNoHistorico } from "@/lib/historicoUtils";

// Configuração Supabase
const SUPABASE_URL = 'https://bdtiipdmmgwuqjuhektq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdGlpcGRtbWd3dXFqdWhla3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ3NTksImV4cCI6MjA2Mzg2MDc1OX0.Z_W2sdcx49B2hr6u6PZRcyJXZJAtXNVg3yyRssiTwFg';
const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

interface VacaDB {
  id: number;
  "NOME-VACA": string;
  "BRINCO-VACA": string;
  "STATUS-VACA": string;
  "RACA-VACA": string;
  "DATA-NSC-VACA": string;
  "DATA-ENTRADA-VACA": string;
  "OBS-VACA": string;
  "FOTO-VACA": string;
  CLASSE: string;
  "HORA-GERAL": string;
}

interface Vaca {
  id: number;
  nome: string;
  brinco: string;
  status: string;
  raca: string;
  dataNascimento: string;
  dataEntrada: string;
  observacoes: string;
  foto: string;
}

// Utility functions
const nowHHMM = () => new Intl.DateTimeFormat('pt-BR', { 
  hour: '2-digit', 
  minute: '2-digit', 
  hour12: false 
}).format(new Date());

export default function RegistroVacasPage() {
  const { toast } = useToast();
  const [vacas, setVacas] = useState<Vaca[]>([]);
  const [selectedVaca, setSelectedVaca] = useState<number | null>(null);
  const [isNovaVacaOpen, setIsNovaVacaOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    nome: "",
    brinco: "",
    status: "Ativa",
    raca: "Holandesa",
    dataNascimento: "",
    dataEntrada: "",
    observacoes: "",
    foto: ""
  });

  // Carregar vacas do Supabase
  const carregarVacas = async () => {
    try {
      const selectCols = encodeURIComponent('id,"NOME-VACA","BRINCO-VACA","STATUS-VACA","RACA-VACA","DATA-NSC-VACA","DATA-ENTRADA-VACA","OBS-VACA","FOTO-VACA",CLASSE');
      const url = `${SUPABASE_URL}/rest/v1/VACAS?select=${selectCols}&CLASSE=eq.VACAS-REG`;
      const res = await fetch(url, { headers: HEADERS });
      
      if (!res.ok) {
        setVacas([]);
        return;
      }
      
      const rows: VacaDB[] = await res.json();
      const vacasFormatadas: Vaca[] = rows.map(vaca => ({
        id: vaca.id,
        nome: vaca["NOME-VACA"] || "",
        brinco: vaca["BRINCO-VACA"] || "",
        status: vaca["STATUS-VACA"] || "Ativa",
        raca: vaca["RACA-VACA"] || "",
        dataNascimento: vaca["DATA-NSC-VACA"] || "",
        dataEntrada: vaca["DATA-ENTRADA-VACA"] || "",
        observacoes: vaca["OBS-VACA"] || "",
        foto: vaca["FOTO-VACA"] || ""
      }));
      
      setVacas(vacasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar vacas:', error);
      setVacas([]);
    }
  };

  useEffect(() => {
    carregarVacas();
  }, []);

  // Detectar scroll para sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (actionBarRef.current) {
        const rect = actionBarRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getIdade = (dataNascimento: string) => {
    if (!dataNascimento) return "—";
    const birth = new Date(dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  };

  const stats = {
    total: vacas.length,
    ativas: vacas.filter(v => v.status === "Ativa").length,
    secas: vacas.filter(v => v.status === "Seca").length,
    prenhes: vacas.filter(v => v.status === "Prenhe").length
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Ativa": return "default";
      case "Prenhe": return "secondary";
      case "Seca": return "outline";
      default: return "destructive";
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      setUploadingPhoto(true);
      
      // Converter imagem para base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.onerror = () => {
          reject(new Error('Erro ao ler arquivo'));
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({ title: "Erro", description: "Falha no upload da foto.", variant: "destructive" });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Por favor, selecione apenas imagens.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    const photoUrl = await uploadPhoto(file);
    if (photoUrl) {
      setFormData({ ...formData, foto: photoUrl });
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast({ title: "Erro", description: "Informe o nome da vaca.", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        "NOME-VACA": formData.nome,
        "BRINCO-VACA": formData.brinco,
        "STATUS-VACA": formData.status,
        "RACA-VACA": formData.raca,
        "DATA-NSC-VACA": formData.dataNascimento || null,
        "DATA-ENTRADA-VACA": formData.dataEntrada || null,
        "OBS-VACA": formData.observacoes || null,
        "FOTO-VACA": formData.foto || null,
        CLASSE: "VACAS-REG",
        "HORA-GERAL": nowHHMM()
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/VACAS`, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar vaca');
      }

      setFormData({
        nome: "",
        brinco: "",
        status: "Ativa",
        raca: "Holandesa",
        dataNascimento: "",
        dataEntrada: "",
        observacoes: "",
        foto: ""
      });
      
      setIsNovaVacaOpen(false);
      await carregarVacas();
      toast({ title: "Sucesso", description: "Vaca registrada com sucesso!" });
      
      // Registrar no histórico
      await registrarVacaNoHistorico({
        data: new Date().toISOString().slice(0, 10),
        nomeVaca: formData.nome,
        acao: 'cadastro',
        observacoes: formData.observacoes
      });
    } catch (error) {
      console.error('Erro ao salvar vaca:', error);
      toast({ title: "Erro", description: "Falha ao registrar vaca.", variant: "destructive" });
    }
  };

  const handleEdit = () => {
    const vaca = vacas.find(v => v.id === selectedVaca);
    if (!vaca) return;
    
    setFormData({
      nome: vaca.nome,
      brinco: vaca.brinco,
      status: vaca.status,
      raca: vaca.raca,
      dataNascimento: vaca.dataNascimento,
      dataEntrada: vaca.dataEntrada,
      observacoes: vaca.observacoes,
      foto: vaca.foto
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedVaca) return;
    
    try {
      const payload = {
        "NOME-VACA": formData.nome,
        "BRINCO-VACA": formData.brinco,
        "STATUS-VACA": formData.status,
        "RACA-VACA": formData.raca,
        "DATA-NSC-VACA": formData.dataNascimento || null,
        "DATA-ENTRADA-VACA": formData.dataEntrada || null,
        "OBS-VACA": formData.observacoes || null,
        "FOTO-VACA": formData.foto || null
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/VACAS?id=eq.${selectedVaca}`, {
        method: 'PATCH',
        headers: { ...HEADERS, Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar vaca');
      }

      setIsEditOpen(false);
      setSelectedVaca(null);
      await carregarVacas();
      toast({ title: "Sucesso", description: "Vaca atualizada com sucesso!" });
      
      // Registrar no histórico
      await registrarVacaNoHistorico({
        data: new Date().toISOString().slice(0, 10),
        nomeVaca: formData.nome,
        acao: 'edicao',
        observacoes: formData.observacoes
      });
    } catch (error) {
      console.error('Erro ao atualizar vaca:', error);
      toast({ title: "Erro", description: "Falha ao atualizar vaca.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedVaca) return;
    if (!confirm("Tem certeza que deseja excluir esta vaca?")) return;
    
    const vaca = vacas.find(v => v.id === selectedVaca);
    const nomeVaca = vaca?.nome || 'Vaca sem nome';
    
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/VACAS?id=eq.${selectedVaca}`, {
        method: 'DELETE',
        headers: HEADERS
      });

      if (!res.ok) {
        throw new Error('Falha ao excluir vaca');
      }

      setSelectedVaca(null);
      await carregarVacas();
      toast({ title: "Sucesso", description: "Vaca excluída com sucesso!" });
      
      // Registrar no histórico
      await registrarVacaNoHistorico({
        data: new Date().toISOString().slice(0, 10),
        nomeVaca: nomeVaca,
        acao: 'exclusao'
      });
    } catch (error) {
      console.error('Erro ao excluir vaca:', error);
      toast({ title: "Erro", description: "Falha ao excluir vaca.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-vacas-bg">
      <FarmDashboard title="Registro de Vacas">
        <div className="space-y-6">
          {/* Header com actions - Mobile Optimized */}
          <div 
            ref={actionBarRef}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-vacas/30 backdrop-blur-sm border border-vacas-border rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg gap-3 sm:gap-0"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-vacas flex items-center justify-center shadow-lg">
                <Milk className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Gestão do Rebanho</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Controle completo das vacas</p>
              </div>
            </div>
          
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg bg-background">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2 rounded-r-none"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="gap-2 rounded-l-none"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
            </div>

            {selectedVaca && (
              <>
                <Button variant="outline" onClick={handleEdit} className="gap-2 flex-1 sm:flex-none">
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button variant="destructive" onClick={handleDelete} className="gap-2 flex-1 sm:flex-none">
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Excluir</span>
                </Button>
              </>
            )}
            
            <Dialog open={isNovaVacaOpen} onOpenChange={setIsNovaVacaOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-vacas hover:bg-gradient-vacas-hover gap-2 shadow-lg text-foreground border border-vacas-border flex-1 sm:flex-none text-sm">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nova Vaca</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              
              {/* Sticky Action Bar */}
              {isSticky && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-lg">
                  <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3">
                    <div className="flex gap-2 sm:gap-3 justify-end flex-wrap">
                      {/* View Mode Toggle */}
                      <div className="flex border rounded-lg bg-background">
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="gap-2 rounded-r-none"
                        >
                          <List className="w-4 h-4" />
                          <span className="hidden sm:inline">Lista</span>
                        </Button>
                        <Button
                          variant={viewMode === 'cards' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('cards')}
                          className="gap-2 rounded-l-none"
                        >
                          <Grid className="w-4 h-4" />
                          <span className="hidden sm:inline">Cards</span>
                        </Button>
                      </div>

                      {selectedVaca && (
                        <>
                          <Button variant="outline" onClick={handleEdit} className="gap-2">
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button variant="destructive" onClick={handleDelete} className="gap-2">
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Excluir</span>
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        onClick={() => setIsNovaVacaOpen(true)}
                        className="bg-gradient-vacas hover:bg-gradient-vacas-hover gap-2 shadow-lg text-foreground border border-vacas-border text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nova Vaca</span>
                        <span className="sm:hidden">Novo</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-lg">Registrar Vaca</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 px-1">
                  {/* Upload de Foto */}
                  <div>
                    <Label className="text-sm">Foto da Vaca</Label>
                    <div className="mt-1">
                      {formData.foto ? (
                        <div className="relative w-full h-24 bg-muted rounded-lg overflow-hidden">
                          <img
                            src={formData.foto} 
                            alt="Foto da vaca" 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => setFormData({...formData, foto: ""})}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                          <div className="flex flex-col items-center justify-center py-2">
                            <Camera className="w-6 h-6 mb-1 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground text-center px-2">
                              {uploadingPhoto ? "Enviando..." : "Clique para adicionar foto"}
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            disabled={uploadingPhoto}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nome" className="text-sm">Nome</Label>
                    <Input
                      id="nome"
                      placeholder="Ex.: Amora"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brinco" className="text-sm">Brinco</Label>
                    <Input
                      id="brinco"
                      placeholder="Ex.: 066"
                      value={formData.brinco}
                      onChange={(e) => setFormData({...formData, brinco: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativa">Ativa</SelectItem>
                          <SelectItem value="Seca">Seca</SelectItem>
                          <SelectItem value="Prenhe">Prenhe</SelectItem>
                          <SelectItem value="Vendida">Vendida</SelectItem>
                          <SelectItem value="Morta">Morta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Raça</Label>
                      <Select value={formData.raca} onValueChange={(value) => setFormData({...formData, raca: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Holandesa">Holandesa</SelectItem>
                          <SelectItem value="Jersey">Jersey</SelectItem>
                          <SelectItem value="Girolando">Girolando</SelectItem>
                          <SelectItem value="Pardo Suíço">Pardo Suíço</SelectItem>
                          <SelectItem value="Gir">Gir</SelectItem>
                          <SelectItem value="Nelore">Nelore</SelectItem>
                          <SelectItem value="Outras">Outras</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="nascimento" className="text-sm">Data Nascimento</Label>
                      <Input
                        id="nascimento"
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="entrada" className="text-sm">Data Entrada</Label>
                      <Input
                        id="entrada"
                        type="date"
                        value={formData.dataEntrada}
                        onChange={(e) => setFormData({...formData, dataEntrada: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="observacoes" className="text-sm">Observações</Label>
                    <Textarea
                      id="observacoes"
                      rows={2}
                      placeholder="Observações opcionais..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button variant="outline" onClick={() => setIsNovaVacaOpen(false)} className="flex-1 text-sm">
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1 bg-gradient-vacas hover:bg-gradient-vacas-hover text-foreground border border-vacas-border text-sm">
                      Registrar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-vacas/20 border-vacas-border shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-vacas rounded-lg flex items-center justify-center shadow-md">
                <Milk className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card border-0 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Ativas
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.ativas}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card border-0 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Secas
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.secas}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card border-0 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Prenhes
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.prenhes}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Vacas */}
        <Card className="bg-gradient-card border-0 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Lista de Vacas</h3>
          </div>
          
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 w-12"></th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Foto</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome / Brinco</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Raça</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Idade</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data Entrada</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {vacas.map((vaca) => (
                    <tr 
                      key={vaca.id} 
                      className={cn(
                        "border-b border-border hover:bg-muted/20 transition-colors",
                        selectedVaca === vaca.id && "bg-primary/10"
                      )}
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedVaca === vaca.id}
                          onCheckedChange={(checked) => {
                            setSelectedVaca(checked ? vaca.id : null);
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          {vaca.foto ? (
                            <img 
                              src={vaca.foto} 
                              alt={`Foto da ${vaca.nome}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Camera className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{vaca.nome}</p>
                          <p className="text-sm text-muted-foreground">{vaca.brinco}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(vaca.status)}>
                          {vaca.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-foreground">{vaca.raca}</td>
                      <td className="p-4 text-sm text-foreground">{getIdade(vaca.dataNascimento)}</td>
                      <td className="p-4 text-sm text-foreground">{vaca.dataEntrada || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                        {vaca.observacoes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {vacas.map((vaca) => (
                  <Card 
                    key={vaca.id} 
                    className={cn(
                      "overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                      selectedVaca === vaca.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedVaca(selectedVaca === vaca.id ? null : vaca.id)}
                  >
                    {/* Foto no topo */}
                    <div className="h-32 bg-muted relative">
                      {vaca.foto ? (
                        <img 
                          src={vaca.foto} 
                          alt={`Foto da ${vaca.nome}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-vacas/20">
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={selectedVaca === vaca.id}
                          onCheckedChange={(checked) => {
                            setSelectedVaca(checked ? vaca.id : null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    {/* Informações */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">{vaca.nome}</h4>
                        <p className="text-sm text-muted-foreground">Brinco: {vaca.brinco}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusBadgeVariant(vaca.status)}>
                          {vaca.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{vaca.raca}</span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Idade: {getIdade(vaca.dataNascimento)} anos</p>
                        <p>Entrada: {vaca.dataEntrada || "—"}</p>
                      </div>
                      
                      {vaca.observacoes && (
                        <p className="text-sm text-muted-foreground truncate">
                          {vaca.observacoes}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              
              {vacas.length === 0 && (
                <div className="text-center py-12">
                  <Milk className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma vaca cadastrada ainda.</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">Editar Vaca</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 px-1">
              {/* Upload de Foto - Edit */}
              <div>
                <Label className="text-sm">Foto da Vaca</Label>
                <div className="mt-1">
                  {formData.foto ? (
                    <div className="relative w-full h-24 bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={formData.foto} 
                        alt="Foto da vaca" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => setFormData({...formData, foto: ""})}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                      <div className="flex flex-col items-center justify-center py-2">
                        <Camera className="w-6 h-6 mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center px-2">
                          {uploadingPhoto ? "Enviando..." : "Clique para adicionar foto"}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-nome" className="text-sm">Nome</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-brinco" className="text-sm">Brinco</Label>
                <Input
                  id="edit-brinco"
                  value={formData.brinco}
                  onChange={(e) => setFormData({...formData, brinco: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativa">Ativa</SelectItem>
                      <SelectItem value="Seca">Seca</SelectItem>
                      <SelectItem value="Prenhe">Prenhe</SelectItem>
                      <SelectItem value="Vendida">Vendida</SelectItem>
                      <SelectItem value="Morta">Morta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Raça</Label>
                  <Select value={formData.raca} onValueChange={(value) => setFormData({...formData, raca: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Holandesa">Holandesa</SelectItem>
                      <SelectItem value="Jersey">Jersey</SelectItem>
                      <SelectItem value="Girolando">Girolando</SelectItem>
                      <SelectItem value="Pardo Suíço">Pardo Suíço</SelectItem>
                      <SelectItem value="Gir">Gir</SelectItem>
                      <SelectItem value="Nelore">Nelore</SelectItem>
                      <SelectItem value="Outras">Outras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-nascimento" className="text-sm">Data Nascimento</Label>
                  <Input
                    id="edit-nascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-entrada" className="text-sm">Data Entrada</Label>
                  <Input
                    id="edit-entrada"
                    type="date"
                    value={formData.dataEntrada}
                    onChange={(e) => setFormData({...formData, dataEntrada: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-observacoes" className="text-sm">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1 text-sm">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground text-sm">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </FarmDashboard>
    </div>
  );
}