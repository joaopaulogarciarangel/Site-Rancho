'use client';
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, LayoutGrid, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 

export default function MonitorCozinha() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [somAtivado, setSomAtivado] = useState(false);
  const [horaAtual, setHoraAtual] = useState(new Date());

  // Atualiza o relógio interno a cada 30 segundos para recalcular o tempo das comandas
  useEffect(() => {
    const intervalo = setInterval(() => setHoraAtual(new Date()), 30000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['pendente', 'preparando', 'pronto'])
        .order('created_at', { ascending: true });

      if (!error && data) setPedidos(data);
    };

    fetchPedidos();

    const channel = supabase
      .channel('monitor-cozinha')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          // Se for um pedido NOVO (INSERT) e o som estiver ativado, toca o Beep
          if (payload.eventType === 'INSERT' && somAtivado) {
            // URL de um som de "Ding" de notificação (pode trocar por outro mp3 depois se quiser)
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(err => console.log('Áudio bloqueado pelo navegador', err));
          }
          fetchPedidos(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [somAtivado]); // O useEffect precisa saber se o som está ativado

  const alterarStatus = async (id: number | string, novoStatus: string) => {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p));
    await supabase.from('pedidos').update({ status: novoStatus }).eq('id', id);
  };

  // FILTRO INTELIGENTE: Mantém apenas os pedidos que possuem pelo menos 1 item para a cozinha
  const pedidosCozinha = pedidos.filter(pedido => 
    pedido.itens && pedido.itens.some((item: any) => item.setor === 'cozinha')
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* HEADER DA COZINHA */}
      <header className="bg-gray-950 border-b border-gray-800 p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wider uppercase">Monitor de Produção</h1>
            <p className="text-gray-400 text-sm font-semibold">Cozinha</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* BOTÃO DE ATIVAR O SOM (Necessário para contornar o bloqueio dos navegadores) */}
          <button 
            onClick={() => setSomAtivado(!somAtivado)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors border ${
              somAtivado ? 'bg-green-900/40 text-green-400 border-green-700/50' : 'bg-red-900/40 text-red-400 border-red-700/50'
            }`}
          >
            {somAtivado ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            {somAtivado ? 'Som Ativado' : 'Ativar Alerta'}
          </button>

          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg font-bold text-gray-300">
            <LayoutGrid className="w-5 h-5 text-gray-400" />
            {/* Agora ele conta apenas as mesas que a cozinha realmente precisa fazer */}
            <span>{pedidosCozinha.length} Mesas</span>
          </div>
        </div>
      </header>

      {/* GRID DE PEDIDOS */}
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {pedidosCozinha.map((pedido) => {
            const isPronto = pedido.status === 'pronto';
            const isPreparando = pedido.status === 'preparando';
            
            // CÁLCULO DE TEMPO CORRIDO
            let minutosCorridos = 0;
            if (pedido.created_at) {
              const dataCriacao = new Date(pedido.created_at);
              minutosCorridos = Math.floor((horaAtual.getTime() - dataCriacao.getTime()) / 60000);
            }

            // MUDANÇA DE COR BASEADA NO TEMPO (Prioridade)
            let corTempo = 'text-gray-300 bg-black/30';
            if (!isPronto) {
              if (minutosCorridos >= 15 && minutosCorridos < 25) {
                corTempo = 'text-yellow-300 bg-yellow-900/40 border border-yellow-700/50'; // Atenção
              } else if (minutosCorridos >= 25) {
                corTempo = 'text-red-300 bg-red-900/50 border border-red-600/50 animate-pulse'; // Crítico
              }
            }

            const bgCard = isPronto ? 'bg-green-950/30 border-green-800/50' : isPreparando ? 'bg-orange-950/20 border-orange-800/50' : 'bg-gray-800 border-gray-700';
            const headerColor = isPronto ? 'bg-green-700' : isPreparando ? 'bg-orange-600' : 'bg-gray-700';

            // Filtra os itens DENTRO do pedido para mostrar só os de cozinha
            const itensApenasCozinha = pedido.itens.filter((i: any) => i.setor === 'cozinha');

            return (
              <div key={pedido.id} className={`rounded-xl border-2 shadow-xl overflow-hidden flex flex-col transition-colors duration-300 ${bgCard}`}>
                
                {/* CABEÇALHO DO CARD */}
                <div className={`p-3 flex justify-between items-center ${headerColor}`}>
                  <h2 className="text-2xl font-black text-white">Mesa {pedido.mesa}</h2>
                  
                  {/* CRONÔMETRO COM COR DINÂMICA */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-sm ${corTempo}`}>
                    <Clock className="w-4 h-4" /> 
                    {minutosCorridos < 0 ? 0 : minutosCorridos} min
                  </div>
                </div>

                {/* LISTA DE ITENS */}
                <div className="p-4 flex-1 space-y-3">
                  {itensApenasCozinha.map((item: any, idx: number) => (
                    <div key={idx} className="border-b border-gray-700/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex gap-2 items-start">
                        <span className="font-black text-xl text-white">{item.quantidade}x</span>
                        <div className="flex-1 mt-0.5">
                          <p className={`font-bold text-lg leading-tight ${isPronto ? 'text-green-100' : 'text-gray-100'}`}>
                            {item.nome}
                          </p>
                          {item.observacao && (
                            <div className="mt-1.5 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-yellow-200 font-medium text-sm">
                              ⚠️ {item.observacao}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="p-3 bg-black/20 border-t border-gray-700/50 grid grid-cols-2 gap-2">
                  {pedido.status === 'pendente' && (
                    <button onClick={() => alterarStatus(pedido.id, 'preparando')} className="col-span-2 bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2">
                      <Flame className="w-5 h-5" /> Iniciar Preparo
                    </button>
                  )}
                  {pedido.status === 'preparando' && (
                    <button onClick={() => alterarStatus(pedido.id, 'pronto')} className="col-span-2 bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(22,163,74,0.4)]">
                      <CheckCircle2 className="w-6 h-6" /> Marcar como Pronto
                    </button>
                  )}
                  {pedido.status === 'pronto' && (
                    <div className="col-span-2 flex items-center justify-center gap-2 py-2 text-green-500 font-bold">
                      <CheckCircle2 className="w-5 h-5" /> Aguardando Liberação
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}