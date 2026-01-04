import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { User, Shield, Key, Loader2, Check, X, Trash2, Pencil, Mail, UserCheck, Users } from 'lucide-react';
import MFASetupModal from './MFASetupModal';
import { prepareCreationOptions, uint8ArrayToBase64Url } from '@/utils/webauthn';

const Profile = () => {
  const { user, getAuthHeaders, updateUser } = useAuth();
  const { toast } = useToast();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    manager_first_name: '',
    manager_last_name: '',
    manager_email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile image
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageName, setProfileImageName] = useState('');

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showDisableMFA, setShowDisableMFA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Passkeys state
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        manager_first_name: user.manager_first_name || '',
        manager_last_name: user.manager_last_name || '',
        manager_email: user.manager_email || ''
      });
      setProfileImage(user.profile_image || null);
      setProfileImageName(user.profile_image ? 'Current profile image' : '');
    }
  }, [user]);

  // Fetch MFA status
  useEffect(() => {
    const fetchMFAStatus = async () => {
      try {
        const response = await fetch('/api/auth/mfa/status', { headers: getAuthHeaders() });
        const data = await response.json();
        if (response.ok) setMfaEnabled(data.enabled);
      } catch (err) {
        console.error('Failed to fetch MFA status:', err);
      }
    };
    fetchMFAStatus();
    fetchPasskeys();
  }, [getAuthHeaders]);

  const fetchPasskeys = async () => {
    setPasskeyLoading(true);
    try {
      const response = await fetch('/api/auth/passkeys', { headers: { ...getAuthHeaders() } });
      const data = await response.json();
      if (response.ok) setPasskeys(data.passkeys || []);
    } catch (err) {
      console.error('Failed to load passkeys:', err);
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        profile_image: profileImage ?? null
      };
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(submitData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');
      toast({ title: "Success", description: "Profile updated successfully", variant: "success" });
      updateUser(data.user);
      setIsEditing(false);
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        manager_first_name: user.manager_first_name || '',
        manager_last_name: user.manager_last_name || '',
        manager_email: user.manager_email || ''
      });
      setProfileImage(user.profile_image || null);
      setProfileImageName(user.profile_image ? 'Current profile image' : '');
    }
    setIsEditing(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(passwordData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password');
      toast({ title: "Success", description: "Password changed successfully", variant: "success" });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleMFASetupComplete = () => {
    setMfaEnabled(true);
    setShowMFASetup(false);
    toast({ title: "Success", description: "Two-factor authentication enabled", variant: "success" });
  };

  const handleDisableMFA = async () => {
    if (!disablePassword) {
      toast({ title: "Error", description: "Password is required", variant: "destructive" });
      return;
    }
    setMfaLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to disable MFA');
      setMfaEnabled(false);
      setShowDisableMFA(false);
      setDisablePassword('');
      toast({ title: "Success", description: "Two-factor authentication disabled", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setMfaLoading(false);
    }
  };

  const handlePasskeyRegistration = async () => {
    if (!window.PublicKeyCredential) {
      toast({ title: "Error", description: "Passkeys not supported in this browser", variant: "destructive" });
      return;
    }
    setPasskeyLoading(true);
    try {
      const optionsResponse = await fetch('/api/auth/passkeys/registration-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      const optionsData = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(optionsData.error || 'Unable to start passkey setup');
      const creationOptions = prepareCreationOptions(optionsData.options);
      const credential = await navigator.credentials.create({ publicKey: creationOptions });
      if (!credential) throw new Error('No credential was returned');
      const verificationPayload = {
        name: newPasskeyName.trim() || 'Passkey',
        credential: {
          id: credential.id,
          rawId: uint8ArrayToBase64Url(credential.rawId),
          type: credential.type,
          response: {
            clientDataJSON: uint8ArrayToBase64Url(credential.response.clientDataJSON),
            attestationObject: uint8ArrayToBase64Url(credential.response.attestationObject),
            transports: typeof credential.response.getTransports === 'function' ? credential.response.getTransports() : [],
          },
        },
      };
      const verifyResponse = await fetch('/api/auth/passkeys/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(verificationPayload),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyData.error || 'Unable to save passkey');
      setPasskeys((prev) => [verifyData.passkey, ...prev.filter((pk) => pk.id !== verifyData.passkey.id)]);
      toast({ title: "Success", description: "Passkey added successfully", variant: "success" });
      setNewPasskeyName('');
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async (passkeyId) => {
    setPasskeyLoading(true);
    try {
      const response = await fetch(`/api/auth/passkeys/${passkeyId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete passkey');
      setPasskeys((prev) => prev.filter((pk) => pk.id !== passkeyId));
      toast({ title: "Success", description: "Passkey removed", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPasskeyLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : 'Never';

  const getRoleClass = (role) => ({
    admin: 'glow-destructive',
    manager: 'glow-success',
    coordinator: 'glow-primary',
    employee: 'glow-muted'
  }[role] || 'glow-muted');

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Profile images must be 5MB or smaller.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
    setProfileImageName(file.name);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImageName('');
  };

  return (
    <div className="space-y-6 p-1 md:p-2 animate-fade-in bg-surface/30 min-h-screen rounded-2xl">
      {/* Information Section */}
      <section className="glass-panel rounded-2xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md bg-primary/10 border-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-gradient text-lg sm:text-xl font-semibold">Information</h2>
              <p className="text-xs text-muted-foreground">Your personal profile details</p>
            </div>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="btn-interactive gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="btn-interactive"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-interactive"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {isEditing ? (
            /* Edit Mode */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <Avatar className="h-16 w-16">
                  {profileImage && <AvatarImage src={profileImage} alt="Profile" />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {formData.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">Profile Picture</p>
                  <Input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => document.getElementById('profile-image')?.click()}
                      className="btn-interactive"
                    >
                      Choose Image
                    </Button>
                    {profileImage && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRemoveImage}
                        className="btn-interactive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG, or SVG up to 5MB</p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">First Name</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Last Name</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    className="text-base"
                  />
                </div>
              </div>

              {/* Manager Fields */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Manager Information</p>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Manager First Name</Label>
                    <Input
                      value={formData.manager_first_name}
                      onChange={(e) => setFormData({ ...formData, manager_first_name: e.target.value })}
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Manager Last Name</Label>
                    <Input
                      value={formData.manager_last_name}
                      onChange={(e) => setFormData({ ...formData, manager_last_name: e.target.value })}
                      className="text-base"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Manager Email</Label>
                  <Input
                    type="email"
                    value={formData.manager_email}
                    onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                    className="text-base"
                  />
                </div>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {user?.profile_image && <AvatarImage src={user.profile_image} alt="Profile" />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {user?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.email}
                  </h3>
                  <Badge className={`${getRoleClass(user?.role)} mt-1`}>
                    {user?.role?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-4 glass-panel rounded-xl">
                  <div className="icon-box icon-box-sm bg-info/10 border-info/20">
                    <Mail className="h-4 w-4 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="caption-label">Email</p>
                    <p className="font-medium text-sm truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 glass-panel rounded-xl">
                  <div className="icon-box icon-box-sm bg-success/10 border-success/20">
                    <UserCheck className="h-4 w-4 text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="caption-label">Name</p>
                    <p className="font-medium text-sm">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 glass-panel rounded-xl sm:col-span-2">
                  <div className="icon-box icon-box-sm bg-warning/10 border-warning/20">
                    <Users className="h-4 w-4 text-warning" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="caption-label">Manager</p>
                    <p className="font-medium text-sm">
                      {user?.manager_first_name && user?.manager_last_name
                        ? `${user.manager_first_name} ${user.manager_last_name}`
                        : 'Not set'}
                      {user?.manager_email && (
                        <span className="text-muted-foreground ml-2">({user.manager_email})</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Security Section */}
      <section className="glass-panel rounded-2xl">
        <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-white/10">
          <div className="icon-box icon-box-md bg-destructive/10 border-destructive/20">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-gradient text-lg sm:text-xl font-semibold">Security</h2>
            <p className="text-xs text-muted-foreground">Manage your password and authentication methods</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Password Change */}
          <div className="glass-panel rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-4">Change Password</h4>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label className="text-sm">Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  minLength={6}
                  required
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  minLength={6}
                  required
                  className="text-base"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={passwordLoading}
                className="btn-interactive"
              >
                {passwordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Two-Factor Authentication</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Add extra security with a verification code from your authenticator app.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {mfaEnabled ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm text-success font-medium">Enabled</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Disabled</span>
                    </>
                  )}
                </div>
                {mfaEnabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDisableMFA(true)}
                    className="btn-interactive"
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setShowMFASetup(true)}
                    className="btn-interactive"
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Passkeys */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <h4 className="text-sm font-semibold">Passkeys</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Use passkeys for fast, secure passwordless sign-in with Face ID, Touch ID, or Windows Hello.
            </p>

            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Input
                  placeholder="Passkey name (e.g., MacBook Touch ID)"
                  value={newPasskeyName}
                  onChange={(e) => setNewPasskeyName(e.target.value)}
                  className="flex-1 min-w-[200px]"
                />
                <Button
                  size="sm"
                  onClick={handlePasskeyRegistration}
                  disabled={passkeyLoading}
                  className="btn-interactive"
                >
                  {passkeyLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Key className="h-4 w-4 mr-2" />
                  Add Passkey
                </Button>
              </div>

              {passkeys.length === 0 ? (
                <p className="text-xs text-muted-foreground">No passkeys registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {passkeys.map((pk, index) => (
                    <div
                      key={pk.id}
                      className="flex items-center justify-between p-3 glass-panel rounded-lg animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{pk.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Created {formatDate(pk.created_at)} | Last used {formatDate(pk.last_used_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleDeletePasskey(pk.id)}
                        disabled={passkeyLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MFA Setup Modal */}
      <MFASetupModal
        open={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        onComplete={handleMFASetupComplete}
        getAuthHeaders={getAuthHeaders}
      />

      {/* Disable MFA Dialog */}
      <Dialog open={showDisableMFA} onOpenChange={(open) => {
        setShowDisableMFA(open);
        if (!open) setDisablePassword('');
      }}>
        <DialogContent className="glass-overlay">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              This will make your account less secure. Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisableMFA(false)}
              className="btn-interactive"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMFA}
              disabled={mfaLoading || !disablePassword}
              className="btn-interactive"
            >
              {mfaLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Disable MFA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
