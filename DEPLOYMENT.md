# 🚀 GitHub Pages Deployment System

## Overview

This repository uses an **automated, zero-maintenance deployment system** for GitHub Pages. The deployment workflow is designed to be:

- **Secure**: Only the `main` branch can deploy to production
- **Reliable**: Deterministic deployment with proper error handling
- **Simple**: No build steps required (static site)
- **Safe**: Feature branches cannot accidentally trigger deployments

## 📋 Deployment Rules

### ✅ What WILL Deploy

- **Pushes to `main`** → Automatic deployment to GitHub Pages
- **Manual workflow trigger** → Deploy via GitHub Actions UI (main branch only)

### ❌ What WILL NOT Deploy

- **Feature branches** (e.g., `claude/*`, `feature/*`) → Deployment skipped with helpful message
- **Pull requests** → Build validation only, no deployment
- **Draft commits** → Must be merged to main first

## 🔧 How It Works

### 1. Deployment Guard

Every workflow run starts with a guard job that checks:
```yaml
if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
  # ✅ Allow deployment
else
  # ⛔ Block deployment
fi
```

### 2. Main Deployment Job

When deployment is allowed, the workflow:
1. Checks out the repository
2. Configures GitHub Pages
3. Uploads all static files as an artifact
4. Deploys to GitHub Pages
5. Outputs the deployment URL

### 3. Skip Job

When deployment is blocked, the workflow:
1. Displays a clear message explaining why
2. Provides instructions on how to deploy
3. Exits gracefully (no errors)

## 📦 What Gets Deployed

The entire repository root is deployed to GitHub Pages, including:
- `index.html` (homepage)
- `Website/` (stock ticker)
- `StockChart/` (interactive charts)
- `FranchiseMap/` (location map)
- `FranchiseNews/` (news widgets)
- All CSS, JavaScript, and assets

## 🔄 Deployment Workflow

### For Feature Development

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/my-feature
   ```

3. **GitHub Actions will run but skip deployment**
   - ✅ Workflow completes successfully
   - ⛔ Deployment is blocked (expected behavior)
   - 📝 Message explains how to deploy

4. **Create a Pull Request to `main`**
   - Review changes
   - Merge when ready

5. **Automatic deployment happens on merge**
   - 🚀 GitHub Pages updates within 1-2 minutes
   - ✅ Site is live at https://monroegamble.github.io/WebApp/

### For Hotfixes

1. **Push directly to `main` (if you have permissions)**
   ```bash
   git checkout main
   git pull
   # Make your changes
   git add .
   git commit -m "Fix critical bug"
   git push origin main
   ```

2. **Deployment happens automatically**
   - No additional steps required
   - Monitor deployment at: https://github.com/MonroeGamble/WebApp/actions

## 🎯 Manual Deployment

You can manually trigger a deployment from the GitHub Actions UI:

1. Go to: https://github.com/MonroeGamble/WebApp/actions
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow" button

## 🛡️ Environment Protection

The workflow uses the `github-pages` environment, which can be configured with:

- **Branch protection rules**: Require reviews before merge
- **Deployment protection rules**: Add manual approval steps
- **Required reviewers**: Specific people must approve deployments

To configure:
1. Go to: Settings → Environments → github-pages
2. Add protection rules as needed

## 🔍 Monitoring Deployments

### Check Deployment Status

- **Actions Tab**: https://github.com/MonroeGamble/WebApp/actions
- **Deployments Tab**: https://github.com/MonroeGamble/WebApp/deployments

### Deployment Logs

Each deployment provides detailed logs:
1. Guard check results
2. Checkout and setup steps
3. Upload and deployment progress
4. Final deployment URL

### Troubleshooting

**Problem**: Deployment workflow doesn't run

**Solution**:
- Ensure you pushed to `main`
- Check GitHub Actions is enabled in repository settings

**Problem**: Deployment blocked on `main` branch

**Solution**:
- Check environment protection rules
- Verify GitHub Pages is enabled in repository settings
- Check workflow permissions

**Problem**: Changes not appearing on site

**Solution**:
- Wait 1-2 minutes for CDN propagation
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- Check deployment succeeded in Actions tab

## 📊 Deployment Statistics

- **Average deployment time**: ~1-2 minutes
- **Artifact size**: ~5-10 MB (static files)
- **CDN propagation**: ~30-60 seconds
- **Uptime**: 99.9% (GitHub Pages SLA)

## 🔐 Security Best Practices

1. **Never commit secrets**: Use GitHub Secrets for sensitive data
2. **Review PRs carefully**: All changes deploy to production
3. **Use branch protection**: Require reviews before merging to main
4. **Monitor deployments**: Watch the Actions tab for unexpected deploys
5. **Keep dependencies updated**: Security patches for Actions

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Repository Workflows](.github/workflows/)

## 🆘 Getting Help

If you encounter issues:

1. **Check workflow logs**: Actions tab → Latest run → View logs
2. **Check GitHub Status**: https://www.githubstatus.com/
3. **Review this documentation**: Ensure you're following the correct process
4. **Open an issue**: Describe the problem with screenshots/logs

## 📝 Changelog

### v2.0 (2025-11-23)
- ✅ Rewritten deployment workflow for main-only deployment
- ✅ Added deployment guard to prevent feature branch deployments
- ✅ Improved error messages and user feedback
- ✅ Added comprehensive documentation
- ✅ Removed legacy branch deployment rules

### v1.0 (Previous)
- ✅ Initial deployment setup
- ⚠️ Allowed multiple branches to deploy (caused issues)
