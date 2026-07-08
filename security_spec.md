# CiviQ Security Specification & Threat Model (TDD Spec)

## 1. Data Invariants & Access Control Policy
- **Users**: Users can only write or modify their own user profile document. Role updates are immutable for standard users to prevent self-privilege escalation to `admin`.
- **Reports**: Any authenticated user can read or list reports. Only the user who created the report can set their `reporterId` to match their authenticated UID. All timestamp fields must be securely validated.
- **Comments**: Only authenticated users can comment, and they must not spoof their identity.
- **Notifications**: Users can read/list/update only their own notifications.

## 2. The "Dirty Dozen" Threat Payloads (Targeting Permission Denied)
1. **Self-Assigned Admin Escalation**: Standard citizen attempting to register/update their profile with `role: "admin"`.
2. **Profile Hijacking**: Authenticated user trying to write to `/users/someone_else_uid`.
3. **Report Identity Spoofing**: Citizen submitting a report with a `reporterId` of another user.
4. **Report Ghost Field Injection**: Standard user updating a report with a custom non-schema field.
5. **Unauthorized Report Deletion**: Any non-admin citizen attempting to delete a report.
6. **Admin State Shortcutting**: Citizen bypassing verification thresholds by manually setting `status: "resolved"` or `verificationStatus: "verified"`.
7. **Comment Identity Spoofing**: User posting a comment with someone else's `userId`.
8. **Direct Notification Spoofing**: User creating a read notification directly for another user without authentication.
9. **Notification Eavesdropping**: User trying to read notifications that belong to a different `userId`.
10. **Report Timestamp Poisoning**: Setting a future client-side timestamp on a report instead of standard ISO date.
11. **Vote Count Manipulation**: Citizen directly updating report upvotes/downvotes count by +100 instead of single increment.
12. **Malicious ID Poisoning**: Trying to create a report with a massive, malicious document ID.

## 3. Test Cases Configuration (`firestore.rules.test.ts` Draft)
All of the above payloads must return `PERMISSION_DENIED` during actual write validation. These rules will be implemented in `firestore.rules` and validated using secure assertions.
