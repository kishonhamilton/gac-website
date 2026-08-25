import os

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGES_DIR = os.path.join(ROOT, "pages")

with open(os.path.join(PAGES_DIR, "_header.html"), encoding="utf-8") as f:
    HEADER = f.read()
with open(os.path.join(PAGES_DIR, "_footer.html"), encoding="utf-8") as f:
    FOOTER = f.read()

PAGES = {
    "index.html": {
        "title": "Gospel Assembly Church of Jesus Christ (Apostolic), Inc. | Home",
        "description": "A place to worship, grow, and belong. Join Gospel Assembly Church of Jesus Christ (Apostolic), Inc. for service times, ministries, and more.",
        "og_type": "website",
        "body": "_body_index.html",
    },
    "about.html": {
        "title": "About Us | Gospel Assembly Church",
        "description": "Learn about Gospel Assembly Church of Jesus Christ (Apostolic), Inc. — our story, mission, vision, beliefs, and leadership.",
        "og_type": "website",
        "body": "_body_about.html",
    },
    "doctrine.html": {
        "title": "Our Doctrine | Gospel Assembly Church",
        "description": "The Articles of Faith of Gospel Assembly Church of Jesus Christ (Apostolic), Inc. — our doctrinal position on Scripture, salvation, and Christian living.",
        "og_type": "website",
        "body": "_body_doctrine.html",
    },
    "ministries.html": {
        "title": "Ministries | Gospel Assembly Church",
        "description": "Find your place to serve, grow, and connect through the ministries of Gospel Assembly Church.",
        "og_type": "website",
        "body": "_body_ministries.html",
    },
    "events.html": {
        "title": "Events | Gospel Assembly Church",
        "description": "Upcoming and past events at Gospel Assembly Church of Jesus Christ (Apostolic), Inc.",
        "og_type": "website",
        "body": "_body_events.html",
    },
    "give.html": {
        "title": "Give | Gospel Assembly Church",
        "description": "Support the ministry of Gospel Assembly Church through secure online giving.",
        "og_type": "website",
        "body": "_body_give.html",
    },
    "contact.html": {
        "title": "Contact Us | Gospel Assembly Church",
        "description": "Get in touch with Gospel Assembly Church of Jesus Christ (Apostolic), Inc.",
        "og_type": "website",
        "body": "_body_contact.html",
    },
    "plan-your-visit.html": {
        "title": "Plan Your Visit | Gospel Assembly Church",
        "description": "Everything first-time visitors need to know about visiting Gospel Assembly Church.",
        "og_type": "website",
        "body": "_body_plan-your-visit.html",
    },
    "members.html": {
        "title": "Member Login | Gospel Assembly Church",
        "description": "Secure member login for Gospel Assembly Church, powered by Church Community Builder.",
        "og_type": "website",
        "body": "_body_members.html",
    },
}

HEAD_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="https://www.example-gac-domain.org/{path}">

  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:type" content="{og_type}">
  <meta property="og:url" content="https://www.example-gac-domain.org/{path}">
  <meta property="og:image" content="/assets/img/og-cover.jpg">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" type="image/png" sizes="32x32" href="assets/img/brand/favicon-32.png">
  <link rel="icon" type="image/png" sizes="64x64" href="assets/img/brand/favicon-64.png">
  <link rel="apple-touch-icon" href="assets/img/brand/gac-logo-200.png">
  <link rel="stylesheet" href="assets/css/style.css">

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Church",
    "name": "Gospel Assembly Church of Jesus Christ (Apostolic), Inc.",
    "url": "https://www.example-gac-domain.org/",
    "sameAs": []
  }}
  </script>
</head>
<body>
"""

FOOT_TEMPLATE = """</body>
</html>
"""


def build():
    for path, meta in PAGES.items():
        body_path = os.path.join(PAGES_DIR, meta["body"])
        with open(body_path, encoding="utf-8") as f:
            body = f.read()

        head = HEAD_TEMPLATE.format(
            title=meta["title"],
            description=meta["description"],
            og_type=meta["og_type"],
            path=path,
        )

        html = head + HEADER + "\n" + body + "\n" + FOOTER + FOOT_TEMPLATE

        out_path = os.path.join(ROOT, path)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        print("built", path)


if __name__ == "__main__":
    build()
