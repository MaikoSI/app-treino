#!/usr/bin/env bash
# Protege a branch main: só aceita mudanças por Pull Request, com o CI passando.
# Requer: gh autenticado com permissão de administrador no repositório.
# Uso: scripts/proteger-main.sh [dono/repo]   (padrão: o repositório do diretório atual)
set -euo pipefail

repo="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

gh api --method PUT "repos/${repo}/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["verificar"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false
}
JSON

echo "main protegida em ${repo}: merge só por PR com o check 'verificar' passando."
