import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import FarmDashboard from "@/components/FarmDashboard";
import { Milk, Plus, Calendar, TrendingUp } from "lucide-react";
import { registrarMediaVacaNoHistorico } from "@/lib/historicoUtils";
import { formatDateForDisplay } from "@/lib/utils";

// Configuração Supabase (mantida do código original)
const SUPABASE_URL = 'https://bdtiipdmmgwuqjuhektq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdGlpcGRtbWd3dXFqdWhla3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ3NTksImV4cCI6MjA2Mzg2MDc1OX0.Z_W2sdcx49B2hr6u6PZRcyJXZJAtXNVg3yyRssiTwFg';
const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

// Helpers do código original
const pad2 = (n: number) => String(n).padStart(2, '0');
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function addDaysLocal(ymd: string, days: number) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function rangeForPreset(p: string) {
  const t = todayYMD();
  if (p === 'hoje') return {
    start: t,
    end: t
  };
  if (p === 'ontem') {
    const y = addDaysLocal(t, -1);
    return {
      start: y,
      end: y
    };
  }
  if (p === '7') return {
    start: addDaysLocal(t, -6),
    end: t
  };
  if (p === '15') return {
    start: addDaysLocal(t, -14),
    end: t
  };
  if (p === '30') return {
    start: addDaysLocal(t, -29),
    end: t
  };
  return null;
}
const nowHHMM = () => new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format(new Date());
const litrosToNumber = (v: any) => {
  if (v == null) return 0;
  let s = String(v).trim();
  s = s.replace(/[^0-9,.-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '');
  s = s.replace(/,/g, '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
interface ProductionRecord {
  'VACA-PROD': string;
  DIA: string;
  'HORA-PROD': string;
  'LITROS-PROD': string;
  'PERIODO-PROD': string;
  'OBS-PROD': string;
  CLASSE: string;
}
interface Vaca {
  'NOME-VACA': string;
  'BRINCO-VACA': string;
}
export default function ProductionPage() {
  const [hojeTotal, setHojeTotal] = useState('-- L');
  const [periodo, setPeriodo] = useState('hoje');
  const [filtro, setFiltro] = useState({
    preset: 'hoje',
    start: todayYMD(),
    end: todayYMD()
  });
  const [showDateRange, setShowDateRange] = useState(false);
  const [dataInicio, setDataInicio] = useState(todayYMD());
  const [dataFim, setDataFim] = useState(todayYMD());
  const [registros, setRegistros] = useState<ProductionRecord[]>([]);
  const [vacas, setVacas] = useState<Vaca[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    data: todayYMD(),
    vaca: '',
    litros: '',
    periodo: 'Manhã',
    obs: ''
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Carregar dados iniciais
  useEffect(() => {
    carregarHoje();
    carregarLista();
    carregarVacas();
  }, []);
  useEffect(() => {
    if (registros.length > 0) {
      desenharGrafico(registros);
    }
  }, [registros]);

  // Funções de carregamento (adaptadas do código original)
  const carregarHoje = async () => {
    try {
      const selectCols = encodeURIComponent('DIA,CLASSE,"LITROS-PROD"');
      const url = `${SUPABASE_URL}/rest/v1/PROD-LEITE?select=${selectCols}&DIA=eq.${todayYMD()}&CLASSE=eq.MED-VACA`;
      const res = await fetch(url, {
        headers: HEADERS
      });
      if (!res.ok) {
        setHojeTotal('-- L');
        return;
      }
      const rows = await res.json();
      const total = rows.reduce((a: number, r: any) => a + litrosToNumber(r['LITROS-PROD']), 0);
      setHojeTotal(`${Number(total.toFixed(2))} L`);
    } catch (e) {
      console.error('Erro ao carregar hoje:', e);
      setHojeTotal('-- L');
    }
  };
  const carregarLista = async () => {
    try {
      const {
        start,
        end
      } = filtro;
      const where = start && end ? `and=(CLASSE.eq.MED-VACA,DIA.gte.${start},DIA.lte.${end})&` : `CLASSE=eq.MED-VACA&`;
      const selectCols = encodeURIComponent('"VACA-PROD",DIA,"HORA-PROD","LITROS-PROD","PERIODO-PROD","OBS-PROD",CLASSE');
      const order = encodeURIComponent('DIA.asc,"HORA-PROD".asc');
      const url = `${SUPABASE_URL}/rest/v1/PROD-LEITE?${where}select=${selectCols}&order=${order}&limit=1000`;
      const res = await fetch(url, {
        headers: HEADERS
      });
      if (!res.ok) {
        setRegistros([]);
        return;
      }
      const rows = await res.json();
      setRegistros(rows);
    } catch (e) {
      console.error('Erro ao carregar lista:', e);
      setRegistros([]);
    }
  };
  const carregarVacas = async () => {
    try {
      const selectCols = encodeURIComponent('"NOME-VACA","BRINCO-VACA",CLASSE');
      const order = encodeURIComponent('"NOME-VACA".asc');
      const url = `${SUPABASE_URL}/rest/v1/VACAS?select=${selectCols}&CLASSE=eq.VACAS-REG&order=${order}&limit=1000`;
      const res = await fetch(url, {
        headers: HEADERS
      });
      if (!res.ok) {
        setVacas([]);
        return;
      }
      const rows = await res.json();
      setVacas(rows);
    } catch (e) {
      console.error('Erro ao carregar vacas:', e);
      setVacas([]);
    }
  };

  // Função para aplicar filtro
  const aplicarFiltro = () => {
    if (periodo === 'personalizar') {
      if (!dataInicio || !dataFim) {
        alert('Selecione início e fim.');
        return;
      }
      if (dataInicio > dataFim) {
        alert('Data inicial maior que a final.');
        return;
      }
      setFiltro({
        preset: 'personalizar',
        start: dataInicio,
        end: dataFim
      });
    } else {
      const range = rangeForPreset(periodo);
      if (range) {
        setFiltro({
          preset: periodo,
          start: range.start,
          end: range.end
        });
      }
    }
  };
  useEffect(() => {
    if (periodo !== 'personalizar') {
      aplicarFiltro();
    }
  }, [periodo]);
  useEffect(() => {
    carregarLista();
  }, [filtro]);

  // Função para salvar registro
  const salvarRegistro = async () => {
    if (!formData.data) {
      alert('Selecione a data.');
      return;
    }
    const litrosNum = parseFloat(formData.litros.toString().replace(',', '.'));
    if (!litrosNum || litrosNum <= 0) {
      alert('Informe litros válidos.');
      return;
    }
    if (!formData.vaca) {
      alert('Selecione a vaca.');
      return;
    }
    
    try {
      // Registrar no histórico (já salva em ambas as tabelas)
      const codigo = await registrarMediaVacaNoHistorico({
        data: formData.data,
        vaca: formData.vaca,
        litros: litrosNum,
        periodo: formData.periodo,
        observacoes: formData.obs
      });
      
      if (codigo) {
        console.log(`Registro salvo com código: ${codigo}`);
        setIsModalOpen(false);
        setFormData({
          data: todayYMD(),
          vaca: '',
          litros: '',
          periodo: 'Manhã',
          obs: ''
        });
        await Promise.all([carregarHoje(), carregarLista()]);
      } else {
        alert('Erro ao salvar no histórico.');
      }
    } catch (e) {
      console.error('Erro ao salvar registro:', e);
      alert('Erro ao salvar registro.');
    }
  };

  // Função do gráfico (simplificada)
  const desenharGrafico = (rows: ProductionRecord[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas para alta resolução
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Limpar canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!rows.length) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px system-ui';
      ctx.fillText('Sem dados para o período selecionado.', 20, 30);
      return;
    }

    // Processar dados
    const items = rows.map(r => {
      const hhmm = (r['HORA-PROD'] || '00:00').padStart(5, '0');
      const ts = new Date(`${r.DIA}T${hhmm}:00`).getTime();
      return {
        ts,
        r,
        v: litrosToNumber(r['LITROS-PROD'])
      };
    }).filter(i => Number.isFinite(i.ts));
    if (!items.length) return;
    const minTs = Math.min(...items.map(i => i.ts));
    const maxTs = Math.max(...items.map(i => i.ts));
    const spanTs = Math.max(1, maxTs - minTs);
    const maxY = Math.max(1, Math.ceil(Math.max(...items.map(i => i.v), 0)));
    const pad = {
      left: 60,
      right: 24,
      top: 36,
      bottom: 48
    };
    const W = rect.width - pad.left - pad.right;
    const H = rect.height - pad.top - pad.bottom;
    const xForTs = (ts: number) => pad.left + (ts - minTs) / spanTs * W;
    const yForVal = (v: number) => pad.top + H - v / maxY * H;

    // Grid Y
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + H * i / 5;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + W, y);
    }
    ctx.stroke();

    // Labels Y
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    for (let i = 0; i <= 5; i++) {
      const val = maxY * (1 - i / 5);
      const y = pad.top + H * i / 5 + 4;
      ctx.fillText(val.toFixed(0), 12, y);
    }

    // Linha
    ctx.beginPath();
    items.forEach((it, idx) => {
      const x = xForTs(it.ts);
      const y = yForVal(it.v);
      if (idx === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pontos
    ctx.fillStyle = '#059669';
    items.forEach(it => {
      const x = xForTs(it.ts);
      const y = yForVal(it.v);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  const getPeriodoInfo = () => {
    const {
      preset,
      start,
      end
    } = filtro;
    if (preset === 'hoje') return `Mostrando: Hoje (${formatDateForDisplay(start)})`;
    if (preset === 'ontem') return `Mostrando: Ontem (${formatDateForDisplay(start)})`;
    if (preset === 'personalizar') return `Mostrando: ${formatDateForDisplay(start)} a ${formatDateForDisplay(end)}`;
    return `Mostrando: últimos ${preset} dias (${formatDateForDisplay(start)} a ${formatDateForDisplay(end)})`;
  };
  const getVacaLabel = (vaca: Vaca) => {
    const nome = (vaca['NOME-VACA'] || '').toString().trim();
    const brinco = (vaca['BRINCO-VACA'] || '').toString().trim();
    if (!nome && !brinco) return 'Sem nome';
    return nome && brinco ? `${nome}-${brinco}` : nome || brinco;
  };
  const content = <div className="min-h-screen bg-production-bg">
    <div className="space-y-6 bg-white">
      {/* Header com actions - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-production/30 backdrop-blur-sm border border-production-border rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-production flex items-center justify-center shadow-lg">
              <Milk className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Controle Media Vacas</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Gestão da Media das Vacas</p>
          </div>
        </div>
        
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-production hover:bg-gradient-production-hover gap-2 shadow-lg text-foreground border border-production-border flex-1 sm:flex-none text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar Media</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Media</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="data">Data</Label>
                  <Input type="date" value={formData.data} onChange={e => setFormData({
                    ...formData,
                    data: e.target.value
                  })} />
                </div>
                
                <div>
                  <Label htmlFor="vaca">Vaca</Label>
                  <Select value={formData.vaca} onValueChange={value => setFormData({
                    ...formData,
                    vaca: value
                  })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vacas.map((vaca, index) => {
                        const nome = (vaca['NOME-VACA'] || '').toString().trim();
                        const brinco = (vaca['BRINCO-VACA'] || '').toString().trim();
                        const value = nome || brinco || `vaca-${index}`;
                        return <SelectItem key={index} value={value}>
                            {getVacaLabel(vaca)}
                          </SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="litros">Litros</Label>
                  <Input
                    id="litros"
                    type="text"
                    value={formData.litros}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      litros: e.target.value
                    }))}
                    placeholder="Digite os litros"
                  />
                </div>

                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Select value={formData.periodo} onValueChange={value => setFormData({
                    ...formData,
                    periodo: value
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                      <SelectItem value="Noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="obs">Observações</Label>
                  <Textarea placeholder="Observações opcionais..." value={formData.obs} onChange={e => setFormData({
                    ...formData,
                    obs: e.target.value
                  })} />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={salvarRegistro} className="flex-1 bg-gradient-production hover:bg-gradient-production-hover text-foreground border border-production-border">
                    Registrar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards superiores - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Produção de hoje */}
        <Card className="bg-gradient-production/20 border-production-border shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-center h-full min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]">
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Produção de Hoje
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">{hojeTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="bg-gradient-card border-border shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Filtrar Período</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="periodo">Período</Label>
                <Select value={periodo} onValueChange={value => {
                  setPeriodo(value);
                  setShowDateRange(value === 'personalizar');
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="ontem">Ontem</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="personalizar">Personalizar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showDateRange && <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dataInicio">Início</Label>
                    <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Fim</Label>
                    <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Button onClick={aplicarFiltro} className="w-full">
                      Aplicar
                    </Button>
                  </div>
                </div>}
              
              <p className="text-xs text-muted-foreground">{getPeriodoInfo()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total de registros */}
        <Card className="bg-gradient-card border-border shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-center h-full min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]">
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total de Registros
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">{registros.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico - Mobile Optimized */}
      <Card className="bg-gradient-card border-border shadow-lg">
        <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Gráfico de Produção
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Passe o mouse nos pontos para ver detalhes.
          </p>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="chart-container">
            <canvas ref={canvasRef} className="w-full h-64 sm:h-80 lg:h-96" style={{
              display: 'block'
            }} />
            <div ref={tooltipRef} className="absolute pointer-events-none bg-card border border-border rounded-lg shadow-lg p-2 text-sm hidden z-10" />
          </div>
        </CardContent>
      </Card>

      {/* Tabela - Mobile Optimized */}
      <Card className="bg-gradient-card border-border shadow-lg">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-base sm:text-lg">Últimos registros (limitado a 10)</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="table-container">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs sm:text-sm">VACA</th>
                  <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs sm:text-sm">DATA</th>
                  <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs sm:text-sm">HORA</th>
                  <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs sm:text-sm">LITROS</th>
                  <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs sm:text-sm">PERÍODO</th>
                  <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs sm:text-sm">OBS</th>
                </tr>
              </thead>
              <tbody>
                {registros.slice(-10).reverse().map((registro, index) => <tr key={index} className="border-b border-border last:border-0">
                    <td className="p-2 sm:p-3 text-xs sm:text-sm truncate max-w-[100px]">{registro['VACA-PROD'] || ''}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDateForDisplay(registro.DIA || '')}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{registro['HORA-PROD'] || ''}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">{registro['LITROS-PROD'] ? `${registro['LITROS-PROD']} L` : ''}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{registro['PERIODO-PROD'] || ''}</td>
                    <td className="p-2 sm:p-3 text-muted-foreground text-xs truncate max-w-[150px]">
                      {(registro['OBS-PROD'] || '').toString()}
                    </td>
                  </tr>) || <tr>
                    <td colSpan={6} className="p-3 text-center text-muted-foreground text-sm">
                      Sem registros.
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>;
  return <FarmDashboard title="Media Vacas">{content}</FarmDashboard>;
}