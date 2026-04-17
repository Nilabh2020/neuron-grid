# 🤝 Contributing to NeuronGrid

Welcome to the internal development of **NeuronGrid**. As a private startup project, all development must follow the standards outlined below to ensure stability, security, and scalability.

## 🛠️ Development Standards

### 1. Branching Model
- **`main`**: Production-ready code only.
- **`feat/*`**: Feature development (e.g., `feat/node-agent-stats`).
- **`fix/*`**: Bug fixes.
- **`docs/*`**: Documentation updates.

### 2. Commit Guidelines
We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for clear version history:
- `feat(module): description` (e.g., `feat(orchestrator): add node discovery`)
- `fix(module): description`
- `docs: update README`

### 3. Tech Stack Compliance
- **Backend:** Python 3.9+ (FastAPI). Use Pydantic for schemas.
- **Frontend:** Next.js (TypeScript), Tailwind CSS, shadcn/ui.
- **Inference:** llama.cpp (integrated via Python bindings).

### 4. Code Quality
- All APIs MUST include Pydantic models for request/response.
- Use `logging` instead of `print()` for production traces.
- Add docstrings to all major classes and functions.

## 🚀 Development Workflow

1. Create a branch: `git checkout -b feat/my-new-feature`
2. Implement and test locally.
3. Commit with a meaningful message.
4. Push and open a Pull Request (PR) to `main`.

---

*“Code that is clean is code that lives longer.”*
