/**
 * @fileoverview Serwis generowania treści przez AI (quiz, workout, listening)
 * Obsługuje wywołania API (Vercel Function lub OpenRouter bezpośrednio)
 */

import { validationService } from './validation-service.js';
import { dataService } from '../data-service.js';

export class AIService {
  constructor() {
    /** @type {'quiz'|'workout'|'listening'} */
    this.selectedType = 'quiz';
  }

  /**
   * Generuje treść przez AI i zapisuje do bazy
   * @param {string} userPrompt - Prompt użytkownika
   * @param {'quiz'|'workout'|'listening'} contentType - Typ treści
   * @param {Object} options - Dodatkowe opcje
   * @param {string} [options.lang1Code] - Kod języka 1 (dla listening)
   * @param {string} [options.lang2Code] - Kod języka 2 (dla listening)
   * @param {boolean} [options.isPublic] - Czy treść ma być publiczna
   * @returns {Promise<Object>} - Zapisany obiekt z bazy danych
   */
  async generate(userPrompt, contentType, options = {}) {
    const { lang1Code, lang2Code, isPublic = false } = options;

    // 1. Walidacja inputu
    if (!userPrompt || userPrompt.trim() === '') {
      throw new Error('Opisz co chcesz wygenerować');
    }

    if (contentType === 'listening') {
      if (!lang1Code || !lang2Code) {
        throw new Error('Wybierz oba języki');
      }
      if (lang1Code === lang2Code) {
        throw new Error('Języki muszą być różne');
      }
    }

    // 2. Wywołaj AI API
    const generatedData = await this.callAI(userPrompt, contentType, {
      lang1Code,
      lang2Code
    });

    // 3. Waliduj wygenerowane dane
    const errors = validationService.validate(generatedData, contentType);
    if (errors.length > 0) {
      throw new Error('Wygenerowane dane są nieprawidłowe: ' + errors.join(', '));
    }

    // 4. Zapisz do Supabase
    let savedItem;
    if (contentType === 'quiz') {
      savedItem = await dataService.saveQuiz(generatedData, isPublic);
    } else if (contentType === 'workout') {
      savedItem = await dataService.saveWorkout(generatedData, isPublic);
    } else if (contentType === 'listening') {
      savedItem = await dataService.createListeningSet(
        generatedData.title,
        generatedData.description,
        generatedData.lang1_code,
        generatedData.lang2_code,
        generatedData.content,
        isPublic
      );
    } else {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    return savedItem;
  }

  /**
   * Wywołaj AI API (Vercel Function lub bezpośrednio OpenRouter)
   * @private
   */
  async callAI(userPrompt, contentType, options = {}) {
    const { lang1Code, lang2Code } = options;

    // Pobierz szablon promptu z AI_PROMPTS
    let promptTemplate;
    if (contentType === 'quiz') {
      promptTemplate = window.AI_PROMPTS.quiz;
    } else if (contentType === 'workout') {
      promptTemplate = window.AI_PROMPTS.workout;
    } else if (contentType === 'listening') {
      promptTemplate = window.AI_PROMPTS.listening;
    } else {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    // Zastąp {USER_PROMPT} rzeczywistym promptem użytkownika
    let systemPrompt = promptTemplate.replace('{USER_PROMPT}', userPrompt);

    // Dla Listening: zastąp również kody języków
    if (contentType === 'listening') {
      const lang1Key = lang1Code.split('-')[0].toLowerCase(); // "pl"
      const lang2Key = lang2Code.split('-')[0].toLowerCase(); // "es"

      systemPrompt = systemPrompt
        .replace(/{LANG1_CODE}/g, lang1Code)
        .replace(/{LANG2_CODE}/g, lang2Code)
        .replace(/{LANG1_KEY}/g, lang1Key)
        .replace(/{LANG2_KEY}/g, lang2Key);
    }

    // Sprawdź środowisko (Vercel vs lokalnie)
    const useVercelFunction = this.shouldUseVercelFunction();

    console.log(`🤖 Generowanie ${contentType} przez AI...`);
    console.log(`📍 Hostname: ${window.location.hostname || 'file://'}`);
    console.log(`📍 Protocol: ${window.location.protocol}`);
    console.log(
      `📍 Środowisko: ${useVercelFunction ? 'Produkcja (Vercel Function)' : 'Lokalne (OpenRouter Direct)'}`
    );

    let content;

    if (useVercelFunction) {
      content = await this.callVercelFunction(systemPrompt, userPrompt, contentType);
    } else {
      content = await this.callOpenRouterDirect(systemPrompt);
    }

    // Parsuj JSON z odpowiedzi
    return this.parseAIResponse(content);
  }

  /**
   * Sprawdź czy używać Vercel Function czy OpenRouter bezpośrednio
   * @private
   */
  shouldUseVercelFunction() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Jeśli używamy file:// lub nie mamy hostname, zawsze używaj OpenRouter bezpośrednio
    const isFileProtocol = protocol === 'file:' || hostname === '';

    // Sprawdź czy jesteśmy na Vercel (produkcja)
    const isVercel = hostname.includes('vercel.app') || hostname.includes('vercel.com');

    // Dla innych domen sprawdź czy to nie localhost
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('192.168') ||
      hostname.includes('.local');

    // Używaj Vercel Function tylko jeśli jesteśmy na Vercel
    return isVercel && !isLocalhost && !isFileProtocol;
  }

  /**
   * Wywołaj Vercel Serverless Function
   * @private
   */
  async callVercelFunction(systemPrompt, userPrompt, contentType) {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        contentType
      })
    });

    if (!response.ok) {
      let errorMessage = 'Błąd podczas generowania AI';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Jeśli nie można sparsować jako JSON, użyj tekstu
        const text = await response.text();
        errorMessage = `Błąd ${response.status}: ${text.substring(0, 200)}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.content;

    if (!content) {
      throw new Error('Brak odpowiedzi od serwera. Spróbuj ponownie.');
    }

    return content;
  }

  /**
   * Wywołaj OpenRouter API bezpośrednio (lokalnie)
   * @private
   */
  async callOpenRouterDirect(systemPrompt) {
    const apiKey = window.APP_CONFIG?.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY') {
      throw new Error('Brak klucza OpenRouter API. Skonfiguruj OPENROUTER_API_KEY w config.js');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'eTrener - AI Generator'
      },
      body: JSON.stringify({
        // Available OpenRouter models (2025):
        // - anthropic/claude-sonnet-4.5: Najlepsza jakość, najnowszy model (zalecane)
        // - anthropic/claude-3.5-sonnet: Stabilny, świetny stosunek ceny do jakości
        // - anthropic/claude-3-opus: Najwyższa jakość dla złożonych zadań (droższy)
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      let errorMessage = 'Błąd API OpenRouter';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch (e) {
        // Jeśli nie można sparsować jako JSON, użyj tekstu
        const text = await response.text();
        errorMessage = `Błąd ${response.status}: ${text.substring(0, 200)}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Brak odpowiedzi od AI. Sprawdź klucz API i spróbuj ponownie.');
    }

    return content;
  }

  /**
   * Parsuj odpowiedź AI (usuń markdown, sparsuj JSON)
   * @private
   */
  parseAIResponse(content) {
    let jsonString = content.trim();

    // Sprawdź czy odpowiedź nie jest HTML-em (błąd)
    if (jsonString.startsWith('<!DOCTYPE') || jsonString.startsWith('<html')) {
      throw new Error(
        'AI zwróciło nieprawidłową odpowiedź (HTML). Sprawdź klucz API i spróbuj ponownie.'
      );
    }

    // Usuń markdown
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\n?/g, '');
    }

    // Spróbuj sparsować JSON
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Błąd parsowania JSON:', parseError);
      console.error('Otrzymana odpowiedź:', jsonString.substring(0, 500));
      throw new Error('AI zwróciło nieprawidłowy format JSON. Spróbuj ponownie lub zmień opis.');
    }
  }
}

// Singleton
export const aiService = new AIService();
