const fs = require('fs');
const file = 'src/pages/logistics/DriversPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ collection, query, where, getDocs, doc, updateDoc, writeBatch \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '@\/src\/lib\/firebase';/, "");

if (!content.includes('userRepository')) {
  content = content.replace("import { logisticsEngine, invitationEngine } from '@/src/engines';", "import { logisticsEngine, invitationEngine } from '@/src/engines';\nimport { userRepository } from '@/src/services/db/UserRepository';");
}

// Remove writeBatch and use repository
const handleUpdateStatusRegex = /const handleUpdateStatus = async \(driverId: string, newStatus: DriverStatus, message: string\) => \{[\s\S]*?toast\.success\(message\);\n\s*\} catch \(error: any\) \{[\s\S]*?\}\n\s*\};\n/;
content = content.replace(handleUpdateStatusRegex, `
  const handleUpdateStatus = async (driverId: string, newStatus: DriverStatus, message: string) => {
    try {
      await userRepository.update(driverId, {
        'driverProfile.status': newStatus,
        updatedAt: new Date().toISOString()
      } as any);

      await profileUpdateAuditService.logChange({
        userId: driverId,
        changedBy: user!.uid,
        action: 'UPDATE_DRIVER_STATUS',
        changes: { status: { old: '', new: newStatus } }
      });

      setDrivers(prev => prev.map(d =>
        d.id === driverId
          ? { ...d, driverProfile: { ...d.driverProfile, status: newStatus } as any }
          : d
      ));
      toast.success(message);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.message || 'Failed to update driver status');
    }
  };
`);

fs.writeFileSync(file, content);
console.log('DriversPage patched');
