# Ask-JDS

## localStorage Settings

The application uses the following localStorage settings for various purposes:

### Flashcards Module

| Setting | Description | Values | Default |
|---------|-------------|--------|---------|
| `enableFlashcardDebug` | Enables detailed console logging for flashcards component | `'true'` or `'false'` | `'false'` |
| `forceSubscription` | Forces the application to treat the user as having a subscription (dev mode only) | `'true'` or `'false'` | `'false'` |
| `flashcards-show-mastered` | Persists user preference for showing/hiding mastered flashcards | `true` or `false` | `true` |
| `flashcards-filter-subject` | Persists user's selected subject filter for flashcards | Subject ID or `'all'` | `'all'` |
| `flashcards-filter-collection` | Persists user's selected collection filter for flashcards | Collection ID or `'all'` | `'all'` |
| `flashcards-show-filters` | Persists user preference for showing/hiding the filters panel | `true` or `false` | `false` |

### Debug Settings Usage

#### Enable detailed debugging for flashcards
```javascript
// Enable detailed console logs
localStorage.setItem('enableFlashcardDebug', 'true');

// Disable detailed console logs
localStorage.setItem('enableFlashcardDebug', 'false');
```

#### Force subscription status (development only)
```javascript
// Force subscription to be active
localStorage.setItem('forceSubscription', 'true');

// Use actual subscription status
localStorage.setItem('forceSubscription', 'false');
``` 