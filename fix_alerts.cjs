const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('alert(')) {
    // Basic text alerts
    content = content.replace(/alert\((['"`])(.*?)\1\)/g, (match, quote, message) => {
      changed = true;
      if (message.toLowerCase().includes('fail') || message.toLowerCase().includes('error')) {
        return `toast.error(${quote}${message}${quote})`;
      } else {
        return `toast.success(${quote}${message}${quote})`;
      }
    });

    // Also handle alert(err.message || ...)
    content = content.replace(/alert\(([^)]+)\)/g, (match, inside) => {
        if(match.includes('toast')) return match;
        changed = true;
        if (inside.toLowerCase().includes('fail') || inside.toLowerCase().includes('error') || inside.includes('err.message')) {
            return `toast.error(${inside})`;
        } else {
            return `toast.success(${inside})`;
        }
    });

    if (changed && !content.includes("import { toast } from 'sonner'") && !content.includes('import { toast } from "sonner"')) {
        content = `import { toast } from 'sonner';\n` + content;
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
