package com.pishkar.mobile.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String msg = intent.getStringExtra("message");
        Toast.makeText(context, "Alarm: " + msg, Toast.LENGTH_LONG).show();
    }
}
