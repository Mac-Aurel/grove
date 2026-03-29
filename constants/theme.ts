export const Colors = {
  background: '#FAFAF7',
  text: '#1C1C1A',
  accent: '#7C9A6E',
  border: '#E8E8E4',
  muted: '#9A9A96',
  danger: '#C0392B',
  warning: '#D4900A',
  warningBg: '#FDF3DC',
  warningText: '#8A6200',
  heatmap1: '#C5D9BB',
  heatmap2: '#9ABF8A',
} as const;

export const Typography = {
  headingFont: 'Playfair Display',
  bodyFont: 'Inter',
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
