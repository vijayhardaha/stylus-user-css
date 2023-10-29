/**
 * Required packages
 */
import { deleteSync } from "del"; // Delete files and directories
import autoprefixer from "autoprefixer"; // Autoprefix CSS properties
import cleancss from "gulp-clean-css"; // Minify CSS
import dartSass from "sass"; // Compile SCSS to CSS
import duplicates from "postcss-discard-duplicates"; // Remove duplicate CSS rules
import filter from "gulp-filter"; // Filter files
import gulp from "gulp"; // Gulp task runner
import gulpSass from "gulp-sass"; // Compile SCSS to CSS
import plumber from "gulp-plumber"; // Handle errors gracefully
import postcss from "gulp-postcss"; // Process CSS with PostCSS
import rename from "gulp-rename"; // Rename files

const sass = gulpSass(dartSass);

/**
 * Exclude files with an underscore prefix using gulp-filter.
 */
const excludeUnderscoredFiles = filter((file) => !/\/_/.test(file.path));

/**
 * Build CSS from LESS files.
 *
 * @param {Function} done - A callback function to signal task completion.
 */
const buildCSS = (done) => {
	gulp
		.src("src/**/*.scss") // Source LESS files
		.pipe(excludeUnderscoredFiles) // Exclude files starting with an underscore
		.pipe(plumber()) // Handle errors gracefully
		.pipe(sass({ quietDeps: true })) // Compile SCSS to CSS
		.pipe(postcss([duplicates(), autoprefixer()])) // Process CSS with PostCSS plugins
		.pipe(cleancss({ format: "beautify" })) // Minify CSS
		.pipe(rename({ suffix: ".user" })) // Rename output files
		.pipe(gulp.dest("dist")); // Output directory

	done(); // Signal task completion
};

/**
 * Clean the build directory by deleting the 'dist' directory.
 *
 * @param {Function} done - A callback function to signal task completion.
 */
const cleanAssets = (done) => {
	deleteSync("dist"); // Delete the 'dist' directory

	done(); // Signal task completion
};

/**
 * Watch for changes in LESS files and trigger the 'buildCSS' task.
 *
 * @param {Function} done - A callback function to signal task completion.
 */
const watchAssets = (done) => {
	gulp.watch("src/**/*.scss", buildCSS); // Watch LESS files for changes and run 'buildCSS' task

	done(); // Signal task completion
};

// Define a series of tasks that should run in a sequence
const build = gulp.series(cleanAssets, buildCSS);

// Export the 'build' task and rename 'watchAssets' to 'watch' for better clarity.
export { build, watchAssets as watch };
