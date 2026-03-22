'use client';

import React, { useState } from 'react';
import { ChevronLeft, Plus, Minus, ShoppingCart, Send, MessageSquare, UtensilsCrossed, CheckCircle2, XCircle, ListPlus, Trash2 } from 'lucide-react';
import { CATEGORIAS, PRODUTOS, Produto } from '../data/cardapio';
import { supabase } from '../lib/supabase';

// --- OPÇÕES FIXAS DE ACOMPANHAMENTOS ---
const OPCOES_ACOMPANHAMENTOS = [
  'Farofa', 'Farofa de ovo', 'Queijo provolone', 'Batata rústica', 
  'Aipim frito', 'Linguiça', 'Couve', 'Cebola', 'Molho vinagrete', 'Banana frita'
];

interface ItemPedido {
  uid: string;
  idProduto: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacao: string;
  setor: 'cozinha' | 'bar';
}

export default function GarcomApp() {
  const [montado, setMontado] = useState(false);

  React.useEffect(() => {
    setMontado(true);
  }, []);
  const [formaPagamentoAtual, setFormaPagamentoAtual] = useState('PIX');
  const [pagamentosPorMesa, setPagamentosPorMesa] = useState<Record<number, string>>({});
  const [mesaAtiva, setMesaAtiva] = useState<number | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState(CATEGORIAS[0]);
  
  const [carrinho, setCarrinho] = useState<ItemPedido[]>([]);
  const [comandasPorMesa, setComandasPorMesa] = useState<Record<number, ItemPedido[]>>({});
  
  const [modalCarrinhoAberto, setModalCarrinhoAberto] = useState(false);
  const [mesasAguardandoPagamento, setMesasAguardandoPagamento] = useState<number[]>([]);
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [incluirTaxa, setIncluirTaxa] = useState(true);

  const [modalAcomp, setModalAcomp] = useState<{
    produto: Produto;
    idOpcao: string;
    rotulo: string;
    preco: number;
  } | null>(null);
  const [selecaoAcomp, setSelecaoAcomp] = useState<Record<string, number>>({});

  // --- LÓGICA DE NAVEGAÇÃO ---
  const abrirMesa = (numeroMesa: number) => {
    console.log("Abrindo mesa:", numeroMesa);
    setCarrinho([]); 
    setMesaAtiva(numeroMesa);
    // Força o scroll para o topo para garantir que a troca de tela seja visível
    window.scrollTo(0, 0);
  };

  const voltarParaMesas = () => {
    setMesaAtiva(null);
    setModalCarrinhoAberto(false);
  };

  // --- LÓGICA DO CARRINHO ---
  const adicionarAoCarrinho = (produto: Produto, idFinal: string, rotulo: string, preco: number, observacao: string = '') => {
    setCarrinho((prev) => {
      const existenteIndex = prev.findIndex(i => i.idProduto === idFinal && i.observacao === observacao);
      if (existenteIndex >= 0) {
        const novo = [...prev];
        novo[existenteIndex] = { ...novo[existenteIndex], quantidade: novo[existenteIndex].quantidade + 1 };
        return novo;
      }
      return [...prev, {
        uid: Date.now().toString() + Math.random().toString(),
        idProduto: idFinal,
        nome: rotulo ? `${produto.nome} (${rotulo})` : produto.nome,
        preco: preco,
        quantidade: 1,
        observacao: observacao,
        setor: produto.setor
      }];
    });
  };

  const removerDoMenu = (idFinal: string) => {
    setCarrinho((prev) => {
      const itensDesseTipo = prev.filter(i => i.idProduto === idFinal);
      if (itensDesseTipo.length === 0) return prev;
      const ultimoAdicionado = itensDesseTipo[itensDesseTipo.length - 1];
      if (ultimoAdicionado.quantidade > 1) {
        return prev.map(i => i.uid === ultimoAdicionado.uid ? { ...i, quantidade: i.quantidade - 1 } : i);
      } else {
        return prev.filter(i => i.uid !== ultimoAdicionado.uid);
      }
    });
  };

  const alterarQuantidadeUID = (uid: string, delta: number) => {
    setCarrinho((prev) => prev.map(item => {
      if (item.uid === uid) return { ...item, quantidade: item.quantidade + delta };
      return item;
    }).filter(item => item.quantidade > 0));
  };

  const removerItemInteiroCarrinho = (uid: string) => {
    setCarrinho((prev) => prev.filter(item => item.uid !== uid));
  };

  const atualizarObservacaoUID = (uid: string, texto: string) => {
    setCarrinho((prev) => prev.map((item) => item.uid === uid ? { ...item, observacao: texto } : item));
  };

  // --- GATILHO DOS BOTÕES DO CARDÁPIO ---
  const handleBotaoMais = (produto: Produto, idOpcao?: string, rotulo?: string, preco?: number) => {
    if (produto.categoria === 'Carnes Principais') {
      setModalAcomp({
        produto,
        idOpcao: idOpcao || '',
        rotulo: rotulo || '',
        preco: preco || produto.preco
      });
      setSelecaoAcomp({});
    } else {
      const idFinal = idOpcao ? `${produto.id}-${idOpcao}` : produto.id;
      adicionarAoCarrinho(produto, idFinal, rotulo || '', preco !== undefined ? preco : produto.preco);
    }
  };

  const handleBotaoMenos = (produto: Produto, idOpcao?: string) => {
    const idFinal = idOpcao ? `${produto.id}-${idOpcao}` : produto.id;
    removerDoMenu(idFinal);
  };

  // --- LÓGICA DO MODAL DE ACOMPANHAMENTOS ---
  const totalAcompSelecionados = Object.values(selecaoAcomp).reduce((a, b) => a + b, 0);

  const incrementarAcomp = (nome: string) => {
    if (totalAcompSelecionados >= 4) return;
    setSelecaoAcomp(prev => ({ ...prev, [nome]: (prev[nome] || 0) + 1 }));
  };

  const decrementarAcomp = (nome: string) => {
    setSelecaoAcomp(prev => {
      const atual = prev[nome] || 0;
      if (atual <= 0) return prev;
      return { ...prev, [nome]: atual - 1 };
    });
  };

  const confirmarModalAcomp = () => {
    if (!modalAcomp) return;
    const partesObs = Object.entries(selecaoAcomp)
      .filter(([_, qtd]) => qtd > 0)
      .map(([nome, qtd]) => qtd > 1 ? `${qtd}x ${nome}` : nome);
    const textoObservacao = partesObs.join(', ');
    const idFinal = modalAcomp.idOpcao ? `${modalAcomp.produto.id}-${modalAcomp.idOpcao}` : modalAcomp.produto.id;
    adicionarAoCarrinho(modalAcomp.produto, idFinal, modalAcomp.rotulo, modalAcomp.preco, textoObservacao);
    setModalAcomp(null);
  };

  // --- LÓGICA DA COMANDA ---
  const alterarQuantidadeComanda = (uid: string, delta: number) => {
    if (!mesaAtiva) return;
    setComandasPorMesa((prev) => {
      const comandaAtual = prev[mesaAtiva] || [];
      const itemParaAlterar = comandaAtual.find(i => i.uid === uid);
      if (!itemParaAlterar) return prev;
      const novaQuantidade = itemParaAlterar.quantidade + delta;
      if (novaQuantidade <= 0) {
        if (window.confirm(`Deseja cancelar totalmente ${itemParaAlterar.nome}? Um aviso será enviado para a produção.`)) {
          if (itemParaAlterar.setor === 'cozinha') alert(`⚠️ AVISO PARA A COZINHA: Cancelar preparo de ${itemParaAlterar.nome} da Mesa ${mesaAtiva}!`);
          else alert(`⚠️ AVISO PARA O BAR: Cancelar ${itemParaAlterar.nome} da Mesa ${mesaAtiva}!`);
          return { ...prev, [mesaAtiva]: comandaAtual.filter(i => i.uid !== uid) };
        }
        return prev;
      }
      return { ...prev, [mesaAtiva]: comandaAtual.map(i => i.uid === uid ? { ...i, quantidade: novaQuantidade } : i) };
    });
  };

  const removerItemInteiroComanda = (uid: string) => {
    if (!mesaAtiva) return;
    setComandasPorMesa((prev) => {
      const comandaAtual = prev[mesaAtiva] || [];
      const itemParaRemover = comandaAtual.find(i => i.uid === uid);
      if (itemParaRemover) {
        if (itemParaRemover.setor === 'cozinha') alert(`⚠️ AVISO PARA A COZINHA: Cancelar preparo de ${itemParaRemover.nome} da Mesa ${mesaAtiva}!`);
        else alert(`⚠️ AVISO PARA O BAR: Cancelar ${itemParaRemover.nome} da Mesa ${mesaAtiva}!`);
      }
      return { ...prev, [mesaAtiva]: comandaAtual.filter(i => i.uid !== uid) };
    });
  };

  // --- ENVIO DO PEDIDO ---
  const enviarParaCozinhaEBar = async () => {
    if (carrinho.length === 0 || !mesaAtiva) return;
    const itensCozinha = carrinho.filter(item => item.setor === 'cozinha');
    if (itensCozinha.length > 0) {
      const { error } = await supabase
        .from('pedidos')
        .insert([{ mesa: mesaAtiva, status: 'pendente', itens: itensCozinha }]);
      if (error) {
        console.error("Erro ao enviar para o Supabase:", error);
        alert("Erro na conexão! O pedido não foi enviado para a cozinha.");
        return;
      }
    }
    setComandasPorMesa((prev) => {
      const comandaAtual = prev[mesaAtiva] || [];
      const novaComanda = [...comandaAtual];
      carrinho.forEach(itemCarrinho => {
        const indexExistente = novaComanda.findIndex(i => i.idProduto === itemCarrinho.idProduto && i.observacao === itemCarrinho.observacao);
        if (indexExistente >= 0) {
          novaComanda[indexExistente] = { ...novaComanda[indexExistente], quantidade: novaComanda[indexExistente].quantidade + itemCarrinho.quantidade };
        } else {
          novaComanda.push(itemCarrinho);
        }
      });
      return { ...prev, [mesaAtiva]: novaComanda };
    });
    setCarrinho([]);
    alert(`Pedido da Mesa ${mesaAtiva} enviado com sucesso!`);
    setModalCarrinhoAberto(false);
  };

  // --- CÁLCULOS ---
  const comandaDaMesaAtiva = mesaAtiva ? (comandasPorMesa[mesaAtiva] || []) : [];
  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const totalComanda = comandaDaMesaAtiva.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const totalGeral = totalCarrinho + totalComanda;
  const qtdItensCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const subtotalConta = totalComanda;
  const valorTaxa = incluirTaxa ? subtotalConta * 0.1 : 0;
  const totalFinalConta = subtotalConta + valorTaxa;

  const confirmarFechamentoConta = () => {
    if (!mesaAtiva) return;
    setPagamentosPorMesa(prev => ({ ...prev, [mesaAtiva!]: formaPagamentoAtual }));
    setMesasAguardandoPagamento(prev => !prev.includes(mesaAtiva!) ? [...prev, mesaAtiva!] : prev);
    alert(`Conta da Mesa ${mesaAtiva} enviada para o Caixa!`);
    setModalContaAberto(false);
    setModalCarrinhoAberto(false);
    setMesaAtiva(null);
  };

  const liberarMesaCaixa = async (numero: number, e: any) => {
    e.stopPropagation();
    if (window.confirm(`Confirmar pagamento e liberação da Mesa ${numero}?`)) {
      try {
        const itensConsumidos = comandasPorMesa[numero] || [];
        const subtotal = itensConsumidos.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        const totalFinal = incluirTaxa ? subtotal * 1.1 : subtotal;
        const pagamentoEscolhido = pagamentosPorMesa[numero] || 'Não Informado';

        const { error: erroHistorico } = await supabase.from('vendas_historico').insert([{
          mesa: numero,
          itens: itensConsumidos,
          valor_total: totalFinal,
          forma_pagamento: pagamentoEscolhido
        }]);
        if (erroHistorico) throw erroHistorico;

        try {
          const nomesConsumidos = itensConsumidos.map((item: any) => item.nome);
          const { data: estoqueAtual, error: erroBusca } = await supabase
            .from('estoque')
            .select('id, nome_produto, quantidade_atual')
            .in('nome_produto', nomesConsumidos);
          if (!erroBusca && estoqueAtual) {
            for (const itemConsumido of itensConsumidos) {
              const itemNoEstoque = estoqueAtual.find(e => e.nome_produto === itemConsumido.nome);
              if (itemNoEstoque) {
                const novaQuantidade = Math.max(0, Number(itemNoEstoque.quantidade_atual) - itemConsumido.quantidade);
                await supabase.from('estoque').update({ quantidade_atual: novaQuantidade }).eq('id', itemNoEstoque.id);
              }
            }
          }
        } catch (err) {
          console.error("Erro ao descontar do estoque:", err);
        }

        await supabase.from('pedidos').update({ status: 'finalizado' }).eq('mesa', numero);
        setComandasPorMesa(prev => { const novo = { ...prev }; delete novo[numero]; return novo; });
        setMesasAguardandoPagamento(prev => prev.filter(m => m !== numero));
        setPagamentosPorMesa(prev => { const novo = { ...prev }; delete novo[numero]; return novo; });
      } catch (error) {
        console.error("Erro ao fechar a mesa:", error);
        alert("Erro ao salvar histórico. Tente novamente.");
      }
    }
  };

  // ==========================================
  // TELA 1: SELEÇÃO DE MESAS
  // ==========================================
  if (!montado) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Carregando...</div>;

  if (mesaAtiva === null) {
    // ... resto do código das mesas
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
        
        <div className="w-full max-w-md mb-8 text-center">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-orange-600 mb-4" />
          <h1 className="text-3xl font-black text-gray-900">Salão Principal</h1>
          <p className="text-gray-700 font-medium mt-1">Selecione a mesa para iniciar o pedido</p>
        </div>

        {/* === BOTÃO DE TESTE PARA O CARDÁPIO === */}
        <button 
          type="button"
          onClick={() => {
            alert("Botão clicado!");
            abrirMesa(99);
          }}
          className="w-full max-w-md bg-red-600 text-white text-center font-black text-xl py-5 rounded-2xl shadow-xl mb-6 mt-4"
        >
          TESTE: ABRIR MESA 99
        </button>
        {/* ======================================= */}

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((numero) => {
            const itensNestaMesa = comandasPorMesa[numero] || [];
            const mesaOcupada = itensNestaMesa.length > 0;
            const aguardandoPagamento = mesasAguardandoPagamento.includes(numero);

            return (
              <div
                key={numero}
                className={`relative border-2 rounded-2xl py-8 flex flex-col items-center justify-center shadow-sm transition-all select-none cursor-pointer
                  ${aguardandoPagamento ? 'bg-blue-50 border-blue-300' : 
                    mesaOcupada ? 'bg-orange-50 border-orange-300 active:scale-95' : 
                    'bg-white border-gray-300 active:scale-95'}`}
                onClick={() => {
                  if (!aguardandoPagamento) abrirMesa(numero);
                }}
                onTouchEnd={(e) => {
                  // O onTouchEnd garante o funcionamento rápido no celular
                  if (!aguardandoPagamento) {
                    e.preventDefault(); // Evita que o celular clique duas vezes
                    abrirMesa(numero);
                  }
                }}
              >
                {mesaOcupada && !aguardandoPagamento && (
                  <div className="absolute top-3 right-3 w-3 h-3 bg-orange-600 rounded-full animate-pulse" />
                )}

                <span className={`text-sm font-bold uppercase tracking-widest mb-1 pointer-events-none
                  ${aguardandoPagamento ? 'text-blue-700' : mesaOcupada ? 'text-orange-700' : 'text-gray-600'}`}>
                  Mesa
                </span>
                
                <span className={`text-4xl font-black pointer-events-none
                  ${aguardandoPagamento ? 'text-blue-800' : mesaOcupada ? 'text-orange-800' : 'text-gray-900'}`}>
                  {numero}
                </span>

                {aguardandoPagamento && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      liberarMesaCaixa(numero, e);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      liberarMesaCaixa(numero, e);
                    }}
                    className="absolute bottom-3 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-blue-700 active:scale-95 shadow-sm"
                  >
                    Liberar Mesa
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA 2: CARDÁPIO DA MESA
  // ==========================================
  const produtosFiltrados = PRODUTOS.filter(p => p.categoria === categoriaAtiva);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button onClick={voltarParaMesas} className="p-2 text-gray-800 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Mesa {mesaAtiva}</h2>
            {totalComanda > 0 && <p className="text-sm text-orange-700 font-bold">Comanda: R$ {totalComanda.toFixed(2)}</p>}
          </div>
          <button onClick={() => setModalCarrinhoAberto(true)} className="p-2 text-gray-800 bg-gray-100 rounded-full relative hover:bg-gray-200 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {(qtdItensCarrinho > 0 || comandaDaMesaAtiva.length > 0) && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">!</span>
            )}
          </button>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar p-3 gap-2">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-colors
                ${categoriaAtiva === cat ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {produtosFiltrados.map((produto) => {

          if (produto.opcoesTamanho) {
            return (
              <div key={produto.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-extrabold text-gray-900">{produto.nome}</h3>
                <p className="text-sm text-orange-700 font-semibold mt-1">{produto.descricao}</p>
                <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                  {produto.opcoesTamanho.map(opcao => {
                    const idFinal = `${produto.id}-${opcao.idOpcao}`;
                    const quantidade = carrinho.filter(c => c.idProduto === idFinal).reduce((a, b) => a + b.quantidade, 0);
                    return (
                      <div key={opcao.idOpcao} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{opcao.rotulo}</p>
                          <p className="font-bold text-gray-700 text-sm mt-0.5">R$ {opcao.preco.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-lg p-1 shadow-sm border border-gray-300">
                          <button
                            onClick={() => handleBotaoMenos(produto, opcao.idOpcao)}
                            className={`p-1.5 rounded ${quantidade > 0 ? 'text-gray-900' : 'text-gray-400'}`}
                            disabled={quantidade === 0}
                          ><Minus className="w-5 h-5" /></button>
                          <span className="font-black w-6 text-center text-black text-lg">{quantidade}</span>
                          <button
                            onClick={() => handleBotaoMais(produto, opcao.idOpcao, opcao.rotulo, opcao.preco)}
                            className="p-1.5 text-gray-900 rounded active:scale-95"
                          ><Plus className="w-5 h-5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          const quantidade = carrinho.filter(c => c.idProduto === produto.id).reduce((a, b) => a + b.quantidade, 0);

          return (
            <div key={produto.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center gap-4">
              <div className="flex-1">
                <h3 className="font-extrabold text-gray-900">{produto.nome}</h3>
                {produto.descricao && <p className="text-sm text-gray-700 font-medium mt-1 line-clamp-2">{produto.descricao}</p>}
                <p className="font-bold text-gray-900 mt-2 text-base">R$ {produto.preco.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-300 shadow-sm">
                <button
                  onClick={() => handleBotaoMenos(produto)}
                  className={`p-2 rounded-lg ${quantidade > 0 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                  disabled={quantidade === 0}
                ><Minus className="w-5 h-5" /></button>
                <span className="font-black w-6 text-center text-black text-lg">{quantidade}</span>
                <button
                  onClick={() => handleBotaoMais(produto)}
                  className="p-2 bg-white text-gray-900 rounded-lg shadow-sm active:scale-95 transition-transform"
                ><Plus className="w-5 h-5" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE ACOMPANHAMENTOS */}
      {modalAcomp && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg max-h-[85vh] rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-xl text-gray-900">Escolha 4 Opções</h3>
                <button onClick={() => setModalAcomp(null)} className="p-2 bg-gray-200 rounded-full text-gray-800"><XCircle className="w-5 h-5" /></button>
              </div>
              <p className="text-base font-bold text-orange-700">{modalAcomp.produto.nome} {modalAcomp.rotulo && `(${modalAcomp.rotulo})`}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
              {OPCOES_ACOMPANHAMENTOS.map((acomp) => {
                const qtdSelecionada = selecaoAcomp[acomp] || 0;
                return (
                  <div key={acomp} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <span className="font-extrabold text-gray-900">{acomp}</span>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1 border border-gray-300">
                      <button
                        onClick={() => decrementarAcomp(acomp)}
                        className={`p-1.5 rounded ${qtdSelecionada > 0 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                        disabled={qtdSelecionada === 0}
                      ><Minus className="w-5 h-5" /></button>
                      <span className="font-black w-6 text-center text-black text-lg">{qtdSelecionada}</span>
                      <button
                        onClick={() => incrementarAcomp(acomp)}
                        className={`p-1.5 rounded ${totalAcompSelecionados < 4 ? 'bg-white text-gray-900 shadow-sm active:scale-95' : 'text-gray-400'}`}
                        disabled={totalAcompSelecionados >= 4}
                      ><Plus className="w-5 h-5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 bg-white border-t border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 font-bold">Selecionados:</span>
                <span className={`font-black text-xl ${totalAcompSelecionados === 4 ? 'text-green-600' : 'text-orange-600'}`}>
                  {totalAcompSelecionados} / 4
                </span>
              </div>
              <button
                onClick={confirmarModalAcomp}
                disabled={totalAcompSelecionados === 0}
                className={`w-full font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all
                  ${totalAcompSelecionados > 0 ? 'bg-orange-600 text-white shadow-orange-600/30 active:scale-[0.98]' : 'bg-gray-300 text-gray-600'}`}
              >
                <ListPlus className="w-5 h-5" /> Confirmar Acompanhamentos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO CARRINHO E COMANDA */}
      {modalCarrinhoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end flex-col bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-h-[90vh] rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-200">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-100 rounded-t-3xl">
              <div>
                <h3 className="font-black text-2xl text-gray-900">Resumo da Mesa {mesaAtiva}</h3>
                <p className="text-gray-700 font-bold">Total Acumulado: R$ {totalGeral.toFixed(2)}</p>
              </div>
              <button onClick={() => setModalCarrinhoAberto(false)} className="p-2 bg-white border border-gray-300 rounded-full text-gray-800 shadow-sm">
                <ChevronLeft className="w-6 h-6 rotate-[-90deg]" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-8 bg-gray-50">
              {carrinho.length > 0 && (
                <div>
                  <h4 className="text-sm font-black text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Novo Pedido (A Enviar)
                  </h4>
                  <div className="space-y-3">
                    {carrinho.map((item) => (
                      <div key={item.uid} className="bg-white p-4 rounded-2xl border-2 border-orange-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-900 flex-1 pr-2 text-base">{item.nome}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 border border-gray-300">
                              <button onClick={() => alterarQuantidadeUID(item.uid, -1)} className="p-1 bg-white rounded shadow-sm"><Minus className="w-4 h-4" /></button>
                              <span className="font-black w-6 text-center text-black text-lg">{item.quantidade}</span>
                              <button onClick={() => alterarQuantidadeUID(item.uid, 1)} className="p-1 bg-white rounded shadow-sm"><Plus className="w-4 h-4" /></button>
                            </div>
                            <button
                              onClick={() => removerItemInteiroCarrinho(item.uid)}
                              className="p-1.5 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors border border-red-200"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <MessageSquare className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                            <textarea
                              placeholder="Observações adicionais..."
                              className="w-full text-sm font-medium outline-none text-gray-800 bg-transparent resize-none h-10"
                              value={item.observacao}
                              onChange={(e) => atualizarObservacaoUID(item.uid, e.target.value)}
                            />
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gray-900 text-base">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={enviarParaCozinhaEBar}
                    className="w-full mt-4 bg-orange-600 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
                  >
                    <Send className="w-5 h-5" /> Enviar Novos Itens (R$ {totalCarrinho.toFixed(2)})
                  </button>
                </div>
              )}

              <div>
                <h4 className="text-sm font-black text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Já na Comanda
                </h4>
                {comandaDaMesaAtiva.length === 0 ? (
                  <p className="text-base font-medium text-gray-500 italic">Nenhum item confirmado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {comandaDaMesaAtiva.map((item) => (
                      <div key={item.uid} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-gray-900 text-base">{item.nome}</p>
                            {item.observacao && <p className="text-sm font-medium text-gray-600 line-clamp-2 mt-1">Obs: {item.observacao}</p>}
                          </div>
                          <span className="font-black text-gray-900 text-base ml-2 whitespace-nowrap">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 border border-gray-300">
                            <button onClick={() => alterarQuantidadeComanda(item.uid, -1)} className="p-1 bg-white rounded shadow-sm text-gray-900"><Minus className="w-4 h-4" /></button>
                            <span className="font-black w-6 text-center text-sm">{item.quantidade}</span>
                            <button onClick={() => alterarQuantidadeComanda(item.uid, 1)} className="p-1 bg-white rounded shadow-sm text-gray-900"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Deseja cancelar totalmente ${item.nome}? Um aviso será enviado para a produção.`)) {
                                removerItemInteiroComanda(item.uid);
                              }
                            }}
                            className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors border border-red-200 font-bold text-sm flex items-center gap-1.5"
                          ><Trash2 className="w-4 h-4" /> Cancelar Item</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {comandaDaMesaAtiva.length > 0 && carrinho.length === 0 && (
                <div className="pt-4 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setModalContaAberto(true)}
                    className="w-full bg-gray-900 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
                  >
                    Pedir a Conta (R$ {totalComanda.toFixed(2)})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE */}
      {!modalCarrinhoAberto && !modalAcomp && totalGeral > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-20">
          <button
            onClick={() => setModalCarrinhoAberto(true)}
            className={`w-full text-white rounded-2xl p-4 flex items-center justify-between shadow-xl active:scale-[0.98] transition-all
              ${qtdItensCarrinho > 0 ? 'bg-orange-600 shadow-orange-600/30' : 'bg-gray-900 shadow-gray-900/30'}`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl relative">
                <ShoppingCart className="w-5 h-5" />
                {qtdItensCarrinho > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {qtdItensCarrinho}
                  </span>
                )}
              </div>
              <span className="font-bold text-lg">{qtdItensCarrinho > 0 ? 'Concluir Pedido' : 'Ver Comanda'}</span>
            </div>
            <span className="font-black text-xl">R$ {totalGeral.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* MODAL DE FECHAMENTO DE CONTA */}
      {modalContaAberto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md max-h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-black text-2xl text-gray-900">Conta Mesa {mesaAtiva}</h3>
              <button onClick={() => setModalContaAberto(false)} className="p-2 bg-gray-200 rounded-full text-gray-800 hover:bg-gray-300 transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-white hide-scrollbar">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Itens Consumidos</h4>
              {comandaDaMesaAtiva.map(item => (
                <div key={item.uid} className="flex justify-between items-center text-gray-800 border-b border-gray-100 pb-2">
                  <span className="font-bold text-sm">{item.quantidade}x {item.nome}</span>
                  <span className="font-black text-sm">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-200 space-y-4">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-bold">Subtotal</span>
                <span className="font-black">R$ {subtotalConta.toFixed(2)}</span>
              </div>

              <div
                className="flex justify-between items-center text-gray-900 bg-white p-3 rounded-xl border border-gray-200 shadow-sm cursor-pointer select-none active:scale-[0.98] transition-transform"
                onClick={() => setIncluirTaxa(!incluirTaxa)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${incluirTaxa ? 'bg-orange-600' : 'bg-gray-200'}`}>
                    {incluirTaxa && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="font-extrabold text-sm">Taxa de Serviço (10%)</span>
                </div>
                <span className="font-black">R$ {valorTaxa.toFixed(2)}</span>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Forma de Pagamento</label>
                <select
                  value={formaPagamentoAtual}
                  onChange={(e) => setFormaPagamentoAtual(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 font-bold p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-black text-2xl text-gray-900">Total</span>
                <span className="font-black text-3xl text-orange-700">R$ {totalFinalConta.toFixed(2)}</span>
              </div>

              <button
                onClick={confirmarFechamentoConta}
                className="w-full mt-2 bg-orange-600 text-white font-black text-lg py-4 rounded-xl shadow-lg hover:bg-orange-500 active:scale-[0.98] transition-transform"
              >
                Imprimir e Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}