// src/data/cardapio.ts

export const CATEGORIAS = [
  'Carnes Principais', 
  'Entradas e Acomp.', 
  'Pratos Executivos', 
  'Bebidas', 
  'Sobremesas', 
  'Café'
];

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao: string;
  setor: 'cozinha' | 'bar';
  opcoesTamanho?: { idOpcao: string; rotulo: string; preco: number }[]; // NOVO: Para carnes com tamanhos
}

export const PRODUTOS: Produto[] = [
  // ==========================================
  // CARNES PRINCIPAIS (COM OPÇÕES DE TAMANHO)
  // ==========================================
  { 
    id: 'c4',
    nome: 'Picanha', 
    preco: 0, // Ignorado pois usaremos os tamanhos
    categoria: 'Carnes Principais', 
    descricao: 'Escolha 4 acompanhamentos. Anote nas observações.', 
    setor: 'cozinha',
    opcoesTamanho: [
      { idOpcao: 'p2', rotulo: 'Para 2 Pessoas', preco: 159.00 },
      { idOpcao: 'p4', rotulo: 'Para 4 Pessoas', preco: 286.00 }
    ]
  },
  { 
    id: 'c1', 
    nome: 'Bife de Lomo', 
    preco: 0, // Ignorado pois usaremos os tamanhos
    categoria: 'Carnes Principais', 
    descricao: 'Escolha 4 acompanhamentos. Anote nas observações.', 
    setor: 'cozinha',
    opcoesTamanho: [
      { idOpcao: 'p2', rotulo: 'Para 2 Pessoas', preco: 159.00 },
      { idOpcao: 'p4', rotulo: 'Para 4 Pessoas', preco: 286.00 }
    ]
  },
  { 
    id: 'c2', 
    nome: 'Bife de Chorizo', 
    preco: 0, 
    categoria: 'Carnes Principais', 
    descricao: 'Escolha 4 acompanhamentos. Anote nas observações.', 
    setor: 'cozinha',
    opcoesTamanho: [
      { idOpcao: 'p2', rotulo: 'Para 2 Pessoas', preco: 143.00 },
      { idOpcao: 'p4', rotulo: 'Para 4 Pessoas', preco: 258.00 }
    ]
  },
  { 
    id: 'c3', 
    nome: 'Misto (Boi/Frango/Suíno)', 
    preco: 0, 
    categoria: 'Carnes Principais', 
    descricao: 'Escolha 4 acompanhamentos. Anote nas observações.', 
    setor: 'cozinha',
    opcoesTamanho: [
      { idOpcao: 'p2', rotulo: 'Para 2 Pessoas', preco: 124.00 },
      { idOpcao: 'p4', rotulo: 'Para 4 Pessoas', preco: 223.00 }
    ]
  },

  // ==========================================
  // ENTRADAS E ACOMPANHAMENTOS
  // ==========================================
  { id: 'e1', nome: 'Feijão Tropeiro (2 pessoas)', preco: 25.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e2', nome: 'Carne Seca Acebolada e Aipim', preco: 39.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e3', nome: 'Churrasquinho Acebolado (250g)', preco: 28.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e4', nome: 'Carne Seca Acebolada (250g)', preco: 27.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e5', nome: 'Filé Suíno Cubo Acebolado (250g)', preco: 19.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e6', nome: 'Linguiça Fatiada Acebolada (200g)', preco: 16.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e7', nome: 'Frango em Cubos Acebolado (200g)', preco: 15.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e8', nome: 'Batata Rústica (2 pessoas)', preco: 12.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e9', nome: 'Aipim Frito (2 pessoas)', preco: 15.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e10', nome: 'Farofa de Ovo (2 pessoas)', preco: 9.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e11', nome: 'Molho Vinagrete (2 pessoas)', preco: 8.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e12', nome: 'Couve', preco: 7.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e13', nome: 'Feijão Amigo', preco: 10.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e14', nome: 'Queijo com Ervas Especiais', preco: 10.00, categoria: 'Entradas e Acomp.', descricao: '', setor: 'cozinha' },
  { id: 'e15', nome: 'Pão de Alho', preco: 6.00, categoria: 'Entradas e Acomp.', descricao: 'Minibaguete 2 fatias', setor: 'cozinha' },

  // ==========================================
  // PRATOS EXECUTIVOS
  // ==========================================
  { id: 'pe1', nome: 'Churrasquinho de Boi (250g)', preco: 35.00, categoria: 'Pratos Executivos', descricao: 'Acompanha arroz, feijão, farofa, vinagrete ou couve.', setor: 'cozinha' },
  { id: 'pe2', nome: 'Churrasquinho de Boi (125g)', preco: 29.00, categoria: 'Pratos Executivos', descricao: 'Acompanha arroz, feijão, farofa, vinagrete ou couve.', setor: 'cozinha' },
  { id: 'pe3', nome: 'Churrasquinho de Frango (125g)', preco: 24.00, categoria: 'Pratos Executivos', descricao: 'Acompanha arroz, feijão, farofa, vinagrete ou couve.', setor: 'cozinha' },

  // ==========================================
  // BEBIDAS
  // ==========================================
  { id: 'b1', nome: 'Água (500ml) S/gás', preco: 4.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b2', nome: 'Água (500ml) C/gás', preco: 5.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b3', nome: 'Guaravita', preco: 3.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b4', nome: 'Refrigerante/Suco (Lata)', preco: 7.50, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b5', nome: 'Coca Cola (KS)', preco: 6.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b6', nome: 'Coca Cola (600ml)', preco: 10.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b7', nome: 'Suco Natural (Copo 300ml)', preco: 12.00, categoria: 'Bebidas', descricao: 'Anote o sabor.', setor: 'bar' },
  { id: 'b8', nome: 'Suco Natural (Jarra 750ml)', preco: 25.00, categoria: 'Bebidas', descricao: 'Anote o sabor.', setor: 'bar' },
  { id: 'b9', nome: 'Stella Artois (LN)', preco: 10.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b10', nome: 'Corona (LN)', preco: 11.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b11', nome: 'Amstel (600ml)', preco: 13.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b12', nome: 'Original (600ml)', preco: 15.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b13', nome: 'Heineken (600ml)', preco: 18.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },
  { id: 'b14', nome: 'Caipirinha', preco: 19.00, categoria: 'Bebidas', descricao: 'Vodka ou Cachaça.', setor: 'bar' },
  { id: 'b15', nome: 'Dose Cachaça (Especial)', preco: 9.00, categoria: 'Bebidas', descricao: '', setor: 'bar' },

  // ==========================================
  // SOBREMESAS E CAFÉ
  // ==========================================
  { id: 's1', nome: 'Pudim da Casa', preco: 8.00, categoria: 'Sobremesas', descricao: '', setor: 'cozinha' },
  { id: 's2', nome: 'Doce Caseiro', preco: 9.00, categoria: 'Sobremesas', descricao: 'Abóbora ou Coco.', setor: 'cozinha' },
  { id: 's3', nome: 'Banana Flambada c/ Sorvete', preco: 14.00, categoria: 'Sobremesas', descricao: '', setor: 'cozinha' },
  { id: 'cf1', nome: 'Cafezinho Gourmet c/ Petit Four', preco: 3.50, categoria: 'Café', descricao: '', setor: 'bar' },
];