# Design System Guidelines

This document outlines the consistent design patterns used throughout the Zeta Analytics application. Follow these guidelines to maintain visual consistency when adding new components.

## Quick Start

Import the design system utilities:

```typescript
import { designTokens, componentClasses } from '@/lib/design-tokens';
import { PrimaryButton, WorkflowCard, IconBox } from '@/components/ui/base-components';
```

## Color System

### Primary Brand Colors
- **Purple-Blue Gradient**: `from-purple-500 to-blue-400` - Used for primary actions, branding
- **Light Gray**: `from-gray-50 to-gray-100` - Used for cards, backgrounds
- **Off-white**: `bg-white/70 backdrop-blur-sm` - Used for overlays

### Status Colors
- **Blue**: `from-blue-500 via-blue-600 to-blue-700` - Source elements
- **Purple**: `from-purple-500 via-purple-600 to-purple-700` - Operation elements  
- **Green**: `from-green-500 via-green-600 to-green-700` - Destination elements

## Typography Scale

```typescript
// Page titles
designTokens.text.pageTitle // "text-4xl sm:text-5xl font-bold text-gray-900"

// Section titles  
designTokens.text.sectionTitle // "text-2xl font-bold"

// Card titles
designTokens.text.cardTitle // "text-lg font-bold text-gray-800"

// Body text
designTokens.text.body // "text-base text-gray-700"
```

## Button Patterns

### Primary Button (Main Actions)
```tsx
<PrimaryButton onClick={handleClick}>
  Get Started
</PrimaryButton>
```

**Style**: Purple-blue gradient, white text, shadow with hover effects
**Use for**: Main actions, form submissions, primary CTAs

### Secondary Button (Navigation)  
```tsx
<SecondaryButton onClick={goBack}>
  <ArrowLeft /> Back to Home
</SecondaryButton>
```

**Style**: Light gray gradient, dark text, subtle border
**Use for**: Back buttons, secondary actions, cancel buttons

## Card Patterns

### Workflow Card
```tsx
<WorkflowCard>
  <div className="flex items-center gap-4 mb-6">
    <IconBox variant="blue" icon={<LayersIcon />} />
    <h3>Source</h3>
  </div>
  {/* Card content */}
</WorkflowCard>
```

**Style**: Light gray gradient background, subtle border, consistent padding
**Use for**: Main content containers, workflow nodes, form sections

## Icon System

### Icon Boxes
```tsx
<IconBox variant="blue" icon={<DatabaseIcon />} />    // Source
<IconBox variant="purple" icon={<NetworkIcon />} />   // Operation  
<IconBox variant="green" icon={<CloudIcon />} />      // Destination
```

**Style**: Dark gradient backgrounds with white icons
**Sizes**: 48x48px (w-12 h-12)

## Shadow System

```typescript
designTokens.shadows.sm        // "shadow-sm" - Subtle elements
designTokens.shadows.lg        // "shadow-lg" - Cards, buttons
designTokens.shadows.xl        // "shadow-xl" - Hover states
designTokens.shadows.interactive // "shadow-lg hover:shadow-xl" - Interactive elements
```

## Border Radius

```typescript
designTokens.radius.lg         // "rounded-lg" - Buttons, inputs
designTokens.radius.xl         // "rounded-xl" - Cards, major elements  
designTokens.radius.full       // "rounded-full" - Pills, dots
```

## Animation Patterns

### Transitions
```typescript
designTokens.transitions.default  // "transition-all duration-200"
designTokens.transitions.smooth   // "transition-all duration-300"
```

### Hover Effects
- **Buttons**: Slight upward movement + shadow increase
- **Cards**: Shadow increase only
- **Icons**: Scale up slightly (scale-105)

### Loading States
- **Pulsing dots**: Used for status indicators
- **Flowing gradients**: Used for connection lines
- **Spinning borders**: Used for loading buttons

## Layout Patterns

### Page Structure
```tsx
<div className="min-h-screen bg-white dotted-grid">
  <PageHeader 
    title="Page Name"
    backButton={{ onClick: goBack }}
  />
  <main className="flex-1 flex items-center justify-center px-4">
    <div className={designTokens.spacing.container}>
      {/* Page content */}
    </div>
  </main>
  <PageFooter />
</div>
```

### Spacing System
- **Cards**: 32px padding (p-8)
- **Buttons**: 32px horizontal, 16px vertical padding
- **Sections**: 64px bottom margin (mb-16)
- **Elements**: 16px gap between related items

## Component Examples

### Feature List
```tsx
<FeatureList items={[
  "Feature description one",
  "Feature description two", 
  "Feature description three"
]} />
```

### Connection Lines
```tsx
<ConnectionLine active={sourceSelected && operationSelected} />
```

### Status Indicators
```tsx
<StatusIndicator 
  active={isSelected} 
  variant="blue" 
/>
```

## Best Practices

### DO ✅
- Use design tokens instead of hardcoded values
- Use base components for consistency
- Follow the established color patterns
- Maintain consistent spacing
- Use appropriate shadow levels
- Include hover/focus states

### DON'T ❌
- Create custom gradients outside the system
- Mix different shadow styles
- Use inconsistent border radius
- Skip hover states on interactive elements
- Use hardcoded spacing values
- Break the established typography scale

## Integration with New Components

When adding new components or integrating external libraries:

1. **Extract styles** using design tokens
2. **Override defaults** to match the system
3. **Test consistency** across different screen sizes
4. **Document variants** if creating new patterns

### Example: Adapting External Component
```tsx
// Before (external library default)
<ExternalButton className="bg-blue-500 text-white p-4 rounded">

// After (adapted to design system)  
<ExternalButton className={cn(
  componentClasses.primaryButton,
  "custom-overrides-if-needed"
)}>
```

## File Structure

```
src/
├── lib/
│   └── design-tokens.ts      # Core design tokens
├── components/
│   └── ui/
│       └── base-components.tsx # Reusable components
└── DESIGN-SYSTEM.md          # This documentation
```

## Maintenance

- **Review new components** against this system
- **Update tokens** when making global changes  
- **Document new patterns** when they emerge
- **Test across pages** when making system changes

This design system ensures consistency, maintainability, and a professional appearance across the entire application.