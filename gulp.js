/**
 * ======================================================================
 * Gulp Configuration
 * ======================================================================
 * Purpose: Defines Gulp tasks for building CSS, JavaScript, fonts, and
 *          images with optimization and minification support.
 *          Use `bunx gulp <task>` to run configured tasks.
 * Docs:    https://gulpjs.com/docs/en/getting-started/creating-tasks/
 * ======================================================================
 */

// ── Import required packages ──

/** Gulp task runner for orchestrating build processes. */
import gulp from 'gulp';
/** Delete files and directories synchronously for clean builds. */
import { deleteSync } from 'del';
/** Dart Sass compiler for SCSS to CSS compilation. */
import * as dartSass from 'sass';
/** File system module for path validation. */
import fs from 'fs';
/** PostCSS plugin to add vendor prefixes to CSS rules. */
import autoprefixer from 'autoprefixer';
/** Minify CSS by removing whitespace and optimizing rules. */
import cleancss from 'gulp-clean-css';
/** Clone streams to reuse piped content for multiple outputs. */
import clone from 'gulp-clone';
/** Concatenate multiple files into a single output file. */
import concat from 'gulp-concat';
/** PostCSS plugin to discard duplicate CSS rules. */
import duplicates from 'postcss-discard-duplicates';
/** Flatten directory structures by removing intermediate folders. */
import flatten from 'gulp-flatten';
/** Group media queries in CSS for better optimization. */
import gcmq from 'gulp-group-css-media-queries';
/** Gulp plugin wrapping Dart Sass for SCSS compilation. */
import gulpSass from 'gulp-sass';
/** Optimize images (PNG, JPG, GIF, SVG) for production. */
import imagemin from 'gulp-imagemin';
/** Merge multiple streams into one for combined output. */
import merge from 'merge-stream';
/** Prevent Gulp pipes from breaking on errors. */
import plumber from 'gulp-plumber';
/** Transform streams with PostCSS plugins. */
import postcss from 'gulp-postcss';
/** Rename files with custom basename, suffix, or extension. */
import rename from 'gulp-rename';
/** Minify JavaScript using Terser for smaller bundle sizes. */
import terser from 'gulp-terser';

/** Initialize Sass compiler with Dart Sass implementation. */
const sass = gulpSass(dartSass);

// ── Path Configuration ──

/**
 * Paths to base asset directories.
 * All paths include trailing slashes where applicable.
 * @typedef {Object} PathConfig
 * @property {string} src - Path to the source files.
 * @property {string} dest - Path to the build directory.
 * @property {Object} scss - SCSS source and destination paths.
 * @property {Object} js - JavaScript source and destination paths.
 * @property {Object} images - Image source and destination paths.
 * @property {Object} fonts - Font source and destination paths.
 */
const PATHS = {
  src: 'src/',
  dest: 'assets/',
  scss: {
    src: {
      /** Source SCSS file(s) for admin styles. */
      admin: ['src/scss/admin.scss'],
      /** Source SCSS file(s) for frontend styles. */
      frontend: ['src/scss/frontend.scss'],
    },
    /** Destination directory for compiled CSS. */
    dest: 'assets/css',
  },
  js: {
    src: {
      /** Source JavaScript file(s) for admin functionality. */
      admin: ['src/js/admin.js'],
      /** Source JavaScript file(s) for frontend scripts. */
      frontend: ['src/js/frontend.js'],
    },
    /** Destination directory for compiled JavaScript. */
    dest: 'assets/js',
  },
  images: {
    /** Source image files for optimization (all subfolders). */
    src: 'src/images/**/*',
    /** Destination directory for optimized images. */
    dest: 'assets/images',
  },
  fonts: {
    /** Source font files (all subfolders). */
    src: 'src/fonts/**/*',
    /** Destination directory for fonts. */
    dest: 'assets/fonts',
  },
};

// ── Path Validation ──

/**
 * Check if a path exists and contains files.
 * @param {string|string[]} path - Path or glob pattern to validate.
 * @returns {boolean} - True if path exists and has entries.
 */
const validatePath = (path) => {
  if (!path) return false;

  const pathsToCheck = Array.isArray(path) ? path : [path];

  for (const p of pathsToCheck) {
    const isGlob = p.includes('*');
    const checkPath = isGlob ? p.replace(/\/\*+.*$/, '') : p;

    if (!checkPath) return false;

    if (isGlob) {
      // Glob pattern: check if directory exists and has files
      if (!fs.existsSync(checkPath)) return false;
      try {
        const files = fs.readdirSync(checkPath, { recursive: true });
        if (!files.length) return false;
      } catch {
        return false;
      }
    } else {
      // Direct file path: check if file exists
      if (!fs.existsSync(checkPath)) return false;
    }
  }

  return true;
};

/**
 * Filter object entries to only include those with valid paths.
 * @param {Object} pathsObj - Object with path entries to validate.
 * @param {string} type - Type identifier for log messages (e.g., 'CSS', 'JS').
 * @returns {Array} - Filtered entries with valid paths.
 */
const getValidEntries = (pathsObj, type) => {
  return Object.entries(pathsObj).filter(([name, path]) => {
    if (!validatePath(path)) {
      console.log(`Skipping ${type} (${name}): source path does not exist or is empty`);
      return false; // Filter out invalid paths
    }

    return true; // Keep valid paths
  });
};

// ── Build Tasks ──

/**
 * Compile SCSS to CSS, autoprefix, group media queries, and output both
 * beautified and minified versions.
 *
 * @returns {Promise<void>}
 */
const buildCSS = async () => {
  const validEntries = getValidEntries(PATHS.scss.src, 'CSS');

  if (validEntries.length === 0) return;

  for (const [name, path] of validEntries) {
    const baseSource = gulp
      .src(path)
      .pipe(plumber())
      .pipe(sass({ outputStyle: 'expanded', quietDeps: true, verbose: false, logger: sass.compiler.Logger.silent })) // Compile SCSS to expanded CSS.
      .pipe(gcmq()) // Group CSS media queries
      .pipe(concat('merged.css')) // Concatenate CSS files
      .pipe(postcss([duplicates(), autoprefixer()])) // Run PostCSS plugins
      .pipe(cleancss({ format: 'beautify' })) // Beautify the CSS
      .pipe(rename({ basename: name })); // Rename output file

    const minified = baseSource
      .pipe(clone()) // Clone the stream for minified version
      .pipe(cleancss()) // Minify the CSS
      .pipe(rename({ suffix: '.min' })); // Rename minified file

    await new Promise((resolve) => {
      merge(baseSource, minified).pipe(gulp.dest(PATHS.scss.dest)).on('end', resolve); // Output CSS files
    });
  }
};

/**
 * Concatenate and minify JavaScript files, outputting both beautified
 * and minified versions.
 *
 * @returns {Promise<void>}
 */
const buildJS = async () => {
  const validEntries = getValidEntries(PATHS.js.src, 'JS');

  if (validEntries.length === 0) return;

  for (const [name, path] of validEntries) {
    const baseSource = gulp
      .src(path)
      .pipe(plumber())
      .pipe(concat('merged.js')) // Concatenate JavaScript files
      .pipe(rename({ basename: name })); // Rename output file

    const minified = baseSource
      .pipe(clone()) // Clone the stream for minified version
      .pipe(terser()) // Minify the JavaScript
      .pipe(rename({ suffix: '.min' })); // Rename minified file

    await new Promise((resolve) => {
      merge(baseSource, minified).pipe(gulp.dest(PATHS.js.dest)).on('end', resolve); // Output JS files
    });
  }
};

/**
 * Copy font files to the build directory, flattening the directory structure.
 *
 * @returns {Promise<void>}
 */
const buildFonts = async () => {
  if (!validatePath(PATHS.fonts.src)) {
    console.log('Skipping fonts: source path does not exist or is empty');
    return;
  }

  await new Promise((resolve) => {
    gulp
      .src(PATHS.fonts.src, { encoding: false })
      .pipe(flatten()) // Flatten font files to avoid nested directories
      .pipe(gulp.dest(PATHS.fonts.dest)) // Output font files
      .on('end', resolve);
  });
};

/**
 * Optimize images (PNG, JPG, GIF, SVG) and copy to the build directory.
 *
 * @returns {Promise<void>}
 */
const buildImages = async () => {
  if (!validatePath(PATHS.images.src)) {
    console.log('Skipping images: source path does not exist or is empty');
    return;
  }

  await new Promise((resolve) => {
    gulp
      .src(PATHS.images.src, { encoding: false })
      .pipe(imagemin({ progressive: true, interlaced: true, svgoPlugins: [{ removeUnknownsAndDefaults: false }] })) // Optimize images
      .pipe(gulp.dest(PATHS.images.dest)) // Output optimized images
      .on('end', resolve);
  });
};

/**
 * Clean the build directory by deleting all previously built assets.
 *
 * @returns {Promise<void>}
 */
const cleanAssets = async () => {
  deleteSync(PATHS.dest); // Delete build directory
};

/**
 * Watch for file changes and trigger corresponding build tasks automatically.
 *
 * @returns {Promise<void>}
 */
const watchAssets = async () => {
  gulp.watch(PATHS.src + 'scss/**/*.scss', gulp.series(buildCSS)); // Watch SCSS files
  gulp.watch(PATHS.src + 'js/**/*.js', gulp.series(buildJS)); // Watch JavaScript files
  gulp.watch(PATHS.src + 'fonts/**/*', gulp.series(buildFonts)); // Watch font files
  gulp.watch(PATHS.src + 'images/**/*', gulp.series(buildImages)); // Watch image files
};

// ── Task Exports ──

/** Build CSS only. */
const css = gulp.series(buildCSS);

/** Build JavaScript only. */
const js = gulp.series(buildJS);

/** Full build: clean, then build CSS, JS, fonts, and images. */
const build = gulp.series(cleanAssets, buildCSS, buildJS, buildFonts, buildImages);

/** Watch files and rebuild on changes. */
const watcher = gulp.series(watchAssets);

// Export tasks for CLI usage
export { css, js, build, watcher as watch };
