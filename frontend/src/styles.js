// src/styles.js
// ClinGraph Design System v2.0 - Medical Professional Theme

export const colors = {
  bgDeep: '#0a1628',
  bgSurface: '#111d32',
  bgElevated: '#162236',
  bgHover: '#1a2940',
  border: 'rgba(255, 255, 255, 0.06)',
  borderActive: 'rgba(13, 148, 136, 0.4)',
  textPrimary: '#f0f4f8',
  textSecondary: '#94a3b8',
  textMuted: '#4b5e74',
  accent: '#0d9488',
  accentHover: '#0f766e',
  accentLight: 'rgba(13, 148, 136, 0.12)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  danger: '#dc2626',
  dangerLight: 'rgba(220, 38, 38, 0.1)',
  info: '#3b82f6',
  infoLight: 'rgba(59, 130, 246, 0.1)',
  nodePatologia: '#ef4444',
  nodeSintomo: '#06b6d4',
  nodeEta: '#a855f7',
  nodeStileVita: '#eab308',
};

export const styles = {
  // Page layouts
  page: {
    display: 'flex',
    minHeight: '100vh',
    minHeight: '100dvh',
    background: colors.bgDeep,
    color: colors.textPrimary,
    fontFamily: "var(--font-sans, 'Inter', sans-serif)",
    overflowX: 'hidden',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    flexWrap: 'wrap',
  },

  centerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: `radial-gradient(ellipse at 30% 20%, #0f1f3a, ${colors.bgDeep} 70%)`,
    color: colors.textPrimary,
    fontFamily: "var(--font-sans, 'Inter', sans-serif)",
    padding: 24,
    overflow: 'auto',
    width: '100%',
  },

  // Panels
  left: {
    width: 360,
    minWidth: 320,
    padding: 20,
    borderRight: `1px solid ${colors.border}`,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    background: colors.bgDeep,
    flexShrink: 0,
  },

  right: {
    flex: 1,
    background: colors.bgDeep,
    position: 'relative',
    minWidth: 0,
  },

  // Welcome box
  welcomeBox: {
    background: colors.bgSurface,
    padding: 48,
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
    maxWidth: 720,
    width: '100%',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
    animation: 'scaleIn 0.4s ease both',
  },

  // Buttons
  buttonPrimary: {
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    background: `linear-gradient(135deg, ${colors.accent}, #14b8a6)`,
    color: 'white',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
    letterSpacing: '0.01em',
  },

  buttonSecondary: {
    padding: '12px 24px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textSecondary,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    letterSpacing: '0.01em',
  },

  buttonDanger: {
    padding: '12px 24px',
    borderRadius: 10,
    border: `1px solid ${colors.danger}`,
    background: 'transparent',
    color: colors.danger,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    letterSpacing: '0.01em',
  },

  backButton: {
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    padding: '4px 0',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 12,
    transition: 'color 150ms ease',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  // Inputs
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.bgDeep,
    color: colors.textPrimary,
    marginBottom: 12,
    fontSize: 13,
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
    outline: 'none',
  },

  inputFocus: {
    borderColor: colors.borderActive,
    boxShadow: `0 0 0 3px ${colors.accentLight}`,
  },

  // Cards
  card: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
    transition: 'all 200ms ease',
  },

  cardHover: {
    background: colors.bgElevated,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },

  // Section headers
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  // Search
  searchBox: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  searchResultsContainer: {
    maxHeight: 300,
    overflow: 'auto',
  },

  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    marginBottom: 2,
  },

  // Badges
  badge: {
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.02em',
  },

  // Results
  results: {
    marginTop: 20,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.textPrimary,
    margin: '4px 0',
  },

  dot: {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
};

// Badge style generator
export const badgeStyle = (color) => ({
  background: `${color}12`,
  border: `1px solid ${color}30`,
  color: color,
  padding: '5px 12px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
});

// Card style with hover effect
export const cardStyle = (isHovered = false) => ({
  ...styles.card,
  ...(isHovered ? styles.cardHover : {}),
});

// Progress bar for diagnosis score
export const progressBarStyle = (score, maxScore) => ({
  height: 4,
  borderRadius: 2,
  background: 'rgba(255, 255, 255, 0.06)',
  overflow: 'hidden',
  marginTop: 8,
});

export const progressFillStyle = (score, maxScore) => ({
  height: '100%',
  borderRadius: 2,
  background: `linear-gradient(90deg, ${colors.accent}, #14b8a6)`,
  width: `${Math.min((score / maxScore) * 100, 100)}%`,
  transition: 'width 600ms ease',
});
