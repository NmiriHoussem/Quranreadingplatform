#!/bin/bash

# Update all imports from 'react-router' to 'react-router-dom'

# Files to update (already updated: AdminPanel, AppHeader, Auth, AuthPage)
# Remaining files:

echo "Updating Router imports from 'react-router' to 'react-router-dom'..."

# Use sed to replace in all remaining files
find src/app/components src/app/pages -name "*.tsx" -type f -exec sed -i "s/from 'react-router'/from 'react-router-dom'/g" {} \;

echo "Done! All router imports updated."
echo "Verify with: grep -r \"from 'react-router'\" src/"
