/**
 * UNIFIED ICON RENDERING SYSTEM
 * 
 * This module provides consistent icon rendering across all components.
 * Both PairingTile (list view) and PairingDetail (detail view) use these
 * constants to ensure icons are identical everywhere.
 */

// Icon sizes - use these consistently across the app
export const ICON_SIZE_LIST = 30;       // For list tile icons
export const ICON_SIZE_HEADER = 44;     // For detail page header icons
export const ICON_SIZE_LINKED = 30;     // For linked tiles in detail view

// Container sizes - the visual size of the icon boxes
export const CONTAINER_SIZE_LIST = 'w-12 h-12';          // 48x48px for lists
export const CONTAINER_SIZE_HEADER = 'w-14 h-14';        // 56x56px for headers
export const CONTAINER_SIZE_LINKED = 'w-12 h-12';        // 48x48px for linked tiles

// Shared borderRadius and styling
export const CONTAINER_BORDER_CLASS = 'rounded-lg';       // For lists and linked
export const HEADER_BORDER_CLASS = 'rounded-xl';          // For headers

// Shadow styling
export const CONTAINER_SHADOW_CLASS = 'shadow-inner';
export const CONTAINER_BORDER = 'border-2 border-black/20';
export const HEADER_BORDER = 'border-2 border-black/30';

// Icon rendering modes
export interface IconRenderConfig {
  size: number;
  includeDropShadow?: boolean;
}

// List view config
export const LIST_ICON_CONFIG: IconRenderConfig = {
  size: ICON_SIZE_LIST,
  includeDropShadow: true,
};

// Header view config  
export const HEADER_ICON_CONFIG: IconRenderConfig = {
  size: ICON_SIZE_HEADER,
  includeDropShadow: true,
};

// Linked tiles config
export const LINKED_ICON_CONFIG: IconRenderConfig = {
  size: ICON_SIZE_LINKED,
  includeDropShadow: true,
};

