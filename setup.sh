#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Amigos Development Setup${NC}"
echo "================================"
echo ""

# Check Node.js installation
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
echo ""

# Install root dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
cd ..
echo ""

# Check for .env file
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Please edit .env with your configuration${NC}"
    echo -e "${YELLOW}   Required: MONGO_URI, JWT_SECRET${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure your .env file with:"
echo "   - MongoDB connection string (MONGO_URI)"
echo "   - JWT secret key"
echo ""
echo "2. Start development servers:"
echo "   - Terminal 1: npm run backend:dev"
echo "   - Terminal 2: npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo -e "${GREEN}For deployment, see DEPLOYMENT.md${NC}"
