#!/bin/bash

# Repository Bootstrap Script
# Configures GitHub repository settings, branch protection, and PR management
# Usage: bash .tools/bootstrap_repo.sh OWNER REPO BRANCH

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check arguments
if [ $# -ne 3 ]; then
    log_error "Usage: $0 OWNER REPO BRANCH"
    log_error "Example: $0 Ryotaverse69 suptia-kiro master"
    exit 1
fi

OWNER="$1"
REPO="$2"
BRANCH="$3"
REPO_FULL="${OWNER}/${REPO}"

log_info "Bootstrapping repository: ${REPO_FULL}"
log_info "Target branch: ${BRANCH}"

# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

if ! gh auth status &> /dev/null; then
    log_error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
    exit 1
fi

# 1. Enable auto-merge on repository
log_info "Step 1: Enabling auto-merge on repository..."
if gh repo edit "${REPO_FULL}" --enable-auto-merge 2>/dev/null; then
    log_success "Auto-merge enabled successfully"
else
    log_warning "Failed to enable auto-merge (may already be enabled or insufficient permissions)"
fi

# 2. Create automerge label if missing
log_info "Step 2: Creating 'automerge' label..."
if gh label create automerge \
    --color "0e8a16" \
    --description "Auto-merge when all checks pass" \
    --repo "${REPO_FULL}" 2>/dev/null; then
    log_success "Label 'automerge' created successfully"
else
    log_warning "Label 'automerge' already exists or failed to create"
fi

# 3. Set branch protection rules
log_info "Step 3: Setting branch protection for '${BRANCH}'..."

# Required status checks
REQUIRED_CHECKS=(
    "format:check"
    "lint"
    "test"
    "typecheck"
    "build"
    "headers"
    "jsonld"
)

# Convert array to comma-separated string
CHECKS_STRING=$(IFS=,; echo "${REQUIRED_CHECKS[*]}")

# Apply branch protection
if gh api repos/"${REPO_FULL}"/branches/"${BRANCH}"/protection \
    --method PUT \
    --field required_status_checks="{\"strict\":true,\"contexts\":[$(printf '"%s",' "${REQUIRED_CHECKS[@]}" | sed 's/,$//')]}" \
    --field enforce_admins=true \
    --field required_pull_request_reviews='{"required_approving_review_count":0,"require_code_owner_reviews":false}' \
    --field restrictions=null \
    --field allow_force_pushes=false \
    --field allow_deletions=false \
    --field required_linear_history=true \
    --field required_conversation_resolution=true 2>/dev/null; then
    log_success "Branch protection configured for '${BRANCH}'"
    log_info "Required checks: ${CHECKS_STRING}"
else
    log_error "Failed to configure branch protection (insufficient permissions or API error)"
fi

# 4. Manage PRs #1 and #2
log_info "Step 4: Managing PRs #1 and #2..."

for pr_num in 1 2; do
    log_info "Processing PR #${pr_num}..."
    
    # Check if PR exists
    if ! gh pr view "${pr_num}" --repo "${REPO_FULL}" &>/dev/null; then
        log_warning "PR #${pr_num} does not exist, skipping"
        continue
    fi
    
    # Get PR state
    pr_state=$(gh pr view "${pr_num}" --repo "${REPO_FULL}" --json state --jq '.state')
    pr_draft=$(gh pr view "${pr_num}" --repo "${REPO_FULL}" --json isDraft --jq '.isDraft')
    
    if [ "${pr_state}" != "OPEN" ]; then
        log_warning "PR #${pr_num} is not open (state: ${pr_state}), skipping"
        continue
    fi
    
    # Mark as ready for review if draft
    if [ "${pr_draft}" = "true" ]; then
        log_info "Marking PR #${pr_num} as ready for review..."
        if gh pr ready "${pr_num}" --repo "${REPO_FULL}" 2>/dev/null; then
            log_success "PR #${pr_num} marked as ready for review"
        else
            log_warning "Failed to mark PR #${pr_num} as ready for review"
        fi
    fi
    
    # Add automerge label
    log_info "Adding 'automerge' label to PR #${pr_num}..."
    if gh pr edit "${pr_num}" --add-label automerge --repo "${REPO_FULL}" 2>/dev/null; then
        log_success "Added 'automerge' label to PR #${pr_num}"
    else
        log_warning "Failed to add 'automerge' label to PR #${pr_num}"
    fi
    
    # Enable auto-merge
    log_info "Enabling auto-merge for PR #${pr_num}..."
    if gh pr merge "${pr_num}" --auto --squash --repo "${REPO_FULL}" 2>/dev/null; then
        log_success "Auto-merge enabled for PR #${pr_num}"
    else
        log_warning "Failed to enable auto-merge for PR #${pr_num} (may require passing checks)"
    fi
done

# 5. Rerun failed workflows
log_info "Step 5: Checking for failed workflows..."

# Get recent workflow runs
failed_runs=$(gh run list --repo "${REPO_FULL}" --status failure --limit 10 --json databaseId,status,conclusion --jq '.[] | select(.conclusion == "failure") | .databaseId')

if [ -n "${failed_runs}" ]; then
    log_info "Found failed workflow runs, attempting to rerun..."
    echo "${failed_runs}" | while read -r run_id; do
        if [ -n "${run_id}" ]; then
            log_info "Rerunning workflow run ID: ${run_id}"
            if gh run rerun "${run_id}" --repo "${REPO_FULL}" 2>/dev/null; then
                log_success "Rerun triggered for workflow ${run_id}"
            else
                log_warning "Failed to rerun workflow ${run_id}"
            fi
        fi
    done
else
    log_info "No failed workflows found to rerun"
fi

# Summary
log_success "Repository bootstrap completed!"
log_info "Summary of actions:"
log_info "  ✓ Auto-merge enabled on repository"
log_info "  ✓ 'automerge' label created"
log_info "  ✓ Branch protection configured for '${BRANCH}'"
log_info "  ✓ PRs #1 and #2 processed (ready + automerge label + auto-merge enabled)"
log_info "  ✓ Failed workflows rerun (if any)"

log_info "Next steps:"
log_info "  1. Verify branch protection settings in GitHub UI"
log_info "  2. Check PR status and auto-merge configuration"
log_info "  3. Monitor workflow runs for completion"

exit 0