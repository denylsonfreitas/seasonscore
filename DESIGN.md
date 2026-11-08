# SeasonScore: guia de design

Este documento define a identidade visual e o design system do SeasonScore. Toda tela nova ou alterada deve seguir o que está aqui. Quando algo não estiver coberto, a decisão deve ser coerente com os princípios abaixo e registrada neste arquivo.

Os valores descritos aqui são a fonte da verdade e estão implementados em `src/styles/theme.ts` (tokens do Chakra) e `src/styles/fonts.ts`.

---

## 1. Conceito

**SeasonScore é a ficha técnica da temporada.** O que diferencia o site de qualquer outro catálogo de séries é a nota por temporada: séries crescem, caem e se recuperam ao longo dos anos, e o site existe para mostrar isso.

A linguagem visual vem de dois lugares:

- **A tela da TV e o pôster**: o conteúdo (pôster, cena, logo da série) é o protagonista. A interface é escura, neutra e recua para deixar as imagens falarem.
- **A ficha técnica e o guia de programação**: informação organizada, números alinhados, rótulos curtos em fonte monoespaçada (`T1`, `T2 · E05`, `4,5`), como numa grade de canal ou numa claquete.

### Princípios

1. **O pôster manda.** Nada compete com a arte da série: sem fundos coloridos, sem ícones decorativos grandes, sem degradês chamativos.
2. **Temporada é a unidade.** Sempre que fizer sentido, mostre a série dividida em temporadas (a "faixa de temporadas" é o elemento-assinatura, ver seção 9).
3. **Números são informação, não enfeite.** Notas, contagens e datas usam a fonte mono, com alinhamento tabular e vírgula decimal (`4,5`).
4. **Denso, mas respirando.** Como um guia de programação: bastante informação por tela, organizada por alinhamento e hierarquia, nunca por caixas dentro de caixas.
5. **Feito por quem assiste.** O tom é de conversa entre fãs de séries, sem jargão de marketing.

---

## 2. Cores

Tema escuro único. A base é um preto levemente quente (lembra a tela apagada da TV), e não o azul-acinzentado padrão dos templates.

### Neutros: "ink"

| Token     | Hex       | Uso                                               |
| --------- | --------- | ------------------------------------------------- |
| `ink.950` | `#0F0F0E` | Fundo da página                                   |
| `ink.900` | `#171715` | Superfícies (cards, seções destacadas)            |
| `ink.850` | `#1F1F1C` | Superfície elevada (inputs, menus, hover de card) |
| `ink.800` | `#282825` | Hover de superfície elevada, trilho de barras     |
| `ink.700` | `#34332F` | Bordas e divisórias                               |
| `ink.600` | `#46443F` | Borda forte, foco desativado                      |
| `ink.400` | `#7A776F` | Texto terciário, placeholders                     |
| `ink.300` | `#A8A59C` | Texto secundário                                  |
| `ink.100` | `#EDEBE5` | Texto principal                                   |
| `ink.50`  | `#F7F6F2` | Títulos em destaque sobre imagem                  |

### Marca: "signal" (verde de sinal)

O verde é a essência herdada da versão anterior (`#04A777`), ajustado para ler bem sobre o preto quente. Ele significa **ação e "no ar"**: botões primários, link ativo, foco, estado selecionado. Não é cor de decoração.

| Token        | Hex       | Uso                                        |
| ------------ | --------- | ------------------------------------------ |
| `signal.300` | `#57D6A4` | Texto/ícone de destaque sobre fundo escuro |
| `signal.400` | `#26C287` | Links, abas ativas, nota alta              |
| `signal.500` | `#0BAA74` | Botão primário                             |
| `signal.600` | `#078C60` | Hover do botão primário                    |
| `signal.700` | `#066E4C` | Pressionado                                |

### Escala de nota

Usada em barras da faixa de temporadas e no selo de nota. A cor acompanha o valor; nunca é usada fora de contexto de avaliação.

| Faixa     | Token        | Hex       |
| --------- | ------------ | --------- |
| 0,5 a 2,0 | `score.low`  | `#E5534B` |
| 2,5 a 3,5 | `score.mid`  | `#E0A43B` |
| 4,0 a 5,0 | `score.high` | `#2BC48A` |

Médias (que não são múltiplos de 0,5) seguem os limites `< 2,25` → low, `< 3,75` → mid, senão high. A regra está em `src/utils/score.ts`.

Estrelas de avaliação usam `star` `#F2B53D`.

### Feedback

`danger` `#E5534B` · `warning` `#E0A43B` · `info` `#6CA6E8` · `success` = `signal.400`.

### Regras

- Fundo de página é sempre `ink.950`. Nada de seções com cores diferentes para "dar vida".
- Uma cor de destaque por vez na tela. Não existem cores por seção (o antigo `linkhome` foi removido).
- Proibido: degradês coloridos (verde→roxo, azul→rosa), texto em degradê, brilhos neon.
- Degradê só é permitido como **véu escuro sobre imagem** (de `ink.950` para transparente) para garantir leitura.
- Contraste mínimo AA: texto principal `ink.100` e secundário `ink.300` sobre `ink.950`/`ink.900`.

---

## 3. Tipografia

Três famílias com papéis bem separados, todas servidas localmente via `@fontsource` (sem depender do Google Fonts):

| Papel                                 | Fonte                                   | Por quê                                                                   |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| **Display** (títulos)                 | **Archivo** variável, largura 110 a 125 | Grotesca larga e firme, lembra cartela de abertura e grade de programação |
| **Texto** (interface e leitura)       | **IBM Plex Sans**                       | Neutra, ótima em tamanhos pequenos, com personalidade técnica discreta    |
| **Dados** (notas, rótulos, contagens) | **IBM Plex Mono**                       | Números tabulares, notação `T1 · E05`, clima de ficha técnica             |

### Escala

| Estilo    | Fonte             | Tamanho / altura de linha             | Peso    | Uso                                              |
| --------- | ----------------- | ------------------------------------- | ------- | ------------------------------------------------ |
| `display` | Archivo, wdth 115 | 48/50 (mobile 34/38)                  | 800     | Título da série no destaque da home              |
| `h1`      | Archivo, wdth 112 | 36/40 (mobile 28/32)                  | 800     | Título de página                                 |
| `h2`      | Archivo, wdth 110 | 22/28                                 | 700     | Título de seção                                  |
| `h3`      | Archivo, wdth 100 | 17/22                                 | 700     | Título de card, nome de temporada                |
| `bodyLg`  | Plex Sans         | 17/28                                 | 400     | Sinopse, texto de avaliação                      |
| `body`    | Plex Sans         | 15/24                                 | 400     | Texto padrão da interface                        |
| `small`   | Plex Sans         | 13/20                                 | 400–500 | Metadados, legendas                              |
| `label`   | Plex Mono         | 11/16, caixa alta, espaçamento 0,08em | 500     | Rótulos de seção ("EM ALTA"), metadados técnicos |
| `score`   | Plex Mono         | conforme contexto                     | 600     | Notas (`4,5`), contagens                         |

### Regras

- Títulos com espaçamento negativo leve (`-0.02em`); texto corrido sem ajuste.
- Caixa alta **só** no estilo `label`. Navegação e botões usam caixa normal.
- Texto corrido com no máximo ~68 caracteres por linha.
- Nota sempre com uma casa decimal e vírgula: `4,0`, `3,5` (use `formatScore`).
- Em `Heading`, aplique a escala por `size` (`display`, `h1`, `h2`, `h3`), não por `textStyle`: o tamanho padrão do Chakra sobrescreveria o estilo.
- Não usar itálico decorativo nem fontes serifadas.

---

## 4. Espaçamento e grid

Base de **4 px**. Use os tokens do Chakra (1 = 4 px).

| Token | px  | Uso típico                                 |
| ----- | --- | ------------------------------------------ |
| `1`   | 4   | Ícone ↔ texto pequeno                      |
| `2`   | 8   | Ícone ↔ texto, itens de chip               |
| `3`   | 12  | Gap entre pôsteres no celular              |
| `4`   | 16  | Padding de card, gutter mobile             |
| `5`   | 20  | Gap entre pôsteres no desktop              |
| `6`   | 24  | Gutter tablet, padding de card grande      |
| `8`   | 32  | Gutter desktop, entre blocos de uma seção  |
| `12`  | 48  | Entre seções (mobile: `8`)                 |
| `16`  | 64  | Respiro do topo de página em telas grandes |

- **Container**: largura máxima de 1200 px, centralizado, com gutters de 16/24/32 px (mobile/tablet/desktop). Componente `PageContainer`.
- **Grade de pôsteres**: 2 colunas (até 480 px), 3 (480 px+), 4 (768 px+), 5 (992 px+), 6 (1280 px+).
- **Breakpoints** (padrão do Chakra): `sm` 480, `md` 768, `lg` 992, `xl` 1280.
- Alinhe tudo à esquerda por padrão. Centralizar é exceção (modais de confirmação e a página 404).

---

## 5. Forma: raios, bordas e profundidade

| Token         | Valor | Uso                                  |
| ------------- | ----- | ------------------------------------ |
| `radius.xs`   | 2 px  | Barras da faixa de temporadas, selos |
| `radius.sm`   | 4 px  | Botões, inputs, chips                |
| `radius.md`   | 6 px  | Cards, pôsteres                      |
| `radius.lg`   | 10 px | Modais, menus, painéis               |
| `radius.full` | —     | Somente avatares                     |

- Separação por **borda de 1 px** (`ink.700`) e degraus de superfície (`ink.900` → `ink.850`), não por sombra.
- Sombra só em elementos flutuantes (modal, menu, toast): `0 12px 32px rgba(0,0,0,0.5)`.
- Botões **não** são pílulas. Pílula fica restrita a nada; chips usam `radius.sm`.

---

## 6. Iconografia

- Biblioteca única: **Phosphor Icons** (`@phosphor-icons/react`). Não misturar com outras bibliotecas.
- Peso **regular** por padrão. Peso **fill** apenas para indicar estado ativo (curtido, na watchlist, avaliado).
- Tamanhos: 16 px (junto a texto pequeno), 20 px (botões e navegação), 24 px (estados vazios, no máximo 32 px).
- Cor herdada do texto. Ícone em `signal` só quando o elemento está ativo/selecionado.
- Proibido: ícones dentro de quadrados ou círculos coloridos, ícones como ilustração gigante, emoji na interface.
- Ícone sozinho (sem texto) precisa de `aria-label` e tooltip.

---

## 7. Imagens

- **Pôster**: sempre na proporção 2:3, com `radius.md` e borda interna sutil (`inset 0 0 0 1px rgba(255,255,255,0.06)`) para não "sumir" em pôsteres escuros.
- **Fundo (backdrop)**: ocupa o topo da página da série e o destaque da home, com véu de `ink.950` vindo de baixo e da esquerda.
- **Logo da série** (TMDB): preferido ao título em texto no destaque e no cabeçalho da série; quando não existir, usar o título no estilo `display`.
- **Sem imagem**: retângulo `ink.850` com o título da série em `h3`, nunca um ícone genérico de TV.
- Hover em pôster: borda `signal.400` e leve elevação (`translateY(-2px)`). Nada de zoom grande ou rotação.

---

## 8. Movimento

- Durações: 120 ms (hover, foco), 200 ms (entrada de menus e modais), 300 ms no máximo.
- Curva: `cubic-bezier(0.2, 0, 0, 1)`.
- Sem efeito ripple, sem quique, sem animação ao rolar a página ("aparecer ao entrar na tela").
- Carrosséis não giram sozinhos rápido demais: o destaque da home troca a cada 8 s e pausa ao passar o mouse.
- Respeitar `prefers-reduced-motion`: desligar transições não essenciais.

---

## 9. Componentes-assinatura

### Faixa de temporadas (`SeasonStrip`)

O elemento que identifica o SeasonScore. Uma linha de barras verticais, uma por temporada, com altura proporcional à nota média da comunidade e cor da escala de nota. Abaixo de cada barra, o rótulo `T1`, `T2`… em `label`. Temporadas sem nota aparecem como barra vazia (trilho `ink.800`).

- Na página da série: abre a seção "Temporadas". Cada barra é um botão; a escolhida ganha contorno `ink.50` e abre o painel da temporada logo abaixo (sua nota, botão de avaliar e avaliações da comunidade).
- Na home (visitantes) e na 404: como ilustração do conceito, marcada como "Exemplo".
- Em cards de lista/ranking: versão compacta (altura 24 px, sem rótulos).
- Implementação: `src/components/series/SeasonStrip.tsx`.

### Selo de nota (`ScoreBadge`)

Nota em Plex Mono 600 sobre fundo `ink.850`, com um traço de 2 px à esquerda na cor da escala. Ex.: `▍4,5`. Sem estrelas no selo.

### Estrelas (`RatingStars`)

Só onde o usuário dá ou lê a nota de uma avaliação individual. Cor `star`, peso fill para preenchidas, regular para vazias.

---

## 10. Componentes base

| Componente              | Especificação                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Botão primário**      | Fundo `signal.500`, texto `ink.950`, `radius.sm`, altura 40 (sm: 32), peso 600. Um por área de ação.                                                                 |
| **Botão secundário**    | Borda `ink.600`, texto `ink.100`, fundo transparente; hover `ink.850`.                                                                                               |
| **Botão fantasma**      | Sem borda, texto `ink.300`; hover texto `ink.100` e fundo `ink.850`.                                                                                                 |
| **Botão de perigo**     | Texto `danger`, borda `danger` a 40%.                                                                                                                                |
| **Input**               | Fundo `ink.850`, borda `ink.700`, foco com borda `signal.400` (sem anel grosso), `radius.sm`, altura 40.                                                             |
| **Abas**                | Linha inferior de 2 px `signal.400` na aba ativa; texto ativo `ink.100`, inativo `ink.300`. Rolagem horizontal no celular, sem setas.                                |
| **Card**                | Fundo `ink.900`, borda `ink.700`, `radius.md`, padding 16 (desktop 20). Nunca card dentro de card.                                                                   |
| **Chip/Tag**            | Fundo `ink.850`, texto `ink.300`, `radius.sm`, `small`.                                                                                                              |
| **Avatar**              | Circular, iniciais em `label` sobre `ink.800` quando não há foto.                                                                                                    |
| **Modal**               | Fundo `ink.900`, borda `ink.700`, `radius.lg`; no celular vira folha inferior de largura total.                                                                      |
| **Menu**                | Fundo `ink.850`, borda `ink.700`, `radius.lg`, itens com altura 36.                                                                                                  |
| **Toast**               | Canto inferior, fundo `ink.850`, traço lateral na cor do status (tema: `Alert` variante `solid`).                                                                    |
| **Cabeçalho de seção**  | Rótulo `label` (`ink.400`) acima, título `h2`, link "Ver tudo" à direita em `small` + seta.                                                                          |
| **Cabeçalho de página** | Título `h1` e, opcionalmente, uma linha de descrição em `ink.300`. Sem fundo próprio.                                                                                |
| **Estado vazio**        | Alinhado à esquerda dentro da seção: ícone 24 `ink.400`, frase do fato, frase da próxima ação e botão secundário. Nunca centralizado no meio de uma área enorme.     |
| **Navegação**           | Barra de 60 px, fundo `ink.950` a 85% com desfoque, borda inferior `ink.700`. Logo à esquerda, links em `body` 500, ações à direita. No celular: logo, busca e menu. |
| **Rodapé**              | Logo, links (Séries, Top 10, Listas, Comunidade, GitHub) e atribuição obrigatória do TMDB, em `small` `ink.400`.                                                     |

### Logo

Wordmark "SeasonScore" em Archivo 800 (largura 115), `ink.50`, precedido de um símbolo de três barras verticais crescentes (uma mini faixa de temporadas) em `signal.500`, `signal.400` e `signal.300`, da menor para a maior. Sem slogan junto ao logo. Implementação: `src/components/common/Logo.tsx`.

### Cards

- **Série** (`SeriesCard`): pôster 2:3, título em uma linha abaixo, ano em mono e `ScoreBadge` pequeno quando há nota. Posição de ranking como número mono `01` no canto do pôster.
- **Avaliação** (`ReviewCard`): miniatura do pôster, série, temporada, estrelas, trecho do texto (3 linhas) e autor. A avaliação é sobre texto, então o texto aparece.
- **Lista** (`ListCard`): até 5 pôsteres sobrepostos na capa, título, autor, descrição e números em mono (séries, curtidas, comentários).

### Fotos de perfil e capa

- Antes do envio, toda imagem passa pelo ajuste (`ImageCropModal`): arrastar, zoom e recomeçar.
- Perfil: recorte quadrado mostrado em círculo, salvo em 512×512. Capa: 3:1, salva em 1500×500, com grade de terços.
- O arquivo é gerado em WebP no navegador (JPEG se não houver suporte), então fotos grandes de celular cabem no limite do Storage.
- Proporções em `src/utils/cropImage.ts`; a prévia da capa nas configurações usa a mesma proporção.

### Layout das páginas

- Todas as páginas usam `PageContainer` (1200 px, margens 16/24/32).
- Cabeçalho, rodapé e "voltar ao topo" ficam no `Layout`; páginas não repetem o rodapé.
- Destaques com fundo (home e série) começam atrás da barra de navegação translúcida.

---

## 11. Linguagem e tom

- Português do Brasil, tratando o usuário por **você**. Frases curtas e diretas.
- Fale como fã de séries, não como empresa. Prefira "Avalie a temporada" a "Compartilhe sua experiência".
- Botões com verbo e objeto: "Avaliar temporada", "Criar lista", "Seguir", "Ver todas".
- Sem clichês de marketing: evitar "experiência", "jornada", "descubra o poder", "incrível", "revolucionário".
- Sem emoji, sem "✨", sem excesso de exclamação. Uma exclamação só em confirmações felizes, e raramente.
- Estados vazios dizem o fato e o próximo passo: "Ninguém avaliou esta temporada ainda. Seja o primeiro." e não "Ops! Nada por aqui 😢".
- Erros dizem o que aconteceu e o que fazer: "Não foi possível salvar a avaliação. Tente de novo em instantes."

### Glossário

| Termo     | Forma                                              | Observação                                  |
| --------- | -------------------------------------------------- | ------------------------------------------- |
| Temporada | "Temporada 2" em títulos; `T2` em rótulos e barras |                                             |
| Episódio  | `T2 · E05`                                         | Ponto médio com espaços                     |
| Nota      | `4,5`                                              | Escala de 0,5 a 5, uma casa decimal         |
| Avaliação | O texto + nota que o usuário publica               | Não usar "review" na interface              |
| Lista     | Coleção criada por um usuário                      |                                             |
| Watchlist | Séries que o usuário quer ver                      | Termo mantido por ser conhecido             |
| Data      | "mar. 2024", "12 mar. 2024"                        | Relativo ("há 2 h") só em atividade recente |

---

## 12. Acessibilidade

- Contraste AA em todo texto; nunca usar `ink.400` para texto essencial.
- Foco visível em todos os elementos interativos: borda/contorno `signal.400` de 2 px.
- Áreas de toque de no mínimo 40×40 px no celular.
- Imagens de pôster com `alt` igual ao nome da série; imagens decorativas com `alt=""`.
- Informação nunca depende só de cor (a faixa de temporadas também mostra o número da nota).

---

## 13. O que evitar (cara de template)

- Seção de "3 recursos" com ícone colorido em cima de cada card.
- Banner de chamada com degradê roxo/verde e "Pronto para…?".
- Botões em formato de pílula por toda parte.
- Ícones gigantes usados como ilustração.
- Tudo centralizado; textos de marketing genéricos.
- Cores diferentes por seção, efeitos de brilho, vidro fosco em tudo.
- Animações de entrada ao rolar, efeito ripple, botões que pulam.
- Botão flutuante grande de "voltar ao topo".
