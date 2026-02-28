# 📋 FormAI — Guide de Démarrage Rapide

## Comment utiliser ces documents

### 1. Fichier `CONCEPTION-FORMAI.md`
La **documentation complète** de l'architecture. Contient :
- Architecture globale et diagrammes
- Stack technologique avec justifications
- Modèle de données complet (tous les schémas MongoDB)
- Tous les endpoints API (40+ routes)
- Structure des dossiers du projet
- Plan de sécurité
- Workflow de création de formulaire (5 étapes)
- Variables d'environnement
- Configuration Docker

### 2. Fichier `CLAUDE-CODE-PROMPT.md`
Le **mega-prompt à copier-coller dans Claude Code**. Contient :
- 9 étapes séquentielles de construction
- Code source complet des composants critiques
- Dépendances NPM exactes
- System prompt optimisé pour Claude API (génération de formulaires)
- Fichiers de configuration (Docker, TypeScript, ESLint)
- Script de seed pour données initiales
- Checklist de validation complète
- Ordre de priorité d'implémentation

## Pour lancer le projet avec Claude Code

```
1. Ouvre Claude Code (terminal)
2. Copie-colle le contenu ENTIER de CLAUDE-CODE-PROMPT.md
3. Laisse Claude Code travailler
4. Interviens pour corriger si nécessaire
5. Teste avec : docker-compose up -d
```

## Architecture en un coup d'œil

```
UTILISATEUR → [Next.js Frontend] → [Express API] → [Claude AI]
                                         ↓                ↓
                                    [MongoDB]     [Génère JSON]
                                    - users            ↓
                                    - forms       [Formulaire]
                                    - form_X_sub       ↓
                                    - groups      [Collection
                                    - ...          MongoDB
                                                   dédiée]
```

## Flux principal

```
Décrire → Générer (IA) → Prévisualiser → Raffiner → Tester → Publier
```

## Technologies clés

| Quoi | Techno |
|------|--------|
| Frontend | Next.js 14, Tailwind, Shadcn/ui |
| Backend | Express, TypeScript |
| BD | MongoDB (collections dynamiques) |
| IA | Claude API (Sonnet 4.5) |
| Auth | JWT + RBAC par groupes |
| Deploy | Docker Compose |
