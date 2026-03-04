/**
 * ======================================================================
 * Stylelint Configuration
 * ======================================================================
 * Purpose: Project-wide Stylelint rules and plugin configuration.
 * Docs: https://stylelint.io/user-guide/configuration
 * ======================================================================
 */

const config = {
	// ---- Ruleset Inheritance ----
	extends: [
		"stylelint-config-standard-scss", // Standard SCSS rules
		"stylelint-config-property-sort-order-smacss", // Logical SMACSS ordering
	],

	// ---- Plugins ----
	plugins: ["stylelint-order"],

	// ---- Rule Customization ----
	rules: {
		// Disable restrictive patterns to allow for creative/flexible naming
		"selector-class-pattern": null,
		"selector-id-pattern": null,

		// Handle specific edge cases in Next.js/SCSS development
		"no-empty-source": null,
		"function-url-quotes": null,
		"no-descending-specificity": null,

		// Clean up comment enforcement
		"comment-no-empty": null,
		"scss/comment-no-empty": null,
	},
};

export default config;
