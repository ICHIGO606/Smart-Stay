# BringIt Hotel & Travel Management API Documentation

## Base URL
`http://localhost:8000/api/v1`

## Authentication
All endpoints (except auth endpoints) require JWT authentication via cookies or Authorization header.

---

## Authentication Routes

### 1. User Registration
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "age": 30,
  "gender": "male"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "user_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "gender": "male",
      "role": "user",
      "verification": {
        "status": "Not Started",
        "documentUrl": null
      },
      "familyMembers": []
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  },
  "message": "User registered successfully",
  "success": true
}
```

### 2. User Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "user_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "gender": "male",
      "role": "user",
      "verification": {
        "status": "Not Started",
        "documentUrl": null
      },
      "familyMembers": []
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  },
  "message": "User logged in successfully",
  "success": true
}
```

---

## User Management Routes

### 3. Logout User
**Endpoint:** `POST /users/logout`
**Authentication:** Required

**Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out successfully",
  "success": true
}
```

### 4. Update User Profile
**Endpoint:** `PUT /users/`
**Authentication:** Required

**Request Body:**
```json
{
  "fullName": "John Smith",
  "age": 31,
  "gender": "male"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "user_id",
    "fullName": "John Smith",
    "email": "john@example.com",
    "age": 31,
    "gender": "male",
    "role": "user",
    "verification": {
      "status": "Not Started",
      "documentUrl": null
    },
    "familyMembers": []
  },
  "message": "User updated Successfully",
  "success": true
}
```

### 5. Upload Verification Document
**Endpoint:** `POST /users/upload-verification`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request Body:**
- `document`: File (PDF, JPG, PNG)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "user_id",
    "fullName": "John Smith",
    "email": "john@example.com",
    "age": 31,
    "gender": "male",
    "role": "user",
    "verification": {
      "status": "Pending",
      "documentUrl": "https://cloudinary.com/secure_url"
    },
    "familyMembers": []
  },
  "message": "Verification document uploaded successfully",
  "success": true
}
```

### 6. Get Family Members
**Endpoint:** `GET /users/family`
**Authentication:** Required

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "familyMembers": [
      {
        "_id": "member_id",
        "fullName": "Jane Doe",
        "relationship": "spouse",
        "age": 28,
        "verification": {
          "status": "Not Started",
          "documentUrl": null
        }
      }
    ]
  },
  "message": "Family Members fetched Successfully",
  "success": true
}
```

### 7. Add Family Member
**Endpoint:** `POST /users/family`
**Authentication:** Required

**Request Body:**
```json
{
  "fullName": "Jane Doe",
  "relationship": "spouse",
  "age": 28
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "member_id",
      "fullName": "Jane Doe",
      "relationship": "spouse",
      "age": 28,
      "verification": {
        "status": "Not Started",
        "documentUrl": null
      }
    }
  ],
  "message": "Family Member added successfully",
  "success": true
}
```

### 8. Update Family Member
**Endpoint:** `PUT /users/family/:memberId`
**Authentication:** Required

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "relationship": "spouse",
  "age": 29
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "user_id",
    "fullName": "John Smith",
    "email": "john@example.com",
    "age": 31,
    "gender": "male",
    "role": "user",
    "verification": {
      "status": "Pending",
      "documentUrl": "https://cloudinary.com/secure_url"
    },
    "familyMembers": [
      {
        "_id": "member_id",
        "fullName": "Jane Smith",
        "relationship": "spouse",
        "age": 29,
        "verification": {
          "status": "Not Started",
          "documentUrl": null
        }
      }
    ]
  },
  "message": "Family Member updated Successfully",
  "success": true
}
```

### 9. Upload Family Member Verification
**Endpoint:** `POST /users/family/:memberId/verify`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request Body:**
- `document`: File (PDF, JPG, PNG)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "user_id",
    "fullName": "John Smith",
    "email": "john@example.com",
    "age": 31,
    "gender": "male",
    "role": "user",
    "verification": {
      "status": "Pending",
      "documentUrl": "https://cloudinary.com/secure_url"
    },
    "familyMembers": [
      {
        "_id": "member_id",
        "fullName": "Jane Smith",
        "relationship": "spouse",
        "age": 29,
        "verification": {
          "status": "Pending",
          "documentUrl": "https://cloudinary.com/secure_url"
        }
      }
    ]
  },
  "message": "Family member verification document uploaded successfully",
  "success": true
}
```

---

## Hotel & Booking Routes

### 10. Search Hotels
**Endpoint:** `GET /hotels/hotels?city=New+York`
**Authentication:** Required

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "hotel_id",
      "name": "Grand Hotel",
      "city": "New York",
      "description": "Luxury hotel in downtown",
      "amenities": ["WiFi", "Pool", "Spa"],
      "address": "123 Main St",
      "images": ["image_url1", "image_url2"],
      "adminId": "admin_id"
    }
  ],
  "message": "Hotels fetched successfully",
  "success": true
}
```

### 11. Get Hotel Rooms
**Endpoint:** `GET /hotels/hotels/:hotelId/rooms`
**Authentication:** Required

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "room_id",
      "hotelId": "hotel_id",
      "type": "Deluxe",
      "pricePerNight": 150,
      "maxOccupancy": 2,
      "roomNumbers": ["101", "102", "103"],
      "amenities": ["TV", "AC", "Mini Bar"],
      "images": ["room_image_url"]
    }
  ],
  "message": "Rooms fetched successfully",
  "success": true
}
```

### 12. Book a Room
**Endpoint:** `POST /hotels/hotels/:hotelId/rooms/:roomId/book`
**Authentication:** Required

**Request Body:**
```json
{
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-20",
  "numberOfAdults": 2,
  "numberOfChildren": 1,
  "guests": ["John Smith", "Jane Smith"],
  "totalAmount": 750,
  "paymentStatus": "Pending",
  "bookingStatus": "Confirmed"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "booking_id",
    "user": "user_id",
    "hotelId": "hotel_id",
    "roomId": "room_id",
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-20",
    "numberOfAdults": 2,
    "numberOfChildren": 1,
    "guests": ["John Smith", "Jane Smith"],
    "totalAmount": 750,
    "paymentStatus": "Pending",
    "bookingStatus": "Confirmed",
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "message": "Booking created successfully",
  "success": true
}
```

### 13. Get User Bookings
**Endpoint:** `GET /bookings/me`
**Authentication:** Required

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "booking_id",
      "user": {
        "_id": "user_id",
        "fullName": "John Smith",
        "email": "john@example.com"
      },
      "hotelId": {
        "_id": "hotel_id",
        "name": "Grand Hotel",
        "city": "New York"
      },
      "roomId": {
        "_id": "room_id",
        "type": "Deluxe",
        "pricePerNight": 150
      },
      "checkInDate": "2024-01-15",
      "checkOutDate": "2024-01-20",
      "numberOfAdults": 2,
      "numberOfChildren": 1,
      "guests": ["John Smith", "Jane Smith"],
      "totalAmount": 750,
      "paymentStatus": "Pending",
      "bookingStatus": "Confirmed",
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "message": "User bookings fetched successfully",
  "success": true
}
```

---

## Admin Routes

### 14. Get Admin Hotels
**Endpoint:** `GET /admin/hotels`
**Authentication:** Required (Admin)

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "hotel_id",
      "name": "Grand Hotel",
      "city": "New York",
      "description": "Luxury hotel in downtown",
      "amenities": ["WiFi", "Pool", "Spa"],
      "address": "123 Main St",
      "images": ["image_url1", "image_url2"],
      "adminId": "admin_id"
    }
  ],
  "message": "Hotels fetched successfully",
  "success": true
}
```

### 15. Create Hotel
**Endpoint:** `POST /admin/hotels`
**Authentication:** Required (Admin)
**Content-Type:** `multipart/form-data`

**Request Body:**
- `name`: "Grand Hotel"
- `city": "New York"
- `description": "Luxury hotel description"
- `amenities": "WiFi,Pool,Spa"
- `address": "123 Main St"
- `images`: Array of image files

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "hotel_id",
    "name": "Grand Hotel",
    "city": "New York",
    "description": "Luxury hotel in downtown",
    "amenities": ["WiFi", "Pool", "Spa"],
    "address": "123 Main St",
    "images": ["image_url1", "image_url2"],
    "adminId": "admin_id"
  },
  "message": "Hotel Created Successfully",
  "success": true
}
```

### 16. Add Room to Hotel
**Endpoint:** `POST /admin/hotels/:hotelId/rooms`
**Authentication:** Required (Admin)
**Content-Type:** `multipart/form-data`

**Request Body:**
- `type": "Deluxe"
- `pricePerNight": 150
- `maxOccupancy": 2
- `roomNumbers": "101,102,103"
- `amenities": "TV,AC,Mini Bar"
- `images`: Array of image files

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "room_id",
    "hotelId": "hotel_id",
    "type": "Deluxe",
    "pricePerNight": 150,
    "maxOccupancy": 2,
    "roomNumbers": ["101", "102", "103"],
    "amenities": ["TV", "AC", "Mini Bar"],
    "images": ["room_image_url"]
  },
  "message": "Room added successfully",
  "success": true
}
```

### 17. Get Hotel Bookings (Admin)
**Endpoint:** `GET /admin/hotels/:hotelId/bookings`
**Authentication:** Required (Admin)

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "booking_id",
      "user": {
        "_id": "user_id",
        "fullName": "John Smith",
        "email": "john@example.com"
      },
      "roomId": {
        "_id": "room_id",
        "type": "Deluxe",
        "roomNumbers": ["101"]
      },
      "checkInDate": "2024-01-15",
      "checkOutDate": "2024-01-20",
      "numberOfAdults": 2,
      "numberOfChildren": 1,
      "guests": ["John Smith", "Jane Smith"],
      "totalAmount": 750,
      "paymentStatus": "Pending",
      "bookingStatus": "Confirmed",
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "message": "Bookings fetched successfully",
  "success": true
}
```

### 18. Get Rooms Status (Admin)
**Endpoint:** `GET /admin/hotels/:hotelId/rooms-status`
**Authentication:** Required (Admin)

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "room_id",
      "type": "Deluxe",
      "pricePerNight": 150,
      "maxOccupancy": 2,
      "roomNumbers": ["101", "102", "103"],
      "amenities": ["TV", "AC", "Mini Bar"],
      "images": ["room_image_url"],
      "bookedRoomNumbers": ["101"],
      "availableRoomNumbers": ["102", "103"]
    }
  ],
  "message": "Rooms status fetched successfully",
  "success": true
}
```

---

## Package Routes

### 19. Get All Packages
**Endpoint:** `GET /packages/`
**Authentication:** Optional

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "package_id",
      "name": "Beach Vacation",
      "description": "5-day beach package",
      "destinations": ["Miami", "Bahamas"],
      "duration": 5,
      "price": 1200,
      "images": ["package_image_url"],
      "itinerary": "Day 1: Arrival, Day 2: Beach activities...",
      "reviews": [],
      "createdBy": "admin_id"
    }
  ],
  "message": "Packages fetched successfully",
  "success": true
}
```

### 20. Get Package by ID
**Endpoint:** `GET /packages/:packageId`
**Authentication:** Optional

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "package_id",
    "name": "Beach Vacation",
    "description": "5-day beach package",
    "destinations": ["Miami", "Bahamas"],
    "duration": 5,
    "price": 1200,
    "images": ["package_image_url"],
    "itinerary": "Day 1: Arrival, Day 2: Beach activities...",
    "reviews": [
      {
        "_id": "review_id",
        "rating": 5,
        "comment": "Amazing package!",
        "user": "user_id"
      }
    ],
    "createdBy": "admin_id"
  },
  "message": "Package fetched successfully",
  "success": true
}
```

---

## Review Routes

### 21. Add Review
**Endpoint:** `POST /reviews/`
**Authentication:** Required

**Request Body:**
```json
{
  "targetModel": "Hotel",
  "targetId": "hotel_id",
  "rating": 5,
  "comment": "Excellent service!"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "review_id",
    "targetModel": "Hotel",
    "targetId": "hotel_id",
    "user": "user_id",
    "rating": 5,
    "comment": "Excellent service!",
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "message": "Review added successfully",
  "success": true
}
```

### 22. Get Reviews
**Endpoint:** `GET /reviews/:targetModel/:targetId`
**Authentication:** Optional

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "review_id",
      "targetModel": "Hotel",
      "targetId": "hotel_id",
      "user": {
        "_id": "user_id",
        "fullName": "John Smith"
      },
      "rating": 5,
      "comment": "Excellent service!",
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "message": "Reviews fetched successfully",
  "success": true
}
```

---

## Booking Management Routes

### 23. Get All Bookings (Admin)
**Endpoint:** `GET /bookings/`
**Authentication:** Required (Admin)

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "booking_id",
      "user": {
        "_id": "user_id",
        "fullName": "John Smith",
        "email": "john@example.com"
      },
      "hotelId": {
        "_id": "hotel_id",
        "name": "Grand Hotel",
        "city": "New York"
      },
      "roomId": {
        "_id": "room_id",
        "type": "Deluxe",
        "pricePerNight": 150
      },
      "checkInDate": "2024-01-15",
      "checkOutDate": "2024-01-20",
      "numberOfAdults": 2,
      "numberOfChildren": 1,
      "guests": ["John Smith", "Jane Smith"],
      "totalAmount": 750,
      "paymentStatus": "Pending",
      "bookingStatus": "Confirmed",
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "message": "All bookings fetched successfully",
  "success": true
}
```

### 24. Update Booking Status
**Endpoint:** `PUT /bookings/:bookingId`
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "bookingStatus": "Completed",
  "paymentStatus": "Paid"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "booking_id",
    "user": "user_id",
    "hotelId": "hotel_id",
    "roomId": "room_id",
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-20",
    "numberOfAdults": 2,
    "numberOfChildren": 1,
    "guests": ["John Smith", "Jane Smith"],
    "totalAmount": 750,
    "paymentStatus": "Paid",
    "bookingStatus": "Completed",
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "message": "Booking updated successfully",
  "success": true
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 404,
  "message": "Hotel not found",
  "success": false,
  "errors": [
    {
      "message": "Hotel not found"
    }
  ]
}
```

Common status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Notes

1. **Authentication**: Most endpoints require JWT authentication via cookies
2. **File Uploads**: Use `multipart/form-data` for image/document uploads
3. **Admin Routes**: Require admin privileges
4. **Date Format**: Use ISO 8601 format (YYYY-MM-DD)
5. **Pagination**: Not implemented in current version
6. **Search**: Hotel search supports city parameter
7. **Image Handling**: All images are uploaded to Cloudinary and return secure URLs