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
  onSelectMacro?: (macroId: string | number) => void;
}

export const MapaProcesosGrafico: React.FC<MapaProcesosProps> = ({ macrosData, onSelectMacro }) => {
  // Clasificación y distribución automática de los macroprocesos por su tipo
  const sortByCodigo = (a: Macroproceso, b: Macroproceso) => {
    return a.codigo.localeCompare(b.codigo, undefined, { numeric: true });
  };

  const { estrategicos, misionales, apoyo } = useMemo(() => {
    return {
      estrategicos: macrosData.filter((m) => m.tipo === 'estrategico' || m.tipo === 'evaluacion').sort(sortByCodigo),
      misionales: macrosData.filter((m) => m.tipo === 'misional').sort(sortByCodigo),
      apoyo: macrosData.filter((m) => m.tipo === 'apoyo').sort(sortByCodigo),
    };
  }, [macrosData]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sistema de Gestión de la Calidad (SGC-UNT)</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Visualización interactiva del Mapa de Procesos bajo la norma ISO 9001:2015</p>
      </div>
      <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      {/* Contenedor principal: Grid de 3 columnas en desktop, apilado en mobile */}
      <div className="flex flex-col lg:grid lg:grid-cols-[160px_1fr_160px] gap-6 items-stretch">
        
        {/* BLOQUE IZQUIERDO: Entrada del Sistema (ISO 9001) */}
        <div className="flex flex-col justify-center items-center p-4 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-sm text-center relative group">
          <div className="absolute -bottom-4 inset-x-0 mx-auto flex lg:hidden items-center justify-center pointer-events-none z-10">
            <svg className="w-5 h-5 text-slate-400 fill-current" viewBox="0 0 20 20">
              <path d="M3 10l7 7 7-7H3z" />
            </svg>
          </div>
          <div className="hidden lg:flex absolute inset-y-0 -right-2 items-center justify-center pointer-events-none z-10">
            <svg className="w-4 h-4 text-slate-400 fill-current" viewBox="0 0 20 20">
              <path d="M10 3l7 7-7 7V3z" />
            </svg>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold opacity-70 mb-2">Entrada</span>
          <h3 className="text-xs font-semibold leading-snug">
            Necesidades y expectativas de los Grupos de Interés
          </h3>
        </div>

        {/* BLOQUE CENTRAL: Los 3 Niveles del SGC-UNT */}
        <div className="flex flex-col gap-6 justify-between lg:border-x lg:border-dashed lg:border-slate-300 lg:px-4">
          
          {/* Fila Superior: Procesos Estratégicos */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3 text-center">
              Procesos Estratégicos
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {estrategicos.map((macro) => (
                <div
                  key={macro.id}
                  onClick={() => onSelectMacro?.(macro.id)}
                  className="bg-white border border-amber-300 rounded-lg p-2.5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 border-b-4 border-b-amber-500"
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
              Procesos Misionales (Core / Formación Integral)
            </h4>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              {misionales.map((macro, index) => (
                <React.Fragment key={macro.id}>
                  {/* Caja de Proceso Misional */}
                  <div
                    onClick={() => onSelectMacro?.(macro.id)}
                    className="flex-1 bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-lg p-3 text-center shadow-md border-b-4 border-b-sky-400 min-h-[75px] flex flex-col justify-center cursor-pointer transition-transform hover:-translate-y-1 duration-200"
                  >
                    <span className="block text-[10px] font-mono font-bold text-sky-300 mb-1">
                      {macro.codigo}
                    </span>
                    <p className="text-xs font-semibold leading-tight px-1">
                      {macro.nombre}
                    </p>
                  </div>
                  
                  {/* Flecha Conectora de la Cadena de Valor (Excepto el último elemento) */}
                  {index < misionales.length - 1 && (
                    <div className="flex-shrink-0 text-sky-500 animate-pulse sm:rotate-0 rotate-90 my-1 sm:my-0">
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
          <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 text-center">
              Procesos de Apoyo
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {apoyo.map((macro) => (
                <div
                  key={macro.id}
                  onClick={() => onSelectMacro?.(macro.id)}
                  className="bg-white border border-emerald-300 rounded-lg p-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 border-b-4 border-b-emerald-500"
                >
                  <span className="block text-[10px] font-mono font-bold text-emerald-600 mb-0.5">
                    {macro.codigo}
                  </span>
                  <p className="text-[11px] font-medium text-emerald-900 line-clamp-2 leading-tight">
                    {macro.nombre}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* BLOQUE DERECHO: Salida del Sistema (Satisfacción de Clientes) */}
        <div className="flex flex-col justify-center items-center p-4 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-sm text-center relative">
          <div className="absolute -top-4 inset-x-0 mx-auto flex lg:hidden items-center justify-center pointer-events-none z-10">
            <svg className="w-5 h-5 text-slate-400 fill-current" viewBox="0 0 20 20">
              <path d="M3 10l7-7 7 7H3z" />
            </svg>
          </div>
          <div className="hidden lg:flex absolute inset-y-0 -left-2 items-center justify-center pointer-events-none z-10">
            <svg className="w-4 h-4 text-slate-400 fill-current rotate-180" viewBox="0 0 20 20">
              <path d="M10 3l7 7-7 7V3z" />
            </svg>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold opacity-70 mb-2">Salida</span>
          <h3 className="text-xs font-semibold leading-snug">
            Satisfacción de los Grupos de Interés
          </h3>
        </div>

      </div>
    </div>
    </div>
  );
};
