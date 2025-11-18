# POST with Content-Type including charset
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1

`Charset fragment!`

# Expect HTTP 201 and validate
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"
jsonpath "$.fragment.size" == 17
[Captures]
url: header "Location"

# GET the posted fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 17
[Asserts]
body == "Charset fragment!"
