'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PRODUTOS } from '@/data/cardapio'; 
import { 
  LogOut, LayoutDashboard, Package, TrendingUp, CloudRain, 
  CalendarClock, Download, Trash2, Plus, Minus, 
  RefreshCw, ReceiptText, XCircle, Target, 
  PieChart, BarChart3, Sun, Umbrella, Activity, CheckCircle2, Check
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [abaAtiva, setAbaAtiva] = useState('resumo'); 
  const [vendas, setVendas] = useState<any[]>([]);
  const [vendaExpandida, setVendaExpandida] = useState<any>(null);
  const [estoque, setEstoque] = useState<any[]>([]);
  
  const [pedidosAtivos, setPedidosAtivos] = useState<any[]>([]); 
  
  // NOVO: Estado para controlar os botões de duas etapas (Feito -> Remover)
  // Guarda o status de cada "metade" do pedido. Ex: { 'coz-12': 'feito', 'bar-12': 'removido' }
  const [statusPartes, setStatusPartes] = useState<Record<string, string>>({});

  const [filtroTempo, setFiltroTempo] = useState('hoje'); 
  const [metaDiaria, setMetaDiaria] = useState(3000);

  useEffect(() => {
    const metaSalva = localStorage.getItem('gestor_meta');
    if (metaSalva) setMetaDiaria(Number(metaSalva));

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/admin/login';
      } else {
        setUser(session.user);
        buscarHistorico();
        buscarEstoque();
        buscarPedidosAtivos();
      }
    };
    checkUser();

    const channelVendas = supabase
      .channel('mudancas-vendas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas_historico' }, () => buscarHistorico())
      .subscribe();

    const channelEstoque = supabase
      .channel('mudancas-estoque')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, () => buscarEstoque())
      .subscribe();

    const channelPedidos = supabase
      .channel('mudancas-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => buscarPedidosAtivos())
      .subscribe(); 

    return () => { 
      supabase.removeChannel(channelVendas); 
      supabase.removeChannel(channelEstoque); 
      supabase.removeChannel(channelPedidos);
    };
  }, []);

  const handleMudancaMeta = (valor: number) => {
    setMetaDiaria(valor);
    localStorage.setItem('gestor_meta', valor.toString());
  };

  const buscarHistorico = async () => {
    const { data } = await supabase.from('vendas_historico').select('*').order('criado_em', { ascending: false });
    if (data) setVendas(data);
    setLoading(false);
  };

  const buscarEstoque = async () => {
    const { data } = await supabase.from('estoque').select('*').order('nome_produto', { ascending: true });
    if (data) setEstoque(data);
  };

  const buscarPedidosAtivos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .neq('status', 'finalizado')
      .order('created_at', { ascending: false });

    if (error) console.error("Erro ao buscar pedidos:", error);
    if (data) setPedidosAtivos(data);
  };

  const forcarExclusaoPedido = async (id: number) => {
    if (!window.confirm("Atenção Gestor: Tem certeza que deseja apagar este pedido à força?")) return;
    setPedidosAtivos(prev => prev.filter(p => p.id !== id));
    await supabase.from('pedidos').delete().eq('id', id);
  };

  // ==========================================
  // NOVAS FUNÇÕES DO FLUXO: FEITO -> REMOVER
  // ==========================================
  const marcarComoFeito = (chave: string) => {
    setStatusPartes(prev => ({ ...prev, [chave]: 'feito' }));
  };

  const removerParte = async (chave: string, pedidoId: number, temCozinha: boolean, temBar: boolean) => {
    setStatusPartes(prev => {
      const newState = { ...prev, [chave]: 'removido' };
      const chaveCoz = `coz-${pedidoId}`;
      const chaveBar = `bar-${pedidoId}`;
      const cozRemovida = !temCozinha || newState[chaveCoz] === 'removido';
      const barRemovido = !temBar || newState[chaveBar] === 'removido';
      
      if (cozRemovida && barRemovido) {
        setPedidosAtivos(lista => lista.filter(p => p.id !== pedidoId));
        // ALTERAÇÃO: Muda para 'entregue' para o pedido continuar existindo na conta da mesa
        supabase.from('pedidos').update({ status: 'entregue' }).eq('id', pedidoId).then();
      }
      return newState;
    });
  };

  // ==========================================
  // FILTRAGEM E BI (Mantido igual)
  // ==========================================
  const vendasFiltradas = vendas.filter(v => {
    if (filtroTempo === 'tudo') return true;
    const dataVenda = new Date(v.criado_em);
    const hoje = new Date();
    if (filtroTempo === 'hoje') return dataVenda.toDateString() === hoje.toDateString();
    if (filtroTempo === 'semana') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);
      return dataVenda >= seteDiasAtras;
    }
    if (filtroTempo === 'mes') return dataVenda.getMonth() === hoje.getMonth() && dataVenda.getFullYear() === hoje.getFullYear();
    return true;
  });

  const faturamentoTotal = vendasFiltradas.reduce((acc, v) => acc + Number(v.valor_total), 0);
  const ticketMedio = vendasFiltradas.length > 0 ? faturamentoTotal / vendasFiltradas.length : 0;
  const progressoMeta = Math.min((faturamentoTotal / metaDiaria) * 100, 100);

  const faturamentoPagamentos = vendasFiltradas.reduce((acc, v) => {
    const forma = v.forma_pagamento || 'Não Informado';
    acc[forma] = (acc[forma] || 0) + Number(v.valor_total);
    return acc;
  }, {} as Record<string, number>);

  const contagemProdutos = vendasFiltradas.reduce((acc, v) => {
    if (v.itens && Array.isArray(v.itens)) {
      v.itens.forEach((item: any) => {
        acc[item.nome] = (acc[item.nome] || 0) + item.quantidade;
      });
    }
    return acc;
  }, {} as Record<string, number>);
  
  const top5Produtos = (Object.entries(contagemProdutos) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const analiseClima = vendas.reduce((acc, v) => {
    const clima = v.clima_condicao || 'Não Informado';
    if (!acc[clima]) acc[clima] = { faturamento: 0, dias: new Set<string>() };
    acc[clima].faturamento += Number(v.valor_total);
    acc[clima].dias.add(new Date(v.criado_em).toDateString());
    return acc;
  }, {} as Record<string, { faturamento: number, dias: Set<string> }>);

  // AÇÕES DO HISTÓRICO
  const atualizarClimaEmLote = async (condicao: string, dataIso: string) => {
    const dataAlvo = new Date(dataIso);
    const inicioDia = new Date(dataAlvo.setHours(0, 0, 0, 0)).toISOString();
    const fimDia = new Date(dataAlvo.setHours(23, 59, 59, 999)).toISOString();
    setVendas(prev => prev.map(v => {
      const dataV = new Date(v.criado_em);
      if (dataV >= new Date(inicioDia) && dataV <= new Date(fimDia)) return { ...v, clima_condicao: condicao };
      return v;
    }));
    await supabase.from('vendas_historico').update({ clima_condicao: condicao }).gte('criado_em', inicioDia).lte('criado_em', fimDia);
  };
  const atualizarPagamento = async (id: string | number, pag: string) => {
    setVendas(prev => prev.map(v => v.id === id ? { ...v, forma_pagamento: pag } : v));
    await supabase.from('vendas_historico').update({ forma_pagamento: pag }).eq('id', id);
  };
  const atualizarValorVenda = async (id: string | number, val: number) => {
    if (isNaN(val)) return;
    setVendas(prev => prev.map(v => v.id === id ? { ...v, valor_total: val } : v));
    await supabase.from('vendas_historico').update({ valor_total: val }).eq('id', id);
  };
  const removerVenda = async (id: string | number) => {
    if (!window.confirm("Excluir esta venda permanentemente?")) return;
    setVendas(prev => prev.filter(v => v.id !== id));
    await supabase.from('vendas_historico').delete().eq('id', id);
  };
  const exportarCSV = () => { /* Mantido */ };

  // LÓGICAS DE ESTOQUE
  const alterarQuantidadeEstoque = async (id: string | number, delta: number) => {
    const item = estoque.find(e => e.id === id);
    if (!item) return;
    const novaQtd = Math.max(0, Number(item.quantidade_atual) + delta);
    setEstoque(prev => prev.map(e => e.id === id ? { ...e, quantidade_atual: novaQtd } : e));
    await supabase.from('estoque').update({ quantidade_atual: novaQtd }).eq('id', id);
  };
  const definirQuantidadeEstoque = async (id: string | number, novaQtd: number) => {
    if (isNaN(novaQtd) || novaQtd < 0) return;
    setEstoque(prev => prev.map(e => e.id === id ? { ...e, quantidade_atual: novaQtd } : e));
    await supabase.from('estoque').update({ quantidade_atual: novaQtd }).eq('id', id);
  };
  const atualizarStatusEstoque = async (id: string | number, novoStatus: string) => {
    setEstoque(prev => prev.map(e => e.id === id ? { ...e, status: novoStatus } : e));
    await supabase.from('estoque').update({ status: novoStatus }).eq('id', id);
  };
  const sincronizarEstoque = async () => { /* Mantido */ };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const estoqueAgrupado = estoque.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">A carregar painel...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="w-64 bg-gray-950 text-white flex-col hidden md:flex fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-black tracking-wider text-orange-500 uppercase">Backoffice</h1>
          <p className="text-xs text-gray-500 font-bold mt-1 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setAbaAtiva('resumo')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${abaAtiva === 'resumo' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>
            <LayoutDashboard className="w-5 h-5" /> Visão Geral
          </button>
          <button onClick={() => setAbaAtiva('operacao')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${abaAtiva === 'operacao' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>
            <Activity className="w-5 h-5" /> Operação ao Vivo
          </button>
          <button onClick={() => setAbaAtiva('fechamento')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${abaAtiva === 'fechamento' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>
            <ReceiptText className="w-5 h-5" /> Fechar Conta
          </button>
          <button onClick={() => setAbaAtiva('historico')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${abaAtiva === 'historico' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>
            <TrendingUp className="w-5 h-5" /> Histórico de Vendas
          </button>
          <button onClick={() => setAbaAtiva('estoque')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${abaAtiva === 'estoque' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>
            <Package className="w-5 h-5" /> Controle de Estoque
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* NAVEGAÇÃO MOBILE */}
      <nav className="md:hidden fixed bottom-0 w-full bg-gray-950 border-t border-gray-800 z-50 flex justify-around pb-4 pt-2 shadow-2xl">
        <button onClick={() => setAbaAtiva('resumo')} className={`flex flex-col items-center p-2 flex-1 ${abaAtiva === 'resumo' ? 'text-orange-500' : 'text-gray-400'}`}>
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Painel</span>
        </button>
        <button onClick={() => setAbaAtiva('operacao')} className={`flex flex-col items-center p-2 flex-1 ${abaAtiva === 'operacao' ? 'text-orange-500' : 'text-gray-400'}`}>
          <Activity className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Salão</span>
        </button>
        <button onClick={() => setAbaAtiva('fechamento')} className={`flex flex-col items-center p-2 flex-1 ${abaAtiva === 'fechamento' ? 'text-orange-500' : 'text-gray-400'}`}>
          <ReceiptText className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Caixa</span>
        </button>
        <button onClick={() => setAbaAtiva('historico')} className={`flex flex-col items-center p-2 flex-1 ${abaAtiva === 'historico' ? 'text-orange-500' : 'text-gray-400'}`}>
          <TrendingUp className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Vendas</span>
        </button>
        <button onClick={() => setAbaAtiva('estoque')} className={`flex flex-col items-center p-2 flex-1 ${abaAtiva === 'estoque' ? 'text-orange-500' : 'text-gray-400'}`}>
          <Package className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Estoque</span>
        </button>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto w-full">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              {abaAtiva === 'resumo' && 'Visão Geral do Negócio'}
              {abaAtiva === 'operacao' && 'Monitoramento do Salão'}
              {abaAtiva === 'historico' && 'Histórico de Vendas'}
              {abaAtiva === 'estoque' && 'Controle de Estoque'}
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {(abaAtiva === 'historico' || abaAtiva === 'resumo') && (
               <select 
                 value={filtroTempo} 
                 onChange={(e) => setFiltroTempo(e.target.value)}
                 className="bg-white border border-gray-300 text-gray-900 px-4 py-3 rounded-xl font-bold focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
               >
                 <option value="hoje">Hoje</option>
                 <option value="semana">Esta Semana</option>
                 <option value="mes">Este Mês</option>
                 <option value="tudo">Todo o Período</option>
               </select>
            )}

            {abaAtiva === 'historico' && (
              <button onClick={exportarCSV} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 flex-1 md:flex-none"> 
                <Download className="w-5 h-5" /> Exportar 
              </button>
            )}
            
            {abaAtiva === 'estoque' && (
              <button onClick={sincronizarEstoque} className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 w-full md:w-auto"> 
                <RefreshCw className="w-5 h-5" /> Sincronizar Novos Produtos 
              </button>
            )}
          </div>
        </header>

        {/* ==========================================
            ABA: OPERAÇÃO AO VIVO (DIVIDIDA)
            ========================================== */}
        {abaAtiva === 'operacao' && (
          <div className="space-y-8">
            <p className="text-gray-600 font-medium">
              Controle o fluxo de saída. Marque "Feito" quando estiver pronto, e "Remover" quando o garçom levar.
            </p>
            
            {pedidosAtivos.length === 0 ? (
                <div className="col-span-full p-10 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-800 font-black text-xl">Salão zerado!</p>
                  <p className="text-gray-500 font-medium">Nenhum pedido aguardando preparo no momento.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* COLUNA: COZINHA E CHURRASQUEIRA */}
                <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100">
                  <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-3 h-8 bg-orange-600 rounded-full"></div>
                    <h3 className="font-black text-2xl text-gray-900">Preparo (Cozinha)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pedidosAtivos.map(pedido => {
                      // Substitua os filtros atuais por estes:
                      const itensCozinha = pedido.itens?.filter((item: any) => {
                        const infoProduto = PRODUTOS.find(p => p.nome === item.nome);
                        // Cozinha recebe tudo que NÃO é do setor bar, OU que explicitamente seja a categoria de Sobremesas
                        return infoProduto?.setor !== 'bar' || infoProduto?.categoria?.toLowerCase().includes('sobremesa');
                      }) || [];

                      const itensBar = pedido.itens?.filter((item: any) => {
                        const infoProduto = PRODUTOS.find(p => p.nome === item.nome);
                        // Bar recebe APENAS se for setor bar E não for categoria Sobremesa
                        return infoProduto?.setor === 'bar' && !infoProduto?.categoria?.toLowerCase().includes('sobremesa');
                      }) || [];

                      const temCozinha = itensCozinha.length > 0;
                      const temBar = itensBar.length > 0;
                      const chaveCoz = `coz-${pedido.id}`;

                      // Se não tem item de cozinha OU se o card da cozinha já foi removido, não mostra nada aqui
                      if (!temCozinha || statusPartes[chaveCoz] === 'removido') return null;

                      const isFeito = statusPartes[chaveCoz] === 'feito';

                      return (
                        <div key={chaveCoz} className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all ${isFeito ? 'border-gray-200 opacity-80' : 'border-orange-200'}`}>
                          <div className={`p-3 flex justify-between items-center text-white ${isFeito ? 'bg-gray-400' : 'bg-orange-500'}`}>
                            <h4 className="font-black text-xl">Mesa {pedido.mesa}</h4>
                            <span className="text-xs font-bold px-2 py-1 bg-black/20 rounded-md uppercase">
                              {isFeito ? 'Aguardando Garçom' : 'Comida'}
                            </span>
                          </div>
                          
                          <div className="p-4 flex-1">
                            <ul className="space-y-3">
                              {itensCozinha.map((item: any, idx: number) => (
                                <li key={idx} className={`flex justify-between items-start border-b border-gray-50 pb-2 ${isFeito ? 'line-through text-gray-400' : ''}`}>
                                  <div>
                                    <span className={`font-black mr-2 ${isFeito ? 'text-gray-400' : 'text-orange-600'}`}>{item.quantidade}x</span>
                                    <span className={`font-bold ${isFeito ? 'text-gray-400' : 'text-gray-800'}`}>{item.nome}</span>
                                    {item.observacao && <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-wide">Obs: {item.observacao}</p>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="p-3 bg-gray-50 flex gap-2">
                            {isFeito ? (
                              <button onClick={() => removerParte(chaveCoz, pedido.id, temCozinha, temBar)} className="flex-1 py-3 bg-gray-800 text-white font-black rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
                                <Check className="w-5 h-5"/> Remover (Entregue)
                              </button>
                            ) : (
                              <button onClick={() => marcarComoFeito(chaveCoz)} className="flex-1 py-3 bg-green-500 text-white font-black rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-5 h-5"/> Feito
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COLUNA: BAR E BEBIDAS */}
                <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-3 h-8 bg-blue-600 rounded-full"></div>
                    <h3 className="font-black text-2xl text-gray-900">Bar (Bebidas)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pedidosAtivos.map(pedido => {
                      const itensCozinha = pedido.itens?.filter((item: any) => {
                        const infoProduto = PRODUTOS.find(p => p.nome === item.nome);
                        return infoProduto?.setor !== 'bar';
                      }) || [];
                      const itensBar = pedido.itens?.filter((item: any) => {
                        const infoProduto = PRODUTOS.find(p => p.nome === item.nome);
                        return infoProduto?.setor === 'bar';
                      }) || [];

                      const temCozinha = itensCozinha.length > 0;
                      const temBar = itensBar.length > 0;
                      const chaveBar = `bar-${pedido.id}`;

                      // Se não tem item de bar OU se o card do bar já foi removido, não mostra nada aqui
                      if (!temBar || statusPartes[chaveBar] === 'removido') return null;

                      const isFeito = statusPartes[chaveBar] === 'feito';

                      return (
                        <div key={chaveBar} className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all ${isFeito ? 'border-gray-200 opacity-80' : 'border-blue-200'}`}>
                          <div className={`p-3 flex justify-between items-center text-white ${isFeito ? 'bg-gray-400' : 'bg-blue-600'}`}>
                            <h4 className="font-black text-xl">Mesa {pedido.mesa}</h4>
                            <span className="text-xs font-bold px-2 py-1 bg-black/20 rounded-md uppercase">
                              {isFeito ? 'Aguardando Garçom' : 'Bebida'}
                            </span>
                          </div>
                          
                          <div className="p-4 flex-1">
                            <ul className="space-y-3">
                              {itensBar.map((item: any, idx: number) => (
                                <li key={idx} className={`flex justify-between items-start border-b border-gray-50 pb-2 ${isFeito ? 'line-through text-gray-400' : ''}`}>
                                  <div>
                                    <span className={`font-black mr-2 ${isFeito ? 'text-gray-400' : 'text-blue-600'}`}>{item.quantidade}x</span>
                                    <span className={`font-bold ${isFeito ? 'text-gray-400' : 'text-gray-800'}`}>{item.nome}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="p-3 bg-gray-50 flex gap-2">
                            {isFeito ? (
                              <button onClick={() => removerParte(chaveBar, pedido.id, temCozinha, temBar)} className="flex-1 py-3 bg-gray-800 text-white font-black rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
                                <Check className="w-5 h-5"/> Remover (Entregue)
                              </button>
                            ) : (
                              <button onClick={() => marcarComoFeito(chaveBar)} className="flex-1 py-3 bg-green-500 text-white font-black rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-5 h-5"/> Feito
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

                {/* ==========================================
            ABA: FECHAMENTO DE CONTA
            ========================================== */}
        {abaAtiva === 'fechamento' && (
          <div className="space-y-6">
            <h3 className="font-black text-2xl text-gray-900">Fechamento e Emissão</h3>
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm min-h-[50vh]">
              {/* O componente do Garçom será renderizado aqui */}
              <p className="text-gray-500 text-center mt-10">Carregando interface do caixa...</p>
            </div>
          </div>
        )}

        {/* ==========================================
            ABA: VISÃO GERAL (BI) E ESTOQUE (Mantidas iguais)
            ========================================== */}
        {abaAtiva === 'resumo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 text-orange-600 mb-2">
                  <TrendingUp className="w-6 h-6" />
                  <h3 className="font-bold">Faturamento ({filtroTempo})</h3>
                </div>
                <p className="text-3xl font-black text-gray-900">R$ {faturamentoTotal.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <ReceiptText className="w-6 h-6" />
                  <h3 className="font-bold">Ticket Médio</h3>
                </div>
                <p className="text-3xl font-black text-gray-900">R$ {ticketMedio.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 text-green-600 mb-2">
                  <LayoutDashboard className="w-6 h-6" />
                  <h3 className="font-bold">Mesas Atendidas</h3>
                </div>
                <p className="text-3xl font-black text-gray-900">{vendasFiltradas.length}</p>
              </div>

              <div className="bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-white">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold">Meta Diária</h3>
                  </div>
                  <input 
                    type="number" 
                    value={metaDiaria} 
                    onChange={(e) => handleMudancaMeta(Number(e.target.value))}
                    className="w-20 bg-gray-800 text-white text-right px-2 py-1 rounded-lg text-sm font-bold border border-gray-700 outline-none focus:border-orange-500"
                  />
                </div>
                <p className="text-2xl font-black text-white mb-3">{progressoMeta.toFixed(0)}% <span className="text-sm font-medium text-gray-400">concluído</span></p>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${progressoMeta}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 lg:col-span-1">
                <h3 className="font-black text-xl text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" /> Top 5 Mais Vendidos
                </h3>
                {top5Produtos.length === 0 ? (
                  <p className="text-gray-500 font-medium">Nenhuma venda no período.</p>
                ) : (
                  <div className="space-y-4">
                    {top5Produtos.map(([nome, qtd], index) => (
                      <div key={nome} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {index + 1}
                          </span>
                          <span className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{nome}</span>
                        </div>
                        <span className="font-black text-gray-900">{qtd}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 lg:col-span-1">
                <h3 className="font-black text-xl text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-orange-600" /> Por Pagamento
                </h3>
                {Object.keys(faturamentoPagamentos).length === 0 ? (
                  <p className="text-gray-500 font-medium">Nenhum dado financeiro.</p>
                ) : (
                  <div className="space-y-4">
                    {(Object.entries(faturamentoPagamentos) as [string, number][]).map(([forma, valor]) => {
                      const porcentagem = ((valor / faturamentoTotal) * 100).toFixed(0);
                      return (
                        <div key={forma}>
                          <div className="flex justify-between items-end mb-1">
                            <span className="font-bold text-gray-700 text-sm">{forma}</span>
                            <span className="font-black text-gray-900 text-sm">R$ {valor.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${porcentagem}%` }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 lg:col-span-1">
                <h3 className="font-black text-xl text-gray-900 mb-4 flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-blue-500" /> Vendas vs. Clima
                </h3>
                <p className="text-xs text-gray-500 font-medium mb-4">Baseado no histórico total do restaurante.</p>
                <div className="space-y-3">
                  {(Object.entries(analiseClima) as [string, { faturamento: number, dias: Set<string> }][])
                    .filter(([c]) => c !== 'Não Informado')
                    .map(([clima, dados]) => {
                    const faturamentoMedio = dados.dias.size > 0 ? dados.faturamento / dados.dias.size : 0;
                    return (
                      <div key={clima} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2">
                          {clima === 'Ensolarado' && <Sun className="w-5 h-5 text-yellow-500" />}
                          {clima === 'Chuvoso' && <Umbrella className="w-5 h-5 text-blue-500" />}
                          {(clima === 'Nublado' || clima === 'Frio') && <CloudRain className="w-5 h-5 text-gray-500" />}
                          <span className="font-bold text-gray-800 text-sm">{clima}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Fat. Médio/Dia</p>
                          <p className="font-black text-gray-900">R$ {faturamentoMedio.toFixed(2)}</p>
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(analiseClima).filter(c => c !== 'Não Informado').length === 0 && (
                    <p className="text-sm text-gray-500 italic">Preencha o clima no Histórico para ver a magia acontecer.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'estoque' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            {estoque.length === 0 ? (
               <div className="text-center p-10 text-gray-500">
                 <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p className="font-bold text-lg">Estoque Vazio</p>
                 <p>Clique no botão "Sincronizar Novos Produtos" para puxar seus itens.</p>
               </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-900 text-sm uppercase tracking-wider">
                      <th className="p-4 font-black">Produto</th>
                      <th className="p-4 font-black text-center">Medida</th>
                      <th className="p-4 font-black text-center">Quantidade Atual</th>
                      <th className="p-4 font-black text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(estoqueAgrupado) as [string, any[]][]).map(([categoria, itens]) => (
                      <React.Fragment key={categoria}>
                        <tr className="bg-gray-100 border-y border-gray-200">
                          <td colSpan={4} className="p-3 font-black text-gray-900 uppercase tracking-widest text-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                              {categoria}
                            </div>
                          </td>
                        </tr>
                        {itens.map((item: any) => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors">
                              <td className="p-4 font-extrabold text-gray-900">{item.nome_produto}</td>
                              <td className="p-4 text-center text-sm font-bold text-gray-800">{item.unidade_medida}</td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-1 md:gap-2">
                                  <button onClick={() => alterarQuantidadeEstoque(item.id, -1)} className="p-2 bg-white border border-gray-200 text-gray-900 hover:bg-red-50 hover:text-red-600 rounded-lg shadow-sm transition-colors active:scale-95"><Minus className="w-4 h-4" /></button>
                                  <input 
                                    type="number"
                                    min="0"
                                    value={item.quantidade_atual}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                      setEstoque(prev => prev.map(el => el.id === item.id ? { ...el, quantidade_atual: val } : el));
                                    }}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value);
                                      definirQuantidadeEstoque(item.id, isNaN(val) ? 0 : val);
                                    }}
                                    className="font-black text-xl md:text-2xl w-16 md:w-20 text-center text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-orange-500 focus:outline-none transition-colors"
                                  />
                                  <button onClick={() => alterarQuantidadeEstoque(item.id, 1)} className="p-2 bg-white border border-gray-200 text-gray-900 hover:bg-green-50 hover:text-green-600 rounded-lg shadow-sm transition-colors active:scale-95"><Plus className="w-4 h-4" /></button>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <select
                                  value={item.status || 'Adequado'}
                                  onChange={(e) => atualizarStatusEstoque(item.id, e.target.value)}
                                  className={`font-black p-2 rounded-full text-[10px] md:text-xs uppercase tracking-wide focus:outline-none cursor-pointer border shadow-sm transition-colors ${
                                    item.status === 'Repor' ? 'bg-red-200 text-red-900 border-red-300' : 'bg-green-200 text-green-900 border-green-300'
                                  }`}
                                >
                                  <option value="Adequado">OK / Adequado</option>
                                  <option value="Repor">⚠️ Repor</option>
                                </select>
                              </td>
                            </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'historico' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-4 md:p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-900 text-sm uppercase tracking-wider">
                    <th className="p-4 font-black">Data / Hora</th>
                    <th className="p-4 font-black">Mesa</th>
                    <th className="p-4 font-black">Pagamento</th>
                    <th className="p-4 font-black">Clima do Dia</th>
                    <th className="p-4 font-black text-right">Total</th>
                    <th className="p-4 font-black text-center">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFiltradas.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-bold">Nenhuma venda neste período.</td></tr>
                  ) : (
                    vendasFiltradas.map((venda) => (
                      <tr key={venda.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                            <CalendarClock className="w-5 h-5 text-gray-500" />
                            {new Date(venda.criado_em).toLocaleDateString('pt-BR')} <span className="text-gray-300">|</span> {new Date(venda.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="p-4 font-black text-gray-800 text-lg">{venda.mesa}</td>
                        <td className="p-4">
                          <select 
                            value={venda.forma_pagamento || ''}
                            onChange={(e) => atualizarPagamento(venda.id, e.target.value)}
                            className="font-bold p-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg focus:outline-none cursor-pointer shadow-sm text-sm"
                          >
                            <option value="PIX">PIX</option>
                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                            <option value="Cartão de Débito">Cartão de Débito</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Não Informado">Não Informado</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select 
                            value={venda.clima_condicao || ''}
                            onChange={(e) => atualizarClimaEmLote(e.target.value, venda.criado_em)}
                            className={`font-bold p-2 rounded-lg border focus:outline-none cursor-pointer shadow-sm text-sm ${venda.clima_condicao ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-300 text-gray-600'}`}
                          >
                            <option value="">☁️ Informar...</option>
                            <option value="Ensolarado">☀️ Ensolarado</option>
                            <option value="Nublado">☁️ Nublado</option>
                            <option value="Chuvoso">🌧️ Chuvoso</option>
                            <option value="Frio">❄️ Frio</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-black text-green-700 text-lg">R$</span>
                            <input 
                              type="number"
                              step="0.01"
                              defaultValue={Number(venda.valor_total).toFixed(2)}
                              onBlur={(e) => atualizarValorVenda(venda.id, parseFloat(e.target.value))}
                              className="w-24 font-black text-green-700 text-lg text-right bg-green-50 border border-green-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                            />
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setVendaExpandida(venda)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors" title="Ver Comanda">
                              <ReceiptText className="w-5 h-5" />
                            </button>
                            <button onClick={() => removerVenda(venda.id)} className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors" title="Remover">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DETALHES COMANDA */}
      {vendaExpandida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-black text-xl text-gray-900">Comanda Mesa {vendaExpandida.mesa}</h3>
              <button onClick={() => setVendaExpandida(null)} className="p-2 bg-gray-200 rounded-full text-gray-800 hover:bg-gray-300 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[50vh] bg-white">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Itens Consumidos</h4>
              {vendaExpandida.itens && vendaExpandida.itens.length > 0 ? (
                <ul className="space-y-3">
                  {vendaExpandida.itens.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="font-bold text-gray-800 text-sm">{item.quantidade}x {item.nome}</span>
                      <span className="text-gray-500 font-black text-sm">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-400 font-medium">Nenhum item detalhado nesta venda.</p>
              )}
            </div>
            <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-500 uppercase text-sm">Valor Final</span>
              <span className="font-black text-3xl text-green-700">R$ {Number(vendaExpandida.valor_total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}