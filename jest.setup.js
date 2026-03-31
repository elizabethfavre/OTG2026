// Jest setup file for DOM environment
// Add any global test configuration here

// Mock sessionStorage (used by auth tests)
const sessionStorageMock = {
  getItem: jest.fn(function(key) {
    return this[key] || null;
  }),
  setItem: jest.fn(function(key, value) {
    this[key] = String(value);
  }),
  removeItem: jest.fn(function(key) {
    delete this[key];
  }),
  clear: jest.fn(function() {
    Object.keys(this).forEach(key => {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
        delete this[key];
      }
    });
  }),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});
