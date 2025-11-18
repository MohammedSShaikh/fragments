# POST with application/json
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

`{"message":"hello json"}`

# Expect HTTP 201 and validate
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 24
[Captures]
url: header "Location"

# GET the posted fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^application/json"
header "Content-Length" == "24"
body == `{"message":"hello json"}`
