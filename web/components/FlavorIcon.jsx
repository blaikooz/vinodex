import { Icon } from '../src/components/LocalIcon';
import {
  FLAVOR_ICON_MAP,
  FLAVOR_NAME_ICON_MAP,
  resolveFlavorIcon,
} from '@/shared/services/flavorIcon';

// Re-exported for backward compatibility — the lookup tables and resolver
// function now live in ../src/services/flavorIcon.ts (a plain .ts module with
// no JSX/React dependency) so they can also be imported by
// native/scripts/generate.ts, which runs under a script runner that can't
// load .jsx files.
export { FLAVOR_ICON_MAP, FLAVOR_NAME_ICON_MAP, resolveFlavorIcon };

function FlavorIcon({ flavor, name, className, style }) {
  const iconName = resolveFlavorIcon(name, flavor);
  return <Icon icon={iconName} className={className} style={style} />;
}

export default FlavorIcon;
