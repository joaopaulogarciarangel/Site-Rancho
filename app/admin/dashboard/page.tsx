'use client';
export const dynamic = 'force-dynamic';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PRODUTOS } from '@/data/cardapio'; 
import { 
  LogOut, LayoutDashboard, Package, TrendingUp, CloudRain, 
  CalendarClock, Download, Trash2, Plus, Minus, 
  RefreshCw, ReceiptText, XCircle, Target, 
  PieChart, BarChart3, Sun, Umbrella, Activity, CheckCircle2, Check,
  Search, TrendingDown, LayoutGrid, Calendar
} from 'lucide-react';

// Input de data no formato DD/MM/AAAA com picker nativo ao clicar no ícone
function BRDateInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const toDisplay = (v: string) => v ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : '';
  const [text, setText] = useState(toDisplay(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setText(toDisplay(value)); }, [value]);

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let fmt = digits;
    if (digits.length > 2) fmt = digits.slice(0, 2) + '/' + digits.slice(2);
    if (digits.length > 4) fmt = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    setText(fmt);
    if (digits.length === 8) {
      const iso = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
      if (!isNaN(new Date(iso).getTime())) onChange(iso);
    }
  };

  const handlePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setText(toDisplay(e.target.value));
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={text}
        onChange={handleText}
        placeholder="DD/MM/AAAA"
        maxLength={10}
        className={className}
      />
      <button type="button" onClick={() => pickerRef.current?.showPicker()} className="absolute right-3 text-gray-400 hover:text-orange-500">
        <Calendar className="w-4 h-4" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        value={value}
        onChange={handlePicker}
        className="absolute inset-0 opacity-0 pointer-events-none w-0"
        tabIndex={-1}
      />
    </div>
  );
}

export default function AdminDashboard() {
  const cupomRef = useRef<HTMLDivElement>(null); 

  const INSUMOS_RESTAURANTE = [
  // Carnes
  { nome: "Carne - Baby Beef", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Bacon", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Beef Chorizo", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Carne seca", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Filé Mignon", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Filé Mignon Suíno", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Frango (Peito)", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Linguiça Cofril", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Linguiça Calabresa", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne - Picanha", categoria: "Carnes", unidade: "kg" },
  
  // Hortifruti
  { nome: "Alho", categoria: "Hortifruti", unidade: "kg" },
  { nome: "Banana da Terra", categoria: "Hortifruti", unidade: "kg" },
  { nome: "Batata", categoria: "Hortifruti", unidade: "kg" },
  { nome: "Cebola", categoria: "Hortifruti", unidade: "kg" },
  { nome: "Couve", categoria: "Hortifruti", unidade: "Molho" },
  { nome: "Laranja", categoria: "Hortifruti", unidade: "kg" },
  { nome: "Limão", categoria: "Hortifruti", unidade: "kg" },
  { nome: "Tomate", categoria: "Hortifruti", unidade: "kg" },
  { nome: "Ovo Branco (Cartela)", categoria: "Hortifruti", unidade: "Unidade" },

  // Mercearia e Secos
  { nome: "Açúcar Cristal", categoria: "Mercearia", unidade: "kg" },
  { nome: "Açúcar Refinado", categoria: "Mercearia", unidade: "kg" },
  { nome: "Arroz - Fighera (5kg)", categoria: "Mercearia", unidade: "Pacote" },
  { nome: "Azeite - Ama Lusa", categoria: "Mercearia", unidade: "Garrafa" },
  { nome: "Café - Melita", categoria: "Mercearia", unidade: "Pacote" },
  { nome: "Creme de Leite", categoria: "Mercearia", unidade: "Caixa" },
  { nome: "Farinha", categoria: "Mercearia", unidade: "kg" },
  { nome: "Farinha de Trigo", categoria: "Mercearia", unidade: "kg" },
  { nome: "Feijão Preto", categoria: "Mercearia", unidade: "kg" },
  { nome: "Feijão Vermelho", categoria: "Mercearia", unidade: "kg" },
  { nome: "Leite Condensado", categoria: "Mercearia", unidade: "Caixa" },
  { nome: "Óleo de Soja", categoria: "Mercearia", unidade: "Garrafa" },
  { nome: "Pão - Minibaguete", categoria: "Mercearia", unidade: "Pct (10)" },
  { nome: "Sal Churrasco", categoria: "Mercearia", unidade: "kg" },
  { nome: "Sal Cozinha", categoria: "Mercearia", unidade: "kg" },
  { nome: "Sal Grosso", categoria: "Mercearia", unidade: "kg" },

  // Temperos e Condimentos
  { nome: "Canela", categoria: "Temperos", unidade: "Unidade" },
  { nome: "Tempero Alecrim", categoria: "Temperos", unidade: "Unidade" },
  { nome: "Tempero Chimichurri", categoria: "Temperos", unidade: "Unidade" },
  { nome: "Tempero Ervas", categoria: "Temperos", unidade: "Unidade" },

  // Laticínios e Sorvetes
  { nome: "Margarina Qualy", categoria: "Laticínios", unidade: "kg" },
  { nome: "Queijo Provolone", categoria: "Laticínios", unidade: "kg" },
  { nome: "Sorvete Creme", categoria: "Sobremesas", unidade: "Pote" },
  { nome: "Gelo", categoria: "Diversos", unidade: "Saco" },

  // Bebidas (Bar)
  { nome: "Água Mineral c/ Gás", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Água Mineral s/ Gás", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Cachaça Velho Barreiro", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Coca-Cola 600ml", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Coca-Cola KS", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Guaraná Lata", categoria: "Bebidas", unidade: "Lata" },
  { nome: "Guaravita", categoria: "Bebidas", unidade: "Copo" },
  { nome: "Mineirinho", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Suco Lata", categoria: "Bebidas", unidade: "Lata" },
  { nome: "Vinho", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Vodka", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Cerveja Amstel 600ml", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Cerveja Heineken 600ml", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Cerveja Original 600ml", categoria: "Bebidas", unidade: "Garrafa" },
  { nome: "Cerveja Stella Artois 300ml", categoria: "Bebidas", unidade: "Garrafa" },

  // Bomboniere
  { nome: "Bala - Halls", categoria: "Bomboniere", unidade: "Unidade" },
  { nome: "Bala - Mentos", categoria: "Bomboniere", unidade: "Unidade" },
  { nome: "Bala - Trident", categoria: "Bomboniere", unidade: "Unidade" },

  // Limpeza
  { nome: "Água Sanitária", categoria: "Limpeza", unidade: "Litro" },
  { nome: "Álcool 70%", categoria: "Limpeza", unidade: "Frasco" },
  { nome: "Desinfetante UAU", categoria: "Limpeza", unidade: "Frasco" },
  { nome: "Detergente", categoria: "Limpeza", unidade: "Frasco" },
  { nome: "Esponja", categoria: "Limpeza", unidade: "Unidade" },
  { nome: "Pano Multiuso", categoria: "Limpeza", unidade: "Unidade" },
  { nome: "Veja", categoria: "Limpeza", unidade: "Frasco" },

  // Descartáveis e Uso Geral
  { nome: "Botijão de Gás", categoria: "Diversos", unidade: "Unidade" },
  { nome: "Fósforos", categoria: "Diversos", unidade: "Pacote" },
  { nome: "Embalagem Viagem", categoria: "Descartáveis", unidade: "Unidade" },
  { nome: "Guardanapo Cozinha", categoria: "Descartáveis", unidade: "Pacote" },
  { nome: "Guardanapo Mesa", categoria: "Descartáveis", unidade: "Pacote" },
  { nome: "Filtro de Café", categoria: "Descartáveis", unidade: "Unidade" },
  { nome: "Papel Higiênico", categoria: "Descartáveis", unidade: "Pacote" },
  { nome: "Papel Toalha Lavabo", categoria: "Descartáveis", unidade: "Pacote" },
  { nome: "Papel Toalha Cozinha", categoria: "Descartáveis", unidade: "Pacote" },
  { nome: "Sacola Bobina 20x30", categoria: "Descartáveis", unidade: "Rolo" },
];
  const [buscaEstoque, setBuscaEstoque] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [abaAtiva, setAbaAtiva] = useState('resumo'); 
  const [vendas, setVendas] = useState<any[]>([]);
  const [vendaExpandida, setVendaExpandida] = useState<any>(null);
  const [estoque, setEstoque] = useState<any[]>([]);
  
  const [pedidosAtivos, setPedidosAtivos] = useState<any[]>([]); 
  
  // Estados para a aba de Fechamento (Caixa)
  const [comandasCaixa, setComandasCaixa] = useState<Record<number, any[]>>({});
  const [mesasAguardando, setMesasAguardando] = useState<number[]>([]);
  const [mesaSelecionadaCaixa, setMesaSelecionadaCaixa] = useState<number | null>(null);
  const [incluirTaxa, setIncluirTaxa] = useState(true);
  const [formaPagamentoCaixa, setFormaPagamentoCaixa] = useState('PIX');
  const [modalTrocarMesaAberto, setModalTrocarMesaAberto] = useState(false);

  // Estado para controlar os botões de duas etapas (Feito -> Remover) na Operação ao Vivo
  const [statusPartes, setStatusPartes] = useState<Record<string, string>>({});

  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
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
      .neq('status', 'entregue') // Garante que pedidos já entregues na mesa não apareçam na cozinha
      .order('created_at', { ascending: false });

    if (error) console.error("Erro ao buscar pedidos:", error);
    if (data) setPedidosAtivos(data);
  };

  // Função para a aba de Fechamento (Caixa)
  useEffect(() => {
    if (abaAtiva === 'fechamento') {
      const carregarMesasCaixa = async () => {
        const { data } = await supabase.from('pedidos').select('*').neq('status', 'finalizado');
        if (data) {
          const comandasAgrupadas: Record<number, any[]> = {};
          const aguardando: number[] = [];
          
          data.forEach((pedido) => {
            const numero = pedido.mesa;
            if (!comandasAgrupadas[numero]) comandasAgrupadas[numero] = [];
            if (pedido.itens) comandasAgrupadas[numero].push(...pedido.itens);
            // Se algum pedido da mesa estiver como 'entregue' ou o garçom pediu a conta, marca como aguardando
            if (pedido.status === 'entregue' && !aguardando.includes(numero)) aguardando.push(numero);
          });
          setComandasCaixa(comandasAgrupadas);
          // Por enquanto, mostramos todas as mesas ocupadas como aguardando para facilitar o teste
          setMesasAguardando(Object.keys(comandasAgrupadas).map(Number));
        }
      };
      carregarMesasCaixa();
    }
  }, [abaAtiva, pedidosAtivos]);

  const imprimirPreConta = () => {
    if (!mesaSelecionadaCaixa) return;

    if (cupomRef.current) {
      const conteudoCupom = cupomRef.current.innerHTML;
      const janelaImpressao = window.open('', '', 'height=600,width=400');
      
      if (janelaImpressao) {
        janelaImpressao.document.write(`
          <html>
            <head>
              <title>Conferencia_Mesa_${mesaSelecionadaCaixa}</title>
              <style>
                @page { margin: 0; } 
                body { 
                  font-family: 'Courier New', Courier, monospace; 
                  width: 76mm; 
                  margin: 0; 
                  padding: 4mm 2mm;
                  font-size: 11px;
                  color: black;
                  text-transform: uppercase;
                }
                * { box-sizing: border-box; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .border-dashed { border-bottom: 1px dashed black; margin: 6px 0; }
                .flex-between { display: flex; justify-content: space-between; align-items: center; }
                .item-row { margin-bottom: 4px; }
                .item-calc { padding-left: 20px; display: flex; justify-content: space-between; }
              </style>
            </head>
            <body>
              ${conteudoCupom}
            </body>
          </html>
        `);
        janelaImpressao.document.close();
        janelaImpressao.focus();
        
        setTimeout(() => {
          janelaImpressao.print();
          janelaImpressao.close();
        }, 250);
      }
    }
  };

  const encerrarMesaCaixa = async () => {
    if (!mesaSelecionadaCaixa) return;
    if (!window.confirm(`Confirmar o encerramento e pagamento da Mesa ${mesaSelecionadaCaixa}?`)) return;

    const itensConsumidos = comandasCaixa[mesaSelecionadaCaixa] || [];
    const subtotal = Number(itensConsumidos.reduce((acc, item) => acc + item.preco * item.quantidade, 0).toFixed(2));
    const valorTaxa = incluirTaxa ? Number((subtotal * 0.1).toFixed(2)) : 0;
    const totalFinal = Number((subtotal + valorTaxa).toFixed(2));

    // Calcular tempo médio de preparo apenas para pedidos com itens de cozinha relevantes
    const ehItemCozinha = (id: string) => {
      const base = (id || '').split('-')[0];
      if (base.startsWith('cf')) return false;
      return base.startsWith('c') || base.startsWith('e') || base.startsWith('pe');
    };

    const { data: pedidosMesa } = await supabase
      .from('pedidos')
      .select('created_at, entregue_em, itens')
      .eq('mesa', mesaSelecionadaCaixa)
      .not('entregue_em', 'is', null);

    let tempoPreparo: number | null = null;
    if (pedidosMesa && pedidosMesa.length > 0) {
      const tempos = pedidosMesa
        .filter(p => p.itens?.some((i: any) => ehItemCozinha(i.idProduto)))
        .map(p => Math.floor((new Date(p.entregue_em).getTime() - new Date(p.created_at).getTime()) / 60000))
        .filter(t => t > 0);
      if (tempos.length > 0) tempoPreparo = Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
    }

    try {
      await supabase.from('vendas_historico').insert([{
        mesa: mesaSelecionadaCaixa,
        itens: itensConsumidos,
        valor_total: totalFinal,
        forma_pagamento: formaPagamentoCaixa,
        tempo_preparo_min: tempoPreparo,
        taxa_servico_paga: incluirTaxa
      }]);

      await supabase.from('pedidos').update({ status: 'finalizado' }).eq('mesa', mesaSelecionadaCaixa);

      setMesaSelecionadaCaixa(null);
      buscarPedidosAtivos();
      alert(`Mesa ${mesaSelecionadaCaixa} encerrada com sucesso!`);

    } catch (error) {
      console.error(error);
      alert("Erro ao encerrar a mesa.");
    }
  };

  const trocarMesa = async (novaMesa: number) => {
    if (!mesaSelecionadaCaixa || novaMesa === mesaSelecionadaCaixa) return;
    if (!window.confirm(`Mover comanda da Mesa ${mesaSelecionadaCaixa} para a Mesa ${novaMesa}?`)) return;

    await supabase.from('pedidos')
      .update({ mesa: novaMesa })
      .eq('mesa', mesaSelecionadaCaixa)
      .neq('status', 'finalizado');

    setComandasCaixa(prev => {
      const novo = { ...prev };
      novo[novaMesa] = [...(novo[mesaSelecionadaCaixa!] || [])];
      delete novo[mesaSelecionadaCaixa!];
      return novo;
    });

    setMesaSelecionadaCaixa(novaMesa);
    setModalTrocarMesaAberto(false);
    buscarPedidosAtivos();
  };

  const forcarExclusaoPedido = async (id: number) => {
    if (!window.confirm("Atenção Gestor: Tem certeza que deseja apagar este pedido à força?")) return;
    setPedidosAtivos(prev => prev.filter(p => p.id !== id));
    await supabase.from('pedidos').delete().eq('id', id);
  };

  // ==========================================
  // FUNÇÕES DO FLUXO: FEITO -> REMOVER
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
        supabase.from('pedidos').update({ status: 'entregue', entregue_em: new Date().toISOString() }).eq('id', pedidoId).then();
      }
      return newState;
    });
  };

  // ==========================================
  // FILTRAGEM E BI
  // ==========================================
  const vendasFiltradas = vendas.filter(v => {
    const d = new Date(v.criado_em);
    const dataLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dataLocal >= dataInicio && dataLocal <= dataFim;
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
        if (item.nome && item.quantidade > 0) {
          acc[item.nome] = (acc[item.nome] || 0) + item.quantidade;
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Array limpo para não dar erro
  const produtosContadosArray = Object.entries(contagemProdutos) as [string, number][];

  const top5Produtos = [...produtosContadosArray]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const top5MenosVendidos = [...produtosContadosArray]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  const analiseClima = vendas.reduce((acc, v) => {
    const clima = v.clima_condicao || 'Não Informado';
    if (!acc[clima]) acc[clima] = { faturamento: 0, dias: new Set<string>() };
    acc[clima].faturamento += Number(v.valor_total);
    acc[clima].dias.add(new Date(v.criado_em).toDateString());
    return acc;
  }, {} as Record<string, { faturamento: number, dias: Set<string> }>);

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
  const atualizarTaxaServico = async (id: string | number, paga: boolean) => {
    setVendas(prev => prev.map(v => v.id === id ? { ...v, taxa_servico_paga: paga } : v));
    await supabase.from('vendas_historico').update({ taxa_servico_paga: paga }).eq('id', id);
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
  
  const identificarDataEspecial = (dataISO: string): string => {
    const d = new Date(dataISO);
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const dia = d.getDate();
    const diaSemana = d.getDay(); // 0 = domingo

    // Cálculo da Páscoa (algoritmo de Meeus/Jones/Butcher)
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const dd = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - dd - g + 15) % 30;
    const ii = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * ii - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mesPascoa = Math.floor((h + l - 7 * m + 114) / 31);
    const diaPascoa = ((h + l - 7 * m + 114) % 31) + 1;
    const pascoa = new Date(ano, mesPascoa - 1, diaPascoa);

    const addDias = (base: Date, n: number) => new Date(base.getTime() + n * 86400000);
    const igual = (a: Date, b: Date) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

    if (igual(d, addDias(pascoa, -51))) return 'Pré-Carnaval (Sexta)';
    if (igual(d, addDias(pascoa, -50))) return 'Pré-Carnaval (Sábado)';
    if (igual(d, addDias(pascoa, -49))) return 'Carnaval (Domingo)';
    if (igual(d, addDias(pascoa, -48))) return 'Carnaval (Segunda)';
    if (igual(d, addDias(pascoa, -47))) return 'Carnaval (Terça)';
    if (igual(d, addDias(pascoa, -2)))  return 'Sexta-feira Santa';
    if (igual(d, pascoa))               return 'Páscoa';
    if (igual(d, addDias(pascoa, 60)))  return 'Corpus Christi';

    // Dia das Mães (2º domingo de maio)
    if (mes === 5 && diaSemana === 0) {
      const domingosMaio: number[] = [];
      for (let x = 1; x <= 31; x++) { const t = new Date(ano, 4, x); if (t.getDay() === 0) domingosMaio.push(t.getDate()); }
      if (dia === domingosMaio[1]) return 'Dia das Mães';
    }
    // Dia dos Pais (2º domingo de agosto)
    if (mes === 8 && diaSemana === 0) {
      const domingoAgosto: number[] = [];
      for (let x = 1; x <= 31; x++) { const t = new Date(ano, 7, x); if (t.getDay() === 0) domingoAgosto.push(t.getDate()); }
      if (dia === domingoAgosto[1]) return 'Dia dos Pais';
    }

    // Feriados e datas fixas
    const fixos: Record<string, string> = {
      '01/01': 'Ano Novo',
      '20/01': 'São Sebastião (Feriado RJ)',
      '23/04': 'São Jorge (Feriado RJ)',
      '21/04': 'Tiradentes',
      '01/05': 'Dia do Trabalho',
      '12/06': 'Dia dos Namorados',
      '24/06': 'São João (São João da Barra)',
      '07/09': 'Independência do Brasil',
      '12/10': 'Nossa Senhora Aparecida',
      '02/11': 'Finados',
      '15/11': 'Proclamação da República',
      '20/11': 'Consciência Negra',
      '24/12': 'Véspera de Natal',
      '25/12': 'Natal',
      '31/12': 'Réveillon',
    };

    const chave = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
    return fixos[chave] ?? '';
  };

  const exportarCSV = () => {
    if (vendasFiltradas.length === 0) return alert("Nenhum dado para exportar neste período.");
    const cabecalho = ["Data", "Hora", "Mesa", "Forma de Pagamento", "Temperatura", "Clima", "Data Especial", "Valor Total", "Tempo de Preparo (min)", "Itens Consumidos"];
    const linhas = vendasFiltradas.map(v => {
      const data = new Date(v.criado_em).toLocaleDateString('pt-BR');
      const hora = new Date(v.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      const itensFormatados = v.itens && Array.isArray(v.itens) ? v.itens.map((i: any) => `${i.quantidade}x ${i.nome}`).join(' - ') : 'Sem registro';
      const dataEspecial = identificarDataEspecial(v.criado_em);
      return [data, hora, v.mesa, v.forma_pagamento || 'N/D', v.clima_temperatura ? `${v.clima_temperatura}C` : 'N/D', v.clima_condicao || 'N/D', dataEspecial || '—', Number(v.valor_total).toFixed(2).replace('.', ','), v.tempo_preparo_min ?? 'N/D', `"${itensFormatados}"`].join(';');
    });
    const blob = new Blob(["﻿" + [cabecalho.join(';'), ...linhas].join(String.fromCharCode(10))], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `vendas_${dataInicio}_${dataFim}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

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
  const sincronizarEstoque = async () => {
    if (!window.confirm("Isso vai puxar a sua nova planilha de compras (Insumos) para o estoque. Continuar?")) return;
    
    const nomesNoBanco = estoque.map(e => e.nome_produto);
    const produtosFaltantes = INSUMOS_RESTAURANTE.filter(p => !nomesNoBanco.includes(p.nome));

    if (produtosFaltantes.length === 0) {
      alert("A sua planilha de estoque já está 100% sincronizada com o banco!");
      return;
    }

    const novosInsumos = produtosFaltantes.map(p => ({
      nome_produto: p.nome,
      categoria: p.categoria,
      unidade_medida: p.unidade,
      quantidade_atual: 0,
      estoque_minimo: p.categoria === 'Carnes' ? 5 : 10, 
      custo_unitario: 0,
      status: 'Adequado'
    }));

    const { error } = await supabase.from('estoque').insert(novosInsumos);
    if (error) {
      alert("Erro ao sincronizar. Verifique sua conexão com o banco.");
    } else {
      alert(`${produtosFaltantes.length} novos insumos foram adicionados ao estoque!`);
      buscarEstoque();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  // NOVO: Filtra o estoque antes de agrupar pelas categorias
  const estoqueFiltrado = buscaEstoque.trim() !== ''
    ? estoque.filter(item => item.nome_produto.toLowerCase().includes(buscaEstoque.toLowerCase()))
    : estoque;

  const estoqueAgrupado = estoqueFiltrado.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, any[]>)

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
            <ReceiptText className="w-5 h-5" /> Fechamento (Caixa)
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
              {abaAtiva === 'fechamento' && 'Caixa do Restaurante'}
              {abaAtiva === 'historico' && 'Histórico de Vendas'}
              {abaAtiva === 'estoque' && 'Controle de Estoque'}
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {(abaAtiva === 'historico' || abaAtiva === 'resumo') && (
              <div className="flex items-center gap-2">
                <BRDateInput
                  value={dataInicio}
                  onChange={setDataInicio}
                  className="bg-white border border-gray-300 text-gray-900 px-3 pr-9 py-3 rounded-xl font-bold focus:ring-2 focus:ring-orange-500 outline-none shadow-sm w-36"
                />
                <span className="text-gray-500 font-bold text-sm">até</span>
                <BRDateInput
                  value={dataFim}
                  onChange={setDataFim}
                  className="bg-white border border-gray-300 text-gray-900 px-3 pr-9 py-3 rounded-xl font-bold focus:ring-2 focus:ring-orange-500 outline-none shadow-sm w-36"
                />
              </div>
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
                      const itensCozinha = pedido.itens?.filter((item: any) => {
                        const infoProduto = PRODUTOS.find(p => p.nome === item.nome);
                        // Filtro: Tudo que NÃO é bar, OU que a categoria seja explícita 'Sobremesas'
                        return infoProduto?.setor !== 'bar' || infoProduto?.categoria === 'Sobremesas';
                      }) || [];
                      const itensBar = pedido.itens?.filter((item: any) => {
                        const infoProduto = PRODUTOS.find(p => p.nome === item.nome);
                        return infoProduto?.setor === 'bar' && infoProduto?.categoria !== 'Sobremesas';
                      }) || [];

                      const temCozinha = itensCozinha.length > 0;
                      const temBar = itensBar.length > 0;
                      const chaveCoz = `coz-${pedido.id}`;

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
                        return infoProduto?.setor !== 'bar' || infoProduto?.categoria === 'Sobremesas';
                      }) || [];
                      const itensBar = pedido.itens?.filter((item: any) => {
                        const infoProduto = PRODUTOS.find(p => p.nome === item.nome);
                        return infoProduto?.setor === 'bar' && infoProduto?.categoria !== 'Sobremesas';
                      }) || [];

                      const temCozinha = itensCozinha.length > 0;
                      const temBar = itensBar.length > 0;
                      const chaveBar = `bar-${pedido.id}`;

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
            ABA: FECHAMENTO (CAIXA)
            ========================================== */}
        {abaAtiva === 'fechamento' && (
          <div className="space-y-6">
            
            {mesaSelecionadaCaixa === null ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((numero) => {
                  const itensNestaMesa = comandasCaixa[numero] || [];
                  const mesaOcupada = itensNestaMesa.length > 0;
                  const aguardandoPagamento = mesasAguardando.includes(numero);

                  return (
                    <button
                      key={numero}
                      disabled={!mesaOcupada}
                      onClick={() => { setMesaSelecionadaCaixa(numero); setIncluirTaxa(true); setFormaPagamentoCaixa('PIX'); }}
                      className={`relative border-2 rounded-2xl flex flex-col items-center justify-center p-8 transition-transform
                        ${!mesaOcupada ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
                          : aguardandoPagamento ? 'bg-orange-50 border-orange-400 active:scale-95 shadow-md' 
                          : 'bg-white border-gray-300 active:scale-95'}`}
                    >
                      <span className={`text-sm font-bold uppercase tracking-widest mb-1 ${mesaOcupada ? 'text-orange-700' : 'text-gray-500'}`}>Mesa</span>
                      <span className={`text-4xl font-black ${mesaOcupada ? 'text-gray-900' : 'text-gray-400'}`}>{numero}</span>
                      {mesaOcupada && <span className="absolute bottom-2 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">R$ {itensNestaMesa.reduce((a, b) => a + b.preco * b.quantidade, 0).toFixed(2)}</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <h3 className="font-black text-2xl text-gray-900">Conta da Mesa {mesaSelecionadaCaixa}</h3>
                  <button onClick={() => setMesaSelecionadaCaixa(null)} className="p-2 bg-gray-100 rounded-full text-gray-800 hover:bg-gray-200">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                  {(comandasCaixa[mesaSelecionadaCaixa] || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <span className="font-bold text-gray-800">{item.quantidade}x {item.nome}</span>
                      <span className="font-black text-gray-900">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                  <div className="flex justify-between text-gray-600 font-bold">
                    <span>Subtotal</span>
                    <span>R$ {(comandasCaixa[mesaSelecionadaCaixa] || []).reduce((a, b) => a + b.preco * b.quantidade, 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200 cursor-pointer select-none active:scale-[0.98]" onClick={() => setIncluirTaxa(!incluirTaxa)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${incluirTaxa ? 'bg-orange-600' : 'bg-gray-200'}`}>
                        {incluirTaxa && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-extrabold text-sm text-gray-900">Taxa de Serviço (10%)</span>
                    </div>
                    <span className="font-black text-gray-900">
                      R$ {incluirTaxa ? ((comandasCaixa[mesaSelecionadaCaixa] || []).reduce((a, b) => a + b.preco * b.quantidade, 0) * 0.1).toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Forma de Pagamento</label>
                      <select value={formaPagamentoCaixa} onChange={(e) => setFormaPagamentoCaixa(e.target.value)} className="w-full bg-white text-black border border-gray-300 font-bold p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="PIX" className="text-black">PIX</option>
                        <option value="Cartão de Crédito" className="text-black">Cartão de Crédito</option>
                        <option value="Cartão de Débito" className="text-black">Cartão de Débito</option>
                        <option value="Dinheiro" className="text-black">Dinheiro</option>
                      </select>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="font-black text-2xl text-gray-900">Total</span>
                    <span className="font-black text-3xl text-orange-700">
                      R$ {((comandasCaixa[mesaSelecionadaCaixa] || []).reduce((a, b) => a + b.preco * b.quantidade, 0) * (incluirTaxa ? 1.1 : 1)).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <button onClick={imprimirPreConta} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-lg py-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                      <ReceiptText className="w-5 h-5" /> 1. Imprimir Conferência
                    </button>

                    <button onClick={() => setModalTrocarMesaAberto(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                      <LayoutGrid className="w-5 h-5" /> 2. Trocar de Mesa
                    </button>

                    <button onClick={encerrarMesaCaixa} className="w-full bg-green-600 hover:bg-green-500 text-white font-black text-lg py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> 3. Confirmar Pagamento e Liberar
                    </button>
                  </div>

                  {/* MODAL TROCAR DE MESA */}
                  {modalTrocarMesaAberto && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalTrocarMesaAberto(false)}>
                      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black text-gray-900 mb-1">Trocar de Mesa</h3>
                        <p className="text-sm text-gray-500 mb-4">Selecione a mesa de destino para a comanda da Mesa {mesaSelecionadaCaixa}.</p>
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                            const ocupada = num in comandasCaixa && num !== mesaSelecionadaCaixa;
                            const atual = num === mesaSelecionadaCaixa;
                            return (
                              <button
                                key={num}
                                disabled={ocupada || atual}
                                onClick={() => trocarMesa(num)}
                                className={`h-14 rounded-xl font-black text-lg transition-all
                                  ${atual ? 'bg-orange-100 text-orange-400 border-2 border-orange-300 cursor-not-allowed' :
                                    ocupada ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                                    'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow'}`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={() => setModalTrocarMesaAberto(false)} className="mt-4 w-full py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            ABA: VISÃO GERAL (BI)
            ========================================== */}
        {abaAtiva === 'resumo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 text-orange-600 mb-2">
                  <TrendingUp className="w-6 h-6" />
                  <h3 className="font-bold">Faturamento ({dataInicio === dataFim ? new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : `${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} – ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`})</h3>
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

              {/* NOVO CARD: Menos Vendidos */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 xl:col-span-1">
                <h3 className="font-black text-xl text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" /> Menos Vendidos
                </h3>
                {top5MenosVendidos.length === 0 ? (
                  <p className="text-gray-500 font-medium">Nenhuma venda no período.</p>
                ) : (
                  <div className="space-y-4">
                    {top5MenosVendidos.map(([nome, qtd], index) => (
                      <div key={nome} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black bg-gray-100 text-gray-600`}>
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

        {/* ==========================================
            ABA: ESTOQUE
            ========================================== */}
        {abaAtiva === 'estoque' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            {estoque.length === 0 ? (
               <div className="text-center p-10 text-gray-500">
                 <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p className="font-bold text-lg">Estoque Vazio</p>
                 <p>Clique no botão "Sincronizar Novos Produtos" para puxar seus itens.</p>
               </div>
            ) : (
              <>
                {/* NOVO: Barra de Busca do Estoque */}
                <div className="mb-6 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar produto no estoque..."
                    value={buscaEstoque}
                    onChange={(e) => setBuscaEstoque(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors shadow-sm"
                  />
                </div>

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
              </>
            )}
          </div>
        )}

        {/* ==========================================
            ABA: HISTÓRICO DE VENDAS
            ========================================== */}
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
                    <th className="p-4 font-black text-center">Taxa 10%</th>
                    <th className="p-4 font-black text-center">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFiltradas.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-bold">Nenhuma venda neste período.</td></tr>
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
                          <button
                            onClick={() => atualizarTaxaServico(venda.id, !venda.taxa_servico_paga)}
                            title={venda.taxa_servico_paga !== false ? 'Taxa paga — clique para marcar como não paga' : 'Taxa não paga — clique para marcar como paga'}
                            className={`px-3 py-1.5 rounded-lg font-black text-xs transition-colors border-2 ${venda.taxa_servico_paga !== false ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'}`}
                          >
                            {venda.taxa_servico_paga !== false ? 'Paga' : 'Não paga'}
                          </button>
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

      {/* ==========================================
          CUPOM INVISÍVEL PARA IMPRESSORA TÉRMICA (PADRÃO NFC-E)
          ========================================== */}
      {mesaSelecionadaCaixa !== null && (
        <div className="hidden">
          <div ref={cupomRef}>
            <div className="text-center">
              <div className="font-bold" style={{ fontSize: '14px' }}>RANCHO AROEIRA RESTAURANTE</div>
              <div>CNPJ: 58.510.855/0001-42</div>
              <div>BR 356 KM 174 - Curva de Grussaí - RJ</div>
              <div>I.E.: ISENTO</div>
            </div>
            
            <div className="border-dashed"></div>
            <div className="text-center font-bold" style={{ fontSize: '11px' }}>
              Documento Auxiliar de Conferência
              <br/>Mesa {mesaSelecionadaCaixa}
            </div>
            <div className="border-dashed"></div>
            
            <div className="font-bold" style={{ fontSize: '11px', marginBottom: '4px' }}>
              # COD DESCRICAO<br/>
              <span style={{ paddingLeft: '20px' }}>QTD UN X VL UN (R$)</span>
              <span style={{ float: 'right' }}>VL TOT (R$)</span>
            </div>
            
            <div className="border-dashed" style={{ marginTop: '0' }}></div>
            
            <div style={{ fontSize: '11px' }}>
              {(comandasCaixa[mesaSelecionadaCaixa] || []).map((item, idx) => (
                <div key={idx} className="item-row">
                  <div>{String(idx + 1).padStart(3, '0')} {String(idx + 101).padStart(4, '0')} {item.nome}</div>
                  <div className="item-calc">
                    <span>{item.quantidade} UN X {item.preco.toFixed(2).replace('.', ',')}</span>
                    <span>{(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
              
              {incluirTaxa && (
                <div className="item-row">
                  <div>999 9999 TAXA DE SERVICO (10%)</div>
                  <div className="item-calc">
                    <span>1 UN X {((comandasCaixa[mesaSelecionadaCaixa] || []).reduce((a, b) => a + b.preco * b.quantidade, 0) * 0.1).toFixed(2).replace('.', ',')}</span>
                    <span>{((comandasCaixa[mesaSelecionadaCaixa] || []).reduce((a, b) => a + b.preco * b.quantidade, 0) * 0.1).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-dashed"></div>
            
            <div style={{ fontSize: '11px' }}>
              <div className="flex-between">
                <span>Qtde. total de itens</span>
                <span>
                  {(comandasCaixa[mesaSelecionadaCaixa] || []).reduce((a, b) => a + b.quantidade, 0) + (incluirTaxa ? 1 : 0)}
                </span>
              </div>
              <div className="flex-between font-bold" style={{ fontSize: '13px', marginTop: '4px' }}>
                <span>Valor total R$</span>
                <span>{((comandasCaixa[mesaSelecionadaCaixa] || []).reduce((a, b) => a + b.preco * b.quantidade, 0) * (incluirTaxa ? 1.1 : 1)).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="border-dashed"></div>
            
            <div style={{ fontSize: '11px' }}>
              <div className="flex-between font-bold">
                <span>FORMA DE PAGAMENTO</span>
                <span>VALOR PAGO R$</span>
              </div>
              <div className="flex-between">
                <span>{formaPagamentoCaixa.toUpperCase()}</span>
                <span>{((comandasCaixa[mesaSelecionadaCaixa] || []).reduce((a, b) => a + b.preco * b.quantidade, 0) * (incluirTaxa ? 1.1 : 1)).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
            
            <div className="border-dashed"></div>

            <div className="text-center" style={{ fontSize: '11px', marginTop: '10px' }}>
              <div>DATA: {new Date().toLocaleDateString('pt-BR')} HORA: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              <br/>
              <div className="font-bold"></div>
              <div></div>
            </div>
            
            <div style={{ height: '30px' }}></div> 
          </div>
        </div>
      )}
    </div>
  );
}