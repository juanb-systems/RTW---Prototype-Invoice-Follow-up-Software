import { redirect } from "next/navigation";

// Preferences has been merged into Settings.
// Redirect any visitors who navigate directly to /preferences.
export default function PreferencesPage() {
  redirect("/settings");
}
