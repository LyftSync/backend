#!/bin/bash

echo "Setting up LyftSync development environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env

    # MongoDB URI
    read -p "Enter MongoDB URI (default: mongodb://localhost:27017/lyftsync_dev): " MONGO_URI
    MONGO_URI=${MONGO_URI:-mongodb://localhost:27017/lyftsync_dev}
    echo "MONGO_URI=${MONGO_URI}" >>.env

    # JWT Secret
    JWT_SECRET=$(openssl rand -hex 32)
    echo "JWT_SECRET=${JWT_SECRET}" >>.env
    echo "Generated JWT_SECRET."

    # JWT Expires In
    echo "JWT_EXPIRES_IN=30d" >>.env

    # Port
    PORT=${PORT:-5000}
    echo "PORT=${PORT}" >>.env

    # Node Env
    echo "NODE_ENV=development" >>.env

    echo ".env file created successfully."
else
    echo ".env file already exists. Skipping creation."
fi

# Install npm dependencies
if [ -f package.json ]; then
    read -p "Run 'npm install'? (y/n): " RUN_NPM_INSTALL
    if [[ "$RUN_NPM_INSTALL" == "y" || "$RUN_NPM_INSTALL" == "Y" ]]; then
        echo "Installing npm dependencies..."
        npm install
        if [ $? -eq 0 ]; then
            echo "npm install completed successfully."
        else
            echo "npm install failed. Please check for errors."
        fi
    fi
else
    echo "package.json not found. Skipping 'npm install'."
fi

echo ""
echo "Setup complete."
echo "You can now start your server (e.g., using 'npm start' or 'node server.js')."
echo "After starting the server, you can use the 'api_test_curls.sh' script to test the endpoints."
