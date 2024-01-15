const axios = require('axios');
const nodemailer = require('nodemailer');

let isProcessing = false; // Flag to prevent concurrent processing

// Fetch data from the Google Apps Script JSON endpoint
async function fetchDataFromScript() {
  try {
    const response = await axios.get('https://script.google.com/macros/s/AKfycbweRq3lro7L3GQIAAo__NaIhJsHHawsmEpXDOh1m9toD2ePlI4rvzj0wOXUHSaF23rP/exec');
    if (response.data && response.data.length > 0) {
      return response.data;
    } else {
      console.log('No data found in the response.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

// Function to send emails using Nodemailer
async function sendEmails(data) {
  for (const item of data) {
    const {
      receiverEmail,
      subject,
      body,
      bardSubject,
      bardBody,
      replyTo,
      smtp,
      port,
      username,
      password,
      appPassword,
      rowId
    } = item;

    const transporter = nodemailer.createTransport({
      host: smtp,
      port: port,
      secure: false,
      auth: {
        user: username,
        pass: password,
      },
    });

    const mailOptions = {
      to: receiverEmail,
      replyTo: replyTo,
      subject: bardSubject,
      text: bardBody,
    };

    try {
      console.log('Processing email for receiver:', receiverEmail);

      // Introduce a delay of, for example, 5 seconds (5000 milliseconds) before sending each email
      await new Promise(resolve => setTimeout(resolve, 5000));

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);

      await updateSentStamp(rowId);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}

// Function to update the sentStamp value using the doPost method
async function updateSentStamp(rowId) {
  try {
    const response = await axios.post('https://script.google.com/macros/s/AKfycbweRq3lro7L3GQIAAo__NaIhJsHHawsmEpXDOh1m9toD2ePlI4rvzj0wOXUHSaF23rP/exec', { rowId: rowId });
    console.log('SentStamp updated for row ID:', rowId);
  } catch (error) {
    console.error('Error updating sentStamp:', error);
  }
}

// Main function to fetch data, process emails, and control script execution
async function main() {
  try {
    // Check if already processing, exit if true
    if (isProcessing) {
      console.log('Already processing. Exiting.');
      return;
    }

    isProcessing = true;

    const data = await fetchDataFromScript();

    if (data) {
      await sendEmails(data);
    }

    isProcessing = false;
  } catch (error) {
    isProcessing = false;
    console.error('Error:', error);
  }
}

// Schedule the script to run every minute
setInterval(() => {
  main();
}, 60 * 1000); // 30 seconds interval

// Log the starting stage
console.log('Script started. Fetching data and sending emails...');