import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

export type NotificationType = 
  | "upload_complete" 
  | "upload_failed" 
  | "share_created" 
  | "share_accessed"
  | "storage_warning";

interface NotificationOptions {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

class NotificationService {
  private isNative = Capacitor.isNativePlatform();
  private hasPermission = false;
  private LocalNotifications: typeof import("@capacitor/local-notifications").LocalNotifications | null = null;

  async initialize() {
    if (!this.isNative) return;

    try {
      const module = await import("@capacitor/local-notifications");
      this.LocalNotifications = module.LocalNotifications;

      const permStatus = await this.LocalNotifications.checkPermissions();
      if (permStatus.display === "granted") {
        this.hasPermission = true;
      } else if (permStatus.display === "prompt") {
        const request = await this.LocalNotifications.requestPermissions();
        this.hasPermission = request.display === "granted";
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isNative || !this.LocalNotifications) {
      return false;
    }

    try {
      const request = await this.LocalNotifications.requestPermissions();
      this.hasPermission = request.display === "granted";
      return this.hasPermission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  async send(options: NotificationOptions) {
    const { title, body, type } = options;

    // Always show a toast on all platforms
    this.showToast(type, title, body);

    // On native, also show a local notification
    if (this.isNative && this.hasPermission && this.LocalNotifications) {
      try {
        await this.LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title,
              body,
              schedule: { at: new Date(Date.now() + 100) },
              extra: { type, ...options.data },
            },
          ],
        });
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  }

  private showToast(type: NotificationType, title: string, body: string) {
    switch (type) {
      case "upload_complete":
        toast.success(body, { description: title });
        break;
      case "upload_failed":
        toast.error(body, { description: title });
        break;
      case "share_created":
        toast.success(body, { description: title });
        break;
      case "share_accessed":
        toast.info(body, { description: title });
        break;
      case "storage_warning":
        toast.warning(body, { description: title });
        break;
      default:
        toast(body, { description: title });
    }
  }

  // Convenience methods
  async notifyUploadComplete(fileName: string) {
    await this.send({
      title: "Upload Complete",
      body: `${fileName} has been uploaded successfully`,
      type: "upload_complete",
      data: { fileName },
    });
  }

  async notifyUploadFailed(fileName: string, error?: string) {
    await this.send({
      title: "Upload Failed",
      body: error || `Failed to upload ${fileName}`,
      type: "upload_failed",
      data: { fileName, error },
    });
  }

  async notifyShareCreated(fileName: string) {
    await this.send({
      title: "Share Link Created",
      body: `Share link for ${fileName} is ready`,
      type: "share_created",
      data: { fileName },
    });
  }

  async notifyShareAccessed(fileName: string) {
    await this.send({
      title: "File Accessed",
      body: `Someone accessed your shared file: ${fileName}`,
      type: "share_accessed",
      data: { fileName },
    });
  }

  async notifyStorageWarning(percentUsed: number) {
    await this.send({
      title: "Storage Warning",
      body: `You've used ${percentUsed}% of your storage`,
      type: "storage_warning",
      data: { percentUsed },
    });
  }
}

export const notificationService = new NotificationService();
