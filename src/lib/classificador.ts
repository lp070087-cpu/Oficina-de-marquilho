// Base de conhecimento - Peças para oficina de motos
// Palavras-chave, sinônimos, abreviações, marcas e regras de classificação

export interface ClassificacaoResult {
  categoria: string;
  subcategoria: string;
  confianca: number; // 0 a 100
  palavrasEncontradas: string[];
  motivo: string;
}

type RegraCategoria = {
  palavras: string[];
  subcategorias: Record<string, string[]>;
};

const REGRAS: Record<string, RegraCategoria> = {
  'Motor': {
    palavras: ['pistao', 'pistão', 'anel segmento', 'anel de segmento', 'cilindro', 'biela', 'valvula', 'válvula',
      'cabecote', 'cabeçote', 'comando', 'corrente comando', 'corrente de comando', 'tensionador',
      'bomba oleo', 'bomba óleo', 'bomba dagua', 'bomba dágua', 'bomba d\'agua', 'carburador',
      'bico injetor', 'injetor', 'coletor admissao', 'coletor admissão', 'balanceiro',
      'tampa valvula', 'tampa válvula', 'motor de partida', 'motor partida'],
    subcategorias: {
      'Pistao/Cilindro': ['pistao', 'pistão', 'anel', 'cilindro', 'biela'],
      'Cabecote/Valvulas': ['valvula', 'válvula', 'cabecote', 'cabeçote', 'comando', 'balanceiro', 'tampa'],
      'Bombas': ['bomba oleo', 'bomba óleo', 'bomba dagua', 'bomba dágua', 'bomba d\'agua'],
      'Carburador/Injecao': ['carburador', 'bico injetor', 'injetor', 'coletor'],
      'Partida': ['motor partida', 'motor de partida'],
    }
  },
  'Freios': {
    palavras: ['pastilha', 'disco freio', 'disco de freio', 'lona freio', 'lona de freio', 'tambor freio',
      'tambor de freio', 'burrinho', 'cilindro mestre', 'pinça', 'pinca', 'pinca freio',
      'fluido freio', 'fluido de freio', 'cabo freio', 'cabo de freio', 'pedal freio', 'pedal de freio',
      'manete freio', 'manete de freio', 'sensor abs', 'abs', 'tubo freio', 'tubo de freio',
      'reservatorio freio', 'reservatório freio'],
    subcategorias: {
      'Pastilhas': ['pastilha'],
      'Discos': ['disco freio', 'disco de freio'],
      'Cilindros/Pincas': ['cilindro mestre', 'pinça', 'pinca', 'burrinho'],
      'Fluidos': ['fluido freio', 'fluido de freio'],
      'Cabos/Tubos': ['cabo freio', 'cabo de freio', 'tubo freio', 'tubo de freio'],
      'Lonas/Tambores': ['lona', 'tambor'],
    }
  },
  'Eletrica': {
    palavras: ['vela', 'bobina', 'cdi', 'estator', 'retificador', 'regulador', 'rele', 'relé',
      'chicote', 'modulo ignicao', 'módulo ignição', 'modulo ignição', 'ecu', 'ecm',
      'interruptor', 'chave seta', 'chave de seta', 'chave ignicao', 'chave de ignição',
      'ignicao', 'ignição', 'cachimbo vela', 'cachimbo de vela', 'magnetron',
      'alternador', 'gerador', 'partida eletrica', 'partida elétrica', 'motor arranque',
      'sensor temperatura', 'sensor rotacao', 'sensor rotação'],
    subcategorias: {
      'Baterias': ['bateria'],
      'Velas/Cachimbos': ['vela', 'cachimbo'],
      'Bobinas/CDI': ['bobina', 'cdi', 'ignicao', 'ignição', 'modulo'],
      'Estator/Retificador': ['estator', 'retificador', 'regulador', 'alternador', 'gerador'],
      'Chicotes/Interruptores': ['chicote', 'interruptor', 'chave', 'rele', 'relé'],
    }
  },
  'Suspensao': {
    palavras: ['amortecedor', 'bengala', 'retentor bengala', 'retentor suspensao', 'retentor suspensão',
      'mola traseira', 'mola dianteira', 'garfo', 'balança', 'balanca', 'biela suspensao',
      'biela suspensão', 'rolamento caixa', 'caixa direcao', 'caixa direção', 'oleo suspensao',
      'óleo suspensão', 'óleo suspensao'],
    subcategorias: {
      'Amortecedores/Molas': ['amortecedor', 'mola', 'garfo', 'bengala'],
      'Retentores': ['retentor bengala', 'retentor suspensao', 'retentor suspensão'],
      'Balanças/Bielas': ['balança', 'balanca', 'biela'],
      'Caixa direção': ['rolamento caixa', 'caixa direcao', 'caixa direção'],
    }
  },
  'Transmissao': {
    palavras: ['corrente', 'coroa', 'pinhão', 'pinhao', 'relação', 'relacao', 'kit transmissao',
      'kit de transmissão', 'kit tração', 'kit tracao', 'embreagem', 'disco embreagem',
      'disco de embreagem', 'mola embreagem', 'mola de embreagem', 'cabo embreagem',
      'cabo de embreagem', 'pedal cambio', 'pedal de cambio', 'guia corrente', 'guia de corrente',
      'protetor corrente', 'protetor de corrente', 'cubo roda', 'cubo de roda'],
    subcategorias: {
      'Kits de relacao': ['kit transmissao', 'kit tração', 'kit tracao', 'relação', 'relacao'],
      'Correntes': ['corrente'],
      'Coroas/Pinhoes': ['coroa', 'pinhão', 'pinhao'],
      'Embreagem': ['embreagem', 'disco embreagem', 'mola embreagem'],
      'Cabos embreagem': ['cabo embreagem'],
    }
  },
  'Escapamento': {
    palavras: ['escapamento', 'silenciador', 'coletor escape', 'coletor escap', 'ponteira',
      'abracadeira escape', 'abracadeira escap', 'junta coletor', 'junta escape',
      'protetor escape', 'protetor escap', 'cano escape', 'cano escap'],
    subcategorias: {
      'Escapamentos': ['escapamento', 'cano escape', 'cano escap'],
      'Silenciadores/Ponteiras': ['silenciador', 'ponteira'],
      'Abracadeiras/Juntas': ['abracadeira', 'junta coletor', 'junta escape'],
    }
  },
  'Carroceria': {
    palavras: ['paralama', 'paralamas', 'para-lama', 'para-lamas', 'tanque', 'carene', 'carena',
      'carenagem', 'placa', 'suporte placa', 'rabeta', 'viseira', 'bolha', 'defletor',
      'grade proteção', 'grade protecao', 'alforge', 'bau', 'baú', 'protetor motor',
      'protetor de motor', 'mata cachorro'],
    subcategorias: {
      'Paralamas': ['paralama', 'paralamas', 'para-lama', 'para-lamas'],
      'Tanques/Carenes': ['tanque', 'carene', 'carena', 'carenagem'],
      'Grades/Protetores': ['grade', 'protetor', 'mata cachorro', 'defletor'],
    }
  },
  'Pneus e Rodas': {
    palavras: ['pneu', 'câmara', 'camara', 'bico', 'bico de câmara', 'aro', 'roda',
      'raios', 'raio de roda', 'rolamento roda', 'rolamento de roda', 'eixo roda',
      'eixo de roda', 'calota', 'protetor câmara', 'protetor camara'],
    subcategorias: {
      'Pneus': ['pneu'],
      'Camaras/Bicos': ['câmara', 'camara', 'bico'],
      'Aros/Raios': ['aro', 'raios', 'raio'],
      'Cubos/Eixos': ['cubo', 'eixo', 'rolamento roda'],
    }
  },
  'Cabos e Comandos': {
    palavras: ['cabo acelerador', 'cabo embreagem', 'cabo freio', 'cabo velocimetro',
      'cabo velocímetro', 'cabo afogador', 'manete', 'acelerador', 'manopla',
      'punho', 'guidao', 'guidão'],
    subcategorias: {
      'Cabos Acelerador': ['cabo acelerador', 'acelerador'],
      'Cabos Embreagem': ['cabo embreagem'],
      'Cabos Freio': ['cabo freio'],
      'Manetes/Manoplas': ['manete', 'manopla', 'punho'],
    }
  },
  'Oleos e Fluidos': {
    palavras: ['óleo', 'oleo', '10w30', '10w40', '20w50', '5w30', '15w50', 'fluido freio',
      'fluido de freio', 'graxa', 'aditivo', 'liquido arrefecimento', 'líquido arrefecimento',
      'limpa carburador', 'limpa contato', 'lava contato', 'desengripante', 'wd-40', 'wd40',
      'spray lubrificante', 'lubrificante', 'penetrante'],
    subcategorias: {
      'Oleo Motor': ['óleo', 'oleo', '10w30', '10w40', '20w50', '5w30', '15w50'],
      'Fluidos': ['fluido freio', 'fluido de freio', 'arrefecimento'],
      'Lubrificantes': ['graxa', 'lubrificante', 'spray', 'wd-40', 'wd40'],
      'Limpeza': ['limpa', 'lava', 'desengripante', 'penetrante'],
    }
  },
  'Filtros': {
    palavras: ['filtro oleo', 'filtro de óleo', 'filtro de oleo', 'filtro ar',
      'filtro de ar', 'filtro combustivel', 'filtro combustível', 'filtro de combustivel',
      'filtro cvt', 'filtro de cvt', 'elemento filtrante', 'elemento filtro'],
    subcategorias: {
      'Filtro de Oleo': ['filtro oleo', 'filtro de óleo', 'filtro de oleo'],
      'Filtro de Ar': ['filtro ar', 'filtro de ar', 'elemento'],
      'Filtro Combustivel': ['filtro combustivel', 'filtro combustível', 'filtro de combustivel'],
    }
  },
  'Acessorios': {
    palavras: ['retrovisor', 'espelho', 'buzina', 'alarme', 'trava disco', 'trava de disco',
      'suporte celular', 'suporte para celular', 'capa banco', 'capa de banco',
      'banco', 'pedaleira', 'cavalete', 'descanso', 'bolha capacete',
      'bolha para capacete', 'farol', 'lanterna', 'seta', 'pisca', 'alforge',
      'bau traseiro', 'baú traseiro', 'bagageiro', 'suporte placa'],
    subcategorias: {
      'Retrovisores': ['retrovisor', 'espelho'],
      'Iluminacao': ['farol', 'lanterna', 'seta', 'pisca'],
      'Seguranca': ['alarme', 'trava', 'cavalete'],
      'Bancos/Capas': ['banco', 'capa banco', 'capa de banco'],
    }
  },
  'Baterias': {
    palavras: ['bateria', 'ytx', 'ytz', 'yb', 'moura', 'heliar', 'acdelco', 'bosch bateria'],
    subcategorias: {
      'Baterias Seladas': ['bateria'],
    }
  },
  'Ferramentas': {
    palavras: ['chave', 'alicate', 'soquete', 'torquimetro', 'torquímetro', 'macaco',
      'cavalete ferramenta', 'extrator', 'saca', 'compressora', 'multimetro',
      'multímetro', 'testador'],
    subcategorias: {
      'Manual': ['chave', 'alicate', 'soquete'],
      'Especializadas': ['torquimetro', 'torquímetro', 'extrator', 'saca', 'multimetro', 'multímetro', 'testador'],
    }
  },
  'Juntas e Retentores': {
    palavras: ['junta motor', 'junta de motor', 'junta cabecote', 'junta de cabecote',
      'junta do cabeçote', 'junta carter', 'junta de carter', 'junta do carter',
      'junta escape', 'junta de escape', 'retentor', 'rolamento', 'bucha',
      'vedacao', 'vedação', 'gaxeta', 'o\'ring', 'oring', 'o-ring', 'anel vedacao',
      'anel de vedação'],
    subcategorias: {
      'Juntas Motor': ['junta motor', 'junta de motor', 'junta cabecote', 'junta de cabecote', 'junta do cabeçote', 'junta carter'],
      'Juntas Escape': ['junta escape', 'junta de escape'],
      'Retentores': ['retentor'],
      'Vedações': ['gaxeta', 'o\'ring', 'oring', 'o-ring', 'anel vedacao', 'anel de vedação'],
    }
  },
  'Rolamentos': {
    palavras: ['rolamento', 'bucha', 'bronzina', 'mancal', 'gaiola', 'rolete',
      'rolamento roda', 'rolamento caixa', 'rolamento direcao', 'rolamento direção'],
    subcategorias: {
      'Rolamentos Roda': ['rolamento roda', 'rolamento de roda'],
      'Rolamentos Direcao': ['rolamento caixa', 'rolamento direcao', 'rolamento direção'],
      'Buchas/Bronzinas': ['bucha', 'bronzina'],
    }
  },
};

// Marca de pertencimento a categoria conhecida
const MARCAS_CATEGORIA: Record<string, string> = {
  'pirelli': 'Pneus e Rodas', 'michelin': 'Pneus e Rodas', 'metzeler': 'Pneus e Rodas',
  'levorin': 'Pneus e Rodas', 'maggion': 'Pneus e Rodas', 'technic': 'Pneus e Rodas',
  'moura': 'Baterias', 'heliar': 'Baterias', 'bosch bateria': 'Baterias',
  'ngk': 'Eletrica', 'bosch vela': 'Eletrica', 'mitsubishi': 'Eletrica',
  'keihin': 'Motor', 'mikuni': 'Motor', 'pro tork': 'Motor',
  'vedamotors': 'Cabos e Comandos', 'potenza': 'Freios', 'cobreq': 'Freios',
  'fras-le': 'Freios', 'varga': 'Freios', 'motul': 'Oleos e Fluidos',
  'ipiranga': 'Oleos e Fluidos', 'mobil': 'Oleos e Fluidos', 'shell': 'Oleos e Fluidos',
  'petronas': 'Oleos e Fluidos', 'liqui moly': 'Oleos e Fluidos',
};

export function classificarProduto(nome: string, descricao?: string, marca?: string): ClassificacaoResult {
  const texto = `${nome} ${descricao || ''} ${marca || ''}`.toLowerCase();
  let melhorCategoria = 'Revisar classificacao';
  let melhorSubcategoria = '';
  let melhorPontuacao = 0;
  let palavrasEncontradas: string[] = [];

  // Checar marca primeiro
  for (const [m, cat] of Object.entries(MARCAS_CATEGORIA)) {
    if (texto.includes(m.toLowerCase())) {
      // Marca conhecida dá um bônus, mas não é definitivo
      if (melhorPontuacao < 2) {
        melhorCategoria = cat;
        melhorPontuacao = 2;
        palavrasEncontradas = [`marca:${m}`];
      }
    }
  }

  // Checar palavras-chave por categoria
  for (const [categoria, regra] of Object.entries(REGRAS)) {
    let pontos = 0;
    let encontradas: string[] = [];
    let subcatMatch = '';

    for (const palavra of regra.palavras) {
      if (texto.includes(palavra)) {
        pontos += 2;
        encontradas.push(palavra);
      }
    }

    // Subcategorias
    for (const [subcat, palavras] of Object.entries(regra.subcategorias)) {
      for (const p of palavras) {
        if (texto.includes(p)) {
          subcatMatch = subcat;
          pontos += 1;
          break;
        }
      }
      if (subcatMatch) break;
    }

    if (pontos > melhorPontuacao || (pontos === melhorPontuacao && categoria === melhorCategoria)) {
      melhorCategoria = categoria;
      melhorPontuacao = pontos;
      palavrasEncontradas = encontradas;
      if (subcatMatch) melhorSubcategoria = subcatMatch;
    }
  }

  const confianca = Math.min(melhorPontuacao * 20, 100);

  return {
    categoria: melhorCategoria,
    subcategoria: melhorSubcategoria,
    confianca,
    palavrasEncontradas,
    motivo: confianca >= 60
      ? `Palavras encontradas: ${palavrasEncontradas.join(', ')}`
      : confianca >= 30
        ? 'Poucas palavras-chave encontradas. Verifique a classificação.'
        : 'Nenhuma palavra-chave reconhecida. Classifique manualmente.',
  };
}

// Verifica se um produto é do tipo bateria (categoria separada)
export function classificarBateria(nome: string): boolean {
  const texto = nome.toLowerCase();
  return (
    (texto.includes('bateria') && ['ytx', 'ytz', 'yb', 'bt', 'ct', '12n', '12v'].some(t => texto.includes(t))) ||
    ['moura bateria', 'heliar bateria', 'acdelco bateria'].some(t => texto.includes(t))
  );
}

// Normaliza o nome de uma categoria vinda de fontes externas
export function normalizarCategoria(nome: string): string {
  const mapa: Record<string, string> = {
    'motor': 'Motor', 'freios': 'Freios', 'freio': 'Freios', 'eletrica': 'Eletrica',
    'elétrica': 'Eletrica', 'suspensao': 'Suspensao', 'suspensão': 'Suspensao',
    'transmissao': 'Transmissao', 'transmissão': 'Transmissao', 'escapamento': 'Escapamento',
    'carroceria': 'Carroceria', 'pneus': 'Pneus e Rodas', 'pneu': 'Pneus e Rodas',
    'pneus e rodas': 'Pneus e Rodas', 'cabos': 'Cabos e Comandos', 'comandos': 'Cabos e Comandos',
    'cabos e comandos': 'Cabos e Comandos', 'oleos': 'Oleos e Fluidos', 'óleos': 'Oleos e Fluidos',
    'fluidos': 'Oleos e Fluidos', 'filtros': 'Filtros', 'filtro': 'Filtros',
    'acessorios': 'Acessorios', 'acessórios': 'Acessorios', 'ferramentas': 'Ferramentas',
    'rolamentos': 'Rolamentos', 'juntas': 'Juntas e Retentores', 'retentores': 'Juntas e Retentores',
    'baterias': 'Baterias', 'lampadas': 'Acessorios', 'lâmpadas': 'Acessorios',
  };
  return mapa[nome.toLowerCase()] || nome;
}
