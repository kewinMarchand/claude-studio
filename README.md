# Claude Studio

Interface web **personnalisable** pour piloter **Claude Code en dehors du terminal**.
Une UI de chat qui lance le CLI `claude` déjà installé sur ta machine et affiche en temps réel
ses réponses, ses appels d'outils et leurs résultats.

> **Pas de clé API requise.** L'app pilote le binaire `claude` local, qui réutilise ton
> authentification d'abonnement existante (`apiKeySource: none`). Aucun coût API supplémentaire.

---

## Fonctionnalités

- **Chat en streaming** — réponses Markdown rendues au fil de l'eau.
- **Appels d'outils visibles** — chaque `Bash`, `Read`, `Edit`… s'affiche en carte repliable avec
  son entrée et son résultat (états *en cours / succès / erreur*).
- **Conversation multi-tours** — le contexte est conservé d'un message à l'autre (`--resume`).
- **Contexte & consommation** — dans une conversation, un bandeau affiche l'**utilisation du contexte**
  (% de la fenêtre du modèle + tokens) et la **consommation** (tokens + coût cumulés).
- **Conversations marque-pageables** — l'URL reflète la session courante (`?session=<id>`) ; recharger
  ou rouvrir l'URL reprend la conversation. Le logo ramène à l'accueil.
- **Sélecteur de dossier de travail** — démarre une conversation dans l'un des dossiers de la racine
  des projets (panneau latéral).
- **Panneau Sessions** (bouton *Sessions*) — **vue par projet** : chaque accordéon (regroupé par
  dossier de 1er niveau sous la racine, ex. `spk/backend` → `spk`) réunit les **Instructions**
  (`CLAUDE.md`, `.claude/*`), la **Mémoire** (`~/.claude/projects/.../memory`) et les **Conversations**
  liées. Recherche textuelle, clic sur un fichier = visionneuse (Markdown rendu), clic sur une
  conversation = reprise (comme `/resume`), ✕ = suppression.
- **Boîte à outils Claude** (bouton *Outils*) — parcours tes **commandes**, **skills**, **agents** et
  serveurs **MCP**, avec leur **description**, et un bouton **◎ pour lire le contenu** du fichier source
  (utile quand la description manque). Un clic insère la commande/skill/agent dans le composer.
- **Palette de commandes** — tape `/` dans le composer pour filtrer commandes et skills, puis
  ↑/↓ + Entrée (ou clic) pour insérer. Envoyer `/commande` l'exécute. Deux **sélecteurs Skill / Agent**
  au-dessus de la saisie permettent aussi de les insérer rapidement.
- **Infos de session** — bouton *ⓘ infos* du bandeau contexte : ouvre un panneau récapitulatif (projet,
  modèle, contexte, coût, tokens, et la commande `claude --resume <id>` pour reprendre au terminal).
- **Effort** (réglages) — expose `claude --effort` (bas → max) pour arbitrer profondeur de réflexion
  vs coût/latence.
- **Indicateurs d'usage** :
  - *Abonnement* : pourcentage d'utilisation **session** et **hebdomadaire** (jauges **toujours visibles
    dans l'en-tête**) avec date de réinitialisation (données réelles via `claude -p /usage`) ;
  - *Session en cours* : coût, tours, tokens cumulés (live) ;
  - *7 derniers jours* : coût, sessions, tokens + graphe par jour (calculé depuis les transcripts).
- **Bouton Stop** — interrompt une génération en cours.
- **Interface personnalisable** (persistée dans le navigateur) :
  - modèle (Fable / Opus / Sonnet / Haiku),
  - mode de permission,
  - dossier de travail (liste automatique de tes projets),
  - instructions système additionnelles,
  - thème clair / sombre, couleur d'accent, taille du texte, mode compact.

> **Coût :** estimé au tarif API public (tokens × tarif du modèle, cache compris). C'est une
> approximation indépendante de ce qu'affiche un éventuel plugin de statusline.

---

## Prérequis

- **Node.js ≥ 20** (testé sur 24) et **npm**.
- **`make`** (GNU Make) pour les raccourcis de commandes — présent par défaut sur macOS et la
  plupart des distributions Linux (`make --version` pour vérifier).
- Le **CLI `claude`** installé et **connecté** (`claude` lancé au moins une fois, login effectué).
- *(Optionnel)* **Docker** + **Docker Compose** pour l'exécution conteneurisée.

---

## Démarrage rapide

```bash
make install     # npm ci
make dev         # http://localhost:3210
```

> Claude Studio écoute sur le port **3210** (pas 3000) pour éviter les conflits avec d'autres
> projets qui tournent sur 3000.

Sans `make` :

```bash
npm ci
npm run dev
```

Pour un build de production local :

```bash
make build
make start
```

---

## Variables à renseigner

**Aucune variable n'est obligatoire** : l'app fonctionne sans configuration (pas de clé API,
authentification via ton abonnement Claude). Les variables ci-dessous servent uniquement à
surcharger les valeurs par défaut. Pour les définir, copie le modèle puis édite-le :

```bash
cp .env.example .env.local
```

| Variable                      | Rôle                                                                            | Défaut       | Obligatoire |
| ----------------------------- | ------------------------------------------------------------------------------- | ------------ | ----------- |
| `CLAUDE_STUDIO_PROJECTS_ROOT` | Racine à partir de laquelle naviguer pour choisir le dossier de travail         | `~` (HOME)   | Non         |
| `CLAUDE_BIN`                  | Chemin du binaire `claude` s'il n'est pas dans le `PATH` du serveur Next        | `claude`     | Non         |

- **`CLAUDE_STUDIO_PROJECTS_ROOT`** — le sélecteur de dossier de travail part de ce dossier et
  permet de descendre dans ses sous-dossiers (la navigation ne remonte jamais au-dessus). Laisse
  vide pour partir du HOME, ou pointe-le sur ton dossier de code (ex. `/home/moi/projets`).
- **`CLAUDE_BIN`** — utile si `claude` est installé hors `PATH` (ex. `~/.local/bin/claude`).

> Les valeurs réelles vivent dans `.env.local`, **ignoré par git** — rien de sensible n'est versionné.

---

## Docker

L'image embarque l'app **et** le CLI `claude`. Comme l'authentification et les fichiers vivent
sur l'hôte, `docker-compose.yml` monte deux volumes :

- `~/.claude` → l'auth de ton abonnement (sinon le `claude` du conteneur n'est pas connecté) ;
- ton dossier de projets → exposé sous `/projects` dans le conteneur.

```bash
make docker-build
make docker-up                       # http://localhost:3210
make docker-logs
make docker-down
```

Surcharges possibles :

```bash
make docker-up PORT=4000 PROJECTS_ROOT=$HOME/code
```

> **Note d'authentification :** si ton login Claude est stocké hors de `~/.claude` (trousseau
> système selon la plateforme), le CLI conteneurisé peut ne pas être authentifié. Dans ce cas,
> privilégie l'exécution locale (`make dev`), ou monte le fichier de credentials adéquat.

---

## Modes de permission

En mode *headless* (`claude -p`), Claude **ne peut pas demander d'autorisation interactive**.
Le mode choisi dans les réglages détermine donc ce qu'il peut faire seul :

| Mode               | Comportement                                              |
| ------------------ | --------------------------------------------------------- |
| **Autonome**       | Exécute tous les outils sans confirmation ⚠️              |
| **Édition auto**   | Édite les fichiers, refuse le reste *(défaut)*            |
| **Plan**           | Analyse et planifie, sans rien modifier                   |
| **Strict**         | Refuse tout ce qui nécessite une permission               |

> ⚠️ Le mode **Autonome** (`bypassPermissions`) laisse Claude lancer des commandes et modifier
> des fichiers sans validation. À réserver à **tes propres projets**, dans un dossier de travail
> que tu maîtrises.

---

## Architecture

L'app spawn `claude -p --output-format stream-json`, lit la sortie JSONL ligne par ligne et la
relaie au navigateur en **Server-Sent Events**. Le front agrège ces événements en messages.

```
Navigateur ──POST /api/chat──▶ Route Node ──spawn──▶ claude (CLI)
     ▲                            │
     └────────── SSE ─────────────┘   (system/init, assistant, tool_result, result)
```

### Structure (features isolées)

```
src/
  app/
    api/chat/route.ts            # spawn claude + flux SSE
    api/projects/route.ts        # navigation dans les dossiers (sous-dossiers du root)
    api/sessions/route.ts        # liste l'historique des sessions
    api/sessions/[id]/route.ts   # recharge les messages d'une session
    api/usage/route.ts           # agrégat d'usage hebdomadaire (transcripts)
    api/usage-limits/route.ts    # % session/hebdo via `claude -p /usage`
    api/capabilities/route.ts    # commandes/skills/agents/MCP (event init)
    StudioApp.tsx                # composition de l'UI (sidebar + chat)
    layout.tsx · page.tsx · globals.css
  features/
    chat/
      domain/                    # types des événements, erreurs (sans framework)
      application/useChat.ts     # état, parsing du flux, send/stop/loadSession
      infrastructure/
        server/claudeRunner.ts   # sous-processus claude
        client/streamClient.ts   # fetch + parsing SSE
      ui/                        # MessageList, Composer (palette /), ToolCallCard…
    sessions/
      domain/ · application/     # useSessions, useUsage, useUsageLimits
      infrastructure/server/     # transcripts.ts (coût + agrégats), usageLimits.ts
      ui/                        # Sidebar, SessionBrowser, UsagePanel, FileViewer
    capabilities/
      domain/ · application/     # useCapabilities
      infrastructure/server/     # capabilities.ts (capture l'event init)
      ui/                        # CapabilitiesDrawer (commandes/skills/agents/MCP)
    settings/
      domain/ · application/ · ui/
  common/                        # Markdown, formatage, utilitaires partagés
```

---

## Commandes (`make help`)

| Commande            | Description                                  |
| ------------------- | -------------------------------------------- |
| `make install`      | Installe les dépendances                     |
| `make dev`          | Serveur de développement                     |
| `make build`        | Build de production                          |
| `make start`        | Serveur de production                        |
| `make down`         | Arrête le serveur local sur le port          |
| `make typecheck`    | Vérification TypeScript                       |
| `make docker-build` | Construit l'image Docker                     |
| `make docker-up`    | Démarre le conteneur                         |
| `make docker-down`  | Arrête le conteneur                          |
| `make docker-logs`  | Suit les logs                                |
| `make docker-sh`    | Shell dans le conteneur                      |
| `make clean`        | Nettoie les artefacts de build               |

---

## Limites connues

- **Approbation interactive des outils** non implémentée : le contrôle se fait via le *mode de
  permission* (et non un clic par commande). Une évolution possible : le protocole
  `--input-format stream-json` pour autoriser/refuser chaque outil depuis l'UI.
- **Latence des panneaux Outils / % d'usage** : `/api/capabilities` et `/api/usage-limits` lancent un
  sous-processus `claude` ; le premier chargement prend quelques secondes (le % d'abonnement est ensuite
  rafraîchi après chaque tour).
- Build : un *warning* Turbopack NFT (le runner utilise `child_process`) est bénin en local.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · CLI Claude Code · SSE · CSS variables.
