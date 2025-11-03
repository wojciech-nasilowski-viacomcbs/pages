import { CardRenderer } from '../js/ui/card-renderer.js';

describe('CardRenderer', () => {
  let renderer;

  beforeEach(() => {
    renderer = new CardRenderer();
  });

  describe('renderCard', () => {
    test('renders quiz card with correct icon', () => {
      const item = {
        id: 'quiz-123',
        title: 'Test Quiz',
        description: 'Test Description',
        isSample: false,
        isPublic: false
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: false });

      expect(html).toContain('📝');
      expect(html).toContain('Test Quiz');
      expect(html).toContain('Test Description');
      expect(html).toContain('data-id="quiz-123"');
    });

    test('renders workout card with emoji', () => {
      const item = {
        id: 'workout-123',
        title: 'Test Workout',
        description: 'Test Description',
        emoji: '🏃',
        isSample: false,
        isPublic: false
      };

      const html = renderer.renderCard(item, { type: 'workout', isAdmin: false });

      expect(html).toContain('🏃');
      expect(html).toContain('Test Workout');
    });

    test('uses default emoji for workout without emoji', () => {
      const item = {
        id: 'workout-123',
        title: 'Test Workout',
        isSample: false,
        isPublic: false
      };

      const html = renderer.renderCard(item, { type: 'workout', isAdmin: false });

      expect(html).toContain('💪');
    });

    test('shows sample badge for sample items', () => {
      const item = {
        id: 'quiz-123',
        title: 'Sample Quiz',
        isSample: true,
        isPublic: false
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: false });

      expect(html).toContain('Przykład');
      expect(html).toContain('bg-blue-600');
    });

    test('shows public badge for public items', () => {
      const item = {
        id: 'quiz-123',
        title: 'Public Quiz',
        isSample: false,
        isPublic: true
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: false });

      expect(html).toContain('Publiczny');
      expect(html).toContain('bg-green-600');
    });

    test('does not show action buttons for sample items', () => {
      const item = {
        id: 'quiz-123',
        title: 'Sample Quiz',
        isSample: true
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: true });

      expect(html).not.toContain('share-btn');
      expect(html).not.toContain('export-btn');
      expect(html).not.toContain('delete-btn');
    });

    test('shows action buttons for non-sample items', () => {
      const item = {
        id: 'quiz-123',
        title: 'My Quiz',
        isSample: false
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: false });

      expect(html).toContain('share-btn');
      expect(html).toContain('export-btn');
      expect(html).toContain('delete-btn');
    });

    test('shows toggle public button only for admins', () => {
      const item = {
        id: 'quiz-123',
        title: 'My Quiz',
        isSample: false,
        isPublic: false
      };

      const htmlUser = renderer.renderCard(item, { type: 'quiz', isAdmin: false });
      const htmlAdmin = renderer.renderCard(item, { type: 'quiz', isAdmin: true });

      expect(htmlUser).not.toContain('toggle-public-btn');
      expect(htmlAdmin).toContain('toggle-public-btn');
      expect(htmlAdmin).toContain('🌍'); // Public icon
    });

    test('shows lock icon for public items (admin)', () => {
      const item = {
        id: 'quiz-123',
        title: 'Public Quiz',
        isSample: false,
        isPublic: true
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: true });

      expect(html).toContain('🔒'); // Lock icon
    });

    test('handles missing description', () => {
      const item = {
        id: 'quiz-123',
        title: 'Test Quiz',
        isSample: false
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: false });

      expect(html).toContain('Brak opisu');
    });

    test('escapes HTML in title', () => {
      const item = {
        id: 'quiz-123',
        title: '<script>alert("XSS")</script>',
        isSample: false
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: false });

      // Check that the title in <h3> is escaped (innerHTML from textContent)
      expect(html).toContain('&lt;script&gt;');
      // Check that quotes in data-title are escaped
      expect(html).toContain('data-title="<script>alert(&quot;XSS&quot;)</script>"');
    });

    test('escapes HTML in description', () => {
      const item = {
        id: 'quiz-123',
        title: 'Test',
        description: '<img src=x onerror=alert(1)>',
        isSample: false
      };

      const html = renderer.renderCard(item, { type: 'quiz', isAdmin: false });

      expect(html).not.toContain('<img src=');
      expect(html).toContain('&lt;img');
    });
  });

  describe('renderLoginScreen', () => {
    test('renders login screen with features', () => {
      const features = ['Interaktywnych quizów', 'Treningów fitness'];
      const html = renderer.renderLoginScreen(features);

      expect(html).toContain('Witaj w eTrener!');
      expect(html).toContain('Interaktywnych quizów');
      expect(html).toContain('Treningów fitness');
      expect(html).toContain('Zaloguj się');
      expect(html).toContain('Zarejestruj się');
    });

    test('shows no modules message when empty', () => {
      const html = renderer.renderLoginScreen([]);

      expect(html).toContain('Brak dostępnych modułów');
    });
  });

  describe('renderEmptyState', () => {
    test('renders empty state message', () => {
      const html = renderer.renderEmptyState();

      expect(html).toContain('Brak dostępnych treści');
      expect(html).toContain('Zaimportuj swoje treści');
    });
  });

  describe('renderNoModulesScreen', () => {
    test('renders no modules screen', () => {
      const html = renderer.renderNoModulesScreen();

      expect(html).toContain('Brak aktywnych modułów');
      expect(html).toContain('Administrator nie włączył');
    });
  });

  describe('escapeHtml', () => {
    test('escapes < and >', () => {
      expect(renderer.escapeHtml('<div>test</div>')).toBe('&lt;div&gt;test&lt;/div&gt;');
    });

    test('escapes script tags', () => {
      expect(renderer.escapeHtml('<script>alert(1)</script>')).toContain('&lt;script&gt;');
    });

    test('handles ampersands', () => {
      expect(renderer.escapeHtml('A & B')).toBe('A &amp; B');
    });

    test('preserves quotes (textContent does not escape them)', () => {
      // textContent preserves quotes as-is, which is safe in HTML content
      expect(renderer.escapeHtml('Say "hello"')).toBe('Say "hello"');
    });
  });

  describe('escapeAttr', () => {
    test('escapes double quotes', () => {
      expect(renderer.escapeAttr('Test "quoted" text')).toBe('Test &quot;quoted&quot; text');
    });

    test('handles multiple quotes', () => {
      expect(renderer.escapeAttr('"A" and "B"')).toBe('&quot;A&quot; and &quot;B&quot;');
    });

    test('does not escape other characters', () => {
      expect(renderer.escapeAttr('Test <div> text')).toBe('Test <div> text');
    });
  });
});
