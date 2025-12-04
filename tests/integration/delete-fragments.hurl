# tests/integration/delete-fragments.hurl
# Authenticated DELETE /fragments/:id

# 1. Create a fragment to delete
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`To be deleted`

HTTP 201
[Captures]
fragment_id: jsonpath "$.fragment.id"

# 2. Delete the fragment
DELETE http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"

# 3. Verify it is gone
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1
HTTP 404

# 4. Try to delete non-existent fragment
DELETE http://localhost:8080/v1/fragments/non-existent-id
[BasicAuth]
user1@email.com:password1
HTTP 404
