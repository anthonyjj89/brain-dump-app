#!/bin/bash

# Function to deploy to a specific environment
deploy_to_env() {
    local env=$1
    local source_branch=$2
    
    echo "Deploying to $env environment..."
    
    # Push to the corresponding Heroku app
    case $env in
        "dev")
            git push dev $source_branch:main
            ;;
        "staging")
            git push staging $source_branch:main
            ;;
        "prod")
            git push prod $source_branch:main
            ;;
        *)
            echo "Invalid environment specified"
            exit 1
            ;;
    esac
}

# Deploy to all environments
deploy_to_env "dev" "dev"
deploy_to_env "staging" "staging"
deploy_to_env "prod" "main"

echo "Deployment complete!"
