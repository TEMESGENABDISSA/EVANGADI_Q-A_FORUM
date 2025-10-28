require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('=== Email Configuration Test ===');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ Email configuration is missing!');
    console.log('Please set EMAIL_USER and EMAIL_PASS environment variables.');
    return;
  }

  try {
    console.log('\n🔧 Creating email transporter...');
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    console.log('✅ Transporter created');
    console.log('🔍 Verifying email configuration...');
    
    await transporter.verify();
    console.log('✅ Email configuration verified successfully!');
    
    console.log('\n📧 Testing email send...');
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testEmail,
      subject: "Test Email - Evangadi Forum",
      html: `
        <h2>Email Test Successful!</h2>
        <p>If you receive this email, your email configuration is working correctly.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox:', testEmail);
    
  } catch (error) {
    console.log('\n❌ Email configuration failed:');
    console.log('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 This is likely an authentication error.');
      console.log('For Gmail, you need to:');
      console.log('1. Enable 2-factor authentication');
      console.log('2. Generate an "App Password"');
      console.log('3. Use the App Password instead of your regular password');
    }
  }
}

testEmailConfig();
