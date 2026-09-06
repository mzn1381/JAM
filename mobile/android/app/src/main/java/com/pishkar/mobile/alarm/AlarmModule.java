package com.pishkar.mobile.alarm;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.provider.AlarmClock;

import java.util.Calendar;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AlarmModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public AlarmModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context; // FIXED: save context
    }

    @NonNull
    @Override
    public String getName() {
        return "AlarmModule";
    }

    // -----------------------------------------------------
    // 1. SET NORMAL ALARM
    // -----------------------------------------------------
    @ReactMethod
    public void setAlarm(int hour, int minute, String message, boolean skipUI, Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available");
                return;
            }

            Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
                    .putExtra(AlarmClock.EXTRA_HOUR, hour)
                    .putExtra(AlarmClock.EXTRA_MINUTES, minute)
                    .putExtra(AlarmClock.EXTRA_MESSAGE, message)
                    .putExtra(AlarmClock.EXTRA_SKIP_UI, skipUI);

            activity.startActivity(intent);
            promise.resolve(true);

        } catch (Exception e) {
            e.printStackTrace();
            promise.reject("ERROR", e.getMessage());
        }
    }

    // -----------------------------------------------------
    // OPEN ALARMS APP
    // -----------------------------------------------------
    @ReactMethod
    public void openAlarms(Promise promise) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SHOW_ALARMS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // -----------------------------------------------------
    // CHECK ALARM SUPPORT
    // -----------------------------------------------------
    @ReactMethod
    public void checkAlarmSupport(Promise promise) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
            boolean supported = intent.resolveActivity(
                    reactContext.getPackageManager()) != null;

            promise.resolve(supported);

        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // -----------------------------------------------------
    // 2. CREATE REPEATING ALARM (AlarmManager)
    // -----------------------------------------------------
    @ReactMethod
    public void setRepeatingAlarm(int id, int hour, int minute, String message, int intervalMinutes, Promise promise) {
        try {
            AlarmManager alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(reactContext, AlarmReceiver.class);
            intent.putExtra("message", message);

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    reactContext,
                    id,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, hour);
            calendar.set(Calendar.MINUTE, minute);
            calendar.set(Calendar.SECOND, 0);

            long intervalMillis = intervalMinutes * 60L * 1000L;

            alarmManager.setRepeating(
                    AlarmManager.RTC_WAKEUP,
                    calendar.getTimeInMillis(),
                    intervalMillis,
                    pendingIntent);

            promise.resolve(true);

        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // -----------------------------------------------------
    // 3. CANCEL ALARM
    // -----------------------------------------------------
    @ReactMethod
    public void cancelAlarm(int id, Promise promise) {
        try {
            AlarmManager alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(reactContext, AlarmReceiver.class);

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    reactContext,
                    id,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);

            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }

        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // -----------------------------------------------------
    // 4. OPEN TIMERS
    // -----------------------------------------------------
    @ReactMethod
    public void openTimers(Promise promise) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SHOW_TIMERS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Timers not supported");
        }
    }

    // -----------------------------------------------------
    // 5. CREATE TIMER
    // -----------------------------------------------------
    @ReactMethod
    public void createTimer(int seconds, String message, boolean skipUI, Promise promise) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SET_TIMER)
                    .putExtra(AlarmClock.EXTRA_LENGTH, seconds)
                    .putExtra(AlarmClock.EXTRA_MESSAGE, message)
                    .putExtra(AlarmClock.EXTRA_SKIP_UI, skipUI)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            reactContext.startActivity(intent);
            promise.resolve(true);

        } catch (Exception e) {
            promise.reject("ERROR", "Timer not supported");
        }
    }

    // -----------------------------------------------------
    // 6. OPEN STOPWATCH
    // -----------------------------------------------------
    @ReactMethod
    public void openStopwatch(Promise promise) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SHOW_ALARMS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Stopwatch not supported");
        }
    }
}
