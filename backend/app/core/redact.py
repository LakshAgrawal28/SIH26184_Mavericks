import re

_PEM_PRIVATE_KEY = re.compile(
    r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?"
    r"-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    re.MULTILINE,
)

_REDACTED = "[REDACTED PRIVATE KEY]"


def redact_evidence_snippet(snippet: str | None) -> str | None:
    if snippet is None or not snippet:
        return snippet
    return _PEM_PRIVATE_KEY.sub(_REDACTED, snippet)
