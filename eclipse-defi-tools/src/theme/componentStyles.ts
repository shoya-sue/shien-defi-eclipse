// 共通コンポーネントスタイルの定義
export const componentStyles = {
  // カードスタイル
  card: {
    base: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300',
    rounded: {
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
    },
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    shadow: {
      none: '',
      sm: 'shadow-sm hover:shadow-md',
      md: 'shadow-md hover:shadow-lg',
      lg: 'shadow-lg hover:shadow-xl',
    },
  },
  
  // ボタンスタイル
  button: {
    base: 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed',
    size: {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-lg',
    },
    variant: {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 focus:ring-gray-500',
      outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-gray-500',
      danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
      success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    },
  },
  
  // インプットスタイル
  input: {
    base: 'w-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    size: {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-lg',
    },
    variant: {
      default: 'border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400',
      filled: 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:bg-gray-800',
    },
  },
  
  // テキストスタイル
  text: {
    heading: {
      h1: 'text-3xl font-bold text-gray-900 dark:text-gray-100',
      h2: 'text-2xl font-semibold text-gray-900 dark:text-gray-100',
      h3: 'text-xl font-semibold text-gray-800 dark:text-gray-200',
      h4: 'text-lg font-medium text-gray-800 dark:text-gray-200',
    },
    body: {
      base: 'text-base text-gray-700 dark:text-gray-300',
      small: 'text-sm text-gray-600 dark:text-gray-400',
      large: 'text-lg text-gray-700 dark:text-gray-300',
    },
    caption: 'text-xs text-gray-500 dark:text-gray-500',
  },
  
  // グリッドスタイル
  grid: {
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    },
  },
  
  // ステータススタイル
  status: {
    success: 'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/20',
    warning: 'text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-900/20',
    error: 'text-error-600 bg-error-50 dark:text-error-400 dark:bg-error-900/20',
    info: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20',
  },
  
  // バッジスタイル
  badge: {
    base: 'inline-flex items-center font-medium rounded-full',
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    },
  },
};

// ユーティリティ関数
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// コンポーネントスタイルビルダー
export const buildCardStyles = (options: {
  size?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg';
} = {}): string => {
  const { size = 'md', shadow = 'md', rounded = 'md' } = options;
  return cn(
    componentStyles.card.base,
    componentStyles.card.padding[size],
    componentStyles.card.shadow[shadow],
    componentStyles.card.rounded[rounded]
  );
};

export const buildButtonStyles = (options: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
} = {}): string => {
  const { size = 'md', variant = 'primary' } = options;
  return cn(
    componentStyles.button.base,
    componentStyles.button.size[size],
    componentStyles.button.variant[variant]
  );
};

export const buildInputStyles = (options: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
} = {}): string => {
  const { size = 'md', variant = 'default' } = options;
  return cn(
    componentStyles.input.base,
    componentStyles.input.size[size],
    componentStyles.input.variant[variant]
  );
};