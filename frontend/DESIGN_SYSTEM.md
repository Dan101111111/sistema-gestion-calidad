# Sistema de Diseño - SGC UNT v2.0

## 🎨 Sistema de Colores por Tokens

### Tokens Principales
El sistema usa variables CSS HSL para soporte nativo de modo claro y oscuro.

#### Primary (Azul Navy)
- **Uso**: Sidebar, elementos principales, acciones primarias
- **Light mode**: `hsl(217 91% 20%)` (#0A2540)
- **Dark mode**: `hsl(217 91% 45%)` (más claro para contraste)
- **Variantes**: `primary-light`, `primary-dark`

#### Secondary (Azul Eléctrico)
- **Uso**: CTAs, highlights, elementos interactivos
- **Light mode**: `hsl(217 100% 50%)` (#0066FF)
- **Dark mode**: `hsl(217 100% 60%)` (más claro para visibilidad)
- **Variantes**: `secondary-light`, `secondary-dark`

#### Accent (Cyan)
- **Uso**: Detalles, información secundaria
- **Light mode**: `hsl(187 100% 50%)` (#00C2FF)
- **Dark mode**: `hsl(187 100% 60%)` (más claro)
- **Variantes**: `accent-light`, `accent-dark`

#### Success (Mint)
- **Uso**: Estados positivos, confirmaciones
- **Light mode**: `hsl(167 100% 42%)` (#00D4AA)
- **Dark mode**: `hsl(167 100% 52%)` (más claro)
- **Variantes**: `success-light`, `success-dark`

#### Warning (Amber)
- **Uso**: Advertencias, atención requerida
- **Light mode**: `hsl(43 93% 58%)` (#F7B731)
- **Dark mode**: `hsl(43 93% 68%)` (más claro)
- **Variantes**: `warning-light`, `warning-dark`

#### Destructive (Red)
- **Uso**: Errores, estados críticos, acciones destructivas
- **Light mode**: `hsl(0 84% 60%)` (#DC2626)
- **Dark mode**: `hsl(0 84% 70%)` (más claro)
- **Variantes**: `destructive-light`, `destructive-dark`

#### Neutros
- **Background**: `hsl(var(--background))`
- **Foreground**: `hsl(var(--foreground))`
- **Muted**: `hsl(var(--muted))` / `hsl(var(--muted-foreground))`
- **Border**: `hsl(var(--border))`
- **Card**: `hsl(var(--card))` / `hsl(var(--card-foreground))`

### Uso en Tailwind
```tsx
// Clases de colores
className="bg-primary text-primary-foreground"
className="bg-primary/10 text-primary" // Variante con opacidad
className="text-muted-foreground" // Texto secundario
className="border-border" // Bordes
className="bg-card text-card-foreground" // Cards
```

## 🎭 Animaciones

### Animaciones Disponibles
- `animate-fade-in`: Aparece con opacidad (200ms)
- `animate-fade-in-up`: Aparece desde abajo (300ms)
- `animate-slide-in`: Desliza desde izquierda (250ms)
- `animate-scale-in`: Escala desde 0.95 (200ms)
- `animate-bounce-subtle`: Rebote sutil (500ms)
- `animate-pulse-slow`: Pulso lento (2s)

### Transiciones
```tsx
// Hover effects
className="hover:shadow-glow-sm transition-all duration-300 hover:-translate-y-1"
className="transition-transform duration-200 group-hover:scale-110"

// Focus states
className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
```

## 📐 Efectos de Sombra

### Sombras Disponibles
- `shadow-glass`: Sutil (0 1px 3px rgba(0, 0, 0, 0.05))
- `shadow-glass-hover`: Hover (0 4px 12px rgba(0, 0, 0, 0.08))
- `shadow-elevated`: Elevado (0 8px 24px rgba(0, 0, 0, 0.12))
- `shadow-glow-sm`: Glow pequeño (0 0 8px hsla(var(--secondary), 0.15))
- `shadow-glow-md`: Glow medio (0 0 16px hsla(var(--secondary), 0.25))
- `shadow-glow-lg`: Glow grande (0 0 24px hsla(var(--secondary), 0.35))

## 🎯 Patrones de Componentes

### KPI Cards
```tsx
<KpiCard
  title="Documentos Activos"
  value={kpis?.documentos_activos ?? 0}
  icon={<FileText className="w-5 h-5" />}
  color="blue" // blue, red, green, yellow, purple, orange
  loading={isLoading}
/>
```

### Cards con Hover Effects
```tsx
<Card className="hover:shadow-glow-sm transition-all duration-300 hover:-translate-y-1">
  <CardHeader>
    <CardTitle className="tracking-tight">Título</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
</Card>
```

### Skeleton Screens
```tsx
{loading ? (
  <div className="skeleton h-56 rounded animate-pulse" />
) : (
  <div>Contenido</div>
)}
```

### Empty States
```tsx
<EmptyState 
  message="Sin datos" 
  description="No hay información disponible"
  action={<Button>Acción</Button>}
/>
```

## 📱 Responsive Breakpoints

- `sm`: 640px (móvil grande)
- `md`: 768px (tablet)
- `lg`: 1024px (laptop)
- `xl`: 1280px (desktop)
- `2xl`: 1536px (desktop grande)

### Ejemplo de Grid Responsive
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
  {/* Items */}
</div>
```

## 🔤 Tipografía

### Font Family
- **Sans**: Inter, Arial, sans-serif
- **Display**: Inter, Arial, sans-serif
- **Mono**: JetBrains Mono, Fira Code, monospace

### Clases de Tipografía
```tsx
className="tracking-tight" // Espaciado ajustado
className="font-display" // Títulos grandes
className="font-mono" // Código o datos técnicos
```

## 🎨 Glassmorphism

### Efectos de Glass
```tsx
className="bg-white/10 backdrop-blur-sm" // Fondo semitransparente con blur
className="bg-primary/20" // Variante con opacidad
```

## 🚀 Microinteracciones

### Hover en Íconos
```tsx
<div className="group">
  <Icon className="transition-transform duration-200 group-hover:scale-110" />
</div>
```

### Hover en Cards
```tsx
<Card className="group hover:-translate-y-1 hover:shadow-glow-md transition-all duration-300">
  {/* Contenido */}
</Card>
```

### Feedback en Botones
```tsx
<Button className="hover:shadow-glow-sm transition-all duration-200">
  Click me
</Button>
```

## 🌓 Modo Oscuro

El modo oscuro se activa automáticamente con la clase `.dark` en el elemento `<html>`. Todos los tokens de colores tienen variantes para modo oscuro definidas en `globals.css`.

### Verificar Modo Oscuro
```tsx
className="bg-white dark:bg-charcoal"
className="text-gray-900 dark:text-white"
```

## 📊 Gráficos (Recharts)

### Colores de Gráficos
```tsx
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))'
];
```

### Tooltip Personalizado
```tsx
<Tooltip
  contentStyle={{ 
    fontSize: 12, 
    borderRadius: 8, 
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--card))'
  }}
/>
```

## 🎯 Mejores Prácticas

1. **Usar tokens siempre**: Evita colores fijos, usa `hsl(var(--token))`
2. **Animaciones sutiles**: Duración de 200-300ms para transiciones
3. **Contraste accesible**: Verificar contraste en ambos modos
4. **Skeleton screens**: Usar para estados de carga
5. **Empty states**: Proporcionar feedback cuando no hay datos
6. **Responsive first**: Diseñar móvil primero, escalar hacia arriba
7. **Microinteracciones**: Feedback visual en hover/focus/active
8. **Tipografía consistente**: Usar tracking-tight para títulos

## 📦 Componentes UI Disponibles

- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button` (primary, secondary, danger, ghost, outline)
- `Input`, `Select`, `Textarea`
- `Badge` (default, primary, success, warning, danger, info, purple)
- `Modal`
- `Table`, `Thead`, `Tbody`, `Th`, `Td`, `Tr`
- `Skeleton`, `SkeletonCard`
- `KpiCard` (con count-up animado)
- `EmptyState`
- `Pagination`
- `ConfirmDialog`
- `EstadoBadge`
- `NivelRiesgoBadge`
- `ProgressBar`

## 🔧 Configuración

### Archivos de Configuración
- `frontend/src/app/globals.css`: Variables CSS y tokens
- `frontend/tailwind.config.ts`: Configuración de Tailwind
- `frontend/src/components/ui/index.tsx`: Componentes UI base

### Agregar Nuevos Tokens
1. Definir en `globals.css` (light y dark mode)
2. Agregar en `tailwind.config.ts` si es necesario
3. Usar con `hsl(var(--token))` en componentes
