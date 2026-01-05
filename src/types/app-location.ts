/**
 * Zendesk app location types
 * Based on Zendesk app framework location options
 */
export type AppLocation =
  | "all_locations"
  | "ticket_sidebar"
  | "new_ticket_sidebar"
  | "ticket_editor"
  | "user_sidebar"
  | "organization_sidebar"
  | "nav_bar"
  | "top_bar"
  | "background"
  | "modal";

/**
 * App location metadata
 */
export interface AppLocationInfo {
  value: AppLocation;
  label: string;
  description: string;
  requiresIcon?: boolean;
  iconFileName?: string;
}

/**
 * All available app locations with metadata
 */
export const APP_LOCATIONS: AppLocationInfo[] = [
  {
    value: "all_locations",
    label: "All locations",
    description: "All listed locations",
  },
  {
    value: "ticket_sidebar",
    label: "Ticket sidebar",
    description: "Panel on the right side of the ticket",
    requiresIcon: false,
  },
  {
    value: "new_ticket_sidebar",
    label: "New ticket sidebar",
    description: "Panel on the right side of the new ticket",
    requiresIcon: false,
  },
  {
    value: "ticket_editor",
    label: "Ticket editor",
    description: "Toolbar on the lower side of the ticket editor",
    requiresIcon: true,
    iconFileName: "icon_ticket_editor.svg",
  },
  {
    value: "user_sidebar",
    label: "User sidebar",
    description: "Panel on the right side of the user page",
    requiresIcon: false,
  },
  {
    value: "organization_sidebar",
    label: "Organization sidebar",
    description: "Panel on the right side of the organization page",
    requiresIcon: false,
  },
  {
    value: "nav_bar",
    label: "Nav bar",
    description: "Navigation bar on the left side",
    requiresIcon: true,
    iconFileName: "icon_nav_bar.svg",
  },
  {
    value: "top_bar",
    label: "Top bar",
    description: "Right side of the bar on the upper side",
    requiresIcon: true,
    iconFileName: "icon_top_bar.svg",
  },
  {
    value: "background",
    label: "Background",
    description:
      "No UI, always running in the background to receive special events",
    requiresIcon: false,
  },
  {
    value: "modal",
    label: "Modal",
    description: "Modal dialog",
    requiresIcon: false,
  },
];

/**
 * Get location info by value
 */
export function getLocationInfo(
  value: AppLocation
): AppLocationInfo | undefined {
  return APP_LOCATIONS.find((loc) => loc.value === value);
}

/**
 * Get all locations that require icons
 */
export function getLocationsRequiringIcons(): AppLocationInfo[] {
  return APP_LOCATIONS.filter((loc) => loc.requiresIcon === true);
}
