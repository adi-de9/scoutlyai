import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task, Profile } from './store';

export async function requestNotificationPermissionsAsync() {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync();
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function setNotificationChannelAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export async function rescheduleAllNotifications(tasks: Task[], profile: Profile) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  for (const task of tasks) {
    if (task.status === 'done' || task.status === 'skipped') continue;
    
    const scheduledDate = new Date(task.scheduledAt);
    let hours = 10;
    
    switch (profile.reminderTime) {
      case 'morning': hours = 9; break;
      case 'afternoon': hours = 14; break;
      case 'evening': hours = 18; break;
      case 'night': hours = 20; break;
      default: hours = 10; break; // 'smart' defaults to 10
    }
    
    scheduledDate.setHours(hours, 0, 0, 0);
    
    if (scheduledDate.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Task Reminder: ${task.title}`,
          body: task.description || 'Time to work on your task.',
          data: { taskId: task.id, deadlineId: task.deadlineId },
        },
        trigger: scheduledDate,
      });
    }
  }
}
