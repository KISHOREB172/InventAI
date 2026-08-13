# Capacitor supplies consumer rules for plugins and bridge methods. Preserve
# annotations and useful line information for release crash diagnostics while
# still allowing R8 to remove unused Android and Cordova code.
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,AnnotationDefault
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
