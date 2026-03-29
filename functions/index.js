const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.createStaffUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in.'
    );
  }

  const callerToken = context.auth.token || {};
  const callerRole = String(callerToken.role || '').toLowerCase();

  if (callerRole !== 'admin' && callerRole !== 'supervisor') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admin or supervisor can create staff.'
    );
  }

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const phone = String(data.phone || '').trim();
  const role = String(data.role || 'teller').trim().toLowerCase();
  const branchName = String(data.branchName || '').trim();
  const branchId = String(data.branchId || '').trim();
  const temporaryPassword = String(data.temporaryPassword || '').trim();

  if (!name || !email || !temporaryPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Name, email, and temporary password are required.'
    );
  }

  if (temporaryPassword.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Temporary password must be at least 6 characters.'
    );
  }

  if (!['teller', 'agent', 'admin', 'supervisor'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid role.'
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password: temporaryPassword,
      displayName: name,
      disabled: false,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role,
    });

    await admin.firestore().collection('users').doc(email).set({
      uid: userRecord.uid,
      name,
      email,
      phone,
      role,
      branchName,
      branchId,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUid: context.auth.uid,
    });

    return {
      success: true,
      uid: userRecord.uid,
      message: 'Staff user created successfully.',
    };
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError(
        'already-exists',
        'This email is already in use.'
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to create staff user.'
    );
  }
});