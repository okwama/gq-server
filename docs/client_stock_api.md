# Client Stock API Documentation

## Overview
The Client Stock API provides simple management of product quantities for each client. This system allows updating and retrieving stock levels for specific client-product combinations.

## Base URL
```
/api/client-stock
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Feature Flag
The client stock functionality can be disabled by setting the environment variable:
```
CLIENT_STOCK_ENABLED=false
```
By default, the feature is enabled.

## Endpoints

### 1. Update Client Stock
**POST** `/api/client-stock`

Update or create client stock entry for a specific product.

#### Request Body
```json
{
  "clientId": 1,
  "productId": 1,
  "quantity": 50
}
```

#### Example Request
```bash
POST /api/client-stock
Content-Type: application/json

{
  "clientId": 1,
  "productId": 1,
  "quantity": 50
}
```

#### Example Response
```json
{
  "success": true,
  "message": "Client stock updated successfully",
  "data": {
    "id": 1,
    "quantity": 50,
    "clientId": 1,
    "productId": 1,
    "client": {
      "id": 1,
      "name": "ABC Store",
      "contact": "+254700000000"
    },
    "product": {
      "id": 1,
      "name": "Product A",
      "category": "Cosmetics",
      "unit_cost": "1500.00"
    }
  }
}
```

### 2. Get Client Stock
**GET** `/api/client-stock/:clientId`

Get all stock entries for a specific client.

#### Example Request
```bash
GET /api/client-stock/1
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "quantity": 50,
      "clientId": 1,
      "productId": 1,
      "product": {
        "id": 1,
        "name": "Product A",
        "category": "Cosmetics",
        "unit_cost": "1500.00",
        "description": "High-quality product",
        "image": "https://example.com/image.jpg"
      }
    },
    {
      "id": 2,
      "quantity": 25,
      "clientId": 1,
      "productId": 2,
      "product": {
        "id": 2,
        "name": "Product B",
        "category": "Skincare",
        "unit_cost": "2000.00",
        "description": "Premium skincare product",
        "image": "https://example.com/image2.jpg"
      }
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "clientId, productId, and quantity are required"
}
```

### 403 Forbidden (Feature Disabled)
```json
{
  "success": false,
  "message": "Client stock feature is currently disabled"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Client not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error updating client stock",
  "error": "Detailed error message"
}
```

## Data Model

### ClientStock Schema
```prisma
model ClientStock {
  id        Int      @id @default(autoincrement())
  quantity  Int
  clientId  Int
  productId Int
  Clients   Clients  @relation(fields: [clientId], references: [id])
  Product   Product  @relation(fields: [productId], references: [id])

  @@unique([clientId, productId])
}
```

## Usage Examples

### Flutter/Dart Example
```dart
class ClientStockService {
  static const String baseUrl = 'https://your-api.com/api/client-stock';
  
  static Future<Map<String, dynamic>> updateStock({
    required int clientId,
    required int productId,
    required int quantity,
  }) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'clientId': clientId,
        'productId': productId,
        'quantity': quantity,
      }),
    );
    
    return json.decode(response.body);
  }
  
  static Future<Map<String, dynamic>> getClientStock(int clientId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$clientId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    return json.decode(response.body);
  }
}
```

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

class ClientStockAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async updateStock(clientId, productId, quantity) {
    const response = await axios.post(`${this.baseURL}/api/client-stock`, {
      clientId,
      productId,
      quantity
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async getClientStock(clientId) {
    const response = await axios.get(`${this.baseURL}/api/client-stock/${clientId}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }
}
```

## Environment Configuration

To disable the client stock feature, add this to your `.env` file:
```
CLIENT_STOCK_ENABLED=false
```

To enable it (default behavior):
```
CLIENT_STOCK_ENABLED=true
``` 