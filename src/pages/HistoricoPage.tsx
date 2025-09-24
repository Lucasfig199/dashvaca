import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock3, Plus, Edit, Trash2, Calendar, Baby, Heart, Stethoscope, Syringe, Activity, Droplets, ClipboardCheck, MoreHorizontal, Milk, TrendingUp, TrendingDown, UserPlus, DollarSign } from "lucide-react";
import FarmDashboard from "@/components/FarmDashboard";
import { formatDateForDisplay } from "@/lib/utils";
import { deletarRegistroVinculado } from "@/lib/historicoUtils";
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
  'VET-TLINE': string;
  'CUST-TLINE': string;
  'ABS-TLINE': string;
  'HORA-GERAL': string;
  CLASSE: string;
  CODE?: string; // Código único para vincular registros
  // Campos específicos para GASTO
  'DATA-GAST-TLINE'?: string;
  'HORA-GAST-TLINE'?: string;
  'VALOR-GAST-TLINE'?: string;
  'CATE-GAST-TLINE'?: string;
  'FORN-GAST-TLINE'?: string;
  // Campos específicos para LUCRO
  'DATA-LUCRO-TLINE'?: string;
  'HORA-LUCRO-TLINE'?: string;
  'VALOR-LUCRO-TLINE'?: string;
  'TIPO-LUCRO-TLINE'?: string;
  'CLIE-LUCRO-TLINE'?: string;
  // Campos específicos para Media Vacas
  'DATA-MD-TLINE'?: string;
  'HORA-MD-TLINE'?: string;
  'VACA-MD-TLINE'?: string;
  'LT-MD-TLINE'?: string;
  'PER-MD-TLINE'?: string;
  // Campos específicos para Produção Diária
  'DATA-PD-TLINE'?: string;
  'HORA-PD-TLINE'?: string;
  'LT-PD-TLINE'?: string;
  'PER-PD-TLINE'?: string;
}
const SUPABASE_URL = 'https://bdtiipdmmgwuqjuhektq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdGlpcGRtbWd3dXFqdWhla3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ3NTksImV4cCI6MjA2Mzg2MDc1OX0.Z_W2sdcx49B2hr6u6PZRcyJXZJAtXNVg3yyRssiTwFg';
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};
const eventTypes = ['Parto', 'Prenhez Confirmada', 'Tratamento Veterinário', 'Vacinação', 'Inseminação', 'Secagem', 'Exame Clínico', 'Outros', 'Media Vaca', 'Produção Diária', 'Gastos', 'Lucros', 'Registro de Vacas'];

// Function to get the appropriate icon for each event type
const getEventIcon = (eventType: string) => {
  const iconProps = { className: "w-5 h-5 text-primary-foreground" };
  
  switch (eventType) {
    case 'Parto':
      return <Baby {...iconProps} />;
    case 'Prenhez Confirmada':
      return <Heart {...iconProps} />;
    case 'Tratamento Veterinário':
      return <Stethoscope {...iconProps} />;
    case 'Vacinação':
      return <Syringe {...iconProps} />;
    case 'Inseminação':
      return <Activity {...iconProps} />;
    case 'Secagem':
      return <Droplets {...iconProps} />;
    case 'Exame Clínico':
      return <ClipboardCheck {...iconProps} />;
    case 'Media Vaca':
      return <Milk {...iconProps} />;
    case 'Produção Diária':
      return <TrendingUp {...iconProps} />;
    case 'Gastos':
      return <TrendingDown {...iconProps} />;
    case 'Lucros':
      return <DollarSign {...iconProps} />;
    case 'Registro de Vacas':
      return <UserPlus {...iconProps} />;
    case 'Outros':
    default:
      return <MoreHorizontal {...iconProps} />;
  }
};

// Function to get background color for each event type
const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'Parto':
      return 'from-pink-500 to-pink-600';
    case 'Prenhez Confirmada':
      return 'from-red-500 to-red-600';
    case 'Tratamento Veterinário':
      return 'from-blue-500 to-blue-600';
    case 'Vacinação':
      return 'from-green-500 to-green-600';
    case 'Inseminação':
      return 'from-purple-500 to-purple-600';
    case 'Secagem':
      return 'from-cyan-500 to-cyan-600';
    case 'Exame Clínico':
      return 'from-indigo-500 to-indigo-600';
    case 'Media Vaca':
      return 'from-orange-500 to-orange-600';
    case 'Produção Diária':
      return 'from-emerald-500 to-emerald-600';
    case 'Gastos':
      return 'from-rose-500 to-rose-600';
    case 'Lucros':
      return 'from-amber-500 to-amber-600';
    case 'Registro de Vacas':
      return 'from-violet-500 to-violet-600';
    case 'Outros':
    default:
      return 'from-gray-500 to-gray-600';
  }
};
const periodOptions = [{
  value: 'hoje',
  label: 'Hoje'
}, {
  value: 'ontem',
  label: 'Ontem'
}, {
  value: '7',
  label: '7 dias'
}, {
  value: '15',
  label: '15 dias'
}, {
  value: '30',
  label: '30 dias'
}];

export default function HistoricoPage() {
  const [vacas, setVacas] = useState<Vaca[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filters, setFilters] = useState({
    tipo: '__all__',
    periodo: '30'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().slice(0, 10),
    vaca: '',
    tipo: 'Outros',
    descricao: '',
    veterinario: '',
    custo: '',
    observacoes: '',
    categoria: '',
    fornecedor: '',
    cliente: '',
    litros: '',
    periodo: ''
  });

  const formatMoney = (value: string | number) => {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Function to render card content based on event type
  const renderEventCardContent = (event: TimelineEvent) => {
    const eventType = event['EVENTO-TLINE'];
    
    switch (eventType) {
      case 'Gastos':
        return (
          <div className="space-y-2 text-sm">
            <div className="font-medium text-foreground">
              {event['DATA-GAST-TLINE'] || event['DATA-TLINE'] || '—'} • {event['HORA-GAST-TLINE'] || event['HORA-GERAL'] || '—'}
            </div>
            <div className="text-muted-foreground">
              {event['CATE-GAST-TLINE'] || 'Categoria não informada'}
            </div>
            <div className="font-semibold text-lg text-foreground">
              {formatMoney(event['VALOR-GAST-TLINE'] || event['CUST-TLINE'] || '0')}
            </div>
            <div className="text-muted-foreground">
              {event['FORN-GAST-TLINE'] || 'Fornecedor não informado'}
            </div>
          </div>
        );
      
      case 'Lucros':
        return (
          <div className="space-y-2 text-sm">
            <div className="font-medium text-foreground">
              {event['DATA-LUCRO-TLINE'] || event['DATA-TLINE'] || '—'} • {event['HORA-LUCRO-TLINE'] || event['HORA-GERAL'] || '—'}
            </div>
            <div className="text-muted-foreground">
              {event['TIPO-LUCRO-TLINE'] || 'Tipo não informado'}
            </div>
            <div className="font-semibold text-lg text-foreground">
              {formatMoney(event['VALOR-LUCRO-TLINE'] || event['CUST-TLINE'] || '0')}
            </div>
            <div className="text-muted-foreground">
              {event['CLIE-LUCRO-TLINE'] || 'Cliente não informado'}
            </div>
          </div>
        );
      
      case 'Media Vaca':
        return (
          <div className="space-y-2 text-sm">
            <div className="font-medium text-foreground">
              {event['DATA-MD-TLINE'] || event['DATA-TLINE'] || '—'} • {event['HORA-MD-TLINE'] || event['HORA-GERAL'] || '—'}
            </div>
            <div className="text-muted-foreground">
              {event['VACA-MD-TLINE'] || event['VACA-TLINE'] || 'Vaca não informada'}
            </div>
            <div className="font-semibold text-lg text-foreground">
              {event['LT-MD-TLINE'] || '0'}L
            </div>
            <div className="text-muted-foreground">
              {event['PER-MD-TLINE'] || 'Período não informado'}
            </div>
          </div>
        );
      
      case 'Produção Diária':
        return (
          <div className="space-y-2 text-sm">
            <div className="font-medium text-foreground">
              {event['DATA-PD-TLINE'] || event['DATA-TLINE'] || '—'} • {event['HORA-PD-TLINE'] || event['HORA-GERAL'] || '—'}
            </div>
            <div className="font-semibold text-lg text-foreground">
              {event['LT-PD-TLINE'] || '0'}L
            </div>
            <div className="text-muted-foreground">
              {event['PER-PD-TLINE'] || 'Período não informado'}
            </div>
          </div>
        );
        
      case 'Tratamento Veterinário':
      case 'Vacinação':
      case 'Exame Clínico':
        return (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><span className="font-semibold">Custo:</span> {formatMoney(event['CUST-TLINE'] || '0')}</div>
            <div><span className="font-semibold">Veterinário:</span> {event['VET-TLINE'] || '—'}</div>
            <div><span className="font-semibold">Descrição:</span> {event['DESC-TLINE'] || '—'}</div>
            <div><span className="font-semibold">Observações:</span> {event['ABS-TLINE'] || '—'}</div>
          </div>
        );
        
      case 'Parto':
      case 'Prenhez Confirmada':
      case 'Inseminação':
      case 'Secagem':
        return (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><span className="font-semibold">Vaca:</span> {event['VACA-TLINE'] || '—'}</div>
            <div><span className="font-semibold">Descrição:</span> {event['DESC-TLINE'] || '—'}</div>
            {event['VET-TLINE'] && <div><span className="font-semibold">Veterinário:</span> {event['VET-TLINE']}</div>}
            {event['CUST-TLINE'] && <div><span className="font-semibold">Custo:</span> {formatMoney(event['CUST-TLINE'])}</div>}
            <div><span className="font-semibold">Observações:</span> {event['ABS-TLINE'] || '—'}</div>
          </div>
        );
        
      case 'Registro de Vacas':
        return (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><span className="font-semibold">Vaca:</span> {event['VACA-TLINE'] || '—'}</div>
            <div><span className="font-semibold">Ação:</span> {event['DESC-TLINE'] || '—'}</div>
            <div><span className="font-semibold">Observações:</span> {event['ABS-TLINE'] || '—'}</div>
          </div>
        );
        
      default:
        return (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><span className="font-semibold">Custo:</span> {formatMoney(event['CUST-TLINE'] || '0')}</div>
            <div><span className="font-semibold">Descrição:</span> {event['DESC-TLINE'] || '—'}</div>
            {event['VET-TLINE'] && <div><span className="font-semibold">Veterinário:</span> {event['VET-TLINE']}</div>}
            <div><span className="font-semibold">Observações:</span> {event['ABS-TLINE'] || '—'}</div>
          </div>
        );
    }
  };

  // Function to render modal form based on event type
  const renderModalForm = (eventType: string) => {
    const categories = {
      'Gastos': ['Ração', 'Veterinário', 'Estrutura', 'Combustível', 'Medicamentos', 'Equipamentos', 'Silagem', 'Outros'],
      'Lucros': ['Venda de Leite', 'Venda de Bezerro', 'Venda de Vaca', 'Outros'],
      'Media Vaca': ['Manhã', 'Tarde', 'Noite'],
      'Produção Diária': ['Manhã', 'Tarde', 'Noite']
    };

    switch (eventType) {
      case 'Media Vaca':
        return (
          <>
            <div>
              <Label htmlFor="vaca">Vaca</Label>
              <Select value={formData.vaca} onValueChange={value => setFormData(prev => ({ ...prev, vaca: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vacas.map(vaca => (
                    <SelectItem key={vaca.id} value={vaca['NOME-VACA']}>
                      {vaca['NOME-VACA']} {vaca['BRINCO-VACA'] && `(${vaca['BRINCO-VACA']})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="litros">Litros produzidos</Label>
                <Input
                  id="litros"
                  type="number"
                  step="0.01"
                  value={formData.litros}
                  onChange={(e) => setFormData(prev => ({ ...prev, litros: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="periodo">Período</Label>
                <Select value={formData.periodo} onValueChange={value => setFormData(prev => ({ ...prev, periodo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories['Media Vaca']?.map(periodo => (
                      <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
              />
            </div>
          </>
        );

      case 'Produção Diária':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="litros">Litros produzidos</Label>
                <Input
                  id="litros"
                  type="number"
                  step="0.01"
                  value={formData.litros}
                  onChange={(e) => setFormData(prev => ({ ...prev, litros: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="periodo">Período</Label>
                <Select value={formData.periodo} onValueChange={value => setFormData(prev => ({ ...prev, periodo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories['Produção Diária']?.map(periodo => (
                      <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
              />
            </div>
          </>
        );

      case 'Gastos':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={formData.categoria} onValueChange={value => setFormData(prev => ({ ...prev, categoria: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories['Gastos']?.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="custo">Valor (R$)</Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  value={formData.custo}
                  onChange={(e) => setFormData(prev => ({ ...prev, custo: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o gasto..."
              />
            </div>

            <div>
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                value={formData.fornecedor}
                onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                placeholder="Nome do fornecedor"
              />
            </div>
          </>
        );

      case 'Lucros':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={formData.categoria} onValueChange={value => setFormData(prev => ({ ...prev, categoria: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories['Lucros']?.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="custo">Valor (R$)</Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  value={formData.custo}
                  onChange={(e) => setFormData(prev => ({ ...prev, custo: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o lucro..."
              />
            </div>

            <div>
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                value={formData.cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
          </>
        );

      case 'Registro de Vacas':
        return (
          <>
            <div>
              <Label htmlFor="vaca">Vaca</Label>
              <Select value={formData.vaca} onValueChange={value => setFormData(prev => ({ ...prev, vaca: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vacas.map(vaca => (
                    <SelectItem key={vaca.id} value={vaca['NOME-VACA']}>
                      {vaca['NOME-VACA']} {vaca['BRINCO-VACA'] && `(${vaca['BRINCO-VACA']})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricao">Ação realizada</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva a ação realizada..."
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
              />
            </div>
          </>
        );

      default: // Veterinary events, births, etc.
        return (
          <>
            <div>
              <Label htmlFor="vaca">Vaca</Label>
              <Select value={formData.vaca} onValueChange={value => setFormData(prev => ({ ...prev, vaca: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vacas.map(vaca => (
                    <SelectItem key={vaca.id} value={vaca['NOME-VACA']}>
                      {vaca['NOME-VACA']} {vaca['BRINCO-VACA'] && `(${vaca['BRINCO-VACA']})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o evento..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="veterinario">Veterinário</Label>
                <Input
                  id="veterinario"
                  value={formData.veterinario}
                  onChange={(e) => setFormData(prev => ({ ...prev, veterinario: e.target.value }))}
                  placeholder="Nome do veterinário"
                />
              </div>
              <div>
                <Label htmlFor="custo">Custo (R$)</Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  value={formData.custo}
                  onChange={(e) => setFormData(prev => ({ ...prev, custo: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
              />
            </div>
          </>
        );
    }
  };
  const addDays = (dateStr: string, days: number) => {
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const getRangeFromPeriod = (period: string) => {
    const today = new Date().toISOString().slice(0, 10);
    switch (period) {
      case 'hoje':
        return {
          start: today,
          end: today
        };
      case 'ontem':
        const yesterday = addDays(today, -1);
        return {
          start: yesterday,
          end: yesterday
        };
      case '7':
        return {
          start: addDays(today, -6),
          end: today
        };
      case '15':
        return {
          start: addDays(today, -14),
          end: today
        };
      case '30':
        return {
          start: addDays(today, -29),
          end: today
        };
      default:
        return {
          start: today,
          end: today
        };
    }
  };
  const loadVacas = async () => {
    try {
      const url = `${SUPABASE_URL}/rest/v1/VACAS?select=id,"NOME-VACA","BRINCO-VACA",CLASSE&CLASSE=eq.VACAS-REG`;
      const response = await fetch(url, {
        headers
      });
      const data = await response.json();
      setVacas(data || []);
      if (data.length > 0 && !formData.vaca) {
        setFormData(prev => ({
          ...prev,
          vaca: data[0]['NOME-VACA'] || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar vacas:', error);
    }
  };
  const loadTimeline = async () => {
    try {
      const range = getRangeFromPeriod(filters.periodo);
      const params = new URLSearchParams({
        'select': '*',
        'CLASSE': 'eq.TLINE',
        'order': 'DATA-TLINE.desc'
      });
      params.append('and', `(DATA-TLINE.gte.${range.start},DATA-TLINE.lte.${range.end})`);
      if (filters.tipo !== '__all__') {
        params.append('EVENTO-TLINE', `eq.${filters.tipo}`);
      }
      const url = `${SUPABASE_URL}/rest/v1/VACAS?${params.toString()}`;
      const response = await fetch(url, {
        headers
      });
      const data = await response.json();
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
    }
  };
  const handleSaveEvent = async () => {
    try {
      const currentTime = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const payload: any = {
        'CLASSE': 'TLINE',
        'DATA-TLINE': formData.data,
        'VACA-TLINE': formData.vaca,
        'EVENTO-TLINE': formData.tipo,
        'DESC-TLINE': formData.descricao || null,
        'VET-TLINE': formData.veterinario || null,
        'CUST-TLINE': formData.custo || null,
        'ABS-TLINE': formData.observacoes || null,
        'HORA-GERAL': currentTime
      };

      // Adicionar campos específicos baseados no tipo de evento
      switch (formData.tipo) {
        case 'Gastos':
          payload['DATA-GAST-TLINE'] = formData.data;
          payload['HORA-GAST-TLINE'] = currentTime;
          payload['VALOR-GAST-TLINE'] = formData.custo;
          payload['CATE-GAST-TLINE'] = formData.categoria;
          payload['FORN-GAST-TLINE'] = formData.fornecedor;
          break;
        
        case 'Lucros':
          payload['DATA-LUCRO-TLINE'] = formData.data;
          payload['HORA-LUCRO-TLINE'] = currentTime;
          payload['VALOR-LUCRO-TLINE'] = formData.custo;
          payload['TIPO-LUCRO-TLINE'] = formData.categoria;
          payload['CLIE-LUCRO-TLINE'] = formData.cliente;
          break;
        
        case 'Media Vaca':
          payload['DATA-MD-TLINE'] = formData.data;
          payload['HORA-MD-TLINE'] = currentTime;
          payload['VACA-MD-TLINE'] = formData.vaca;
          payload['LT-MD-TLINE'] = formData.litros;
          payload['PER-MD-TLINE'] = formData.periodo;
          break;
        
        case 'Produção Diária':
          payload['DATA-PD-TLINE'] = formData.data;
          payload['HORA-PD-TLINE'] = currentTime;
          payload['LT-PD-TLINE'] = formData.litros;
          payload['PER-PD-TLINE'] = formData.periodo;
          break;
      }

      let response;
      if (editingEvent) {
        // Atualizar evento existente
        response = await fetch(`${SUPABASE_URL}/rest/v1/VACAS?id=eq.${editingEvent.id}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Criar novo evento
        response = await fetch(`${SUPABASE_URL}/rest/v1/VACAS`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        // Também salvar na tabela PROD-LEITE para gastos e lucros
        if (formData.tipo === 'Gastos' || formData.tipo === 'Lucros') {
          const prodPayload: any = {
            DIA: formData.data,
            CLASSE: formData.tipo === 'Gastos' ? 'GASTO' : 'LUCRO'
          };
          
          if (formData.tipo === 'Gastos') {
            prodPayload['VALOR-GAST'] = formData.custo;
          } else {
            prodPayload['VALOR-LUCRO'] = formData.custo;
          }
          
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/PROD-LEITE`, {
              method: 'POST',
              headers: {
                ...headers,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(prodPayload)
            });
          } catch (error) {
            console.error('Erro ao salvar na tabela PROD-LEITE:', error);
          }
        }
        
        // Também salvar produção na tabela PROD-LEITE para Media Vaca e Produção Diária
        if (formData.tipo === 'Media Vaca' || formData.tipo === 'Produção Diária') {
          const prodPayload = {
            DIA: formData.data,
            'HORA-PROD': new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            'LITROS-PROD': formData.litros,
            CLASSE: 'PROD-LEITE'
          };
          
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/PROD-LEITE`, {
              method: 'POST',
              headers: {
                ...headers,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(prodPayload)
            });
          } catch (error) {
            console.error('Erro ao salvar produção na tabela PROD-LEITE:', error);
          }
        }
        
        setIsModalOpen(false);
        setEditingEvent(null);
        setFormData({
          data: new Date().toISOString().slice(0, 10),
          vaca: vacas[0]?.['NOME-VACA'] || '',
          tipo: 'Outros',
          descricao: '',
          veterinario: '',
          custo: '',
          observacoes: '',
          categoria: '',
          fornecedor: '',
          cliente: '',
          litros: '',
          periodo: ''
        });
        loadTimeline();
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    }
  };

  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event);
    
    // Determinar os valores com base no tipo de evento
    let categoria = '';
    let fornecedor = '';
    let cliente = '';
    let litros = '';
    let periodo = '';
    
    switch (event['EVENTO-TLINE']) {
      case 'Gastos':
        categoria = event['CATE-GAST-TLINE'] || '';
        fornecedor = event['FORN-GAST-TLINE'] || '';
        break;
      case 'Lucros':
        categoria = event['TIPO-LUCRO-TLINE'] || '';
        cliente = event['CLIE-LUCRO-TLINE'] || '';
        break;
      case 'Media Vaca':
        litros = event['LT-MD-TLINE'] || '';
        periodo = event['PER-MD-TLINE'] || '';
        break;
      case 'Produção Diária':
        litros = event['LT-PD-TLINE'] || '';
        periodo = event['PER-PD-TLINE'] || '';
        break;
    }
    
    setFormData({
      data: event['DATA-TLINE'],
      vaca: event['VACA-TLINE'],
      tipo: event['EVENTO-TLINE'],
      descricao: event['DESC-TLINE'] || '',
      veterinario: event['VET-TLINE'] || '',
      custo: event['CUST-TLINE'] || event['VALOR-GAST-TLINE'] || event['VALOR-LUCRO-TLINE'] || '',
      observacoes: event['ABS-TLINE'] || '',
      categoria,
      fornecedor,
      cliente,
      litros,
      periodo
    });
    setIsModalOpen(true);
  };

  const handleNewEvent = () => {
    setEditingEvent(null);
    setFormData({
      data: new Date().toISOString().slice(0, 10),
      vaca: vacas[0]?.['NOME-VACA'] || '',
      tipo: 'Outros',
      descricao: '',
      veterinario: '',
      custo: '',
      observacoes: '',
      categoria: '',
      fornecedor: '',
      cliente: '',
      litros: '',
      periodo: ''
    });
    setIsModalOpen(true);
  };
  const handleDeleteEvent = (id: number) => {
    setEventToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      // Buscar o evento para pegar o código único
      const eventToDeleteObj = events.find(event => event.id === eventToDelete);
      
      if (eventToDeleteObj && eventToDeleteObj.CODE) {
        // Se tem código único, deletar em ambas as planilhas
        const success = await deletarRegistroVinculado(eventToDeleteObj.CODE);
        if (success) {
          loadTimeline();
        } else {
          console.error('Erro ao deletar registros vinculados');
        }
      } else {
        // Se não tem código, deletar apenas da tabela VACAS (método antigo)
        const response = await fetch(`${SUPABASE_URL}/rest/v1/VACAS?id=eq.${eventToDelete}`, {
          method: 'DELETE',
          headers
        });
        if (response.ok) {
          loadTimeline();
        }
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };
  useEffect(() => {
    loadVacas();
  }, []);
  useEffect(() => {
    if (vacas.length > 0) {
      loadTimeline();
    }
  }, [filters, vacas]);
  const totalCost = events.reduce((acc, event) => acc + (Number(event['CUST-TLINE']) || 0), 0);
  const range = getRangeFromPeriod(filters.periodo);
  const getPeriodLabel = () => {
    switch (filters.periodo) {
      case 'hoje':
        return 'Hoje';
      case 'ontem':
        return 'Ontem';
      default:
        return `Últimos ${filters.periodo} dias`;
    }
  };
  return <div className="min-h-screen bg-historico-bg">
    <FarmDashboard title="Histórico">
      <div className="space-y-6">
        {/* Header com actions - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-historico/30 backdrop-blur-sm border border-historico-border rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-historico flex items-center justify-center shadow-lg">
              <Clock3 className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Timeline de Eventos</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Histórico de eventos das vacas</p>
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button onClick={handleNewEvent} className="bg-gradient-historico hover:bg-gradient-historico/80 text-foreground border-0 shadow-lg">
              <Plus className="w-4 h-4" />
              Novo Evento
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-gradient-historico/20 border-historico-border shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Filtro por tipo (evento)</Label>
                <Select value={filters.tipo} onValueChange={value => setFilters(prev => ({
                ...prev,
                tipo: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos os tipos</SelectItem>
                    {eventTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Período</Label>
                <Select value={filters.periodo} onValueChange={value => setFilters(prev => ({
                ...prev,
                periodo: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                
              </div>
            </div>
            <div className="text-sm">
              Registros: <span className="font-bold">{events.length}</span> • Total em custos: <span className="font-bold">{formatMoney(totalCost)}</span>
            </div>
            
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="bg-gradient-historico/20 border-historico-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {events.length === 0 ? <p className="text-muted-foreground text-center py-8">Sem eventos para o filtro selecionado.</p> : <div className="space-y-4">
                {events.map(event => {
              return <div key={event.id} className="flex gap-4 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl shadow-sm">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getEventColor(event['EVENTO-TLINE'] || 'Outros')} flex items-center justify-center shadow-md flex-shrink-0`}>
                        {getEventIcon(event['EVENTO-TLINE'] || 'Outros')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <h3 className="font-bold text-lg text-foreground">{event['EVENTO-TLINE']}</h3>
                        </div>
                        {renderEventCardContent(event)}
                        <div className="flex gap-4 mt-3">
                          <button onClick={() => handleEditEvent(event)} className="text-primary hover:text-primary/80 text-sm flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            Editar
                          </button>
                          <button onClick={() => handleDeleteEvent(event.id)} className="text-destructive hover:text-destructive/80 text-sm flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>;
            })}
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Modal de edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar Evento' : 'Novo Evento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de evento</Label>
                <Select value={formData.tipo} onValueChange={value => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {renderModalForm(formData.tipo)}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEvent}>
                {editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </FarmDashboard>
  </div>;
}