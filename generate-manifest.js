#!/usr/bin/env node

/**
 * Skrypt do automatycznego generowania pliku manifest.json
 * na podstawie zawartości folderów /data/quizzes i /data/workouts
 * 
 * Użycie: node generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

// Ścieżki do folderów
const DATA_DIR = path.join(__dirname, 'data');
const QUIZZES_DIR = path.join(DATA_DIR, 'quizzes');
const WORKOUTS_DIR = path.join(DATA_DIR, 'workouts');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');

/**
 * Pobiera listę plików JSON z danego folderu
 */
function getJsonFiles(dir) {
  try {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️  Folder ${dir} nie istnieje. Tworzę...`);
      fs.mkdirSync(dir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(dir);
    return files
      .filter(file => file.endsWith('.json'))
      .sort(); // Sortowanie alfabetyczne
  } catch (error) {
    console.error(`❌ Błąd podczas odczytu folderu ${dir}:`, error.message);
    return [];
  }
}

/**
 * Generuje manifest
 */
function generateManifest() {
  console.log('🔍 Szukam plików JSON...\n');

  const quizzes = getJsonFiles(QUIZZES_DIR);
  const workouts = getJsonFiles(WORKOUTS_DIR);

  console.log(`📝 Znaleziono quizów: ${quizzes.length}`);
  quizzes.forEach(file => console.log(`   - ${file}`));
  
  console.log(`\n💪 Znaleziono treningów: ${workouts.length}`);
  workouts.forEach(file => console.log(`   - ${file}`));

  const manifest = {
    quizzes,
    workouts,
    generatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(
      MANIFEST_PATH,
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
    console.log(`\n✅ Manifest wygenerowany pomyślnie: ${MANIFEST_PATH}`);
  } catch (error) {
    console.error(`\n❌ Błąd podczas zapisu manifestu:`, error.message);
    process.exit(1);
  }
}

// Uruchom
generateManifest();

