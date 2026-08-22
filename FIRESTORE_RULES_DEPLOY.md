# Firestore rules deployment — WeSabiHub

The app is configured for Firebase project `wesabibookcare-d0ceb`.

## Consent registration rule

`firestore.rules` intentionally allows an authenticated user to create a consent record only when the record's `userId` equals the authenticated Firebase UID:

```text
match /userConsents/{id} {
  allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isStaff());
  allow create: if isSignedIn() && incoming().userId == request.auth.uid;
}
```

This is the rule used by the current application ZIP.

## Deploy

From the project root:

```bash
firebase use wesabibookcare-d0ceb
firebase deploy --only firestore:rules
```

Then verify in Firebase Console → Firestore Database → Rules that the published `/userConsents/{id}` block matches the block above.

The client also verifies that the Firebase Auth UID is the same UID used for the consent record and waits briefly for Auth state/token propagation immediately after registration, which is useful on Android and Google sign-in.
