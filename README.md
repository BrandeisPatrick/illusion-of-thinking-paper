<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Illusion of Thinking Paper

An interactive Tower of Hanoi game demonstrating the "illusion of thinking" with OpenAI's GPT-5 models. This project explores how reasoning models perform on algorithmic tasks with and without extended reasoning.

## Project Structure

```
illusion-of-thinking-paper/
├── src/
│   ├── components/       # React components
│   ├── services/         # API services (OpenAI)
│   ├── utils/           # Game logic utilities
│   ├── App.tsx          # Main app component
│   ├── index.tsx        # App entry point
│   └── types.ts         # TypeScript type definitions
├── tests/               # Test files
│   └── test-api.ts      # API integration tests
├── index.html          # HTML entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `OPENAI_API_KEY` in `.env.local`:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Run API tests:
   ```bash
   npx tsx tests/test-api.ts
   ```

## Features

- Interactive Tower of Hanoi game with 4, 7, or 10 disks
- Auto-solve using GPT-5 models with configurable reasoning levels
- Toggle between minimal and high reasoning effort
- Adjustable playback speed for AI solutions
- Pixel art retro design
