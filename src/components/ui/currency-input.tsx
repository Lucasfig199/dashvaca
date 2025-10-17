import * as React from "react";
import { cn } from "@/lib/utils";
import { useCurrencyMask } from "@/hooks/useCurrencyMask";

export interface CurrencyInputProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: number;
  onValueChange?: (value: number) => void;
  showCurrencySymbol?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLDivElement, CurrencyInputProps>(
  ({ className, value = 0, onValueChange, showCurrencySymbol = false, placeholder, disabled, ...props }, ref) => {
    const { displayValue, numericValue, handleKeyDown, handleInput, setValue, inputRef } = useCurrencyMask(value);
    const [isInitialized, setIsInitialized] = React.useState(false);

    // Inicializar apenas uma vez
    React.useEffect(() => {
      if (!isInitialized && value !== undefined) {
        setValue(value);
        setIsInitialized(true);
      }
    }, [value, setValue, isInitialized]);

    // Notificar mudanças apenas quando necessário
    React.useEffect(() => {
      if (isInitialized && onValueChange && numericValue !== value) {
        onValueChange(numericValue);
      }
    }, [numericValue, onValueChange, isInitialized, value]);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      
      // Extrair apenas números do texto colado
      const numbers = pastedText.replace(/\D/g, '');
      if (numbers) {
        const newValue = Math.min(parseInt(numbers) / 100, 99999999.99);
        setValue(newValue);
      }
    };

    const handleFocus = () => {
      if (inputRef.current) {
        // Mover cursor para o final
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    };

    return (
      <div 
        ref={ref}
        className={cn(
          "relative flex h-10 w-full rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        {...props}
      >
        {showCurrencySymbol && (
          <span className="flex items-center px-3 text-sm text-muted-foreground font-medium">
            R$
          </span>
        )}
        
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed font-mono"
          value={displayValue}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          inputMode="numeric"
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };