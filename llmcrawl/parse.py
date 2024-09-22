import argparse
import json
import re
import pathlib
from crawl4ai.web_crawler import WebCrawler


def save_results(result, basename):
    base_path = pathlib.Path(__file__).parent / "results" / basename
    base_path.mkdir(parents=True, exist_ok=True)
    
    # save the markdown
    with open(base_path / f"page.md", "w") as f:
        f.write(result.markdown)
    
    print("saved markdown")
        
    # save the media
    for media, media_dict in result.media.items():
        with open(base_path / f"{media}.json", "w") as f:
            json.dump(media_dict, f, indent=4)
    
    print("saved media")
    
    # save the links
    with open(base_path / "links.json", "w") as f:
        json.dump(result.links, f, indent=4)

    print("saved links")
    
    # save the cleaned html
    with open(base_path / "cleaned_html.html", "w") as f:
        f.write(result.cleaned_html)
    
    print("saved cleaned html")


def clean_url_to_basename(url):
    # Remove protocol and www
    url = re.sub(r'^(https?://)?(www\.)?', '', url)
    
    # Remove trailing slash
    url = url.rstrip('/')
    
    # Replace special characters with underscore
    url = re.sub(r'[/:?=&.]', '_', url)
    
    return url

def main(url):
    crawler = WebCrawler()
    crawler.warmup()

    result = crawler.run(
        url=url,
        screenshot=False
    )

    # Check if the crawl was successful
    if not result.success:
        print("Crawl failed with error:", result.error_message)
        return

    print("Crawl succeeded!")
    
    # Use the new function to clean the URL
    basename = clean_url_to_basename(url)
    print(f"Saving results to {basename}")

    save_results(result, basename)
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Web crawler for AI processing")
    parser.add_argument("--url", type=str, default="https://github.com/catcathh/UltraPixel",
                        help="URL of the webpage to crawl (default: %(default)s)")

    args = parser.parse_args()

    main(args.url)
