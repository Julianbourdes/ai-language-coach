# Contributing to CoachLangAI

Thank you for your interest in contributing to CoachLangAI! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Your environment (OS, Node version, etc.)
- Screenshots if applicable

### Suggesting Enhancements

We welcome feature requests! Please create an issue with:
- A clear description of the feature
- Why you think it would be valuable
- Possible implementation approach (optional)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes**:
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed
3. **Test your changes**:
   - Run `pnpm install` to install dependencies
   - Run `pnpm dev` to test locally
   - Run `pnpm build` to ensure it builds successfully
4. **Commit your changes**:
   - Use clear, descriptive commit messages
   - Follow the conventional commits format when possible:
     - `feat:` for new features
     - `fix:` for bug fixes
     - `docs:` for documentation changes
     - `chore:` for maintenance tasks
     - `refactor:` for code refactoring
5. **Push to your fork** and submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ai-language-coach.git
cd ai-language-coach

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Code Style

- Use TypeScript for all new code
- Follow the existing code structure
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use the existing component patterns

### Adding New Languages

To add support for a new language:

1. Update `lib/types/language-coach.ts` to add the language code
2. Update `LANGUAGES` constant with language metadata
3. Update AI prompts in relevant files to support the new language
4. Add translations for UI elements if needed
5. Test thoroughly with the new language

### Adding New Scenarios

To add new conversation scenarios:

1. Edit `public/scenarios/default-scenarios.json`
2. Follow the existing scenario structure:
```json
{
  "id": "unique-id",
  "title": "Scenario Title",
  "description": "Short description",
  "category": "category-name",
  "difficulty": "beginner|intermediate|advanced",
  "aiRole": "Role description for AI",
  "systemPrompt": "Detailed prompt for AI behavior",
  "suggestedDuration": 15,
  "focusAreas": ["area1", "area2"],
  "icon": "📝",
  "tags": ["tag1", "tag2"]
}
```

## Project Structure

```
ai-language-coach/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (chat)/            # Chat interface routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utility functions and configs
│   ├── ai/               # AI providers and prompts
│   ├── db/               # Database queries and schema
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── scenarios/            # Conversation scenarios
```

## Testing

Before submitting a PR:

- Test your changes locally with `pnpm dev`
- Verify the build works with `pnpm build`
- Test with different languages (EN, FR, ES)
- Test with different scenarios
- Check for TypeScript errors with `pnpm type-check`
- Ensure no console errors in the browser

## Questions?

If you have questions about contributing, feel free to:
- Open an issue with the `question` label
- Check existing issues and discussions

## Attribution

CoachLangAI is built on top of Vercel's AI Chatbot template. We maintain attribution to the original template in our LICENSE file and README.

Thank you for contributing to CoachLangAI! 🎉
