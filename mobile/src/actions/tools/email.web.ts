/**
 * Web fallback for the email tool.
 *
 * `sendEmailWithLinking` works fine on the web because react-native-web's
 * Linking.openURL opens a `mailto:` URL. Only the parts that rely on the native
 * `react-native-email-link` module (open native inbox / native composer) are
 * degraded gracefully. Public API mirrors ./email (native).
 */
import { Linking } from 'react-native';
import { Logger } from '../../store';
import { notifyFeatureUnavailable } from '../../platform/webFeature';

interface SendEmail {
  email: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

// --- SEND EMAIL (works on web via mailto:) ---
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

// Native composer is unavailable on web – fall back to mailto: composition.
export const composeEmail = ({ email, subject, body, cc, bcc }: SendEmail) => {
  try {
    return sendEmailWithLinking({ email, subject, body, cc, bcc });
  } catch (error) {
    Logger.error('Error: composeEmail (web fallback)', { error });
  }
};

// There is no reliable way to open the user's mail inbox from the browser.
export const openEmailInbox = () => {
  notifyFeatureUnavailable(
    'email-inbox',
    'باز کردن صندوق ایمیل در نسخه‌ی وب پشتیبانی نمی‌شود.',
  );
};
