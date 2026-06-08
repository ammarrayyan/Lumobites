const fs = require('fs');

function addNotification(filePath, triggerRegex, notificationCode) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('from(\'notifications\')') && !filePath.includes('messages')) {
    // Already added
    return;
  }
  
  // Find the place to insert it (usually right after the db update/insert)
  // Or just before the email sending
  // A safe place is right before `// 5. Email` or `// 5. Send Email` or right before the `resend.emails.send`
  
  // Wait, I can just replace the triggerRegex with the triggerRegex + notificationCode
  const newCode = code.replace(triggerRegex, match => notificationCode + '\n' + match);
  
  if (newCode !== code) {
    fs.writeFileSync(filePath, newCode);
    console.log('Updated ' + filePath);
  } else {
    console.log('Failed to match regex in ' + filePath);
  }
}

// 1. app/api/petsitting/request/route.ts
addNotification(
  'app/api/petsitting/request/route.ts',
  /(?:\/\/ 5\. Send Email to Sitter via Resend)/,
  `    // Notification
    await supabase.from('notifications').insert({
      recipient_email: sitter.email,
      type: 'booking_request',
      title: 'New Booking Request! 🎉',
      message: \`\${owner_name || cleanEmail} wants to book you for \${pet_name}\`,
      link: '/petsitting'
    });`
);

// 2. app/api/petsitting/request/accept/route.ts
addNotification(
  'app/api/petsitting/request/accept/route.ts',
  /(?:\/\/ 5\. Email the owner)/,
  `    // Notification
    await supabase.from('notifications').insert({
      recipient_email: reqRow.owner_email,
      type: 'booking_accepted',
      title: 'Booking Accepted! 🎉',
      message: \`\${sitterNameStr} accepted your booking for \${reqRow.pet_name}\`,
      link: '/petsitting'
    });`
);

// 3. app/api/petsitting/request/decline/route.ts
addNotification(
  'app/api/petsitting/request/decline/route.ts',
  /(?:\/\/ 5\. Email the owner)/,
  `    // Notification
    await supabase.from('notifications').insert({
      recipient_email: reqRow.owner_email,
      type: 'booking_declined',
      title: 'Booking Declined',
      message: \`\${sitterNameStr} declined your booking for \${reqRow.pet_name}\`,
      link: '/petsitting'
    });`
);

// 4. app/api/petsitting/request/complete/route.ts
addNotification(
  'app/api/petsitting/request/complete/route.ts',
  /(?:\/\/ 5\. Notify the owner)/,
  `    // Notification
    await supabase.from('notifications').insert({
      recipient_email: reqRow.owner_email,
      type: 'booking_completed',
      title: 'Booking Completed ✅',
      message: \`Your booking with \${sitterName} is complete\`,
      link: '/petsitting'
    });`
);

// 5. app/api/petsitting/request/cancel/route.ts
// Cancel can be initiated by sitter or owner
addNotification(
  'app/api/petsitting/request/cancel/route.ts',
  /(?:if \(reqRow\.status === 'cancelled'\) \{)/,
  `    // Notifications
    const isSitterCancelling = req.headers.get('cookie')?.includes('lumo_sitter_email=');
    const recipient = isSitterCancelling ? reqRow.owner_email : reqRow.sitters?.email;
    if (recipient) {
      await supabase.from('notifications').insert({
        recipient_email: recipient,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: 'Your booking was cancelled',
        link: '/petsitting'
      });
    }\n`
);

console.log('Done inserting notifications');
