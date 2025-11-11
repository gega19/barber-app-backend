#!/bin/bash

echo "=== Backend Migration Script ==="
echo ""

echo "Step 1: Checking for running Node processes..."
if pgrep -x "node" > /dev/null; then
    echo "WARNING: Node.js processes are running!"
    echo "The migration might fail if the server is using the database."
    echo "Please stop the backend server (Ctrl+C in the terminal where it's running) and press Enter to continue..."
    read
else
    echo "No Node.js processes found. Safe to proceed."
fi

echo ""
echo "Step 2: Generating Prisma Client..."
if npx prisma generate; then
    echo "Prisma Client generated successfully!"
else
    echo "Error generating Prisma Client. Please stop the backend server and try again."
    exit 1
fi

echo ""
echo "Step 3: Applying database migrations..."
if npx prisma db push --accept-data-loss; then
    echo "Database migrations applied successfully!"
else
    echo "Error applying migrations. Database might be locked."
    echo "Please ensure the backend server is stopped and try again."
    exit 1
fi

echo ""
echo "=== Migration Process Complete ==="
echo "You can now start the backend server with: npm run dev"

