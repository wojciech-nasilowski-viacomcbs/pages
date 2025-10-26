/**
 * Vercel Serverless Function - zwraca konfigurację z environment variables
 * 
 * W Vercel Dashboard → Settings → Environment Variables dodaj:
 * OPENROUTER_API_KEY = twój-klucz
 * VITE_SUPABASE_URL = twój-supabase-url
 * VITE_SUPABASE_ANON_KEY = twój-supabase-anon-key
 */

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Zwróć tylko niezbędne dane (bez wrażliwych kluczy w response)
  // Klucz OpenRouter będzie używany tylko po stronie serwera
  const config = {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    // OpenRouter API key NIE jest zwracany - będzie używany w osobnym endpoincie
    HAS_OPENROUTER_KEY: !!process.env.OPENROUTER_API_KEY
  };

  res.status(200).json(config);
}

