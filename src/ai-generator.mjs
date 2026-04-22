/**
 * GlyphGenesis AI Integration
 * Uses OpenAI API for creative ASCII art generation
 * 
 * Set OPENAI_API_KEY in .env to enable
 * Fallback to pattern-based generation if no API key
 */

import { generate as patternGenerate } from './ascii-generator.mjs';

// OpenAI integration for creative generation
export class AIGenerator {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = 'gpt-4o-mini'; // Fast and cost-effective
    this.enabled = !!this.apiKey;
  }

  /**
   * Generate ASCII art using AI
   * @param {string} prompt - Natural language description
   * @param {object} options - Generation options
   * @returns {Promise<{content: string, prompt: string, metadata: object}>}
   */
  async generate(prompt, options = {}) {
    const { width = 40, height = 20, theme = 'simple' } = options;

    if (!this.enabled) {
      // Fallback to pattern generation
      console.log('[AI] No API key, using pattern fallback');
      return this.fallbackGenerate(prompt, options);
    }

    const systemPrompt = `You are an ASCII art generator. Create visually stunning ASCII art based on the user's description.

Rules:
1. Output ONLY the ASCII art, nothing else
2. Use exactly ${width} characters wide and ${height} lines tall
3. Be creative and detailed - use density characters: @#%?*+;:,.*
4. Match the requested theme: ${theme}
5. Make it visually interesting with good contrast
6. Center the subject
7. NO code blocks, NO markdown, JUST the ASCII art

Themes to reference:
- simple: clean lines, minimal chars
- cyberpunk: neon boxes, tech symbols, grid lines
- retro: 80s aesthetic, stars, circles
- cosmic: stars, spirals, celestial
- ocean: waves, bubbles, sea life
- forest: trees, leaves, nature`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      // Validate and sanitize the output
      const lines = content.split('\n').slice(0, height);
      const sanitized = lines.map(line => 
        line.slice(0, width).padEnd(width, ' ')
      ).join('\n');

      console.log('[AI] Generated:', prompt.substring(0, 30));

      return {
        content: sanitized,
        prompt,
        metadata: {
          model: this.model,
          tokens: data.usage,
          theme,
          generated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[AI] Error:', error.message);
      return this.fallbackGenerate(prompt, options);
    }
  }

  /**
   * Fallback to pattern-based generation
   */
  fallbackGenerate(prompt, options) {
    const { width = 40, height = 20, theme = 'simple' } = options;
    
    // Parse prompt for pattern hint
    let pattern = 'circles';
    const lower = prompt.toLowerCase();
    if (lower.includes('wave')) pattern = 'waves';
    else if (lower.includes('diamond')) pattern = 'diamond';
    else if (lower.includes('grid')) pattern = 'grid';
    else if (lower.includes('random') || lower.includes('noise')) pattern = 'noise';
    else if (lower.includes('spiral')) pattern = 'spiral';
    else if (lower.includes('heart')) pattern = 'heart';

    const content = patternGenerate(pattern, { width, height, theme });
    
    return {
      content,
      prompt,
      metadata: {
        pattern,
        theme,
        fallback: true,
        generated: new Date().toISOString()
      }
    };
  }

  /**
   * Check if AI is available
   */
  isEnabled() {
    return this.enabled;
  }
}

/**
 * Generate with retry logic
 */
export async function generateWithAI(prompt, options = {}, maxRetries = 2) {
  const generator = new AIGenerator();
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await generator.generate(prompt, options);
      if (!result.metadata.fallback || attempt === maxRetries) {
        return result;
      }
    } catch (error) {
      console.error(`[AI] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

export default { AIGenerator, generateWithAI };