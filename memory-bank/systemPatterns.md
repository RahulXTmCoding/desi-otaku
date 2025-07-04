# System Patterns

## Architecture Overview
The custom t-shirt shop follows a modular React + TypeScript architecture with clear separation of concerns:

```
client/
├── src/
│   ├── admin/           # Admin dashboard modules
│   │   ├── components/  # Reusable admin components
│   │   │   └── orders/  # Order-specific components
│   │   └── pages/       # Admin page components
│   ├── components/      # Shared UI components
│   ├── pages/          # Route pages
│   ├── user/           # User dashboard modules
│   ├── core/           # Core utilities
│   └── types/          # TypeScript types
```

## Component Architecture Pattern

### Modular Component Design
**IMPORTANT PATTERN**: Always break large pages into small, reusable modules. This ensures:
- Better maintainability
- Easier testing
- Improved reusability
- Clear separation of concerns
- Better performance through code splitting

### Example Structure (Order Management)
```
admin/
├── OrderManagement.tsx              # Main container component
├── components/
│   └── orders/
│       ├── types.ts                # Shared TypeScript interfaces
│       ├── OrderStats.tsx          # Statistics display component
│       ├── OrderFilters.tsx        # Filter controls component
│       ├── OrderListItem.tsx       # Individual order row
│       ├── OrderStatusBadge.tsx    # Status badge component
│       ├── OrderDetailModal.tsx    # Detail view modal
│       ├── BulkActions.tsx         # Bulk operations component
│       └── Pagination.tsx          # Pagination controls
```

### Component Guidelines
1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define TypeScript interfaces for props
3. **State Management**: Keep state as close to where it's needed as possible
4. **Reusability**: Design components to be reusable across different contexts
5. **Size Limit**: If a component exceeds 200 lines, consider breaking it down

## Data Flow Patterns

### API Integration
```typescript
// Centralized API calls
const loadOrders = async () => {
  if (isTestMode) {
    return mockData;
  }
  const response = await fetch(`${API}/endpoint`);
  return response.json();
};
```

### Custom Order Data Flow Pattern
**Critical Pattern**: Ensure customization data flows properly from Cart → Checkout → Backend → Database

```typescript
// Frontend: Include all customization fields
interface CartItem {
  // ... other fields
  customization?: {
    frontDesign?: {
      designId: string;
      designImage: string;
      position: string;
      price: number;
    };
    backDesign?: {
      designId: string;
      designImage: string;
      position: string;
      price: number;
    };
  };
}

// Backend: Validate and clean customization data
const processProducts = products.map(product => {
  if (product.customization) {
    const { frontDesign, backDesign } = product.customization;
    const hasFrontDesign = frontDesign?.designId && frontDesign?.designImage;
    const hasBackDesign = backDesign?.designId && backDesign?.designImage;
    
    if (!hasFrontDesign && !hasBackDesign) {
      delete product.customization;
    }
  }
  return product;
});
```

### State Management
- **Local State**: For component-specific state (useState)
- **Context**: For cross-component communication (React Context)
- **Session Storage**: For temporary data persistence
- **Local Storage**: For user preferences

## UI/UX Patterns

### Dark Theme Implementation
```typescript
// Consistent color palette
const colors = {
  background: 'bg-gray-900',
  card: 'bg-gray-800',
  border: 'border-gray-700',
  text: 'text-white',
  muted: 'text-gray-400',
  accent: 'text-yellow-400'
};
```

### Loading States
```typescript
if (loading) {
  return <Loader className="w-12 h-12 animate-spin text-yellow-400" />;
}
```

### Empty States
```typescript
if (data.length === 0) {
  return (
    <div className="text-center py-8">
      <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p className="text-gray-400">No data found</p>
    </div>
  );
}
```

### Error Handling
```typescript
try {
  // API call
} catch (error) {
  toast.error('Operation failed');
  console.error('Error details:', error);
}
```

## Form Patterns

### Controlled Components
```typescript
const [value, setValue] = useState('');

<input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="standard-input-classes"
/>
```

### Validation
- Client-side validation for immediate feedback
- Server-side validation for security
- Display errors inline with fields
- Validate nested objects (e.g., customization data)

## Navigation Patterns

### Route Structure
- All routes defined in `pages/App.tsx`
- Protected routes check authentication
- Consistent breadcrumb navigation
- Clear URL patterns

### Modal Navigation
- Modals for detail views
- Preserve background state
- Clear close actions
- Keyboard navigation support

## Performance Patterns

### Code Splitting
```typescript
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Memoization
```typescript
// Prevent unnecessary re-renders
const MemoizedComponent = React.memo(Component);
const memoizedValue = useMemo(() => computeExpensive(data), [data]);
const memoizedCallback = useCallback(() => {}, [dependencies]);
```

### Image Optimization
- Use appropriate image formats
- Implement lazy loading
- Provide multiple sizes
- Use placeholders

## Testing Patterns

### Test Mode
- Toggle between real and mock data
- Consistent test data structure
- No external dependencies in test mode

### Component Testing
```typescript
// Test individual components in isolation
// Mock dependencies
// Test user interactions
// Verify rendered output
```

## Security Patterns

### Authentication
- JWT token storage
- Automatic token refresh
- Protected route guards
- Role-based access control

### Data Sanitization
- Sanitize user inputs
- Validate API responses
- Escape HTML content
- Prevent XSS attacks
- Clean nested object structures before DB storage

### Soft Delete Pattern
```typescript
// Never hard delete - preserve data for analytics
interface Product {
  // ... other fields
  isDeleted: boolean;  // Default: false
}

// Filter deleted items from public views
const getProducts = async (filters) => {
  return Product.find({ 
    ...filters, 
    isDeleted: { $ne: true } 
  });
};

// Admin can view/restore deleted items
const getDeletedProducts = async () => {
  return Product.find({ isDeleted: true });
};
```

## Development Workflow

### File Organization
```
feature/
├── FeatureComponent.tsx    # Main component
├── components/             # Sub-components
├── hooks/                  # Custom hooks
├── utils/                  # Helper functions
└── types.ts               # TypeScript types
```

### Naming Conventions
- Components: PascalCase
- Files: PascalCase for components
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- CSS classes: kebab-case

### Git Workflow
- Feature branches
- Descriptive commit messages
- PR reviews
- Automated testing

## Deployment Patterns

### Environment Variables
```typescript
// Use import.meta.env for Vite
const API_URL = import.meta.env.VITE_API_URL;
```

### Build Optimization
- Tree shaking
- Code minification
- Asset optimization
- CDN deployment

## Common Utilities

### Date Formatting
```typescript
format(new Date(date), 'PPpp'); // Pretty date format
```

### Currency Formatting
```typescript
new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(amount);
```

### Debouncing
```typescript
const debounced = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

## Best Practices Summary

1. **Always break large components into smaller modules**
2. Use TypeScript for type safety
3. Implement proper error handling
4. Provide loading and empty states
5. Follow consistent naming conventions
6. Write reusable components
7. Optimize for performance
8. Maintain clean code structure
9. Document complex logic
10. Test critical paths
11. **Validate nested data structures at every layer**
12. **Use soft delete for data preservation**
13. **Ensure complete data flow from frontend to database**

## Testing Utilities

### Database Cleanup Scripts
```typescript
// clearOrders.js - Remove all orders for testing
const clearOrders = async () => {
  const result = await Order.deleteMany({});
  console.log(`Deleted ${result.deletedCount} orders`);
};
```

### Data Flow Testing
```typescript
// testCustomizationFlow.js - Verify data integrity
const testCustomizationFlow = async () => {
  // Test frontend data structure
  // Test backend processing
  // Verify database storage
  // Fetch and validate stored data
};
```
