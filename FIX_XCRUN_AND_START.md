# Fix xcrun Error and Start Backend

## Issue
You're seeing: `xcrun: error: invalid active developer path`

This means macOS Command Line Tools need to be installed or updated.

## Fix xcrun Error

### Option 1: Install Command Line Tools (Recommended)

```bash
xcode-select --install
```

This will open a dialog. Click "Install" and wait for it to complete (may take 10-15 minutes).

### Option 2: Reset Command Line Tools Path

If Option 1 doesn't work:

```bash
sudo xcode-select --reset
sudo xcode-select --switch /Library/Developer/CommandLineTools
```

### Option 3: Install Xcode Command Line Tools via Software Update

```bash
softwareupdate --install -a
```

## After Fixing xcrun

1. **Restart your terminal** (or open a new terminal window)

2. **Verify Python works:**
   ```bash
   python3 --version
   ```

3. **Start the backend:**
   ```bash
   cd /Users/pradeepdyd/referconnect-frontend
   ./start_backend.sh
   ```

## Alternative: Use System Python (If xcrun fix doesn't work immediately)

If you need to start the backend immediately and can't fix xcrun right now:

1. Check if you have Homebrew Python installed:
   ```bash
   which python3
   /usr/local/bin/python3 --version  # Try this if available
   ```

2. Or use a Python version manager like pyenv:
   ```bash
   brew install pyenv
   pyenv install 3.11
   pyenv global 3.11
   ```

## Quick Start After Fix

Once xcrun is fixed:

```bash
# Navigate to project
cd /Users/pradeepdyd/referconnect-frontend

# Start backend (script will handle setup)
./start_backend.sh
```

The backend will:
- ✅ Create .env file if needed
- ✅ Install dependencies if needed  
- ✅ Start server on http://localhost:8000

## Verify Backend is Running

Once started, check:
- Health: http://localhost:8000/health
- API Docs: http://localhost:8000/docs
- API: http://localhost:8000

## Need Help?

If xcrun error persists:
1. Make sure you have admin rights
2. Try restarting your Mac
3. Check Apple's developer site for Command Line Tools updates


