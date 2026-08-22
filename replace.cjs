const fs = require('fs');
let code = fs.readFileSync('src/pages/point/ProfilePage.tsx', 'utf8');

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

// now we also need to hook up the UI
// Find the img and change it
const imgUi = `                 <div className="relative group">
                    <img
                       src={user?.photoURL || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80"}
                       className="w-32 h-32 rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl object-cover"
                      alt="Profile"
                    />
                    <div className="absolute inset-0 bg-black/40 text-white rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/20 rounded-full">
                         <Camera size={24} />
                       </button>
                       {user?.photoURL && (
                         <button onClick={handleAvatarDelete} className="p-2 hover:bg-red-500/80 rounded-full text-red-100">
                           <Trash2 size={24} />
                         </button>
                       )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                 </div>
                 <div className="pb-2 space-y-1">
                    <div className="flex items-center gap-3">
                       <h1 className="text-3xl font-black dark:text-white font-display">{user?.displayName || 'Hub Name'}</h1>
`;

const regex = /<div className="relative group">[\s\S]*?<h1 className="text-3xl font-black dark:text-white font-display">.*?<\/h1>/m;
code = code.replace(regex, imgUi);

fs.writeFileSync('src/pages/point/ProfilePage.tsx', code);
