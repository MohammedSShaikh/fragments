# tests/integration/conversion-fragments.hurl
# Comprehensive tests for all fragment conversions

# ============================================
# TEXT/MARKDOWN CONVERSIONS
# ============================================

# Create a Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1

`# Hello Markdown`

HTTP 201
[Captures]
md_id: jsonpath "$.fragment.id"

# Markdown -> HTML
GET http://localhost:8080/v1/fragments/{{md_id}}.html
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/html"
body contains "<h1>Hello Markdown</h1>"

# Markdown -> txt
GET http://localhost:8080/v1/fragments/{{md_id}}.txt
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/plain"
body == "# Hello Markdown"

# Markdown -> md (original)
GET http://localhost:8080/v1/fragments/{{md_id}}.md
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/markdown"

# ============================================
# TEXT/HTML CONVERSIONS
# ============================================

# Create an HTML fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/html
[BasicAuth]
user1@email.com:password1

`<p>Hello HTML</p>`

HTTP 201
[Captures]
html_id: jsonpath "$.fragment.id"

# HTML -> html (original)
GET http://localhost:8080/v1/fragments/{{html_id}}.html
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/html"
body == "<p>Hello HTML</p>"

# HTML -> txt
GET http://localhost:8080/v1/fragments/{{html_id}}.txt
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/plain"
body == "<p>Hello HTML</p>"

# ============================================
# TEXT/CSV CONVERSIONS
# ============================================

# Create a CSV fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/csv
[BasicAuth]
user1@email.com:password1

```
id,name,age
1,Alice,30
2,Bob,25
```

HTTP 201
[Captures]
csv_id: jsonpath "$.fragment.id"

# CSV -> csv (original)
GET http://localhost:8080/v1/fragments/{{csv_id}}.csv
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/csv"

# CSV -> txt
GET http://localhost:8080/v1/fragments/{{csv_id}}.txt
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/plain"

# CSV -> json
GET http://localhost:8080/v1/fragments/{{csv_id}}.json
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "application/json"
jsonpath "$[0].id" == "1"
jsonpath "$[0].name" == "Alice"
jsonpath "$[1].name" == "Bob"

# ============================================
# APPLICATION/JSON CONVERSIONS
# ============================================

# Create a JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

`{"name":"Test","value":123,"active":true}`

HTTP 201
[Captures]
json_id: jsonpath "$.fragment.id"

# JSON -> json (original)
GET http://localhost:8080/v1/fragments/{{json_id}}.json
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "application/json"
jsonpath "$.name" == "Test"
jsonpath "$.value" == 123

# JSON -> yaml
GET http://localhost:8080/v1/fragments/{{json_id}}.yaml
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "application/yaml"
body contains "name: Test"
body contains "value: 123"

# JSON -> yml (alternative extension)
GET http://localhost:8080/v1/fragments/{{json_id}}.yml
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "application/yaml"

# JSON -> txt
GET http://localhost:8080/v1/fragments/{{json_id}}.txt
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/plain"

# ============================================
# APPLICATION/YAML CONVERSIONS
# ============================================

# Create a YAML fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/yaml
[BasicAuth]
user1@email.com:password1

```
name: TestYAML
value: 456
active: false
```

HTTP 201
[Captures]
yaml_id: jsonpath "$.fragment.id"

# YAML -> yaml (original)
GET http://localhost:8080/v1/fragments/{{yaml_id}}.yaml
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "application/yaml"
body contains "name: TestYAML"

# YAML -> yml (alternative extension)
GET http://localhost:8080/v1/fragments/{{yaml_id}}.yml
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "application/yaml"

# YAML -> txt
GET http://localhost:8080/v1/fragments/{{yaml_id}}.txt
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/plain"

# ============================================
# TEXT/PLAIN CONVERSIONS
# ============================================

# Create a plain text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`Just plain text`

HTTP 201
[Captures]
txt_id: jsonpath "$.fragment.id"

# Plain text -> txt (original)
GET http://localhost:8080/v1/fragments/{{txt_id}}.txt
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "text/plain"
body == "Just plain text"

# ============================================
# IMAGE CONVERSIONS
# ============================================
# Note: We'll create a small PNG and test conversions
# Hurl supports file uploads with the file, parameter

# Create a PNG image fragment (using a minimal 1x1 PNG)
POST http://localhost:8080/v1/fragments
Content-Type: image/png
[BasicAuth]
user1@email.com:password1
file,fixtures/test-image.png;

HTTP 201
[Captures]
png_id: jsonpath "$.fragment.id"

# PNG -> png (original)
GET http://localhost:8080/v1/fragments/{{png_id}}.png
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "image/png"

# PNG -> jpg
GET http://localhost:8080/v1/fragments/{{png_id}}.jpg
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "image/jpeg"

# PNG -> webp
GET http://localhost:8080/v1/fragments/{{png_id}}.webp
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "image/webp"

# PNG -> gif
GET http://localhost:8080/v1/fragments/{{png_id}}.gif
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "image/gif"

# PNG -> avif
GET http://localhost:8080/v1/fragments/{{png_id}}.avif
[BasicAuth]
user1@email.com:password1
HTTP 200
[Asserts]
header "Content-Type" startsWith "image/avif"

# ============================================
# UNSUPPORTED CONVERSIONS (Error Cases)
# ============================================

# Try to convert markdown to image (should fail)
GET http://localhost:8080/v1/fragments/{{md_id}}.png
[BasicAuth]
user1@email.com:password1
HTTP 415

# Try to convert JSON to image (should fail)
GET http://localhost:8080/v1/fragments/{{json_id}}.jpg
[BasicAuth]
user1@email.com:password1
HTTP 415

# Try to convert CSV to yaml (should fail - not supported)
GET http://localhost:8080/v1/fragments/{{csv_id}}.yaml
[BasicAuth]
user1@email.com:password1
HTTP 415
