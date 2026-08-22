const fs = require('fs');

let file = 'src/pages/admin/AdminContentCMSPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { FAQ } from '../../services/db/FAQRepository';", "import { FAQ } from '../../services/db/FAQRepository';\nimport { PageContent } from '../../services/db/PageContentRepository';\nimport { useAuth } from '../../context/AuthContext';");

content = content.replace("export const AdminContentCMSPage = () => {", "export const AdminContentCMSPage = () => {\n  const { user } = useAuth();");

fs.writeFileSync(file, content, 'utf8');

// Also knowledge center page if it uses user
let file2 = 'src/pages/admin/KnowledgeCenterPage.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
if (content2.includes('user!')) {
  content2 = content2.replace("import React,", "import { useAuth } from '../../context/AuthContext';\nimport React,");
  content2 = content2.replace("export const KnowledgeCenterPage = () => {", "export const KnowledgeCenterPage = () => {\n  const { user } = useAuth();");
  fs.writeFileSync(file2, content2, 'utf8');
}
