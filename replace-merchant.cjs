const fs = require('fs');
let code = fs.readFileSync('src/pages/merchant/SettingsPage.tsx', 'utf8');

// Insert imports
code = code.replace(
  "import { cn } from '@/src/lib/utils';",
  `import { cn } from '@/src/lib/utils';\nimport { useAuth } from '@/src/context/AuthContext';\nimport { userRepository } from '@/src/services/db/UserRepository';\nimport { updateProfile } from 'firebase/auth';\nimport { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';`
);

// Add useAuth
code = code.replace(
  "const [activeCategory, setActiveCategory] = useState('business');",
  "const { user, fbUser } = useAuth();\n  const [activeCategory, setActiveCategory] = useState('business');"
);

const hookLogic = `  const handleLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const storage = getStorage();
      const storageRef = ref(storage, \`avatars/\${user.uid}\`);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      if (fbUser) await updateProfile(fbUser, { photoURL: url });
      await userRepository.update(user.uid, { photoURL: url });

      setStoreLogo(url);
    } catch (err) {
      console.error("Store logo selection failed", err);
      alert('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };`;

const regex = /const handleLogoSelected = async \([\s\S]*?setIsUploading\(false\);\n    }\n  };/m;
code = code.replace(regex, hookLogic);

fs.writeFileSync('src/pages/merchant/SettingsPage.tsx', code);
