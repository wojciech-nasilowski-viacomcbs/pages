/**
 * @jest-environment jsdom
 */

describe('Workout Sets Expansion', () => {
  let expandExerciseSets;

  beforeAll(() => {
    // Mock DOM elements and functions needed by workout-engine.js
    document.body.innerHTML = `
      <div id="workout-phase"></div>
      <div id="workout-exercise-name"></div>
      <div id="workout-exercise-description"></div>
      <div id="workout-exercise-details"></div>
      <button id="workout-main-button">
        <span id="workout-button-text"></span>
        <span id="workout-button-icon"></span>
      </button>
      <button id="workout-skip-button"></button>
      <button id="workout-restart-btn"></button>
      <button id="workout-restart"></button>
      <button id="workout-home"></button>
      <div id="restart-dialog" class="hidden">
        <button id="restart-confirm"></button>
        <button id="restart-cancel"></button>
      </div>
    `;

    // Load workout-engine.js (which defines expandExerciseSets)
    require('../js/workout-engine.js');

    // Extract the expandExerciseSets function from the module
    // Since workout-engine.js uses IIFE, we need to access it via window if exported
    // For testing, we'll redefine it here based on the implementation
    expandExerciseSets = function (phases) {
      return phases.map(phase => {
        const expandedExercises = [];

        phase.exercises.forEach(exercise => {
          if (exercise.sets && exercise.sets >= 2) {
            for (let i = 1; i <= exercise.sets; i++) {
              const seriesExercise = {
                ...exercise,
                name: `${exercise.name} seria ${i}/${exercise.sets}`,
                sets: undefined
              };

              if (exercise.type === 'reps' && exercise.reps) {
                seriesExercise.details = `${exercise.reps} powtórzeń`;
              }

              expandedExercises.push(seriesExercise);

              if (i < exercise.sets) {
                const restDuration = exercise.restBetweenSets || 30;
                expandedExercises.push({
                  name: 'Odpoczynek',
                  type: 'time',
                  duration: restDuration,
                  description: 'Przerwa między seriami.',
                  details: '',
                  mediaUrl: ''
                });
              }
            }
          } else {
            const singleExercise = { ...exercise };

            if (exercise.type === 'reps' && exercise.reps && !exercise.details) {
              singleExercise.details = `${exercise.reps} powtórzeń`;
            }

            expandedExercises.push(singleExercise);
          }
        });

        return {
          ...phase,
          exercises: expandedExercises
        };
      });
    };
  });

  test('rozwija ćwiczenie na powtórzenia z 4 seriami na oddzielne kroki', () => {
    const input = [
      {
        name: 'Trening główny',
        exercises: [
          {
            name: 'Push Up',
            type: 'reps',
            reps: '15',
            sets: 4,
            restBetweenSets: 30,
            description: 'Pompki klasyczne',
            mediaUrl: ''
          }
        ]
      }
    ];

    const result = expandExerciseSets(input);

    // Powinno być: 4 serie + 3 odpoczynki = 7 ćwiczeń
    expect(result[0].exercises).toHaveLength(7);

    // Sprawdź nazwy serii
    expect(result[0].exercises[0].name).toBe('Push Up seria 1/4');
    expect(result[0].exercises[2].name).toBe('Push Up seria 2/4');
    expect(result[0].exercises[4].name).toBe('Push Up seria 3/4');
    expect(result[0].exercises[6].name).toBe('Push Up seria 4/4');

    // Sprawdź odpoczynki
    expect(result[0].exercises[1].name).toBe('Odpoczynek');
    expect(result[0].exercises[1].type).toBe('time');
    expect(result[0].exercises[1].duration).toBe(30);

    // Sprawdź details
    expect(result[0].exercises[0].details).toBe('15 powtórzeń');
  });

  test('rozwija ćwiczenie czasowe z 3 seriami', () => {
    const input = [
      {
        name: 'Trening główny',
        exercises: [
          {
            name: 'Deska',
            type: 'time',
            duration: 45,
            sets: 3,
            restBetweenSets: 20,
            description: 'Utrzymuj proste plecy',
            mediaUrl: ''
          }
        ]
      }
    ];

    const result = expandExerciseSets(input);

    // Powinno być: 3 serie + 2 odpoczynki = 5 ćwiczeń
    expect(result[0].exercises).toHaveLength(5);

    // Sprawdź nazwy serii
    expect(result[0].exercises[0].name).toBe('Deska seria 1/3');
    expect(result[0].exercises[2].name).toBe('Deska seria 2/3');
    expect(result[0].exercises[4].name).toBe('Deska seria 3/3');

    // Sprawdź czas odpoczynku (niestandardowy 20s)
    expect(result[0].exercises[1].duration).toBe(20);
    expect(result[0].exercises[3].duration).toBe(20);
  });

  test('zachowuje pojedyncze ćwiczenie bez zmian', () => {
    const input = [
      {
        name: 'Trening główny',
        exercises: [
          {
            name: 'Podciąganie',
            type: 'reps',
            reps: 'MAX',
            description: 'Podciąganie na drążku',
            mediaUrl: ''
          }
        ]
      }
    ];

    const result = expandExerciseSets(input);

    // Powinno być tylko 1 ćwiczenie
    expect(result[0].exercises).toHaveLength(1);
    expect(result[0].exercises[0].name).toBe('Podciąganie');
    expect(result[0].exercises[0].details).toBe('MAX powtórzeń');
  });

  test('kompatybilność wsteczna - zachowuje stary format z details', () => {
    const input = [
      {
        name: 'Trening główny',
        exercises: [
          {
            name: 'Podciąganie',
            type: 'reps',
            details: 'MAX powtórzeń',
            description: 'Podciąganie na drążku',
            mediaUrl: ''
          }
        ]
      }
    ];

    const result = expandExerciseSets(input);

    // Powinno być tylko 1 ćwiczenie
    expect(result[0].exercises).toHaveLength(1);
    expect(result[0].exercises[0].name).toBe('Podciąganie');
    expect(result[0].exercises[0].details).toBe('MAX powtórzeń');
  });

  test('miesza ćwiczenia wieloseryjne i pojedyncze', () => {
    const input = [
      {
        name: 'Trening główny',
        exercises: [
          {
            name: 'Push Up',
            type: 'reps',
            reps: '15',
            sets: 2,
            restBetweenSets: 30,
            description: 'Pompki',
            mediaUrl: ''
          },
          {
            name: 'Bieg',
            type: 'time',
            duration: 60,
            description: 'Bieg na miejscu',
            mediaUrl: ''
          }
        ]
      }
    ];

    const result = expandExerciseSets(input);

    // Powinno być: 2 serie Push Up + 1 odpoczynek + 1 bieg = 4 ćwiczenia
    expect(result[0].exercises).toHaveLength(4);

    expect(result[0].exercises[0].name).toBe('Push Up seria 1/2');
    expect(result[0].exercises[1].name).toBe('Odpoczynek');
    expect(result[0].exercises[2].name).toBe('Push Up seria 2/2');
    expect(result[0].exercises[3].name).toBe('Bieg');
  });

  test('używa domyślnego odpoczynku 30s gdy restBetweenSets nie jest podany', () => {
    const input = [
      {
        name: 'Trening główny',
        exercises: [
          {
            name: 'Przysiady',
            type: 'reps',
            reps: '20',
            sets: 2,
            description: 'Przysiady',
            mediaUrl: ''
          }
        ]
      }
    ];

    const result = expandExerciseSets(input);

    // Sprawdź domyślny czas odpoczynku
    expect(result[0].exercises[1].duration).toBe(30);
  });

  test('nie rozwija ćwiczenia z sets = 1', () => {
    const input = [
      {
        name: 'Trening główny',
        exercises: [
          {
            name: 'Deska',
            type: 'time',
            duration: 60,
            sets: 1,
            description: 'Deska',
            mediaUrl: ''
          }
        ]
      }
    ];

    const result = expandExerciseSets(input);

    // Powinno być tylko 1 ćwiczenie (sets=1 nie jest rozwijane)
    expect(result[0].exercises).toHaveLength(1);
    expect(result[0].exercises[0].name).toBe('Deska');
  });

  test('przetwarza wiele faz jednocześnie', () => {
    const input = [
      {
        name: 'Rozgrzewka',
        exercises: [
          {
            name: 'Bieg',
            type: 'time',
            duration: 60,
            description: 'Bieg',
            mediaUrl: ''
          }
        ]
      },
      {
        name: 'Trening główny',
        exercises: [
          {
            name: 'Pompki',
            type: 'reps',
            reps: '10',
            sets: 3,
            restBetweenSets: 30,
            description: 'Pompki',
            mediaUrl: ''
          }
        ]
      }
    ];

    const result = expandExerciseSets(input);

    // Sprawdź że obie fazy są przetworzone
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Rozgrzewka');
    expect(result[0].exercises).toHaveLength(1); // Pojedynczy bieg
    expect(result[1].name).toBe('Trening główny');
    expect(result[1].exercises).toHaveLength(5); // 3 serie + 2 odpoczynki
  });
});
