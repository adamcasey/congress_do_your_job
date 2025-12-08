# Environment Variable Encryption with git-crypt

This project uses [git-crypt](https://github.com/AGWA/git-crypt) to encrypt sensitive environment files before committing them to GitHub. This allows the team to safely store API keys and secrets in version control.

## What Gets Encrypted

The following files are automatically encrypted by git-crypt when committed:

- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`
- Any files in `secrets/` directories
- `*.key` and `*.pem` files (except `*.pub` public keys)

The `.env.example` file is **NOT encrypted** so anyone can see the template.

## Initial Setup (Already Done)

The repository has already been initialized with git-crypt. These steps are for reference only:

```bash
# Initialize git-crypt (already done)
git-crypt init

# Create .gitattributes to specify what to encrypt (already done)
# See .gitattributes file for configuration
```

## For New Team Members

### Prerequisites

Install git-crypt:

```bash
# macOS
brew install git-crypt

# Ubuntu/Debian
sudo apt-get install git-crypt

# Windows (via Chocolatey)
choco install git-crypt
```

### Getting Access

1. **Generate a GPG key** (if you don't have one):

```bash
gpg --gen-key
```

Follow the prompts. Use your work email.

2. **Share your public key** with the team lead:

```bash
gpg --armor --export your-email@example.com > my-public-key.asc
```

Send `my-public-key.asc` to the team lead.

3. **Team lead adds you** to the repository:

```bash
# Team lead runs this
gpg --import team-member-public-key.asc
git-crypt add-gpg-user USER_ID
git push
```

4. **Unlock the repository** on your machine:

```bash
git clone https://github.com/yourusername/congress_do_your_job.git
cd congress_do_your_job
git-crypt unlock
```

The `.env` file and other encrypted files will now be automatically decrypted!

## Alternative: Symmetric Key (Simpler but Less Secure)

If you don't want to use GPG, you can export/import a symmetric key:

### Exporting the Key (Team Lead)

```bash
# Export the key to a file
git-crypt export-key /path/to/safe/location/git-crypt-key

# IMPORTANT: Store this key securely!
# - Add to 1Password, LastPass, or similar
# - Share via secure channel (Signal, encrypted email)
# - NEVER commit this key to git
```

### Importing the Key (New Team Member)

```bash
# Clone the repository
git clone https://github.com/yourusername/congress_do_your_job.git
cd congress_do_your_job

# Unlock using the shared key
git-crypt unlock /path/to/git-crypt-key

# The .env file is now readable!
```

## Daily Usage

Once set up, git-crypt works automatically:

### Adding Secrets

```bash
# Edit .env file normally
nano .env

# Add and commit - git-crypt encrypts automatically
git add .env
git commit -m "Update API keys"
git push

# The file is encrypted in the repository
# But decrypted in your working directory
```

### Verifying Encryption

```bash
# Check if files are encrypted on disk
git-crypt status

# Check encrypted status in git
git-crypt status -e
```

### Locking the Repository

If you want to lock the repository (encrypt files in working directory):

```bash
git-crypt lock
```

To unlock again:

```bash
git-crypt unlock
```

## CI/CD Integration

For GitHub Actions or other CI/CD:

### Option 1: GitHub Secrets (Recommended)

Store the git-crypt key as a GitHub Secret:

1. Export the key: `git-crypt export-key git-crypt-key`
2. Base64 encode it: `base64 git-crypt-key > git-crypt-key.b64`
3. Add to GitHub Secrets as `GIT_CRYPT_KEY`

In your GitHub Actions workflow:

```yaml
name: Deploy

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Unlock git-crypt
        run: |
          echo "${{ secrets.GIT_CRYPT_KEY }}" | base64 -d > /tmp/git-crypt-key
          git-crypt unlock /tmp/git-crypt-key
          rm /tmp/git-crypt-key

      - name: Build and deploy
        run: |
          # Your build/deploy commands
          # .env is now decrypted and available
```

### Option 2: Store Secrets Directly in GitHub Secrets

Instead of git-crypt for CI/CD, you can:

1. Use git-crypt only for local development
2. Store production secrets in GitHub Secrets/Vercel Environment Variables
3. CI/CD pulls from those secrets directly

## Security Best Practices

1. **Never commit the git-crypt key** to the repository
2. **Rotate keys** if someone leaves the team (use GPG key management)
3. **Audit access** regularly using `git-crypt status`
4. **Backup the key** in a secure location (1Password, encrypted backup)
5. **Use different keys** for production vs development if possible

## Troubleshooting

### "git-crypt: decryption failed"

Your git-crypt key is incorrect or corrupted. Get a fresh key from the team lead.

### Files not encrypting

Check `.gitattributes` configuration. Ensure the file pattern matches.

### Want to remove git-crypt

```bash
# Decrypt all files
git-crypt unlock

# Remove git-crypt
rm -rf .git-crypt
rm .gitattributes

# Commit decrypted files (CAREFUL!)
git add .
git commit -m "Remove git-crypt"
```

## Alternative: Environment Variables in Vercel/Production

For production deployments on Vercel:

1. Don't commit `.env.production` at all
2. Set environment variables directly in Vercel dashboard
3. Use git-crypt only for local development `.env` files

## Questions?

Contact the team lead or see:
- [git-crypt documentation](https://github.com/AGWA/git-crypt)
- [GPG quick start guide](https://www.gnupg.org/gph/en/manual.html)
