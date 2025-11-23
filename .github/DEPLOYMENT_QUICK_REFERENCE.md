# 🚀 Deployment Quick Reference

## TL;DR

✅ **Only `main` branch deploys to GitHub Pages**
⛔ **Feature branches are automatically blocked from deploying**
📝 **Merge to `main` to deploy your changes**

## Common Scenarios

### I pushed to a feature branch and got a "deployment skipped" message

**This is expected behavior!** Feature branches don't deploy to GitHub Pages.

**To deploy your changes:**
1. Create a Pull Request to `main`
2. Merge the PR
3. GitHub Pages will deploy automatically

### I need to deploy right now

**Option 1: Merge to main**
```bash
git checkout main
git merge your-feature-branch
git push origin main
# ✅ Auto-deploys in ~2 minutes
```

**Option 2: Manual workflow trigger**
1. Go to [Actions](https://github.com/MonroeGamble/WebApp/actions)
2. Click "Deploy to GitHub Pages"
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

### My changes aren't showing on the site

**Wait 1-2 minutes** - Deployments take time:
- Build & deploy: ~1 minute
- CDN propagation: ~30-60 seconds

**Then hard refresh your browser:**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Still not working?**
- Check [Actions tab](https://github.com/MonroeGamble/WebApp/actions) - Did deployment succeed?
- Check [Deployments tab](https://github.com/MonroeGamble/WebApp/deployments) - Is the latest version deployed?

### I want to test before deploying

**For feature branches:**
- Test locally: `python -m http.server 8000`
- Open: `http://localhost:8000`

**For PRs:**
- Request review from team members
- Test in local environment
- Merge when confident

### Data update workflows aren't triggering deployment

**Check these conditions:**
1. Is the workflow running on `main`?
2. Did the data actually change?
3. Check workflow logs in Actions tab

**Data workflows only trigger deployment when:**
- Running on `main` branch
- Data files have changes
- Changes were successfully committed

## Deployment States

| Icon | State | Meaning |
|------|-------|---------|
| 🟢 | Success | Deployment completed, site is live |
| 🟡 | In Progress | Currently deploying |
| ⛔ | Skipped | Feature branch (expected) |
| 🔴 | Failed | Something went wrong, check logs |

## Quick Commands

```bash
# Check current branch
git branch

# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge feature/my-feature

# Push and deploy
git push origin main

# Check deployment status
gh workflow view "Deploy to GitHub Pages"
```

## URLs

- **Live Site**: https://monroegamble.github.io/WebApp/
- **Actions**: https://github.com/MonroeGamble/WebApp/actions
- **Deployments**: https://github.com/MonroeGamble/WebApp/deployments
- **Settings**: https://github.com/MonroeGamble/WebApp/settings/pages

## Need More Help?

📚 **Full Documentation**: [DEPLOYMENT.md](../DEPLOYMENT.md)
🐛 **Report Issues**: [GitHub Issues](https://github.com/MonroeGamble/WebApp/issues)
📊 **Check Status**: [GitHub Status](https://www.githubstatus.com/)

---

**Last Updated**: 2025-11-23
