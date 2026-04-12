import { NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  const specUrl = `${protocol}://${host}/openapi.json`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ravenswood Archive API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: ${JSON.stringify(specUrl)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: 'BaseLayout',
    })
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
