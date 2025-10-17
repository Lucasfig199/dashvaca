import { useState, useEffect, useRef } from "react";
import FarmDashboard from "@/components/FarmDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Milk, TrendingUp, TrendingDown, DollarSign, Users, Activity, Plus, Edit, Trash2, CalendarIcon } from "lucide-react";
import { formatDateForDisplay, cn } from "@/lib/utils";
import { format } from "date-fns";

// Types
interface ProductionRecord {
  "DATA-MED": string;
  "HORA-MED": string;
  "LITROS-MED": string;
  "PERIODO-MED": string;
  "OBS-MED": string;
  CLASSE: string;
}

interface ExpenseRecord {
  DIA: string;
  "VALOR-GAST": string;
  CLASSE: string;
}

interface ProfitRecord {
  DIA: string;
  "VALOR-LUCRO": string;
  CLASSE: string;
}

interface Vaca {
  id: number;
  'NOME-VACA': string;
  'BRINCO-VACA': string;
  CLASSE: string;
}

interface TimelineEvent {
  id: number;
  'DATA-TLINE': string;
  'VACA-TLINE': string;
  'EVENTO-TLINE': string;
  'DESC-TLINE': string;
  'CUST-TLINE': string;
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

// Utility functions
const todayYMD = () => new Date().toISOString().slice(0, 10);
const addDays = (ymd: string, d: number) => {
  const [y, m, dd] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, dd));
  dt.setUTCDate(dt.getUTCDate() + d);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
};

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
const fmtNumber = (n: number) => (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [periodo, setPeriodo] = useState<string>("15");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [todayProduction, setTodayProduction] = useState('--');
  const [monthlyExpenses, setMonthlyExpenses] = useState('--');
  const [monthlyProfits, setMonthlyProfits] = useState('--');
  const [monthlyBalance, setMonthlyBalance] = useState('--');
  const [productionData, setProductionData] = useState<ProductionRecord[]>([]);
  const [cowStats, setCowStats] = useState({ total: 0, ativas: 0, secas: 0, prenhes: 0 });
  const [recentActivities, setRecentActivities] = useState<TimelineEvent[]>([]);

  // Get date range based on selected period
  const getDateRange = (): { start: string; end: string } => {
    const today = todayYMD();
    
    if (periodo === "custom" && customStartDate && customEndDate) {
      return {
        start: format(customStartDate, "yyyy-MM-dd"),
        end: format(customEndDate, "yyyy-MM-dd")
      };
    }
    
    switch (periodo) {
      case "0": // Hoje
        return { start: today, end: today };
      case "1": // Ontem
        const yesterday = addDays(today, -1);
        return { start: yesterday, end: yesterday };
      case "7": // 7 dias
        return { start: addDays(today, -6), end: today };
      case "15": // 15 dias
        return { start: addDays(today, -14), end: today };
      case "30": // 30 dias
        return { start: addDays(today, -29), end: today };
      default:
        return { start: addDays(today, -14), end: today };
    }
  };

  // Get period display text
  const getPeriodoDisplay = (): string => {
    if (periodo === "custom" && customStartDate && customEndDate) {
      return `${format(customStartDate, "dd/MM/yyyy")} - ${format(customEndDate, "dd/MM/yyyy")}`;
    }
    
    const { start, end } = getDateRange();
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    
    return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
  };

  // Load production for selected period
  const loadPeriodProduction = async () => {
    try {
      const { start, end } = getDateRange();
      const selectCols = encodeURIComponent('"DATA-MED",CLASSE,"LITROS-MED"');
      const where = `and=(CLASSE.eq.PROD-DIA,"DATA-MED".gte.${start},"DATA-MED".lte.${end})&`;
      const url = `${SUPABASE_URL}/rest/v1/PROD-LEITE?${where}select=${selectCols}`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        setTodayProduction('--');
        return;
      }
      const rows = await res.json();
      const total = rows.reduce((a: number, r: any) => {
        const litros = moneyToNumber(r['LITROS-MED']);
        return a + litros;
      }, 0);
      setTodayProduction(fmtNumber(total) + 'L');
    } catch (error) {
      setTodayProduction('--');
    }
  };

  // Load expenses for selected period
  const loadPeriodExpenses = async () => {
    try {
      const { start, end } = getDateRange();
      
      const where = `and=(CLASSE.eq.GASTO,DIA.gte.${start},DIA.lte.${end})&`;
      const selectCols = encodeURIComponent('DIA,"VALOR-GAST"');
      const url = `${SUPABASE_URL}/rest/v1/PROD-LEITE?${where}select=${selectCols}&limit=10000`;
      const res = await fetch(url, { headers: HEADERS });
      const rows = res.ok ? await res.json() : [];
      const total = rows.reduce((a: number, r: any) => a + moneyToNumber(r['VALOR-GAST']), 0);
      setMonthlyExpenses(fmtBRL(total));
    } catch (error) {
      setMonthlyExpenses('--');
    }
  };

  // Load profits for selected period
  const loadPeriodProfits = async () => {
    try {
      const { start, end } = getDateRange();
      
      const where = `and=(CLASSE.eq.LUCRO,DIA.gte.${start},DIA.lte.${end})&`;
      const selectCols = encodeURIComponent('DIA,"VALOR-LUCRO"');
      const url = `${SUPABASE_URL}/rest/v1/PROD-LEITE?${where}select=${selectCols}&limit=10000`;
      const res = await fetch(url, { headers: HEADERS });
      const rows = res.ok ? await res.json() : [];
      const total = rows.reduce((a: number, r: any) => a + moneyToNumber(r['VALOR-LUCRO']), 0);
      setMonthlyProfits(fmtBRL(total));
      return total;
    } catch (error) {
      setMonthlyProfits('--');
      return 0;
    }
  };

  // Calculate balance for selected period
  const calculatePeriodBalance = async () => {
    try {
      const { start, end } = getDateRange();
      
      // Get expenses
      const expenseWhere = `and=(CLASSE.eq.GASTO,DIA.gte.${start},DIA.lte.${end})&`;
      const expenseSelectCols = encodeURIComponent('DIA,"VALOR-GAST"');
      const expenseUrl = `${SUPABASE_URL}/rest/v1/PROD-LEITE?${expenseWhere}select=${expenseSelectCols}&limit=10000`;
      const expenseRes = await fetch(expenseUrl, { headers: HEADERS });
      const expenseRows = expenseRes.ok ? await expenseRes.json() : [];
      const totalExpenses = expenseRows.reduce((a: number, r: any) => a + moneyToNumber(r['VALOR-GAST']), 0);

      // Get profits
      const profitWhere = `and=(CLASSE.eq.LUCRO,DIA.gte.${start},DIA.lte.${end})&`;
      const profitSelectCols = encodeURIComponent('DIA,"VALOR-LUCRO"');
      const profitUrl = `${SUPABASE_URL}/rest/v1/PROD-LEITE?${profitWhere}select=${profitSelectCols}&limit=10000`;
      const profitRes = await fetch(profitUrl, { headers: HEADERS });
      const profitRows = profitRes.ok ? await profitRes.json() : [];
      const totalProfits = profitRows.reduce((a: number, r: any) => a + moneyToNumber(r['VALOR-LUCRO']), 0);

      const balance = totalProfits - totalExpenses;
      setMonthlyBalance(fmtBRL(balance));
    } catch (error) {
      setMonthlyBalance('--');
    }
  };

  // Load production data for chart based on selected period
  const loadProductionChart = async () => {
    try {
      const { start, end } = getDateRange();
      
      const where = `and=(CLASSE.eq.PROD-DIA,"DATA-MED".gte.${start},"DATA-MED".lte.${end})&`;
      const selectCols = encodeURIComponent('"DATA-MED","HORA-MED","LITROS-MED","PERIODO-MED","OBS-MED",CLASSE');
      const order = encodeURIComponent('"DATA-MED".asc,"HORA-MED".asc');
      const url = `${SUPABASE_URL}/rest/v1/PROD-LEITE?${where}select=${selectCols}&order=${order}&limit=1000`;
      const res = await fetch(url, { headers: HEADERS });
      const rows = res.ok ? await res.json() : [];
      setProductionData(rows);
      renderChart(rows);
    } catch (error) {
      setProductionData([]);
    }
  };

  // Load cow statistics
  const loadCowStats = async () => {
    try {
      const url = `${SUPABASE_URL}/rest/v1/VACAS?select=id,"NOME-VACA","BRINCO-VACA",CLASSE&CLASSE=eq.VACAS-REG`;
      const response = await fetch(url, { headers: HEADERS });
      const vacas = response.ok ? await response.json() : [];
      
      // Mock data for now since we don't have status field in the real data
      const stats = {
        total: vacas.length,
        ativas: Math.floor(vacas.length * 0.7),
        secas: Math.floor(vacas.length * 0.2),
        prenhes: Math.floor(vacas.length * 0.1)
      };
      setCowStats(stats);
    } catch (error) {
      setCowStats({ total: 0, ativas: 0, secas: 0, prenhes: 0 });
    }
  };

  // Load recent activities based on selected period
  const loadRecentActivities = async () => {
    try {
      const { start } = getDateRange();
      const params = new URLSearchParams({
        'select': '*',
        'CLASSE': 'eq.TLINE',
        'order': 'DATA-TLINE.desc',
        'limit': '10'
      });
      params.append('and', `(DATA-TLINE.gte.${start})`);
      
      const url = `${SUPABASE_URL}/rest/v1/VACAS?${params.toString()}`;
      const response = await fetch(url, { headers: HEADERS });
      const data = response.ok ? await response.json() : [];
      setRecentActivities(data);
    } catch (error) {
      setRecentActivities([]);
    }
  };

  // Render production chart with individual points
  const renderChart = (rows: ProductionRecord[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement?.getBoundingClientRect();
    if (!parent) return;

    // Configure canvas for high resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(300, Math.floor(parent.width)) * dpr;
    canvas.height = 280 * dpr;
    canvas.style.width = Math.max(300, Math.floor(parent.width)) + 'px';
    canvas.style.height = '280px';
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    const canvasWidth = Math.max(300, Math.floor(parent.width));
    const canvasHeight = 280;

    const pad = { left: 60, right: 24, top: 36, bottom: 48 };
    const w = canvasWidth - pad.left - pad.right;
    const h = canvasHeight - pad.top - pad.bottom;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    if (!rows.length) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px system-ui';
      ctx.fillText('Sem dados de produção no período selecionado.', pad.left, pad.top + 20);
      return;
    }

    // Process individual records with timestamps
    const items = rows.map(r => {
      const hhmm = (r['HORA-MED'] || '00:00').padStart(5, '0');
      const ts = new Date(`${r['DATA-MED']}T${hhmm}:00`).getTime();
      return { 
        ts, 
        r, 
        v: moneyToNumber(r['LITROS-MED']),
        date: r['DATA-MED'],
        hora: r['HORA-MED'] || '00:00'
      };
    }).filter(i => Number.isFinite(i.ts) && i.v > 0);

    if (!items.length) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px system-ui';
      ctx.fillText('Sem dados válidos para exibir.', pad.left, pad.top + 20);
      return;
    }

    // Sort by timestamp
    items.sort((a, b) => a.ts - b.ts);

    const minTs = Math.min(...items.map(i => i.ts));
    const maxTs = Math.max(...items.map(i => i.ts));
    const spanTs = Math.max(1, maxTs - minTs);
    const maxY = Math.max(1, Math.ceil(Math.max(...items.map(i => i.v))));

    const xForTs = (ts: number) => pad.left + ((ts - minTs) / spanTs) * w;
    const yForVal = (v: number) => pad.top + h - (v / maxY) * h;

    // Grid Y
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (h * i / 5);
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + w, y);
    }
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    for (let i = 0; i <= 5; i++) {
      const val = (maxY * (1 - i / 5));
      const y = pad.top + (h * i / 5) + 4;
      ctx.fillText(val.toFixed(0) + 'L', 12, y);
    }

    // Draw line connecting points
    if (items.length > 1) {
      ctx.beginPath();
      items.forEach((item, idx) => {
        const x = xForTs(item.ts);
        const y = yForVal(item.v);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw individual points
    ctx.fillStyle = '#059669';
    items.forEach(item => {
      const x = xForTs(item.ts);
      const y = yForVal(item.v);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // X-axis labels (show dates at regular intervals)
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px system-ui';
    const labelInterval = Math.ceil(items.length / 8); // Show ~8 labels max
    items.forEach((item, i) => {
      if (i % labelInterval === 0 || i === items.length - 1) {
        const x = xForTs(item.ts);
        const dateObj = new Date(item.date + 'T00:00:00');
        const label = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        ctx.fillText(label, x - 15, pad.top + h + 20);
      }
    });

    // Add mouse interaction for tooltips
    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * dpr;
      const mouseY = (e.clientY - rect.top) * dpr;
      
      // Find closest point
      let closestItem = null;
      let minDistance = Infinity;
      
      items.forEach(item => {
        const x = xForTs(item.ts) * dpr;
        const y = yForVal(item.v) * dpr;
        const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
        
        if (distance < 20 * dpr && distance < minDistance) {
          minDistance = distance;
          closestItem = item;
        }
      });
      
      if (closestItem) {
        canvas.style.cursor = 'pointer';
        canvas.title = `${closestItem.date} ${closestItem.hora} - ${closestItem.v}L`;
      } else {
        canvas.style.cursor = 'default';
        canvas.title = '';
      }
    };
  };

  // Load all data when period changes
  const loadAllData = () => {
    loadPeriodProduction();
    loadPeriodExpenses();
    loadPeriodProfits();
    calculatePeriodBalance();
    loadProductionChart();
    loadRecentActivities();
  };

  // Effects
  useEffect(() => {
    loadCowStats(); // Cow stats don't depend on period
  }, []);

  useEffect(() => {
    if (periodo === "custom" && (!customStartDate || !customEndDate)) {
      return; // Wait for custom dates to be selected
    }
    loadAllData();
  }, [periodo, customStartDate, customEndDate]);

  useEffect(() => {
    const handleResize = () => renderChart(productionData);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [productionData]);

  return (
    <FarmDashboard title="Dashboard">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Period Filter */}
        <Card className="bg-gradient-card border-border shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Período</h3>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="0">Hoje</SelectItem>
                  <SelectItem value="1">Ontem</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              
              {periodo === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !customStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Data Fim</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !customEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                Mostrando: <span className="font-medium text-foreground">{getPeriodoDisplay()}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Produção Hoje */}
          <Card className="bg-gradient-card border-border shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-home-gradient-1 opacity-10"></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6 flex items-center justify-center min-h-[100px] sm:min-h-[120px]">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-left w-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-home-gradient-1 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 border border-profits-border">
                  <Milk className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Produção Total
                  </p>
                  <p className="text-2xl sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground truncate">{todayProduction}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gastos do Mês */}
          <Card className="bg-gradient-card border-border shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-home-gradient-2 opacity-10"></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6 flex items-center justify-center min-h-[100px] sm:min-h-[120px]">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-left w-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-home-gradient-2 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 border border-expenses-border">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Gastos Totais
                  </p>
                  <p className="text-2xl sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground truncate">{monthlyExpenses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lucros do Mês */}
          <Card className="bg-gradient-card border-border shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-home-gradient-1 opacity-10"></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6 flex items-center justify-center min-h-[100px] sm:min-h-[120px]">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-left w-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-home-gradient-1 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 border border-profits-border">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Lucros Totais
                  </p>
                  <p className="text-2xl sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground truncate">{monthlyProfits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo do Mês */}
          <Card className="bg-gradient-card border-border shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-home-gradient-3 opacity-10"></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6 flex items-center justify-center min-h-[100px] sm:min-h-[120px]">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-left w-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-home-gradient-3 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 border border-card">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Saldo Total
                  </p>
                  <p className="text-2xl sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground truncate">{monthlyBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Chart - Mobile Optimized */}
        <Card className="bg-gradient-card border-border shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <h3 className="text-lg sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Produção de Leite - Período Selecionado</h3>
            <div className="table-container chart-container">
              <canvas ref={canvasRef} className="w-full h-64 sm:h-72 lg:h-80" />
            </div>
          </CardContent>
        </Card>

        {/* Cow Statistics - Mobile First */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-vacas/20 border-vacas-border shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-vacas rounded-lg flex items-center justify-center shadow-md">
                <Milk className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total
                </p>
                <p className="text-xl sm:text-xl lg:text-2xl font-bold text-foreground">{cowStats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card border-0 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Ativas
                </p>
                <p className="text-xl sm:text-xl lg:text-2xl font-bold text-foreground">{cowStats.ativas}</p>
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card border-0 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Secas
                </p>
                <p className="text-xl sm:text-xl lg:text-2xl font-bold text-foreground">{cowStats.secas}</p>
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card border-0 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Prenhes
                </p>
                <p className="text-xl sm:text-xl lg:text-2xl font-bold text-foreground">{cowStats.prenhes}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activities - Mobile Optimized Table */}
        <Card className="bg-gradient-card border-border shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <h3 className="text-lg sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Atividades Recentes</h3>
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 sm:py-8">Nenhuma atividade recente encontrada.</p>
            ) : (
              <div className="table-container">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 sm:w-28">Data</TableHead>
                      <TableHead className="w-20 sm:w-24">Vaca</TableHead>
                      <TableHead className="w-24 sm:w-28">Evento</TableHead>
                      <TableHead className="min-w-32">Descrição</TableHead>
                      <TableHead className="w-20 sm:w-24 text-right">Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {formatDateForDisplay(activity['DATA-TLINE'])}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm truncate">{activity['VACA-TLINE'] || '—'}</TableCell>
                        <TableCell className="text-xs sm:text-sm truncate">{activity['EVENTO-TLINE'] || '—'}</TableCell>
                        <TableCell className="text-xs sm:text-sm truncate max-w-[200px]">{activity['DESC-TLINE'] || '—'}</TableCell>
                        <TableCell className="text-xs sm:text-sm font-medium text-right">{fmtBRL(moneyToNumber(activity['CUST-TLINE']))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FarmDashboard>
  );
};

export default Index;
