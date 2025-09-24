import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FarmDashboard from "@/components/FarmDashboard";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp } from "lucide-react";
import { registrarGastoNoHistorico } from "@/lib/historicoUtils";
import { formatDateForDisplay } from "@/lib/utils";

// Types
interface ExpenseRecord {
  DIA: string;
  "HORA-GAST": string;
  "VALOR-GAST": string;
  "CATEGO-GAST": string;
  "DESCRI-GAST": string;
  "FORN-GAST": string;
  CLASSE: string;
}

// Constants  
const SUPABASE_URL = 'https://bdtiipdmmgwuqjuhektq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdGlpcGRtbWd3dXFqdWhla3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ3NTksImV4cCI6MjA2Mzg2MDc1OX0.Z_W2sdcx49B2hr6u6PZRcyJXZJAtXNVg3yyRssiTwFg';
const HEADERS = { 
  apikey: SUPABASE_KEY, 
  Authorization: `Bearer ${SUPABASE_KEY}`, 
  Accept: 'application/json', 
  'Content-Type': 'application/json' 
};

const categories = ['Ração', 'Veterinário', 'Estrutura', 'Combustível', 'Medicamentos', 'Equipamentos', 'Silagem', 'Outros'];

// Utility functions
const pad2 = (n: number) => String(n).padStart(2, '0');
const todayYMD = () => new Date().toISOString().slice(0, 10);
const nowHHMM = () => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
const moneyToNumber = (v: any): number => {
  if (v == null) return 0;
  let s = String(v).trim();
  s = s.replace(/[^0-9,.-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '');
  s = s.replace(/,/g, '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const fmtBRL = (n: number) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const addDays = (ymd: string, d: number) => {
  const [y, m, dd] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, dd));
  dt.setUTCDate(dt.getUTCDate() + d);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
};

const rangeForPreset = (p: string) => {
  const t = todayYMD();
  if (p === 'hoje') return { start: t, end: t };
  if (p === 'ontem') { const y = addDays(t, -1); return { start: y, end: y }; }
  if (p === '7') return { start: addDays(t, -6), end: t };
  if (p === '15') return { start: addDays(t, -14), end: t };
  if (p === '30') return { start: addDays(t, -29), end: t };
  return { start: t, end: t };
};

export default function ExpensesPage() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [todayExpense, setTodayExpense] = useState('--');
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [filter, setFilter] = useState({ preset: 'hoje', start: todayYMD(), end: todayYMD() });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: todayYMD(),
    value: 0,
    category: 'Ração',
    description: '',
    supplier: ''
  });

  // Load today's expenses
  const loadTodayExpenses = async () => {
    try {
      const selectCols = encodeURIComponent('DIA,CLASSE,"VALOR-GAST"');
      const url = `${SUPABASE_URL}/rest/v1/PROD-LEITE?select=${selectCols}&DIA=eq.${todayYMD()}&CLASSE=eq.GASTO`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        setTodayExpense('--');
        return;
      }
      const rows = await res.json();
      const total = rows.reduce((a: number, r: any) => a + moneyToNumber(r['VALOR-GAST']), 0);
      setTodayExpense(fmtBRL(total));
    } catch (error) {
      setTodayExpense('--');
    }
  };

  // Load expenses
  const loadExpenses = async () => {
    try {
      const { start, end } = filter;
      const where = start && end ? `and=(CLASSE.eq.GASTO,DIA.gte.${start},DIA.lte.${end})&` : `CLASSE=eq.GASTO&`;
      const selectCols = encodeURIComponent('DIA,"HORA-GAST","VALOR-GAST","CATEGO-GAST","DESCRI-GAST","FORN-GAST",CLASSE');
      const order = encodeURIComponent('DIA.asc,"HORA-GAST".asc');
      const url = `${SUPABASE_URL}/rest/v1/PROD-LEITE?${where}select=${selectCols}&order=${order}&limit=1000`;
      const res = await fetch(url, { headers: HEADERS });
      const rows = res.ok ? await res.json() : [];
      setExpenses(rows);
      renderChart(rows);
    } catch (error) {
      setExpenses([]);
    }
  };

  // Render enhanced responsive chart with tooltips
  const renderChart = (rows: ExpenseRecord[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement?.getBoundingClientRect();
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = Math.max(300, Math.floor(parent.width - 20));
    const canvasHeight = Math.max(250, Math.min(420, window.innerHeight * 0.5));
    
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);

    const pad = { left: 80, right: 40, top: 50, bottom: 80 };
    const w = canvasWidth - pad.left - pad.right;
    const h = canvasHeight - pad.top - pad.bottom;

    // Map & sort by timestamp
    const items = (rows || []).map(r => {
      const hhmm = (r['HORA-GAST'] || '00:00').padStart(5, '0');
      const ts = new Date(`${r.DIA}T${hhmm}:00`).getTime();
      return { 
        ts, 
        r, 
        v: moneyToNumber(r['VALOR-GAST']),
        dia: r.DIA,
        hora: hhmm,
        categoria: r['CATEGO-GAST'] || 'Não informado',
        descricao: r['DESCRI-GAST'] || ''
      };
    }).filter(i => Number.isFinite(i.ts)).sort((a, b) => a.ts - b.ts);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGradient.addColorStop(0, 'rgba(239, 68, 68, 0.03)');
    bgGradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    if (!items.length) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados para o período selecionado.', canvasWidth / 2, canvasHeight / 2);
      ctx.textAlign = 'left';
      return;
    }

    const minTs = items[0].ts;
    const maxTs = items[items.length - 1].ts;
    const spanTs = Math.max(1, maxTs - minTs);
    const maxY = Math.max(1, Math.ceil(Math.max(...items.map(i => i.v), 0)));

    const xForTs = (ts: number) => pad.left + ((ts - minTs) / spanTs) * w;
    const yForVal = (v: number) => pad.top + h - (v / maxY) * h;

    // Enhanced grid
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const y = pad.top + (h * i / 6);
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + w, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Enhanced Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 6; i++) {
      const val = (maxY * (1 - i / 6));
      const y = pad.top + (h * i / 6) + 4;
      ctx.fillText(fmtBRL(val), pad.left - 10, y);
    }
    ctx.textAlign = 'left';

    // Calculate responsive bar width with better mobile handling
    const minBarSpacing = Math.max(4, Math.min(8, w / items.length * 0.1));
    const maxBarWidth = Math.min(60, w / items.length * 0.8);
    const availableWidth = w - (items.length - 1) * minBarSpacing;
    const barW = Math.max(12, Math.min(maxBarWidth, availableWidth / items.length));
    const barSpacing = items.length > 1 ? Math.max(0, (w - items.length * barW) / (items.length - 1)) : 0;

    // Store bar positions for tooltip detection
    const barPositions: Array<{x: number, y: number, width: number, height: number, data: any}> = [];
    
    items.forEach((it, index) => {
      const x = pad.left + index * (barW + barSpacing);
      const y = yForVal(it.v);
      const hh = (pad.top + h) - y;

      // Store position for tooltip
      barPositions.push({
        x: x,
        y: y,
        width: barW,
        height: hh,
        data: it
      });

      // Shadow
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(x + 3, y + 3, barW, hh);

      // Bar gradient
      const barGradient = ctx.createLinearGradient(x, y, x, y + hh);
      barGradient.addColorStop(0, '#ef4444');
      barGradient.addColorStop(0.6, '#dc2626');
      barGradient.addColorStop(1, '#b91c1c');
      ctx.fillStyle = barGradient;
      ctx.fillRect(x, y, barW, hh);

      // Highlight top
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x, y, barW, Math.min(4, hh));

      // Value label on top of bar
      if (it.v > 0) {
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fmtBRL(it.v), x + barW / 2, y - 8);
      }
    });

    // Enhanced X-axis
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + h);
    ctx.lineTo(pad.left + w, pad.top + h);
    ctx.stroke();

    // X-axis labels with better spacing
    const labelStep = Math.max(1, Math.ceil(items.length / 8));
    items.forEach((it, index) => {
      if (index % labelStep === 0 || index === items.length - 1) {
        const d = new Date(it.ts);
        const x = pad.left + index * (barW + barSpacing) + barW / 2;
        
        // Tick mark
        ctx.strokeStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(x, pad.top + h);
        ctx.lineTo(x, pad.top + h + 8);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        const dateLabel = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
        const timeLabel = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
        ctx.fillText(dateLabel, x, pad.top + h + 25);
        ctx.fillText(timeLabel, x, pad.top + h + 40);
      }
    });

    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Histórico de Gastos', canvasWidth / 2, 25);
    
    ctx.textAlign = 'left';

    // Mouse interaction for tooltips
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      let tooltip = document.getElementById('chart-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.style.cssText = `
          position: fixed;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          pointer-events: none;
          z-index: 1000;
          display: none;
          max-width: 250px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          font-family: system-ui, -apple-system, sans-serif;
        `;
        document.body.appendChild(tooltip);
      }

      let hoveredBar = null;
      for (const bar of barPositions) {
        if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
          hoveredBar = bar;
          break;
        }
      }

      if (hoveredBar) {
        const data = hoveredBar.data;
        const date = new Date(data.dia);
        const formattedDate = formatDateForDisplay(data.dia);
        
        tooltip.innerHTML = `
          <div style="border-bottom: 1px solid #444; padding-bottom: 6px; margin-bottom: 6px;">
            <strong>Gasto Registrado</strong>
          </div>
          <div><strong>Data:</strong> ${formattedDate}</div>
          <div><strong>Hora:</strong> ${data.hora}</div>
          <div><strong>Valor:</strong> ${fmtBRL(data.v)}</div>
          <div><strong>Categoria:</strong> ${data.categoria}</div>
          ${data.descricao ? `<div><strong>Descrição:</strong> ${data.descricao}</div>` : ''}
        `;
        
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY - 10}px`;
        canvas.style.cursor = 'pointer';
      } else {
        tooltip.style.display = 'none';
        canvas.style.cursor = 'default';
      }
    };

    const handleMouseLeave = () => {
      const tooltip = document.getElementById('chart-tooltip');
      if (tooltip) {
        tooltip.style.display = 'none';
      }
      canvas.style.cursor = 'default';
    };

    // Remove existing listeners
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    
    // Add new listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    if (value === 'personalizar') {
      setFilter(prev => ({ ...prev, preset: 'personalizar' }));
    } else {
      const range = rangeForPreset(value);
      setFilter({ preset: value, start: range.start, end: range.end });
    }
  };

  // Apply custom range
  const applyCustomRange = (start: string, end: string) => {
    if (!start || !end) {
      toast({ title: "Erro", description: "Selecione início e fim.", variant: "destructive" });
      return;
    }
    if (start > end) {
      toast({ title: "Erro", description: "Data inicial maior que a final.", variant: "destructive" });
      return;
    }
    setFilter({ preset: 'personalizar', start, end });
  };

  // Save expense
  const saveExpense = async () => {
    if (!formData.date) {
      toast({ title: "Erro", description: "Selecione a data.", variant: "destructive" });
      return;
    }
    if (!formData.value || formData.value <= 0) {
      toast({ title: "Erro", description: "Informe valor válido.", variant: "destructive" });
      return;
    }

    try {
      // Registrar no histórico (já salva em ambas as tabelas)
      const codigo = await registrarGastoNoHistorico({
        data: formData.date,
        valor: formData.value,
        categoria: formData.category,
        descricao: formData.description,
        fornecedor: formData.supplier
      });
      
      if (codigo) {
        setShowModal(false);
        setFormData({
          date: todayYMD(),
          value: 0,
          category: 'Ração',
          description: '',
          supplier: ''
        });
        
        await Promise.all([loadTodayExpenses(), loadExpenses()]);
        toast({ title: "Sucesso", description: "Gasto registrado com sucesso!" });
      } else {
        toast({ title: "Erro", description: "Falha ao registrar gasto.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao registrar gasto.", variant: "destructive" });
    }
  };

  // Effects
  useEffect(() => {
    loadTodayExpenses();
    loadExpenses();
  }, [filter]);

  useEffect(() => {
    const handleResize = () => renderChart(expenses);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [expenses]);

  // Get filter info text
  const getFilterInfo = () => {
    const { preset, start, end } = filter;
    if (preset === 'hoje') return `Mostrando: Hoje (${start})`;
    if (preset === 'ontem') return `Mostrando: Ontem (${start})`;
    if (preset === 'personalizar') return `Mostrando: ${start} a ${end}`;
    return `Mostrando: últimos ${preset} dias (${start} a ${end})`;
  };

  return (
    <div className="min-h-screen bg-expenses-bg">
      <FarmDashboard title="Gastos">
        <div className="space-y-4 sm:space-y-6">
          {/* Header com actions - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-expenses/30 backdrop-blur-sm border border-expenses-border rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-expenses flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-foreground rotate-180" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Controle de Gastos</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Gestão de despesas da fazenda</p>
              </div>
            </div>
          
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-expenses hover:bg-gradient-expenses-hover gap-2 shadow-lg text-foreground border border-expenses-border flex-1 sm:flex-none text-sm">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Novo Gasto</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Gasto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">DATA (DIA)</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">VALOR (R$)</Label>
                    <CurrencyInput
                      id="value"
                      value={formData.value}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, value }))}
                      placeholder="Digite o valor"
                      showCurrencySymbol={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">CATEGORIA</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">DESCRIÇÃO</Label>
                    <Textarea
                      id="description"
                      maxLength={150}
                      rows={3}
                      placeholder="Até 150 caracteres"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">FORNECEDOR (opcional)</Label>
                    <Input
                      id="supplier"
                      maxLength={150}
                      placeholder="Nome do fornecedor"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    />
                  </div>
                  <Button onClick={saveExpense} className="w-full bg-gradient-expenses hover:bg-gradient-expenses-hover text-foreground border border-expenses-border">
                    REGISTRAR GASTO
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats and Actions - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Today's Expense */}
          <Card className="bg-gradient-expenses/20 border-expenses-border shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-center h-full min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]">
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Gasto de Hoje
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">{todayExpense}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter */}
          <Card className="bg-gradient-card border-border shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm text-muted-foreground">Filtrar Data</div>
              <Select value={filter.preset} onValueChange={handleFilterChange}>
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
              
              {filter.preset === 'personalizar' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={filter.start}
                    onChange={(e) => setFilter(prev => ({ ...prev, start: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={filter.end}
                    onChange={(e) => setFilter(prev => ({ ...prev, end: e.target.value }))}
                  />
                  <Button onClick={() => applyCustomRange(filter.start, filter.end)} className="col-span-2 bg-gradient-error hover:opacity-90 text-error-foreground">
                    Aplicar
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">{getFilterInfo()}</div>
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
                  <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">{expenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart - Mobile Optimized */}
        <Card className="bg-gradient-card border-border shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Gráfico de Gastos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {expenses.length > 0 
                  ? `Registros: ${expenses.length} • Total: ${fmtBRL(expenses.reduce((a, r) => a + moneyToNumber(r['VALOR-GAST']), 0))}`
                  : 'Passe o mouse nas barras para ver detalhes.'
                }
              </p>
            </div>
            <div className="chart-container">
              <canvas ref={canvasRef} className="w-full h-64 sm:h-80 lg:h-96" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Records Table - Mobile Optimized */}
        <Card className="bg-gradient-card border-border shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Últimos registros (limitado a 10)</h3>
            <div className="table-container">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground">DATA</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground">HORA</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground">VALOR</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground">CATEGORIA</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground">DESCRIÇÃO</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground">FORNECEDOR</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 ? (
                    expenses.slice(-10).reverse().map((expense, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">{formatDateForDisplay(expense.DIA)}</td>
                        <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">{expense['HORA-GAST']}</td>
                        <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-destructive">
                          {fmtBRL(moneyToNumber(expense['VALOR-GAST']))}
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm truncate max-w-[100px]">{expense['CATEGO-GAST']}</td>
                        <td className="py-2 px-2 sm:px-3 text-xs text-muted-foreground truncate max-w-[150px]">
                          {expense['DESCRI-GAST']}
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-xs text-muted-foreground truncate max-w-[120px]">
                          {expense['FORN-GAST']}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 px-3 text-center text-sm text-muted-foreground">
                        Sem gastos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      </FarmDashboard>
    </div>
  );
}