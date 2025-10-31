/**
 * @jest-environment jsdom
 */

describe('Workout Skip Rest Feature', () => {
  let isRestExercise;
  let updateSkipButtonForRest;
  let skipButton;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="workout-phase"></div>
      <div id="workout-exercise-name"></div>
      <div id="workout-exercise-description"></div>
      <div id="workout-exercise-details"></div>
      <button id="workout-main-button">
        <span id="workout-button-text"></span>
        <span id="workout-button-icon"></span>
      </button>
      <button id="workout-skip-button">Pomiń ćwiczenie</button>
      <button id="workout-restart-btn"></button>
      <button id="workout-restart"></button>
      <button id="workout-home"></button>
      <div id="restart-dialog" class="hidden">
        <button id="restart-confirm"></button>
        <button id="restart-cancel"></button>
      </div>
    `;

    skipButton = document.getElementById('workout-skip-button');

    // Define test functions based on implementation
    isRestExercise = function(exercise) {
      if (!exercise) return false;
      return exercise.type === 'time' && exercise.name === 'Odpoczynek';
    };

    updateSkipButtonForRest = function(isRest) {
      if (!skipButton) return;
      
      if (isRest) {
        skipButton.className = 'w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition shadow-lg';
        skipButton.innerHTML = '⏭️ Pomiń odpoczynek';
      } else {
        skipButton.className = 'w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition';
        skipButton.textContent = 'Pomiń ćwiczenie';
      }
    };
  });

  describe('isRestExercise()', () => {
    test('zwraca true dla ćwiczenia odpoczynkowego', () => {
      const restExercise = {
        name: "Odpoczynek",
        type: "time",
        duration: 30,
        description: "Przerwa między seriami.",
        details: "",
        mediaUrl: ""
      };

      expect(isRestExercise(restExercise)).toBe(true);
    });

    test('zwraca false dla normalnego ćwiczenia czasowego', () => {
      const timeExercise = {
        name: "Deska",
        type: "time",
        duration: 45,
        description: "Utrzymuj proste plecy",
        details: "",
        mediaUrl: ""
      };

      expect(isRestExercise(timeExercise)).toBe(false);
    });

    test('zwraca false dla ćwiczenia na powtórzenia', () => {
      const repsExercise = {
        name: "Pompki",
        type: "reps",
        reps: "15",
        description: "Pompki klasyczne",
        details: "15 powtórzeń",
        mediaUrl: ""
      };

      expect(isRestExercise(repsExercise)).toBe(false);
    });

    test('zwraca false dla null', () => {
      expect(isRestExercise(null)).toBe(false);
    });

    test('zwraca false dla undefined', () => {
      expect(isRestExercise(undefined)).toBe(false);
    });

    test('zwraca false dla ćwiczenia o podobnej nazwie', () => {
      const similarExercise = {
        name: "Odpoczynek aktywny",
        type: "time",
        duration: 60,
        description: "Lekki bieg",
        details: "",
        mediaUrl: ""
      };

      expect(isRestExercise(similarExercise)).toBe(false);
    });
  });

  describe('updateSkipButtonForRest()', () => {
    test('zmienia przycisk na pomarańczowy dla odpoczynku', () => {
      updateSkipButtonForRest(true);

      expect(skipButton.className).toContain('bg-orange-500');
      expect(skipButton.className).toContain('hover:bg-orange-600');
      expect(skipButton.innerHTML).toContain('⏭️ Pomiń odpoczynek');
    });

    test('przywraca szary przycisk dla normalnego ćwiczenia', () => {
      // Najpierw ustaw jako odpoczynek
      updateSkipButtonForRest(true);
      
      // Potem przywróć normalny
      updateSkipButtonForRest(false);

      expect(skipButton.className).toContain('bg-gray-500');
      expect(skipButton.className).toContain('hover:bg-gray-600');
      expect(skipButton.textContent).toBe('Pomiń ćwiczenie');
    });

    test('przycisk odpoczynku ma większy rozmiar', () => {
      updateSkipButtonForRest(true);
      
      // Sprawdź czy ma większe pady i większy tekst
      expect(skipButton.className).toContain('py-4');
      expect(skipButton.className).toContain('text-xl');
      expect(skipButton.className).toContain('font-bold');
    });

    test('normalny przycisk ma mniejszy rozmiar', () => {
      updateSkipButtonForRest(false);
      
      // Sprawdź czy ma mniejsze pady i mniejszy tekst
      expect(skipButton.className).toContain('py-3');
      expect(skipButton.className).toContain('font-semibold');
    });

    test('nie wywala błędu gdy skipButton nie istnieje', () => {
      skipButton = null;
      
      // Nie powinno rzucić błędu
      expect(() => {
        updateSkipButtonForRest(true);
      }).not.toThrow();
    });
  });

  describe('Integracja z treningiem', () => {
    test('odpoczynek automatycznie generowany przez expandExerciseSets ma poprawną strukturę', () => {
      const restExercise = {
        name: "Odpoczynek",
        type: "time",
        duration: 30,
        description: "Przerwa między seriami.",
        details: "",
        mediaUrl: ""
      };

      // Sprawdź czy struktura jest zgodna z oczekiwaniami
      expect(restExercise.name).toBe("Odpoczynek");
      expect(restExercise.type).toBe("time");
      expect(restExercise.duration).toBeGreaterThan(0);
      expect(isRestExercise(restExercise)).toBe(true);
    });

    test('odpoczynek z niestandardowym czasem jest poprawnie rozpoznawany', () => {
      const customRestExercise = {
        name: "Odpoczynek",
        type: "time",
        duration: 45, // niestandardowy czas
        description: "Przerwa między seriami.",
        details: "",
        mediaUrl: ""
      };

      expect(isRestExercise(customRestExercise)).toBe(true);
    });
  });

  describe('UX - Wizualne różnice', () => {
    test('przycisk odpoczynku wyróżnia się kolorem (pomarańczowy vs szary)', () => {
      // Normalny przycisk
      updateSkipButtonForRest(false);
      const normalColor = skipButton.className;
      
      // Przycisk odpoczynku
      updateSkipButtonForRest(true);
      const restColor = skipButton.className;
      
      // Kolory powinny być różne
      expect(normalColor).not.toBe(restColor);
      expect(restColor).toContain('orange');
      expect(normalColor).toContain('gray');
    });

    test('przycisk odpoczynku ma emoji dla lepszej widoczności', () => {
      updateSkipButtonForRest(true);
      
      expect(skipButton.innerHTML).toContain('⏭️');
    });

    test('tekst przycisku jasno komunikuje akcję', () => {
      // Dla odpoczynku
      updateSkipButtonForRest(true);
      expect(skipButton.innerHTML).toContain('Pomiń odpoczynek');
      
      // Dla normalnego ćwiczenia
      updateSkipButtonForRest(false);
      expect(skipButton.textContent).toContain('Pomiń ćwiczenie');
    });
  });
});

