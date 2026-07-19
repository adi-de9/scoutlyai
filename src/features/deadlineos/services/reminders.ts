import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Reminder, Task } from "../store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestReminderPermission() {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("deadlineos-reminders", {
      name: "Deadline reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  return permission.granted;
}

export async function scheduleReminder(reminder: Reminder, task: Task) {
  const when = new Date(reminder.scheduledAt);
  if (when <= new Date()) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "DeadlineOS reminder",
      body: task.title,
      data: { taskId: task.id, deadlineId: task.deadlineId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: "deadlineos-reminders",
    },
  });
}

export async function cancelReminder(notificationId?: string) {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function rescheduleReminder(reminder: Reminder, task: Task) {
  await cancelReminder(reminder.notificationId);
  return scheduleReminder(reminder, task);
}
