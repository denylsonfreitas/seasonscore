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

| Área      | Ferramentas                                                           |
| --------- | --------------------------------------------------------------------- |
| Interface | React 19, TypeScript, Chakra UI 2, Phosphor Icons                     |
| Dados     | TanStack Query, Zustand, Supabase (Postgres, Auth, Storage, Realtime) |
| Séries    | API do TMDB, acessada pelo proxy `api/tmdb.ts` (Vercel Functions)     |
| Build     | Vite 8                                                                |
| Qualidade | ESLint, Prettier, Vitest, Testing Library, emulador do Firestore      |
| Deploy    | Vercel                                                                |

## Rodando localmente

Pré-requisito: Node 22 (veja `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev
```

### Variáveis de ambiente

| Variável                        | Onde é usada                                                   |
| ------------------------------- | -------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase                                        |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase (a segurança vem das políticas RLS)  |
| `TMDB_API_KEY`                  | Chave do TMDB, usada **só no servidor** pelo proxy `/api/tmdb` |

Na Vercel, cadastre as três em _Settings → Environment Variables_.

## Banco de dados (Supabase)

Todo o esquema fica versionado em `supabase/migrations`:

- **Tabelas**: perfis, avaliações (uma linha por temporada), curtidas, comentários, listas, seguidores, watchlist e notificações.
- **Segurança (RLS)**: qualquer pessoa lê o conteúdo público; cada usuário só altera os próprios dados. O email não é público.
- **Triggers**: criam o perfil no cadastro e geram as notificações (seguir, curtir, comentar, nova avaliação), então ninguém consegue criar notificação em nome de outra pessoa.
- **Views**: notas médias por série (`series_ratings`), feed de avaliações, resumo de listas e estatísticas de perfis.
- **Storage**: bucket `profile-images` para fotos de perfil e capa.

Para aplicar as migrações em outro projeto: `npx supabase link --project-ref <ref>` e `npx supabase db push`.

### Configurações feitas no painel do Supabase

- **Authentication → URL Configuration**: Site URL `https://seasonscore.vercel.app` e, em Redirect URLs, `http://localhost:5173/**` e `https://seasonscore.vercel.app/**`.
- **Authentication → Sign In / Providers → Google**: Client ID e Secret criados no Google Cloud Console (OAuth, tipo "Aplicativo da Web"), com o redirect `https://jitudssddqheithrduij.supabase.co/auth/v1/callback`.
- **Authentication → Emails → SMTP**: o envio padrão do Supabase permite poucos emails por hora; para produção, configure um SMTP próprio (Resend, Brevo etc.).

## Scripts

| Comando                    | O que faz                                                 |
| -------------------------- | --------------------------------------------------------- |
| `npm run dev`              | Servidor de desenvolvimento (inclui o proxy do TMDB)      |
| `npm run build`            | Checagem de tipos e build de produção                     |
| `npm run preview`          | Serve o build localmente                                  |
| `npm run lint`             | ESLint                                                    |
| `npm run typecheck`        | TypeScript sem gerar arquivos                             |
| `npm run format`           | Formata o código com Prettier                             |
| `npm test`                 | Testes unitários (Vitest)                                 |
| `npm run test:integration` | Testes de ponta a ponta contra um projeto Supabase real ¹ |

¹ Requer as variáveis `VITE_SUPABASE_*`, `TEST_USER_A_EMAIL`, `TEST_USER_B_EMAIL` e `TEST_USER_PASSWORD` (dois usuários confirmados). As contas de teste são excluídas ao final.

As políticas RLS e os triggers também são testados por `supabase/tests/rls_check.sql`, que o CI executa em um Supabase local.

## Estrutura

```
api/                 Funções serverless (proxy do TMDB)
public/              Service worker, manifest e página offline
src/
  components/        Componentes por domínio (series, reviews, lists, ...)
  config/            Cliente do Supabase
  contexts/          Contexto de autenticação
  hooks/             Hooks reutilizáveis
  integration/       Testes contra o Supabase real
  pages/             Páginas (carregadas sob demanda)
  services/          Acesso ao banco e ao TMDB
  types/             Tipos compartilhados (inclui os tipos gerados do banco)
  utils/             Funções utilitárias
supabase/
  migrations/        Esquema do banco, RLS, triggers e storage
  tests/             Verificação das políticas de segurança
```

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).
