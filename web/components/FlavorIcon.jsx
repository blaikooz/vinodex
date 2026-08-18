import { Icon } from '../src/components/LocalIcon';
import { resolveFlavorIcon } from '@/shared/services/flavorIcon';

// The raw lookup-table re-exports (FLAVOR_ICON_MAP, FLAVOR_NAME_ICON_MAP)
// were removed with the v0.9.x shared master cleanup — the maps no longer
// exist there and nothing here imported them; `resolveFlavorIcon` is the API
// both apps use now (v6#1 repair, IOS-PARITY-v6.md).

function FlavorIcon({ flavor, name, className, style }) {
  const iconName = resolveFlavorIcon(name, flavor);
  return <Icon icon={iconName} className={className} style={style} />;
}

export default FlavorIcon;
