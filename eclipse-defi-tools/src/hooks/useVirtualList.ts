import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateVirtualItems } from '../utils';

interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualList<T>(
  items: T[],
  options: UseVirtualListOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const virtualItems = calculateVirtualItems(
    containerHeight,
    itemHeight,
    items.length,
    scrollTop,
    overscan
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToItem = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const scrollPosition = index * itemHeight;
      scrollElementRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTo({
        top: virtualItems.totalHeight,
        behavior: 'smooth',
      });
    }
  }, [virtualItems.totalHeight]);

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      const handleScrollEvent = (e: Event) => {
        const target = e.target as HTMLDivElement;
        setScrollTop(target.scrollTop);
      };

      scrollElement.addEventListener('scroll', handleScrollEvent);
      return () => scrollElement.removeEventListener('scroll', handleScrollEvent);
    }
  }, []);

  const visibleItems = items.slice(virtualItems.startIndex, virtualItems.endIndex + 1);

  return {
    scrollElementRef,
    virtualItems,
    visibleItems,
    handleScroll,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
    isScrolledToTop: scrollTop === 0,
    isScrolledToBottom: scrollTop + containerHeight >= virtualItems.totalHeight,
  };
}