import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

// Create a custom Popover with protection against immediate closing
const Popover = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> & {
    preventImmediateClose?: boolean;
  }
>(({ preventImmediateClose = true, ...props }, ref) => {
  // Track if the popover was just opened to prevent immediate closing
  const [justOpened, setJustOpened] = React.useState(false);
  
  // Handle open state changes
  const handleOpenChange = (open: boolean) => {
    if (open && preventImmediateClose) {
      setJustOpened(true);
      // Reset the flag after a short delay
      setTimeout(() => {
        setJustOpened(false);
      }, 100);
    }
    
    // Call the original onOpenChange handler if provided
    if (props.onOpenChange) {
      props.onOpenChange(open);
    }
  };
  
  return (
    <PopoverPrimitive.Root
      {...props}
      onOpenChange={(open) => {
        // If we're trying to close the popover and it just opened, prevent it
        if (!open && justOpened && preventImmediateClose) {
          return;
        }
        handleOpenChange(open);
      }}
    />
  );
});
Popover.displayName = 'Popover';

// Custom trigger with event stopPropagation
const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Trigger
    ref={ref}
    className={cn(className)}
    onClick={(e) => {
      // Stop the event from bubbling to prevent immediate closing
      e.stopPropagation();
      
      // Call the original onClick handler if provided
      if (props.onClick) {
        props.onClick(e);
      }
    }}
    {...props}
  />
));
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
