.DEFAULT_GOAL := help
.PHONY: help install dev build start down typecheck docker-build docker-up docker-down docker-logs docker-sh clean

# Variables surchargeables : make docker-up PORT=4000
# 3210 (et non 3000) pour éviter les conflits de port avec d'autres projets.
PORT ?= 3210
IMAGE ?= claude-studio
PROJECTS_ROOT ?= $(HOME)

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

## --- Développement local ---

install: ## Installe les dépendances (npm ci)
	npm ci

dev: ## Lance le serveur de développement (hot reload)
	npm run dev

build: ## Build de production
	npm run build

start: ## Démarre le serveur de production (après build)
	npm run start

down: ## Arrête le serveur local (dev ou prod) sur le port (3210 par défaut)
	@if fuser -k $(PORT)/tcp >/dev/null 2>&1; then \
		echo "Serveur arrêté (port $(PORT))."; \
	elif pids=$$(lsof -ti:$(PORT) 2>/dev/null) && [ -n "$$pids" ]; then \
		kill $$pids 2>/dev/null && echo "Serveur arrêté (port $(PORT))."; \
	else \
		echo "Aucun serveur local sur le port $(PORT)."; \
	fi

typecheck: ## Vérifie les types TypeScript sans émettre
	npm run typecheck

## --- Docker ---

docker-build: ## Construit l'image Docker
	docker build -t $(IMAGE) .

docker-up: ## Démarre le conteneur (monte l'auth claude + les projets)
	PORT=$(PORT) PROJECTS_ROOT=$(PROJECTS_ROOT) docker compose up -d

docker-down: ## Arrête et supprime le conteneur
	docker compose down

docker-logs: ## Suit les logs du conteneur
	docker compose logs -f

docker-sh: ## Ouvre un shell dans le conteneur
	docker compose exec app sh

## --- Maintenance ---

clean: ## Supprime les artefacts de build et le cache
	rm -rf .next out node_modules/.cache
