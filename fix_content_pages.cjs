const fs = require('fs');

function replaceInFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed ${file}`);
}

replaceInFile('src/pages/admin/GlobalSettingsPage.tsx', [
  { from: /import \{ faqRepository, FAQ \} from '\.\.\/\.\.\/services\/db\/FAQRepository';/, to: "import { contentEngine } from '../../engines/ContentEngine';\nimport { FAQ } from '../../services/db/FAQRepository';" },
  { from: /import \{ knowledgeRepository, KnowledgeArticle \} from '\.\.\/\.\.\/services\/db\/KnowledgeRepository';/, to: "import { KnowledgeArticle } from '../../services/db/KnowledgeRepository';" },
  { from: /faqRepository\.getAll\(\)/g, to: "contentEngine.getAllFaqs()" },
  { from: /knowledgeRepository\.getAll\(\)/g, to: "contentEngine.getAllArticles()" }
]);

replaceInFile('src/pages/admin/KnowledgeCenterPage.tsx', [
  { from: /import \{ knowledgeRepository, KnowledgeArticle \} from '\.\.\/\.\.\/services\/db\/KnowledgeRepository';/, to: "import { contentEngine } from '../../engines/ContentEngine';\nimport { KnowledgeArticle } from '../../services/db/KnowledgeRepository';" },
  { from: /knowledgeRepository\.getAll\(\)/g, to: "contentEngine.getAllArticles()" },
  { from: /knowledgeRepository\.update\(([^,]+),\s*([^)]+)\)/g, to: "contentEngine.updateArticle($1, $2, user!.uid)" } // user might not be in scope, but let's check
]);

replaceInFile('src/pages/admin/AdminContentCMSPage.tsx', [
  { from: /import \{ faqRepository, FAQ \} from '\.\.\/\.\.\/services\/db\/FAQRepository';/, to: "import { contentEngine } from '../../engines/ContentEngine';\nimport { FAQ } from '../../services/db/FAQRepository';" },
  { from: /import \{ pageContentRepository, PageContent \} from '\.\.\/\.\.\/services\/db\/PageContentRepository';/, to: "" },
  { from: /await faqRepository\.getAll\(\)/g, to: "await contentEngine.getAllFaqs()" },
  { from: /await pageContentRepository\.getPageContent\(([^)]+)\)/g, to: "await contentEngine.getPageContent($1)" },
  { from: /await pageContentRepository\.updatePageContent\(([^,]+),\s*\{ content \}\)/g, to: "await contentEngine.updatePageContent($1, content, user!.uid)" },
  { from: /await faqRepository\.create\(([^,]+),\s*([^)]+)\)/g, to: "await contentEngine.createFaq($2, user!.uid)" },
  { from: /await faqRepository\.delete\(([^)]+)\)/g, to: "await contentEngine.deleteFaq($1, user!.uid)" }
]);

replaceInFile('src/pages/public/FAQPage.tsx', [
  { from: /import \{ faqRepository \} from '@\/src\/services\/db\/FAQRepository';/g, to: "import { contentEngine } from '@/src/engines/ContentEngine';" },
  { from: /faqRepository\.getAll\(\)/g, to: "contentEngine.getAllFaqs()" }
]);
