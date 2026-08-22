const fs = require('fs');

function injectHooks(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  const hookLogic = `
export const ProfilePage = () => {
  const { user, fbUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    const storage = getStorage();
    const storageRef = ref(storage, \`avatars/\${user.uid}\`);

    setIsUploading(true);
    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      if (fbUser) await updateProfile(fbUser, { photoURL: url });
      await userRepository.update(user.uid, { photoURL: url });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!user || !user.photoURL) return;
    const storage = getStorage();
    const storageRef = ref(storage, \`avatars/\${user.uid}\`);
    try {
      await deleteObject(storageRef);
      if (fbUser) await updateProfile(fbUser, { photoURL: '' });
      await userRepository.update(user.uid, { photoURL: '' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
`;

  code = code.replace("export const ProfilePage = () => {\n  return (", hookLogic);
  code = code.replace("export const ProfilePage = () => {  return (", hookLogic);
  fs.writeFileSync(filepath, code);
}

injectHooks('src/pages/logistics/ProfilePage.tsx');
injectHooks('src/pages/point/ProfilePage.tsx');
