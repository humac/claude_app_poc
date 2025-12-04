import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Link,
} from '@mui/material';
import { Security, VpnKey, Fingerprint, Warning, Info } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import OIDCSettings from './OIDCSettings';

const SecuritySettings = () => {
  const { getAuthHeaders } = useAuth();
  const [passkeySettings, setPasskeySettings] = useState({
    rp_id: 'localhost',
    rp_name: 'KARS - KeyData Asset Registration System',
    origin: 'http://localhost:5173',
    managed_by_env: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchPasskeySettings();
  }, []);

  const fetchPasskeySettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/passkey-settings', {
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load passkey settings');
      }

      const data = await response.json();
      setPasskeySettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/passkey-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          rp_id: passkeySettings.rp_id,
          rp_name: passkeySettings.rp_name,
          origin: passkeySettings.origin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save passkey settings');
      }

      setSuccess(data.message || 'Passkey settings saved successfully');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security />
        Security Configuration
      </Typography>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Passkey/WebAuthn Settings */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Fingerprint color="primary" />
              <Typography variant="h6">
                Passkey/WebAuthn Configuration
              </Typography>
            </Box>

            {passkeySettings.managed_by_env && (
              <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
                Passkey settings are currently managed by environment variables. To use database configuration, remove PASSKEY_RP_ID, PASSKEY_RP_NAME, and PASSKEY_ORIGIN from your environment variables and restart the backend.
              </Alert>
            )}

            <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                <strong>What is this?</strong> Passkey settings configure how users can authenticate using biometrics (Touch ID, Face ID, Windows Hello) or hardware security keys (YubiKey).
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Restart required:</strong> Changes to passkey settings require a backend restart to take effect.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Relying Party ID (RP ID)"
                  value={passkeySettings.rp_id}
                  onChange={(e) => setPasskeySettings({ ...passkeySettings, rp_id: e.target.value })}
                  disabled={passkeySettings.managed_by_env || loading}
                  helperText="Domain name without protocol (e.g., 'localhost' or 'example.com'). MUST match the domain users access the app from."
                  required
                  sx={{ mb: 2 }}
                />

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="caption" gutterBottom>
                    <strong>Local Development:</strong>
                  </Typography>
                  <Typography variant="caption" display="block">
                    • Set to: <code>localhost</code>
                  </Typography>
                  <Typography variant="caption" display="block">
                    • Access via: <code>http://localhost:5173</code>
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    ⚠️ DO NOT access via <code>127.0.0.1</code>
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Relying Party Name (RP Name)"
                  value={passkeySettings.rp_name}
                  onChange={(e) => setPasskeySettings({ ...passkeySettings, rp_name: e.target.value })}
                  disabled={passkeySettings.managed_by_env || loading}
                  helperText="Friendly name shown to users during passkey registration"
                  required
                  sx={{ mb: 2 }}
                />

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="caption" gutterBottom>
                    <strong>Production:</strong>
                  </Typography>
                  <Typography variant="caption" display="block">
                    • Set to: <code>yourdomain.com</code>
                  </Typography>
                  <Typography variant="caption" display="block">
                    • Access via: <code>https://yourdomain.com</code>
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    • Can also use subdomain: <code>app.example.com</code>
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expected Origin"
                  value={passkeySettings.origin}
                  onChange={(e) => setPasskeySettings({ ...passkeySettings, origin: e.target.value })}
                  disabled={passkeySettings.managed_by_env || loading}
                  helperText="Full URL with protocol where your frontend is hosted"
                  required
                  placeholder="http://localhost:5173 or https://example.com"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handlePasskeySave}
                    disabled={passkeySettings.managed_by_env || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Fingerprint />}
                  >
                    {loading ? 'Saving...' : 'Save Passkey Settings'}
                  </Button>

                  <Link
                    href="https://github.com/humac/claude_app_poc/blob/main/PASSKEY-TROUBLESHOOTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <Info fontSize="small" />
                    Troubleshooting Guide
                  </Link>
                </Box>

                {!passkeySettings.managed_by_env && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      After saving, you must restart the backend for changes to take effect.
                    </Typography>
                  </Alert>
                )}
              </Grid>
            </Grid>

            {passkeySettings.updated_at && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date(passkeySettings.updated_at).toLocaleString()}
                  {passkeySettings.updated_by && ` by ${passkeySettings.updated_by}`}
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* OIDC/SSO Settings */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VpnKey color="primary" />
            <Typography variant="h6">
              OIDC/SSO Configuration
            </Typography>
          </Box>
          <OIDCSettings />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecuritySettings;
