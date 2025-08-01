// デザイントークンとテーマ設定
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
};

// カラーモードヘルパー
export const getColorValue = (colorPath: string, isDark: boolean = false): string => {
  const paths = colorPath.split('.');
  let value: Record<string, unknown> | string = theme.colors;
  
  for (const path of paths) {
    if (typeof value === 'object' && value !== null) {
      const nextValue = value[path];
      if (!nextValue) return '';
      if (typeof nextValue === 'string' || typeof nextValue === 'object') {
        value = nextValue as Record<string, unknown> | string;
      } else {
        return '';
      }
    }
  }
  
  // ダークモードの場合は色の階調を反転
  if (isDark && typeof value === 'string') {
    const colorGroup = paths[0] as keyof typeof theme.colors;
    const shade = parseInt(paths[1]);
    if (!isNaN(shade) && theme.colors[colorGroup]) {
      const invertedShade = 1000 - shade;
      const shades = theme.colors[colorGroup] as Record<string, string>;
      const nearestShade = Object.keys(shades)
        .map(s => parseInt(s))
        .filter(s => !isNaN(s))
        .reduce((prev, curr) => {
          return Math.abs(curr - invertedShade) < Math.abs(prev - invertedShade) ? curr : prev;
        });
      return shades[nearestShade.toString()];
    }
  }
  
  return typeof value === 'string' ? value : '';
};

// CSS変数の生成
export const generateCSSVariables = () => {
  const variables: Record<string, string> = {};
  
  // カラー変数
  Object.entries(theme.colors).forEach(([key, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      variables[`--color-${key}-${shade}`] = value;
    });
  });
  
  // スペーシング変数
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables[`--spacing-${key}`] = value;
  });
  
  // ボーダー半径変数
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    variables[`--radius-${key}`] = value;
  });
  
  // アニメーション変数
  Object.entries(theme.animation.duration).forEach(([key, value]) => {
    variables[`--duration-${key}`] = value;
  });
  
  return variables;
};