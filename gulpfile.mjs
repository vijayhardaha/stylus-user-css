/**
 * ======================================================================
 * Gulp Build Tasks
 * ======================================================================
 * Purpose: Task definitions for building and watching SCSS -> CSS outputs.
 * Docs:    https://gulpjs.com/docs/en/getting-started/quick-start
 * ======================================================================
 */

import { deleteSync } from 'del'; // Delete files and directories
import { mkdirp } from 'mkdirp'; // Create directories recursively
import * as dartSass from 'sass'; // Compile SCSS to CSS
import autoprefixer from 'autoprefixer'; // Autoprefix CSS properties
import cleancss from 'gulp-clean-css'; // Minify CSS
import duplicates from 'postcss-discard-duplicates'; // Remove duplicate CSS rules
import fs from 'fs'; // File system operations
import gulp from 'gulp'; // Gulp task runner
import gulpSass from 'gulp-sass'; // Compile SCSS to CSS
import log from 'fancy-log'; // Gulp-style logger with timestamp prefix
import mergeRules from 'postcss-merge-rules'; // Merge CSS rules
import path from 'path'; // Path utilities for file system operations
import plumber from 'gulp-plumber'; // Handle errors gracefully
import postcss from 'gulp-postcss'; // Process CSS with PostCSS
import rename from 'gulp-rename'; // Rename files
import size from 'gulp-size'; // Display file size information
import sourcemaps from 'gulp-sourcemaps'; // Generate source maps for debugging

/** Sass compiler instance configured for Gulp pipelines. */
const sass = gulpSass(dartSass);

/** True when running in production mode. */
const isProduction = process.env.NODE_ENV === 'production';

/** Parsed package metadata used by startup banner. */
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

/** CleanCSS optimization levels shared across CSS output variants. */
const cssOptimizationLevels = {
  1: {
    cleanupCharsets: true,
    optimizeBackground: true,
    optimizeBorderRadius: true,
    optimizeFontWeight: true,
    optimizeOutline: true,
    removeNegativePaddings: true,
    removeQuotes: true,
    removeWhitespace: true,
    roundingPrecision: 2,
    selectorsSortingMethod: 'standard',
    specialComments: 1,
    tidyAtRules: true,
    tidyBlockScopes: true,
    tidySelectors: true,
  },
  2: {
    mergeAdjacentRules: true,
    mergeIntoShorthands: true,
    mergeMedia: true,
    mergeNonAdjacentRules: true,
    mergeSemantically: false,
    overrideProperties: true,
    removeEmpty: true,
    reduceNonAdjacentRules: true,
    removeDuplicateFontRules: true,
    removeDuplicateMediaBlocks: true,
    removeDuplicateRules: true,
    removeUnusedAtRules: false,
    restructureRules: true,
  },
};

/** Shared Sass compiler options for all SCSS entry builds. */
const sassCompilerOptions = {
  quietDeps: true,
  silenceDeprecations: ['moz-document'],
  verbose: false,
  logger: sass.compiler.Logger.silent,
};

/**
 * Ensure a directory exists before read/write operations.
 *
 * @param {string} dir - Directory path to create if missing.
 * @returns {Promise<void>}
 */
const ensureDir = async (dir) => {
  try {
    await mkdirp(dir);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
};

/**
 * Print a startup banner with package metadata and runtime mode.
 *
 * @returns {void}
 */
const printStartupBanner = () => {
  const mode = isProduction ? 'production' : 'development';
  const author = typeof packageJson.author === 'string' ? packageJson.author : packageJson.author?.name || 'Unknown';
  const lines = [
    `Project : ${packageJson.name}`,
    `Version : ${packageJson.version}`,
    `Author  : ${author}`,
    `Mode    : ${mode}`,
    'Message : Build pipeline initialized',
  ];
  const width = Math.max(...lines.map((line) => line.length));
  const border = `+${'-'.repeat(width + 2)}+`;

  console.log(border);
  for (const line of lines) {
    console.log(`| ${line.padEnd(width)} |`);
  }
  console.log(border);
};

/**
 * Create a reusable plumber error handler for build streams.
 *
 * @param {string} taskName - Task label for contextual error logs.
 * @returns {(this: import('stream').Transform, err: Error) => void} Error handler callback.
 */
const createErrorHandler = (taskName) => {
  return function onStreamError(err) {
    log(`${taskName} Error: ${err.message}`);
    this.emit('end');
  };
};

/**
 * Validates file paths to prevent directory traversal attacks.
 *
 * @param {string} filePath - The path to validate.
 * @returns {boolean} True if path is valid, false otherwise.
 */
const isValidPath = (filePath) => {
  try {
    const resolvedPath = path.resolve(filePath);
    return resolvedPath.startsWith(process.cwd());
  } catch (error) {
    console.error('Path validation error:', error);
    return false;
  }
};

/**
 * Display total size information for generated CSS assets.
 *
 * @returns {Promise<void>}
 */
const displayTotalSize = async () => {
  // Resolve root output directory.
  const destination = path.join(process.cwd(), 'dist');
  // Ensure destination exists before reading/reporting.
  await ensureDir(destination);

  if (!isValidPath(destination)) {
    // Skip when output root is unavailable.
    log(`Skipping size report: ${destination} does not exist or is empty`);
    return;
  }

  // Quick check for generated files in output root.
  const hasFiles = fs.readdirSync(destination).length > 0;
  if (!hasFiles) {
    // Skip size plugin on empty output.
    log(`Skipping size report: No files found in ${destination}`);
    return;
  }

  // Configure gzip-aware size reporter.
  const sizeTracker = size({ showFiles: true, title: 'CSS Output:', gzip: true });
  const stream = gulp
    // Read built CSS files from destination.
    .src('dist/**/*.css')
    // Print per-file and aggregate sizes.
    .pipe(sizeTracker)
    .on('end', () => {
      // Force finish so gulp waits for final size logs.
      sizeTracker.emit('finish');
    });

  await new Promise((resolve, reject) => {
    // Resolve when size reporting is complete.
    stream.on('finish', resolve);
    // Fail task on stream errors.
    stream.on('error', reject);
  });
};

/**
 * Build CSS from SCSS files (excludes partials starting with _).
 * Handles compilation, prefixing, minification, and source maps.
 *
 * @returns {NodeJS.ReadableStream} The gulp stream.
 */
const buildCSS = () => {
  return (
    gulp
      .src(['src/**/*.scss', '!src/**/_*.scss'])
      .pipe(plumber({ errorHandler: createErrorHandler('buildCSS') }))
      // Initialize source maps
      .pipe(sourcemaps.init())
      // Compile SCSS to CSS
      .pipe(sass({ ...sassCompilerOptions }).on('error', sass.logError))
      // Process CSS with PostCSS plugins
      .pipe(postcss([duplicates(), mergeRules(), autoprefixer()]))
      // Minify CSS
      .pipe(cleancss({ format: 'beautify', level: cssOptimizationLevels }))
      // Write source maps
      .pipe(sourcemaps.write('.'))
      // Add .user suffix to output files
      .pipe(rename({ suffix: '.user' }))
      // Process file paths
      .pipe(
        rename((pathObj) => {
          // Validate path to prevent directory traversal
          if (!isValidPath(pathObj.dirname)) {
            throw new Error(`Invalid path detected: ${pathObj.dirname}`);
          }
          // Remove 'styles/' from the path (src/styles/font-overrides/ -> dist/font-overrides/)
          pathObj.dirname = pathObj.dirname.replace(/^styles\/?/, '');
        })
      )
      // Output final files to dist directory
      .pipe(gulp.dest('dist'))
  );
};

/**
 * Clean the build directory by deleting the 'dist' directory.
 * Handles errors during the cleaning process.
 */
const cleanAssets = async () => {
  try {
    log('Cleaning dist directory...');
    deleteSync('dist');
  } catch (error) {
    console.error('Error cleaning assets:', error);
    throw error;
  }
};

/**
 * Watch for changes in SCSS files and trigger the build process.
 * Provides feedback on file changes and errors.
 */
const watchAssets = () => {
  console.log('Starting SCSS file watcher...');
  const watcher = gulp.watch('src/**/*.scss', {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });

  watcher.on('change', (filePath) => {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`File changed: ${relativePath}`);
    buildCSS((error) => {
      if (error) {
        log(`buildCSS Error: ${error.message}`);
      }
    });
  });

  watcher.on('add', (filePath) => {
    console.log(`New file added: ${path.relative(process.cwd(), filePath)}`);
  });

  watcher.on('unlink', (filePath) => {
    console.log(`File removed: ${path.relative(process.cwd(), filePath)}`);
  });

  watcher.on('error', (error) => {
    log(`watch Error: ${error.message}`);
  });

  return watcher;
};

// Define the main build task sequence
const build = gulp.series(cleanAssets, buildCSS, displayTotalSize);
const dev = gulp.series(build, watchAssets);

// Print startup banner.
printStartupBanner();

// Export the 'build' task and rename 'watchAssets' to 'watch' for better clarity.
export { build, watchAssets as watch };
export default dev;
