import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { WidgetData } from '../types';

interface SwipeableCardStackProps {
  widgets: WidgetData[];
}

const SWIPE_THRESHOLD = 100;
const OVERFLOW_OFFSET = 8;

const SwipeableCardStack: React.FC<SwipeableCardStackProps> = ({ widgets }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 left, 1 right
  const isDragging = useRef(false);

  const handlePanEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeDistance = offset.x;
    const swipeVelocity = velocity.x;

    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD || Math.abs(swipeVelocity) > 300) {
      // Swiped right to left (next card)
      if (swipeDistance < -50) {
        setDirection(-1);
        setCurrentIndex((prev) => (prev + 1) % widgets.length);
      }
      // Swiped left to right (previous card)
      else if (swipeDistance > 50) {
        setDirection(1);
        setCurrentIndex((prev) => (prev - 1 + widgets.length) % widgets.length);
      }
    }
    isDragging.current = false;
  };

  const handlePanStart = () => {
    isDragging.current = true;
  };

  // Get the visible cards (current + next for stack effect)
  const getVisibleIndices = () => {
    const indices = [];
    // Show current and next 2 cards for the stacking effect
    for (let i = 0; i < Math.min(3, widgets.length); i++) {
      const idx = (currentIndex + i) % widgets.length;
      indices.push(idx);
    }
    return indices;
  };

  const visibleIndices = getVisibleIndices();

  return (
    <div className="relative w-[296px] h-[152px] mx-auto">
      <AnimatePresence>
        {visibleIndices.reverse().map((widgetIndex, stackIndex) => {
          const isCurrent = widgetIndex === currentIndex;
          const zIndex = 10 - stackIndex;
          const scale = 1 - stackIndex * 0.02;
          const yOffset = stackIndex * 8;

          return (
            <motion.div
              key={widgets[widgetIndex].id}
              className="absolute top-0 left-0 will-change-transform"
              style={{ zIndex }}
              initial={{
                x: direction === 1 ? -300 : 300,
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                x: 0,
                opacity: 1,
                scale,
                y: yOffset,
              }}
              exit={{
                x: direction === -1 ? -300 : 300,
                opacity: 0,
                scale: 0.8,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              drag={isCurrent ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              onPanStart={handlePanStart}
              onPanEnd={handlePanEnd}
            >
              <div className="shadow-lg">
                {widgets[widgetIndex].component()}
              </div>
              {!isCurrent && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none"
                  style={{ borderRadius: 0 }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {widgets.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-black w-4 rounded'
                : 'bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SwipeableCardStack;
