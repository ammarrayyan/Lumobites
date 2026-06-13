# Future Design: Admin "Delete User Data" Tool

This document outlines the proposed design and queries for a unified user data deletion utility inside the Lumo Bites admin panel.

## 1. UI Integration

In `components/admin/AccountManagement.tsx`, we can introduce a dedicated utility section at the top of the panel:

```tsx
/* Mock UI Component Addition */
<div className="bg-red-50/50 border border-red-100 rounded-xl p-6 mb-8">
  <h3 className="text-lg font-bold text-red-800 mb-2">Force Delete User Data</h3>
  <p className="text-sm text-red-600 mb-4">
    Warning: Entering an email below will completely purge all matching records from messages, notifications, bookings, sitters, storage files, and login emails. This action is irreversible.
  </p>
  <div className="flex gap-3 max-w-md">
    <input
      type="email"
      placeholder="user@example.com"
      className="bg-white border border-gray-200 rounded-lg p-2 flex-grow text-sm focus:outline-none"
      value={deleteEmail}
      onChange={(e) => setDeleteEmail(e.target.value)}
    />
    <button
      onClick={handlePurgeData}
      className="bg-red-600 hover:bg-red-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
    >
      Purge Data
    </button>
  </div>
</div>
```

---

## 2. API Design (`app/api/admin/purge-user/route.ts`)

Create a new API route at `/api/admin/purge-user` (or expand `/api/admin/users`) to handle a `POST` or `DELETE` request with an email body.

### Purge Logic Steps:

1. **Verify Authorization**: Confirm `x-admin-key` matches `process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY`.
2. **Fetch Associated Data**:
   - Query the `sitters` table by `email` to obtain the sitter ID (if any) and get the `id_card_url` (to delete the storage object).
   - Query the `owner_profiles` table by `email` to get the owner profile details.
3. **Execute Deletions**:
   Run deletions across all specified tables. Since there may be foreign key constraints, perform deletions in topological order:

   ```typescript
   // 1. Delete sitting requests referencing this user/sitter
   await supabaseAdmin
     .from('sitting_requests')
     .delete()
     .or(`owner_email.eq.${email},sitter_email.eq.${email}`);

   // 2. Delete messages sent/received by this email
   await supabaseAdmin
     .from('messages')
     .delete()
     .or(`sender_email.eq.${email},recipient_email.eq.${email}`);

   // 3. Delete notifications for the user
   await supabaseAdmin
     .from('notifications')
     .delete()
     .eq('user_email', email); // or appropriate column name

   // 4. Delete push tokens
   await supabaseAdmin
     .from('push_tokens')
     .delete()
     .eq('email', email);

   // 5. Delete sitter profile and its files
   if (sitterProfile) {
     // Delete ID verification document from Supabase storage bucket
     if (sitterProfile.id_card_url) {
       const filePath = extractFilePathFromUrl(sitterProfile.id_card_url);
       if (filePath) {
         await supabaseAdmin.storage
           .from('sitter-ids') // Verify correct bucket name
           .remove([filePath]);
       }
     }

     await supabaseAdmin
       .from('sitters')
       .delete()
       .eq('email', email);
   }

   // 6. Delete owner profile
   await supabaseAdmin
     .from('owner_profiles')
     .delete()
     .eq('email', email);

   // 7. Delete registered email/account from 'emails' table
   await supabaseAdmin
     .from('emails')
     .delete()
     .eq('email', email);
   ```

4. **Response**: Return a list of deletion metrics showing how many records were cleaned up from each table.
