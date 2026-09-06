/**
 * Web fallback for react-native-contacts.
 *
 * Browsers have no general contacts API (the Contact Picker API is limited and
 * requires an explicit user gesture per pick), so contact access is disabled
 * gracefully. Every function resolves safely and never throws. The public API
 * mirrors ./contact (native) for the members used across the app.
 */
import { Logger } from '../../store';
import { notifyFeatureUnavailable } from '../../platform/webFeature';

const FEATURE = 'contacts';
const UNAVAILABLE_MESSAGE = 'دسترسی به مخاطبین در نسخه‌ی وب پشتیبانی نمی‌شود.';

export const checkPermission = async (): Promise<string> => {
  return 'denied';
};

export const requestPermission = async (): Promise<string> => {
  notifyFeatureUnavailable(FEATURE, UNAVAILABLE_MESSAGE);
  return 'denied';
};

export const getAll = async (): Promise<any[]> => {
  notifyFeatureUnavailable(FEATURE, UNAVAILABLE_MESSAGE);
  Logger.warn('[web] getAll contacts is not supported on web');
  return [];
};

export const getByName = async (_name: string): Promise<any[]> => {
  notifyFeatureUnavailable(FEATURE, UNAVAILABLE_MESSAGE);
  Logger.warn('[web] getByName contacts is not supported on web');
  return [];
};

export const getAllWithoutPhotos = async (): Promise<any[]> => {
  return [];
};

export const getContactById = async (
  _contactId: string,
): Promise<any | null> => {
  return null;
};

export const getCount = async (): Promise<number> => {
  return 0;
};

export const getPhotoForId = async (
  _contactId: string,
): Promise<string | null> => {
  return null;
};

export const getContactsMatchingString = async (
  _searchText: string,
): Promise<any[]> => {
  return [];
};

export const getContactsByPhoneNumber = async (
  _phoneNumber: string,
): Promise<any[]> => {
  return [];
};

export const getContactsByEmailAddress = async (
  _email: string,
): Promise<any[]> => {
  return [];
};

export const addContact = async (
  _contact: Partial<any>,
): Promise<any | null> => {
  notifyFeatureUnavailable(FEATURE, UNAVAILABLE_MESSAGE);
  return null;
};
