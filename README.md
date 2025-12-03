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

<table>
<tr>
<th>Difficulty</th>
<th>Disks</th>
<th>Optimal</th>
<th>GPT-5 Nano</th>
<th>GPT-5 Mini</th>
<th>GPT-5.1</th>
</tr>
<tr>
<td align="center">🟢 <b>Easy</b></td>
<td align="center">4</td>
<td align="center">15</td>
<td align="center"><img src="https://img.shields.io/badge/15_moves-success-brightgreen"/></td>
<td align="center"><img src="https://img.shields.io/badge/15_moves-success-brightgreen"/></td>
<td align="center"><img src="https://img.shields.io/badge/23_moves-failed-red"/></td>
</tr>
<tr>
<td align="center">🟡 <b>Medium</b></td>
<td align="center">7</td>
<td align="center">127</td>
<td align="center"><img src="https://img.shields.io/badge/0_moves-failed-red"/></td>
<td align="center"><img src="https://img.shields.io/badge/127_moves-success-brightgreen"/></td>
<td align="center"><img src="https://img.shields.io/badge/127_moves-success-brightgreen"/></td>
</tr>
<tr>
<td align="center">🔴 <b>Hard</b></td>
<td align="center">10</td>
<td align="center">1,023</td>
<td align="center"><img src="https://img.shields.io/badge/0_moves-failed-red"/></td>
<td align="center"><img src="https://img.shields.io/badge/timeout-failed-red"/></td>
<td align="center"><img src="https://img.shields.io/badge/523_moves-failed-red"/></td>
</tr>
</table>

<br/>

> 🎯 **The Pattern**: Easy tasks work. Hard tasks fail. **No amount of "thinking" helps.**

### Key Takeaway

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Easy (4 disks)    →  Most models pass without thinking  │
│  📊 Medium (7 disks)  →  Only large models + thinking pass  │
│  📊 Hard (10 disks)   →  ALL models fail, always            │
└─────────────────────────────────────────────────────────────┘
```

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
