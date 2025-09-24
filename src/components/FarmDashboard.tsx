import { Card, CardContent } from "@/components/ui/card";
interface DashboardProps {
  children?: React.ReactNode;
  title?: string;
}
export default function FarmDashboard({
  children,
  title = "Home"
}: DashboardProps) {
  return <div className="min-h-screen bg-gradient-hero w-full overflow-x-hidden bg-white">
      {/* Mobile Optimized Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-10">
        <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground tracking-tight truncate">{title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gestão inteligente da fazenda</p>
            </div>
            
            {/* Status indicator - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-success/10 border border-success/20 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-gradient-success animate-pulse"></div>
              <span className="text-xs font-medium text-success">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area - Mobile Optimized */}
      <main className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8 w-full overflow-x-hidden bg-white">
        <div className="max-w-7xl mx-auto w-full">
          {children || <Card className="bg-gradient-card border-0 shadow-lg overflow-hidden">
              <CardContent className="px-4 py-8 sm:px-6 sm:py-10 lg:px-16 lg:py-20">
                <div className="text-center space-y-4 sm:space-y-6 max-w-2xl mx-auto">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-gradient-primary rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl">
                      <span className="text-2xl sm:text-3xl lg:text-4xl">🏡</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-success rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
                      Bem-vindo à Fazenda
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                      Central de controle inteligente para gestão completa da sua propriedade rural
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center pt-2 sm:pt-4">
                    <span className="px-2 sm:px-3 py-1 bg-gradient-success/10 text-success text-xs sm:text-sm font-medium rounded-full border border-success/20">
                      Produção Ativa
                    </span>
                    <span className="px-2 sm:px-3 py-1 bg-gradient-accent/10 text-info text-xs sm:text-sm font-medium rounded-full border border-info/20">
                      Monitoramento 24/7
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>}
        </div>
      </main>
    </div>;
}