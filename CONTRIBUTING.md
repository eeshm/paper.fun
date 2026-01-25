# Contributing to Solana Paper Trading Platform

Thank you for your interest in contributing! This project is a production-grade paper trading platform designed for learning and testing.

## Getting Started

1.  **Fork the repository**
2.  **Clone your fork**: `git clone https://github.com/your-username/trade.git`
3.  **Install dependencies**: `bun install`
4.  **Set up environment**: Copy `.env.example` to `.env` and configure.
5.  **Start infrastructure**: `docker-compose up -d`

## Development Workflow

-   **Branching**: Create a feature branch for your changes (`git checkout -b feature/amazing-feature`).
-   **Code Style**: We use Prettier and ESLint. Run `bun run lint` and `bun run format` before committing.
-   **Testing**:
    -   Run backend E2E tests: `bun run test`
    -   Run frontend tests: `bun run test:web`
    -   Ensure all tests pass: `bun run test:all`

## Pull Requests

1.  Push your branch to your fork.
2.  Open a Pull Request against the `main` branch.
3.  Describe your changes clearly.
4.  Ensure CI passes (tests and build).

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
