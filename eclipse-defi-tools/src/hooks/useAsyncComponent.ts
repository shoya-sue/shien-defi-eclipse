import { useState, useEffect } from 'react';

interface AsyncComponentState<T> {
  component: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsyncComponent<T>(
  importFunction: () => Promise<{ default: T }>,
  deps: React.DependencyList = []
): AsyncComponentState<T> {
  const [state, setState] = useState<AsyncComponentState<T>>({
    component: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const { default: component } = await importFunction();
        
        if (isMounted) {
          setState({
            component,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            component: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [importFunction, ...deps]);

  return state;
}

// プリロード機能
export function preloadComponent<T>(
  importFunction: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFunction();
}

// 複数コンポーネントのプリロード
export function preloadComponents<T = unknown>(
  importFunctions: Array<() => Promise<{ default: T }>>
): Promise<Array<{ default: T }>> {
  return Promise.all(importFunctions.map(fn => fn()));
}