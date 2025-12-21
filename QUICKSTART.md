# Quick Start Guide

Get your Sprint Retrospective tool running in less than 2 minutes!

## Prerequisites

- Docker Desktop installed ([Get Docker](https://docs.docker.com/get-docker/))
- 5 GB free disk space
- Ports 3000 and 3001 available

## Installation

### Option 1: One Command (Easiest)

```bash
./start.sh
```

### Option 2: Manual Docker Compose

```bash
docker-compose up -d
```

## Using the Application

### 1. Create a Session

1. Open http://localhost:3000
2. Select a retrospective template
3. Configure timer and votes
4. Click "Create Session"

### 2. Share with Your Team

- Copy the session URL (e.g., `http://localhost:3000/session/abc123`)
- Share it with team members
- They join by entering their name (no login required)

### 3. Run the Retrospective

The tool guides you through 6 stages:

1. **Setup** - Review settings and instructions
2. **Ice Breaker** - Warm up activity
3. **Reflect** - Write cards (private until next stage)
4. **Group** - Drag cards to cluster similar themes
5. **Vote** - Vote on most important items
6. **Act** - Create action items with owners

### 4. Export Results

Click the "Export" button to download a Markdown summary.

## Common Tasks

### View Logs
```bash
docker-compose logs -f
```

### Stop the Application
```bash
./stop.sh
# or
docker-compose down
```

### Reset Everything (including data)
```bash
docker-compose down -v
```

### Update to Latest Version
```bash
git pull
docker-compose up -d --build
```

## Troubleshooting

### Port Already in Use

Edit `docker-compose.yml` and change the ports:

```yaml
ports:
  - "3002:3001"  # Change 3001 to 3002 for backend
  - "3001:3000"  # Change 3000 to 3001 for frontend
```

### Can't Access from Other Machines

Update `CORS_ORIGIN` in `docker-compose.yml`:

```yaml
environment:
  - CORS_ORIGIN=http://YOUR_IP:3000
```

### Database Issues

Reset the database:
```bash
docker-compose down -v
docker-compose up -d
```

## Tips

- 🎯 **Use templates wisely**: Different templates work for different team dynamics
- ⏱️ **Set timers**: Keep stages focused with countdown timers
- 🤐 **Anonymous reflection**: Cards stay private during Reflect stage
- 🎨 **Group smart**: Similar cards cluster better when dragged carefully
- 🗳️ **Vote democratically**: Limited votes force prioritization
- ✅ **Assign owners**: Action items need clear ownership

## Next Steps

- Read the full [README.md](README.md) for architecture details
- Customize templates in the code
- Deploy to a server for remote teams
- Check the [Roadmap](README.md#roadmap) for upcoming features

---

Need help? [Open an issue](https://github.com/yourrepo/issues)
