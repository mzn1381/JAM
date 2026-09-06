import { Linking } from 'react-native';
// import SendSMS from 'react-native-sms';

export const sendSMSWithLinking = (phoneNumber: string, message: string) => {
  const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
  Linking.openURL(url).catch(err => console.error('Failed to send SMS:', err));
};

// sendSMSWithLinking("09351234567", "سلام! پیام تست ارسال شد.");

//================ alternative =============
//  export function SendSMSWithLibrary() {
//   SendSMS.send(
//     {
//       body: 'The default body of the SMS!',
//       recipients: ['0123456789'],
//       successTypes: ['sent', 'queued'],
//       allowAndroidSendWithoutReadPermission: false,
//     },
//     (completed, cancelled, error) => {
//       console.log(
//         'SMS Callback: completed: ' +
//           completed +
//           ' cancelled: ' +
//           cancelled +
//           'error: ' +
//           error,
//       );
//     },
//   );
// }
