
# Order API – Final Polished Version

Fullstack technical test project.

## Stack
Node.js  
Express  
SQLite  
JWT Authentication  
Swagger  
Jest tests  
Simple frontend

## Run

npm install
npm start

Open:

http://localhost:3000

## Swagger

http://localhost:3000/api-docs

## Health check

GET /health

## Endpoints

POST /order  
GET /order/list  
GET /order/:orderId  
PUT /order/:orderId  
DELETE /order/:orderId  

## Tests

Run API tests:

npm test

Frontend test:

node frontend_test.js

## Notes

Read operations do not require authentication so the frontend works without JWT.
Delete/Update endpoints may still require token depending on configuration.

This version fixes:
- 401 error on frontend item view
- static frontend serving
- health endpoint
- cleaner documentation
