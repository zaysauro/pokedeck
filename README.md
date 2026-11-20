# PokéDeck

**Pokédex colecionável e construtor de times Pokémon.** Explore todas as espécies da National Pokédex como cartas
colecionáveis, abra fichas completas com artes oficiais, cadeias evolutivas e sprites históricos, e monte decks de
seis Pokémon apresentados em leque, com análise de equilíbrio de tipos.

## Funcionalidades

- **Explore (Home):** hero com Pokémon em destaque e paleta dinâmica, leque de populares, exploração por tipo,
  trilho horizontal de gerações guiado pelo scroll, seção editorial de lendários e míticos, recém-adicionados,
  decks curados e acesso rápido ao Team Builder.
- **Pokédex completa:** todas as espécies da PokéAPI (sem limite de 151), com busca por nome ou número sem
  diferenciar acentos, filtros por tipo (até dois combinados), geração/região, lendários/míticos e formas regionais
  (Alola, Galar, Hisui, Paldea), ordenação por número, nome e atributos, grade virtualizada, skeletons e URL
  compartilhável.
- **Ficha do Pokémon** (`/pokemon/[id]`): arte oficial em destaque, nome, gênero, tipos, altura, peso, habilidades
  (incluindo ocultas), status base com barras e radar, experiência base, taxa de captura, grupos de ovo, proporção de
  gênero, descrição da Pokédex, fraquezas e resistências, cadeia evolutiva navegável (incluindo ramificações como
  Eevee), formas alternativas, sprites por jogo, versões Shiny, grito e golpes. Abas: Overview, Stats, Evolutions,
  Forms & Sprites, Moves.
- **Team Builder / My Decks:** vários decks com nome, descrição, capa e destaque; até **6** Pokémon por deck;
  adicionar, remover, substituir e reordenar (arrastando ou pelas setas); apresentação em leque com sobreposição,
  rotação, perspectiva, hover e expansão da carta selecionada; painel de seleção com busca, filtros e favoritos;
  duplicar, excluir, exportar/importar JSON e compartilhar por link.
- **Análise do deck:** matriz defensiva, fraquezas compartilhadas, resistências e imunidades, cobertura ofensiva por
  STAB, distribuição de tipos, média de atributos e sugestões de tipos. Não é uma simulação de batalha.
- **Cartas TCG** (`/cards`): cartas reais do Pokémon Estampas Ilustradas em português (TCGdex). Inclui cartas
  populares em leque, vitrine de raridades especiais, expansões recentes e pesquisa completa. Os filtros podem ser
  combinados: nome, série, coleção, categoria, raridade, tipo, ilustrador, HP e estágio. Ordenação por mais
  recentes, mais antigas, A–Z, maior e menor HP. Visualização rápida em modal e página própria por carta
  (`/cards/[id]`) com scan em alta resolução, ataques, custos de energia, habilidades, fraqueza, resistência, recuo
  e ilustrador. Página por coleção (`/cards/sets/[id]`) com porcentagem de conclusão.
- **Coleção de cartas:** favoritar, marcar “tenho” (com cópias repetidas) e “quero” (lista de desejos). Tudo salvo
  localmente, pronto para a futura área “Minha Coleção”.
- **Favoritos:** coleção pessoal com filtro por tipo e envio direto para um deck, além das cartas TCG salvas.
- **Comparar:** até 4 Pokémon com radar sobreposto, barras por atributo, total e comparação de tipos.
- **Busca global:** paleta ⌘K / `/` em qualquer página e página `/search`.
- **Extras:** modo Shiny global, sprites animados (Showdown), respeito a `prefers-reduced-motion`, navegação mobile
  dedicada.

## Tecnologias

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Lucide Icons,
TanStack Virtual (virtualização da grade) e idb-keyval (IndexedDB).

## Executando localmente

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # build de produção
```

Nenhuma variável de ambiente é necessária.

## Arquitetura

```
src/
  app/            rotas (/, /pokedex, /pokemon/[id], /teams, /teams/[id], /teams/share, /favorites, /compare, /search)
  app/api/pokedex índice da National Pokédex (estático, revalidado diariamente)
  components/     cards, deck (leque), pokedex, detail, team, compare, home, nav, ui, charts
  hooks/          usePokedex (índice + cache), useCollection (favoritos, decks, preferências), useTilt, useMembers
  services/       pokeapi.ts — acesso à PokéAPI (GraphQL + REST), somente no servidor
  lib/            tipos, constantes e traduções pt-BR, tabela de tipos, paletas, filtros, sprites, storage
```

**Estratégia de dados.** O índice de todas as espécies (nome, geração, tipos, atributos, raridade, formas regionais)
vem de **uma única consulta GraphQL** à PokéAPI, servida por `/api/pokedex` como conteúdo estático com revalidação
diária. Novas espécies aparecem sem novo deploy. No navegador, o índice fica em memória e no IndexedDB, então a
Pokédex abre instantaneamente nas visitas seguintes. As fichas usam a API REST no servidor, com cache de 24 h (ISR).
Se a consulta GraphQL falhar, há um modo reduzido via REST.

**Cartas TCG.** Fonte: [TCGdex](https://tcgdex.dev) no idioma `pt`, que contém as cartas físicas lançadas no
Brasil (`pt-br` na TCGdex traz apenas o TCG Pocket, um jogo digital, que fica fora do catálogo). Os filtros que a
TCGdex suporta são enviados direto para a API (`services/tcgdex.ts`). Série, ordem de lançamento, ordem alfabética,
“somente com imagem” e paginação são aplicados no servidor do PokéDeck, porque a API não oferece datas por carta
nem filtros OU confiáveis. Respostas ficam no cache de dados do Next (6–24 h), requisições iguais simultâneas são
deduplicadas e o cliente mantém um cache por sessão. As imagens são WebP servidas direto da CDN da TCGdex, em baixa
resolução na grade e alta no detalhe.

**Imagens.** URLs do repositório [PokeAPI/sprites](https://github.com/PokeAPI/sprites), com fallback automático:
preferida → Official Artwork → Pokémon HOME → sprite clássico → placeholder. Usamos `<img>` com lazy loading,
direto da CDN, em vez de reprocessar milhares de arquivos.

**Persistência.** Favoritos, decks e preferências ficam no IndexedDB, com fallback para localStorage, atrás de uma
camada (`lib/storage.ts` + `hooks/useCollection.ts`) que pode ser trocada por um backend com autenticação no futuro.

**Idiomas.** Interface em português brasileiro. A PokéAPI quase não tem conteúdo em pt-BR, então tipos, atributos,
grupos de ovo, habitats e gerações são traduzidos localmente. Nomes de Pokémon seguem o padrão oficial (iguais em
pt-BR e inglês). Descrições e golpes aparecem no original quando não há tradução, com indicação na tela.

## Fontes de dados e créditos

- Dados: [PokéAPI](https://pokeapi.co/) (REST e GraphQL).
- Imagens: [PokeAPI/sprites](https://github.com/PokeAPI/sprites).
- Tipografia: Instrument Serif, Geist e Geist Mono (Google Fonts).

## Direitos de uso

Projeto de fã, sem fins lucrativos e sem afiliação com Nintendo, Game Freak, Creatures Inc. ou The Pokémon Company.
Pokémon, nomes de personagens e artes oficiais são marcas e propriedade de seus respectivos donos, usados aqui apenas
para fins informativos e educacionais. O código-fonte deste repositório pode ser usado livremente para estudo.
