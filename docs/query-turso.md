Here is an expanded documentation draft for the Turso Query API with examples from the Turso HTTP Quickstart (https://docs.turso.tech/sdk/http/quickstart):

***

## Turso Query API Documentation with Quickstart Examples

The Turso Query API lets you run SQL queries and manage connections remotely over HTTP with JSON requests.

### 1. Obtain Database HTTP URL

Get your database URL in HTTP form using the Turso CLI:

```bash
turso db show <database-name> --http-url
```

The URL format is:

```
https://[databaseName]-[organizationSlug].turso.io
```

You will append `/v2/pipeline` to this URL for query requests.

### 2. Create Database Authentication Token

Generate an auth token allowing API access:

```bash
turso db tokens create <database-name>
```

Include the token in the `Authorization` header as:

```
Authorization: Bearer <token>
```

### 3. Create JSON Request Payload

Prepare your SQL query requests in JSON format like so:

```json
{
  "requests": [
    {
      "type": "execute",
      "stmt": {
        "sql": "SELECT * FROM users"
      }
    },
    {
      "type": "close"
    }
  ]
}
```

This will execute the query and immediately close the connection.

### 4. Execute HTTP Request

Example with fetch in JavaScript:

```js
const url = "https://[databaseName]-[organizationSlug].turso.io/v2/pipeline";
const authToken = "YOUR_AUTH_TOKEN";

fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    requests: [
      { type: "execute", stmt: { sql: "SELECT * FROM users" } },
      { type: "close" },
    ],
  }),
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Parameter Binding

You can use placeholders in your SQL and provide bound parameters.

#### Positional Parameters Example

```json
{
  "requests": [
    {
      "type": "execute",
      "stmt": {
        "sql": "SELECT * FROM users WHERE id = ?",
        "args": [
          {
            "type": "integer",
            "value": "1"
          }
        ]
      }
    },
    { "type": "close" }
  ]
}
```

- `?` is the placeholder.
- `args` defines the values in order.
- Supported `type`s: `null`, `integer`, `float`, `text`, `blob`.
- String representation for `value` is to maintain precision in JSON.

#### Named Parameters Example

```json
{
  "requests": [
    {
      "type": "execute",
      "stmt": {
        "sql": "SELECT * FROM users WHERE name = :name",
        "named_args": [
          {
            "name": "name",
            "value": {
              "type": "text",
              "value": "Turso"
            }
          }
        ]
      }
    },
    { "type": "close" }
  ]
}
```

### Response Structure

The response includes:

- `baton`: Connection identifier for reuse.
- `results`: Array of query results, each containing:
  - `cols`: Columns names.
  - `rows`: Data rows.
  - `affected_row_count`: Number of rows affected.
  - `last_insert_rowid`: Row ID for inserts.
  - `query_duration_ms`: Query duration in milliseconds.

***

The above provides a complete overview with code snippets on performing queries with or without parameter binding in the Turso HTTP Query API. This guide is suitable for quick integration and testing.

Would additional guidance on managing transactions or connection reuse be helpful?

Sources
[1] Turso Quickstart (HTTP) https://docs.turso.tech/sdk/http/quickstart
