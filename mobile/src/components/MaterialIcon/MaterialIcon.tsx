import { SvgXml } from 'react-native-svg';
import { Text } from '../Text';
import { icons } from './icons';

const {
  female_assistant,
  arrow_right,
  gear,
  cloud_slash,
  shield,
  chevron_left,
  lock,
  trash,
  mic,
  vault,
  user,
  search,
  checklist,
  shield_key,
  fingerprint,
  visibility,
  visibility_off,
  bug,
  copy,
  google_G,
  gitHub,
  edit,
  location,
  bigIcons,
  infoIcon,
  sendEmail,
} = icons;

const iconMap: any = {
  mic: mic, //'🎤',
  send: '➤',
  check: '✓',
  arrow_forward: arrow_right, //'→',
  more_vert: '⋮',
  cloud_error: cloud_slash,
  cancel: '✕',
  settings: gear,
  auto_awesome: '✨',
  receipt_long: '🧾',
  calendar_month: '📅',
  description: '📄',
  alarm: '⏰',
  payments: '💳',
  check_circle: '✓',
  event_upcoming: '📆',
  notification_important: '!',
  inventory: '📦',
  verified_user: '🛡️',
  expand_more: chevron_left, // '▼',
  person: user, // '👤',
  delete: '🗑️',
  record_voice_over: mic, // '🎤',
  speed: '⚡',
  dark_mode: '🌙',
  format_size: 'TT',
  info: 'ℹ️',
  gavel: '⚖️',
  privacy_tip: '🔒',
  chevron_left: chevron_left, // '>',
  delete_forever: trash, //'🗑️',
  search: search, //'🔍',
  filter_list: '☰',
  push_pin: '📌',
  task_alt: '✓',
  add: '+',
  close: '✕',
  shield: shield, //'🛡️',
  contacts: '📇',
  location_on: location,
  vault: vault,
  lock: lock,
  female_assistant: female_assistant,
  checklist: checklist,
  shield_key: shield_key,
  fingerprint,
  visibility, //eye icon
  visibility_off,
  bug,
  copy,
  google_G,
  gitHub,
  edit,
  bigIcons,
  infoIcon,
  sendEmail,
};

// Material Icons component (placeholder until react-native-vector-icons is installed)
export default function MaterialIcon({ name, size = 24, color }: any) {
  const icon = iconMap[name];

  // ---- SVG CASE (string) ----
  if (typeof icon === 'string' && icon.trim().startsWith('<svg')) {
    return (
      <SvgXml
        xml={icon}
        width={size}
        height={size}
        color={color} // works because fill="currentColor"
      />
    );
  }

  return <Text style={{ fontSize: size, color }}>{icon || '•'}</Text>;
}
