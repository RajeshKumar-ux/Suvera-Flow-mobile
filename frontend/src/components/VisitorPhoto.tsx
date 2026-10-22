import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";

import { API_URL, getToken } from "@/src/api";
import { initials } from "@/src/format";
import { fonts, makeStyles } from "@/src/theme";

export function VisitorPhoto({ visitId, hasPhoto, name, size = 52 }: { visitId: string; hasPhoto?: boolean; name?: string; size?: number }) {
  const styles = useStyles();
  const box = { width: size, height: size, borderRadius: size / 3 };
  if (hasPhoto) {
    return (
      <Image
        source={{ uri: `${API_URL}/api/photos/${visitId}`, headers: { Authorization: `Bearer ${getToken() ?? ""}` } }}
        style={[styles.base, box]}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        testID={`visitor-photo-${visitId}`}
      />
    );
  }
  return (
    <View style={[styles.base, styles.fallback, box]} testID={`visitor-avatar-${visitId}`}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  base: { backgroundColor: c.surfaceTertiary },
  fallback: { alignItems: "center", justifyContent: "center", backgroundColor: c.brandTertiary },
  initials: { fontFamily: fonts.heading, color: c.brandPrimary },
}));
