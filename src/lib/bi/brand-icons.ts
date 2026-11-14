import { Briefcase, Building2, Car, Coffee, Cpu, Gem, GraduationCap, HeartPulse, Home, Leaf, Package, Plane, Rocket, ShoppingBag, Store, Utensils, type LucideIcon } from "lucide-react";

export const BRAND_ICONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "store", label: "Loja", icon: Store },
  { key: "shopping-bag", label: "Varejo", icon: ShoppingBag },
  { key: "cpu", label: "Tecnologia", icon: Cpu },
  { key: "graduation-cap", label: "Educação", icon: GraduationCap },
  { key: "heart-pulse", label: "Saúde", icon: HeartPulse },
  { key: "building", label: "Corporativo", icon: Building2 },
  { key: "briefcase", label: "Serviços", icon: Briefcase },
  { key: "leaf", label: "Agro / Sustentável", icon: Leaf },
  { key: "rocket", label: "Startup", icon: Rocket },
  { key: "home", label: "Imobiliário", icon: Home },
  { key: "utensils", label: "Alimentação", icon: Utensils },
  { key: "coffee", label: "Café", icon: Coffee },
  { key: "car", label: "Automotivo", icon: Car },
  { key: "plane", label: "Turismo", icon: Plane },
  { key: "package", label: "Logística", icon: Package },
  { key: "gem", label: "Luxo", icon: Gem },
];

export function getBrandIcon(key: string | undefined): LucideIcon | undefined {
  return BRAND_ICONS.find((i) => i.key === key)?.icon;
}
