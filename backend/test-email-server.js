// Test script to verify email and server functionality
// Run with: node test-email-server.js

import { testEmailConnection } from './src/shared/helpers/mail.helper.js';
import { sendEmailWithRetry } from './src/shared/helpers/mail.helper.js';

console.log('\n========================================');
console.log('🧪 EMAIL & SERVER DIAGNOSTIC TEST');
console.log('========================================\n');

// Test 1: Check email connection
console.log('📧 Test 1: Checking SMTP Connection...');
const emailConnected = await testEmailConnection();

if (!emailConnected) {
    console.error('❌ SMTP connection failed! Please check:');
    console.error('   1. BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_PASS');
    console.error('   2. Network connectivity to smtp-relay.brevo.com');
    console.error('   3. Brevo account status and verified sender');
    process.exit(1);
}

console.log('✅ SMTP connection successful!\n');

// Test 2: Send test email
console.log('📧 Test 2: Sending test email with retry logic...');
const testResult = await sendEmailWithRetry({
    from: process.env.BREVO_VERIFIED_EMAIL || 'patina@theflexleather.com',
    to: 'noor@gmail.com',
    subject: '🧪 TEST EMAIL - Flex Leather System',
    html: `
        <h2>Test Email from Flex Leather System</h2>
        <p>This is a diagnostic test email to verify the email sending system is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, the email system is working properly!</p>
    `
});

if (testResult.success) {
    console.log('✅ Test email sent successfully!');
    console.log('   MessageId:', testResult.info.messageId);
} else {
    console.error('❌ Test email failed after 3 retry attempts');
    console.error('   Error:', testResult.error?.message);
    process.exit(1);
}

console.log('\n========================================');
console.log('✅ ALL TESTS PASSED');
console.log('========================================\n');
console.log('Your email system is ready to use!');
console.log('Registration and order confirmation emails will be sent reliably.\n');
