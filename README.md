<div align="center">

<!-- Banner with gradient background -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=200&section=header&text=The%20Illusion%20of%20Thinking&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Can%20AI%20models%20truly%20%22reason%22%20through%20complex%20problems?&descSize=18&descAlignY=55" width="100%"/>

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge)](https://brandeispatrick.github.io/illusion-of-thinking-paper/)

<p>
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite" alt="Vite"/>
</p>

*An interactive demo exploring the limits of AI reasoning on algorithmic tasks*

</div>

---

## The Key Finding

> **"Thinking" tokens don't help with tasks requiring precise state tracking.**
>
> AI models cannot maintain accurate mental state across hundreds of sequential operations, regardless of how many reasoning tokens they use.

This demo is based on [Apple's research paper](https://machinelearning.apple.com/research/illusion-of-thinking) investigating whether extended thinking actually improves AI performance on computational tasks.

---

## Results at a Glance

| Difficulty | Disks | Optimal Moves | GPT-5 Nano | GPT-5 Mini | GPT-5.1 |
|:----------:|:-----:|:-------------:|:----------:|:----------:|:-------:|
| Easy | 4 | 15 | Thinking OFF | Thinking OFF | Thinking OFF |
| | | | 15 moves | 15 moves | 23 moves |
| | | | Correct | Correct | Incorrect |
| Medium | 7 | 127 | Thinking ON | Thinking ON | Thinking ON |
| | | | 0 moves | 127 moves | 127 moves |
| | | | Failed | Correct | Correct |
| Hard | 10 | 1,023 | Thinking ON | Thinking ON | Thinking ON |
| | | | 0 moves | Timeout | 523 moves |
| | | | Failed | Failed | Failed |

### Key Observations

- **Easy puzzles (4 disks)**: Most models succeed without thinking
- **Medium puzzles (7 disks)**: Only larger models with thinking enabled succeed
- **Hard puzzles (10 disks)**: **ALL models fail** - even with maximum reasoning effort

---

## Features

- Interactive Tower of Hanoi puzzle with drag-and-drop
- Pre-cached responses from **GPT-5 Nano**, **GPT-5 Mini**, and **GPT-5.1**
- Toggle reasoning **ON/OFF** to compare performance
- Real-time stats: token usage, reasoning tokens, inference time
- Adjustable playback speed: 1x, 5x, 10x, 20x
- Retro pixel art design

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/BrandeisPatrick/illusion-of-thinking-paper.git

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works

This demo uses **pre-cached responses** from OpenAI's reasoning models. No API key needed!

All 18 combinations (3 models x 3 difficulties x 2 thinking modes) have been pre-generated with:

| Data Captured | Description |
|---------------|-------------|
| Moves | The actual solution generated |
| Reasoning Tokens | Tokens used for "thinking" |
| Total Tokens | Input + output tokens |
| Time | Inference duration |
| Correctness | Whether solution is valid |

---

## Learn More

| Resource | Description |
|----------|-------------|
| [Apple Research Paper](https://machinelearning.apple.com/research/illusion-of-thinking) | Original research on reasoning model limitations |
| [Paper Walkthrough](https://youtube.com/watch?v=_JguClkQ4Ds) | Video explanation of key findings |
| [Simple Explanation](https://youtube.com/watch?v=H3YvlRBEx1I) | Accessible overview without the math |

---

## Why Tower of Hanoi?

The Tower of Hanoi is an ideal test because:

1. **Deterministic** - There's exactly one optimal solution
2. **Scalable** - Complexity grows exponentially (2^n - 1 moves)
3. **State-dependent** - Each move depends on current disk positions
4. **Verifiable** - Easy to check if solution is correct

This makes it perfect for testing whether AI "reasoning" is genuine problem-solving or pattern matching.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=100&section=footer" width="100%"/>

**[Try the Live Demo](https://brandeispatrick.github.io/illusion-of-thinking-paper/)**

</div>
