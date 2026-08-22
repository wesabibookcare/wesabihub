const fs = require('fs');
const file = 'src/components/admin/verification/AuditLogsTab.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `const auditLogsRef = collection(db, 'auditLogs');
    const q = query(auditLogsRef, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLogs: AuditLog[] = [];
      snapshot.forEach(doc => {
        allLogs.push({
          id: doc.id,
          ...doc.data()
        } as AuditLog);
      });
      setLogs(allLogs);
      setFilteredLogs(allLogs);
      setLoading(false);
    });`;

const replacement = `const unsubscribe = auditRepository.subscribeToQuery([orderBy('timestamp', 'desc'), limit(100)], (data) => {
      setLogs(data as any);
      setFilteredLogs(data as any);
      setLoading(false);
    });`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
