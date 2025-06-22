# Uplift Sale API Documentation

## Overview
The Uplift Sale API provides functionality for creating and managing uplift sales. This system allows sales representatives to create sales that automatically deduct stock from client inventory and track sales transactions.

## Base URL
```
/api/uplift-sales
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Data Models

### UpliftSale Schema
```prisma
model UpliftSale {
  id          Int              @id @default(autoincrement())
  clientId    Int
  userId      Int
  status      String           @default("pending")
  totalAmount Float            @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  client      Clients          @relation(fields: [clientId], references: [id])
  user        SalesRep         @relation(fields: [userId], references: [id])
  items       UpliftSaleItem[]
}
```

### UpliftSaleItem Schema
```prisma
model UpliftSaleItem {
  id           Int        @id @default(autoincrement())
  upliftSaleId Int
  productId    Int
  quantity     Int
  unitPrice    Float
  total        Float
  createdAt    DateTime   @default(now())
  product      Product    @relation(fields: [productId], references: [id])
  upliftSale   UpliftSale @relation(fields: [upliftSaleId], references: [id])
}
```

## Endpoints

### 1. Create Uplift Sale
**POST** `/api/uplift-sales`

Create a new uplift sale with items. This will automatically deduct stock from the client's inventory.

#### Request Body
```json
{
  "clientId": 1,
  "userId": 2,
  "items": [
    {
      "productId": 1,
      "quantity": 5,
      "unitPrice": 1500.00
    },
    {
      "productId": 2,
      "quantity": 3,
      "unitPrice": 2000.00
    }
  ]
}
```

#### Example Request
```bash
POST /api/uplift-sales
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "clientId": 1,
  "userId": 2,
  "items": [
    {
      "productId": 1,
      "quantity": 5,
      "unitPrice": 1500.00
    }
  ]
}
```

#### Example Response
```json
{
  "success": true,
  "message": "Uplift sale created successfully",
  "data": {
    "id": 1,
    "clientId": 1,
    "userId": 2,
    "status": "pending",
    "totalAmount": 7500.00,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "items": [
      {
        "id": 1,
        "upliftSaleId": 1,
        "productId": 1,
        "quantity": 5,
        "unitPrice": 1500.00,
        "total": 7500.00,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

#### Error Responses

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "message": "Missing required fields: clientId, userId, and items are required"
}
```

**400 Bad Request - Insufficient Stock**
```json
{
  "success": false,
  "message": "Insufficient stock",
  "error": "Insufficient stock for product ID 1. Available: 0, Requested: 5. Please add stock before proceeding with the sale.",
  "type": "INSUFFICIENT_STOCK"
}
```

**404 Not Found - Client/Sales Rep**
```json
{
  "success": false,
  "message": "Client not found"
}
```

### 2. Get All Uplift Sales
**GET** `/api/uplift-sales`

Retrieve all uplift sales with optional filtering.

#### Query Parameters
- `status` (optional): Filter by sale status (e.g., "pending", "completed", "voided")
- `startDate` (optional): Filter sales from this date (ISO format)
- `endDate` (optional): Filter sales until this date (ISO format)
- `clientId` (optional): Filter by client ID
- `userId` (optional): Filter by sales representative ID

#### Example Request
```bash
GET /api/uplift-sales?status=pending&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <your-jwt-token>
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "clientId": 1,
      "userId": 2,
      "status": "pending",
      "totalAmount": 7500.00,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "items": [
        {
          "id": 1,
          "upliftSaleId": 1,
          "productId": 1,
          "quantity": 5,
          "unitPrice": 1500.00,
          "total": 7500.00,
          "product": {
            "id": 1,
            "name": "Product A",
            "category": "Cosmetics",
            "unit_cost": "1200.00",
            "description": "High-quality product"
          }
        }
      ],
      "client": {
        "id": 1,
        "name": "ABC Store",
        "contact": "+254700000000",
        "address": "123 Main St"
      },
      "user": {
        "id": 2,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### 3. Get Uplift Sales by User ID
**GET** `/api/uplift-sales/user/:userId`

Retrieve all uplift sales for a specific user with pagination and filtering.

#### Path Parameters
- `userId` (required): The ID of the sales representative

#### Query Parameters
- `status` (optional): Filter by sale status (e.g., "pending", "completed", "voided")
- `startDate` (optional): Filter sales from this date (ISO format)
- `endDate` (optional): Filter sales until this date (ISO format)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 20, max: 100)

#### Example Request
```bash
GET /api/uplift-sales/user/2?status=pending&page=1&limit=10
Authorization: Bearer <your-jwt-token>
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "clientId": 1,
      "userId": 2,
      "status": "pending",
      "totalAmount": 7500.00,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "items": [
        {
          "id": 1,
          "upliftSaleId": 1,
          "productId": 1,
          "quantity": 5,
          "unitPrice": 1500.00,
          "total": 7500.00,
          "product": {
            "id": 1,
            "name": "Product A",
            "category": "Cosmetics",
            "unit_cost": "1200.00",
            "description": "High-quality product",
            "image": "https://example.com/image.jpg"
          }
        }
      ],
      "client": {
        "id": 1,
        "name": "ABC Store",
        "contact": "+254700000000",
        "address": "123 Main St",
        "region": "Nairobi"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**400 Bad Request - Invalid User ID**
```json
{
  "success": false,
  "message": "Valid user ID is required"
}
```

### 4. Get Uplift Sale by ID
**GET** `/api/uplift-sales/:id`

Retrieve a specific uplift sale by its ID.

#### Example Request
```bash
GET /api/uplift-sales/1
Authorization: Bearer <your-jwt-token>
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "clientId": 1,
    "userId": 2,
    "status": "pending",
    "totalAmount": 7500.00,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "items": [
      {
        "id": 1,
        "upliftSaleId": 1,
        "productId": 1,
        "quantity": 5,
        "unitPrice": 1500.00,
        "total": 7500.00,
        "product": {
          "id": 1,
          "name": "Product A",
          "category": "Cosmetics",
          "unit_cost": "1200.00",
          "description": "High-quality product"
        }
      }
    ],
    "client": {
      "id": 1,
      "name": "ABC Store",
      "contact": "+254700000000",
      "address": "123 Main St"
    },
    "user": {
      "id": 2,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Uplift sale not found"
}
```

### 5. Update Uplift Sale Status
**PATCH** `/api/uplift-sales/:id/status`

Update the status of an uplift sale. When status is changed to "voided", the stock is automatically restored to the client's inventory.

#### Request Body
```json
{
  "status": "completed"
}
```

#### Example Request
```bash
PATCH /api/uplift-sales/1/status
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "status": "voided"
}
```

#### Example Response
```json
{
  "success": true,
  "message": "Status updated to voided and stock reverted",
  "data": {
    "id": 1,
    "clientId": 1,
    "userId": 2,
    "status": "voided",
    "totalAmount": 7500.00,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**400 Bad Request**
```json
{
  "success": false,
  "message": "Status is required"
}
```

### 6. Delete Uplift Sale
**DELETE** `/api/uplift-sales/:id`

Delete an uplift sale and its associated items. **Note:** This does not restore stock to the client's inventory.

#### Example Request
```bash
DELETE /api/uplift-sales/1
Authorization: Bearer <your-jwt-token>
```

#### Example Response
```json
{
  "success": true,
  "message": "Uplift sale deleted successfully"
}
```

## Status Values

- `pending`: Sale is created but not yet processed
- `completed`: Sale has been completed successfully
- `voided`: Sale has been cancelled and stock restored

## Stock Management

### Automatic Stock Deduction
When creating an uplift sale:
1. The system checks if sufficient stock exists in `ClientStock` table
2. If stock is available, it deducts the requested quantity
3. If insufficient stock, the sale creation fails with an error

### Stock Restoration
When voiding a sale:
1. All items in the sale are processed
2. Stock quantities are restored to the client's inventory
3. The sale status is updated to "voided"

## Usage Examples

### Flutter/Dart Example
```dart
class UpliftSaleService {
  static const String baseUrl = 'https://your-api.com/api/uplift-sales';
  
  static Future<Map<String, dynamic>> createSale({
    required int clientId,
    required int userId,
    required List<Map<String, dynamic>> items,
  }) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'clientId': clientId,
        'userId': userId,
        'items': items,
      }),
    );
    
    return json.decode(response.body);
  }
  
  static Future<Map<String, dynamic>> getSales({
    String? status,
    DateTime? startDate,
    DateTime? endDate,
    int? clientId,
    int? userId,
  }) async {
    final queryParams = <String, String>{};
    if (status != null) queryParams['status'] = status;
    if (startDate != null) queryParams['startDate'] = startDate.toIso8601String();
    if (endDate != null) queryParams['endDate'] = endDate.toIso8601String();
    if (clientId != null) queryParams['clientId'] = clientId.toString();
    if (userId != null) queryParams['userId'] = userId.toString();
    
    final uri = Uri.parse(baseUrl).replace(queryParameters: queryParams);
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    return json.decode(response.body);
  }
  
  static Future<Map<String, dynamic>> getSalesByUserId({
    required int userId,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (status != null) queryParams['status'] = status;
    if (startDate != null) queryParams['startDate'] = startDate.toIso8601String();
    if (endDate != null) queryParams['endDate'] = endDate.toIso8601String();
    
    final uri = Uri.parse('$baseUrl/user/$userId').replace(queryParameters: queryParams);
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    return json.decode(response.body);
  }
  
  static Future<Map<String, dynamic>> getSaleById(int saleId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$saleId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    return json.decode(response.body);
  }
  
  static Future<Map<String, dynamic>> updateStatus(int saleId, String status) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/$saleId/status'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'status': status}),
    );
    
    return json.decode(response.body);
  }
}
```

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

class UpliftSaleAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async createSale(clientId, userId, items) {
    const response = await axios.post(`${this.baseURL}/api/uplift-sales`, {
      clientId,
      userId,
      items
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async getSales(filters = {}) {
    const response = await axios.get(`${this.baseURL}/api/uplift-sales`, {
      headers: { Authorization: `Bearer ${this.token}` },
      params: filters
    });
    return response.data;
  }

  async getSalesByUserId(userId, filters = {}) {
    const response = await axios.get(`${this.baseURL}/api/uplift-sales/user/${userId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      params: filters
    });
    return response.data;
  }

  async getSaleById(id) {
    const response = await axios.get(`${this.baseURL}/api/uplift-sales/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async updateStatus(id, status) {
    const response = await axios.patch(`${this.baseURL}/api/uplift-sales/${id}/status`, {
      status
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async deleteSale(id) {
    const response = await axios.delete(`${this.baseURL}/api/uplift-sales/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }
}
```

## Error Handling

### Common Error Types
- `INSUFFICIENT_STOCK`: Client doesn't have enough stock for the requested products
- `VALIDATION_ERROR`: Missing or invalid required fields
- `NOT_FOUND`: Client, sales rep, or sale not found
- `DATABASE_ERROR`: Database transaction or connection issues

### Best Practices
1. Always check for sufficient stock before creating sales
2. Handle insufficient stock errors gracefully in the UI
3. Use transactions for operations that modify multiple records
4. Implement proper error logging and monitoring
5. Consider implementing retry logic for transient failures

## Performance Considerations

- The API uses database transactions to ensure data consistency
- Stock checks and updates are performed atomically
- Large sales with many items may take longer to process
- Consider implementing pagination for large datasets
- Monitor database performance for high-volume operations 