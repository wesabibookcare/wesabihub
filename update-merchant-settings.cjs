const fs = require('fs');
let code = fs.readFileSync('src/pages/merchant/SettingsPage.tsx', 'utf8');

// Replace states
code = code.replace(
  'const [merchantBus, setMerchantBus] = useState<MerchantBusiness | null>(null);',
  `const [merchantBus, setMerchantBus] = useState<MerchantBusiness | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [brandColor, setBrandColor] = useState('#7C3AED');
  const [storeTheme, setStoreTheme] = useState('modern');`
);

// Populate states
code = code.replace(
  'setMerchantBus(business);',
  `setMerchantBus(business);
          setBusinessName(business.name);
          setBusinessDesc(business.description || '');`
);

// Implement actual handleSave
code = code.replace(
  /const handleSave = async \(\) => {[\s\S]*?};/,
  `const handleSave = async () => {
    setSaving(true);
    try {
      if (user && merchantBus) {
        await merchantBusinessRepository.update(merchantBus.id, {
          name: businessName,
          description: businessDesc
        });
      }
      setShowSaved(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };`
);

// Update inputs
code = code.replace(
  '<Input defaultValue={merchantBus?.name || \'\'} />',
  '<Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />'
);

code = code.replace(
  '<textarea className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white text-sm font-semibold" defaultValue={merchantBus?.description || \'\'} />',
  '<textarea className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white text-sm font-semibold" value={businessDesc} onChange={(e) => setBusinessDesc(e.target.value)} />'
);

// Update Brand Color
code = code.replace(
  /color === '#7C3AED' \? "border-primary-500 scale-110 shadow-lg" : "border-transparent"/g,
  'color === brandColor ? "border-primary-500 scale-110 shadow-lg" : "border-transparent"'
);
code = code.replace(
  /className={cn\([\s\S]*?color === brandColor[\s\S]*?\)}/g,
  `$& onClick={() => setBrandColor(color)}`
);

// Update Store Theme
code = code.replace(
  '<div className="p-4 rounded-2xl border-2 border-primary-500 bg-primary-500/5 cursor-pointer transition-all active:scale-95">',
  '<div className={cn("p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95", storeTheme === "modern" ? "border-primary-500 bg-primary-500/5" : "border-slate-200 dark:border-slate-800 hover:border-slate-300")} onClick={() => setStoreTheme("modern")}>'
);

code = code.replace(
  '<div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all cursor-pointer active:scale-95">',
  '<div className={cn("p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95", storeTheme === "classic" ? "border-primary-500 bg-primary-500/5" : "border-slate-200 dark:border-slate-800 hover:border-slate-300")} onClick={() => setStoreTheme("classic")}>'
);

fs.writeFileSync('src/pages/merchant/SettingsPage.tsx', code);
