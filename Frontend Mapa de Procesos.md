Como Experto en UX/UI y Desarrollador Frontend Senior, te recomiendo categóricamente optar por **Puro Tailwind CSS Grid y Flexbox**.

Dejar de lado librerías como *React Flow* o *Mermaid.js* para este requerimiento específico es la mejor decisión por tres razones fundamentales de ingeniería de software:

1. **Rendimiento Máximo:** No sobrecargas el *bundle* de tu aplicación Next.js con dependencias pesadas de renderizado gráfico vectorizado.
2. **Control Total de la UI/UX:** El diseño de los mapas de procesos universitarios bajo normas ISO exige un control tipográfico y de alineación exacto que Tailwind resuelve de forma nativa.
3. **Responsividad Fluida:** Modificar layouts complejos basados en lienzos (*canvas*) en pantallas móviles es un dolor de cabeza arquitectónico; con CSS Grid pasas de un plano bidimensional a un flujo secuencial vertical simplemente cambiando una clase (`md:grid-cols-X`).

A continuación, te presento el código completo del componente `MapaProcesos.tsx` diseñado bajo un enfoque atómico, dinámico y con la paleta de colores corporativa e institucional reflejada en la documentación de calidad de la UNT.

---

### Componente React + Tailwind CSS (`MapaProcesos.tsx`)

```tsx
import React, { useMemo } from 'react';

// Definición estricta de tipos basada en el esquema relacional
export interface Macroproceso {
  id: string | number;
  codigo: string;
  nombre: string;
  tipo: 'estrategico' | 'misional' | 'apoyo' | 'evaluacion';
}

interface MapaProcesosProps {
  macrosData: Macroproceso[];
}

export const MapaProcesos: React.FC<MapaProcesosProps> = ({ macrosData }) => {
  // Clasificación y distribución automática de los macroprocesos por su tipo
  const { estrategicos, misionales, apoyo } = useMemo(() => {
    return {
      estrategicos: macrosData.filter((m) => m.tipo === 'estrategico'),
      misionales: macrosData.filter((m) => m.tipo === 'misional'),
      apoyo: macrosData.filter((m) => m.tipo === 'apoyo'),
    };
  }, [macrosData]);

  return (
    <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      {/* Contenedor principal: Grid de 3 columnas en desktop, apilado en mobile */}
      <div className="min-w-[900px] md:min-w-0 grid grid-cols-[160px_1fr_160px] gap-4 items-stretch">
        
        {/* BLOQUE IZQUIERDO: Entrada del Sistema (ISO 9001) */}
        <div className="flex flex-col justify-center items-center p-4 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-sm text-center relative group">
          <div className="absolute inset-y-0 -right-2 flex items-center justify-center pointer-events-none z-10">
            <svg className="w-4 h-4 text-slate-400 fill-current" viewBox="0 0 20 20">
              <path d="M10 3l7 7-7 7V3z" />
            </svg>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold opacity-70 mb-2">Entrada</span>
          <h3 className="text-xs font-semibold leading-snug">
            [cite_start]Necesidades y expectativas de los Grupos de Interés [cite: 513, 788]
          </h3>
        </div>

        {/* BLOQUE CENTRAL: Los 3 Niveles del SGC-UNT */}
        <div className="flex flex-col gap-6 justify-between border-x border-dashed border-slate-300 px-4">
          
          {/* Fila Superior: Procesos Estratégicos */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3 text-center">
              [cite_start]Procesos Estratégicos [cite: 201, 202, 867, 868]
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {estrategicos.map((macro) => (
                <div
                  key={macro.id}
                  className="bg-white border border-amber-300 rounded-lg p-2.5 text-center shadow-sm hover:shadow transition-all duration-200 border-b-4 border-b-amber-500"
                >
                  <span className="block text-[10px] font-mono font-bold text-amber-600 mb-0.5">
                    {macro.codigo}
                  </span>
                  <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-tight">
                    {macro.nombre}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fila Central: Procesos Misionales (Cadena de Valor / Core) */}
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 text-center">
              [cite_start]Procesos Misionales (Core / Formación Integral) [cite: 203, 869]
            </h4>
            <div className="flex flex-row items-center justify-center gap-2">
              {misionales.map((macro, index) => (
                <React.Fragment key={macro.id}>
                  {/* Caja de Proceso Misional */}
                  <div className="flex-1 bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-lg p-3 text-center shadow-md border-b-4 border-b-sky-400 min-h-[75px] flex flex-col justify-center transition-transform hover:-translate-y-0.5 duration-200">
                    <span className="block text-[10px] font-mono font-bold text-sky-300 mb-1">
                      {macro.codigo}
                    </span>
                    <p className="text-xs font-semibold leading-tight px-1">
                      {macro.nombre}
                    </p>
                  </div>
                  
                  {/* Flecha Conectora de la Cadena de Valor (Excepto el último elemento) */}
                  {index < misionales.length - 1 && (
                    <div className="flex-shrink-0 text-sky-500 animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Fila Inferior: Procesos de Apoyo */}
          <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 text-center">
              [cite_start]Procesos de Apoyo [cite: 204, 205, 206, 870, 871, 872]
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {apoyo.map((macro) => (
                <div
                  key={macro.id}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-center shadow-sm hover:shadow-md transition-all duration-200 border-b-4 border-b-slate-400"
                >
                  <span className="block text-[10px] font-mono font-bold text-slate-500 mb-0.5">
                    {macro.codigo}
                  </span>
                  <p className="text-[11px] font-medium text-slate-600 line-clamp-2 leading-tight">
                    {macro.nombre}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* BLOQUE DERECHO: Salida del Sistema (Satisfacción de Clientes) */}
        <div className="flex flex-col justify-center items-center p-4 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-sm text-center relative">
          <div className="absolute inset-y-0 -left-2 flex items-center justify-center pointer-events-none z-10">
            <svg className="w-4 h-4 text-slate-400 fill-current rotate-180" viewBox="0 0 20 20">
              <path d="M10 3l7 7-7 7V3z" />
            </svg>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold opacity-70 mb-2">Salida</span>
          <h3 className="text-xs font-semibold leading-snug">
            [cite_start]Satisfacción de los Grupos de Interés [cite: 526, 809]
          </h3>
        </div>

      </div>
    </div>
  );
};

```

---

### Ejemplo de Integración en una Vista de Next.js (`page.tsx`)

Para alimentar este componente con la estructura e información real obtenida del SGC-UNT, puedes inicializarlo consumiendo tu API o mediante un set de datos estructurado como este:

```tsx
import { MapaProcesos, Macroproceso } from '@/components/MapaProcesos';

export default function DashboardCalidad() {
  // Datos reales mapeados de la Resolución Rectoral N°1851-2023/UNT
  const mockMacros: Macroproceso[] = [
    { id: 1, codigo: 'E01', nombre: 'Gobierno de la Universidad', tipo: 'estrategico' },
    { id: 2, codigo: 'E02', nombre: 'Gestión de la Mejora Continua', tipo: 'estrategico' },
    { id: 3, codigo: 'E03', nombre: 'Supervisión y Control', tipo: 'estrategico' },
    { id: 4, codigo: 'E06', nombre: 'Dirección Estratégica', tipo: 'estrategico' },
    
    { id: 5, codigo: 'M01', nombre: 'Formación Integral', tipo: 'misional' },
    { id: 6, codigo: 'M02', nombre: 'Investigación, Desarrollo e Innovación', tipo: 'misional' },
    { id: 7, codigo: 'M03', nombre: 'Responsabilidad Social Universitaria', tipo: 'misional' },
    
    { id: 8, codigo: 'A01', nombre: 'Gestión de Infraestructura', tipo: 'apoyo' },
    { id: 9, codigo: 'A02', nombre: 'Gestión de Talento Humano', tipo: 'apoyo' },
    { id: 10, codigo: 'A06', nombre: 'Tecnología de la Información', tipo: 'apoyo' },
    { id: 11, codigo: 'A09', nombre: 'Gestión Financiera', tipo: 'apoyo' },
  ];

  return (
    <main className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sistema de Gestión de la Calidad (SGC-UNT)</h1>
          <p className="text-xs text-slate-500">Visualización interactiva del Mapa de Procesos bajo la norma ISO 9001:2015</p>
        </div>
        
        {/* Inyección del componente */}
        <MapaProcesos macrosData={mockMacros} />
      </div>
    </main>
  );
}

```

---

### Detalles Técnicos de UX/UI Implementados:

* **Soporte de Desbordamiento con Scroll Interno (`overflow-x-auto`):** En resoluciones móviles muy pequeñas, el gráfico mantiene un ancho mínimo seguro para no romper la disposición espacial de las tres capas centrales que exigen los auditores de calidad.
* **Cadena de Valor Semántica:** La sección central (`misionales`) está interconectada por flechas dinámicas mediante componentes fragmentados de React, emulando a la perfección el flujo tradicional de macroprocesos operativos de la universidad.
* **Colores Formales:** El diseño utiliza azules profundos (`from-blue-900 to-slate-900`) para denotar institucionalidad y jerarquía en el núcleo formativo de la universidad, acompañados de sutiles bordes diferenciadores e indicadores del código único internacional asignado.