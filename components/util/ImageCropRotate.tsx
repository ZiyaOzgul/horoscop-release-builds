// ImageCropRotate.tsx - Using ViewShot for accurate cropping
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    PanResponder,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.8;

interface ImageCropRotateProps {
  imageUri: string;
  onSave: (croppedUri: string) => void;
  onCancel: () => void;
}

const ImageCropRotate: React.FC<ImageCropRotateProps> = ({
  imageUri,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const viewShotRef = useRef<ViewShot | null>(null);
  const lastDistance = useRef<number | null>(null);
  const lastPosition = useRef({ x: 0, y: 0 });

  // Pan responder for touch gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        lastPosition.current = position;
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 1) {
          // Single finger - pan
          setPosition({
            x: lastPosition.current.x + gestureState.dx,
            y: lastPosition.current.y + gestureState.dy,
          });
        } else if (touches.length === 2) {
          // Two fingers - pinch to zoom
          const touch1 = touches[0];
          const touch2 = touches[1];

          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
              Math.pow(touch2.pageY - touch1.pageY, 2)
          );

          if (lastDistance.current === null) {
            lastDistance.current = distance;
          } else {
            const diff = distance - lastDistance.current;
            const scaleFactor = 1 + diff / 400;
            setScale((prev) => Math.max(0.5, Math.min(prev * scaleFactor, 3)));
            lastDistance.current = distance;
          }
        }
      },
      onPanResponderRelease: () => {
        lastDistance.current = null;
      },
    })
  ).current;

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    const viewShot = viewShotRef.current;
    if (!viewShot || !viewShot.capture) {
      alert(t('imageCrop.errors.viewNotReady'));
      return;
    }

    setProcessing(true);
    try {
      // Capture exactly what's visible in the crop area
      const uri = await viewShot.capture();
      onSave(uri);
    } catch (error) {
      console.error('Error capturing image:', error);
      alert(t('imageCrop.errors.processFailed'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{t('imageCrop.buttons.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('imageCrop.title')}</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={processing}
        >
          <Text style={[styles.headerButtonText, styles.saveButton]}>
            {processing ? t('imageCrop.buttons.saving') : t('imageCrop.buttons.save')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Crop Area */}
      <View style={styles.cropContainer}>
        {/* Overlay - Top */}
        <View style={styles.overlayTop} />

        {/* Middle Row with Crop Area */}
        <View style={styles.middleRow}>
          <View style={styles.overlaySide} />

          {/* Actual Crop Area - This is what gets captured */}
          <View style={styles.cropArea}>
            <ViewShot
              ref={viewShotRef}
              options={{
                format: 'jpg',
                quality: 0.9,
                width: CROP_SIZE,
                height: CROP_SIZE,
              }}
              style={styles.viewShotContainer}
            >
              <View style={styles.imageContainer} {...panResponder.panHandlers}>
                <Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.image,
                    {
                      transform: [
                        { translateX: position.x },
                        { translateY: position.y },
                        { scale: scale },
                        { rotate: `${rotation}deg` },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            </ViewShot>

            {/* Crop Frame Border */}
            <View style={styles.cropFrame} pointerEvents="none">
              <View style={styles.cropGridVertical1} />
              <View style={styles.cropGridVertical2} />
              <View style={styles.cropGridHorizontal1} />
              <View style={styles.cropGridHorizontal2} />

              {/* Corner handles */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>

          <View style={styles.overlaySide} />
        </View>

        {/* Overlay - Bottom */}
        <View style={styles.overlayBottom} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.instructionText}>
          {t('imageCrop.instructions')}
        </Text>

        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRotate}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.controlLabel}>{t('imageCrop.controls.rotate')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.controlLabel}>{t('imageCrop.controls.zoomIn')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
            <Ionicons name="remove-circle-outline" size={24} color="#fff" />
            <Text style={styles.controlLabel}>{t('imageCrop.controls.zoomOut')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
            <Ionicons name="reload-circle-outline" size={24} color="#fff" />
            <Text style={styles.controlLabel}>{t('imageCrop.controls.reset')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {t('imageCrop.stats.scale')}: {scale.toFixed(1)}x • {t('imageCrop.stats.rotation')}: {rotation}°
          </Text>
        </View>
      </View>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>{t('imageCrop.processing')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },
  headerButton: {
    minWidth: 70,
  },
  headerButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    color: '#8e61fe',
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  middleRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlaySide: {
    flex: 1,
    height: CROP_SIZE,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  cropArea: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    position: 'relative',
  },
  viewShotContainer: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    overflow: 'hidden',
  },
  imageContainer: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: CROP_SIZE,
    height: CROP_SIZE,
  },
  cropFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 4,
  },
  cropGridVertical1: {
    position: 'absolute',
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cropGridVertical2: {
    position: 'absolute',
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cropGridHorizontal1: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cropGridHorizontal2: {
    position: 'absolute',
    top: '66.66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderWidth: 3,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayBottom: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#000',
    paddingBottom: 40,
  },
  instructionText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    color: '#666',
    fontSize: 12,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default ImageCropRotate;

