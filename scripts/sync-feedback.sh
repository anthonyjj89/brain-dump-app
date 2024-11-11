#!/bin/bash

# Script to sync feedback tracker with production database
# This can be run locally or as a GitHub Action

# Required environment variables:
# - MONGODB_URI: Production database connection string
# - GITHUB_TOKEN: For pushing changes back to repository
# - BRANCH_NAME: Branch to sync with (e.g. experimental)

# Fetch latest changes
git pull origin $BRANCH_NAME

# Trigger sync endpoint to regenerate FEEDBACK_TRACKER.md
curl -X GET "${NEXT_PUBLIC_APP_URL}/api/sync/bugs?type=bug"
curl -X GET "${NEXT_PUBLIC_APP_URL}/api/sync/bugs?type=feature"

# Check if there are changes
if [[ -n $(git status -s) ]]; then
    # Add and commit changes
    git add docs/FEEDBACK_TRACKER.md
    git commit -m "chore: sync feedback tracker with production database"
    
    # Push changes back to repository
    git push origin $BRANCH_NAME
fi
