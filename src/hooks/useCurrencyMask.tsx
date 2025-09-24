import { useState, useCallback, useRef } from 'react';

export interface UseCurrencyMaskReturn {
  displayValue: string;
  numericValue: number;
  handleInput: (e: React.FormEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setValue: (value: number) => void;
  reset: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function useCurrencyMask(initialValue: number = 0): UseCurrencyMaskReturn {
  const [centavos, setCentavos] = useState(Math.round(Math.abs(initialValue) * 100));
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Formatar centavos para exibição (1,23)
  const formatDisplayValue = useCallback((centavos: number): string => {
    const reais = centavos / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // Converter centavos para valor numérico
  const getNumericValue = useCallback((centavos: number): number => {
    return centavos / 100;
  }, []);

  // Lidar com input de números
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    const input = e.currentTarget;
    const value = input.value;
    
    // Extrair apenas dígitos
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) { // Máximo 99.999.999,99
      const newCentavos = parseInt(digits || '0');
      setCentavos(newCentavos);
    }
  }, []);

  // Lidar com teclas especiais
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key, ctrlKey, metaKey } = e;
    
    // Permitir Ctrl/Cmd + A, C, V, X, Z
    if (ctrlKey || metaKey) {
      if (['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
        return;
      }
    }
    
    // Permitir navegação
    if (['Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
      return;
    }
    
    if (key === 'Backspace') {
      e.preventDefault();
      setCentavos(prev => Math.floor(prev / 10));
      return;
    }
    
    if (key === 'Delete') {
      e.preventDefault();
      setCentavos(0);
      return;
    }
    
    // Permitir apenas dígitos
    if (!/^\d$/.test(key)) {
      e.preventDefault();
      return;
    }
    
    // Adicionar dígito
    e.preventDefault();
    const digit = parseInt(key);
    setCentavos(prev => {
      const newValue = prev * 10 + digit;
      return newValue > 9999999999 ? prev : newValue; // Máximo 99.999.999,99
    });
  }, []);

  // Definir valor programaticamente
  const setValue = useCallback((value: number) => {
    const newCentavos = Math.max(0, Math.round(Math.abs(value) * 100));
    setCentavos(newCentavos);
  }, []);

  // Reset para zero
  const reset = useCallback(() => {
    setCentavos(0);
  }, []);

  return {
    displayValue: formatDisplayValue(centavos),
    numericValue: getNumericValue(centavos),
    handleInput,
    handleKeyDown,
    setValue,
    reset,
    inputRef
  };
}