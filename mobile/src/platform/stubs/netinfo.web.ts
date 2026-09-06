/**
 * Empty stub for `@react-native-community/netinfo` on web.
 *
 * The store only imports the `NetInfoStateType` *type* (erased at build time),
 * and the network hook has a dedicated `.web.ts` implementation, so no runtime
 * netinfo code is ever needed in the browser.
 */
export enum NetInfoStateType {
  unknown = 'unknown',
  none = 'none',
  cellular = 'cellular',
  wifi = 'wifi',
  bluetooth = 'bluetooth',
  ethernet = 'ethernet',
  wimax = 'wimax',
  vpn = 'vpn',
  other = 'other',
}

export default {};
