# Migracja z formatu v1 do v2

## 🔄 Automatyczna konwersja

Aplikacja automatycznie konwertuje stary format JSON (v1) na nowy (v2) podczas importu.

## 📋 Różnice w formacie

### **Quizy:**

| v1 (stary format) | v2 (nowy format) | Uwagi |
|-------------------|------------------|-------|
| `questionText` | `question` | Zmiana nazwy pola |
| `fill-in-the-blank` | `fill-in-blank` | Bez myślnika |
| `isCorrect` (true-false) | `correctAnswer` | Zmiana nazwy |
| `options: [{text, isCorrect}]` | `options: ["text1", "text2"]` + `correctAnswer: index` | Uproszczenie struktury |
| `type: "listening"` | ❌ Usuwane | Nieobsługiwane w v2 |

### **Pola usuwane podczas konwersji:**
- `audioText`
- `audioLang`
- `audioRate`
- `acceptableAnswers`
- `autoPlay`
- `caseSensitive`

### **Treningi:**
Format treningów jest kompatybilny między v1 i v2.

---

## 📝 Przykład konwersji

### **v1 (stary):**
```json
{
  "type": "multiple-choice",
  "questionText": "Jak po hiszpańsku powiemy 'supermarket'?",
  "options": [
    { "text": "el supermercado", "isCorrect": true },
    { "text": "el gimnasio", "isCorrect": false }
  ]
}
```

### **v2 (nowy):**
```json
{
  "type": "multiple-choice",
  "question": "Jak po hiszpańsku powiemy 'supermarket'?",
  "options": ["el supermercado", "el gimnasio"],
  "correctAnswer": 0
}
```

---

## ⚠️ Uwagi

1. **Pytania typu "listening"** są automatycznie usuwane podczas importu
2. **Konwersja jest jednostronna** - nie można cofnąć z v2 do v1
3. **Stare pliki JSON** nadal działają dzięki automatycznej konwersji

---

## 🚀 Jak importować stare pliki?

Wystarczy użyć funkcji importu - konwersja jest automatyczna! 

1. Kliknij "+ Dodaj"
2. Wybierz plik JSON (stary format)
3. Kliknij "Importuj"
4. ✅ Gotowe!

Aplikacja automatycznie:
- Konwertuje format
- Usuwa nieobsługiwane pytania
- Waliduje dane
- Zapisuje do bazy

