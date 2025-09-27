# MindCare AI Backend

Backend server for the MindCare AI Mental Health Assistant application.

## Features

- Express.js server with security middleware
- CORS configuration for frontend integration
- Rate limiting to prevent abuse
- Health check endpoints
- Environment-based configuration
- Hugging Face API integration ready

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
   - Set your `HUGGINGFACE_API_KEY` (get one from https://huggingface.co/settings/tokens)
   - Adjust other settings as needed

### Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Testing

Run tests:
```bash
npm test
```

## API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /api/status` - API service status
- `GET /` - Root endpoint with basic info

## Configuration

The server uses environment variables for configuration. See `.env.example` for all available options.

### Key Configuration Options

- `PORT` - Server port (default: 3000)
- `HUGGINGFACE_API_KEY` - Your Hugging Face API key
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window

## Security Features

- Helmet.js for security headers
- CORS protection with configurable origins
- Rate limiting to prevent abuse
- Request size limits
- Input validation and sanitization

## Development

The server is structured for easy extension with additional AI services and endpoints.

### Project Structure
```
├── server.js           # Main server file
├── config/
│   └── config.js      # Configuration management
├── package.json       # Dependencies and scripts
├── .env.example       # Environment template
└── README.md         # This file
```