const fs = require('fs');

let file = 'src/pages/admin/TrainingAcademyPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { courseRepository } from '../../services/db/CourseRepository';", "import { trainingEngine } from '../../engines/TrainingEngine';");
content = content.replace(/courseRepository\.getAll\(\)/g, "trainingEngine.getAllCourses()");
content = content.replace(/await courseRepository\.update\([^;]+\);/, "");
content = content.replace(/await courseRepository\.create\([^;]+\);/, "await trainingEngine.saveCourse(currentCourse as any, 'admin');");
content = content.replace(/await courseRepository\.delete\(([^)]+)\);/g, "await trainingEngine.deleteCourse($1, 'admin');");

fs.writeFileSync(file, content, 'utf8');
