'use client';

import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, LayoutGrid } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 

export default function MonitorCozinha() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    // Busca inicial no banco
    const fetchPedidos = async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['pendente', 'preparando', 'pronto'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
      } else if (data) {
        setPedidos(data);
      }
    };

    fetchPedidos();

    // Configura o WebSocket (Supabase Realtime)
    const channel = supabase
      .channel('monitor-cozinha')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log('Novo evento no banco!', payload);
          fetchPedidos(); // Recarrega a lista se o garçom mandar pedido novo
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ATUALIZAR STATUS NO BANCO E NA TELA (Usando 'id' correto)
  const alterarStatus = async (id: number | string, novoStatus: string) => {
    // Atualiza a tela instantaneamente
    setPedidos(prev => prev.map(p => 
      p.id === id ? { ...p, status: novoStatus } : p
    ));

    // Manda a atualização para o banco
    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar no banco:', error);
    }
  };

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
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg font-bold text-gray-300">
            <LayoutGrid className="w-5 h-5 text-gray-400" />
            <span>{pedidos.length} Mesas Ativas</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg font-bold text-orange-500 animate-pulse">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            Online
          </div>
        </div>
      </header>

      {/* GRID DE PEDIDOS (KANBAN) */}
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          
          {pedidos.map((pedido) => {
            // Definição de cores baseada no status
            const isPronto = pedido.status === 'pronto';
            const isPreparando = pedido.status === 'preparando';
            
            const bgCard = isPronto ? 'bg-green-950/30 border-green-800/50' : isPreparando ? 'bg-orange-950/20 border-orange-800/50' : 'bg-gray-800 border-gray-700';
            const headerColor = isPronto ? 'bg-green-700' : isPreparando ? 'bg-orange-600' : 'bg-gray-700';

            return (
              <div key={pedido.id} className={`rounded-xl border-2 shadow-xl overflow-hidden flex flex-col transition-colors duration-300 ${bgCard}`}>
                
                {/* CABEÇALHO DO CARD */}
                <div className={`p-3 flex justify-between items-center ${headerColor}`}>
                  <h2 className="text-2xl font-black text-white">Mesa {pedido.mesa}</h2>
                  <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-md font-bold text-white text-sm">
                    <Clock className="w-4 h-4" /> {pedido.tempo || '0 min'}
                  </div>
                </div>

                {/* LISTA DE ITENS */}
                <div className="p-4 flex-1 space-y-3">
                  {pedido.itens && pedido.itens.map((item: any, idx: number) => (
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

                {/* BOTÕES DE AÇÃO (Usando 'pedido.id') */}
                <div className="p-3 bg-black/20 border-t border-gray-700/50 grid grid-cols-2 gap-2">
                  {pedido.status === 'pendente' && (
                    <button 
                      onClick={() => alterarStatus(pedido.id, 'preparando')}
                      className="col-span-2 bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Flame className="w-5 h-5" /> Iniciar Preparo
                    </button>
                  )}

                  {pedido.status === 'preparando' && (
                    <button 
                      onClick={() => alterarStatus(pedido.id, 'pronto')}
                      className="col-span-2 bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(22,163,74,0.4)]"
                    >
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