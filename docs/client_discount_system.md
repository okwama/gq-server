# Client Discount System Documentation

## Overview

The client discount system allows each client to have a designated discount percentage applied to all products. When fetching products, the system automatically calculates and displays discounted prices based on each product's associated client's discount percentage. Each product shows pricing specific to its assigned client/outlet.

**Key Features:**
- **Automatic Discount Application:** All products show discounted prices based on their client
- **Fallback Pricing:** Uses `unit_cost` when no price options exist
- **Client-Specific Views:** Can view products with any client's discount
- **Order Integration:** Orders automatically apply client discounts

## Database Schema Changes

### Clients Model
Added `discountPercentage` field to the `Clients` model:

```prisma
model Clients {
  // ... existing fields ...
  discountPercentage Float? @default(0)
  // ... existing fields ...
}
```

## API Endpoints

### 1. Get All Products with Client-Specific Pricing

**Endpoint:** `GET /api/products`

**Description:** Retrieves all products with discounted prices automatically applied based on each product's associated client's discount percentage.

**Parameters:**
- `page` (query parameter, optional): Page number for pagination (default: 1)
- `limit` (query parameter, optional): Number of items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 24,
      "name": "GLAMAOUR QUEEN EYELASHES Drama Volumizing",
      "category_id": 7,
      "category": "Eyelashes",
      "unit_cost": "995",
      "clientId": null,
      "priceOptions": [
        {
          "id": null,
          "option": "Standard Price",
          "originalValue": 995,
          "value": 746.25,
          "discountPercentage": 25,
          "isFallback": true
        }
      ],
      "appliedDiscountPercentage": 25,
      "clientInfo": {
        "id": 86,
        "name": "MINISO SARIT",
        "discountPercentage": 25
      }
    }
  ],
  "pagination": {
    "total": 31,
    "page": 1,
    "limit": 10,
    "totalPages": 4
  }
}
```

### 2. Get Products for a Specific Client (Alternative Endpoint)

**Endpoint:** `GET /api/products/client/:clientId`

**Description:** Retrieves all products with a specific client's discount applied (useful for viewing products as if you were that client).

**Parameters:**
- `clientId` (path parameter): The ID of the client to apply discount for
- `page` (query parameter, optional): Page number for pagination (default: 1)
- `limit` (query parameter, optional): Number of items per page (default: 10)

**Response:** Same format as above, but all products show the same client's discount.

### 3. Get Client Discount Percentage

**Endpoint:** `GET /api/outlets/:id/discount`

**Description:** Retrieves the current discount percentage for a specific client.

**Parameters:**
- `id` (path parameter): The client ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 86,
    "name": "MINISO SARIT",
    "discountPercentage": 25.0,
    "status": 0
  }
}
```

### 4. Update Client Discount Percentage

**Endpoint:** `PUT /api/outlets/:id/discount`

**Description:** Updates the discount percentage for a specific client.

**Parameters:**
- `id` (path parameter): The client ID

**Request Body:**
```json
{
  "discountPercentage": 20.5
}
```

**Validation Rules:**
- `discountPercentage` must be between 0 and 100
- `discountPercentage` is required

**Response:**
```json
{
  "success": true,
  "message": "Client discount updated successfully",
  "data": {
    "id": 86,
    "name": "MINISO SARIT",
    "discountPercentage": 20.5,
    "balance": "0.00",
    "status": 0
  }
}
```

## Price Calculation Logic

### Discount Formula
```javascript
const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
  if (!discountPercentage || discountPercentage <= 0) {
    return originalPrice;
  }
  
  const discount = originalPrice * (discountPercentage / 100);
  return Math.max(0, originalPrice - discount);
};
```

### Fallback Pricing System
When no price options exist for a category, the system automatically creates fallback pricing using the product's `unit_cost`:

```javascript
const createFallbackPriceOptions = (unitCost, discountPercentage) => {
  const originalPrice = parseFloat(unitCost) || 0;
  const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercentage);
  
  return [{
    id: null,
    option: "Standard Price",
    originalValue: originalPrice,
    value: discountedPrice,
    discountPercentage: discountPercentage,
    isFallback: true
  }];
};
```

### Example Calculations

**Example 1: Eyelashes with 25% Discount**
- Original Price: $995.00
- Client Discount: 25%
- Discount Amount: $995.00 × 25% = $248.75
- Final Price: $995.00 - $248.75 = $746.25

**Example 2: Eyebrow Pencil with 25% Discount**
- Original Price: $1400.00
- Client Discount: 25%
- Discount Amount: $1400.00 × 25% = $350.00
- Final Price: $1400.00 - $350.00 = $1050.00

## Implementation Details

### 1. Product Controller Changes

**Helper Functions Added:**
- `calculateDiscountedPrice()`: Calculates discounted price based on original price and discount percentage
- `applyClientDiscount()`: Applies client discount to price options array
- `createFallbackPriceOptions()`: Creates fallback pricing using unit_cost when no price options exist

**Modified Functions:**
- `getProducts()`: Now automatically applies each product's associated client's discount with fallback support
- `getProductsForClient()`: Alternative endpoint for viewing products with a specific client's discount

**Smart Price Option Selection:**
```javascript
// Apply client discount to price options or create fallback pricing
let discountedPriceOptions = [];

if (categoryWithPriceOptions?.priceOptions && categoryWithPriceOptions.priceOptions.length > 0) {
  // Use existing price options with discount
  discountedPriceOptions = applyClientDiscount(
    categoryWithPriceOptions.priceOptions,
    discountPercentage
  );
} else {
  // Create fallback pricing using unit_cost
  discountedPriceOptions = createFallbackPriceOptions(
    product.unit_cost,
    discountPercentage
  );
}
```

### 2. Order Controller Changes

**Helper Functions Added:**
- `getClientDiscountPercentage()`: Retrieves client's discount percentage from database

**Modified Functions:**
- `createOrder()`: Applies client discount when calculating order totals
- `updateOrder()`: Applies client discount when updating order totals

### 3. Outlet Controller Changes

**New Functions Added:**
- `updateClientDiscount()`: Updates client's discount percentage
- `getClientDiscount()`: Retrieves client's current discount percentage

**Modified Functions:**
- `getOutlets()`: Now includes `discountPercentage` in response
- `createOutlet()`: Now accepts `discountPercentage` parameter

## Usage Examples

### Setting Up Client Discount

1. **Create a new client with discount:**
```http
POST /api/outlets
Content-Type: application/json

{
  "name": "MINISO SARIT",
  "address": "123 Main St",
  "contact": "+1234567890",
  "discountPercentage": 25.0
}
```

2. **Update existing client's discount:**
```http
PUT /api/outlets/86/discount
Content-Type: application/json

{
  "discountPercentage": 30.0
}
```

### Fetching Products with Discounts

1. **Get all products with their respective client discounts:**
```http
GET /api/products
```

2. **Get products with a specific client's discount (alternative view):**
```http
GET /api/products/client/86
```

### Order Processing

Orders automatically apply client discounts:

1. **Create order for client with 25% discount:**
```http
POST /api/orders
Content-Type: application/json

{
  "clientId": 86,
  "orderItems": [
    {
      "productId": 24,
      "quantity": 2,
      "priceOptionId": null
    }
  ]
}
```

**Result:** If the original price is $995, the order will use $746.25 per item (25% discount applied).

## How It Works

### Automatic Discount Application

1. **Product Association:** Each product is associated with a specific client via `clientId`
2. **Automatic Pricing:** When fetching products, the system automatically:
   - Retrieves each product's associated client
   - Gets the client's discount percentage
   - Checks if price options exist for the category
   - If price options exist: applies discount to them
   - If no price options exist: creates fallback pricing using `unit_cost`
   - Shows both original and discounted prices

### Fallback Pricing Logic

1. **Primary:** Use existing price options with discount applied
2. **Fallback:** If no price options exist, use `unit_cost` with discount applied
3. **Indicator:** `isFallback: true` shows when fallback pricing is being used

### Example Scenario

- **Product A** belongs to **Client X** (25% discount) → Shows 25% discounted prices
- **Product B** belongs to **Client Y** (0% discount) → Shows original prices  
- **Product C** belongs to **Client Z** (30% discount) → Shows 30% discounted prices

When fetching all products:
- Product A shows 25% discounted prices
- Product B shows original prices (no discount)
- Product C shows 30% discounted prices

## Frontend Integration

### React/Flutter Example

```javascript
// Fetch products with client-specific pricing
const fetchProducts = async (clientId = null) => {
  const endpoint = clientId 
    ? `/api/products/client/${clientId}`
    : '/api/products';
    
  const response = await fetch(endpoint);
  const data = await response.json();
  
  return data.data.map(product => ({
    ...product,
    displayPrice: product.priceOptions[0]?.value || product.unit_cost,
    originalPrice: product.priceOptions[0]?.originalValue || product.unit_cost,
    discountPercentage: product.appliedDiscountPercentage,
    isFallback: product.priceOptions[0]?.isFallback || false
  }));
};

// Display product with pricing
const ProductCard = ({ product }) => (
  <div className="product-card">
    <h3>{product.name}</h3>
    <div className="pricing">
      <span className="original-price">${product.originalPrice}</span>
      <span className="discounted-price">${product.displayPrice}</span>
      {product.discountPercentage > 0 && (
        <span className="discount-badge">{product.discountPercentage}% OFF</span>
      )}
      {product.isFallback && (
        <span className="fallback-indicator">Standard Pricing</span>
      )}
    </div>
  </div>
);
```

### Key Frontend Considerations

1. **Price Display:** Always show both original and discounted prices
2. **Fallback Indicator:** Show when using fallback pricing
3. **Discount Badge:** Highlight the discount percentage
4. **Client Selection:** Allow users to view products with different client discounts

## Error Handling

### Common Error Responses

1. **Invalid Discount Percentage:**
```json
{
  "error": "Discount percentage must be between 0 and 100"
}
```

2. **Client Not Found:**
```json
{
  "error": "Client not found or unauthorized"
}
```

3. **Missing Required Fields:**
```json
{
  "error": "Discount percentage is required"
}
```

## Security Considerations

- All discount endpoints require authentication
- Users can only access/modify discounts for clients in their country
- Sales representatives can only access/modify discounts for their assigned clients
- Discount percentage is validated to be between 0-100%

## Performance Optimizations

1. **Batch Operations:** Client discount percentage is fetched once per order and reused for all items
2. **Caching:** Consider implementing Redis caching for frequently accessed client discount data
3. **Database Indexes:** Ensure proper indexing on `clientId` and `discountPercentage` fields

## Migration Notes

### Database Migration
The system uses `prisma db push` to apply schema changes. The `discountPercentage` field is added with a default value of 0.

### Backward Compatibility
- Existing clients will have a default discount percentage of 0%
- All existing orders remain unchanged
- Product pricing remains backward compatible
- Fallback pricing ensures all products show pricing even without price options

## Testing

### Test Cases to Verify

1. **Discount Calculation:**
   - Verify 0% discount returns original price
   - Verify 100% discount returns 0
   - Verify 50% discount returns half price

2. **Fallback Pricing:**
   - Verify products without price options show fallback pricing
   - Verify fallback pricing uses unit_cost correctly
   - Verify fallback indicator is set correctly

3. **Product Fetching:**
   - Verify products show their respective client discounts
   - Verify products without clients show no discount
   - Verify mixed discount scenarios work correctly

4. **Order Processing:**
   - Verify order totals use discounted prices
   - Verify order updates recalculate with discounts
   - Verify multiple items in order all use correct discounts

5. **API Endpoints:**
   - Verify discount update validation
   - Verify client-specific product retrieval
   - Verify error handling for invalid inputs

## Future Enhancements

1. **Tiered Discounts:** Support for different discount levels based on order volume
2. **Product-Specific Discounts:** Allow different discounts for specific products
3. **Temporary Discounts:** Support for time-limited promotional discounts
4. **Discount History:** Track changes to client discount percentages
5. **Bulk Discount Updates:** API endpoint for updating multiple clients' discounts
6. **Price Option Management:** Admin interface for managing category price options

## Support

For technical support or questions about the client discount system, please refer to the development team or create an issue in the project repository. 