/**
 * Design System Tokens - Extracted from existing component patterns
 * Use these tokens to ensure consistency across all components
 */

export const designTokens = {
  // Primary Color Gradients
  gradients: {
    primary: "bg-gradient-to-r from-purple-500 to-blue-400",
    primaryHover: "hover:from-purple-600 hover:to-blue-500",
    
    // Card/Background gradients
    cardLight: "bg-gradient-to-br from-gray-50 to-gray-100",
    cardLightHover: "hover:from-gray-100 hover:to-gray-200",
    
    // Icon box gradients (dark variants)
    iconBlue: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
    iconPurple: "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700",
    iconGreen: "bg-gradient-to-br from-green-500 via-green-600 to-green-700",
    
    // Hover states for select items
    selectHover: "hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-purple-100/70 hover:to-blue-50/90",
    
    // Background overlays
    backgroundOverlay1: "bg-gradient-to-br from-blue-600/5 via-purple-600/8 to-blue-800/6",
    backgroundOverlay2: "bg-gradient-to-tr from-purple-500/4 via-blue-400/3 to-purple-700/5",
    
    // Text gradients
    textPrimary: "bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-clip-text text-transparent",
    textTitle: "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent",
  },

  // Shadow System
  shadows: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
    
    // Hover shadow progressions
    interactive: "shadow-lg hover:shadow-xl",
    card: "shadow-lg hover:shadow-xl",
    button: "shadow-lg hover:shadow-xl active:shadow-md",
    select: "shadow-lg hover:shadow-xl",
  },

  // Border Radius
  radius: {
    sm: "rounded-sm",
    md: "rounded-md", 
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
    
    // Component specific
    card: "rounded-xl",
    button: "rounded-lg",
    input: "rounded-lg",
    icon: "rounded-xl",
  },

  // Border Styles
  borders: {
    light: "border border-gray-200",
    medium: "border-2 border-gray-200",
    focus: "focus:border-purple-400 focus:ring-4 focus:ring-purple-100/50",
    
    // Colored borders for icons
    blue: "border border-blue-500/50",
    purple: "border border-purple-500/50", 
    green: "border border-green-500/50",
  },

  // Typography
  text: {
    // Headers
    pageTitle: "text-4xl sm:text-5xl font-bold text-gray-900",
    sectionTitle: "text-2xl font-bold",
    cardTitle: "text-lg font-bold text-gray-800",
    
    // Body text
    body: "text-base text-gray-700",
    small: "text-sm text-gray-600",
    tiny: "text-xs text-gray-500",
    
    // Interactive text
    buttonLarge: "text-lg font-semibold",
    buttonMedium: "text-base font-semibold", 
    buttonSmall: "text-sm font-medium",
  },

  // Spacing & Layout
  spacing: {
    // Padding
    cardPadding: "p-8",
    buttonPadding: "px-8 py-4",
    selectPadding: "px-4 py-3",
    
    // Margins
    sectionGap: "mb-16",
    cardGap: "mb-6",
    elementGap: "gap-4",
    
    // Layout
    container: "max-w-7xl mx-auto w-full",
    cardWidth: "w-80",
  },

  // Transitions & Animations
  transitions: {
    default: "transition-all duration-200",
    smooth: "transition-all duration-300",
    slow: "transition-all duration-500",
    
    // Transform effects
    hover: "transform hover:-translate-y-0.5 active:translate-y-0",
    scale: "hover:scale-105",
    scaleButton: "hover:scale-[1.02]",
  },

  // Interactive States
  states: {
    // Button states
    button: "hover:shadow-xl active:shadow-md transform hover:-translate-y-0.5 active:translate-y-0",
    
    // Card states
    card: "hover:shadow-xl transition-all duration-300",
    
    // Disabled states
    disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  },

  // Background Colors
  backgrounds: {
    page: "bg-white",
    card: "bg-white/70 backdrop-blur-sm",
    overlay: "bg-white/95 backdrop-blur-md",
    
    // Dotted grid background
    dottedGrid: "dotted-grid",
  },
} as const;

// Utility function to combine classes
export const combineTokens = (...tokens: string[]) => tokens.join(" ");

// Pre-built component classes
export const componentClasses = {
  // Primary button (matching your main buttons)
  primaryButton: combineTokens(
    designTokens.gradients.primary,
    designTokens.gradients.primaryHover,
    designTokens.text.buttonLarge,
    "text-white font-medium",
    designTokens.radius.button,
    designTokens.shadows.button,
    designTokens.transitions.default,
    "flex items-center gap-3"
  ),

  // Secondary button (back buttons)
  secondaryButton: combineTokens(
    designTokens.gradients.cardLight,
    designTokens.gradients.cardLightHover,
    "text-gray-700 hover:text-gray-900",
    designTokens.borders.light,
    designTokens.shadows.interactive,
    designTokens.transitions.default,
    designTokens.radius.xl,
    "px-4 py-2 font-medium"
  ),

  // Workflow card
  workflowCard: combineTokens(
    designTokens.gradients.cardLight,
    designTokens.borders.light,
    designTokens.shadows.card,
    designTokens.transitions.smooth
  ),

  // Icon box (for source/operation/destination)
  iconBox: {
    blue: combineTokens(
      designTokens.gradients.iconBlue,
      designTokens.borders.blue,
      designTokens.shadows.md,
      designTokens.radius.icon,
      "w-12 h-12 flex items-center justify-center"
    ),
    purple: combineTokens(
      designTokens.gradients.iconPurple,
      designTokens.borders.purple,
      designTokens.shadows.md,
      designTokens.radius.icon,
      "w-12 h-12 flex items-center justify-center"
    ),
    green: combineTokens(
      designTokens.gradients.iconGreen,
      designTokens.borders.green,
      designTokens.shadows.md,
      designTokens.radius.icon,
      "w-12 h-12 flex items-center justify-center"
    ),
  },

  // Select component
  selectTrigger: combineTokens(
    "w-full bg-white border-gray-200 text-gray-800 h-12",
    designTokens.radius.lg,
    "hover:border-gray-300"
  ),

  // Feature list item
  featureListItem: combineTokens(
    "flex items-center gap-2",
    "text-sm text-gray-700"
  ),
} as const;