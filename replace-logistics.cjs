const fs = require('fs');
let code = fs.readFileSync('src/pages/logistics/ProfilePage.tsx', 'utf8');

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

code = code.replace("export const ProfilePage = () => {  return (", hookLogic);

const imgUi = `               <div className="flex items-center gap-8 mb-10">
                  <div className="relative group w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-500/20">
                     {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full bg-primary-600 text-white flex items-center justify-center font-black text-4xl">
                           {user?.displayName?.[0] || 'L'}
                        </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/20 rounded-full">
                         <Camera size={20} />
                       </button>
                       {user?.photoURL && (
                         <button onClick={handleAvatarDelete} className="p-2 hover:bg-red-500/80 rounded-full text-red-100">
                           <Trash2 size={20} />
                         </button>
                       )}
                     </div>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black dark:text-white">{user?.displayName || 'Swift Logistics Ltd'}</h2>
`;

const regex = /<div className="flex items-center gap-8 mb-10">[\s\S]*?<h2 className="text-3xl font-black dark:text-white">.*?<\/h2>/m;
code = code.replace(regex, imgUi);

fs.writeFileSync('src/pages/logistics/ProfilePage.tsx', code);
