# ECDAT — Development & Contribution Guidelines

Thank you for contributing to **ECDAT** (Enterprise Cryptographic Discovery & Analysis Tool)!

---

## 🛠️ 1. Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+ & `npm` / `pnpm`
- Docker & Docker Compose
- Git

### 1. Environment Setup
```bash
git clone https://github.com/LakshAgrawal28/SIH26184_Mavericks.git
cd SIH26184_Mavericks
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 2. Running Test Suites

Run automated unit and integration tests using pytest:
```bash
pytest backend/tests/ -v --cov=app
```

Run test corpus fixtures:
```bash
python -m scanner.detectors.runner --target scanner/corpus/java-rsa-aes
```

---

## 🎨 3. Code Style & Formatting

- **Python**: Enforce `black`, `isort`, and `flake8`.
```bash
black backend/
isort backend/
```
- **TypeScript / React**: Enforce `prettier` and `eslint`.
```bash
cd frontend
npm run lint
```

---

## ➕ 4. Adding New Semgrep Cryptographic Rules

To add a new static analysis detector rule:
1. Navigate to `scanner/rules/semgrep/`.
2. Add your YAML rule file (e.g. `c_crypto.yaml`).
3. Include explicit metadata fields (`primitive`, `algorithm`, `quantum_risk`).
4. Add a test fixture in `scanner/corpus/` and run `pytest`.

---

## 🔀 5. Pull Request Process

1. Create a feature branch: `git checkout -b feature/new-detector-rule`.
2. Commit changes with clean, descriptive messages.
3. Ensure all pytest and lint checks pass locally.
4. Submit a Pull Request targeting `main`.
