# Active Context

## Current Work Focus

### Recent Implementations
1. **Soft Delete for Products** ✅
   - Added `isDeleted`, `deletedAt`, `deletedBy` fields to Product model
   - Admin can soft delete (archive) products
   - Archived products remain in orders and analytics
   - Admin can view, restore, or permanently delete archived products
   - Customers don't see archived products in shop

2. **Filter Persistence** ✅
   - **Shop Page**: All filters (search, category, productType, price, tags, sort) persist in URL
   - **Admin Order Management**: Filters persist (search, status, date, payment, sort, page)
   - **Admin Product Management**: Filters persist (search, price, stock, category, view mode)
   - **Admin Design Management**: Filters persist (search, category, sort)
   - **User Dashboard**: Active tab persists in URL
   - **Customize Page**: Search and category filters persist in URL
   - All filters reload correctly from URL on page refresh

3. **Backend Filtering Implementation** ✅
   - **All pages now use backend filtering** instead of client-side filtering
   - **Design API** enhanced with:
     - Full pagination support
     - Search across name, description, and tags
     - Category filtering (with populated category names)
     - Proper handling of ObjectId vs string categories
   - **Customize Page** updated to:
     - Send filter parameters to backend
     - Remove frontend filtering logic
     - Handle paginated response format
     - Fix category ObjectIds showing as tags

4. **Search Enhancement** ✅
   - Backend search now includes product tags
   - Design search works across: name, description, and tags
   - Removed search from header as requested

5. **Custom Product Display** ✅
   - Fixed Order model to store custom product data (color, colorValue, designId, designImage)
   - Custom t-shirts display correctly with their color and design in:
     - User order details
     - Admin order management
     - Order confirmation

6. **ProductType Filter Fix** ✅
   - Fixed 400 error when filtering by productType
   - Backend now properly handles ObjectId productTypes

## Technical Decisions

### Soft Delete Pattern
- Products are never actually deleted from database
- Soft deleted products marked with `isDeleted: true`
- All queries exclude soft deleted products by default
- Admin can view deleted products with `includeDeleted=true` parameter
- Preserves data integrity for historical orders and analytics

### URL State Management
- Using React Router's `useSearchParams` hook
- Filters automatically sync to URL on change
- Clean URLs - only non-default values appear in query string
- Page state fully restorable from URL

### Search Implementation
- Single search endpoint handles multiple fields
- Case-insensitive regex search
- Includes partial matches
- No need for separate search in header - shop page search is comprehensive

## Next Steps
1. Monitor soft delete functionality in production
2. Consider adding bulk restore/delete operations
3. Add audit trail for product modifications
4. Consider adding filter presets for common searches

## Important Patterns

### Filter Persistence Pattern
```typescript
// Initialize from URL
const [searchParams, setSearchParams] = useSearchParams();
const [filter, setFilter] = useState(searchParams.get('filter') || 'default');

// Update URL on filter change
useEffect(() => {
  const params = new URLSearchParams();
  if (filter !== 'default') params.set('filter', filter);
  setSearchParams(params);
}, [filter, setSearchParams]);
```

### Backend Filtering Pattern
```javascript
// Build filter parameters
const filters = {};
if (searchQuery) filters.search = searchQuery;
if (activeCategory !== 'all') filters.category = activeCategory;

// Send to backend with pagination
const data = await getDesigns(currentPage, limit, filters);
```

### Soft Delete Query Pattern
```javascript
// Exclude soft deleted by default
const filter = { isDeleted: { $ne: true } };

// Include soft deleted for admin
const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
```

## Current State
- All requested features implemented and working
- Filter persistence across all admin and user pages
- Soft delete system preserving data integrity
- Enhanced search functionality
- Clean, maintainable code patterns
