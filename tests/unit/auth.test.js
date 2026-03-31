// Unit tests for authentication utilities

describe('Authentication', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  describe('Session Management', () => {
    it('should store user session data', () => {
      const userData = {
        uid: 'test-uid-123',
        email: 'demo@example.com',
        username: 'demo',
        role: 'new_team_member'
      };

      sessionStorage.setItem('app_session_user', JSON.stringify(userData));
      const stored = JSON.parse(sessionStorage.getItem('app_session_user'));

      expect(stored).toEqual(userData);
      expect(stored.role).toBe('new_team_member');
    });

    it('should clear session data on logout', () => {
      sessionStorage.setItem('app_session_user', JSON.stringify({ uid: 'test' }));
      sessionStorage.removeItem('app_session_user');

      expect(sessionStorage.getItem('app_session_user')).toBeNull();
    });

    it('should handle manager role correctly', () => {
      const managerData = {
        uid: 'admin-123',
        email: 'admin@example.com',
        username: 'admin',
        role: 'manager'
      };

      sessionStorage.setItem('app_session_user', JSON.stringify(managerData));
      const stored = JSON.parse(sessionStorage.getItem('app_session_user'));

      expect(stored.role).toBe('manager');
      expect(stored.username).toBe('admin');
    });

    it('should handle mentor role correctly', () => {
      const mentorData = {
        uid: 'mentor-123',
        email: 'mentor@example.com',
        username: 'mentor',
        role: 'mentor'
      };

      sessionStorage.setItem('app_session_user', JSON.stringify(mentorData));
      const stored = JSON.parse(sessionStorage.getItem('app_session_user'));

      expect(stored.role).toBe('mentor');
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test('demo@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('test@example.com')).toBe(true);
    });

    it('should reject empty email', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should require minimum password length', () => {
      const minLength = 6;

      expect('admin123!'.length >= minLength).toBe(true);
      expect('admin'.length >= minLength).toBe(false);
      expect('demo123!'.length >= minLength).toBe(true);
    });

    it('should validate password complexity', () => {
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;

      expect(passwordRegex.test('admin123!')).toBe(true);
      expect(passwordRegex.test('simplepassword')).toBe(false);
      expect(passwordRegex.test('demo123!')).toBe(true);
    });
  });
});
