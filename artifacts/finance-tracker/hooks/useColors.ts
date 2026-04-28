import colors from "@/constants/colors";

/**
 * Returns the design tokens for the app.
 *
 * The app's visual design is built around the light blue palette,
 * so we always return the light tokens regardless of the device's
 * appearance setting. This keeps every surface — inputs, hero
 * cards, pills, buttons — in the same color family.
 */
export function useColors() {
  return { ...colors.light, radius: colors.radius };
}
