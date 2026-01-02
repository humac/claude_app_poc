# Motion Components - 2026 UI Framework

This file documents the new motion components added as part of Phase 1 UI Framework Modernization.

## Overview

The motion components provide a set of reusable animation primitives built on Framer Motion, following 2026 UI trends with smooth, physics-based animations.

## Components

### MotionDiv

A versatile animated wrapper component with preset animations.

```jsx
import { MotionDiv } from '@/components/ui/motion';

<MotionDiv animation="fadeIn" transition="spring">
  <p>Content with fade-in animation</p>
</MotionDiv>
```

**Props:**
- `animation`: Animation preset - "fadeIn", "slideUp", "slideDown", "scaleIn", "blurIn" (default: "fadeIn")
- `transition`: Transition preset - "spring", "springBouncy", "smooth", "expo" (default: "spring")
- `className`: Optional CSS classes
- All standard div props

### AnimatedCard

An enhanced card component with entrance animations and hover effects.

```jsx
import { AnimatedCard } from '@/components/ui/card';

<AnimatedCard hoverScale={1.03}>
  <div className="p-6">
    <h3>Card Title</h3>
    <p>Card content with smooth animations</p>
  </div>
</AnimatedCard>
```

**Props:**
- `hoverScale`: Scale factor on hover (default: 1.02)
- `className`: Optional CSS classes
- All standard div props

**Features:**
- Entrance animation with slide-up effect
- Smooth hover scale effect
- Enhanced shadows on hover
- Tap scale feedback (0.98)

### StaggerContainer & StaggerItem

Components for creating staggered list animations.

```jsx
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';

<StaggerContainer staggerDelay={0.1}>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <p>{item.name}</p>
    </StaggerItem>
  ))}
</StaggerContainer>
```

**StaggerContainer Props:**
- `staggerDelay`: Delay between each item animation in seconds (default: 0.1)
- `className`: Optional CSS classes

**StaggerItem Props:**
- `className`: Optional CSS classes

### PageTransition

A wrapper for page-level transitions.

```jsx
import { PageTransition } from '@/components/ui/motion';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  
  return (
    <PageTransition key={location.pathname}>
      <YourPageContent />
    </PageTransition>
  );
}
```

**Important:** Always provide a unique `key` prop when using with React Router to ensure proper exit animations.

### MotionButton

An animated button variant (use alongside regular Button).

```jsx
import { MotionButton } from '@/components/ui/button';

<MotionButton variant="default" size="lg">
  Click Me
</MotionButton>
```

**Note:** The `asChild` prop is not supported with MotionButton. When `asChild` is used, the component falls back to the regular Button without animations. For animated links, use `motion.a` directly or wrap a Link component with `MotionDiv`.

**Props:**
- All standard Button props except `asChild`
- Automatically adds hover (scale 1.02) and tap (scale 0.98) animations

## Animation Presets

### Available Animations

```jsx
animations.fadeIn      // Opacity: 0 → 1
animations.slideUp     // Slide up from below with fade
animations.slideDown   // Slide down from above with fade
animations.scaleIn     // Scale up from 0.95 with fade
animations.blurIn      // Blur in effect with fade
```

### Available Transitions

```jsx
transitions.spring         // Smooth spring (default)
transitions.springBouncy   // Bouncy spring
transitions.smooth         // Linear tween
transitions.expo           // Exponential easing
```

## CSS Variables

New CSS variables added for animations:

### Fonts
```css
--font-sans: 'Geist', system-ui, sans-serif
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace
```

### Fluid Typography
```css
--text-fluid-sm    /* clamp(0.875rem → 1rem) */
--text-fluid-base  /* clamp(1rem → 1.125rem) */
--text-fluid-lg    /* clamp(1.125rem → 1.25rem) */
--text-fluid-xl    /* clamp(1.25rem → 1.5rem) */
--text-fluid-2xl   /* clamp(1.5rem → 2rem) */
--text-fluid-3xl   /* clamp(1.875rem → 2.5rem) */
```

### Easing Curves
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
```

### Shadows (OKLCH-based)
```css
--shadow-soft      /* Subtle multi-layer shadow */
--shadow-elevated  /* Medium elevation shadow */
--shadow-floating  /* High elevation floating shadow */
```

## Tailwind Utilities

New Tailwind utilities available:

### Fonts
```jsx
<div className="font-sans">Geist Sans text</div>
<code className="font-mono">Geist Mono code</code>
```

### Shadows
```jsx
<div className="shadow-soft">Soft shadow</div>
<div className="shadow-elevated">Elevated shadow</div>
<div className="shadow-floating">Floating shadow</div>
```

### Transitions
```jsx
<div className="transition ease-out-expo">Expo easing</div>
<div className="transition ease-spring">Spring easing</div>
<div className="transition ease-smooth">Smooth easing</div>
```

## Accessibility

All animations respect the user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are automatically reduced to near-instant */
}
```

This ensures that users who prefer reduced motion have a comfortable experience.

## Backward Compatibility

- All existing Button and Card components remain unchanged
- New components are additive (AnimatedCard, MotionButton)
- Existing code continues to work without modifications
- Opt-in enhancement approach

## Examples

### Animated Dashboard Cards

```jsx
import { AnimatedCard } from '@/components/ui/card';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';

function Dashboard() {
  return (
    <StaggerContainer className="grid grid-cols-3 gap-4">
      {stats.map(stat => (
        <StaggerItem key={stat.id}>
          <AnimatedCard className="p-6">
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <p className="text-muted-foreground">{stat.label}</p>
          </AnimatedCard>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
```

### Page Transitions

```jsx
import { PageTransition } from '@/components/ui/motion';
import { Routes, Route, useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  
  return (
    <Routes location={location}>
      <Route path="/" element={
        <PageTransition key="home">
          <HomePage />
        </PageTransition>
      } />
      <Route path="/about" element={
        <PageTransition key="about">
          <AboutPage />
        </PageTransition>
      } />
    </Routes>
  );
}
```

### Animated Form Buttons

```jsx
import { MotionButton } from '@/components/ui/button';

function LoginForm() {
  return (
    <form>
      {/* ...form fields... */}
      <MotionButton type="submit" variant="default" size="lg">
        Sign In
      </MotionButton>
    </form>
  );
}
```

## Performance Notes

- Animations use GPU-accelerated properties (transform, opacity)
- Motion components are tree-shakeable
- Bundle size increase: ~60KB (gzipped framer-motion)
- All animations run at 60fps on modern devices

## Migration Guide

No migration needed! The new components are completely additive.

To gradually adopt:
1. Replace `<Card>` with `<AnimatedCard>` where you want animations
2. Replace `<Button>` with `<MotionButton>` for enhanced interactions
3. Wrap page content with `<PageTransition>` for route transitions
4. Use `<StaggerContainer>` and `<StaggerItem>` for list animations

## Testing

All motion components include comprehensive tests:
- Unit tests for animation presets
- Component rendering tests
- Props validation
- Accessibility compliance

Run tests:
```bash
npm test motion.test.jsx
```
