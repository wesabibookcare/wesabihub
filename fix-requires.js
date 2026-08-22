const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;

  // Find standard uses of require that just assign from it.
  // const { something } = require('...');

  // Actually, wait, some are dynamic, inside functions.
  // We can change `require('...')` to `(await import('...'))` in async functions,
  // but if the function isn't async, that breaks.
  // But wait, all those engines and repos are just classes/singletons.
  // We can just add the import to the top of the file and replace the `require` with nothing.
}
