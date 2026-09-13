import "@testing-library/jest-dom";

// Services import the API config, which requires the base URL at load time.
process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://api.test";

// jsdom doesn't implement window.matchMedia — mock it so ThemeProvider works in tests.
// Guard with typeof check so this doesn't throw in the node environment (service tests).
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}
