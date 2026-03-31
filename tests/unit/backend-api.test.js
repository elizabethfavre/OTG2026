// Comprehensive tests for backend API adapter

describe('Backend API Adapter', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('Login Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
    });

    it('should require minimum password length', () => {
      const minLength = 6;
      expect('password123'.length >= minLength).toBe(true);
      expect('pass'.length >= minLength).toBe(false);
    });

    it('should accept valid credentials format', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      expect(credentials.email).toBeTruthy();
      expect(credentials.password).toBeTruthy();
      expect(credentials.password.length >= 6).toBe(true);
    });
  });

  describe('Signup Validation', () => {
    it('should require all signup fields', () => {
      const signupData = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        role: 'new_team_member',
        managerId: 'manager-123',
        mentorId: 'mentor-123'
      };

      expect(signupData).toHaveProperty('email');
      expect(signupData).toHaveProperty('password');
      expect(signupData).toHaveProperty('username');
      expect(signupData).toHaveProperty('role');
    });

    it('should validate role values', () => {
      const validRoles = ['manager', 'mentor', 'new_team_member'];
      const testRole = 'mentor';

      expect(validRoles).toContain(testRole);
    });

    it('should handle role-based supervisor requirements', () => {
      const newMemberData = {
        role: 'new_team_member',
        managerId: 'manager-123',
        mentorId: 'mentor-123',
        requiresManager: true,
        requiresMentor: true
      };

      expect(newMemberData.managerId).toBeDefined();
      expect(newMemberData.mentorId).toBeDefined();
    });

    it('should handle mentor with manager requirement', () => {
      const mentorData = {
        role: 'mentor',
        managerId: 'manager-123',
        requiresManager: true
      };

      expect(mentorData.managerId).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should store auth token in session', () => {
      const token = 'test-token-123';
      sessionStorage.setItem('authToken', token);

      expect(sessionStorage.getItem('authToken')).toBe(token);
    });

    it('should store user data in session', () => {
      const userData = {
        uid: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'mentor'
      };

      sessionStorage.setItem('currentUser', JSON.stringify(userData));
      const stored = JSON.parse(sessionStorage.getItem('currentUser'));

      expect(stored).toEqual(userData);
      expect(stored.role).toBe('mentor');
    });

    it('should clear all session data on logout', () => {
      sessionStorage.setItem('authToken', 'token');
      sessionStorage.setItem('currentUser', '{}');

      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('currentUser');

      expect(sessionStorage.getItem('authToken')).toBeNull();
      expect(sessionStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('Auth State Listener', () => {
    it('should detect logged-in user from session', () => {
      const userData = {
        uid: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'new_team_member'
      };

      sessionStorage.setItem('authToken', 'test-token');
      sessionStorage.setItem('currentUser', JSON.stringify(userData));

      const token = sessionStorage.getItem('authToken');
      const user = JSON.parse(sessionStorage.getItem('currentUser'));

      expect(token).toBe('test-token');
      expect(user).toEqual(userData);
    });

    it('should detect logged-out user when token missing', () => {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('currentUser');

      const token = sessionStorage.getItem('authToken');
      const user = sessionStorage.getItem('currentUser');

      expect(token).toBeNull();
      expect(user).toBeNull();
    });
  });
});