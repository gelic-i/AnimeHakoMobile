import React, { useState } from "react";
import { Image, ImageStyle, StyleProp, StyleSheet, View } from "react-native";

interface AnimeImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
}

export default function AnimeImage({
  uri,
  style,
  resizeMode = "cover",
}: AnimeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View style={[styles.placeholder, style]}>
        <Image
          source={require("../anime.jpg")}
          style={[styles.placeholderImage, style]}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
  },
});
