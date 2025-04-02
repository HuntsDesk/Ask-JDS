# Ask JDS Style Guide

## Typography System

### Base Configuration
- Uses the "New York" style system from shadcn/ui
- Implemented through Tailwind CSS
- Prioritizes system fonts for performance
- Font feature settings enabled: "rlig" and "calt"

### Font Scale
Consistent typographic scale using these Tailwind classes:
- xs: 0.75rem (12px) - For badges, small labels
- sm: 0.875rem (14px) - For form labels, descriptions
- base: 1rem (16px) - For body text
- lg: 1.125rem (18px) - For dialog titles
- xl: 1.25rem (20px) - For feature headings
- 2xl: 1.5rem (24px) - For section titles
- 3xl: 1.875rem (30px) - For main headings (mobile)
- 4xl: 2.25rem (36px) - For main headings (desktop)

### Font Weights
- normal: 400 - Default body text
- medium: 500 - Form labels, interactive elements
- semibold: 600 - Subheadings
- bold: 700 - Main headings

### Line Heights
- leading-none: For tight headings
- leading-relaxed: For body text
- leading-normal: Default

### Component-Specific Typography
- Headings: Use bold weight with tracking-tight
- Form Labels: Use medium weight at sm size
- Body Text: Use normal weight at base size
- Descriptions: Use sm size with muted color
- Dialog Titles: Use lg size with semibold weight
- Error Messages: Use sm size with medium weight

### Responsive Typography
Implements responsive text sizes using Tailwind breakpoints:
- Mobile-first design
- Scale up text at sm: (640px) and md: (768px) breakpoints
Example: "text-3xl sm:text-4xl" for responsive headings

## Color System

### Brand Colors
```css
:root {
  /* Primary Brand Colors */
  --jds-blue: #00178E;                /* JDS Blue - Primary brand color */
  --jds-orange: #F37022;              /* JDS Orange - Secondary brand color */
  --jds-yellow: #F5B111;              /* JDS Yellow - Accent color */
  
  /* UI Brand Colors */
  --primary: 262.1 83.3% 57.8%;       /* Purple - Primary UI color */
  --primary-foreground: 210 20% 98%;  /* Light text on primary */
  --secondary: 220 14.3% 95.9%;       /* Light gray - Secondary UI color */
  --accent: 220 14.3% 95.9%;          /* Accent color for UI elements */
}
```

### Extended Brand Colors
```css
/* Additional Brand Colors */
--purple-brand: #9333EA;              /* Purple accent */
--sky-brand: #38BDF8;                 /* Sky blue accent */

/* Status Colors */
--success: #22C55E;                   /* Green for success states */
--warning: #F5B111;                   /* Yellow for warning states */
--error: #EF4444;                     /* Red for error states */
```

### Chart Colors
```css
:root {
  --chart-1: var(--primary);          /* Primary chart color */
  --chart-2: var(--jds-orange);       /* Secondary chart color */
  --chart-3: var(--jds-blue);         /* Tertiary chart color */
  --chart-4: var(--purple-brand);     /* Fourth chart color */
  --chart-5: var(--sky-brand);        /* Fifth chart color */
}
```

### UI Element Colors
```css
/* Progress Indicators */
--progress-correct: #22C55E;          /* Green for correct answers */
--progress-incorrect: #EF4444;        /* Red for incorrect answers */
--progress-mastered: var(--jds-orange); /* Orange for mastered items */
--progress-background: #E2E8F0;       /* Light gray background */

/* Gradients */
--gradient-brand: linear-gradient(to bottom right, rgba(0, 23, 142, 0.1), rgba(243, 112, 34, 0.1));
--gradient-auth: linear-gradient(-45deg, #f3702233, #00178e33, #f3702233, #00178e33);
```

### Semantic Colors
```css
:root {
  --background: 0 0% 100%;            /* White background */
  --foreground: 224 71.4% 4.1%;       /* Dark text */
  --card: 0 0% 100%;                  /* Card background */
  --card-foreground: 224 71.4% 4.1%;  /* Card text */
  --popover: 0 0% 100%;               /* Popover background */
  --muted: 220 14.3% 95.9%;           /* Muted elements */
  --muted-foreground: 220 8.9% 46.1%; /* Muted text */
  --destructive: 0 84.2% 60.2%;       /* Error/destructive actions */
  --border: 220 13% 91%;              /* Border color */
  --input: 220 13% 91%;               /* Input borders */
  --ring: 262.1 83.3% 57.8%;          /* Focus rings */
}
```

### Dark Mode Colors
```css
.dark {
  --background: 224 71.4% 4.1%;
  --foreground: 210 20% 98%;
  --card: 224 71.4% 4.1%;
  --card-foreground: 210 20% 98%;
  --popover: 224 71.4% 4.1%;
  --popover-foreground: 210 20% 98%;
  --primary: 263.4 70% 50.4%;
  --primary-foreground: 210 20% 98%;
  --secondary: 215 27.9% 16.9%;
  --secondary-foreground: 210 20% 98%;
  --muted: 215 27.9% 16.9%;
  --muted-foreground: 217.9 10.6% 64.9%;
  --accent: 215 27.9% 16.9%;
  --accent-foreground: 210 20% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 20% 98%;
  --border: 215 27.9% 16.9%;
  --input: 215 27.9% 16.9%;
  --ring: 263.4 70% 50.4%;
}
```

### Color Usage Guidelines

#### Brand Colors
- `--jds-blue`: Primary brand color, used for main UI elements and brand identity
- `--jds-orange`: Secondary brand color, used for CTAs and important UI elements
- `--jds-yellow`: Accent color, used for highlights and secondary CTAs

#### UI States
- Success states: Use `--success` (#22C55E)
- Warning states: Use `--warning` (#F5B111)
- Error states: Use `--error` (#EF4444)
- Disabled states: Use opacity variations of base colors

#### Charts and Data Visualization
Use the chart color palette in sequence:
1. Primary (Purple)
2. JDS Orange
3. JDS Blue
4. Purple Brand
5. Sky Brand

#### Gradients
- Brand gradient: Used for section backgrounds and cards
- Auth gradient: Used for authentication pages and loading states
- Hover states: Use opacity variations (e.g., hover:bg-primary/90)

## Animations

### Float Animations
Used for creating subtle movement in UI elements:

```css
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes float-delayed {
  0% { transform: translateY(-5px); }
  50% { transform: translateY(5px); }
  100% { transform: translateY(-5px); }
}

@keyframes float-slow {
  0% { transform: translateY(-3px); }
  50% { transform: translateY(3px); }
  100% { transform: translateY(-3px); }
}
```

Usage classes:
- animate-float: 3s animation
- animate-float-delayed: 4s animation
- animate-float-slow: 5s animation

### Transition Animations
```css
/* Card hover transitions */
.auth-card-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* Sidebar transition */
.sidebar-transition {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Accessibility
For users who prefer reduced motion:
```css
@media (prefers-reduced-motion: reduce) {
  .animated-gradient,
  .animate-float,
  .animate-float-delayed,
  .animate-float-slow,
  .animate-float-medium,
  .pulse-on-hover:hover {
    animation: none;
  }
}
```

## Component Variants

### Button Variants
```typescript
variants: {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}
```

### Badge Variants
```typescript
variants: {
  default: 'bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground',
}
```

## Layout & Spacing

### Container Sizes
- Default max-width: 1400px (2xl)
- Standard padding: 2rem
- Responsive padding: 0.75rem on mobile

### Section Layout Guidelines

#### Base Section Structure
```jsx
<section className="py-20 relative overflow-hidden box-border">
  {/* Optional gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
  
  {/* Content container */}
  <div className="max-w-6xl mx-auto px-4 relative box-border">
    {/* Section content goes here */}
  </div>
</section>
```

#### Key Specifications

##### Section Container
- Use `py-20` for consistent vertical spacing (5rem top and bottom)
- Add `relative overflow-hidden box-border` to prevent layout issues
- Set `width: 100%` for full-width backgrounds when needed

##### Content Wrapper
- Use `max-w-6xl` (72rem/1152px) as the standard content width
- Center with `mx-auto`
- Add consistent horizontal padding with `px-4`
- Use `relative` for proper z-indexing
- Include `box-border` to maintain consistent box-sizing

##### Responsive Behavior
```css
/* Mobile adjustments */
@media (max-width: 768px) {
  section {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    padding-left: 1rem;
    padding-right: 1rem;
    box-sizing: border-box;
  }
}
```

#### Implementation Examples

##### Standard Section
```jsx
<section className="py-20 relative overflow-hidden box-border">
  <div className="max-w-6xl mx-auto px-4 relative box-border">
    <h2 className="text-4xl font-bold text-center mb-16">Section Title</h2>
    {/* Content */}
  </div>
</section>
```

##### Section with Background
```jsx
<section className="py-20 relative overflow-hidden box-border">
  <div className="absolute inset-0 bg-gradient-to-br from-[#00178E]/5 to-[#00178E]/5"></div>
  <div className="max-w-6xl mx-auto px-4 relative box-border">
    <h2 className="text-4xl font-bold text-center mb-16">Section Title</h2>
    {/* Content */}
  </div>
</section>
```

##### Grid Layout Section
```jsx
<section className="py-20 relative overflow-hidden box-border">
  <div className="max-w-6xl mx-auto px-4 relative box-border">
    <h2 className="text-4xl font-bold text-center mb-16">Section Title</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Grid items */}
    </div>
  </div>
</section>
```

#### Layout Best Practices

1. **Consistency**
   - Always use `max-w-6xl` for main content width
   - Maintain consistent vertical padding with `py-20`
   - Keep horizontal padding with `px-4`

2. **Background Elements**
   - Place background elements (gradients, colors) in an absolute-positioned div
   - Use `relative` on the content container to ensure proper layering

3. **Spacing**
   - Use `mb-16` for section title bottom margin
   - Use `gap-8` for grid layouts
   - Maintain consistent spacing between sections

4. **Responsive Design**
   - Use mobile-first approach
   - Ensure content is properly padded on mobile
   - Prevent horizontal overflow with `overflow-hidden`

5. **Box Model**
   - Always include `box-border` to prevent layout issues
   - Use relative positioning for proper stacking context

### Border Radius
```css
:root {
  --radius: 0.75rem;
}

borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
}
```

### Sidebar Dimensions
```css
:root {
  --sidebar-width: 280px;
  --sidebar-collapsed-width: 70px;
}
```

## Best Practices

### Responsive Design
- Use mobile-first approach
- Implement proper breakpoints (sm, md, lg, xl, 2xl)
- Test on various devices and screen sizes
- Ensure touch targets are at least 44x44px

### Accessibility
- Maintain WCAG 2.1 AA compliance
- Ensure proper color contrast (minimum 4.5:1)
- Provide focus indicators
- Support keyboard navigation
- Include proper ARIA labels
- Support screen readers
- Respect user motion preferences

### Performance
- Use system fonts
- Implement proper code splitting
- Optimize images
- Minimize CSS bundle size
- Use efficient animations
- Implement proper caching strategies

### Implementation Notes
- Use Tailwind's @layer for proper CSS organization
- Implement dark mode using the 'class' strategy
- Use the cn() utility for combining classes
- Follow BEM-like naming for custom classes
- Keep components modular and reusable 