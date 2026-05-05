/**
 * ======================================================================
 * Stylelint Configuration
 * ======================================================================
 * Purpose: Defines linting rules for CSS/SCSS to ensure consistent
 *          styling, ordering, and best practices across the repository.
 * Docs:    https://stylelint.io/user-guide/configure
 * ======================================================================
 */

const config = {
  // ---- Ruleset Inheritance ----
  extends: ['@vijayhardaha/dev-config/stylelint'],

  // ---- Rule Customization ----
  rules: {
    // Handle specific edge cases in SCSS development
    'at-rule-no-vendor-prefix': null,
    'at-rule-no-deprecated': null,
  },
};

export default config;
