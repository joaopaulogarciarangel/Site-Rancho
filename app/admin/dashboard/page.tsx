'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PRODUTOS } from '@/data/cardapio'; 
import { 
  LogOut, LayoutDashboard, Package, TrendingUp, CloudRain, 
  CalendarClock, CreditCard, Download, Trash2, Plus, Minus, AlertTriangle, RefreshCw, ReceiptText, XCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [abaAtiva, setAbaAtiva] = useState('estoque'); 
  const [vendas, setVendas] = useState<any[]>([]);
  const [vendaExpandida, setVendaExpandida] = useState<any>(null);
  const [estoque, setEstoque] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/admin/login';
      } else {
        setUser(session.user);
        buscarHistorico();
        buscarEstoque();
      }
    };
    checkUser();

    // REALTIME: VENDAS E ESTOQUE
    const channelVendas = supabase
      .channel('mudancas-vendas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas_historico' }, () => buscarHistorico())
      .subscribe();

    const channelEstoque = supabase
      .channel('mudancas-estoque')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, () => buscarEstoque())
      .subscribe();

    return () => { 
      supabase.removeChannel(channelVendas); 
      supabase.removeChannel(channelEstoque); 
    };
  }, []);

  // ==========================================
  // LÓGICAS DE HISTÓRICO DE VENDAS
  // ==========================================
  const buscarHistorico = async () => {
    const { data } = await supabase.from('vendas_historico').select('*').order('criado_em', { ascending: false });
    if (data) setVendas(data);
    setLoading(false);
  };

  const atualizarClimaEmLote = async (idVenda: string, condicao: string, dataIso: string) => {
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

  const atualizarPagamento = async (idVenda: string, pagamento: string) => {
    setVendas(prev => prev.map(v => v.id === idVenda ? { ...v, forma_pagamento: pagamento } : v));
    await supabase.from('vendas_historico').update({ forma_pagamento: pagamento }).eq('id', idVenda);
  };

  // NOVA FUNÇÃO: Atualiza o preço da venda diretamente
  const atualizarValorVenda = async (idVenda: string, novoValor: number) => {
    if (isNaN(novoValor)) return;
    
    // Atualização otimista na tela
    setVendas(prev => prev.map(v => v.id === idVenda ? { ...v, valor_total: novoValor } : v));
    
    // Salva no banco de dados
    await supabase.from('vendas_historico').update({ valor_total: novoValor }).eq('id', idVenda);
  };

  const removerVenda = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta venda permanentemente?")) return;
    setVendas(prev => prev.filter(v => v.id !== id));
    await supabase.from('vendas_historico').delete().eq('id', id);
  };

  const exportarCSV = () => {
    if (vendas.length === 0) return alert("Nenhum dado para exportar.");
    
    // NOVO: Coluna "Itens Consumidos" adicionada
    const cabecalho = ["Data", "Hora", "Mesa", "Forma de Pagamento", "Temperatura", "Clima", "Valor Total", "Itens Consumidos"];
    
    const linhas = vendas.map(v => {
      const data = new Date(v.criado_em).toLocaleDateString('pt-BR');
      const hora = new Date(v.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      
      // NOVO: Formata os itens para texto contínuo
      const itensFormatados = v.itens && Array.isArray(v.itens) 
        ? v.itens.map((i: any) => `${i.quantidade}x ${i.nome}`).join(' - ')
        : 'Sem registro';

      return [
        data, hora, v.mesa, v.forma_pagamento || 'N/D', v.clima_temperatura ? `${v.clima_temperatura}C` : 'N/D',
        v.clima_condicao || 'N/D', Number(v.valor_total).toFixed(2).replace('.', ','),
        `"${itensFormatados}"` // Aspas evitam que o Excel quebre as colunas
      ].join(';');
    });

    const blob = new Blob(["\uFEFF" + [cabecalho.join(';'), ...linhas].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `historico_vendas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // ==========================================
  // LÓGICAS DE ESTOQUE
  // ==========================================
  const buscarEstoque = async () => {
    const { data } = await supabase.from('estoque').select('*').order('nome_produto', { ascending: true });
    if (data) setEstoque(data);
  };

  const alterarQuantidadeEstoque = async (id: string, delta: number) => {
    const item = estoque.find(e => e.id === id);
    if (!item) return;
    
    const novaQtd = Math.max(0, Number(item.quantidade_atual) + delta);
    setEstoque(prev => prev.map(e => e.id === id ? { ...e, quantidade_atual: novaQtd } : e));
    await supabase.from('estoque').update({ quantidade_atual: novaQtd }).eq('id', id);
  };

  const atualizarStatusEstoque = async (id: string, novoStatus: string) => {
    // Atualiza otimista na tela
    setEstoque(prev => prev.map(e => e.id === id ? { ...e, status: novoStatus } : e));
    // Salva no banco de dados
    await supabase.from('estoque').update({ status: novoStatus }).eq('id', id);
  };

  const importarCardapioParaEstoque = async () => {
    if (!window.confirm("Isso vai importar os produtos do seu arquivo cardapio.ts para o banco. Continuar?")) return;
    
    const novosInsumos = PRODUTOS.map(p => ({
      nome_produto: p.nome,
      categoria: p.categoria,
      unidade_medida: p.setor === 'bar' ? 'Unidade' : 'Porção', 
      quantidade_atual: 0,
      estoque_minimo: p.setor === 'bar' ? 24 : 10, 
      custo_unitario: 0
    }));

    const { error } = await supabase.from('estoque').insert(novosInsumos);
    if (error) {
      console.error(error);
      alert("Erro ao importar. Verifique se a tabela estoque foi criada corretamente.");
    } else {
      alert("Produtos importados com sucesso!");
      buscarEstoque();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  // AGRUPAMENTO DO ESTOQUE POR CATEGORIA
  const estoqueAgrupado = estoque.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-950 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-black tracking-wider text-orange-500 uppercase">Backoffice</h1>
          <p className="text-xs text-gray-500 font-bold mt-1 truncate">{user?.email}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setAbaAtiva('resumo')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${abaAtiva === 'resumo' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}> <LayoutDashboard className="w-5 h-5" /> Visão Geral</button>
          <button onClick={() => setAbaAtiva('historico')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${abaAtiva === 'historico' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}> <TrendingUp className="w-5 h-5" /> Histórico e Clima</button>
          <button onClick={() => setAbaAtiva('estoque')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${abaAtiva === 'estoque' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}> <Package className="w-5 h-5" /> Controle de Estoque</button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all"> <LogOut className="w-5 h-5" /> Sair </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              {abaAtiva === 'resumo' && 'Visão Geral do Negócio'}
              {abaAtiva === 'historico' && 'Histórico de Vendas'}
              {abaAtiva === 'estoque' && 'Controle de Estoque'}
            </h2>
          </div>
          
          {/* BOTÕES DE AÇÃO DO HEADER */}
          {abaAtiva === 'historico' && (
            <button onClick={exportarCSV} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg active:scale-95"> <Download className="w-5 h-5" /> Exportar CSV </button>
          )}
          {abaAtiva === 'estoque' && estoque.length === 0 && (
            <button onClick={importarCardapioParaEstoque} className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg active:scale-95"> <RefreshCw className="w-5 h-5" /> Importar do Cardápio </button>
          )}
        </header>

        {/* ==========================================
            ABA: VISÃO GERAL
            ========================================== */}
        {abaAtiva === 'resumo' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <LayoutDashboard className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-2xl font-black text-gray-800">Painel Financeiro</h3>
            <p className="text-gray-500 font-medium mt-2">Em breve: Gráficos de faturamento e ticket médio.</p>
          </div>
        )}

        {/* ==========================================
            ABA: ESTOQUE
            ========================================== */}
        {abaAtiva === 'estoque' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            {estoque.length === 0 ? (
               <div className="text-center p-10 text-gray-500">
                 <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p className="font-bold text-lg">Estoque Vazio</p>
                 <p>Clique no botão "Importar do Cardápio" lá em cima para puxar seus itens.</p>
               </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-900 text-sm uppercase tracking-wider">
                      <th className="p-4 font-black">Produto</th>
                      <th className="p-4 font-black text-center">Medida</th>
                      <th className="p-4 font-black text-center">Quantidade Atual</th>
                      <th className="p-4 font-black text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(estoqueAgrupado).map(([categoria, itens]) => (
                      <React.Fragment key={categoria}>
                        {/* CABEÇALHO DA CATEGORIA CHAMATIVO */}
                        <tr className="bg-gray-100 border-y border-gray-200">
                          <td colSpan={4} className="p-3 font-black text-gray-900 uppercase tracking-widest text-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                              {categoria}
                            </div>
                          </td>
                        </tr>
                        
                        {/* ITENS DA CATEGORIA */}
                        {itens.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors">
                              <td className="p-4 font-extrabold text-gray-900">{item.nome_produto}</td>
                              <td className="p-4 text-center text-sm font-bold text-gray-800">{item.unidade_medida}</td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-3">
                                  <button onClick={() => alterarQuantidadeEstoque(item.id, -1)} className="p-2 bg-white border border-gray-200 text-gray-900 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg shadow-sm transition-colors"><Minus className="w-4 h-4" /></button>
                                  <span className="font-black text-2xl w-12 text-center text-gray-900">{item.quantidade_atual}</span>
                                  <button onClick={() => alterarQuantidadeEstoque(item.id, 1)} className="p-2 bg-white border border-gray-200 text-gray-900 hover:bg-green-50 hover:text-green-600 hover:border-green-200 rounded-lg shadow-sm transition-colors"><Plus className="w-4 h-4" /></button>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                {/* CAIXA DE SELEÇÃO DE STATUS DO ESTOQUE */}
                                <select
                                  value={item.status || 'Adequado'}
                                  onChange={(e) => atualizarStatusEstoque(item.id, e.target.value)}
                                  className={`font-black p-2 rounded-full text-[10px] uppercase tracking-wide focus:outline-none cursor-pointer border shadow-sm transition-colors ${
                                    item.status === 'Repor' 
                                      ? 'bg-red-200 text-red-900 border-red-300' 
                                      : 'bg-green-200 text-green-900 border-green-300'
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

        {/* ==========================================
            ABA: HISTÓRICO DE VENDAS
            ========================================== */}
        {abaAtiva === 'historico' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
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
                  {vendas.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-bold">Nenhuma venda registrada.</td></tr>
                  ) : (
                    vendas.map((venda) => (
                      <tr key={venda.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2 font-bold text-gray-900">
                            <CalendarClock className="w-5 h-5 text-gray-500" />
                            {new Date(venda.criado_em).toLocaleDateString('pt-BR')} <span className="text-gray-300">|</span> {new Date(venda.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="p-4 font-black text-gray-800 text-lg">{venda.mesa}</td>
                        <td className="p-4">
                          <select 
                            value={venda.forma_pagamento || ''}
                            onChange={(e) => atualizarPagamento(venda.id, e.target.value)}
                            className="font-bold p-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg focus:outline-none cursor-pointer shadow-sm"
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
                            onChange={(e) => atualizarClimaEmLote(venda.id, e.target.value, venda.criado_em)}
                            className={`font-bold p-2 rounded-lg border focus:outline-none cursor-pointer shadow-sm ${venda.clima_condicao ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-300 text-gray-600'}`}
                          >
                            <option value="">☁️ Informar...</option>
                            <option value="Ensolarado">☀️ Ensolarado</option>
                            <option value="Nublado">☁️ Nublado</option>
                            <option value="Chuvoso">🌧️ Chuvoso</option>
                            <option value="Frio">❄️ Frio</option>
                          </select>
                        </td>
                        <td className="p-4">
                          {/* NOVO: CAMPO EDITÁVEL DE PREÇO NO HISTÓRICO */}
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-black text-green-700 text-xl">R$</span>
                            <input 
                              type="number"
                              step="0.01"
                              defaultValue={Number(venda.valor_total).toFixed(2)}
                              onBlur={(e) => atualizarValorVenda(venda.id, parseFloat(e.target.value))}
                              className="w-32 font-black text-green-700 text-xl text-right bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all"
                            />
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* NOVO: Botão de Ver Comanda */}
                            <button 
                              onClick={() => setVendaExpandida(venda)} 
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors" 
                              title="Ver Comanda"
                            >
                              <ReceiptText className="w-5 h-5" />
                            </button>
                            {/* Botão de Excluir */}
                            <button 
                              onClick={() => removerVenda(venda.id)} 
                              className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors" 
                              title="Remover"
                            >
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
      {/* ==========================================
          MODAL: DETALHES DA COMANDA
          ========================================== */}
      {vendaExpandida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-black text-xl text-gray-900">
                Comanda Mesa {vendaExpandida.mesa}
              </h3>
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
                <p className="text-center text-gray-400 font-medium">Nenhum item detalhado salvo nesta venda.</p>
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