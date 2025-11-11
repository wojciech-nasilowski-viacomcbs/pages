#!/bin/bash
# Vercel build script - automatyczne cache busting

echo "🚀 Starting eTrener build..."

# Generuj timestamp
BUILD_TIME=$(date +%s)
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📅 Build time: $BUILD_DATE"
echo "🔢 Build timestamp: $BUILD_TIME"

# Zapisz build ID
echo "BUILD_TIMESTAMP=$BUILD_DATE" > .vercel-build-id
echo "BUILD_ID=$BUILD_TIME" >> .vercel-build-id

# Aktualizuj version w index.html
sed -i.bak "s/<!-- Version: .* -->/<!-- Version: $BUILD_TIME -->/" index.html
rm -f index.html.bak

# Dodaj version do głównych plików JS (jako komentarz na końcu)
for file in js/engines/quiz-engine.js js/engines/workout-engine.js js/engines/listening-engine.js; do
  if [ -f "$file" ]; then
    # Usuń poprzedni komentarz z buildem jeśli istnieje
    sed -i.bak '/\/\/ BUILD:/d' "$file"
    # Dodaj nowy komentarz na końcu
    echo "// BUILD: $BUILD_TIME" >> "$file"
    rm -f "$file.bak"
    echo "✅ Updated $file"
  fi
done

echo "✨ Build preparation completed!"
echo "📦 Static files ready for deployment"

