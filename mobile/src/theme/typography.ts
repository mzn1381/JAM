export const typography = {
  fontFamily: 'Vazirmatn-Black',
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '500' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 28,
  },

  h5: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  x_small: {
    fontSize: 12,
    fontWeight: '300' as const,
    lineHeight: 20,
  },
  xx_small: {
    fontSize: 10,
    fontWeight: '200' as const,
    lineHeight: 20,
  },
};

export type Typography = typeof typography;
