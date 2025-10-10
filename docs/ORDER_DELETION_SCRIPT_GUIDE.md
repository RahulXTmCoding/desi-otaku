# Order Deletion Script Guide

## Overview

The `deleteOrdersBeforeDate.js` script provides a safe and controlled way to delete orders from your database based on a specific cutoff date. This is useful for data cleanup, GDPR compliance, or managing database size.

## Features

✅ **Date-based filtering** - Delete orders before a specific date  
✅ **Dry-run mode** - Preview what would be deleted without actual deletion  
✅ **Comprehensive analysis** - Shows statistics before deletion  
✅ **Safety measures** - Multiple confirmations and validation  
✅ **Progress tracking** - Real-time feedback during operation  
✅ **Database verification** - Confirms deletion success  

## Prerequisites

- Node.js installed
- Database connection configured in `.env` file
- Access to the server directory

## Usage

### Basic Commands

```bash
# Navigate to server directory
cd server

# View help
node scripts/deleteOrdersBeforeDate.js --help

# Dry run (recommended first step)
node scripts/deleteOrdersBeforeDate.js --date 2024-09-20 --dry-run

# Actual deletion (requires confirmation)
node scripts/deleteOrdersBeforeDate.js --date 2024-09-20 --confirm
```

### Command Line Options

| Option | Description | Required | Example |
|--------|-------------|----------|---------|
| `--date` | Cutoff date (YYYY-MM-DD format) | Yes | `2024-09-20` |
| `--confirm` | Required for actual deletion | Yes* | `--confirm` |
| `--dry-run` | Preview mode (no actual deletion) | No | `--dry-run` |
| `--help` | Show help information | No | `--help` |

*Either `--confirm` or `--dry-run` is required

## Safety Features

### 1. Date Validation
- Validates date format (YYYY-MM-DD)
- Prevents deletion of future orders
- Checks for valid calendar dates

### 2. Confirmation Requirements
- Requires explicit `--confirm` flag for actual deletion
- Shows detailed statistics before deletion
- 3-second countdown before execution

### 3. Dry Run Mode
- Shows exactly what would be deleted
- No actual database changes
- Comprehensive analysis and reporting

### 4. Post-Deletion Verification
- Counts remaining old orders
- Verifies deletion success
- Reports any inconsistencies

## Example Scenarios

### Scenario 1: Delete Old Test Orders

```bash
# First, check what would be deleted
node scripts/deleteOrdersBeforeDate.js --date 2024-01-01 --dry-run

# If satisfied with preview, proceed with deletion
node scripts/deleteOrdersBeforeDate.js --date 2024-01-01 --confirm
```

### Scenario 2: GDPR Compliance (1 year retention)

```bash
# Calculate date 1 year ago (example: 2023-10-08)
node scripts/deleteOrdersBeforeDate.js --date 2023-10-08 --dry-run

# After review, delete old data
node scripts/deleteOrdersBeforeDate.js --date 2023-10-08 --confirm
```

### Scenario 3: Cleanup Before September 20, 2024

```bash
# Preview orders before September 20, 2024
node scripts/deleteOrdersBeforeDate.js --date 2024-09-20 --dry-run

# Delete if confirmed
node scripts/deleteOrdersBeforeDate.js --date 2024-09-20 --confirm
```

## Sample Output

### Dry Run Output
```
🗓️  Date-Based Order Deletion Script Starting...

🔌 Connecting to database...
✅ Connected to database
📍 Database: mongodb+srv://***@cluster.mongodb.net

🎯 Operation: Delete orders created before 2024-09-20
📅 Cutoff Date: Friday, 20 September 2024
🔍 Mode: DRY RUN (preview only)

📊 Analyzing order data...

📈 ORDER ANALYSIS RESULTS:
══════════════════════════════════════════════════
📅 Cutoff Date: 2024-09-20
📦 Total Orders in Database: 150
🗑️  Orders to Delete (before 2024-09-20): 45
✅ Orders to Keep (from 2024-09-20 onwards): 105
💰 Total Value of Orders to Delete: ₹25,750.00
📆 Oldest Order to Delete: 15/6/2024
📆 Newest Order to Delete: 19/9/2024
══════════════════════════════════════════════════
⚖️  Impact: 30.0% of total orders will be deleted

🔍 DRY RUN: Would delete 45 orders worth ₹25,750.00
💡 Run with --confirm to actually delete these orders

✅ Operation completed successfully!

🔌 Closing database connection...
👋 Done!
```

### Actual Deletion Output
```
🗓️  Date-Based Order Deletion Script Starting...

🔌 Connecting to database...
✅ Connected to database
📍 Database: mongodb+srv://***@cluster.mongodb.net

🎯 Operation: Delete orders created before 2024-09-20
📅 Cutoff Date: Friday, 20 September 2024
💥 Mode: LIVE DELETION (permanent)

📊 Analyzing order data...

📈 ORDER ANALYSIS RESULTS:
══════════════════════════════════════════════════
📅 Cutoff Date: 2024-09-20
📦 Total Orders in Database: 150
🗑️  Orders to Delete (before 2024-09-20): 45
✅ Orders to Keep (from 2024-09-20 onwards): 105
💰 Total Value of Orders to Delete: ₹25,750.00
📆 Oldest Order to Delete: 15/6/2024
📆 Newest Order to Delete: 19/9/2024
══════════════════════════════════════════════════
⚖️  Impact: 30.0% of total orders will be deleted

⚠️  FINAL WARNING: About to permanently delete order data!
🗑️  This will delete 45 orders worth ₹25,750.00
⏳ Starting deletion in 3 seconds...

🗑️  Deleting orders...
✅ Successfully deleted 45 orders
✅ Verification: No old orders remaining

✅ Operation completed successfully!
💡 Tip: Consider running analytics scripts to update any cached data

🔌 Closing database connection...
👋 Done!
```

## Important Considerations

### Before Running the Script

1. **Database Backup**: Always create a database backup before deletion
2. **Business Review**: Confirm the date range aligns with business requirements
3. **Legal Compliance**: Ensure deletion complies with data retention policies
4. **System Dependencies**: Check if other systems depend on the order data

### After Running the Script

1. **Analytics Update**: Update any cached analytics or reports
2. **User Communication**: Notify relevant stakeholders if needed
3. **Audit Logging**: Document the deletion in your audit logs
4. **Verification**: Spot-check that the correct orders were deleted

## Error Handling

The script handles various error scenarios:

- **Database connection failures**: Clear error messages with troubleshooting hints
- **Invalid dates**: Validation with helpful format examples
- **Missing arguments**: User-friendly error messages with usage guidance
- **Network interruptions**: Graceful cleanup and connection closure
- **User cancellation**: Safe exit with Ctrl+C handling

## Security Features

- **Credential Protection**: Database credentials are masked in output
- **Access Control**: Requires explicit confirmation for destructive operations
- **Audit Trail**: Comprehensive logging of all operations
- **Safe Defaults**: No deletion without explicit confirmation

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
❌ Failed to connect to database: connection timeout
```
*Solution*: Check your database connection string in `.env` file

**Invalid Date Format**
```bash
❌ Error: Invalid date format. Use YYYY-MM-DD format
```
*Solution*: Use correct date format, e.g., `2024-09-20`

**Missing Confirmation**
```bash
❌ Error: Order deletion requires --confirm flag
```
*Solution*: Add `--confirm` flag or use `--dry-run` for preview

**No Orders Found**
```bash
✅ No orders found before 2024-09-20
```
*This is normal*: No orders exist before the specified date

## File Location

The script is located at: `server/scripts/deleteOrdersBeforeDate.js`

## Related Scripts

- `server/scripts/truncateData.js` - Complete collection deletion
- `server/scripts/updateInventory.js` - Inventory management
- Other database maintenance scripts in `server/scripts/`

## Support

For issues or questions:
1. Check the error message and troubleshooting section
2. Verify database connection and credentials
3. Test with `--dry-run` mode first
4. Contact system administrator if problems persist
