# Municipality Onboarding Guide

## Prerequisites

- Firebase project `servesa-aad53`
- Admin user with custom claim `roles: ['admin']`
- Official municipality code from GIS (e.g. `JHB`)

## Steps

1. Create or identify the official’s Firebase Auth user (email/password or Google).
2. Call `setOfficialClaimsFunction` as admin:

```json
{
  "uid": "<AUTH_UID>",
  "roles": ["official"],
  "municipalityCode": "JHB",
  "departmentId": "roads"
}
```

3. Official signs out/in (or refresh token) so claims apply.
4. Open https://servesa-aad53.web.app/ops
5. In **Settings**, create departments and map categories → departments.
6. Unmapped categories land in **Triage**.

## Isolation

Officials only read cases where `muniCode` matches their `municipalityCode` claim.
Admins may access all municipalities.
