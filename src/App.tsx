import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FarmSidebar from "./components/FarmSidebar";
import Index from "./pages/Index";
import ProductionPage from "./pages/ProductionPage";
import ProducaoDiariaPage from "./pages/ProducaoDiariaPage";
import ExpensesPage from "./pages/ExpensesPage";
import ProfitsPage from "./pages/ProfitsPage";
import RegistroVacasPage from "./pages/RegistroVacasPage";
import HistoricoPage from "./pages/HistoricoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <FarmSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-12 sm:h-14 flex items-center border-b border-border/50 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60 sticky top-0 z-20">
                <SidebarTrigger className="ml-2 sm:ml-4 p-2 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors h-12 w-12 sm:h-10 sm:w-10" />
              </header>
              <main className="flex-1 overflow-hidden">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/producao" element={<ProductionPage />} />
                  <Route path="/producao-diaria" element={<ProducaoDiariaPage />} />
                  <Route path="/gastos" element={<ExpensesPage />} />
                  <Route path="/lucros" element={<ProfitsPage />} />
                  <Route path="/registro-vacas" element={<RegistroVacasPage />} />
                  <Route path="/historico" element={<HistoricoPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
