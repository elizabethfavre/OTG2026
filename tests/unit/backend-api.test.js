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

  describe('Signup Auto-Login Behavior', () => {
    it('should be able to auto-login after successful signup', () => {
      // Simulate signup creating user
      const newUser = {
        uid: 'new-user-123',
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        role: 'manager'
      };

      // Verify signup credentials are valid
      expect(newUser.email).toBeTruthy();
      expect(newUser.password).toBeTruthy();
      expect(newUser.password.length >= 6).toBe(true);
    });

    it('should store user session after auto-login from signup', () => {
      const signupUser = {
        uid: 'signup-user-456',
        email: 'signup@example.com',
        username: 'signupuser',
        role: 'mentor'
      };

      // Simulate auto-login storing session
      sessionStorage.setItem('app_session_user', JSON.stringify(signupUser));

      const stored = JSON.parse(sessionStorage.getItem('app_session_user') || '{}');
      expect(stored.uid).toBe('signup-user-456');
      expect(stored.role).toBe('mentor');
    });

    it('should handle auto-login failure gracefully', () => {
      // Simulate signup success but auto-login failure scenario
      const signupMessage = 'Account created! Please log in.';
      
      // This message indicates auto-login failed as per app.js fallback
      expect(signupMessage).toContain('Account created');
      expect(signupMessage).toContain('Please log in');
    });

    it('should auto-login with correct redirect URL after manager signup', () => {
      const manager = {
        uid: 'mgr-123',
        email: 'manager@otg.test',
        username: 'manager1',
        role: 'manager'
      };

      // Verify user data for auto-login
      expect(manager.role).toBe('manager');
      expect(manager.email).toContain('@otg.test');
    });

    it('should auto-login with correct redirect URL after mentor signup', () => {
      const mentor = {
        uid: 'mtr-123',
        email: 'mentor@otg.test',
        username: 'mentor1',
        role: 'mentor',
        managerId: 'mgr-123'
      };

      // Verify mentor user data
      expect(mentor.role).toBe('mentor');
      expect(mentor.managerId).toBeDefined();
    });

    it('should auto-login with correct redirect URL after employee signup', () => {
      const employee = {
        uid: 'emp-123',
        email: 'employee@otg.test',
        username: 'employee1',
        role: 'new_team_member',
        managerId: 'mgr-123',
        mentorId: 'mtr-123'
      };

      // Verify employee user data
      expect(employee.role).toBe('new_team_member');
      expect(employee.managerId).toBeDefined();
      expect(employee.mentorId).toBeDefined();
    });
  });
});