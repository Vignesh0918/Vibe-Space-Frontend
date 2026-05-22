import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import StoryCircle from './StoryCircle';
import { SIZES } from '../../constants/theme';

/**
 * StoryRow Component
 * Renders a horizontal scrolling list of StoryCircle components,
 * starting with the User Add Story button.
 */
export default function StoryRow({ stories = [], onAddStory, onStoryPress, isUploadingStory }) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {stories.map((story) => (
          <StoryCircle
            key={story.id}
            item={story}
            onPress={() => {
              if (story.isUser) {
                onAddStory && onAddStory();
              } else {
                onStoryPress && onStoryPress(story);
              }
            }}
            isUploading={story.isUser ? isUploadingStory : false}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.spacingMd || 16,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(76, 40, 133, 0.3)',
  },
  scrollContainer: {
    paddingHorizontal: SIZES.spacingMd || 16,
  },
});