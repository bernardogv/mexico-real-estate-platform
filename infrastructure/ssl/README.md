# SSL Certificates

This directory is used to store SSL certificates for HTTPS in production.

For production, you would typically place your certificate and key files here:
- `certificate.crt` - Your SSL certificate
- `private.key` - Your private key

For local development, you can generate self-signed certificates using:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private.key -out certificate.crt
```

Note: Self-signed certificates will show security warnings in browsers.
