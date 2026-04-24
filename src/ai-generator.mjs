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
    // If apiKey is passed but is an empty string, we should still fallback to env vars
    this.apiKey = (apiKey && apiKey.length > 0) ? apiKey : (process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY);
    this.baseUrl = process.env.AI_BASE_URL || 'https://api.featherless.ai/v1';
    this.model = process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3-0324';
    this.enabled = !!(this.apiKey && this.apiKey.length > 0);
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
7. NO code blocks, NO markdown, JUST the ASCII art`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      // Sanitization: Remove potential markdown artifacts and fix dimensions
      const sanitizedContent = content.replace(/```[a-z]*\n?|```/gi, '').trim();
      const lines = sanitizedContent.split('\n').slice(0, height);
      const output = lines.map(line => 
        line.slice(0, width).padEnd(width, ' ')
      ).join('\n');

      return {
        content: output,
        prompt,
        metadata: {
          model: this.model,
          provider: this.baseUrl.includes('featherless') ? 'featherless' : 'openai',
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