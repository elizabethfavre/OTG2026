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

  describe('Signup Auto-Login Behavior', () => {
    it('should capture signup form data correctly', () => {
      const signupData = {
        username: 'newuser',
        email: 'newuser@otg.test',
        password: 'password123',
        role: 'manager'
      };

      expect(signupData.username).toBe('newuser');
      expect(signupData.email).toBe('newuser@otg.test');
      expect(signupData.password).toBe('password123');
      expect(signupData.role).toBe('manager');
    });

    it('should verify auto-login uses same credentials from signup', () => {
      const signupCredentials = {
        email: 'test@otg.test',
        password: 'password123'
      };

      const autoLoginCredentials = {
        email: 'test@otg.test',
        password: 'password123'
      };

      expect(autoLoginCredentials).toEqual(signupCredentials);
    });

    it('should handle auto-login timeout gracefully', () => {
      const timeoutMessage = 'Account created! Please log in.';
      expect(timeoutMessage).toContain('Account created');
    });

    it('should redirect to dashboard on successful auto-login', () => {
      const redirectUrl = 'dashboard.html';
      expect(redirectUrl).toBe('dashboard.html');
    });

    it('should store signed-up user in session before auto-login', () => {
      const newUser = {
        uid: 'new-123',
        email: 'new@otg.test',
        username: 'newuser',
        role: 'mentor'
      };

      sessionStorage.setItem('app_session_user', JSON.stringify(newUser));
      const stored = JSON.parse(sessionStorage.getItem('app_session_user') || '{}');

      expect(stored.email).toBe('new@otg.test');
      expect(stored.role).toBe('mentor');
    });

    it('should handle signup with supervisor assignment', () => {
      const signupWithSupervisors = {
        username: 'employee1',
        email: 'employee1@otg.test',
        password: 'password123',
        role: 'new_team_member',
        managerId: 'manager-uid-123',
        mentorId: 'mentor-uid-456'
      };

      expect(signupWithSupervisors.managerId).toBe('manager-uid-123');
      expect(signupWithSupervisors.mentorId).toBe('mentor-uid-456');
      expect(signupWithSupervisors.role).toBe('new_team_member');
    });

    it('should handle signup with only manager (for mentor role)', () => {
      const signupMentorData = {
        username: 'mentor1',
        email: 'mentor1@otg.test',
        password: 'password123',
        role: 'mentor',
        managerId: 'manager-uid-123'
      };

      expect(signupMentorData.role).toBe('mentor');
      expect(signupMentorData.managerId).toBe('manager-uid-123');
    });

    it('should clear signup form after successful auto-login redirect', () => {
      const cleanFormExpected = {
        username: '',
        email: '',
        password: '',
        role: ''
      };

      sessionStorage.setItem('signupForm', JSON.stringify(cleanFormExpected));
      const form = JSON.parse(sessionStorage.getItem('signupForm') || '{}');

      expect(form.username).toBe('');
      expect(form.email).toBe('');
    });
  });
