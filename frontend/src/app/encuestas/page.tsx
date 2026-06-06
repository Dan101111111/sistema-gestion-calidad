'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, Thead, Tbody, Th, Td, Tr,
  Button, EstadoBadge, Badge, Modal, Input, Select, Textarea,
  Pagination, EmptyState, SkeletonCard, ProgressBar,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encuestasApi } from '@/lib/api';
import { formatDate, getErrorMessage, downloadBlob, truncate } from '@/lib/utils';
import { Plus, Download, Send, BarChart2, Eye, Play, GripVertical } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

type EncTab = 'gestion' | 'responder' | 'resultados';

const COLORES_CHART = ['#003366', '#C8102E', '#F7B731', '#27AE60', '#8B5CF6', '#06B6D4', '#F97316'];

export default function EncuestasPage() {
  const { hasRole } = useAuth();
  const isGestor = hasRole('admin', 'gestor_calidad');
  const [tab, setTab] = useState<EncTab>(isGestor ? 'gestion' : 'responder');

  const TABS = [
    ...(isGestor ? [{ key: 'gestion' as EncTab, label: 'Gestión' }] : []),
    { key: 'responder' as EncTab, label: 'Responder' },
    ...(isGestor ? [{ key: 'resultados' as EncTab, label: 'Resultados' }] : []),
  ];

  return (
    <AppLayout title="Encuestas">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Encuestas de Satisfacción</h2>
            <p className="text-sm text-gray-500">Diseño, publicación y análisis de encuestas institucionales</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                tab === t.key ? 'bg-white dark:bg-gray-900 text-unt-primary shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'gestion' && <GestionTab />}
        {tab === 'responder' && <ResponderTab />}
        {tab === 'resultados' && <ResultadosTab />}
      </div>
    </AppLayout>
  );
}

// ── Tab Gestión ────────────────────────────────────────────────
function GestionTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [encuestaForm, setEncuestaForm] = useState({ codigo: '', titulo: '', descripcion: '', grupo_objetivo: 'todos', fecha_inicio: '', fecha_fin: '', anonima: false });

  const { data, isLoading } = useQuery({
    queryKey: ['encuestas-gestion', page],
    queryFn: () => encuestasApi.listar({ page, limit: 10 }).then(r => r.data),
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => encuestasApi.crear(d),
    onSuccess: () => { toast('success', 'Encuesta creada'); qc.invalidateQueries({ queryKey: ['encuestas-gestion'] }); setShowCreate(false); setPreguntas([]); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const publicarMut = useMutation({
    mutationFn: (id: string) => encuestasApi.publicar(id),
    onSuccess: () => { toast('success', 'Encuesta publicada'); qc.invalidateQueries({ queryKey: ['encuestas-gestion'] }); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async (id: string) => {
    try { const r = await encuestasApi.reporte(id); downloadBlob(r.data, `encuesta-${id}.pdf`); toast('success', 'PDF generado'); }
    catch { toast('error', 'Error al generar PDF'); }
  };

  const agregarPregunta = () => {
    setPreguntas(p => [...p, { texto: '', tipo: 'likert_5', obligatoria: true, orden: p.length }]);
  };

  const encuestas = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Nueva Encuesta</Button>
      </div>

      <Card>
        {isLoading ? <div className="p-5"><SkeletonCard /></div> : encuestas.length === 0 ? (
          <EmptyState message="Sin encuestas registradas" action={<Button size="sm" onClick={() => setShowCreate(true)}>Crear Encuesta</Button>} />
        ) : (
          <>
            <Table>
              <Thead><tr><Th>Código</Th><Th>Título</Th><Th>Grupo</Th><Th>Vigencia</Th><Th>Estado</Th><Th className="text-right">Acciones</Th></tr></Thead>
              <Tbody>
                {encuestas.map((e: any) => (
                  <Tr key={e.id}>
                    <Td><span className="font-mono text-xs">{e.codigo}</span></Td>
                    <Td><span className="text-sm font-medium text-gray-800 dark:text-gray-200">{truncate(e.titulo, 45)}</span></Td>
                    <Td><Badge variant="info">{e.grupo_objetivo}</Badge></Td>
                    <Td><span className="text-xs text-gray-500">{formatDate(e.fecha_inicio)} — {formatDate(e.fecha_fin)}</span></Td>
                    <Td><EstadoBadge estado={e.estado} /></Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {e.estado === 'borrador' && (
                          <Button variant="ghost" size="sm" icon={<Play className="w-3.5 h-3.5" />}
                            onClick={() => publicarMut.mutate(e.id)} title="Publicar">
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => downloadPDF(e.id)} title="PDF">
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {meta && <div className="px-4"><Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} /></div>}
          </>
        )}
      </Card>

      {/* Modal crear encuesta */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Encuesta" size="xl">
        <div className="space-y-5">
          {/* Datos generales */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos Generales</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Código*" placeholder="ENC-2024-001" value={encuestaForm.codigo} onChange={e => setEncuestaForm(f => ({ ...f, codigo: e.target.value }))} />
              <Select label="Grupo Objetivo" value={encuestaForm.grupo_objetivo} onChange={e => setEncuestaForm(f => ({ ...f, grupo_objetivo: e.target.value }))}>
                <option value="todos">Todos</option>
                <option value="estudiantes">Estudiantes</option>
                <option value="docentes">Docentes</option>
                <option value="egresados">Egresados</option>
                <option value="administrativos">Administrativos</option>
              </Select>
            </div>
            <div className="mt-3">
              <Input label="Título*" value={encuestaForm.titulo} onChange={e => setEncuestaForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <Input label="Fecha Inicio" type="date" value={encuestaForm.fecha_inicio} onChange={e => setEncuestaForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
              <Input label="Fecha Fin" type="date" value={encuestaForm.fecha_fin} onChange={e => setEncuestaForm(f => ({ ...f, fecha_fin: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input type="checkbox" id="anonima" checked={encuestaForm.anonima} onChange={e => setEncuestaForm(f => ({ ...f, anonima: e.target.checked }))} />
              <label htmlFor="anonima" className="text-sm text-gray-700 dark:text-gray-300">Respuestas anónimas</label>
            </div>
          </div>

          {/* Preguntas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preguntas ({preguntas.length})</h3>
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={agregarPregunta}>Agregar Pregunta</Button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {preguntas.map((p, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-2" />
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Input placeholder={`Pregunta ${i + 1}`} value={p.texto}
                        onChange={e => setPreguntas(prev => prev.map((q, j) => j === i ? { ...q, texto: e.target.value } : q))} />
                    </div>
                    <Select value={p.tipo} onChange={e => setPreguntas(prev => prev.map((q, j) => j === i ? { ...q, tipo: e.target.value } : q))}>
                      <option value="likert_5">Likert 1-5</option>
                      <option value="likert_7">Likert 1-7</option>
                      <option value="si_no">Sí/No</option>
                      <option value="abierta">Abierta</option>
                      <option value="numerica">Numérica</option>
                      <option value="multiple_choice">Opción Múltiple</option>
                    </Select>
                  </div>
                  <button onClick={() => setPreguntas(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 text-xs mt-2">✕</button>
                </div>
              ))}
              {preguntas.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Agregue al menos una pregunta</p>}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => crearMut.mutate({ ...encuestaForm, preguntas })}
              loading={crearMut.isPending}
              disabled={!encuestaForm.codigo || !encuestaForm.titulo}
            >
              Crear Encuesta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Tab Responder ─────────────────────────────────────────────
function ResponderTab() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<any>(null);
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [enviada, setEnviada] = useState(false);

  const { data } = useQuery({
    queryKey: ['encuestas-vigentes'],
    queryFn: () => encuestasApi.listar({ estado: 'publicada', limit: 20 }).then(r => r.data.data),
  });

  const { data: detalle } = useQuery({
    queryKey: ['encuesta-detalle', selected?.id],
    queryFn: () => encuestasApi.obtener(selected.id).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const responderMut = useMutation({
    mutationFn: (d: object) => encuestasApi.responder(selected.id, d),
    onSuccess: () => { setEnviada(true); toast('success', '¡Respuestas enviadas correctamente!'); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const encuestas = data || [];

  const renderPregunta = (preg: any) => {
    const val = respuestas[preg.id];
    const set = (v: any) => setRespuestas(r => ({ ...r, [preg.id]: v }));

    switch (preg.tipo) {
      case 'likert_5':
      case 'likert_7': {
        const max = preg.tipo === 'likert_5' ? 5 : 7;
        return (
          <div className="flex gap-3 flex-wrap">
            {Array.from({ length: max }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => set(n)}
                className={cn('w-10 h-10 rounded-full border-2 text-sm font-bold transition-all',
                  val === n ? 'bg-unt-primary border-unt-primary text-white' : 'border-gray-300 text-gray-600 hover:border-unt-primary')}>
                {n}
              </button>
            ))}
            <div className="w-full flex justify-between text-xs text-gray-400">
              <span>Muy en desacuerdo</span><span>Muy de acuerdo</span>
            </div>
          </div>
        );
      }
      case 'si_no':
        return (
          <div className="flex gap-3">
            {['si', 'no'].map(v => (
              <button key={v} onClick={() => set(v)}
                className={cn('px-6 py-2 rounded-lg border-2 font-medium capitalize transition-all',
                  val === v ? 'bg-unt-primary border-unt-primary text-white' : 'border-gray-300 text-gray-600 hover:border-unt-primary')}>
                {v === 'si' ? '✓ Sí' : '✗ No'}
              </button>
            ))}
          </div>
        );
      case 'abierta':
        return <Textarea placeholder="Escriba su respuesta..." value={val || ''} onChange={e => set(e.target.value)} className="min-h-[80px]" />;
      case 'numerica':
        return <Input type="number" placeholder="Ingrese un número" value={val || ''} onChange={e => set(e.target.value)} className="max-w-xs" />;
      default:
        return <Input placeholder="Su respuesta..." value={val || ''} onChange={e => set(e.target.value)} />;
    }
  };

  if (!selected) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Encuestas disponibles para responder</h3>
        {encuestas.length === 0 ? (
          <EmptyState message="No hay encuestas disponibles" description="No existen encuestas vigentes para su perfil" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {encuestas.map((e: any) => (
              <Card key={e.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelected(e)}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-unt-primary font-bold">{e.codigo}</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{e.titulo}</p>
                      <p className="text-xs text-gray-500 mt-1">Vigente hasta: {formatDate(e.fecha_fin)}</p>
                    </div>
                    <Badge variant="info">{e.grupo_objetivo}</Badge>
                  </div>
                  <Button size="sm" className="mt-3 w-full" icon={<Play className="w-3.5 h-3.5" />}>Responder</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (enviada) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¡Gracias por responder!</h3>
          <p className="text-gray-500 mb-6">Sus respuestas han sido registradas correctamente.</p>
          <Button variant="outline" onClick={() => { setSelected(null); setEnviada(false); setRespuestas({}); }}>
            Ver otras encuestas
          </Button>
        </CardContent>
      </Card>
    );
  }

  const preguntas = detalle?.preguntas || [];
  const respondidas = Object.keys(respuestas).length;
  const progreso = preguntas.length > 0 ? Math.round((respondidas / preguntas.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs text-unt-primary font-bold">{detalle?.codigo}</span>
              <CardTitle className="mt-0.5">{detalle?.titulo}</CardTitle>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">← Volver</button>
          </div>
          {detalle?.descripcion && <p className="text-sm text-gray-500 mt-1">{detalle.descripcion}</p>}
          <div className="mt-3">
            <ProgressBar value={progreso} color="green" />
            <p className="text-xs text-gray-400 mt-1">{respondidas} de {preguntas.length} preguntas respondidas</p>
          </div>
        </CardHeader>
      </Card>

      {preguntas.map((preg: any, i: number) => (
        <Card key={preg.id}>
          <CardContent className="py-4">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
              <span className="text-unt-primary font-bold">{i + 1}.</span> {preg.texto}
              {preg.obligatoria && <span className="text-red-500 ml-1">*</span>}
            </p>
            {renderPregunta(preg)}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end pb-6">
        <Button
          icon={<Send className="w-4 h-4" />}
          onClick={() => responderMut.mutate({
            respuestas: Object.entries(respuestas).map(([pregunta_id, valor]) => ({ pregunta_id, valor })),
          })}
          loading={responderMut.isPending}
          disabled={respondidas < preguntas.filter((p: any) => p.obligatoria).length}
        >
          Enviar Respuestas
        </Button>
      </div>
    </div>
  );
}

// ── Tab Resultados ────────────────────────────────────────────
function ResultadosTab() {
  const [selected, setSelected] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ['encuestas-resultados'],
    queryFn: () => encuestasApi.listar({ limit: 50 }).then(r => r.data.data),
  });

  const { data: resultados, isLoading: resLoading } = useQuery({
    queryKey: ['encuesta-resultados', selected?.id],
    queryFn: () => encuestasApi.resultados(selected.id).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const encuestas = data || [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
      {/* Lista encuestas */}
      <div className="xl:col-span-1 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Seleccionar Encuesta</p>
        {encuestas.map((e: any) => (
          <button key={e.id} onClick={() => setSelected(e)}
            className={cn('w-full text-left p-3 rounded-xl border transition-all text-sm',
              selected?.id === e.id ? 'border-unt-primary bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-unt-primary/50')}>
            <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{e.titulo}</p>
            <p className="text-xs text-gray-400 mt-0.5">{e.estado} · {e.grupo_objetivo}</p>
          </button>
        ))}
      </div>

      {/* Resultados */}
      <div className="xl:col-span-3">
        {!selected ? (
          <Card className="min-h-[400px] flex items-center justify-center">
            <EmptyState message="Seleccione una encuesta" description="Para ver los resultados consolidados" />
          </Card>
        ) : resLoading ? <SkeletonCard /> : (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Resultados: {resultados?.encuesta?.titulo}</CardTitle></CardHeader>
            </Card>

            {(resultados?.resultados || []).map((r: any, i: number) => {
              const anal = r.analisis;
              return (
                <Card key={i}>
                  <CardContent className="py-4">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      <span className="text-unt-primary font-bold">{i + 1}.</span> {r.pregunta.texto}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">Total respuestas: {anal.total}</p>

                    {/* Distribución likert / numérica */}
                    {anal.distribucion && Object.keys(anal.distribucion).length > 0 && (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={Object.entries(anal.distribucion).map(([k, v]) => ({ valor: k, cantidad: v }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="valor" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="cantidad" fill="#003366" radius={[3, 3, 0, 0]}>
                            {Object.keys(anal.distribucion).map((_, idx) => (
                              <Cell key={idx} fill={COLORES_CHART[idx % COLORES_CHART.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {/* Promedio */}
                    {anal.promedio !== undefined && (
                      <div className="flex items-center gap-3 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-3xl font-bold text-unt-primary">{anal.promedio}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Promedio de respuestas</p>
                      </div>
                    )}

                    {/* Si/No */}
                    {anal.si !== undefined && (
                      <div className="flex gap-4 mt-2">
                        <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">{anal.pct_si}%</p>
                          <p className="text-xs text-gray-500">Sí ({anal.si})</p>
                        </div>
                        <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                          <p className="text-2xl font-bold text-red-500">{(100 - parseFloat(anal.pct_si)).toFixed(1)}%</p>
                          <p className="text-xs text-gray-500">No ({anal.no})</p>
                        </div>
                      </div>
                    )}

                    {/* Respuestas abiertas */}
                    {anal.respuestas_texto && (
                      <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                        {anal.respuestas_texto.map((rt: string, ri: number) => (
                          <p key={ri} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded italic text-gray-600 dark:text-gray-400">"{rt}"</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
