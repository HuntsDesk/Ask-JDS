# Multi-Select Dropdown Implementation Patterns

This document outlines the two different approaches to implementing multi-select dropdowns in the Ask-JDS application. Both solutions allow users to select multiple items from a dropdown, but they differ in their implementation approach.

## 1. Basic HTML + Custom Logic Approach

**Used in:** `/src/components/flashcards/pages/CreateFlashcard.tsx`

### Implementation Details

This approach uses standard HTML `<select>` elements with custom JavaScript logic to handle the multi-select functionality:

```jsx
<select
  id="collection"
  value=""
  onChange={handleCollectionChange}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
>
  <option value="">Select collections...</option>
  {collections.map(collection => (
    <option key={collection.id} value={collection.id}>
      {collection.title} {collection.subject ? `(${collection.subject.name})` : ''}
    </option>
  ))}
</select>
{selectedCollectionIds.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-2">
    {selectedCollectionIds.map(id => {
      const collection = collections.find(c => c.id === id);
      return (
        <div key={id} className="bg-gray-100 px-3 py-1 rounded-md flex items-center">
          <span className="text-sm">{collection?.title}</span>
          <button 
            type="button" 
            onClick={() => removeCollection(id)}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      );
    })}
  </div>
)}
```

### State Management

```jsx
const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

// Handler function to add a selected item
const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const value = e.target.value;
  if (value && !selectedCollectionIds.includes(value)) {
    setSelectedCollectionIds([...selectedCollectionIds, value]);
  }
};

// Handler function to remove a selected item
const removeCollection = (id: string) => {
  setSelectedCollectionIds(selectedCollectionIds.filter(collectionId => collectionId !== id));
};
```

### Pros and Cons

**Pros:**
- Simple implementation using native HTML elements
- Works in all browsers without special libraries
- Easy to understand and maintain

**Cons:**
- Less polished UX/UI compared to custom components
- No built-in search functionality
- Requires more manual state management

## 2. Custom Component Approach

**Used in:** `src/components/ui/multi-select.tsx`

This approach uses a purpose-built React component combining multiple UI primitives:

### Implementation Details

The component is built using:
- `Popover` from `@/components/ui/popover.tsx` for dropdown container
- `Command` components from `@/components/ui/command.tsx` for searchable menu
- `Badge` from `@/components/ui/badge.tsx` for selected items

Usage example (from previous CourseDetail.tsx implementation):

```jsx
<MultiSelect
  options={subjects.map(subject => ({ label: subject.name, value: subject.id }))}
  selected={selectedSubjectIds}
  onChange={(values) => setSelectedSubjectIds(values)}
  placeholder="Select subjects..."
  emptyText="No subjects found."
/>
```

### Component Structure

The component structure in `src/components/ui/multi-select.tsx`:

```jsx
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  emptyText = "No options found.",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => (
            <Badge key={value}>
              {options.find((option) => option.value === value)?.label}
              <button onClick={() => handleUnselect(value)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### Pros and Cons

**Pros:**
- Polished, modern UI with animations
- Built-in search functionality
- Reusable component across the application
- Better accessibility

**Cons:**
- More complex implementation
- Relies on multiple dependent components
- Can have issues with event bubbling causing unexpected behavior
- Takes more work to customize

## Choosing Between Approaches

1. **Use the Basic Approach When:**
   - You need a quick implementation
   - The UI doesn't need to be highly polished
   - You want maximum browser compatibility
   - You need complete control over the rendering

2. **Use the Component Approach When:**
   - You need a more polished, modern UI
   - You want built-in search functionality
   - You're using it in multiple places and want consistency
   - You have complex UI requirements

## Troubleshooting Common Issues

### Dropdown Flashes Open and Closes

This issue can occur with the component approach due to event bubbling. The fix:

1. Add `stopPropagation()` to click handlers
2. Implement a brief delay to prevent immediate closing after opening
3. Add state to track if the dropdown was just opened

Example fix in popover.tsx:
```jsx
// Add to trigger component
onClick={(e) => {
  e.stopPropagation();
  if (props.onClick) {
    props.onClick(e);
  }
}}
```

The files that needed to be fixed in our application:
- `/src/components/ui/dropdown-menu.tsx`
- `/src/components/ui/select.tsx`
- `/src/components/ui/popover.tsx` 