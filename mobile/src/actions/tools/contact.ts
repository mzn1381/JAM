import { PermissionsAndroid, Platform } from 'react-native';
import Contacts, {
  Contact,
  PhoneNumber,
  EmailAddress,
} from 'react-native-contacts';
import { Logger } from '../../store';

// ==========================================
// PERMISSION MANAGEMENT
// ==========================================

/**
 * Check if contacts permission is granted (iOS only)
 * Returns: 'authorized' | 'denied' | 'undefined'
 */
export const checkPermission = async (): Promise<string> => {
  try {
    if (Platform.OS === 'ios') {
      const permission = await Contacts.checkPermission();
      return permission;
    }
    // Android uses PermissionsAndroid
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    );
    return granted ? 'authorized' : 'denied';
  } catch (error) {
    Logger.error('Error checking permission:', { error });
    return 'undefined';
  }
};

/**
 * Request contacts permission (iOS only, Android uses PermissionsAndroid)
 * Returns: 'authorized' | 'denied' | 'undefined'
 */
export const requestPermission = async (): Promise<string> => {
  try {
    if (Platform.OS === 'ios') {
      const permission = await Contacts.requestPermission();
      return permission;
    }
    // Android
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Contacts Permission',
        message: 'This app would like to view your contacts.',
        buttonPositive: 'Accept',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED
      ? 'authorized'
      : 'denied';
  } catch (error) {
    Logger.error('Error requesting permission:', { error });
    return 'undefined';
  }
};

// ==========================================
// GET CONTACTS
// ==========================================

/**
 * Get all contacts with photos
 * Returns: Promise<Contact[]>
 */
export const getAll = async (): Promise<Contact[]> => {
  try {
    const contacts = await Contacts.getAll();
    Logger.info('Total contacts retrieved:', { count: contacts.length });
    return contacts;
  } catch (error) {
    Logger.error('Error getting all contacts:', { error });
    return [];
  }
};

/**
 * Get contact bey name
 * Returns: Promise<Contact>
 */

export const getByName = async (name: string) => {
  try {
    const contacts = await Contacts.getAll();

    // Normalize for safer matching
    const query = name.trim().toLowerCase();

    const filtered = contacts.filter(contact => {
      const fullName = `${contact.givenName ?? ''} ${contact.familyName ?? ''}`
        .trim()
        .toLowerCase();
      return fullName.includes(query);
    });

    Logger.info('Contacts matched by name:', { count: filtered.length });

    return filtered;
  } catch (error) {
    Logger.error('Error searching contacts by name:', { error });
    return [];
  }
};

/**
 * Get all contacts without photos (faster on iOS)
 * Returns: Promise<Contact[]>
 */
export const getAllWithoutPhotos = async (): Promise<Contact[]> => {
  try {
    const contacts = await Contacts.getAllWithoutPhotos();
    Logger.info('Total contacts retrieved (no photos):', {
      count: contacts.length,
    });
    return contacts;
  } catch (error) {
    Logger.error('Error getting contacts without photos:', { error });
    return [];
  }
};

/**
 * Get contact by ID
 * Returns: Promise<Contact | null>
 */
export const getContactById = async (
  contactId: string,
): Promise<Contact | null> => {
  try {
    const contact = await Contacts.getContactById(contactId);
    return contact;
  } catch (error) {
    Logger.error('Error getting contact by ID:', { contactId, error });
    return null;
  }
};

/**
 * Get total count of contacts
 * Returns: Promise<number>
 */
export const getCount = async (): Promise<number> => {
  try {
    const count = await Contacts.getCount();
    Logger.info('Total contacts count fetched:', { count });
    return count;
  } catch (error) {
    Logger.error('Error getting contacts count:', { error });
    return 0;
  }
};

/**
 * Get photo URI for a contact (iOS only)
 * Returns: Promise<string | null>
 */
export const getPhotoForId = async (
  contactId: string,
): Promise<string | null> => {
  try {
    const photoUri = await Contacts.getPhotoForId(contactId);
    return photoUri;
  } catch (error) {
    Logger.error('Error getting photo for contact:', { contactId, error });
    return null;
  }
};

// ==========================================
// SEARCH CONTACTS
// ==========================================

/**
 * Search contacts by name (first, middle, family)
 * Returns: Promise<Contact[]>
 */
export const getContactsMatchingString = async (
  searchText: string,
): Promise<Contact[]> => {
  try {
    const contacts = await Contacts.getContactsMatchingString(searchText);
    Logger.info('Contacts matching string search:', {
      searchText,
      resultsFound: contacts.length,
    });
    return contacts;
  } catch (error) {
    Logger.error('Error searching contacts by string:', { searchText, error });
    return [];
  }
};

/**
 * Search contacts by phone number
 * Returns: Promise<Contact[]>
 */
export const getContactsByPhoneNumber = async (
  phoneNumber: string,
): Promise<Contact[]> => {
  try {
    const contacts = await Contacts.getContactsByPhoneNumber(phoneNumber);
    Logger.info('Contacts matching phone number:', {
      phoneNumber,
      resultsFound: contacts.length,
    });
    return contacts;
  } catch (error) {
    Logger.error('Error searching contacts by phone:', { phoneNumber, error });
    return [];
  }
};

/**
 * Search contacts by email address
 * Returns: Promise<Contact[]>
 */
export const getContactsByEmailAddress = async (
  email: string,
): Promise<Contact[]> => {
  try {
    const contacts = await Contacts.getContactsByEmailAddress(email);
    Logger.info('Contacts matching email address:', {
      email,
      resultsFound: contacts.length,
    });
    return contacts;
  } catch (error) {
    Logger.error('Error searching contacts by email:', { email, error });
    return [];
  }
};

// ==========================================
// ADD/CREATE CONTACTS
// ==========================================

/**
 * Add a new contact programmatically
 * Returns: Promise<Contact>
 */
export const addContact = async (
  contact: Partial<Contact>,
): Promise<Contact | null> => {
  try {
    const newContact = await Contacts.addContact(contact);
    Logger.success('Contact added successfully:', {
      recordID: newContact.recordID,
      givenName: newContact.givenName,
    });
    return newContact;
  } catch (error) {
    Logger.error('Error adding contact:', { contact, error });
    return null;
  }
};

/**
 * Open system contact form to create a new contact
 * (User can edit before saving)
 */
export const openContactForm = async (
  contact?: Partial<Contact>,
): Promise<void> => {
  try {
    await Contacts.openContactForm(contact || {});
  } catch (error) {
    Logger.error('Error opening contact form:', { error });
  }
};

// Example: Add a contact programmatically
export const addNewContact = async (
  firstName: string,
  lastName: string,
  phoneNumber: string,
  email?: string,
): Promise<Contact | null> => {
  const newContact: Partial<Contact> = {
    givenName: firstName,
    familyName: lastName,
    phoneNumbers: [
      {
        label: 'mobile',
        number: phoneNumber,
      },
    ],
  };

  if (email) {
    newContact.emailAddresses = [
      {
        label: 'work',
        email: email,
      },
    ];
  }

  return await addContact(newContact);
};

// ==========================================
// UPDATE CONTACTS
// ==========================================

/**
 * Update an existing contact
 * Returns: Promise<void>
 */
export const updateContact = async (contact: Contact): Promise<boolean> => {
  try {
    await Contacts.updateContact(contact);
    Logger.success('Contact updated:', { recordID: contact.recordID });
    return true;
  } catch (error) {
    Logger.error('Error updating contact:', {
      recordID: contact.recordID,
      error,
    });
    return false;
  }
};

/**
 * Edit existing contact - add phone numbers
 * Returns: Promise<void>
 */
export const editExistingContact = async (
  contactId: string,
  phoneNumbers: PhoneNumber[],
): Promise<boolean> => {
  try {
    const contact = await getContactById(contactId);
    if (!contact) {
      Logger.warn('Contact not found for editing:', { contactId });
      return false;
    }

    contact.phoneNumbers = [...(contact.phoneNumbers || []), ...phoneNumbers];
    await Contacts.editExistingContact(contact);
    Logger.success('Contact edited via UI:', { contactId });
    return true;
  } catch (error) {
    Logger.error('Error editing contact:', { contactId, error });
    return false;
  }
};

/**
 * Add a phone number to existing contact
 */
export const addPhoneNumberToContact = async (
  contactId: string,
  phoneNumber: string,
  label: string = 'mobile',
): Promise<boolean> => {
  try {
    const contact = await getContactById(contactId);
    if (!contact) {
      Logger.warn('Contact not found to add phone number:', { contactId });
      return false;
    }

    const newPhoneNumber: PhoneNumber = {
      label,
      number: phoneNumber,
    };

    contact.phoneNumbers = [...(contact.phoneNumbers || []), newPhoneNumber];
    return await updateContact(contact);
  } catch (error) {
    Logger.error('Error adding phone number to contact:', {
      contactId,
      phoneNumber,
      error,
    });
    return false;
  }
};

/**
 * Add an email to existing contact
 */
export const addEmailToContact = async (
  contactId: string,
  email: string,
  label: string = 'work',
): Promise<boolean> => {
  try {
    const contact = await getContactById(contactId);
    if (!contact) {
      Logger.warn('Contact not found to add email:', { contactId });
      return false;
    }

    const newEmail: EmailAddress = {
      label,
      email,
    };

    contact.emailAddresses = [...(contact.emailAddresses || []), newEmail];
    return await updateContact(contact);
  } catch (error) {
    Logger.error('Error adding email to contact:', { contactId, email, error });
    return false;
  }
};

// ==========================================
// VIEW/EDIT CONTACTS (UI)
// ==========================================

/**
 * Open existing contact in edit mode
 */
export const openExistingContact = async (contact: Contact): Promise<void> => {
  try {
    if (!contact.recordID) {
      throw new Error('Contact must have a valid recordID');
    }
    await Contacts.openExistingContact(contact);
  } catch (error) {
    Logger.error('Error opening existing contact in edit mode:', {
      recordID: contact.recordID,
      error,
    });
  }
};

/**
 * Open existing contact in view mode (read-only)
 */
export const viewExistingContact = async (contact: Contact): Promise<void> => {
  try {
    if (!contact.recordID) {
      throw new Error('Contact must have a valid recordID');
    }
    await Contacts.viewExistingContact(contact);
  } catch (error) {
    Logger.error('Error viewing existing contact:', {
      recordID: contact.recordID,
      error,
    });
  }
};

// ==========================================
// DELETE CONTACTS
// ==========================================

/**
 * Delete a contact by contact object
 * Returns: Promise<boolean>
 */
export const deleteContact = async (contact: Contact): Promise<boolean> => {
  try {
    if (!contact.recordID) {
      throw new Error('Contact must have a valid recordID');
    }
    await Contacts.deleteContact(contact);
    Logger.success('Contact deleted successfully:', {
      recordID: contact.recordID,
    });
    return true;
  } catch (error) {
    Logger.error('Error deleting contact:', {
      recordID: contact.recordID,
      error,
    });
    return false;
  }
};

/**
 * Delete a contact by ID
 */
export const deleteContactById = async (
  contactId: string,
): Promise<boolean> => {
  try {
    const contact = await getContactById(contactId);
    if (!contact) {
      Logger.warn('Contact not found for deletion:', { contactId });
      return false;
    }
    return await deleteContact(contact);
  } catch (error) {
    Logger.error('Error deleting contact by ID:', { contactId, error });
    return false;
  }
};

// ==========================================
// PHOTOS (Android only)
// ==========================================

/**
 * Write contact photo to path (Android only)
 * Returns: Promise<string> - path where photo was written
 */

export const writePhotoToPath = async (
  contactId: string,
  filePath: string,
): Promise<boolean> => {
  try {
    if (Platform.OS !== 'android') {
      Logger.warn('writePhotoToPath is Android only. Skipping.', {
        platform: Platform.OS,
      });
      return false;
    }

    // This returns a boolean (true if successful)
    const isSuccess = await Contacts.writePhotoToPath(contactId, filePath);

    Logger.info('Photo write attempt finished:', {
      contactId,
      filePath,
      success: isSuccess,
    });

    return isSuccess;
  } catch (error) {
    Logger.error('Error writing photo to path:', {
      contactId,
      filePath,
      error,
    });
    return false;
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Format contact for display
 */
export interface FormattedContact {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
  company?: string;
  jobTitle?: string;
  thumbnail?: string;
}

export const formatContact = (contact: Contact): FormattedContact => {
  return {
    id: contact.recordID,
    name:
      `${contact.givenName || ''} ${contact.familyName || ''}`.trim() ||
      'No Name',
    phoneNumbers: contact.phoneNumbers?.map(phone => phone.number) || [],
    emails: contact.emailAddresses?.map(email => email.email) || [],
    company: contact.company || undefined,
    jobTitle: contact.jobTitle || undefined,
    thumbnail: contact.thumbnailPath || undefined,
  };
};

/**
 * Get contacts with specific criteria
 */
export const getContactsWithPhones = async (): Promise<Contact[]> => {
  const contacts = await getAllWithoutPhotos();
  return contacts.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
};

export const getContactsWithEmails = async (): Promise<Contact[]> => {
  const contacts = await getAllWithoutPhotos();
  return contacts.filter(c => c.emailAddresses && c.emailAddresses.length > 0);
};

// ==========================================
// COMPLETE API OBJECT
// ==========================================

export const ContactsAPI = {
  // Permissions
  checkPermission,
  requestPermission,

  // Get contacts
  getAll,
  getByName,
  getAllWithoutPhotos,
  getContactById,
  getCount,
  getPhotoForId,

  // Search
  getContactsMatchingString,
  getContactsByPhoneNumber,
  getContactsByEmailAddress,

  // Add/Create
  addContact,
  openContactForm,
  addNewContact,

  // Update
  updateContact,
  editExistingContact,
  addPhoneNumberToContact,
  addEmailToContact,

  // View/Edit UI
  openExistingContact,
  viewExistingContact,

  // Delete
  deleteContact,
  deleteContactById,

  // Photos
  writePhotoToPath,

  // Utilities
  formatContact,
  getContactsWithPhones,
  getContactsWithEmails,
};

export default ContactsAPI;
