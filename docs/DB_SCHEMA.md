# Proponowany Schemat Bazy Danych (Supabase)

Ten dokument opisuje strukturę tabel w bazie PostgreSQL na platformie Supabase. Schemat jest zaprojektowany tak, aby odzwierciedlać strukturę danych z `DATA_FORMAT.md` i zapewnić izolację danych między użytkownikami, łącząc dane bezpośrednio z wbudowanym systemem autentykacji Supabase.

---

## 1. Użytkownicy

Korzystamy bezpośrednio z wbudowanej w Supabase tabeli `auth.users`. Każdy zasób w naszej aplikacji (quiz, trening) będzie miał klucz obcy wskazujący na `id` użytkownika w tej tabeli. Nie tworzymy oddzielnej tabeli `profiles`.

---

## 2. Quizy

Struktura quizów jest podzielona na dwie tabele, aby oddzielić metadane quizu od jego pytań.

### Tabela: `quizzes`
Przechowuje główne informacje o quizach stworzonych przez użytkowników.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `uuid` | Klucz główny (auto-generowany). |
| `user_id` | `uuid` | Klucz obcy do `auth.users.id`. Wskazuje właściciela. |
| `title` | `text` | Tytuł quizu. |
| `description`| `text` | Opis quizu. |
| `is_sample` | `boolean`| `true` jeśli jest to quiz demonstracyjny. |
| `created_at`| `timestampz`| Data utworzenia. |

### Tabela: `questions`
Przechowuje poszczególne pytania dla danego quizu. Użycie typu `jsonb` pozwala na elastyczne przechowywanie różnych typów pytań (`multiple-choice`, `fill-in-the-blank`, etc.) bez potrzeby tworzenia skomplikowanej struktury z wieloma pustymi kolumnami.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `uuid` | Klucz główny (auto-generowany). |
| `quiz_id` | `uuid` | Klucz obcy do `quizzes.id`. Określa, do którego quizu należy pytanie. |
| `order` | `integer`| Określa kolejność pytań w quizie. |
| `data` | `jsonb` | Cały obiekt pytania (zgodny ze specyfikacją z `DATA_FORMAT.md`). |

---

## 3. Treningi

Podobnie jak quizy, treningi są podzielone na kilka powiązanych tabel.

### Tabela: `workouts`
Przechowuje główne informacje o treningach.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `uuid` | Klucz główny (auto-generowany). |
| `user_id` | `uuid` | Klucz obcy do `auth.users.id`. Wskazuje właściciela. |
| `title` | `text` | Tytuł treningu. |
| `description`| `text` | Opis treningu, potrzebny sprzęt. |
| `is_sample` | `boolean`| `true` jeśli jest to trening demonstracyjny. |
| `created_at`| `timestampz`| Data utworzenia. |

### Tabela: `phases`
Każdy trening składa się z co najmniej jednej fazy (np. rozgrzewka, część główna).

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `uuid` | Klucz główny (auto-generowany). |
| `workout_id` | `uuid` | Klucz obcy do `workouts.id`. |
| `order` | `integer`| Kolejność faz w treningu. |
| `name` | `text` | Nazwa fazy (np. "Rozgrzewka"). |

### Tabela: `exercises`
Przechowuje poszczególne ćwiczenia w ramach danej fazy.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `uuid` | Klucz główny (auto-generowany). |
| `phase_id` | `uuid` | Klucz obcy do `phases.id`. |
| `order` | `integer`| Kolejność ćwiczeń w fazie. |
| `data` | `jsonb` | Cały obiekt ćwiczenia (`name`, `type`, `duration`, etc.) zgodny z `DATA_FORMAT.md`. |

---

## 4. Zestawy do Nauki Słuchu

Nowa funkcjonalność umożliwiająca naukę języków przez słuchanie par słówek/zdań z syntezatorem mowy (TTS).

### Tabela: `listening_sets`
Przechowuje zestawy językowe z parami słówek/zdań do nauki.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `uuid` | Klucz główny (auto-generowany). |
| `user_id` | `uuid` | Klucz obcy do `auth.users.id`. Wskazuje właściciela. |
| `title` | `text` | Tytuł zestawu (np. "Hiszpański A1: Czasowniki"). |
| `description`| `text` | Opis zestawu. |
| `lang1_code` | `text` | Kod języka pierwszego (np. "pl-PL"). |
| `lang2_code` | `text` | Kod języka drugiego (np. "es-ES"). |
| `content` | `jsonb` | Tablica par językowych. Każdy element to obiekt z kluczami odpowiadającymi kodom języków. |
| `is_sample` | `boolean`| `true` jeśli jest to zestaw demonstracyjny. |
| `created_at`| `timestampz`| Data utworzenia. |

**Przykład struktury `content`:**
```json
[
  {"pl": "--- CZASOWNIK: ESTAR ---", "es": "--- VERBO: ESTAR ---"},
  {"pl": "(Ja) jestem", "es": "(Yo) estoy"},
  {"pl": "Jestem zmęczony.", "es": "Estoy cansado."}
]
```

**Uwagi:**
- Klucze w obiektach (`"pl"`, `"es"`) są dynamiczne i mogą być dowolne (np. `"en"`, `"de"`, `"fr"`)
- Pary rozpoczynające się od `---` i kończące na `---` są traktowane jako nagłówki sekcji
- Nagłówki są anonsowane przez lektora z dłuższą przerwą po nich

---

## 5. Bezpieczeństwo - Row Level Security (RLS)

RLS to kluczowy element zapewniający prywatność danych. Dla każdej tabeli (`quizzes`, `workouts`, `listening_sets` etc.) zostały zdefiniowane polityki, które gwarantują, że:
- Użytkownik może odczytać (`SELECT`) tylko te wiersze, które sam stworzył (gdzie `user_id` zgadza się z jego ID, pobranym przez `auth.uid()`) ORAZ te, które są oznaczone jako `is_sample = true`.
- Użytkownik może tworzyć (`INSERT`), modyfikować (`UPDATE`) i usuwać (`DELETE`) tylko własne wiersze.

To sprawia, że nawet jeśli ktoś uzyska dostęp do klucza API, nie będzie w stanie odczytać ani zmodyfikować danych nienależących do niego.
