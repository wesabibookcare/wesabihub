const fs = require('fs');
let content = fs.readFileSync('src/services/db/BaseRepository.ts', 'utf8');

// fix docData
content = content.replace(
  'await setDoc(this.getDocRef(id), docData as T);',
  'await setDoc(this.getDocRef(id), JSON.parse(JSON.stringify(docData)) as T);'
);

// fix updateData
content = content.replace(
  'await updateDoc(this.getDocRef(id), updateData as DocumentData);',
  'await updateDoc(this.getDocRef(id), JSON.parse(JSON.stringify(updateData)));'
);

fs.writeFileSync('src/services/db/BaseRepository.ts', content, 'utf8');
