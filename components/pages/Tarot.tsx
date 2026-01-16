import { Colors } from "@/constants/Colors";
import { usePlatinumStatus } from "@/hooks/usePremiumCheck";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

type SpreadType = {
  id: string;
  name: string;
  positions: number;
  defaultPositions?: string[];
};

type CardInput = {
  id: string;
  cardName: string;
  direction: "upright" | "reversed";
  position: number;
  positionMeaning?: string;
};

const Tarot = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isPlatinum } = usePlatinumStatus();

  // Get card image function (same as in drawTarotCards.tsx)
  const getCardImage = (cardName: string) => {
    // Convert card name to image filename format
    const imageName = cardName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // Map card names to image filenames
    const cardImageMap: { [key: string]: any } = {
      // Major Arcana
      the_fool: require("@/assets/images/horoscope/tarotDeck/the_fool.png"),
      the_magician: require("@/assets/images/horoscope/tarotDeck/the_magician.png"),
      the_high_priestess: require("@/assets/images/horoscope/tarotDeck/the_high_priestess.png"),
      the_empress: require("@/assets/images/horoscope/tarotDeck/the_empress.png"),
      the_emperor: require("@/assets/images/horoscope/tarotDeck/the_emperor.png"),
      the_hierophant: require("@/assets/images/horoscope/tarotDeck/the_hierophant.png"),
      the_lovers: require("@/assets/images/horoscope/tarotDeck/the_lovers.png"),
      the_chariot: require("@/assets/images/horoscope/tarotDeck/the_chariot.png"),
      strength: require("@/assets/images/horoscope/tarotDeck/strength.png"),
      the_hermit: require("@/assets/images/horoscope/tarotDeck/the_hermit.png"),
      wheel_of_fortune: require("@/assets/images/horoscope/tarotDeck/wheel_of_fortune.png"),
      justice: require("@/assets/images/horoscope/tarotDeck/justice.png"),
      the_hanged_man: require("@/assets/images/horoscope/tarotDeck/the_hanged_man.png"),
      death: require("@/assets/images/horoscope/tarotDeck/death.png"),
      temperance: require("@/assets/images/horoscope/tarotDeck/temperance.png"),
      the_devil: require("@/assets/images/horoscope/tarotDeck/the_devil.png"),
      the_tower: require("@/assets/images/horoscope/tarotDeck/the_tower.png"),
      the_star: require("@/assets/images/horoscope/tarotDeck/the_star.png"),
      the_moon: require("@/assets/images/horoscope/tarotDeck/the_moon.png"),
      the_sun: require("@/assets/images/horoscope/tarotDeck/the_sun.png"),
      judgement: require("@/assets/images/horoscope/tarotDeck/judgement.png"),
      the_world: require("@/assets/images/horoscope/tarotDeck/the_world.png"),
      // Minor Arcana - Wands
      ace_of_wands: require("@/assets/images/horoscope/tarotDeck/ace_of_wands.png"),
      two_of_wands: require("@/assets/images/horoscope/tarotDeck/two_of_wands.png"),
      three_of_wands: require("@/assets/images/horoscope/tarotDeck/three_of_wands.png"),
      four_of_wands: require("@/assets/images/horoscope/tarotDeck/four_of_wands.png"),
      five_of_wands: require("@/assets/images/horoscope/tarotDeck/five_of_wands.png"),
      six_of_wands: require("@/assets/images/horoscope/tarotDeck/six_of_wands.png"),
      seven_of_wands: require("@/assets/images/horoscope/tarotDeck/seven_of_wands.png"),
      eight_of_wands: require("@/assets/images/horoscope/tarotDeck/eight_of_wands.png"),
      nine_of_wands: require("@/assets/images/horoscope/tarotDeck/nine_of_wands.png"),
      ten_of_wands: require("@/assets/images/horoscope/tarotDeck/ten_of_wands.png"),
      page_of_wands: require("@/assets/images/horoscope/tarotDeck/page_of_wands.png"),
      knight_of_wands: require("@/assets/images/horoscope/tarotDeck/knight_of_wands.png"),
      queen_of_wands: require("@/assets/images/horoscope/tarotDeck/queen_of_wands.png"),
      king_of_wands: require("@/assets/images/horoscope/tarotDeck/king_of_wands.png"),
      // Minor Arcana - Cups
      ace_of_cups: require("@/assets/images/horoscope/tarotDeck/ace_of_cups.png"),
      two_of_cups: require("@/assets/images/horoscope/tarotDeck/two_of_cups.png"),
      three_of_cups: require("@/assets/images/horoscope/tarotDeck/three_of_cups.png"),
      four_of_cups: require("@/assets/images/horoscope/tarotDeck/four_of_cups.png"),
      five_of_cups: require("@/assets/images/horoscope/tarotDeck/five_of_cups.png"),
      six_of_cups: require("@/assets/images/horoscope/tarotDeck/six_of_cups.png"),
      seven_of_cups: require("@/assets/images/horoscope/tarotDeck/seven_of_cups.png"),
      eight_of_cups: require("@/assets/images/horoscope/tarotDeck/eight_of_cups.png"),
      nine_of_cups: require("@/assets/images/horoscope/tarotDeck/nine_of_cups.png"),
      ten_of_cups: require("@/assets/images/horoscope/tarotDeck/ten_of_cups.png"),
      page_of_cups: require("@/assets/images/horoscope/tarotDeck/page_of_cups.png"),
      knight_of_cups: require("@/assets/images/horoscope/tarotDeck/knight_of_cups.png"),
      queen_of_cups: require("@/assets/images/horoscope/tarotDeck/queen_of_cups.png"),
      king_of_cups: require("@/assets/images/horoscope/tarotDeck/king_of_cups.png"),
      // Minor Arcana - Swords
      ace_of_swords: require("@/assets/images/horoscope/tarotDeck/ace_of_swords.png"),
      two_of_swords: require("@/assets/images/horoscope/tarotDeck/two_of_swords.png"),
      three_of_swords: require("@/assets/images/horoscope/tarotDeck/three_of_swords.png"),
      four_of_swords: require("@/assets/images/horoscope/tarotDeck/four_of_swords.png"),
      five_of_swords: require("@/assets/images/horoscope/tarotDeck/five_of_swords.png"),
      six_of_swords: require("@/assets/images/horoscope/tarotDeck/six_of_swords.png"),
      seven_of_swords: require("@/assets/images/horoscope/tarotDeck/seven_of_swords.png"),
      eight_of_swords: require("@/assets/images/horoscope/tarotDeck/eight_of_swords.png"),
      nine_of_swords: require("@/assets/images/horoscope/tarotDeck/nine_of_swords.png"),
      ten_of_swords: require("@/assets/images/horoscope/tarotDeck/ten_of_swords.png"),
      page_of_swords: require("@/assets/images/horoscope/tarotDeck/page_of_swords.png"),
      knight_of_swords: require("@/assets/images/horoscope/tarotDeck/knight_of_swords.png"),
      queen_of_swords: require("@/assets/images/horoscope/tarotDeck/queen_of_swords.png"),
      king_of_swords: require("@/assets/images/horoscope/tarotDeck/king_of_swords.png"),
      // Minor Arcana - Pentacles
      ace_of_pentacles: require("@/assets/images/horoscope/tarotDeck/ace_of_pentacles.png"),
      two_of_pentacles: require("@/assets/images/horoscope/tarotDeck/two_of_pentacles.png"),
      three_of_pentacles: require("@/assets/images/horoscope/tarotDeck/three_of_pentacles.png"),
      four_of_pentacles: require("@/assets/images/horoscope/tarotDeck/four_of_pentacles.png"),
      five_of_pentacles: require("@/assets/images/horoscope/tarotDeck/five_of_pentacles.png"),
      six_of_pentacles: require("@/assets/images/horoscope/tarotDeck/six_of_pentacles.png"),
      seven_of_pentacles: require("@/assets/images/horoscope/tarotDeck/seven_of_pentacles.png"),
      eight_of_pentacles: require("@/assets/images/horoscope/tarotDeck/eight_of_pentacles.png"),
      nine_of_pentacles: require("@/assets/images/horoscope/tarotDeck/nine_of_pentacles.png"),
      ten_of_pentacles: require("@/assets/images/horoscope/tarotDeck/ten_of_pentacles.png"),
      page_of_pentacles: require("@/assets/images/horoscope/tarotDeck/page_of_pentacles.png"),
      knight_of_pentacles: require("@/assets/images/horoscope/tarotDeck/knight_of_pentacles.png"),
      queen_of_pentacles: require("@/assets/images/horoscope/tarotDeck/queen_of_pentacles.png"),
      king_of_pentacles: require("@/assets/images/horoscope/tarotDeck/king_of_pentacles.png"),
    };

    // Return the mapped image or fallback
    return (
      cardImageMap[imageName] ||
      require("@/assets/images/horoscope/tarotCard.png")
    );
  };

  // Translate tarot card name
  const translateTarotCard = (cardName: string): string => {
    const translationKey = `tarot.cards.translations.${cardName}`;
    const translated = t(translationKey);
    // If translation exists and is different from key, return it
    if (translated && translated !== translationKey) {
      return translated;
    }
    // Otherwise return original name
    return cardName;
  };

  // Form states
  const [intent, setIntent] = useState<string>("");
  const [selectedSpread, setSelectedSpread] = useState<SpreadType | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [cards, setCards] = useState<CardInput[]>([]);
  const [customPositionMeanings, setCustomPositionMeanings] = useState<
    string[]
  >([]);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Listen for drawn cards from modal
  useFocusEffect(
    useCallback(() => {
      const loadDrawnCards = async () => {
        try {
          // Try to get from AsyncStorage first
          const storedCards = await AsyncStorage.getItem("drawnTarotCards");
          if (storedCards) {
            const drawnCards = JSON.parse(storedCards);
            console.log("Received drawn cards from storage:", drawnCards);

            // Update cards with drawn cards
            setCards((prev) => {
              const updatedCards = prev.map((card, index) => {
                const drawnCard = drawnCards[index];
                if (drawnCard) {
                  return {
                    ...card,
                    cardName: drawnCard.cardName,
                    direction: drawnCard.direction,
                    positionMeaning: drawnCard.positionMeaning,
                  };
                }
                return card;
              });
              console.log("Updated cards:", updatedCards);
              return updatedCards;
            });

            // Clear AsyncStorage after loading
            await AsyncStorage.removeItem("drawnTarotCards");
          }

          // Also check params as fallback
          if (params.drawnCards) {
            try {
              const drawnCards = JSON.parse(params.drawnCards as string);
              console.log("Received drawn cards from params:", drawnCards);

              setCards((prev) => {
                const updatedCards = prev.map((card, index) => {
                  const drawnCard = drawnCards[index];
                  if (drawnCard) {
                    return {
                      ...card,
                      cardName: drawnCard.cardName,
                      direction: drawnCard.direction,
                      positionMeaning: drawnCard.positionMeaning,
                    };
                  }
                  return card;
                });
                return updatedCards;
              });

              router.setParams({ drawnCards: undefined });
            } catch (error) {
              console.error("Error parsing drawn cards from params:", error);
            }
          }
        } catch (error) {
          console.error("Error loading drawn cards:", error);
        }
      };

      loadDrawnCards();
    }, [params.drawnCards, router])
  );

  // Spread types - Filter out custom spread (positions === 0)
  const spreadTypes = useMemo(() => {
    const data = t("tarot.spreadTypes", { returnObjects: true }) as Array<{
      id: string;
      name: string;
      positions: number;
      defaultPositions?: string[];
    }>;

    if (!Array.isArray(data)) {
      return [];
    }
    // Filter out custom spread (positions === 0)
    return data.filter((spread) => spread.positions > 0);
  }, [t]);

  // Domain options
  const domains = useMemo(() => {
    const data = t("tarot.domains", { returnObjects: true }) as string[];
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  }, [t]);

  // Check if spread is free (only "three-card" - past/present/future is free)
  const isFreeSpread = (spread: SpreadType) => {
    // Only "three-card" spread is free, all others require platinum
    return spread.id?.toLowerCase() === "three-card";
  };

  // Handle spread selection
  const handleSpreadSelect = (spread: SpreadType) => {
    // Skip custom spread for now (would need additional UI for position count)
    if (spread.positions === 0) {
      return;
    }

    // Check if spread requires platinum and user is not platinum
    if (!isFreeSpread(spread) && !isPlatinum) {
      // Don't allow selection for non-platinum users
      return;
    }

    setSelectedSpread(spread);
    // Initialize cards array based on spread positions
    const newCards: CardInput[] = Array.from(
      { length: spread.positions },
      (_, i) => ({
        id: `card-${i + 1}`,
        cardName: "",
        direction: "upright",
        position: i + 1,
        positionMeaning: spread.defaultPositions?.[i] || "",
      })
    );
    setCards(newCards);
    setCustomPositionMeanings(
      spread.defaultPositions || Array(spread.positions).fill("")
    );
    setShowError(false);
  };

  // Get spread positions count
  const spreadPositions = selectedSpread?.positions || 0;

  // Handle domain selection
  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setShowError(false);
  };

  // Update card information
  const updateCard = (
    cardId: string,
    field: "cardName" | "direction" | "positionMeaning",
    value: string
  ) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, [field]: value } : card
      )
    );
    setShowError(false);
  };

  // Toggle card direction
  const toggleCardDirection = (cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              direction: card.direction === "upright" ? "reversed" : "upright",
            }
          : card
      )
    );
  };

  // Update custom position meaning
  const updatePositionMeaning = (index: number, meaning: string) => {
    const newMeanings = [...customPositionMeanings];
    newMeanings[index] = meaning;
    setCustomPositionMeanings(newMeanings);
    setCards((prev) =>
      prev.map((card, i) =>
        i === index ? { ...card, positionMeaning: meaning } : card
      )
    );
  };

  // Validation
  const validateForm = (): boolean => {
    if (intent.trim() === "") {
      setErrorMessage(t("tarot.validation.intentRequired"));
      return false;
    }
    if (!selectedSpread) {
      setErrorMessage(t("tarot.validation.spreadRequired"));
      return false;
    }
    if (!selectedDomain) {
      setErrorMessage(t("tarot.validation.domainRequired"));
      return false;
    }
    if (cards.some((card) => card.cardName.trim() === "")) {
      setErrorMessage(t("tarot.validation.cardsRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setShowError(true);
      return;
    }

    setShowError(false);

    // Build tarot reading data
    const tarotData = {
      intent,
      spread: selectedSpread?.name,
      domain: selectedDomain,
      cards: cards.map((card) => ({
        position: card.position,
        cardName: card.cardName,
        direction: card.direction,
        positionMeaning:
          card.positionMeaning || customPositionMeanings[card.position - 1],
      })),
    };

    console.log("Tarot Reading Data:", tarotData);

    // Navigate to tarot result page
    router.push({
      pathname: "/(auth)/(modal)/tarotResult",
      params: { tarotData: JSON.stringify(tarotData) },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.containerS}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("tarot.title")}</Text>

        <View style={{ alignItems: "center", paddingVertical: hp(2) }}>
          <Image
            style={styles.image}
            source={require("@/assets/images/horoscope/tarotCard.png")}
            resizeMode="cover"
          />
        </View>

        {/* Intent Section */}
        <Text style={styles.sectionTitle}>{t("tarot.intent.title")}</Text>
        <Text style={styles.sectionDescription}>
          {t("tarot.intent.description")}
        </Text>
        <TextInput
          value={intent}
          onChangeText={(text) => {
            setIntent(text);
            if (text.trim() !== "") {
              setShowError(false);
            }
          }}
          multiline
          placeholder={t("tarot.intent.placeholder")}
          placeholderTextColor="white"
          style={styles.textArea}
        />

        {/* Domain Selection */}
        <Text style={styles.sectionTitle}>{t("tarot.domain.title")}</Text>
        <Text style={styles.sectionDescription}>
          {t("tarot.domain.description")}
        </Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.domainList}
          data={domains}
          keyExtractor={(item, index) => `domain-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.domainCard,
                selectedDomain === item && styles.selectedDomainCard,
              ]}
              onPress={() => handleDomainSelect(item)}
            >
              <Text
                style={[
                  styles.domainCardText,
                  selectedDomain === item && styles.selectedDomainCardText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Spread Selection */}
        <Text style={styles.sectionTitle}>{t("tarot.spread.title")}</Text>
        <Text style={styles.sectionDescription}>
          {t("tarot.spread.description")}
        </Text>
        <View style={styles.spreadContainer}>
          {spreadTypes.map((spread) => {
            const isFree = isFreeSpread(spread);
            const isLocked = !isFree && !isPlatinum;

            return (
              <TouchableOpacity
                key={spread.id}
                style={[
                  styles.spreadCard,
                  selectedSpread?.id === spread.id && styles.selectedSpreadCard,
                  isLocked && styles.lockedSpreadCard,
                ]}
                onPress={() => handleSpreadSelect(spread)}
                disabled={isLocked}
              >
                <View style={styles.spreadCardContent}>
                  <View style={styles.spreadCardTextContainer}>
                    <Text
                      style={[
                        styles.spreadCardText,
                        selectedSpread?.id === spread.id &&
                          styles.selectedSpreadCardText,
                        isLocked && styles.lockedSpreadCardText,
                      ]}
                    >
                      {spread.name}
                    </Text>
                    <Text
                      style={[
                        styles.spreadCardSubtext,
                        selectedSpread?.id === spread.id &&
                          styles.selectedSpreadCardSubtext,
                        isLocked && styles.lockedSpreadCardSubtext,
                      ]}
                    >
                      {spread.positions} {t("tarot.spread.cards")}
                    </Text>
                  </View>
                  {isLocked && (
                    <TouchableOpacity
                      style={styles.lockContainer}
                      onPress={() => {
                        router.push("/(auth)/(modal)/Plans");
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={hp(2.5)}
                        color={Colors.grayColor}
                        style={styles.lockIcon}
                      />
                      <Text style={styles.platinumLabel}>{"Platinum"}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cards Input Section */}
        {selectedSpread && cards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t("tarot.cards.title")}</Text>
            <Text style={styles.sectionDescription}>
              {t("tarot.cards.description")}
            </Text>

            {/* Draw Cards Button */}
            <TouchableOpacity
              style={styles.drawCardsButton}
              onPress={() => {
                router.push({
                  pathname: "/(auth)/(modal)/drawTarotCards",
                  params: {
                    positions: spreadPositions.toString(),
                    positionMeanings: JSON.stringify(
                      selectedSpread.defaultPositions || customPositionMeanings
                    ),
                  },
                });
              }}
            >
              <LinearGradient
                colors={["#724cfd", "#bb38f6"]}
                style={styles.drawCardsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.drawCardsButtonText}>
                  {t("tarot.cards.drawCards") || "Draw Your Cards"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Display Drawn Cards */}
            {cards.some((card) => card.cardName.trim() !== "") && (
              <>
                <Text style={styles.drawnCardsTitle}>
                  {t("tarot.cards.drawnCardsTitle") || "Çekilen Kartlarınız"}
                </Text>
                {cards.map((card, index) => {
                  // Only show cards that have been drawn
                  if (card.cardName.trim() === "") {
                    return null;
                  }

                  return (
                    <View key={card.id} style={styles.drawnCardContainer}>
                      {/* Position Number - Large and Beautiful */}
                      <View style={styles.positionNumberContainer}>
                        <Text style={styles.positionNumber}>
                          {card.position}
                        </Text>
                        {(customPositionMeanings[index] ||
                          card.positionMeaning) && (
                          <Text style={styles.positionMeaningText}>
                            {customPositionMeanings[index] ||
                              card.positionMeaning}
                          </Text>
                        )}
                      </View>

                      {/* Card Image - Large and Beautiful (2:3 format) */}
                      <View style={styles.cardImageContainer}>
                        <Image
                          source={getCardImage(card.cardName)}
                          style={[
                            styles.cardImageLarge,
                            card.direction === "reversed" &&
                              styles.cardImageReversed,
                          ]}
                          resizeMode="contain"
                        />
                        {/* Direction Badge on Card */}
                        <View
                          style={[
                            styles.directionBadgeOnCard,
                            card.direction === "reversed" &&
                              styles.directionBadgeReversedOnCard,
                          ]}
                        >
                          <Text style={styles.directionTextOnCard}>
                            {card.direction === "upright"
                              ? t("tarot.cards.upright")
                              : t("tarot.cards.reversed")}
                          </Text>
                        </View>
                      </View>

                      {/* Card Name - Below Image */}
                      <Text style={styles.cardNameLarge}>
                        {translateTarotCard(card.cardName)}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* Submit Button */}
        <TouchableOpacity style={styles.buttonContainer} onPress={handleSubmit}>
          <LinearGradient
            colors={["#724cfd", "#bb38f6"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>{t("tarot.button")}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {showError && (
          <Text style={styles.errorText}>
            {errorMessage || t("tarot.validation.empty")}
          </Text>
        )}
      </ScrollView>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </View>
  );
};

export default Tarot;

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
    marginBottom: hp(1),
  },
  image: {
    width: wp(50),
    height: hp(20),
    borderRadius: 12,
  },
  sectionTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.5),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginTop: hp(2.5),
    marginBottom: hp(0.5),
  },
  sectionDescription: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.6),
    fontWeight: "400",
    color: Colors.grayColor,
    marginBottom: hp(1.5),
    lineHeight: hp(2.2),
  },
  textArea: {
    width: "100%",
    height: hp(12),
    borderRadius: 12,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: Colors.purplePalmitryBg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: hp(2),
    color: "white",
    marginBottom: hp(1),
  },
  domainList: {
    paddingVertical: hp(1),
    gap: wp(2),
  },
  domainCard: {
    borderWidth: 1,
    borderRadius: 22,
    borderColor: Colors.purpleColorBlack,
    backgroundColor: Colors.background,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    marginRight: wp(2),
  },
  selectedDomainCard: {
    backgroundColor: Colors.purpleColorBlack,
  },
  domainCardText: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.8),
    fontWeight: "400",
    color: Colors.purpleColorBlack,
  },
  selectedDomainCardText: {
    color: "#fff",
  },
  spreadContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp(2),
    marginBottom: hp(1),
  },
  spreadCard: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: Colors.purpleColorBlack,
    backgroundColor: Colors.background,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
    minWidth: wp(90),
  },
  selectedSpreadCard: {
    backgroundColor: Colors.purpleColorBlack,
  },
  lockedSpreadCard: {
    opacity: 0.6,
    borderColor: Colors.grayColor,
  },
  spreadCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  spreadCardTextContainer: {
    flex: 1,
  },
  lockContainer: {
    alignItems: "center",
    marginLeft: wp(2),
  },
  lockIcon: {
    marginBottom: hp(0.3),
  },
  platinumLabel: {
    fontSize: hp(1.2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.grayColor,
    textAlign: "center",
  },
  lockedSpreadCardText: {
    color: Colors.grayColor,
  },
  lockedSpreadCardSubtext: {
    color: Colors.grayColor,
  },
  spreadCardText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginBottom: hp(0.3),
  },
  selectedSpreadCardText: {
    color: "#fff",
  },
  spreadCardSubtext: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.5),
    fontWeight: "400",
    color: Colors.grayColor,
  },
  selectedSpreadCardSubtext: {
    color: "rgba(255,255,255,0.8)",
  },
  cardInputContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
  },
  cardPositionLabel: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  positionMeaningLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.5),
    fontWeight: "400",
    color: Colors.grayColor,
    fontStyle: "italic",
  },
  positionMeaningInput: {
    width: "100%",
    height: hp(5),
    borderRadius: 8,
    paddingHorizontal: wp(3),
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: hp(1.6),
    color: Colors.purpleColorBlack,
    marginBottom: hp(1),
  },
  cardNameInput: {
    width: "100%",
    height: hp(6),
    borderRadius: 8,
    paddingHorizontal: wp(3),
    backgroundColor: Colors.purplePalmitryBg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: hp(2),
    color: "white",
    marginBottom: hp(1),
  },
  directionButton: {
    backgroundColor: Colors.purpleColorBlack,
    borderRadius: 8,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    alignItems: "center",
  },
  directionButtonReversed: {
    backgroundColor: "#d32f2f",
  },
  directionButtonText: {
    color: "white",
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  directionButtonTextReversed: {
    color: "white",
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
    marginBottom: hp(1),
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
  errorText: {
    color: "#FF3B30",
    fontSize: hp(1.8),
    fontFamily: "Rubik_400Regular",
    fontWeight: "400",
    textAlign: "center",
    marginTop: hp(1),
    paddingHorizontal: wp(5),
  },
  drawCardsButton: {
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
    marginBottom: hp(2),
  },
  drawCardsGradient: {
    paddingVertical: hp(2),
    alignItems: "center",
  },
  drawCardsButtonText: {
    color: "white",
    fontSize: hp(2.2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  drawnCardContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: wp(1.5),
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  positionNumberContainer: {
    alignItems: "center",
    marginBottom: hp(2),
  },
  positionNumber: {
    fontSize: hp(4.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "700",
    color: Colors.purpleColorBlack,
    textAlign: "center",
    marginBottom: hp(0.5),
  },
  positionMeaningText: {
    fontSize: hp(1.6),
    fontFamily: "Rubik_400Regular",
    fontWeight: "400",
    color: Colors.grayColor,
    fontStyle: "italic",
    textAlign: "center",
  },
  cardImageContainer: {
    width: wp(80), // Increased from wp(70) for even larger cards
    aspectRatio: 2 / 3, // Vertical format (2:3 ratio like 2048x3072px)
    marginBottom: hp(2),
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImageLarge: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  cardImageReversed: {
    transform: [{ rotate: "180deg" }],
  },
  directionBadgeOnCard: {
    position: "absolute",
    top: hp(1),
    right: wp(2),
    backgroundColor: "rgba(114, 76, 253, 0.95)",
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  directionBadgeReversedOnCard: {
    backgroundColor: "rgba(211, 47, 47, 0.95)",
  },
  directionTextOnCard: {
    color: "#fff",
    fontSize: hp(1.3),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardNameLarge: {
    fontSize: hp(2.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    textAlign: "center",
    marginTop: hp(0.5),
  },
  drawnCardsTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.2),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginTop: hp(2),
    marginBottom: hp(1.5),
  },
});
