#!/bin/bash

echo "🛑 Stopping Sprint Retrospective Tool..."
docker-compose down

echo ""
echo "✅ All containers stopped"
echo "💾 Database data is preserved in Docker volume"
echo ""
echo "To start again: ./start.sh"
echo "To remove all data: docker-compose down -v"
echo ""
