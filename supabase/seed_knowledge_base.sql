-- ============================================
-- SEED DATA: Knowledge Base Articles
-- ============================================
-- Przykładowe artykuły dla Bazy Wiedzy
-- Uruchom po migracji: psql -f seed_knowledge_base.sql

-- Uwaga: Przed uruchomieniem tego skryptu:
-- 1. Uruchom migration_knowledge_base.sql
-- 2. Upewnij się, że bucket 'knowledge-base-images' istnieje
-- 3. Zamień {SUPABASE_URL} na prawdziwy URL projektu

-- 🌱 Seeding Knowledge Base articles...

-- ============================================
-- ARTYKUŁ 1: Jak zacząć trening siłowy?
-- ============================================

INSERT INTO knowledge_base_articles (
    title,
    slug,
    content,
    description,
    category,
    icon,
    tags,
    is_published,
    featured,
    author_id
) VALUES (
    'Jak zacząć trening siłowy? Kompletny przewodnik dla początkujących',
    'jak-zaczac-trening-silowy',
    '<h2>Wprowadzenie do treningu siłowego</h2>
<p>Trening siłowy to jeden z najskuteczniejszych sposobów na poprawę kondycji fizycznej, zwiększenie masy mięśniowej i spalanie tkanki tłuszczowej. Jeśli dopiero zaczynasz swoją przygodę z siłownią, ten przewodnik pomoże Ci zrobić pierwsze kroki w bezpieczny i efektywny sposób.</p>

<p><img src="https://gygijehqwtnmnoopwqyg.supabase.co/storage/v1/object/public/knowledge-base-images/images.jpeg" alt="Trening na siłowni"></p>

<h2>Dlaczego warto trenować siłowo?</h2>
<ul>
<li><strong>Zwiększenie masy mięśniowej</strong> - Budowanie silnych mięśni poprawia sylwetkę i metabolizm</li>
<li><strong>Spalanie tkanki tłuszczowej</strong> - Mięśnie spalają kalorie nawet w spoczynku</li>
<li><strong>Poprawa gęstości kości</strong> - Zapobiega osteoporozie</li>
<li><strong>Lepsze samopoczucie</strong> - Trening uwalnia endorfiny</li>
<li><strong>Większa siła funkcjonalna</strong> - Ułatwia codzienne czynności</li>
</ul>

<h2>Od czego zacząć?</h2>

<h3>1. Konsultacja lekarska</h3>
<p>Przed rozpoczęciem intensywnego treningu warto wykonać podstawowe badania i skonsultować się z lekarzem, szczególnie jeśli:</p>
<ul>
<li>Masz powyżej 40 lat</li>
<li>Masz problemy z sercem lub ciśnieniem</li>
<li>Masz kontuzje lub problemy ze stawami</li>
</ul>

<h3>2. Wybór siłowni lub treningu domowego</h3>
<p>Możesz trenować na siłowni z profesjonalnym sprzętem lub w domu z podstawowym wyposażeniem. Dla początkujących zalecamy siłownię, gdzie możesz skorzystać z pomocy trenera.</p>

<h3>3. Plan treningowy dla początkujących</h3>
<p>Zacznij od 3 treningów tygodniowo, angażujących całe ciało (Full Body Workout). Przykładowy plan:</p>

<p><strong>Poniedziałek - Całe ciało:</strong></p>
<ol>
<li>Przysiady - 3 serie x 10 powtórzeń</li>
<li>Wyciskanie sztangi na ławce płaskiej - 3x10</li>
<li>Wiosłowanie sztangą - 3x10</li>
<li>Martwy ciąg - 3x8</li>
<li>Pompki - 3x15</li>
</ol>

<p><img src="https://gygijehqwtnmnoopwqyg.supabase.co/storage/v1/object/public/knowledge-base-images/fit-young-woman-exercising-at-gym-400-55901601.jpg" alt="Trening siłowy"></p>

<h2>Technika ważniejsza niż ciężar</h2>
<p><strong>Najważniejsza zasada:</strong> Zawsze stawiaj technikę wykonania ćwiczenia ponad ciężar. Lepiej wykonać ćwiczenie z mniejszym obciążeniem, ale poprawnie, niż ryzykować kontuzję przy zbyt dużym ciężarze.</p>

<blockquote>
<p>"Nie ma skrótów do miejsca, które warto odwiedzić." - Beverly Sills</p>
</blockquote>

<h2>Trening bokserski jako uzupełnienie</h2>
<p>Oprócz klasycznego treningu siłowego, warto włączyć do swojego planu treningowego elementy boksu. Trening bokserski świetnie rozwija:</p>
<ul>
<li>Koordynację ruchową</li>
<li>Wytrzymałość tlenową</li>
<li>Szybkość i refleks</li>
<li>Siłę eksplozywną</li>
</ul>

<p>Zobacz przykładowy trening bokserski dla początkujących:</p>

<p><iframe class="ql-video" frameborder="0" allowfullscreen="true" src="https://player.vimeo.com/video/320517311"></iframe></p>

<p>Trening bokserski można wykonywać 2-3 razy w tygodniu jako uzupełnienie treningu siłowego. Pamiętaj o odpowiednim rozgrzaniu przed treningiem!</p>

<h2>Dieta - 70% sukcesu</h2>
<p>Bez odpowiedniej diety nawet najlepszy trening nie przyniesie oczekiwanych rezultatów. Podstawowe zasady:</p>

<ul>
<li><strong>Białko:</strong> 1.6-2.2g na kg masy ciała dziennie</li>
<li><strong>Węglowodany:</strong> Główne źródło energii, szczególnie przed i po treningu</li>
<li><strong>Tłuszcze:</strong> Niezbędne do produkcji hormonów, ok. 1g/kg masy ciała</li>
<li><strong>Woda:</strong> Minimum 2-3 litry dziennie</li>
</ul>

<h2>Regeneracja</h2>
<p>Mięśnie rosną podczas odpoczynku, nie podczas treningu! Zadbaj o:</p>
<ul>
<li>7-9 godzin snu każdej nocy</li>
<li>Dni wolne od treningu (minimum 1-2 w tygodniu)</li>
<li>Stretching i rolowanie mięśni</li>
<li>Odpowiednie nawodnienie</li>
</ul>

<h2>Najczęstsze błędy początkujących</h2>
<ol>
<li><strong>Zbyt duże obciążenia</strong> - Prowadzi do kontuzji i złej techniki</li>
<li><strong>Brak rozgrzewki</strong> - Zwiększa ryzyko urazu</li>
<li><strong>Trening tych samych partii każdego dnia</strong> - Mięśnie potrzebują czasu na regenerację</li>
<li><strong>Ignorowanie nóg</strong> - Nogi to największa grupa mięśniowa!</li>
<li><strong>Brak progresji</strong> - Musisz stopniowo zwiększać obciążenia</li>
</ol>

<h2>Podsumowanie</h2>
<p>Trening siłowy to inwestycja w swoje zdrowie na długie lata. Pamiętaj o:</p>
<ul>
<li>✅ Poprawnej technice</li>
<li>✅ Regularności (3-4 treningi w tygodniu)</li>
<li>✅ Odpowiedniej diecie</li>
<li>✅ Regeneracji</li>
<li>✅ Cierpliwości - efekty przyjdą z czasem!</li>
</ul>

<p><strong>Powodzenia w Twojej przygodzie z treningiem siłowym! 💪</strong></p>',
    'Kompletny przewodnik dla osób rozpoczynających przygodę z treningiem siłowym. Dowiedz się, jak bezpiecznie i efektywnie zacząć budować masę mięśniową.',
    'Fitness',
    '💪',
    ARRAY['trening', 'siła', 'początkujący', 'siłownia', 'masa mięśniowa', 'boks'],
    true,
    true,
    (SELECT id FROM auth.users WHERE is_super_admin = TRUE LIMIT 1)
);

-- ============================================
-- ARTYKUŁ 2: Nauka hiszpańskiego - od czego zacząć?
-- ============================================

INSERT INTO knowledge_base_articles (
    title,
    slug,
    content,
    description,
    category,
    icon,
    tags,
    is_published,
    featured,
    author_id
) VALUES (
    'Nauka hiszpańskiego - od czego zacząć?',
    'nauka-hiszpanskiego-od-czego-zaczac',
    '<h2>Dlaczego warto uczyć się hiszpańskiego?</h2>
<p>Hiszpański to drugi najczęściej używany język na świecie (po chińskim mandaryńskim) i język ojczysty dla ponad 460 milionów ludzi. Znajomość hiszpańskiego otwiera drzwi do:</p>

<ul>
<li>🌍 <strong>21 krajów</strong> gdzie jest językiem urzędowym</li>
<li>💼 <strong>Lepszych możliwości zawodowych</strong> w biznesie międzynarodowym</li>
<li>✈️ <strong>Podróży</strong> po Hiszpanii i Ameryce Łacińskiej</li>
<li>🎬 <strong>Kultury</strong> - filmy, muzyka, literatura</li>
</ul>

<h2>Podstawy języka hiszpańskiego</h2>

<h3>Alfabet i wymowa</h3>
<p>Hiszpański alfabet ma 27 liter (26 jak angielski + ñ). Dobra wiadomość: <strong>wymowa jest bardzo regularna</strong> - czytasz tak, jak piszesz!</p>

<p>Przykłady:</p>
<ul>
<li><strong>A</strong> - jak polskie "a" (casa = dom)</li>
<li><strong>E</strong> - jak polskie "e" (mesa = stół)</li>
<li><strong>I</strong> - jak polskie "i" (sí = tak)</li>
<li><strong>O</strong> - jak polskie "o" (ojo = oko)</li>
<li><strong>U</strong> - jak polskie "u" (uno = jeden)</li>
</ul>

<h3>Podstawowe zwroty</h3>
<p>Zacznij od tych najpopularniejszych wyrażeń:</p>

<ol>
<li><strong>Hola</strong> - Cześć</li>
<li><strong>Buenos días</strong> - Dzień dobry</li>
<li><strong>Buenas tardes</strong> - Dobry wieczór</li>
<li><strong>Buenas noches</strong> - Dobranoc</li>
<li><strong>¿Cómo estás?</strong> - Jak się masz?</li>
<li><strong>Bien, gracias</strong> - Dobrze, dziękuję</li>
<li><strong>Por favor</strong> - Proszę</li>
<li><strong>Gracias</strong> - Dziękuję</li>
<li><strong>De nada</strong> - Nie ma za co</li>
<li><strong>Adiós</strong> - Do widzenia</li>
</ol>

<h2>Plan nauki dla początkujących</h2>

<h3>Tydzień 1-2: Podstawy</h3>
<ul>
<li>Alfabet i wymowa</li>
<li>Liczby 1-100</li>
<li>Podstawowe zwroty grzecznościowe</li>
<li>Czasownik SER (być) i ESTAR (być/znajdować się)</li>
</ul>

<h3>Tydzień 3-4: Rozszerzenie</h3>
<ul>
<li>Zaimki osobowe (yo, tú, él, ella...)</li>
<li>Czasowniki regularne (-ar, -er, -ir)</li>
<li>Dni tygodnia i miesiące</li>
<li>Kolory i podstawowe przymiotniki</li>
</ul>

<h3>Miesiąc 2-3: Konwersacja</h3>
<ul>
<li>Czas teraźniejszy (presente)</li>
<li>Pytania i odpowiedzi</li>
<li>Rodzina i relacje</li>
<li>Jedzenie i restauracja</li>
<li>Zakupy i liczby</li>
</ul>

<h2>Najlepsze metody nauki</h2>

<h3>1. Aplikacje mobilne</h3>
<ul>
<li><strong>Duolingo</strong> - Darmowa, gamifikowana nauka</li>
<li><strong>Babbel</strong> - Płatna, bardziej zaawansowana</li>
<li><strong>Anki</strong> - Fiszki z powtórkami</li>
</ul>

<h3>2. Immersja językowa</h3>
<ul>
<li>Oglądaj hiszpańskie seriale z napisami (Netflix: "La Casa de Papel", "Elite")</li>
<li>Słuchaj hiszpańskiej muzyki</li>
<li>Czytaj proste teksty po hiszpańsku</li>
</ul>

<h3>3. Konwersacje</h3>
<ul>
<li>Znajdź partnera językowego (tandem)</li>
<li>Dołącz do grup na Facebooku</li>
<li>Korzystaj z aplikacji do rozmów (HelloTalk, Tandem)</li>
</ul>

<h2>Gramatyka - najważniejsze tematy</h2>

<h3>Czasowniki SER vs ESTAR</h3>
<p>Oba znaczą "być", ale używa się ich w różnych kontekstach:</p>

<p><strong>SER</strong> - cechy stałe, tożsamość:</p>
<ul>
<li>Yo <strong>soy</strong> estudiante - Jestem studentem</li>
<li>Ella <strong>es</strong> alta - Ona jest wysoka</li>
</ul>

<p><strong>ESTAR</strong> - stany tymczasowe, lokalizacja:</p>
<ul>
<li>Yo <strong>estoy</strong> cansado - Jestem zmęczony</li>
<li>El libro <strong>está</strong> en la mesa - Książka jest na stole</li>
</ul>

<h3>Rodzajniki</h3>
<p>W hiszpańskim każdy rzeczownik ma rodzaj (męski/żeński):</p>
<ul>
<li><strong>El</strong> libro (m) - książka</li>
<li><strong>La</strong> mesa (f) - stół</li>
<li><strong>Los</strong> libros (m, l.mn.) - książki</li>
<li><strong>Las</strong> mesas (f, l.mn.) - stoły</li>
</ul>

<h2>Wskazówki dla efektywnej nauki</h2>

<blockquote>
<p>"Język to droga do kultury narodu" - Rita Mae Brown</p>
</blockquote>

<ol>
<li><strong>Regularność</strong> - Lepiej 15 minut dziennie niż 2 godziny raz w tygodniu</li>
<li><strong>Nie bój się błędów</strong> - To naturalna część nauki!</li>
<li><strong>Używaj języka</strong> - Mów od pierwszego dnia, nawet jeśli to proste zdania</li>
<li><strong>Powtarzaj</strong> - Wykorzystuj system powtórek (Anki)</li>
<li><strong>Baw się</strong> - Nauka powinna być przyjemnością!</li>
</ol>

<h2>Zasoby online</h2>
<ul>
<li>📱 <strong>SpanishDict.com</strong> - Najlepszy słownik online</li>
<li>🎥 <strong>YouTube</strong> - Kanały: "Butterfly Spanish", "SpanishPod101"</li>
<li>📚 <strong>BBC Languages</strong> - Darmowe kursy</li>
<li>🎧 <strong>Podcast</strong> - "Coffee Break Spanish", "Notes in Spanish"</li>
</ul>

<h2>Podsumowanie</h2>
<p>Nauka hiszpańskiego to fascynująca podróż! Pamiętaj o:</p>
<ul>
<li>✅ Regularności (codziennie 15-30 minut)</li>
<li>✅ Immersji (filmy, muzyka, książki)</li>
<li>✅ Praktyce konwersacyjnej</li>
<li>✅ Cierpliwości - język to maraton, nie sprint!</li>
</ul>

<p><strong>¡Buena suerte! (Powodzenia!) 🇪🇸</strong></p>',
    'Praktyczny przewodnik dla osób rozpoczynających naukę języka hiszpańskiego. Poznaj podstawy, najlepsze metody i zasoby do nauki.',
    'Języki',
    '🇪🇸',
    ARRAY['hiszpański', 'nauka języków', 'początkujący', 'gramatyka', 'konwersacje'],
    true,
    true,
    (SELECT id FROM auth.users WHERE is_super_admin = TRUE LIMIT 1)
);

-- ============================================
-- ARTYKUŁ 3: Jak skutecznie się uczyć? Techniki zapamiętywania
-- ============================================

INSERT INTO knowledge_base_articles (
    title,
    slug,
    content,
    description,
    category,
    icon,
    tags,
    is_published,
    featured,
    author_id
) VALUES (
    'Jak skutecznie się uczyć? Techniki zapamiętywania',
    'jak-skutecznie-sie-uczyc',
    '<h2>Wprowadzenie</h2>
<p>Czy zastanawiałeś się kiedyś, dlaczego niektórzy ludzie uczą się szybciej i zapamiętują więcej? Sekret tkwi w wykorzystaniu sprawdzonych technik nauki opartych na badaniach naukowych.</p>

<h2>Jak działa nasza pamięć?</h2>
<p>Aby skutecznie się uczyć, warto zrozumieć podstawy działania pamięci:</p>

<ul>
<li><strong>Pamięć krótkotrwała</strong> - Przechowuje informacje przez kilka sekund do minut</li>
<li><strong>Pamięć robocza</strong> - Aktywnie przetwarza informacje (7±2 elementy naraz)</li>
<li><strong>Pamięć długotrwała</strong> - Przechowuje informacje przez lata</li>
</ul>

<p>Naszym celem jest <strong>przeniesienie informacji z pamięci krótkotrwałej do długotrwałej</strong>.</p>

<h2>Najskuteczniejsze techniki nauki</h2>

<h3>1. Aktywne przypominanie (Active Recall)</h3>
<p>Zamiast wielokrotnie czytać materiał, <strong>testuj swoją wiedzę</strong>:</p>

<ul>
<li>Zamknij notatki i spróbuj odtworzyć to, czego się nauczyłeś</li>
<li>Używaj fiszek (Anki, Quizlet)</li>
<li>Rozwiązuj quizy i testy</li>
<li>Naucz kogoś tego, co właśnie się nauczyłeś</li>
</ul>

<p><strong>Dlaczego to działa?</strong> Aktywne przypominanie zmusza mózg do wysiłku, co wzmacnia połączenia neuronowe.</p>

<h3>2. Powtórki rozmieszczone w czasie (Spaced Repetition)</h3>
<p>Nie ucz się wszystkiego na raz! Rozłóż naukę w czasie:</p>

<ul>
<li><strong>Dzień 1:</strong> Naucz się materiału</li>
<li><strong>Dzień 2:</strong> Pierwsza powtórka</li>
<li><strong>Dzień 4:</strong> Druga powtórka</li>
<li><strong>Dzień 7:</strong> Trzecia powtórka</li>
<li><strong>Dzień 14:</strong> Czwarta powtórka</li>
<li><strong>Dzień 30:</strong> Piąta powtórka</li>
</ul>

<p><strong>Aplikacje wykorzystujące tę technikę:</strong> Anki, SuperMemo, RemNote</p>

<h3>3. Technika Feynmana</h3>
<p>Nazwana od laureata Nagrody Nobla, Richarda Feynmana:</p>

<ol>
<li><strong>Wybierz temat</strong> do nauki</li>
<li><strong>Wyjaśnij go prostym językiem</strong> (jak dziecku)</li>
<li><strong>Zidentyfikuj luki</strong> w swojej wiedzy</li>
<li><strong>Wróć do materiału</strong> i uzupełnij braki</li>
<li><strong>Uprość i użyj analogii</strong></li>
</ol>

<blockquote>
<p>"Jeśli nie potrafisz wyjaśnić czegoś w prosty sposób, nie rozumiesz tego wystarczająco dobrze" - Richard Feynman</p>
</blockquote>

<h3>4. Technika Pomodoro</h3>
<p>Zarządzaj czasem nauki efektywnie:</p>

<ol>
<li>⏰ <strong>25 minut</strong> intensywnej nauki (1 Pomodoro)</li>
<li>☕ <strong>5 minut</strong> przerwy</li>
<li>🔄 Powtórz 4 razy</li>
<li>🎉 <strong>15-30 minut</strong> dłuższa przerwa</li>
</ol>

<p><strong>Dlaczego to działa?</strong> Krótkie sesje utrzymują koncentrację, a przerwy pozwalają mózgowi odpocząć.</p>

<h3>5. Pałac pamięci (Method of Loci)</h3>
<p>Starożytna technika wykorzystująca pamięć przestrzenną:</p>

<ol>
<li>Wybierz dobrze znaną trasę (np. Twój dom)</li>
<li>Umieść informacje do zapamiętania w konkretnych miejscach</li>
<li>Wizualizuj trasę, "odwiedzając" każde miejsce</li>
</ol>

<p><strong>Przykład:</strong> Zapamiętywanie listy zakupów - wyobraź sobie mleko w przedpokoju, chleb na kanapie, jajka na stole, etc.</p>

<h3>6. Mind Mapping (Mapy myśli)</h3>
<p>Wizualizuj powiązania między informacjami:</p>

<ul>
<li>📍 Centralne pojęcie w środku</li>
<li>🌿 Główne gałęzie - kluczowe tematy</li>
<li>🍃 Mniejsze gałęzie - szczegóły</li>
<li>🎨 Używaj kolorów i obrazków</li>
</ul>

<p><strong>Narzędzia:</strong> MindMeister, XMind, Coggle, lub zwykły papier!</p>

<h2>Optymalizacja środowiska nauki</h2>

<h3>Fizyczne warunki</h3>
<ul>
<li>💡 <strong>Dobre oświetlenie</strong> - Najlepiej naturalne światło</li>
<li>🪑 <strong>Wygodne krzesło</strong> - Ale nie za wygodne (nie chcesz zasnąć!)</li>
<li>🌡️ <strong>Temperatura</strong> - 20-22°C to ideał</li>
<li>🔇 <strong>Cisza lub biały szum</strong> - Zależy od preferencji</li>
<li>📱 <strong>Brak rozpraszaczy</strong> - Telefon w trybie samolotowym!</li>
</ul>

<h3>Stan umysłu</h3>
<ul>
<li>😴 <strong>Wyspany mózg</strong> - 7-9 godzin snu</li>
<li>💧 <strong>Nawodniony</strong> - Pij wodę regularnie</li>
<li>🍎 <strong>Odpowiednio odżywiony</strong> - Lekki posiłek przed nauką</li>
<li>🧘 <strong>Zrelaksowany</strong> - 5 minut medytacji przed nauką</li>
</ul>

<h2>Najczęstsze błędy w nauce</h2>

<h3>❌ Wielokrotne czytanie</h3>
<p>Czytanie tego samego tekstu 10 razy daje <strong>iluzję wiedzy</strong>. Zamiast tego - testuj się!</p>

<h3>❌ Podkreślanie wszystkiego</h3>
<p>Jeśli podkreślisz cały tekst, nic nie jest ważne. Podkreślaj <strong>maksymalnie 10-20%</strong> tekstu.</p>

<h3>❌ Nauka w ostatniej chwili (cramming)</h3>
<p>Informacje trafiają do pamięci krótkotrwałej i szybko znikają. Ucz się <strong>regularnie</strong>!</p>

<h3>❌ Multitasking</h3>
<p>Mózg nie potrafi robić dwóch rzeczy naraz. Każde przełączenie kontekstu kosztuje Cię <strong>23 minuty</strong> koncentracji!</p>

<h3>❌ Ignorowanie snu</h3>
<p>Sen to moment, gdy mózg konsoliduje pamięć. Bez snu - nie ma efektywnej nauki!</p>

<h2>Plan nauki - przykład</h2>

<h3>Poniedziałek - Piątek</h3>
<ul>
<li><strong>7:00-8:00</strong> - Powtórka wczorajszego materiału (Anki)</li>
<li><strong>18:00-19:30</strong> - Nauka nowego materiału (3x Pomodoro)</li>
<li><strong>21:00-21:30</strong> - Aktywne przypominanie (quizy, fiszki)</li>
</ul>

<h3>Weekend</h3>
<ul>
<li><strong>Sobota</strong> - Powtórka całego tygodnia + mind mapping</li>
<li><strong>Niedziela</strong> - Odpoczynek lub lekka powtórka</li>
</ul>

<h2>Narzędzia i aplikacje</h2>

<h3>Do fiszek i powtórek</h3>
<ul>
<li>🎴 <strong>Anki</strong> - Najlepsza aplikacja do SRS (darmowa)</li>
<li>📚 <strong>Quizlet</strong> - Prosta i przyjazna (freemium)</li>
<li>🧠 <strong>RemNote</strong> - Notatki + SRS w jednym</li>
</ul>

<h3>Do zarządzania czasem</h3>
<ul>
<li>🍅 <strong>Forest</strong> - Pomodoro + gamifikacja</li>
<li>⏱️ <strong>Focus To-Do</strong> - Pomodoro + lista zadań</li>
<li>📊 <strong>Toggl Track</strong> - Śledzenie czasu nauki</li>
</ul>

<h3>Do notatek</h3>
<ul>
<li>📝 <strong>Notion</strong> - Wszechstronne narzędzie</li>
<li>🔗 <strong>Obsidian</strong> - Notatki połączone (Zettelkasten)</li>
<li>📓 <strong>Evernote</strong> - Klasyka gatunku</li>
</ul>

<h2>Podsumowanie</h2>
<p>Skuteczna nauka to nie magia - to nauka! Kluczowe zasady:</p>

<ul>
<li>✅ <strong>Aktywne przypominanie</strong> zamiast biernego czytania</li>
<li>✅ <strong>Powtórki rozmieszczone w czasie</strong> zamiast nauki w ostatniej chwili</li>
<li>✅ <strong>Zrozumienie</strong> zamiast pamięciowego wkuwania</li>
<li>✅ <strong>Regularne sesje</strong> zamiast maratonów</li>
<li>✅ <strong>Sen i odpoczynek</strong> jako część procesu nauki</li>
</ul>

<p><strong>Pamiętaj:</strong> Każdy mózg jest inny. Eksperymentuj z różnymi technikami i znajdź to, co działa dla Ciebie!</p>

<p><strong>Powodzenia w nauce! 🎓</strong></p>',
    'Poznaj sprawdzone, naukowe metody efektywnej nauki. Aktywne przypominanie, powtórki rozmieszczone, technika Feynmana i więcej!',
    'Motywacja',
    '🎓',
    ARRAY['nauka', 'pamięć', 'techniki', 'produktywność', 'edukacja'],
    true,
    false,
    (SELECT id FROM auth.users WHERE is_super_admin = TRUE LIMIT 1)
);

-- ============================================
-- ARTYKUŁ 4: Zdrowe odżywianie - podstawy
-- ============================================

INSERT INTO knowledge_base_articles (
    title,
    slug,
    content,
    description,
    category,
    icon,
    tags,
    is_published,
    featured,
    author_id
) VALUES (
    'Zdrowe odżywianie - podstawy diety zbilansowanej',
    'zdrowe-odzywianie-podstawy',
    '<h2>Czym jest zdrowe odżywianie?</h2>
<p>Zdrowe odżywianie to nie dieta, ale <strong>styl życia</strong>. To dostarczanie organizmowi wszystkich niezbędnych składników odżywczych w odpowiednich proporcjach.</p>

<h2>Makroskładniki - fundament diety</h2>

<h3>1. Białko (Protein)</h3>
<p><strong>Rola:</strong> Budowa i regeneracja tkanek, produkcja hormonów i enzymów</p>
<p><strong>Zapotrzebowanie:</strong> 0.8-2.2g na kg masy ciała (zależy od aktywności)</p>

<p><strong>Źródła:</strong></p>
<ul>
<li>🥩 Mięso (kurczak, wołowina, ryby)</li>
<li>🥚 Jaja</li>
<li>🥛 Produkty mleczne (ser, jogurt, twaróg)</li>
<li>🌱 Rośliny strączkowe (soczewica, fasola, ciecierzyca)</li>
<li>🥜 Orzechy i nasiona</li>
</ul>

<h3>2. Węglowodany (Carbohydrates)</h3>
<p><strong>Rola:</strong> Główne źródło energii dla organizmu</p>
<p><strong>Zapotrzebowanie:</strong> 45-65% dziennej energii</p>

<p><strong>Źródła (wybieraj złożone!):</strong></p>
<ul>
<li>🍚 Ryż (brązowy, dziki)</li>
<li>🍝 Makarony pełnoziarniste</li>
<li>🥔 Ziemniaki, bataty</li>
<li>🌾 Płatki owsiane, kasze</li>
<li>🍎 Owoce</li>
<li>🥦 Warzywa</li>
</ul>

<p><strong>Unikaj:</strong> Cukru prostego, słodyczy, białego pieczywa</p>

<h3>3. Tłuszcze (Fats)</h3>
<p><strong>Rola:</strong> Produkcja hormonów, wchłanianie witamin, energia</p>
<p><strong>Zapotrzebowanie:</strong> 20-35% dziennej energii</p>

<p><strong>Źródła (wybieraj nienasycone!):</strong></p>
<ul>
<li>🥑 Awokado</li>
<li>🥜 Orzechy i masła orzechowe</li>
<li>🐟 Ryby tłuste (łosoś, makrela)</li>
<li>🫒 Oliwa z oliwek</li>
<li>🌰 Nasiona (chia, len, słonecznik)</li>
</ul>

<p><strong>Ogranicz:</strong> Tłuszcze trans, smażone jedzenie, fast food</p>

<h2>Mikroskładniki - witaminy i minerały</h2>

<h3>Najważniejsze witaminy</h3>
<ul>
<li><strong>Witamina D</strong> - Kości, układ odpornościowy (słońce, ryby, suplementacja)</li>
<li><strong>Witamina C</strong> - Odporność, kolagen (owoce cytrusowe, papryka)</li>
<li><strong>Witamina B12</strong> - Układ nerwowy (mięso, jaja, mleko)</li>
<li><strong>Witamina A</strong> - Wzrok, skóra (marchew, bataty, szpinak)</li>
</ul>

<h3>Kluczowe minerały</h3>
<ul>
<li><strong>Żelazo</strong> - Transport tlenu (mięso czerwone, szpinak)</li>
<li><strong>Wapń</strong> - Kości i zęby (mleko, ser, brokuły)</li>
<li><strong>Magnez</strong> - Mięśnie, układ nerwowy (orzechy, nasiona, ciemna czekolada)</li>
<li><strong>Potas</strong> - Ciśnienie krwi (banany, ziemniaki, awokado)</li>
</ul>

<h2>Talerz zdrowego posiłku</h2>
<p>Wyobraź sobie talerz podzielony na części:</p>

<ul>
<li>🥗 <strong>50% - Warzywa</strong> (różnokolorowe!)</li>
<li>🍗 <strong>25% - Białko</strong> (chude mięso, ryby, rośliny strączkowe)</li>
<li>🍚 <strong>25% - Węglowodany złożone</strong> (pełnoziarniste produkty)</li>
<li>🫒 <strong>+ Zdrowe tłuszcze</strong> (oliwa, orzechy)</li>
</ul>

<h2>Nawodnienie</h2>
<p>Woda to życie! <strong>60% naszego ciała to woda</strong>.</p>

<p><strong>Zapotrzebowanie:</strong></p>
<ul>
<li>💧 <strong>Kobiety:</strong> ~2 litry dziennie</li>
<li>💧 <strong>Mężczyźni:</strong> ~2.5 litra dziennie</li>
<li>💧 <strong>Aktywni fizycznie:</strong> +0.5-1 litr na godzinę treningu</li>
</ul>

<p><strong>Oznaki odwodnienia:</strong></p>
<ul>
<li>Ciemny mocz</li>
<li>Suchość w ustach</li>
<li>Zmęczenie</li>
<li>Bóle głowy</li>
</ul>

<h2>Zasady zdrowego odżywiania</h2>

<ol>
<li><strong>Jedz regularnie</strong> - 4-5 posiłków dziennie</li>
<li><strong>Nie pomijaj śniadania</strong> - Uruchamia metabolizm</li>
<li><strong>Jedz tęczę</strong> - Im więcej kolorów, tym lepiej</li>
<li><strong>Ogranicz przetworzone jedzenie</strong> - Gotuj sam!</li>
<li><strong>Czytaj etykiety</strong> - Unikaj długich list składników</li>
<li><strong>Jedz powoli</strong> - Sygnał sytości dociera po 20 minutach</li>
<li><strong>Słuchaj swojego ciała</strong> - Jedz gdy jesteś głodny</li>
<li><strong>Zasada 80/20</strong> - 80% zdrowo, 20% przyjemności</li>
</ol>

<h2>Przykładowy jadłospis na dzień</h2>

<h3>Śniadanie (7:00)</h3>
<p>🥣 Owsianka z owocami i orzechami</p>
<ul>
<li>50g płatków owsianych</li>
<li>200ml mleka roślinnego</li>
<li>1 banan</li>
<li>Garść jagód</li>
<li>1 łyżka masła orzechowego</li>
</ul>

<h3>II Śniadanie (10:00)</h3>
<p>🍎 Jabłko + garść migdałów</p>

<h3>Obiad (13:00)</h3>
<p>🍗 Kurczak z warzywami i ryżem</p>
<ul>
<li>150g piersi z kurczaka</li>
<li>100g brązowego ryżu</li>
<li>Warzywa na parze (brokuły, marchew, papryka)</li>
<li>Oliwa z oliwek</li>
</ul>

<h3>Podwieczorek (16:00)</h3>
<p>🥛 Jogurt naturalny z owocami</p>
<ul>
<li>200g jogurtu naturalnego</li>
<li>Garść truskawek</li>
<li>1 łyżka nasion chia</li>
</ul>

<h3>Kolacja (19:00)</h3>
<p>🐟 Łosoś z batatami i sałatką</p>
<ul>
<li>150g łososia</li>
<li>1 średni batat</li>
<li>Sałata, pomidor, ogórek, awokado</li>
<li>Oliwa + sok z cytryny</li>
</ul>

<h2>Najczęstsze błędy żywieniowe</h2>

<h3>❌ Pomijanie posiłków</h3>
<p>Prowadzi do spowolnienia metabolizmu i przejadania się później.</p>

<h3>❌ Zbyt mało białka</h3>
<p>Skutkuje utratą masy mięśniowej i ciągłym głodem.</p>

<h3>❌ Demonizowanie tłuszczów</h3>
<p>Zdrowe tłuszcze są niezbędne! Nie unikaj ich.</p>

<h3>❌ Zbyt mało warzyw</h3>
<p>Warzywa to witaminy, minerały i błonnik. Jedz ich więcej!</p>

<h3>❌ Picie kalorii</h3>
<p>Soki, napoje gazowane - to puste kalorie bez wartości odżywczej.</p>

<h2>Suplementacja - czy jest potrzebna?</h2>

<p><strong>Podstawowa zasada:</strong> Najpierw dieta, potem suplementy!</p>

<p><strong>Suplementy warte rozważenia:</strong></p>
<ul>
<li>💊 <strong>Witamina D</strong> - Szczególnie zimą (2000-4000 IU)</li>
<li>💊 <strong>Omega-3</strong> - Jeśli nie jesz ryb (1000-2000mg EPA+DHA)</li>
<li>💊 <strong>Witamina B12</strong> - Dla wegan (1000mcg)</li>
<li>💊 <strong>Magnez</strong> - Przy problemach ze snem (200-400mg)</li>
</ul>

<p><strong>Zawsze konsultuj z lekarzem przed rozpoczęciem suplementacji!</strong></p>

<h2>Podsumowanie</h2>

<blockquote>
<p>"Niech pożywienie będzie twoim lekarstwem, a lekarstwo twoim pożywieniem" - Hipokrates</p>
</blockquote>

<p>Zdrowe odżywianie to:</p>
<ul>
<li>✅ Zbilansowana dieta (białko, węglowodany, tłuszcze)</li>
<li>✅ Dużo warzyw i owoców</li>
<li>✅ Odpowiednie nawodnienie</li>
<li>✅ Regularne posiłki</li>
<li>✅ Minimalna ilość przetworzonej żywności</li>
<li>✅ Zasada 80/20 - nie musisz być idealny!</li>
</ul>

<p><strong>Zacznij od małych kroków i bądź cierpliwy. Zdrowe nawyki buduje się latami, nie dniami! 🥗</strong></p>',
    'Poznaj podstawy zdrowego, zbilansowanego odżywiania. Makroskładniki, mikroskładniki, nawodnienie i praktyczne wskazówki.',
    'Zdrowie',
    '🥗',
    ARRAY['odżywianie', 'dieta', 'zdrowie', 'makroskładniki', 'witaminy'],
    true,
    false,
    (SELECT id FROM auth.users WHERE is_super_admin = TRUE LIMIT 1)
);

-- ✅ Knowledge Base articles seeded successfully!
-- 
-- 📊 Summary:
--   - 4 articles created
--   - 2 featured articles
--   - Categories: Fitness, Języki, Motywacja, Zdrowie
-- 
-- 🔗 Next steps:
--   1. Images already uploaded to Supabase Storage ✅
--   2. Test the Knowledge Base in the app!
--   3. As admin, you can edit, add new, or delete articles

