# OpenRouter AI Models

## Current Configuration

The application is configured to use **`google/gemini-1.5-pro`** for AI-generated content.

## Available OpenRouter Models (2025)

### Google Gemini Models

#### Recommended for Production

- **`google/gemini-1.5-pro`** ✅ **(Currently Used)**
  - Stable, well-tested model
  - Multimodal support (text, images, video)
  - Large context window (up to 2M tokens)
  - Best for: Complex reasoning, coding, STEM tasks
  - Pricing: Moderate

- **`google/gemini-2.5-flash`**
  - Latest generation Flash model
  - Optimized for speed and cost-efficiency
  - Context window: 1.05M tokens
  - Best for: High-volume tasks, agentic workflows
  - Pricing: Low ($0.30 input / $2.50 output per million tokens)

- **`google/gemini-2.5-pro`**
  - Latest generation Pro model
  - State-of-the-art performance for advanced reasoning
  - Context window: 1.05M tokens
  - Best for: Complex coding, mathematics, scientific tasks
  - Pricing: Higher ($1.25 input / $10 output per million tokens)

#### Other Available Models

- **`google/gemini-2.5-flash-lite`**
  - Ultra-fast, cost-optimized variant
  - Context window: 1.05M tokens
  - Pricing: Very low ($0.10 input / $0.40 output per million tokens)

- **`google/gemini-2.5-flash-image`** (Nano Banana)
  - Multimodal image generation model
  - Supports image creation and editing

### OpenAI Models (Alternative)

- **`openai/gpt-4o-mini`**
  - Fast and cost-effective
  - Good general-purpose model
  - Not currently used (switched to Gemini for consistency)

- **`openai/gpt-4o`**
  - More capable than mini variant
  - Higher cost

## Model Selection Guidelines

### For this application (Quiz & Workout Generator):

1. **Production use**: `google/gemini-1.5-pro` (current)
   - Reliable, stable, good balance of quality and cost
   - Proven track record

2. **Cost optimization**: `google/gemini-2.5-flash`
   - If you need to reduce costs
   - Still maintains good quality

3. **Maximum quality**: `google/gemini-2.5-pro`
   - If quality is more important than cost
   - For complex quiz generation

## How to Change the Model

### Server-side (Production - Vercel)
Edit `api/ai-generate.js`:
```javascript
model: 'google/gemini-1.5-pro',  // Change this line
```

### Client-side (Local Development)
Edit `js/content-manager.js`:
```javascript
model: 'google/gemini-1.5-pro',  // Change this line (around line 894)
```

**Important**: Keep both files in sync to ensure consistent behavior in production and local development.

## References

- [OpenRouter Model Documentation](https://openrouter.ai/docs)
- [OpenRouter Google Models](https://openrouter.ai/google/)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs/models)

## Migration History

- **Previous**: `google/gemini-pro` (legacy, deprecated)
- **Previous**: `openai/gpt-4o-mini` (local dev only, inconsistent with production)
- **Current**: `google/gemini-1.5-pro` (unified, stable)
