# Kirtan File Manager

A modern full-stack file management project built with:

- Python + Flask backend
- HTML
- CSS
- Vanilla JavaScript
- pathlib for safe file operations

## Features

- Create a file
- Read/open a file
- Rewrite/replace file content
- Delete a file
- Download a file
- Search files
- File list with size
- Modern responsive UI
- Toast notifications
- Modal editor
- Dark glassmorphism interface

## Run

```bash
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start:

```bash
python app.py
```

Then open:

http://127.0.0.1:5000

Files created by the application are stored in `managed_files/`.

> This project is intended for local development. If you expose it to the internet, add authentication, authorization, CSRF protection, upload restrictions, rate limiting, and production deployment configuration.
