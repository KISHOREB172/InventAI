package com.inventai.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class VersionMetadataTest {

    @Test
    public void versionMetadataMatchesRelease() {
        assertEquals(30000, BuildConfig.VERSION_CODE);
        assertEquals("3.0.0", BuildConfig.VERSION_NAME);
    }
}
