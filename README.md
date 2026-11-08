# SeasonScore

SeasonScore é uma aplicação web inspirada no Letterboxd, focada em séries de TV e suas temporadas. Os usuários avaliam e discutem séries temporada por temporada, montam listas e acompanham o que os amigos estão assistindo.

**Acesse:** https://seasonscore.vercel.app/

## Funcionalidades

- 📺 Navegue por séries populares, lançamentos e o Top 10 da comunidade
- ⭐ Avalie cada temporada individualmente
- 💬 Comente e curta avaliações e listas
- 📝 Crie listas públicas ou privadas
- 👥 Siga outros usuários e receba notificações
- 🔖 Watchlist com aviso de novos episódios
- 🔍 Busca de séries e usuários

## Tecnologias

| Área      | Ferramentas                                                       |
| --------- | ----------------------------------------------------------------- |
| Interface | React 19, TypeScript, Chakra UI 2, Phosphor Icons                 |
| Dados     | TanStack Query, Zustand, Firebase (Auth + Firestore)              |
| Séries    | API do TMDB, acessada pelo proxy `api/tmdb.ts` (Vercel Functions) |
| Build     | Vite 8                                                            |
| Qualidade | ESLint, Prettier, Vitest, Testing Library, emulador do Firestore  |
| Deploy    | Vercel                                                            |

## Rodando localmente

Pré-requisitos: Node 22 (veja `.nvmrc`) e, para testar as regras do Firestore, Java 21.

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev
```

### Variáveis de ambiente

| Variável                     | Onde é usada                                                   |
| ---------------------------- | -------------------------------------------------------------- |
| `VITE_FIREBASE_*`            | Configuração do app web do Firebase (pública por natureza)     |
| `TMDB_API_KEY`               | Chave do TMDB, usada **só no servidor** pelo proxy `/api/tmdb` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Upload de fotos de perfil e capa                               |

Na Vercel, configure `TMDB_API_KEY` em _Settings → Environment Variables_. Por compatibilidade, o proxy também aceita a antiga `VITE_TMDB_API_KEY`.

## Scripts

| Comando              | O que faz                                            |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento (inclui o proxy do TMDB) |
| `npm run build`      | Checagem de tipos e build de produção                |
| `npm run preview`    | Serve o build localmente                             |
| `npm run lint`       | ESLint                                               |
| `npm run typecheck`  | TypeScript sem gerar arquivos                        |
| `npm run format`     | Formata o código com Prettier                        |
| `npm test`           | Testes unitários (Vitest)                            |
| `npm run test:rules` | Testes das regras do Firestore no emulador           |

## Estrutura

```
api/            Funções serverless (proxy do TMDB)
public/         Service worker, manifest e página offline
src/
  components/   Componentes por domínio (series, reviews, lists, ...)
  contexts/     Contexto de autenticação
  hooks/        Hooks reutilizáveis
  pages/        Páginas (carregadas sob demanda)
  services/     Acesso ao Firestore e ao TMDB
  types/        Tipos compartilhados
  utils/        Funções utilitárias
tests/rules/    Testes das regras de segurança do Firestore
```

## Segurança do Firestore

As regras ficam em `firestore.rules` e têm testes em `tests/rules`. Depois de alterá-las, publique com:

```bash
npx firebase deploy --only firestore:rules
```

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).
