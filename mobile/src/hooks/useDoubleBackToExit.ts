import { useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid } from 'react-native';

const DOUBLE_PRESS_DELAY = 2000; // Time window (in milliseconds) for the second press

export const useDoubleBackToExit = () => {
  const lastPressTime = useRef(0);

  useEffect(() => {
    const backAction = () => {
      const now = new Date().getTime();

      if (now - lastPressTime.current < DOUBLE_PRESS_DELAY) {
        BackHandler.exitApp();
        return false;
      }

      lastPressTime.current = now;
      ToastAndroid.show(
        'برای خروج٬ دوباره دکمه بازگشت را فشار دهید',
        ToastAndroid.SHORT,
      );

      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);
};
