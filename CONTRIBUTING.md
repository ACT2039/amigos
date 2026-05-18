# Contributing to Amigos

Thank you for your interest in contributing to Amigos! We appreciate your help in making this project better.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR_USERNAME/amigos.git
   cd amigos
   ```
3. **Create a new branch** for your feature
   ```bash
   git checkout -b feature/YourFeatureName
   ```

## Development Setup

1. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Set up your `.env` file**
   ```bash
   cp .env.example .env
   ```
   Configure with your local development settings (MongoDB, API keys, etc.)

3. **Run the development servers**
   - Backend: `npm run backend:dev`
   - Frontend: `npm run dev`

## Making Changes

- Keep commits atomic and focused on a single issue or feature
- Write clear commit messages
- Test your changes locally before submitting
- Ensure your code follows the existing style and patterns

## Pull Request Process

1. **Update your branch** with the latest changes from main
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push your changes** to your fork
   ```bash
   git push origin feature/YourFeatureName
   ```

3. **Create a Pull Request** on GitHub with:
   - Clear title describing your changes
   - Description of what you've changed and why
   - Reference to any related issues (e.g., "Closes #42")
   - Screenshots if UI changes were made

## Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear title
   - Description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, browser, etc.)

## Feature Requests

1. **Check existing issues** for similar requests
2. **Create a new issue** with:
   - Clear title
   - Description of the feature
   - Use cases and benefits
   - Possible implementation approach (optional)

## Code Style Guidelines

- Follow the existing code formatting and style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await instead of callbacks where possible

## Project Structure

```
amigos/
├── src/                 # Frontend React code
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services
│   ├── contexts/       # React contexts
│   └── store/          # State management
├── backend/            # Backend Node.js code
│   ├── routes/         # API routes
│   ├── controllers/    # Route handlers
│   ├── models/         # Database models
│   ├── middleware/     # Express middleware
│   ├── services/       # Business logic
│   └── config/         # Configuration
└── api/               # Vercel serverless functions
```

## Testing

- Write tests for new features when possible
- Ensure existing tests pass before submitting PR
- Test both locally and after deployment

## Documentation

- Update README.md if you add new features
- Add comments to complex code
- Update DEPLOYMENT.md if deployment changes

## Deployment

This project is deployed on Vercel. After your PR is merged:
- Automatic deployments trigger on main branch push
- Check deployment status in GitHub

## Need Help?

- Check existing documentation in DEPLOYMENT.md
- Review similar existing code
- Ask questions in the PR comments
- Open a discussion issue

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Amigos! 🎉
