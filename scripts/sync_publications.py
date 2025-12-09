#!/usr/bin/env python3
"""
Sync publications from Google Scholar to the website.

This script fetches publications from a Google Scholar profile and updates
the index.markdown file with any new publications found.
"""

import argparse
import re
import sys
from typing import List, Dict, Set
from scholarly import scholarly


def fetch_scholar_publications(user_id: str) -> List[Dict]:
    """
    Fetch all publications from a Google Scholar profile.

    Args:
        user_id: Google Scholar user ID

    Returns:
        List of publication dictionaries with title, authors, venue, year, and url
    """
    print(f"Fetching publications for user: {user_id}")

    try:
        # Use free proxies to avoid getting blocked (helpful in CI/CD)
        from scholarly import ProxyGenerator
        pg = ProxyGenerator()
        try:
            pg.FreeProxies()
            scholarly.use_proxy(pg)
            print("  Using free proxies to avoid rate limiting")
        except Exception as proxy_err:
            print(f"  Warning: Could not set up proxies ({proxy_err}), continuing without...")

        # Search for the author by user ID
        author = scholarly.search_author_id(user_id)
        author = scholarly.fill(author, sections=['publications'])

        publications = []
        for pub in author.get('publications', []):
            # Fill in details for each publication
            pub_filled = scholarly.fill(pub)

            # Extract relevant information
            pub_data = {
                'title': pub_filled.get('bib', {}).get('title', ''),
                'authors': pub_filled.get('bib', {}).get('author', ''),
                'venue': pub_filled.get('bib', {}).get('venue', ''),
                'year': pub_filled.get('bib', {}).get('pub_year', ''),
                'url': pub_filled.get('pub_url', ''),
                'abstract': pub_filled.get('bib', {}).get('abstract', ''),
            }

            publications.append(pub_data)
            print(f"  Found: {pub_data['title']}")

        print(f"\nTotal publications found: {len(publications)}")
        return publications

    except Exception as e:
        print(f"Error fetching publications: {e}", file=sys.stderr)
        return []


def parse_existing_publications(index_file: str) -> Set[str]:
    """
    Parse existing publications from index.markdown.

    Args:
        index_file: Path to index.markdown

    Returns:
        Set of publication titles (normalized for comparison)
    """
    print(f"\nParsing existing publications from: {index_file}")

    try:
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract the publications section
        # Find content between "## Publications" and the next section or end
        pub_match = re.search(r'## Publications\s*\n(.*?)(?=\n##|\Z)', content, re.DOTALL)
        if not pub_match:
            print("  No publications section found")
            return set()

        pub_section = pub_match.group(1)

        # Extract all bold titles (publications)
        # Pattern: **Title**
        titles = re.findall(r'\*\*(.+?)\*\*', pub_section)

        # Normalize titles for comparison (lowercase, strip whitespace)
        normalized_titles = {title.strip().lower() for title in titles}

        print(f"  Found {len(normalized_titles)} existing publications")
        for title in titles:
            print(f"    - {title}")

        return normalized_titles

    except FileNotFoundError:
        print(f"  Error: File not found: {index_file}", file=sys.stderr)
        return set()
    except Exception as e:
        print(f"  Error parsing file: {e}", file=sys.stderr)
        return set()


def normalize_title(title: str) -> str:
    """Normalize title for comparison."""
    return title.strip().lower()


def format_publication(pub: Dict) -> str:
    """
    Format a publication to match the existing style.

    Args:
        pub: Publication dictionary

    Returns:
        Formatted markdown string
    """
    title = pub['title']
    authors = pub['authors']
    venue = pub['venue']
    year = pub['year']
    url = pub['url']

    # Format the publication entry
    formatted = f"**{title}**\n"
    formatted += f"{authors}\n"

    # Format venue and year
    if venue:
        formatted += f"*{venue}*, {year}"
    else:
        formatted += f"{year}"

    # Add paper link with SVG icon
    if url:
        formatted += f' · <a href="{url}" target="_blank" class="paper-link"><svg fill="currentColor" stroke="currentColor" stroke-width="15"><use href="#icon-arxiv"/></svg>Paper</a>'

    formatted += "\n"

    return formatted


def find_new_publications(scholar_pubs: List[Dict], existing_titles: Set[str]) -> List[Dict]:
    """
    Find publications that are in Google Scholar but not on the website.

    Args:
        scholar_pubs: List of publications from Google Scholar
        existing_titles: Set of existing publication titles (normalized)

    Returns:
        List of new publications
    """
    new_pubs = []

    for pub in scholar_pubs:
        normalized = normalize_title(pub['title'])
        if normalized not in existing_titles:
            new_pubs.append(pub)

    return new_pubs


def update_index_file(index_file: str, new_pubs: List[Dict], dry_run: bool = True) -> bool:
    """
    Update the index.markdown file with new publications.

    Args:
        index_file: Path to index.markdown
        new_pubs: List of new publications to add
        dry_run: If True, only show what would be changed

    Returns:
        True if changes were made (or would be made in dry-run)
    """
    if not new_pubs:
        print("\nNo new publications to add.")
        return False

    print(f"\n{'[DRY RUN] ' if dry_run else ''}Found {len(new_pubs)} new publication(s):")
    for pub in new_pubs:
        print(f"  - {pub['title']}")

    try:
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find the publications section
        # We want to add new publications before the "---" separator (if it exists)
        # or at the end of the publications section

        # Find the position to insert new publications
        # Look for the separator "---" within the publications section
        pub_section_match = re.search(
            r'(## Publications\s*\n)(.*?)(---.*?)(\n\n##|\Z)',
            content,
            re.DOTALL
        )

        if pub_section_match:
            # There's a separator (e.g., for fun publications)
            # Insert at TOP of publications section (right after "## Publications")
            header = pub_section_match.group(1)  # "## Publications\n"
            existing_pubs = pub_section_match.group(2)  # Existing publications
            separator = pub_section_match.group(3)  # "---"
            after = pub_section_match.group(4)  # Rest of content

            # Format new publications
            new_content = ""
            for pub in new_pubs:
                new_content += format_publication(pub) + "\n"

            # Reconstruct: header + NEW + existing + separator + after
            new_file_content = content[:pub_section_match.start()] + header + new_content + existing_pubs + separator + after + content[pub_section_match.end():]
        else:
            # No separator, add at TOP of publications section
            pub_section_match = re.search(
                r'(## Publications\s*\n)(.*?)(\n\n##|\Z)',
                content,
                re.DOTALL
            )

            if pub_section_match:
                header = pub_section_match.group(1)  # "## Publications\n"
                existing_pubs = pub_section_match.group(2)  # Existing publications
                after = pub_section_match.group(3)  # Next section

                # Format new publications
                new_content = ""
                for pub in new_pubs:
                    new_content += format_publication(pub) + "\n"

                # Reconstruct: header + NEW + existing + after
                new_file_content = content[:pub_section_match.start()] + header + new_content + existing_pubs + after + content[pub_section_match.end():]
            else:
                print("  Error: Could not find publications section", file=sys.stderr)
                return False

        if dry_run:
            print("\n[DRY RUN] Would add the following content:")
            print("-" * 80)
            for pub in new_pubs:
                print(format_publication(pub))
            print("-" * 80)
        else:
            # Write the updated content
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(new_file_content)
            print(f"\n✓ Updated {index_file} with {len(new_pubs)} new publication(s)")

        return True

    except Exception as e:
        print(f"  Error updating file: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Sync publications from Google Scholar to website'
    )
    parser.add_argument(
        '--user-id',
        default='XanNuj4AAAAJ',
        help='Google Scholar user ID (default: XanNuj4AAAAJ)'
    )
    parser.add_argument(
        '--index-file',
        default='index.markdown',
        help='Path to index.markdown file (default: index.markdown)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without making changes'
    )

    args = parser.parse_args()

    print("=" * 80)
    print("Google Scholar Publication Sync")
    print("=" * 80)

    # Fetch publications from Google Scholar
    scholar_pubs = fetch_scholar_publications(args.user_id)

    if not scholar_pubs:
        print("\nNo publications found on Google Scholar. Exiting.")
        return 1

    # Parse existing publications
    existing_titles = parse_existing_publications(args.index_file)

    # Find new publications
    new_pubs = find_new_publications(scholar_pubs, existing_titles)

    # Update the index file
    changes_made = update_index_file(args.index_file, new_pubs, dry_run=args.dry_run)

    print("\n" + "=" * 80)
    if changes_made:
        if args.dry_run:
            print("Status: Would update (dry-run mode)")
        else:
            print("Status: Updated successfully")
    else:
        print("Status: No changes needed")
    print("=" * 80)

    return 0


if __name__ == '__main__':
    sys.exit(main())
