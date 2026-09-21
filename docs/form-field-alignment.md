# Form field stack alignment (0.21.200)

Form-modal rows align their children at the start edge, and field grids pack their
contents at the start. A neighbor's multiline help, inline error or textarea no
longer stretches a short input or redistributes its label/control spacing. The
change is scoped to form modals; global ui-field behavior remains unchanged.

Two/three-column layouts preserve natural control sizes, existing textarea height
and conditional rendering. Wrapped labels retain their own line height: field tops
align, while a control below a longer label naturally starts lower. No labels or
help text are clipped or forced into fixed-height tracks. Responsive rows still
stack below the existing breakpoint.

Regression: tests/form.alignment.regression.mjs covers source/bundle, 2/3 columns,
390/1440 widths, multiline help, wrapped labels, inline errors, textarea neighbors,
conditional removal/restoration and overflow. Before the fix, the desktop amount
input measured56.75px versus its36.89px baseline and shifted19.84px below its peer;
its textarea neighbor stretched to63.45px. The fixed inputs match baseline height.
Captures and measurements: output/playwright/form-alignment/.

Adopt matched0.21.200 loader/mainJS/mainCSS after review/publication. Modular
consumers require the revised form stylesheet and form module (CSS cache URL).
Candidate hashes: docs/form-alignment-assets.json. Application adoption and final
visual acceptance are separate from this library regression evidence.
