# tests/integration/put-fragments.hurl
# Authenticated PUT /fragments/:id

# 1. Create a fragment to update
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`Hello World`

HTTP 201
[Captures]
fragment_id: jsonpath "$.fragment.id"
url: jsonpath "$.fragment.id"

# 2. Update the fragment
PUT http://localhost:8080/v1/fragments/{{fragment_id}}
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`Hello World Updated`

HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment_id}}"
# Check if updated content is returned or we need to GET it
# The response should contain the metadata.

# 3. Verify the update by GET
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
body == "Hello World Updated"

# 4. Try to update with wrong Content-Type
PUT http://localhost:8080/v1/fragments/{{fragment_id}}
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

`{"foo":"bar"}`

HTTP 400

# 5. Try to update non-existent fragment
PUT http://localhost:8080/v1/fragments/non-existent-id
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`Fail`

HTTP 404
