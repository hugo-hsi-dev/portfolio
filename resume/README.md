# Résumé

- `hugo-hsi-resume.tex` is the editable LaTeX source.
- `hugo-hsi-resume.pdf` is the generated résumé used by the portfolio download.

After editing the LaTeX, regenerate the PDF and commit both files. The website imports this PDF directly; no copy into `static/` is needed. Vite includes a versioned PDF asset in each build, so deploying the updated build updates the download without stale browser caches.

The website build does not compile LaTeX. Generate the PDF with your LaTeX editor or, with pdfLaTeX installed, run from this directory:

```sh
pdflatex -interaction=nonstopmode -halt-on-error hugo-hsi-resume.tex
```
