/**
 * Agent Memory Module - GlyphGenesis
 * File-based persistent memory for autonomous agent state
 * 
 * Survives restarts and enables learning across sessions
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, '..', '.agent-state');
const STATE_FILE = join(STATE_DIR, 'agent-state.json');

/**
 * Agent Memory - Persists agent state to disk
 */
export class AgentMemory {
  constructor(agentAddress) {
    this.agentAddress = agentAddress.toLowerCase();
    this.stateFile = join(STATE_DIR, `${this.agentAddress.slice(2, 10)}-state.json`);
    this.ensureStateDir();
  }

  ensureStateDir() {
    if (!existsSync(STATE_DIR)) {
      mkdirSync(STATE_DIR, { recursive: true });
    }
  }

  /**
   * Load persisted state
   */
  load() {
    try {
      if (existsSync(this.stateFile)) {
        const data = readFileSync(this.stateFile, 'utf-8');
        const state = JSON.parse(data);
        console.log(`[MEMORY] Loaded state from ${this.stateFile}`);
        return state;
      }
    } catch (e) {
      console.error('[MEMORY] Failed to load state:', e.message);
    }
    // Return default state
    return {
      minted: [],
      liked: [],
      patternsUsed: {},
      themesUsed: {},
      totalMinted: 0,
      totalLiked: 0,
      cycle: 0,
      lastSocialPost: 0,
      totalSpent: 0,
      learnings: [],
      preferences: {}
    };
  }

  /**
   * Save state to disk
   */
  save(state) {
    try {
      state.lastUpdated = new Date().toISOString();
      writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
      console.log(`[MEMORY] State saved to ${this.stateFile}`);
      return true;
    } catch (e) {
      console.error('[MEMORY] Failed to save state:', e.message);
      return false;
    }
  }

  /**
   * Record a mint action
   */
  recordMint(title, pattern, theme, txHash) {
    const state = this.load();
    state.minted.push({
      title,
      pattern,
      theme,
      txHash,
      timestamp: Date.now()
    });
    state.patternsUsed[pattern] = (state.patternsUsed[pattern] || 0) + 1;
    if (theme) state.themesUsed[theme] = (state.themesUsed[theme] || 0) + 1;
    state.totalMinted++;
    this.save(state);
    return true;
  }

  /**
   * Record a like action
   */
  recordLike(artworkId, title) {
    const state = this.load();
    if (!state.liked.includes(artworkId)) {
      state.liked.push(artworkId);
      state.totalLiked++;
      this.save(state);
    }
    return true;
  }

  /**
   * Add a learning
   */
  learn(lesson) {
    const state = this.load();
    state.learnings.push({
      lesson,
      timestamp: Date.now(),
      cycle: state.cycle
    });
    // Keep only last 50 learnings
    if (state.learnings.length > 50) {
      state.learnings = state.learnings.slice(-50);
    }
    this.save(state);
    return true;
  }

  /**
   * Increment cycle counter
   */
  incrementCycle() {
    const state = this.load();
    state.cycle++;
    this.save(state);
    return state.cycle;
  }

  /**
   * Get most used pattern
   */
  getFavoritePattern() {
    const state = this.load();
    const patterns = Object.entries(state.patternsUsed || {});
    if (patterns.length === 0) return null;
    return patterns.sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Get most used theme
   */
  getFavoriteTheme() {
    const state = this.load();
    const themes = Object.entries(state.themesUsed || {});
    if (themes.length === 0) return null;
    return themes.sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Get statistics
   */
  getStats() {
    const state = this.load();
    return {
      totalMinted: state.totalMinted,
      totalLiked: state.totalLiked,
      patternsUsed: state.patternsUsed,
      themesUsed: state.themesUsed,
      cycle: state.cycle,
      totalSpent: state.totalSpent,
      learningsCount: state.learnings.length
    };
  }
}

export default AgentMemory;