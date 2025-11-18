# POST without authentication
POST http://localhost:8080/v1/fragments
Content-Type: text/plain

`Unauthenticated fragment`

# Expect HTTP 401 Unauthorized
HTTP/1.1 401
