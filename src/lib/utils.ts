import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar data para exibição brasileira (dd/mm/yyyy)
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';
  
  // Se a data já está no formato brasileiro (dd/mm/yyyy), retorna como está
  if (dateString.includes('/')) return dateString;
  
  // Converte de formato ISO (yyyy-mm-dd) para brasileiro (dd/mm/yyyy)
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}
