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

## 4. Bezpieczeństwo - Row Level Security (RLS)

RLS to kluczowy element zapewniający prywatność danych. Dla każdej tabeli (`quizzes`, `workouts` etc.) zostaną zdefiniowane polityki, które gwarantują, że:
- Użytkownik może odczytać (`SELECT`) tylko te wiersze, które sam stworzył (gdzie `user_id` zgadza się z jego ID, pobranym przez `auth.uid()`) ORAZ te, które są oznaczone jako `is_sample = true`.
- Użytkownik może tworzyć (`INSERT`), modyfikować (`UPDATE`) i usuwać (`DELETE`) tylko własne wiersze.

To sprawia, że nawet jeśli ktoś uzyska dostęp do klucza API, nie będzie w stanie odczytać ani zmodyfikować danych nienależących do niego.
