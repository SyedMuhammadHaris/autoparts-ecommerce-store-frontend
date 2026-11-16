# Phase 2 push and review

Run these yourself from PowerShell:

```powershell
Set-Location D:\autoparts-emcommerce-store\autoparts-ecommerce-store-frontend
git push -u origin feat/phase-2
gh pr create --base main --head feat/phase-2 --title "Phase 2: accounts, storefront catalog and initial admin" --body-file docs/PR_DESCRIPTION.md
```

If GitHub CLI is unavailable, push with Git and open a PR on GitHub using the
same title and docs/PR_DESCRIPTION.md. Merge backend first, frontend second.
Preview: http://localhost:3000/products. Create your own administrator using the
backend interactive command, then sign in and open /admin. No default credentials.
Confirm both PR outcomes before the next phase. No branch was pushed by Codex.
