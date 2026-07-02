from __future__ import annotations
import math
import re
from collections.abc import Iterable


_TOKEN_PATTERN = re.compile(r"[a-zA-Z0-9+#]+")
_NON_TEXT_PATTERN = re.compile(r"[^a-zA-Z0-9\s+#.]")
_WHITESPACE_PATTERN = re.compile(r"\s+")

STOPWORDS_EN: frozenset[str] = frozenset({
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
    'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
    'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
    'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above',
    'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o',
    're', 've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn',
    'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn',
    'weren', 'won', 'wouldn',
    'also', 'well', 'may', 'use', 'using', 'used', 'including', 'etc',
})

_SUFFIX_RULES: tuple[tuple[str, str], ...] = (
    ('ational', 'ate'), ('tional', 'tion'), ('enci', 'ence'), ('anci', 'ance'),
    ('izer', 'ize'), ('alli', 'al'), ('entli', 'ent'), ('eli', 'e'),
    ('ousli', 'ous'), ('ization', 'ize'), ('ation', 'ate'), ('ator', 'ate'),
    ('alism', 'al'), ('iveness', 'ive'), ('fulness', 'ful'), ('ousness', 'ous'),
    ('aliti', 'al'), ('iviti', 'ive'), ('biliti', 'ble'),
    ('ies', 'y'), ('ive', ''), ('ing', ''), ('ful', ''), ('ness', ''),
    ('ment', ''), ('tion', 't'), ('able', ''), ('ible', ''),
    ('ly', ''), ('ed', ''), ('er', ''), ('es', ''), ('s', ''),
)


def _is_missing(value: object) -> bool:
    """Return True for None/NaN values, matching the notebook's pd.isna scalar use."""
    if value is None:
        return True
    if isinstance(value, float):
        return math.isnan(value)
    return False


def case_folding(text: object) -> str:
    """Case folding: convert text to lowercase."""
    if _is_missing(text):
        return ''
    return str(text).lower()


def remove_punctuation(text: object) -> str:
    """Remove punctuation and unsupported special characters."""
    if _is_missing(text):
        return ''
    cleaned = _NON_TEXT_PATTERN.sub(' ', str(text))
    return _WHITESPACE_PATTERN.sub(' ', cleaned).strip()


def tokenize(text: object) -> list[str]:
    """Tokenize text using the same regex as the notebook."""
    if _is_missing(text) or not str(text).strip():
        return []
    return _TOKEN_PATTERN.findall(str(text).lower())


def remove_stopwords(tokens: Iterable[str], stopwords: frozenset[str] = STOPWORDS_EN) -> list[str]:
    """Remove common English stopwords and one-character tokens."""
    return [token for token in tokens if token not in stopwords and len(token) > 1]


def stem_word(word: str) -> str:
    """Simple suffix-stripping stemmer, copied from the notebook rules."""
    if len(word) <= 3:
        return word
    for suffix, replacement in _SUFFIX_RULES:
        if word.endswith(suffix) and len(word) - len(suffix) >= 2:
            return word[:-len(suffix)] + replacement
    return word


def stem_tokens(tokens: Iterable[str]) -> list[str]:
    """Apply simple stemming to tokens."""
    return [stem_word(token) for token in tokens]


def preprocess_text(text: object) -> str:
    """Full pipeline: case folding -> punctuation removal -> tokenize -> stopwords -> stemming."""
    folded = case_folding(text)
    cleaned = remove_punctuation(folded)
    tokens = tokenize(cleaned)
    filtered = remove_stopwords(tokens)
    stemmed = stem_tokens(filtered)
    return ' '.join(stemmed)


def preprocess_to_tokens(text: object) -> list[str]:
    """Run the full preprocessing pipeline and return tokens instead of joined text."""
    folded = case_folding(text)
    cleaned = remove_punctuation(folded)
    tokens = tokenize(cleaned)
    filtered = remove_stopwords(tokens)
    return stem_tokens(filtered)


def build_combined_text(resume_text: object, job_summary: object, separator: str = ' [SEP] ') -> str:
    """Build raw text in the same resume + separator + job-summary format used for training."""
    left = '' if _is_missing(resume_text) else str(resume_text)
    right = '' if _is_missing(job_summary) else str(job_summary)
    return left + separator + right


def preprocess_resume_job(resume_text: object, job_summary: object) -> str:
    """Preprocess a resume + job-summary pair for MiniLM inference."""
    return preprocess_text(build_combined_text(resume_text, job_summary))


def preprocess_skills_job(candidate_skills: object, job_summary: object) -> str:
    """Preprocess skills + job summary by treating skills as a short resume profile.

    The model was trained on `resume_text [SEP] job_summary`, not a dedicated skill field.
    This helper keeps the inference format compatible by placing skills on the resume side.
    """
    skills_text = '' if _is_missing(candidate_skills) else 'Candidate skills: ' + str(candidate_skills)
    return preprocess_resume_job(skills_text, job_summary)
