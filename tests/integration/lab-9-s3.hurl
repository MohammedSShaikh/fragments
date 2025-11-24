# tests/integration/lab-9-s3.hurl
# Integration test for S3 functionality

# 1. POST a new text fragment as an authorized user
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello S3!`

# Confirm 201 and capture Location header
HTTP/1.1 201
[Captures]
url: header "Location"

# 2. GET the fragment we just created
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm 200, correct type, and body
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
[Asserts]
body == "Hello S3!"

# 3. DELETE the fragment
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm 200
HTTP/1.1 200

# 4. Try to GET the deleted fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm 404 since fragment should be deleted
HTTP/1.1 404