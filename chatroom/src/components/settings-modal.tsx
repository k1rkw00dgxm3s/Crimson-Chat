import { useState } from 'react';
import { useAuth, updateProfile } from 'zitejs/auth';
import { useUpload } from 'zitejs/upload';
import { updateProfile as updateProfileApi } from 'zitejs/api';
import { toast } from 'sonner';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [saving, setSaving] = useState(false);
  const { upload, isUploading } = useUpload();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.image ?? null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed'); return; }
    try {
      const { url } = await upload(file);
      setAvatarPreview(url);
      await updateProfileApi({ image: url });
      await updateProfile({ name: `${firstName} ${lastName}`.trim() });
      toast.success('Avatar updated!');
    } catch { toast.error('Failed to upload avatar'); }
  };

  const handleSave = async () => {
    if (!firstName.trim()) { toast.error('First name is required'); return; }
    setSaving(true);
    try {
      await updateProfileApi({ firstName: firstName.trim(), lastName: lastName.trim() });
      await updateProfile({ name: `${firstName.trim()} ${lastName.trim()}`.trim(), firstName: firstName.trim(), lastName: lastName.trim() });
      toast.success('Profile updated! Refresh to see changes everywhere.');
      onClose();
    } catch { toast.error('Failed to update profile'); }
    setSaving(false);
  };

  const colors = ['bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-pink-600'];
  const name = `${firstName} ${lastName}`.trim() || 'U';
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground"><i className="fa-solid fa-gear mr-2" />Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><i className="fa-solid fa-xmark text-lg" /></button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <label className="cursor-pointer relative group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
            ) : (
              <div className={`w-20 h-20 rounded-full ${colors[idx]} flex items-center justify-center text-white text-2xl font-bold border-2 border-primary`}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">{isUploading ? '...' : 'Change'}</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploading} />
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">First Name</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Last Name</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
