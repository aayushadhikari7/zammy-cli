# zammy-plugin-faker

Generate fake data for testing and development.

## Installation

```bash
/plugin install zammy-plugin-faker
```

## Commands

### `/fake <type> [options]`

Generate various types of fake data.

| Type | Description | Example Output |
|------|-------------|----------------|
| `email` | Random email address | `john.smith42@gmail.com` |
| `name` | Random full name | `John Smith` |
| `phone` | Random phone number | `(555) 123-4567` |
| `address` | Random street address | `123 Oak St, Portland, OR 97201` |
| `uuid` | Random UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `card` | Fake credit card (Luhn-valid) | `4532 1234 5678 9012` |
| `company` | Random company name | `Tech Solutions` |
| `date` | Random date | `March 15, 2023` |
| `lorem [n]` | Lorem ipsum (n sentences) | Lorem ipsum dolor sit amet... |
| `json <template>` | JSON with placeholders | See below |

## Examples

```bash
# Generate a random email
/fake email

# Generate 5 sentences of lorem ipsum
/fake lorem 5

# Generate JSON with fake data
/fake json {"user": "{{name}}", "email": "{{email}}", "id": "{{uuid}}"}
```

## JSON Placeholders

When using `/fake json`, you can use these placeholders:

- `{{name}}` - Full name
- `{{firstName}}` - First name only
- `{{lastName}}` - Last name only
- `{{email}}` - Email address
- `{{phone}}` - Phone number
- `{{address}}` - Full address
- `{{street}}` - Street only
- `{{city}}` - City only
- `{{state}}` - State abbreviation
- `{{zip}}` - ZIP code
- `{{uuid}}` - UUID
- `{{company}}` - Company name
- `{{date}}` - ISO date
- `{{number}}` - Random number (1-1000)
- `{{bool}}` - true or false

## License

MIT
