/* eslint-disable react/no-unescaped-entities */
import { Colors } from "@/constants/Colors";
import { useAppDispatch } from "@/redux/hooks";
import { setDreamReqData } from "@/redux/horoscopeSlicer";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const Dream = () => {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const dreamText = useRef<string>("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toggleSelect = (item: string): void => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const dreamData = useMemo(() => {
    const data = t("dream.categories", { returnObjects: true }) as Array<{
      category: string;
      items: string[];
    }>;

    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  }, [t]);

  const handleSubmit = async () => {
    const itemsText = selectedItems.join(", ");
    const dreamReqData = `I see ${itemsText} and ${dreamText.current} in my dream. What is it mean ?`;
    dispatch(setDreamReqData(dreamReqData));
    router.push("/(auth)/(modal)/dreamResult");
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.containerS}>
        <Text style={styles.title}>{t("dream.title")}</Text>

        <View style={{ alignItems: "center", paddingVertical: hp(3) }}>
          <Image
            style={styles.image}
            source={require("@/assets/images/horoscope/realDream.png")}
            resizeMode="cover"
          />
        </View>

        <TextInput
          onChangeText={(text) => {
            dreamText.current = text;
          }}
          multiline
          placeholder={t("dream.placeholder")}
          placeholderTextColor="white"
          style={styles.textArea}
        />

        <Text style={styles.description}>{t("dream.description")}</Text>

        <TouchableOpacity style={styles.buttonContainer} onPress={handleSubmit}>
          <LinearGradient
            colors={["#724cfd", "#bb38f6"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>{t("dream.button")}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.frequent}>{t("dream.frequent")}</Text>

        <View style={styles.frequentBox}>
          {dreamData.map((data, index) => (
            <View key={index}>
              <Text
                style={{
                  fontFamily: "Rubik_600SemiBold",
                  fontSize: hp(2.6),
                  fontWeight: "600",
                  paddingTop: hp(1),
                  paddingBottom: hp(1),
                  paddingLeft: wp(2),
                  color: Colors.purpleColorBlack,
                }}
              >
                {data.category}:
              </Text>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingVertical: hp(1),
                }}
                data={data.items}
                keyExtractor={(item, idx) => `${data.category}-${idx}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.card,
                      selectedItems.includes(item) && styles.selectedCard,
                    ]}
                    onPress={() => toggleSelect(item)}
                  >
                    <Text
                      style={
                        selectedItems.includes(item)
                          ? styles.selectedCardText
                          : styles.cardText
                      }
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
    </View>
  );
};

export default Dream;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(3),
    paddingBottom: hp(3.2),
    backgroundColor: "#fff",
  },
  containerS: {
    paddingVertical: hp(0.1),
    backgroundColor: "#fff",
    paddingHorizontal: wp(5),
  },
  title: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(3.3),
    fontWeight: "600",
    textAlign: "center",
    color: Colors.purpleColorBlack,
  },
  frequent: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(3.3),
    fontWeight: "600",
    paddingTop: hp(2),
    color: Colors.purpleColorBlack,
  },
  description: {
    paddingTop: hp(2),
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.8),
    fontWeight: "400",
    textAlign: "center",
    color: Colors.purpleColorBlack,
  },
  image: {
    width: wp(95),
    height: hp(20),
    borderRadius: 12,
  },
  textArea: {
    width: "100%",
    height: hp(9),
    borderRadius: 12,
    paddingHorizontal: wp(4),
    backgroundColor: Colors.purplePalmitryBg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: hp(2.3),
    color: "white",
  },
  frequentBox: {},
  card: {
    borderWidth: 1,
    borderRadius: 22,
    borderColor: Colors.purpleColorBlack,
    backgroundColor: Colors.background,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    marginHorizontal: wp(1),
  },
  selectedCard: {
    backgroundColor: Colors.purpleColorBlack,
  },
  cardText: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.8),
    fontWeight: "regular",
    color: Colors.purpleColorBlack,
  },
  selectedCardText: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.8),
    fontWeight: "regular",
    color: "#fff",
  },
  buttonContainer: {
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
    marginTop: hp(2),
  },
  gradient: {
    paddingVertical: hp(1.8),
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: hp(2.3),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
});
