# Cloudflare DNS

Uses [Cloudflare](https://developers.cloudflare.com/api) API to manage DNS records.

<!-- ![Screenshot 1](./docs/screenshot1.png 'Screenshot') -->
<img src="./docs/screenshot01.png" alt="Screenshot" width="850px" style="margin-left: 24px"/>
<br/>
<br/>

# Features

## Import & Manage Domain Zones

<img src="./docs/screenshot02.png" alt="Screenshot" width="600px" style="margin-left: 24px; margin-bottom: 12px;"/>
<br/>
<img src="./docs/screenshot03.png" alt="Screenshot" width="500px" style="margin-left: 24px"/>

## Manage DNS Records

<img src="./docs/screenshot04.png" alt="Screenshot" width="850px" style="margin-left: 24px; margin-bottom: 12px;"/>

Supported Record Types:

-   A
-   CNAME
-   MX
-   SRV
-   TXT

# Deploy

```bash
docker run -d \
    -p 8080:8080 \
    --name=cloudflare-dns \
    evantrow/cloudflare-dns:latest
```

## Security

API tokens are stored in a SQLite file in `/db/database.sqlite`. Ensure proper file permissions are set.
