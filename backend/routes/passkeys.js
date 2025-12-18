/**
 * Passkey Routes
 * Handles: WebAuthn passkey registration and authentication
 */

import { Router } from 'express';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

/**
 * Create and configure the passkeys router
 * @param {Object} deps - Dependencies
 */
export default function createPasskeysRouter(deps) {
  const router = Router();

  const {
    // Database
    userDb,
    passkeyDb,
    // Auth
    authenticate,
    generateToken,
    // Helpers
    getPasskeyConfig,
    isPasskeyEnabled,
    getExpectedOrigin,
    pendingPasskeyRegistrations,
    pendingPasskeyLogins,
    safeJsonParse,
    safeJsonParseArray,
    serializePasskey,
  } = deps;

  // ===== List Passkeys =====

  router.get('/', authenticate, async (req, res) => {
    try {
      const passkeys = await passkeyDb.listByUser(req.user.id);
      res.json({ passkeys: passkeys.map(serializePasskey) });
    } catch (error) {
      console.error('Failed to list passkeys:', error);
      res.status(500).json({ error: 'Unable to load passkeys' });
    }
  });

  // ===== Get Passkey Config =====

  router.get('/config', async (req, res) => {
    try {
      res.json({ enabled: await isPasskeyEnabled() });
    } catch (error) {
      console.error('Failed to load passkey config:', error);
      res.json({ enabled: true });
    }
  });

  // ===== Registration Options =====

  router.post('/registration-options', authenticate, async (req, res) => {
    try {
      if (!(await isPasskeyEnabled())) {
        return res.status(403).json({ error: 'Passkey registration is disabled by an administrator' });
      }

      const config = await getPasskeyConfig();
      const origin = getExpectedOrigin(req);

      console.log('[Passkey Registration] Configuration:', {
        rpID: config.rpID,
        rpName: config.rpName,
        expectedOrigin: origin,
        requestOrigin: req.get('origin'),
        userEmail: req.user.email
      });

      const userPasskeys = await passkeyDb.listByUser(req.user.id);

      // Filter out passkeys with invalid credential_id before converting
      const validPasskeys = userPasskeys.filter(pk =>
        pk.credential_id && typeof pk.credential_id === 'string'
      );

      console.log('[Passkey Registration] User has', validPasskeys.length, 'existing passkeys');

      const options = await generateRegistrationOptions({
        rpName: config.rpName,
        rpID: config.rpID,
        userName: req.user.email,
        userDisplayName: req.user.name || req.user.email,
        // simplewebauthn requires userID to be a BufferSource (not string)
        userID: Buffer.from(req.user.id.toString()),
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred'
        },
        excludeCredentials: validPasskeys.map((pk) => ({
          id: pk.credential_id,
          type: 'public-key',
          transports: safeJsonParse(pk.transports, undefined)
        }))
      });

      pendingPasskeyRegistrations.set(req.user.id, options.challenge);
      res.json({ options });
    } catch (error) {
      const config = await getPasskeyConfig();
      console.error('Failed to generate passkey registration options:', error);
      console.error('[Passkey Registration] RP ID:', config.rpID);
      console.error('[Passkey Registration] Expected Origin:', getExpectedOrigin(req));
      console.error('[Passkey Registration] Request Origin:', req.get('origin'));
      console.error('[Passkey Registration] Hint: Ensure PASSKEY_RP_ID matches your domain and you\'re accessing via the correct hostname (use localhost, not 127.0.0.1 for local development)');
      res.status(500).json({ error: 'Unable to start passkey registration' });
    }
  });

  // ===== Verify Registration =====

  router.post('/verify-registration', authenticate, async (req, res) => {
    try {
      if (!(await isPasskeyEnabled())) {
        return res.status(403).json({ error: 'Passkey registration is disabled by an administrator' });
      }

      const config = await getPasskeyConfig();
      const { credential, name } = req.body;
      const expectedChallenge = pendingPasskeyRegistrations.get(req.user.id);

      console.log('[Passkey Registration] Starting verification for user:', req.user.email);
      console.log('[Passkey Registration] Credential received:', {
        id: credential?.id?.substring(0, 20) + '...',
        type: credential?.type,
        hasResponse: !!credential?.response
      });

      if (!expectedChallenge) {
        return res.status(400).json({ error: 'No passkey registration in progress' });
      }

      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: getExpectedOrigin(req),
        expectedRPID: config.rpID
      });

      console.log('[Passkey Registration] Verification result:', {
        verified: verification?.verified,
        hasRegistrationInfo: !!verification?.registrationInfo
      });

      if (!verification?.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: 'Passkey registration verification failed' });
      }

      const registrationInfo = verification.registrationInfo;

      const normalizeBuffer = (value) => {
        if (!value) return undefined;

        if (typeof value === 'string') {
          try {
            return isoBase64URL.toBuffer(value);
          } catch (err) {
            console.error('[Passkey Registration] Failed to normalize string buffer:', err);
            return undefined;
          }
        }

        if (Buffer.isBuffer(value)) return value;
        if (value instanceof ArrayBuffer) return Buffer.from(value);
        if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);

        console.error('[Passkey Registration] Unsupported buffer type:', typeof value);
        return undefined;
      };

      // Handle both modern and legacy shapes of SimpleWebAuthn registrationInfo
      const credentialID =
        normalizeBuffer(registrationInfo.credentialID) ||
        normalizeBuffer(registrationInfo.credential?.credentialID || registrationInfo.credential?.id);

      const credentialPublicKey =
        normalizeBuffer(registrationInfo.credentialPublicKey) ||
        normalizeBuffer(registrationInfo.credential?.credentialPublicKey || registrationInfo.credential?.publicKey);

      const counter =
        registrationInfo.counter ??
        registrationInfo.credential?.counter ??
        0;

      const { credentialDeviceType, credentialBackedUp } = registrationInfo;

      console.log('[Passkey Registration] Extracted data:', {
        credentialIDLength: credentialID?.length || credentialID?.byteLength || 0,
        credentialIDType: typeof credentialID,
        credentialPublicKeyLength: credentialPublicKey?.length || credentialPublicKey?.byteLength || 0,
        credentialPublicKeyType: typeof credentialPublicKey,
        counter,
        credentialDeviceType,
        credentialBackedUp
      });

      const credentialIdBase64 = credentialID ? isoBase64URL.fromBuffer(credentialID) : credential?.rawId;
      const publicKeyBase64 = credentialPublicKey ? isoBase64URL.fromBuffer(credentialPublicKey) : undefined;

      if (!credentialIdBase64 || !publicKeyBase64) {
        console.error('[Passkey Registration] Missing credential data after verification:', {
          credentialIDPresent: !!credentialID,
          credentialPublicKeyPresent: !!credentialPublicKey,
          credentialIdBase64Length: credentialIdBase64?.length || 0,
          publicKeyBase64Length: publicKeyBase64?.length || 0
        });

        pendingPasskeyRegistrations.delete(req.user.id);
        return res.status(400).json({
          error: 'Passkey registration data was incomplete. Please try creating the passkey again.'
        });
      }

      console.log('[Passkey Registration] Converted to base64:', {
        credentialIdBase64Length: credentialIdBase64?.length || 0,
        publicKeyBase64Length: publicKeyBase64?.length || 0
      });

      const record = await passkeyDb.create({
        userId: req.user.id,
        name: name || 'Passkey',
        credentialId: credentialIdBase64,
        publicKey: publicKeyBase64,
        counter,
        transports: credential?.response?.transports || []
      });

      console.log('[Passkey Registration] Created record with ID:', record.id);

      pendingPasskeyRegistrations.delete(req.user.id);
      const savedPasskey = await passkeyDb.getById(record.id);

      console.log('[Passkey Registration] Retrieved saved passkey:', {
        id: savedPasskey?.id,
        credentialIdLength: savedPasskey?.credential_id?.length || 0,
        publicKeyLength: savedPasskey?.public_key?.length || 0
      });

      res.json({ passkey: serializePasskey(savedPasskey) });
    } catch (error) {
      console.error('Failed to verify passkey registration:', error);
      res.status(500).json({ error: 'Unable to verify passkey registration' });
    }
  });

  // ===== Authentication Options =====

  router.post('/auth-options', async (req, res) => {
    try {
      if (!(await isPasskeyEnabled())) {
        return res.status(403).json({ error: 'Passkey sign-in is disabled by an administrator' });
      }

      const config = await getPasskeyConfig();
      const { email } = req.body;

      // Support both email-based and passwordless (discoverable credential) flows
      let allowCredentials = undefined;
      let userId = null;

      if (email) {
        // Email-based flow: fetch user's passkeys
        const user = await userDb.getByEmail(email);
        if (!user) {
          return res.status(404).json({ error: 'No account found for this email' });
        }

        const userPasskeys = await passkeyDb.listByUser(user.id);
        console.log(`[Passkey Auth] User ${user.email} has ${userPasskeys.length} passkeys`);

        if (!userPasskeys.length) {
          return res.status(400).json({ error: 'No passkeys registered for this account. Please register a passkey first from your profile settings.' });
        }

        // Filter out passkeys with invalid credential_id and convert to buffer
        const validPasskeys = userPasskeys.filter(pk =>
          pk.credential_id && typeof pk.credential_id === 'string'
        );

        console.log(`[Passkey Auth] ${validPasskeys.length} valid passkeys out of ${userPasskeys.length} total`);

        if (validPasskeys.length === 0) {
          console.error('[Passkey Auth] Invalid passkey data detected for user:', user.email);
          console.error('[Passkey Auth] Passkey details:', userPasskeys.map(pk => ({
            id: pk.id,
            name: pk.name,
            credential_id: pk.credential_id,
            credential_id_type: typeof pk.credential_id,
            credential_id_length: pk.credential_id ? pk.credential_id.length : 0,
            public_key: pk.public_key ? 'present' : 'missing',
            created_at: pk.created_at
          })));

          // Clean up invalid passkeys automatically
          console.log('[Passkey Auth] Attempting to clean up invalid passkeys...');
          for (const pk of userPasskeys) {
            if (!pk.credential_id || typeof pk.credential_id !== 'string') {
              try {
                await passkeyDb.delete(pk.id);
                console.log(`[Passkey Auth] Deleted invalid passkey ID ${pk.id}`);
              } catch (deleteErr) {
                console.error(`[Passkey Auth] Failed to delete invalid passkey ID ${pk.id}:`, deleteErr);
              }
            }
          }

          return res.status(400).json({
            error: 'Your passkey data was corrupted and has been automatically removed. Please register a new passkey from your profile settings.'
          });
        }

        // simplewebauthn expects allowCredentials IDs to be base64url strings, not Buffers
        allowCredentials = validPasskeys.map((pk) => ({
          id: pk.credential_id,
          type: 'public-key',
          transports: safeJsonParse(pk.transports, undefined)
        }));

        userId = user.id;
      }

      // Generate authentication options
      const options = await generateAuthenticationOptions({
        rpID: config.rpID,
        userVerification: 'preferred',
        // If allowCredentials is undefined, this enables conditional mediation (passwordless)
        allowCredentials
      });

      // Store challenge for verification
      // Use challenge as key for passwordless flow, user.id for email-based flow
      const challengeKey = userId || options.challenge;
      pendingPasskeyLogins.set(challengeKey, {
        challenge: options.challenge,
        email: email || null,
        userId
      });

      res.json({ options });
    } catch (error) {
      console.error('Failed to generate passkey authentication options:', error);
      res.status(500).json({ error: 'Unable to start passkey sign in' });
    }
  });

  // ===== Verify Authentication =====

  router.post('/verify-authentication', async (req, res) => {
    try {
      if (!(await isPasskeyEnabled())) {
        return res.status(403).json({ error: 'Passkey sign-in is disabled by an administrator' });
      }

      const config = await getPasskeyConfig();
      const { email, credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: 'Credential response is required' });
      }

      // Extract the challenge from clientDataJSON so we can match the correct pending request
      let clientChallenge = null;
      try {
        const clientDataBuffer = Buffer.from(credential?.response?.clientDataJSON || '', 'base64url');
        const clientDataJson = JSON.parse(clientDataBuffer.toString('utf8'));
        if (clientDataJson?.challenge) {
          // Normalize to base64url without padding for consistent lookups
          clientChallenge = Buffer.from(clientDataJson.challenge, 'base64url').toString('base64url');
        }
      } catch (err) {
        console.warn('[Passkey Auth] Failed to parse clientDataJSON challenge:', err.message);
      }

      // Look up passkey by credential ID
      const dbPasskey = await passkeyDb.getByCredentialId(credential.id);
      if (!dbPasskey) {
        return res.status(404).json({ error: 'Passkey not recognized' });
      }

      // Validate credential_id is a string before using it
      if (!dbPasskey.credential_id || typeof dbPasskey.credential_id !== 'string') {
        return res.status(500).json({ error: 'Invalid passkey data in database' });
      }

      // Get user info
      const user = email
        ? await userDb.getByEmail(email)
        : await userDb.getById(dbPasskey.user_id);

      if (!user) {
        return res.status(404).json({ error: 'User account not found' });
      }

      // Verify passkey belongs to the user
      if (dbPasskey.user_id !== user.id) {
        return res.status(403).json({ error: 'Passkey does not belong to this account' });
      }

      // Find the pending authentication challenge
      // For email-based flow, it's keyed by user.id; for passwordless, we need to search
      let pending = pendingPasskeyLogins.get(user.id);

      if (!pending && clientChallenge) {
        pending = pendingPasskeyLogins.get(clientChallenge);
      }

      if (!pending) {
        // Search for challenge in passwordless flow storage
        for (const [_key, value] of pendingPasskeyLogins.entries()) {
          if (value.userId === null || value.userId === user.id) {
            pending = value;
            break;
          }
        }
      }

      if (!pending) {
        return res.status(400).json({ error: 'No pending passkey authentication found' });
      }

      // Verify the authentication response using the credential format expected by simplewebauthn
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: pending.challenge,
        expectedOrigin: getExpectedOrigin(req),
        expectedRPID: config.rpID,
        credential: {
          id: dbPasskey.credential_id,
          publicKey: isoBase64URL.toBuffer(dbPasskey.public_key),
          counter: typeof dbPasskey.counter === 'number' && Number.isFinite(dbPasskey.counter)
            ? dbPasskey.counter
            : 0,
          transports: safeJsonParseArray(dbPasskey.transports)
        }
      });

      if (!verification?.verified || !verification.authenticationInfo) {
        return res.status(400).json({ error: 'Passkey authentication failed' });
      }

      // Update counter and last login
      await passkeyDb.updateCounter(dbPasskey.id, verification.authenticationInfo.newCounter ?? dbPasskey.counter);
      await userDb.updateLastLogin(user.id);

      // Clean up pending authentication(s)
      pendingPasskeyLogins.delete(user.id);
      pendingPasskeyLogins.delete(pending.challenge);

      const token = generateToken(user);

      res.json({ token, user });
    } catch (error) {
      console.error('Failed to verify passkey authentication:', error);
      res.status(500).json({ error: 'Unable to verify passkey sign in' });
    }
  });

  // ===== Delete Passkey =====

  router.delete('/:id', authenticate, async (req, res) => {
    try {
      const passkey = await passkeyDb.getById(req.params.id);

      if (!passkey || passkey.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Passkey not found' });
      }

      await passkeyDb.delete(req.params.id);
      res.json({ message: 'Passkey removed' });
    } catch (error) {
      console.error('Failed to delete passkey:', error);
      res.status(500).json({ error: 'Unable to delete passkey' });
    }
  });

  return router;
}
