import { Linking } from 'react-native';
import { Logger } from '../../store';

// --- MAKE PHONE CALL ---
export const makeCallWithLinking = (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;
  return Linking.openURL(url).catch(err =>
    Logger.error('Error making call:', { error: err }),
  );
};

// makeCallWithLinking("09351234567");
