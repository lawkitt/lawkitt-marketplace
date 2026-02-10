# Release Workflow Runbook

This document outlines the procedures for updating the Lawkitt Marketplace, publishing new releases, and handling rollbacks.

## 0. Prerequisites & Configuration

For the automated workflows to function correctly, the repository must be configured to allow GitHub Actions to modify the codebase and create releases.

### GitHub Token Permissions

Since the "Read and write permissions" option is unavailable (likely due to organization policies), you must use a **Personal Access Token (PAT)** to allow the workflows to write changes.

1.  **Create a Personal Access Token**:

    -   Go to **Settings** (User) > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
    -   Generate a new token with the `repo` scope (full control of private repositories) or `public_repo` (if public).
    -   Copy the token string.

2.  **Add the Token as a Repository Secret**:
    -   Go to your repository's **Settings** > **Secrets and variables** > **Actions**.
    -   Click **New repository secret**.
    -   Name: `MARKETPLACE_TOKEN`
    -   Value: (Paste your PAT)
    -   Click **Add secret**.

**Why is this needed?**

-   **Generate Marketplace**: Uses `MARKETPLACE_TOKEN` to push regenerated `marketplace.yaml` files back to the repository.
-   **Package Skills**: Uses `MARKETPLACE_TOKEN` to create GitHub Releases and upload `.tar.gz` artifacts.

## 1. Standard Release Process

The marketplace operates on a **Continuous Delivery** model. Changes merged to the `main` branch automatically trigger generation, validation, and release workflows.

### Step 1: Contribution

1. Create a new branch from `main`.
2. Add or update content in `skills/`, `modes/`, or `mcps/`.
3. (Optional) Run generation scripts locally to verify output:
    ```bash
    cd bin
    pnpm install
    pnpm exec tsx generate-skill-marketplace.ts
    # ... etc
    ```
4. Commit changes.

### Step 2: Validation (CI)

Open a Pull Request. The `Validate Marketplace` workflow will run:

-   **Contract Validation**: Checks if `marketplace.yaml` files have all required fields.
-   **Drift Check**: Verifies that `marketplace.yaml` files match the source directories. If this fails, run the generation scripts locally and commit the result.
-   **Skill Validation**: Checks `SKILL.md` structure.

### Step 3: Merge & Release

Upon merging to `main`:

1. **Generate Marketplace**: Updates the catalogs if needed (though Drift Check ensures they are up to date).
2. **Package Skills**:
    - Packs each skill into a `.tar.gz`.
    - Creates/Updates a GitHub Release tagged `skills-YYYYMMDDHHMMSS`.
    - Updates the `skills-latest` release with the new artifacts.

## 2. Verification

After a merge, verify the release:

1. Check the [Actions tab](https://github.com/lawkitt/lawkitt-marketplace/actions) for success.
2. Verify the `skills-latest` release has updated assets.
3. Check `docs/cloud-backend-handoff.md` URLs to ensure they return the expected content.

## 3. Rollback Procedures

If a bad catalog or broken skill is released, follow these steps to rollback.

### Scenario A: Bad Catalog Entry (Metadata issue)

1. **Revert**: Revert the PR that introduced the bad change.
2. **Merge**: Merge the revert PR immediately.
3. **Automated Fix**: The CI will regenerate the catalogs (removing the bad entry) and push the update.

### Scenario B: Broken Skill Artifact (Code issue)

1. **Fix**: Push a fix to the skill's source code.
2. **Merge**: Merge the fix to `main`.
3. **Republish**: The `Package Skills` workflow will automatically run, repackaging the skill and overwriting the artifact in `skills-latest`.
    - _Note_: Clients downloading `skills-latest/{skill}.tar.gz` will immediately get the fixed version.

### Scenario C: Catastrophic Failure (Need to restore previous state)

If the `main` branch is severely broken:

1. Identify the last stable commit hash.
2. Reset `main` to that commit (requires Admin privileges):
    ```bash
    git checkout main
    git reset --hard <stable-commit-hash>
    git push origin main --force
    ```
3. Trigger the `Package Skills` workflow manually from the Actions tab to restore `skills-latest` assets to the stable state.
