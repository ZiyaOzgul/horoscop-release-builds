import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

// Full Tarot Deck (78 cards)
const TAROT_DECK = [
  // Major Arcana (22 cards)
  "The Fool",
  "The Magician",
  "The High Priestess",
  "The Empress",
  "The Emperor",
  "The Hierophant",
  "The Lovers",
  "The Chariot",
  "Strength",
  "The Hermit",
  "Wheel of Fortune",
  "Justice",
  "The Hanged Man",
  "Death",
  "Temperance",
  "The Devil",
  "The Tower",
  "The Star",
  "The Moon",
  "The Sun",
  "Judgement",
  "The World",
  // Minor Arcana - Wands (14 cards)
  "Ace of Wands",
  "Two of Wands",
  "Three of Wands",
  "Four of Wands",
  "Five of Wands",
  "Six of Wands",
  "Seven of Wands",
  "Eight of Wands",
  "Nine of Wands",
  "Ten of Wands",
  "Page of Wands",
  "Knight of Wands",
  "Queen of Wands",
  "King of Wands",
  // Minor Arcana - Cups (14 cards)
  "Ace of Cups",
  "Two of Cups",
  "Three of Cups",
  "Four of Cups",
  "Five of Cups",
  "Six of Cups",
  "Seven of Cups",
  "Eight of Cups",
  "Nine of Cups",
  "Ten of Cups",
  "Page of Cups",
  "Knight of Cups",
  "Queen of Cups",
  "King of Cups",
  // Minor Arcana - Swords (14 cards)
  "Ace of Swords",
  "Two of Swords",
  "Three of Swords",
  "Four of Swords",
  "Five of Swords",
  "Six of Swords",
  "Seven of Swords",
  "Eight of Swords",
  "Nine of Swords",
  "Ten of Swords",
  "Page of Swords",
  "Knight of Swords",
  "Queen of Swords",
  "King of Swords",
  // Minor Arcana - Pentacles (14 cards)
  "Ace of Pentacles",
  "Two of Pentacles",
  "Three of Pentacles",
  "Four of Pentacles",
  "Five of Pentacles",
  "Six of Pentacles",
  "Seven of Pentacles",
  "Eight of Pentacles",
  "Nine of Pentacles",
  "Ten of Pentacles",
  "Page of Pentacles",
  "Knight of Pentacles",
  "Queen of Pentacles",
  "King of Pentacles",
];

interface SelectedCard {
  cardName: string;
  direction: "upright" | "reversed";
  position: number;
}

const DrawTarotCards = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();

  const spreadPositions = params.positions
    ? parseInt(params.positions as string, 10)
    : 3;
  const positionMeanings = params.positionMeanings
    ? JSON.parse(params.positionMeanings as string)
    : [];

  const [shuffledDeck, setShuffledDeck] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [isShuffling, setIsShuffling] = useState(true);
  const [showCards, setShowCards] = useState(false);
  const [cardsFlipped, setCardsFlipped] = useState(false);

  // Initialize card positions to simulate deck stacking (right to left)
  useEffect(() => {
    card1TranslateX.value = 0;
    card1TranslateY.value = 0;
    card2TranslateX.value = wp(2);
    card2TranslateY.value = hp(0.4);
    card3TranslateX.value = wp(4);
    card3TranslateY.value = hp(0.8);
    card4TranslateX.value = wp(6);
    card4TranslateY.value = hp(1.2);
    card5TranslateX.value = wp(8);
    card5TranslateY.value = hp(1.6);
  }, []);

  // Animation values for realistic card shuffling
  // Multiple cards for overlapping effect
  const card1Rotation = useSharedValue(0);
  const card1TranslateX = useSharedValue(0);
  const card1TranslateY = useSharedValue(0);
  const card1Scale = useSharedValue(1);

  const card2Rotation = useSharedValue(0);
  const card2TranslateX = useSharedValue(0);
  const card2TranslateY = useSharedValue(0);
  const card2Scale = useSharedValue(1);

  const card3Rotation = useSharedValue(0);
  const card3TranslateX = useSharedValue(0);
  const card3TranslateY = useSharedValue(0);
  const card3Scale = useSharedValue(1);

  const card4Rotation = useSharedValue(0);
  const card4TranslateX = useSharedValue(0);
  const card4TranslateY = useSharedValue(0);
  const card4Scale = useSharedValue(1);

  const card5Rotation = useSharedValue(0);
  const card5TranslateX = useSharedValue(0);
  const card5TranslateY = useSharedValue(0);
  const card5Scale = useSharedValue(1);

  // Shuffle deck function (Fisher-Yates algorithm)
  const shuffleDeck = () => {
    const shuffled = [...TAROT_DECK];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Realistic card shuffling animation - cards from right to left, stacking on top
  const startShuffleAnimation = () => {
    setIsShuffling(true);
    setShowCards(false);
    setSelectedCards([]);

    // Reset all card values - cards start at right side, stacked vertically
    const resetCard = (card: any, index: number) => {
      // Cards start at right side, stacked vertically (2-3 cards visible)
      card.translateX.value = wp(30) + index * wp(2); // Start from right
      card.translateY.value = index * hp(0.4); // Stack vertically
      card.scale.value = 1;
    };

    const cards = [
      {
        translateX: card1TranslateX,
        translateY: card1TranslateY,
        scale: card1Scale,
      },
      {
        translateX: card2TranslateX,
        translateY: card2TranslateY,
        scale: card2Scale,
      },
      {
        translateX: card3TranslateX,
        translateY: card3TranslateY,
        scale: card3Scale,
      },
      {
        translateX: card4TranslateX,
        translateY: card4TranslateY,
        scale: card4Scale,
      },
      {
        translateX: card5TranslateX,
        translateY: card5TranslateY,
        scale: card5Scale,
      },
    ];

    cards.forEach((card, index) => resetCard(card, index));

    // Realistic shuffle: cards move from right to left, stacking on top
    // Each card represents a layer in the deck
    const shuffleSequence = () => {
      // Store current positions
      const currentXPositions = cards.map((card) => card.translateX.value);
      const currentYPositions = cards.map((card) => card.translateY.value);

      // Card 5 (rightmost) moves to left and stacks on top
      cards[4].translateX.value = withSequence(
        // Move from right to center-left
        withTiming(-wp(15), {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
        // Brief pause
        withTiming(-wp(15), {
          duration: 100,
        }),
        // Move to left position (now visually on top)
        withTiming(0, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        })
      );
      cards[4].translateY.value = withSequence(
        withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(0, {
          duration: 100,
        }),
        withTiming(0, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        })
      );

      // Card 4 moves left and stacks
      cards[3].translateX.value = withSequence(
        withTiming(currentXPositions[3] - wp(10), {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(currentXPositions[3] - wp(10), {
          duration: 100,
        }),
        withTiming(currentXPositions[3] - wp(5), {
          duration: 300,
          easing: Easing.in(Easing.ease),
        })
      );
      cards[3].translateY.value = withSequence(
        withTiming(currentYPositions[3] - hp(0.2), {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(currentYPositions[3] - hp(0.2), {
          duration: 100,
        }),
        withTiming(currentYPositions[3] - hp(0.1), {
          duration: 300,
          easing: Easing.in(Easing.ease),
        })
      );

      // Card 3 moves left
      cards[2].translateX.value = withSequence(
        withTiming(currentXPositions[2] - wp(8), {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(currentXPositions[2] - wp(8), {
          duration: 100,
        }),
        withTiming(currentXPositions[2] - wp(4), {
          duration: 300,
          easing: Easing.in(Easing.ease),
        })
      );
      cards[2].translateY.value = withSequence(
        withTiming(currentYPositions[2] - hp(0.15), {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(currentYPositions[2] - hp(0.15), {
          duration: 100,
        }),
        withTiming(currentYPositions[2] - hp(0.05), {
          duration: 300,
          easing: Easing.in(Easing.ease),
        })
      );

      // Card 2 moves slightly
      cards[1].translateX.value = withSequence(
        withTiming(currentXPositions[1] - wp(5), {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(currentXPositions[1] - wp(5), {
          duration: 100,
        }),
        withTiming(currentXPositions[1] - wp(2), {
          duration: 300,
          easing: Easing.in(Easing.ease),
        })
      );
      cards[1].translateY.value = withSequence(
        withTiming(currentYPositions[1] - hp(0.1), {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(currentYPositions[1] - hp(0.1), {
          duration: 100,
        }),
        withTiming(currentYPositions[1], {
          duration: 300,
          easing: Easing.in(Easing.ease),
        })
      );

      // Card 1 (leftmost) stays relatively still
      cards[0].translateX.value = withSequence(
        withTiming(currentXPositions[0], {
          duration: 700,
        })
      );
      cards[0].translateY.value = withSequence(
        withTiming(currentYPositions[0], {
          duration: 700,
        })
      );
    };

    // Repeat shuffle sequence multiple times
    shuffleSequence();
    setTimeout(() => {
      shuffleSequence();
      setTimeout(() => {
        shuffleSequence();
        setTimeout(() => {
          shuffleSequence();
          setTimeout(() => {
            shuffleSequence();
            setTimeout(() => {
              // Final shuffle and return to center
              const shuffled = shuffleDeck();
              setShuffledDeck(shuffled);

              // Smooth return to center for all cards
              cards.forEach((card, index) => {
                card.translateX.value = withTiming(0, {
                  duration: 400,
                  easing: Easing.out(Easing.ease),
                });
                card.translateY.value = withTiming(index * hp(0.3), {
                  duration: 400,
                  easing: Easing.out(Easing.ease),
                });
                card.scale.value = withTiming(1, {
                  duration: 400,
                  easing: Easing.out(Easing.ease),
                });
              });

              setIsShuffling(false);
              setShowCards(true);
            }, 700);
          }, 700);
        }, 700);
      }, 700);
    }, 700);
  };

  // Handle card selection - once selected, cannot be changed
  const handleCardSelect = (cardName: string) => {
    // Don't allow selection if cards are already flipped
    if (cardsFlipped) {
      return;
    }

    // Check if card is already selected
    const isAlreadySelected = selectedCards.some(
      (card) => card.cardName === cardName
    );

    // Once selected, cannot be deselected
    if (isAlreadySelected) {
      return;
    }

    // Don't allow selecting more than required positions
    if (selectedCards.length >= spreadPositions) {
      return;
    }

    // Randomly determine if card is upright or reversed (50/50 chance)
    const direction: "upright" | "reversed" =
      Math.random() < 0.5 ? "upright" : "reversed";

    const newCard: SelectedCard = {
      cardName,
      direction,
      position: selectedCards.length + 1,
    };

    const updatedCards = [...selectedCards, newCard];
    setSelectedCards(updatedCards);

    // If all cards are selected, trigger flip animation after a short delay
    if (updatedCards.length === spreadPositions) {
      setTimeout(() => {
        setCardsFlipped(true);
      }, 500);
    }
  };

  // Toggle card direction - only allowed before cards are flipped
  const toggleCardDirection = (cardName: string) => {
    if (cardsFlipped) {
      return;
    }
    setSelectedCards((prev) =>
      prev.map((card) =>
        card.cardName === cardName
          ? {
              ...card,
              direction: card.direction === "upright" ? "reversed" : "upright",
            }
          : card
      )
    );
  };

  // Complete and return cards
  const handleComplete = async () => {
    if (selectedCards.length < spreadPositions) {
      return;
    }

    // Sort by position
    const sortedCards = [...selectedCards].sort(
      (a, b) => a.position - b.position
    );

    const cardsData = sortedCards.map((card, index) => ({
      position: card.position,
      cardName: card.cardName,
      direction: card.direction,
      positionMeaning: positionMeanings[index] || "",
    }));

    // Save drawn cards to AsyncStorage
    try {
      await AsyncStorage.setItem("drawnTarotCards", JSON.stringify(cardsData));
      console.log("✅ Drawn cards saved to AsyncStorage");
    } catch (error) {
      console.error("Error saving drawn cards:", error);
    }

    // Navigate back to tarot page
    router.back();
  };

  // Animated styles for realistic card shuffling - right to left, stacking
  const card1AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: card1Scale.value },
        { translateX: card1TranslateX.value },
        { translateY: card1TranslateY.value },
      ],
    };
  });

  const card2AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: card2Scale.value },
        { translateX: card2TranslateX.value },
        { translateY: card2TranslateY.value },
      ],
    };
  });

  const card3AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: card3Scale.value },
        { translateX: card3TranslateX.value },
        { translateY: card3TranslateY.value },
      ],
    };
  });

  const card4AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: card4Scale.value },
        { translateX: card4TranslateX.value },
        { translateY: card4TranslateY.value },
      ],
    };
  });

  const card5AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: card5Scale.value },
        { translateX: card5TranslateX.value },
        { translateY: card5TranslateY.value },
      ],
    };
  });

  // Initialize shuffle on mount
  useEffect(() => {
    startShuffleAnimation();
  }, []);

  const canComplete = selectedCards.length === spreadPositions;

  // Center Card Component with flip animation
  const CenterCardComponent = React.memo(
    ({
      card,
      index,
      isFlipped,
      getCardImage,
      positionMeanings,
      t,
    }: {
      card: SelectedCard;
      index: number;
      isFlipped: boolean;
      getCardImage: (cardName: string) => any;
      positionMeanings: string[];
      t: any;
    }) => {
      const flipRotation = useSharedValue(0);

      React.useEffect(() => {
        if (isFlipped) {
          const delay = index * 200;
          setTimeout(() => {
            flipRotation.value = withTiming(180, {
              duration: 800,
              easing: Easing.inOut(Easing.ease),
            });
          }, delay);
        }
      }, [isFlipped, index]);

      // Use opacity for flip animation to avoid mirror image issue
      const flipOpacity = useSharedValue(0);

      React.useEffect(() => {
        if (isFlipped) {
          const delay = index * 200;
          setTimeout(() => {
            flipOpacity.value = withTiming(1, {
              duration: 800,
              easing: Easing.inOut(Easing.ease),
            });
          }, delay);
        } else {
          flipOpacity.value = 0;
        }
      }, [isFlipped, index]);

      const flipStyle = useAnimatedStyle(() => {
        return {
          opacity: flipOpacity.value,
        };
      });

      const backOpacity = useAnimatedStyle(() => {
        return {
          opacity: 1 - flipOpacity.value,
        };
      });

      // Additional rotation for reversed cards
      const reversedRotation = useSharedValue(0);

      React.useEffect(() => {
        if (isFlipped && card.direction === "reversed") {
          // Add 180 degree rotation for reversed cards after flip completes
          setTimeout(
            () => {
              reversedRotation.value = withTiming(180, {
                duration: 400,
                easing: Easing.inOut(Easing.ease),
              });
            },
            800 + index * 200
          ); // Wait for flip to complete
        } else if (isFlipped && card.direction === "upright") {
          // Reset rotation for upright cards
          reversedRotation.value = 0;
        }
      }, [isFlipped, card.direction, index]);

      const reversedStyle = useAnimatedStyle(() => {
        return {
          transform: [{ rotate: `${reversedRotation.value}deg` }],
        };
      });

      return (
        <View style={styles.centerCardWrapper}>
          <View style={styles.centerCardContainer}>
            {/* Card Back */}
            <Animated.View
              style={[
                styles.centerCardBack,
                backOpacity,
                { position: "absolute", width: "100%", height: "100%" },
              ]}
            >
              <Image
                source={require("@/assets/images/horoscope/tarotDeck/tarot_back.png")}
                style={styles.centerCardImageBack}
                resizeMode="stretch"
              />
            </Animated.View>

            {/* Card Front - Image Only (2:3 Vertical Format) */}
            <Animated.View
              style={[
                styles.centerCardFront,
                flipStyle,
                { position: "absolute", width: "100%", height: "100%" },
              ]}
            >
              <Animated.View
                style={[
                  styles.centerCardImageContainer,
                  card.direction === "reversed" && reversedStyle,
                ]}
              >
                <Image
                  source={getCardImage(card.cardName)}
                  style={styles.centerCardImageFront}
                  resizeMode="contain"
                />
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      );
    }
  );

  // Card Component with flip animation
  const CardComponent = React.memo(
    ({
      cardName,
      index,
      isSelected,
      selectedCard,
      isFlipped,
      onSelect,
      getCardImage,
      positionMeanings,
      selectedCardsLength,
      spreadPositions,
      showCards,
      cardsFlipped,
      t,
    }: {
      cardName: string;
      index: number;
      isSelected: boolean;
      selectedCard: SelectedCard | undefined;
      isFlipped: boolean;
      onSelect: (cardName: string) => void;
      getCardImage: (cardName: string) => any;
      positionMeanings: string[];
      selectedCardsLength: number;
      spreadPositions: number;
      showCards: boolean;
      cardsFlipped: boolean;
      t: any;
    }) => {
      // Each card has its own flip rotation
      const flipRotation = useSharedValue(0);

      // Update flip rotation when cardsFlipped changes with cascade effect
      React.useEffect(() => {
        if (isFlipped && selectedCard) {
          // Cascade effect: each card flips with a delay based on its position
          const delay = (selectedCard.position - 1) * 100;
          setTimeout(() => {
            flipRotation.value = withTiming(180, {
              duration: 600,
              easing: Easing.inOut(Easing.ease),
            });
          }, delay);
        }
      }, [isFlipped, selectedCard]);

      const flipStyle = useAnimatedStyle(() => {
        return {
          transform: [{ rotateY: `${flipRotation.value}deg` }],
        };
      });

      return (
        <Animated.View
          entering={FadeInDown.delay(index * 5)}
          style={styles.cardWrapper}
        >
          <Animated.View style={[styles.cardContainer, flipStyle]}>
            {/* Card Back (when not flipped or not selected) */}
            {!isFlipped && (
              <TouchableOpacity
                style={[
                  styles.cardItem,
                  isSelected && styles.cardItemSelected,
                  cardsFlipped && styles.cardItemDisabled,
                  !isSelected &&
                    selectedCardsLength >= spreadPositions &&
                    styles.cardItemDisabled,
                ]}
                onPress={() => onSelect(cardName)}
                disabled={
                  !showCards ||
                  cardsFlipped ||
                  (!isSelected && selectedCardsLength >= spreadPositions)
                }
              >
                <Image
                  source={require("@/assets/images/horoscope/tarotDeck/tarot_back.png")}
                  style={styles.cardImage}
                  resizeMode="stretch"
                />
                <Text
                  style={[
                    styles.cardItemText,
                    isSelected && styles.cardItemTextSelected,
                  ]}
                  numberOfLines={2}
                >
                  {cardName}
                </Text>
                {isSelected && selectedCard && (
                  <View
                    style={[
                      styles.selectedBadge,
                      selectedCard.direction === "reversed" &&
                        styles.selectedBadgeReversed,
                    ]}
                  >
                    <Text style={styles.selectedBadgeText}>
                      {selectedCard.position}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Card Front (when flipped) */}
            {isFlipped && selectedCard && (
              <View
                style={[
                  styles.cardItem,
                  styles.cardItemFlipped,
                  selectedCard.direction === "reversed" &&
                    styles.cardItemReversed,
                ]}
              >
                <Image
                  source={getCardImage(cardName)}
                  style={styles.cardImageFlipped}
                  resizeMode="cover"
                />
                <Text style={styles.cardItemTextFlipped}>{cardName}</Text>
                <View
                  style={[
                    styles.directionBadgeFlipped,
                    selectedCard.direction === "reversed" &&
                      styles.directionBadgeFlippedReversed,
                  ]}
                >
                  <Text style={styles.directionBadgeTextFlipped}>
                    {selectedCard.direction === "upright"
                      ? t("tarot.cards.upright")
                      : t("tarot.cards.reversed")}
                  </Text>
                </View>
                {positionMeanings[selectedCard.position - 1] && (
                  <Text style={styles.positionMeaningFlipped}>
                    {positionMeanings[selectedCard.position - 1]}
                  </Text>
                )}
              </View>
            )}
          </Animated.View>
        </Animated.View>
      );
    }
  );

  // Get card image - maps card names to image files
  // You need 78 card images in assets/images/tarot/cards/ folder
  // Naming convention: lowercase, spaces replaced with underscores, special chars removed
  // Convert card name to image filename format
  // Example: "The Fool" -> "the_fool.png", "Ace of Wands" -> "ace_of_wands.png"
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

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={hp(3)}
            color={Colors.purpleColorBlack}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("tarot.draw.title") || "Select Your Cards"}
        </Text>
        <View style={{ width: wp(15) }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            {t("tarot.draw.instructions") ||
              `Select ${spreadPositions} cards for your reading. Tap cards to select them.`}
          </Text>
          <Text style={styles.progressText}>
            {selectedCards.length} / {spreadPositions}{" "}
            {t("tarot.draw.cardsSelected") || "cards selected"}
          </Text>
        </View>

        {/* Central Deck (Realistic Shuffling with Multiple Cards) - Visible during shuffle */}
        {isShuffling && (
          <View style={styles.centralDeckContainer}>
            {/* Multiple overlapping cards for realistic shuffle effect */}
            <View style={styles.shuffleCardsContainer}>
              {/* Card 5 (backmost) */}
              <Animated.View
                style={[
                  styles.shuffleCard,
                  card5AnimatedStyle,
                  styles.shuffleCard5,
                ]}
              >
                <Image
                  source={require("@/assets/images/horoscope/tarotDeck/tarot_back.png")}
                  style={styles.shuffleCardImage}
                  resizeMode="stretch"
                />
              </Animated.View>

              {/* Card 4 */}
              <Animated.View
                style={[
                  styles.shuffleCard,
                  card4AnimatedStyle,
                  styles.shuffleCard4,
                ]}
              >
                <Image
                  source={require("@/assets/images/horoscope/tarotDeck/tarot_back.png")}
                  style={styles.shuffleCardImage}
                  resizeMode="stretch"
                />
              </Animated.View>

              {/* Card 3 (middle) */}
              <Animated.View
                style={[
                  styles.shuffleCard,
                  card3AnimatedStyle,
                  styles.shuffleCard3,
                ]}
              >
                <Image
                  source={require("@/assets/images/horoscope/tarotDeck/tarot_back.png")}
                  style={styles.shuffleCardImage}
                  resizeMode="stretch"
                />
              </Animated.View>

              {/* Card 2 */}
              <Animated.View
                style={[
                  styles.shuffleCard,
                  card2AnimatedStyle,
                  styles.shuffleCard2,
                ]}
              >
                <Image
                  source={require("@/assets/images/horoscope/tarotDeck/tarot_back.png")}
                  style={styles.shuffleCardImage}
                  resizeMode="stretch"
                />
              </Animated.View>

              {/* Card 1 (frontmost) */}
              <Animated.View
                style={[
                  styles.shuffleCard,
                  card1AnimatedStyle,
                  styles.shuffleCard1,
                ]}
              >
                <Image
                  source={require("@/assets/images/horoscope/tarotDeck/tarot_back.png")}
                  style={styles.shuffleCardImage}
                  resizeMode="stretch"
                />
              </Animated.View>
            </View>
          </View>
        )}

        {/* Cards Grid - Only show when cards are not all selected */}
        {showCards && selectedCards.length < spreadPositions && (
          <View style={styles.cardsContainer}>
            <View style={styles.cardsGrid}>
              {shuffledDeck.map((cardName, index) => {
                const isSelected = selectedCards.some(
                  (card) => card.cardName === cardName
                );

                return (
                  <TouchableOpacity
                    key={`${cardName}-${index}`}
                    style={[
                      styles.cardItemBack,
                      isSelected && styles.cardItemBackSelected,
                      selectedCards.length >= spreadPositions &&
                        styles.cardItemDisabled,
                    ]}
                    onPress={() => handleCardSelect(cardName)}
                    disabled={
                      !showCards ||
                      cardsFlipped ||
                      (!isSelected && selectedCards.length >= spreadPositions)
                    }
                  >
                    <Image
                      source={require("@/assets/images/horoscope/tarotDeck/tarot_back.png")}
                      style={styles.cardImageBack}
                      resizeMode="stretch"
                    />
                    {isSelected && (
                      <View style={styles.selectedBadgeBack}>
                        <Text style={styles.selectedBadgeTextBack}>
                          {selectedCards.find((c) => c.cardName === cardName)
                            ?.position || ""}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Selected Cards Display in Center - After all cards selected */}
        {selectedCards.length === spreadPositions && (
          <View style={styles.centerCardsContainer}>
            {/* Top Row - 2 Cards */}
            <View style={styles.centerCardsTopRow}>
              {selectedCards
                .sort((a, b) => a.position - b.position)
                .slice(0, 2)
                .map((card, index) => (
                  <CenterCardComponent
                    key={card.cardName}
                    card={card}
                    index={index}
                    isFlipped={cardsFlipped}
                    getCardImage={getCardImage}
                    positionMeanings={positionMeanings}
                    t={t}
                  />
                ))}
            </View>
            {/* Bottom Row - 1 Card (centered) */}
            {selectedCards.length >= 3 && (
              <View style={styles.centerCardsBottomRow}>
                <CenterCardComponent
                  key={selectedCards[2].cardName}
                  card={selectedCards[2]}
                  index={2}
                  isFlipped={cardsFlipped}
                  getCardImage={getCardImage}
                  positionMeanings={positionMeanings}
                  t={t}
                />
              </View>
            )}
          </View>
        )}

        {/* Action Buttons - Only show when cards are selected */}
        {selectedCards.length === spreadPositions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.reshuffleButton]}
              onPress={startShuffleAnimation}
              disabled={isShuffling}
            >
              <Text style={styles.actionButtonText}>
                {t("tarot.draw.reshuffle") || "Reshuffle"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.completeButton,
                !canComplete && styles.completeButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={!canComplete || isShuffling}
            >
              <LinearGradient
                colors={canComplete ? ["#724cfd", "#bb38f6"] : ["#ccc", "#ccc"]}
                style={styles.completeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.completeButtonText}>
                  {t("tarot.draw.complete") || "Complete"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding for scroll */}
        <View style={{ height: hp(2) }} />
      </ScrollView>
    </View>
  );
};

export default DrawTarotCards;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: hp(6),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
    backgroundColor: "#fff",
  },
  backButton: {
    padding: wp(2),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  instructionsContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    alignItems: "center",
  },
  instructionsText: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_400Regular",
    color: Colors.grayColor,
    textAlign: "center",
    marginBottom: hp(1),
  },
  progressText: {
    fontSize: hp(2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  centralDeckContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(2),
    zIndex: 10,
    height: hp(25),
  },
  shuffleCardsContainer: {
    width: wp(30),
    height: hp(20),
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  shuffleCard: {
    position: "absolute",
    width: wp(30),
    height: hp(20),
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shuffleCard1: {
    zIndex: 5,
    elevation: 10,
  },
  shuffleCard2: {
    zIndex: 4,
    elevation: 9,
  },
  shuffleCard3: {
    zIndex: 3,
    elevation: 8,
  },
  shuffleCard4: {
    zIndex: 2,
    elevation: 7,
  },
  shuffleCard5: {
    zIndex: 1,
    elevation: 6,
  },
  shuffleCardHidden: {
    opacity: 0,
    pointerEvents: "none",
  },
  shuffleCardImage: {
    width: "100%",
    height: "100%",
  },
  shufflingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  shufflingText: {
    color: "#fff",
    fontSize: hp(2.2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(5),
  },
  cardsContainer: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(2),
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: hp(2),
  },
  cardItem: {
    width: wp(30),
    height: hp(22),
    marginBottom: hp(2),
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: wp(2),
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardItemDisabled: {
    opacity: 0.5,
  },
  cardItemSelected: {
    borderColor: Colors.purpleColorBlack,
    borderWidth: 3,
    backgroundColor: Colors.purpleColorBlack + "20",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    marginBottom: hp(0.8),
  },
  cardItemText: {
    fontSize: hp(1.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    textAlign: "center",
  },
  cardItemTextSelected: {
    color: Colors.purpleColorBlack,
  },
  cardItemTextDisabled: {
    color: Colors.grayColor,
  },
  cardWrapper: {
    width: wp(30),
    height: hp(22),
    marginBottom: hp(2),
  },
  cardContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  cardItemFlipped: {
    backgroundColor: Colors.purplePalmitryBg,
    borderColor: Colors.purpleColorBlack,
    borderWidth: 3,
  },
  cardItemReversed: {
    transform: [{ rotate: "180deg" }],
  },
  cardImageFlipped: {
    width: wp(24),
    height: hp(14),
    borderRadius: 8,
    marginBottom: hp(0.8),
  },
  cardItemTextFlipped: {
    fontSize: hp(1.6),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    marginBottom: hp(0.5),
  },
  directionBadgeFlipped: {
    backgroundColor: Colors.purpleColorBlack,
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: hp(0.5),
  },
  directionBadgeFlippedReversed: {
    backgroundColor: "#d32f2f",
  },
  directionBadgeTextFlipped: {
    color: "#fff",
    fontSize: hp(1.3),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  positionMeaningFlipped: {
    fontSize: hp(1.2),
    fontFamily: "Rubik_400Regular",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: hp(0.3),
  },
  selectedBadge: {
    position: "absolute",
    top: hp(0.5),
    right: wp(2),
    backgroundColor: Colors.purpleColorBlack,
    borderRadius: hp(1.5),
    width: hp(3),
    height: hp(3),
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBadgeReversed: {
    backgroundColor: "#d32f2f",
  },
  selectedBadgeText: {
    color: "#fff",
    fontSize: hp(1.4),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  selectedCardsContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingVertical: hp(2),
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  selectedCardsTitle: {
    fontSize: hp(2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    paddingHorizontal: wp(5),
    marginBottom: hp(1),
  },
  selectedCardsScroll: {
    paddingHorizontal: wp(3),
    gap: wp(2),
  },
  selectedCardDisplay: {
    width: wp(35),
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: wp(3),
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: wp(2),
  },
  selectedCardHeader: {
    marginBottom: hp(0.5),
  },
  selectedCardPosition: {
    fontSize: hp(1.6),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  selectedCardPositionMeaning: {
    fontSize: hp(1.3),
    fontFamily: "Rubik_400Regular",
    color: Colors.grayColor,
    fontStyle: "italic",
    marginTop: hp(0.2),
  },
  selectedCardName: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginBottom: hp(1),
    textAlign: "center",
  },
  selectedCardDirectionButton: {
    backgroundColor: Colors.purpleColorBlack,
    borderRadius: 8,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    alignItems: "center",
  },
  selectedCardDirectionButtonReversed: {
    backgroundColor: "#d32f2f",
  },
  selectedCardDirectionText: {
    color: "#fff",
    fontSize: hp(1.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(2),
    gap: wp(3),
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  reshuffleButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: hp(1.5),
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  completeButton: {
    overflow: "hidden",
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonGradient: {
    paddingVertical: hp(1.5),
    alignItems: "center",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  cardItemBack: {
    width: wp(30),
    height: hp(22),
    marginBottom: hp(2),
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardItemBackSelected: {
    borderColor: Colors.purpleColorBlack,
    borderWidth: 3,
    backgroundColor: Colors.purpleColorBlack + "20",
  },
  cardImageBack: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    position: "absolute",
    top: 0,
    left: 0,
  },
  selectedBadgeBack: {
    position: "absolute",
    top: hp(0.5),
    right: wp(2),
    backgroundColor: Colors.purpleColorBlack,
    borderRadius: hp(1.5),
    width: hp(3),
    height: hp(3),
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBadgeTextBack: {
    color: "#fff",
    fontSize: hp(1.4),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  centerCardsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
    flex: 1,
    minHeight: hp(50),
  },
  centerCardsTopRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: wp(4),
    width: "100%",
    marginBottom: hp(3),
  },
  centerCardsBottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  centerCardWrapper: {
    width: wp(48), // Increased from wp(35) for larger cards
    aspectRatio: 2 / 3, // Vertical format (2:3 ratio like 2048x3072px)
  },
  centerCardContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  centerCardBack: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  centerCardImageBack: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    position: "absolute",
    top: 0,
    left: 0,
  },
  centerCardFront: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerCardImageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  centerCardImageFront: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  centerCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: hp(1),
    paddingHorizontal: wp(2.5),
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: hp(8),
    maxHeight: hp(12),
  },
  centerCardName: {
    fontSize: hp(1.6),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    lineHeight: hp(2),
    marginBottom: hp(0.5),
  },
  centerCardDirectionBadge: {
    backgroundColor: "rgba(114, 76, 253, 0.95)",
    paddingVertical: hp(0.4),
    paddingHorizontal: wp(3),
    borderRadius: 8,
    marginBottom: hp(0.4),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  centerCardDirectionBadgeReversed: {
    backgroundColor: "rgba(211, 47, 47, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  centerCardDirectionText: {
    color: "#fff",
    fontSize: hp(1.2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerCardPositionMeaning: {
    fontSize: hp(1.2),
    fontFamily: "Rubik_400Regular",
    color: "#fff",
    textAlign: "center",
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: hp(1.6),
  },
});
