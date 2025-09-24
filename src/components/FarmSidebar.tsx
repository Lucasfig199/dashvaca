import { Home, Milk, DollarSign, TrendingUp, BookOpen, Clock3 } from "lucide-react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Milk, label: "Media Vaca", href: "/producao" },
  { icon: Milk, label: "Produção Diária", href: "/producao-diaria" },
  { icon: DollarSign, label: "Gastos", href: "/gastos" },
  { icon: TrendingUp, label: "Lucros", href: "/lucros" },
  { icon: BookOpen, label: "Registro de Vacas", href: "/registro-vacas" },
  { icon: Clock3, label: "Histórico", href: "/historico" },
];

export default function FarmSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full">
        {/* Brand */}
        <div className={`flex items-center py-3 border-b border-sidebar-border ${
          state === "expanded" ? "gap-3 px-4" : "justify-center px-2"
        }`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <Milk className="w-4 h-4 text-primary-foreground" />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-semibold text-sidebar-foreground leading-tight">Painel Fazenda</h1>
              <p className="text-xs text-muted-foreground leading-tight">Gestão completa</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} className="h-10">
                        <NavLink 
                          to={item.href} 
                          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Footer */}
        {state === "expanded" && (
          <div className="mt-auto px-4 py-3 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">© 2025 Fazenda</p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}