import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handle deep links for authentication in Capacitor apps
 * This is necessary because OAuth redirects open in the browser,
 * and we need to capture the callback URL to complete auth
 */
export const setupCapacitorAuthListener = () => {
  if (!Capacitor.isNativePlatform()) return;

  // Listen for app URL open events (deep links)
  App.addListener("appUrlOpen", async ({ url }) => {
    console.log("Deep link received:", url);

    // Check if this is an auth callback
    if (url.includes("access_token") || url.includes("code=")) {
      try {
        // Extract the fragment or query params
        const urlObj = new URL(url);
        const fragment = urlObj.hash.substring(1);
        const params = new URLSearchParams(fragment || urlObj.search);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          // Set the session manually
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Error setting session:", error);
          } else {
            console.log("Session set successfully from deep link");
          }
        }

        // Close the browser if it's open
        await Browser.close();
      } catch (error) {
        console.error("Error handling auth deep link:", error);
      }
    }
  });

  // Listen for app state changes
  App.addListener("appStateChange", async ({ isActive }) => {
    if (isActive) {
      // When app becomes active, check for session updates
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("Session active on app resume");
      }
    }
  });
};

/**
 * Get the appropriate redirect URL based on platform
 */
export const getAuthRedirectUrl = (): string => {
  if (Capacitor.isNativePlatform()) {
    // Use deep link URL for native apps
    return "app.lovable.55f9cac6532e42d5905a9c8106220862://auth/callback";
  }
  return window.location.origin;
};
