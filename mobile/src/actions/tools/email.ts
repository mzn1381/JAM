import { Linking } from 'react-native';
import { openInbox, openComposer } from 'react-native-email-link';
import { Logger } from '../../store';

interface SendEmail {
  email: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

// --- SEND EMAIL ---
export const sendEmailWithLinking = ({
  email,
  subject = '',
  body = '',
  cc = '',
  bcc = '',
}: SendEmail) => {
  let url = `mailto:${email}`;

  const query = [];
  if (subject) query.push(`subject=${encodeURIComponent(subject)}`);
  if (body) query.push(`body=${encodeURIComponent(body)}`);
  if (cc) query.push(`cc=${encodeURIComponent(cc)}`);
  if (bcc) query.push(`bcc=${encodeURIComponent(bcc)}`);

  if (query.length > 0) url += `?${query.join('&')}`;

  return Linking.openURL(url).catch(err =>
    Logger.error('Error sending email: ', { error: err }),
  );
};

// sendEmailWithLinking("test@example.com", "Hello", "This is a test email." );

//================== Open email composer ==================

export const composeEmail = ({ email, subject, body, cc, bcc }: SendEmail) => {
  try {
    openComposer({
      to: email,
      subject,
      body,
      cc,
      bcc,
    });
  } catch (error) {
    Logger.error('Error: Open email composer, emailHandlers.ts', {
      error: error,
    });
  }
};

// {  to: 'example@email.com',
//     subject: 'Hello',
//     body: 'Email body here',
//     cc: 'cc@email.com',
//     bcc: 'bcc@email.com',}

//  open the inbox
export const openEmailInbox = () => {
  try {
    openInbox();
  } catch (error) {
    Logger.error('Error: open the inbox, emailHandlers.ts ', { error: error });
  }
};
