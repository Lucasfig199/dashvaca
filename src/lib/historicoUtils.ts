// Utility functions for automatic history logging

const SUPABASE_URL = 'https://bdtiipdmmgwuqjuhektq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdGlpcGRtbWd3dXFqdWhla3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ3NTksImV4cCI6MjA2Mzg2MDc1OX0.Z_W2sdcx49B2hr6u6PZRcyJXZJAtXNVg3yyRssiTwFg';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * Gera um código único para vincular registros entre planilhas
 */
const gerarCodigoUnico = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`;
};

interface HistoricoData {
  evento: string; // Nome da aba (Media Vaca, Produção Diária, etc.)
  data: string; // Data do registro
  vaca?: string; // Nome da vaca (opcional, dependendo do tipo)
  descricao?: string; // Descrição do que foi registrado
  valor?: string; // Valor monetário (para gastos/lucros)
  observacoes?: string; // Observações adicionais
}

/**
 * Registra automaticamente um evento no histórico
 */
export const registrarNoHistorico = async (data: HistoricoData): Promise<boolean> => {
  try {
    const payload = {
      'CLASSE': 'TLINE',
      'DATA-TLINE': data.data,
      'VACA-TLINE': data.vaca || null,
      'EVENTO-TLINE': data.evento,
      'DESC-TLINE': data.descricao || null,
      'VET-TLINE': null, // Não aplicável para registros automáticos
      'CUST-TLINE': data.valor || null,
      'ABS-TLINE': data.observacoes || null,
      'HORA-GERAL': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/VACAS`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao registrar no histórico:', error);
    return false;
  }
};

/**
 * Utilitários para diferentes tipos de registro
 */

// Para Media Vaca (ProductionPage)
export const registrarMediaVacaNoHistorico = async (data: {
  data: string;
  vaca: string;
  litros: number;
  periodo: string;
  observacoes?: string;
}): Promise<string | null> => {
  const codigoUnico = gerarCodigoUnico();
  
  try {
    // Payload para a tabela VACAS (timeline)
    const payloadVacas = {
      'DATA-MD-TLINE': data.data,
      'HORA-MD-TLINE': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'VACA-MD-TLINE': data.vaca,
      'LT-MD-TLINE': String(data.litros),
      'PER-MD-TLINE': data.periodo,
      'CLASSE': 'TLINE',
      'EVENTO-TLINE': 'Media Vaca',
      'DESC-TLINE': `Produção registrada: ${data.litros}L - ${data.periodo}`,
      'ABS-TLINE': data.observacoes || null,
      'VACA-TLINE': data.vaca,
      'DATA-TLINE': data.data,
      'HORA-GERAL': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'CODE': codigoUnico
    };

    // Payload para a tabela PROD-LEITE
    const payloadProdLeite = {
      DIA: data.data,
      'HORA-PROD': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'LITROS-PROD': String(data.litros),
      'PERIODO-PROD': data.periodo,
      'VACA-PROD': data.vaca,
      'OBS-PROD': data.observacoes || null,
      CLASSE: 'MED-VACA',
      'CODE': codigoUnico
    };

    // Salvar em ambas as tabelas
    const [responseVacas, responseProdLeite] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/VACAS`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadVacas)
      }),
      fetch(`${SUPABASE_URL}/rest/v1/PROD-LEITE`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadProdLeite)
      })
    ]);

    if (responseVacas.ok && responseProdLeite.ok) {
      return codigoUnico;
    } else {
      console.error('Erro ao salvar em uma das tabelas');
      return null;
    }
  } catch (error) {
    console.error('Erro ao registrar media vaca:', error);
    return null;
  }
};

// Para Produção Diária
export const registrarProducaoDiariaNoHistorico = async (data: {
  data: string;
  litros: number;
  periodo: string;
  observacoes?: string;
}): Promise<string | null> => {
  const codigoUnico = gerarCodigoUnico();
  
  try {
    // Payload para a tabela VACAS (timeline)
    const payloadVacas = {
      'DATA-PD-TLINE': data.data,
      'HORA-PD-TLINE': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'LT-PD-TLINE': String(data.litros),
      'PER-PD-TLINE': data.periodo,
      'CLASSE': 'TLINE',
      'EVENTO-TLINE': 'Produção Diária',
      'DESC-TLINE': `Produção diária registrada: ${data.litros}L - ${data.periodo}`,
      'ABS-TLINE': data.observacoes || null,
      'DATA-TLINE': data.data,
      'HORA-GERAL': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'CODE': codigoUnico
    };

    // Payload para a tabela PROD-LEITE
    const payloadProdLeite = {
      'DATA-MED': data.data,
      'HORA-MED': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'LITROS-MED': String(data.litros),
      'PERIODO-MED': data.periodo,
      'OBS-MED': data.observacoes || null,
      CLASSE: 'PROD-DIA',
      'CODE': codigoUnico
    };

    // Salvar em ambas as tabelas
    const [responseVacas, responseProdLeite] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/VACAS`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadVacas)
      }),
      fetch(`${SUPABASE_URL}/rest/v1/PROD-LEITE`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadProdLeite)
      })
    ]);

    if (responseVacas.ok && responseProdLeite.ok) {
      return codigoUnico;
    } else {
      console.error('Erro ao salvar em uma das tabelas');
      return null;
    }
  } catch (error) {
    console.error('Erro ao registrar produção diária:', error);
    return null;
  }
};

// Para Gastos
export const registrarGastoNoHistorico = async (data: {
  data: string;
  valor: number;
  categoria: string;
  descricao?: string;
  fornecedor?: string;
}): Promise<string | null> => {
  const codigoUnico = gerarCodigoUnico();
  
  try {
    // Payload para a tabela VACAS (timeline)
    const payloadVacas = {
      'CLASSE': 'TLINE',
      'DATA-TLINE': data.data,
      'EVENTO-TLINE': 'Gastos',
      'DESC-TLINE': `Gasto registrado: ${data.categoria}${data.descricao ? ` - ${data.descricao}` : ''}`,
      'CUST-TLINE': data.valor.toString(),
      'ABS-TLINE': data.fornecedor ? `Fornecedor: ${data.fornecedor}` : null,
      'HORA-GERAL': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      // Campos específicos para gastos na timeline
      'DATA-GAST-TLINE': data.data,
      'HORA-GAST-TLINE': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'VALOR-GAST-TLINE': data.valor.toString(),
      'CATE-GAST-TLINE': data.categoria,
      'FORN-GAST-TLINE': data.fornecedor || null,
      'CODE': codigoUnico
    };

    // Payload para a tabela PROD-LEITE
    const payloadProdLeite = {
      DIA: data.data,
      CLASSE: 'GASTO',
      'VALOR-GAST': data.valor.toString(),
      'CATEGO-GAST': data.categoria,
      'DESCRI-GAST': data.descricao || null,
      'FORN-GAST': data.fornecedor || null,
      'HORA-GAST': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'CODE': codigoUnico
    };

    // Salvar em ambas as tabelas
    const [responseVacas, responseProdLeite] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/VACAS`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadVacas)
      }),
      fetch(`${SUPABASE_URL}/rest/v1/PROD-LEITE`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadProdLeite)
      })
    ]);

    if (responseVacas.ok && responseProdLeite.ok) {
      return codigoUnico;
    } else {
      console.error('Erro ao salvar em uma das tabelas');
      return null;
    }
  } catch (error) {
    console.error('Erro ao registrar gasto:', error);
    return null;
  }
};

// Para Lucros
export const registrarLucroNoHistorico = async (data: {
  data: string;
  valor: number;
  categoria: string;
  descricao?: string;
  cliente?: string;
}): Promise<string | null> => {
  const codigoUnico = gerarCodigoUnico();
  
  try {
    // Payload para a tabela VACAS (timeline)
    const payloadVacas = {
      'CLASSE': 'TLINE',
      'DATA-TLINE': data.data,
      'EVENTO-TLINE': 'Lucros',
      'DESC-TLINE': `Lucro registrado: ${data.categoria}${data.descricao ? ` - ${data.descricao}` : ''}`,
      'CUST-TLINE': data.valor.toString(),
      'ABS-TLINE': data.cliente ? `Cliente: ${data.cliente}` : null,
      'HORA-GERAL': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      // Campos específicos para lucros na timeline
      'DATA-LUCRO-TLINE': data.data,
      'HORA-LUCRO-TLINE': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'VALOR-LUCRO-TLINE': data.valor.toString(),
      'TIPO-LUCRO-TLINE': data.categoria,
      'CLIE-LUCRO-TLINE': data.cliente || null,
      'CODE': codigoUnico
    };

    // Payload para a tabela PROD-LEITE
    const payloadProdLeite = {
      DIA: data.data,
      CLASSE: 'LUCRO',
      'VALOR-LUCRO': data.valor.toString(),
      'CATEGO-LUCRO': data.categoria,
      'DESCRI-LUCRO': data.descricao || null,
      'CLIEN-LUCRO': data.cliente || null,
      'HORA-LUCRO': new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'CODE': codigoUnico
    };

    // Salvar em ambas as tabelas
    const [responseVacas, responseProdLeite] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/VACAS`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadVacas)
      }),
      fetch(`${SUPABASE_URL}/rest/v1/PROD-LEITE`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadProdLeite)
      })
    ]);

    if (responseVacas.ok && responseProdLeite.ok) {
      return codigoUnico;
    } else {
      console.error('Erro ao salvar em uma das tabelas');
      return null;
    }
  } catch (error) {
    console.error('Erro ao registrar lucro:', error);
    return null;
  }
};

// Para Registro de Vacas
export const registrarVacaNoHistorico = (data: {
  data: string;
  nomeVaca: string;
  acao: 'cadastro' | 'edicao' | 'exclusao';
  observacoes?: string;
}) => {
  const acaoTexto = {
    'cadastro': 'Nova vaca cadastrada',
    'edicao': 'Dados da vaca atualizados',
    'exclusao': 'Vaca removida do rebanho'
  };

  return registrarNoHistorico({
    evento: 'Registro de Vacas',
    data: data.data,
    vaca: data.nomeVaca,
    descricao: acaoTexto[data.acao],
    observacoes: data.observacoes
  });
};

/**
 * Deleta registros vinculados pelo código único em ambas as planilhas
 */
export const deletarRegistroVinculado = async (codigo: string): Promise<boolean> => {
  try {
    // Deletar da tabela VACAS (timeline)
    const deleteVacas = fetch(`${SUPABASE_URL}/rest/v1/VACAS?CODE=eq.${codigo}`, {
      method: 'DELETE',
      headers
    });

    // Deletar da tabela PROD-LEITE
    const deleteProdLeite = fetch(`${SUPABASE_URL}/rest/v1/PROD-LEITE?CODE=eq.${codigo}`, {
      method: 'DELETE',
      headers
    });

    const [responseVacas, responseProdLeite] = await Promise.all([deleteVacas, deleteProdLeite]);

    return responseVacas.ok && responseProdLeite.ok;
  } catch (error) {
    console.error('Erro ao deletar registros vinculados:', error);
    return false;
  }
};