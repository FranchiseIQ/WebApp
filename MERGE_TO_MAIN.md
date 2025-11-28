# How to Merge to Main and Activate GitHub Actions

## The Issue

GitHub Actions workflows only show up in the Actions tab when they exist on the **default branch** (usually `main`). Currently, all your work is on feature branches, so the workflows aren't visible yet.

## Solution: Create and Set Up Main Branch

Since your repository doesn't have a `main` branch yet, follow these steps:

### Option 1: Via GitHub Web Interface (Recommended)

1. **Go to your repository on GitHub**: https://github.com/MonroeGamble/WebApp

2. **Create a Pull Request**:
   - Click on **"Pull requests"** tab
   - Click **"New pull request"**
   - Set base to: `main` (GitHub will offer to create it)
   - Set compare to: `claude/franchise-news-widget-01WM5qh2UNjRZcSmCRVhQpwX`
   - Click **"Create pull request"**
   - Title: "Merge franchise news widget and GitHub Actions workflows"
   - Click **"Create pull request"**
   - Click **"Merge pull request"**
   - Click **"Confirm merge"**

3. **Set main as default branch**:
   - Go to **Settings** → **General**
   - Under "Default branch", click the pencil icon
   - Select `main` from dropdown
   - Click **"Update"**
   - Confirm the change

4. **Verify Actions are visible**:
   - Go to **Actions** tab
   - You should now see:
     - Update Franchise News
     - Update Franchise Stock Data

### Option 2: Force Create Main from Command Line

If you have direct push access, you can try:

```bash
# Create main branch from current state
git checkout -b main-temp
git branch -m main-temp main

# Force push to create main (if allowed)
git push -f origin main

# Set as upstream
git branch --set-upstream-to=origin/main main
```

**Note**: This may fail due to repository protection rules. Option 1 is safer.

## After Main Branch Exists

### Enable GitHub Actions (if not already done)

1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions":
   - Select ✓ **"Read and write permissions"**
   - Check ✓ **"Allow GitHub Actions to create and approve pull requests"**
3. Click **"Save"**

### Manually Trigger First Workflow Run

1. Go to **Actions** tab
2. Click **"Update Franchise News"** in left sidebar
3. Click **"Run workflow"** dropdown (top right)
4. Click green **"Run workflow"** button
5. Wait 30-60 seconds for completion
6. Check for new commit: "Update franchise news - [date]"

## What You'll Have After Setup

✅ **Main branch** with all your latest code
✅ **GitHub Actions** visible in Actions tab
✅ **Automatic news updates** every 6 hours
✅ **Automatic stock updates** after market close
✅ **Bottom news ticker** fixed and working

## Troubleshooting

**Problem**: Can't create Pull Request
**Solution**: Make sure you're logged into GitHub and have write access to the repository

**Problem**: "main" branch doesn't exist as an option
**Solution**: Type "main" manually in the base branch field - GitHub will create it

**Problem**: Actions still not showing
**Solution**: Wait 1-2 minutes after merging, then refresh the Actions page

## Current Branch Status

Your feature branch `claude/franchise-news-widget-01WM5qh2UNjRZcSmCRVhQpwX` contains:

- ✅ GitHub Actions workflows (`.github/workflows/`)
- ✅ News fetching script (`scripts/fetch-franchise-news.py`)
- ✅ Fixed bottom news ticker
- ✅ All UI improvements
- ✅ Google Maps migration
- ✅ Stock data workflow fix

**Everything is ready** - you just need to merge it to `main`!

## Local Repository Check

If you're working from a fresh clone of this repository and don't see all of the feature branches yet, first verify what's available locally:

```bash
git branch -a
```

At the moment, only the `work` branch is present in the local checkout. If additional branches exist on the remote, add the remote (for example, `origin`) and fetch them before merging:

```bash
git remote add origin <REMOTE_URL>
git fetch --all --prune
```

After fetching, merge each remote feature branch into `main`, resolve any conflicts with the most recent code, and delete the obsolete branches once they've been incorporated.

### One-shot consolidation (combine all outstanding PRs)

If several feature branches or open pull requests need to be rolled into a single clean history entry so the old branches can be deleted, use a temporary staging branch to collect them and then squash-merge into `main`:

```bash
# Create a staging branch from the latest default branch
git checkout work
git pull
git checkout -b merge-consolidation

# Merge every remote feature branch, preferring the newest code on conflicts
for branch in <branch-a> <branch-b> <branch-c>; do
  git merge --no-ff origin/$branch
done

# Resolve any conflicts by keeping the newest incoming changes, then continue the merge
git status  # use this to identify files needing conflict resolution

# Once all branches are merged, squash everything into a single commit for main
git checkout work
git merge --squash merge-consolidation
git commit -m "Consolidate outstanding branches and fixes"

# Push the consolidated commit and clean up
git push origin work:main
for branch in <branch-a> <branch-b> <branch-c>; do
  git push origin --delete $branch
done
git branch -D merge-consolidation
```

This process results in one fresh commit that contains the merged work from every outstanding branch, after which the old branches can be safely removed.
