package com.inventai.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class AppConfigurationTest {

    @Test
    public void applicationIdMatchesReleasePackage() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("com.inventai.app", appContext.getPackageName());
    }

    @Test
    public void appDataIsNotBackedUp() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        int flags = appContext.getApplicationInfo().flags;
        assertEquals(0, flags & ApplicationInfo.FLAG_ALLOW_BACKUP);
    }

    @Test
    public void hardwareAccelerationIsEnabled() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        int flags = appContext.getApplicationInfo().flags;
        assertTrue((flags & ApplicationInfo.FLAG_HARDWARE_ACCELERATED) != 0);
    }
}
