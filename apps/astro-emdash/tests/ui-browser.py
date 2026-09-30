#!/usr/bin/env python3
"""Bounded local Chromium parity checks. Requires Python Playwright; installs nothing.

Example: python tests/ui-browser.py --url http://portfolio-astro-emdash.localhost:1355/dev/portfolio
Screenshots are suitable for comparison with the legacy settled-image baseline.
Expected content comes from the migration fixture; CMS runs must contain that content.
"""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', required=True)
parser.add_argument('--out', default='/tmp/portfolio-ui-validation')
parser.add_argument('--browser', default='/usr/bin/chromium')
args = parser.parse_args()
parsed = urlparse(args.url)
assert parsed.scheme in ('http', 'https') and parsed.hostname, 'Provide an explicit HTTP URL'
app = Path(__file__).resolve().parents[1]
fixture = json.loads((app / 'migration/portfolio/fixture.json').read_text())
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
headline = fixture['hero']['headline']
articles = sum(len(fixture[key]) for key in ('projects', 'experience', 'education'))
image_count = sum(bool(project.get('image')) for project in fixture['projects'])
contacts = {item['id']: item for item in fixture['contacts']}
result = {'url': args.url, 'screenshots': {}, 'checks': []}


def visit(page):
    response = page.goto(args.url, wait_until='networkidle')
    assert response and response.status == 200, 'Portfolio must return HTTP 200'
    assert headline in page.locator('h1').inner_text()
    assert page.locator('article').count() == articles
    assert page.title() == fixture['seo']['title']


def complete(page):
    page.wait_for_function("document.querySelector('[data-typewriter-tail]').textContent === ''")
    page.wait_for_function("!document.querySelector('.reveal-waiting')")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=args.browser,
                                         args=['--no-sandbox', '--no-proxy-server'])
    errors = []

    def new_page(**kwargs):
        page = browser.new_page(**kwargs)
        page.set_default_timeout(10000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        return page

    for width, height, nojs in [(375, 812, False), (768, 1024, False),
                                (1440, 1000, False), (375, 812, True)]:
        page = new_page(viewport={'width': width, 'height': height},
                        reduced_motion='reduce', java_script_enabled=not nojs)
        visit(page)
        page.evaluate('document.fonts.ready')
        total = page.evaluate('document.documentElement.scrollHeight')
        for y in range(0, total, height // 2):
            page.evaluate('(y) => scrollTo(0, y)', y)
            page.wait_for_timeout(40)
        page.wait_for_function('n => document.images.length === n && [...document.images].every(i => i.complete && i.naturalWidth > 0)', arg=image_count)
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
        assert not page.locator('[data-typewriter-cursor]').is_visible()
        page.evaluate('scrollTo(0, 0)')
        page.wait_for_timeout(100)
        name = '375-nojs' if nojs else str(width)
        page.screenshot(path=str(out / ('astro-' + name + '.png')), full_page=True)
        result['screenshots'][name] = {
            'height': total,
            'images': page.locator('img').evaluate_all('(els) => els.map(i => ({src:i.getAttribute("src"), width:i.naturalWidth, height:i.naturalHeight}))'),
            'boxes': page.locator('h1,h2,article').evaluate_all('(els) => els.map(e => ({text:e.textContent.trim(),box:e.getBoundingClientRect().toJSON()}))')
        }
        page.close()

    page = new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    visit(page)
    resume = page.locator('a[download]')
    assert resume.get_attribute('download') == fixture['hero']['resumeAction']['download']
    expected = [fixture['ui']['skipLink']['href'], fixture['ui']['navigation']['homeHref']]
    expected += [contacts[key]['url'] for key in fixture['ui']['navigation']['contactIds']]
    expected += [fixture['hero']['primaryAction']['href'], resume.get_attribute('href')]
    for project in fixture['projects']:
        if project.get('url'):
            expected += [project['url']] * (2 if project.get('image') else 1)
    expected += [contacts['email']['url']] + [item['url'] for item in fixture['contacts']]
    assert page.locator('a').count() == len(expected)
    for href in expected:
        page.keyboard.press('Tab')
        assert page.evaluate('document.activeElement.getAttribute("href")') == href
        assert page.locator(':focus').is_visible()
    visit(page)
    page.keyboard.press('Tab')
    page.keyboard.press('Enter')
    assert page.evaluate('document.activeElement.id') == fixture['ui']['main']['id']
    result['checks'].append('All keyboard anchors in fixture order; skip link focuses main')

    pdf_hash = hashlib.sha256((app / 'src/assets/hugo-hsi-resume.pdf').read_bytes()).hexdigest()
    result['pdf'] = {}
    paths = [resume.get_attribute('href'), '/resume/hugo-hsi-resume.pdf',
             '/_app/immutable/assets/hugo-hsi-resume.BZP4g5vC.pdf']
    for path in paths:
        # Browser fetch resolves .localhost consistently without external DNS requests.
        pdf = page.evaluate('''async path => {
          const r = await fetch(path); const bytes = new Uint8Array(await r.arrayBuffer());
          return {status:r.status, type:r.headers.get('content-type'), bytes:Array.from(bytes)};
        }''', path)
        assert pdf['status'] == 200 and 'application/pdf' in pdf['type']
        assert hashlib.sha256(bytes(pdf['bytes'])).hexdigest() == pdf_hash
        result['pdf'][path] = pdf_hash

    page.emulate_media(reduced_motion='no-preference')
    visit(page)
    complete(page)
    page.wait_for_timeout(1600)  # Last staggered hero entrance finishes after typing.
    assert not page.locator('[data-typewriter-cursor]').is_visible()
    assert not page.locator('[data-nav-name]').evaluate('(e) => e.classList.contains("is-visible")')
    page.locator('#projects').scroll_into_view_if_needed()
    page.wait_for_timeout(100)
    assert page.locator('[data-nav-name]').evaluate('(e) => e.classList.contains("is-visible")')
    page.wait_for_timeout(900)
    assert page.locator('.animate-reveal').count() == 0
    page.evaluate('scrollTo(0, 0)')
    page.wait_for_timeout(600)
    link = page.locator('.social-link').first
    box = link.bounding_box()
    page.mouse.move(box['x'] + 3, box['y'] + 3)
    assert link.locator('[data-magnetic-content]').evaluate('(e) => e.style.translate')
    page.mouse.move(700, 300)
    assert not link.locator('[data-magnetic-content]').evaluate('(e) => e.style.translate')
    page.mouse.move(box['x'] + 3, box['y'] + 3)
    page.emulate_media(reduced_motion='reduce')
    page.wait_for_timeout(100)
    assert not link.locator('[data-magnetic-content]').evaluate('(e) => e.style.translate')

    page.emulate_media(reduced_motion='no-preference')
    page.goto(args.url, wait_until='domcontentloaded')
    page.wait_for_function("document.querySelector('.reveal-waiting') !== null")
    assert page.locator('[data-typewriter-tail]').text_content()
    page.emulate_media(reduced_motion='reduce')
    complete(page)
    assert page.locator('.animate-reveal').count() == 0
    page.emulate_media(reduced_motion='no-preference')
    page.wait_for_timeout(200)
    assert not page.locator('[data-typewriter-tail]').text_content()
    assert page.locator('.reveal-waiting').count() == 0
    # Deterministic lifecycle event simulation, not a claim that Chromium used bfcache.
    page.evaluate("dispatchEvent(new PageTransitionEvent('pagehide', {persisted:true})); dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}))")
    page.wait_for_timeout(100)
    assert not page.locator('[data-typewriter-tail]').text_content()
    assert page.locator('.reveal-waiting,.animate-reveal').count() == 0
    result['checks'].append('Typing, reveals, header, magnetic reset, reduced-motion changes, persisted lifecycle events')
    page.close()

    for motion in ['reduce', 'no-preference']:
        page = new_page(reduced_motion=motion)
        page.add_init_script('delete window.IntersectionObserver')
        visit(page)
        complete(page)
        assert page.locator('[data-nav-name]').evaluate('(e) => e.classList.contains("is-visible")')
        assert page.locator('.reveal-waiting').count() == 0
        page.close()
    result['checks'].append('Missing IntersectionObserver with normal and reduced motion')
    assert not errors, errors
    result['page_errors'] = errors
    browser.close()

(out / 'browser-results.json').write_text(json.dumps(result, indent=2) + '\n')
print('PASS: four settled screenshots, keyboard, PDF bytes, motion, lifecycle, no-JS and missing observer checks')
print(out / 'browser-results.json')
