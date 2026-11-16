<!-- gerado por scripts/build_reference.R a partir de man/*.Rd; não edite -->

[A referência vem da documentação do pacote (forplotR 1.0.0) e está em inglês, como no R.]{data-lang=pt}[Generated from the package documentation (forplotR 1.0.0).]{data-lang=en}

## [Mapear a parcela]{data-lang=pt}[Map the plot]{data-lang=en} {#grupo-map}

### `forplot_map()` {#forplot_map}

<p class="rd-title">Plot and save a vouchered forest plot map as HTML</p>

[Aplicação: Mapear a parcela]{data-lang=pt}[Application: Map the plot]{data-lang=en} · [→]({{LINK:map}})

```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Generate an interactive HTML map of vouchered individuals in a forest plot
using Leaflet. The function supports standard ForestPlots.net layouts defined
by plot vertices and MONITORA layouts defined by a single central coordinate.
It harmonizes specimen records, converts local plot coordinates to geographic
coordinates, draws plot geometry and subplot boundaries, and writes a
shareable HTML map to disk.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>forplot_map(
  fp_file_path = NULL,
  input_type = c("field_sheet", "field_sheet_ti", "fp_query_sheet", "monitora"),
  vertex_coords = NULL,
  plot_size = 1,
  subplot_size = 10,
  plot_width_m = NULL,
  plot_length_m = NULL,
  voucher_imgs = NULL,
  filename = "plot_map",
  station_name = NULL,
  collector = NULL,
  collector_map = NULL,
  herbaria_lookup = FALSE,
  herbaria = NULL,
  herbaria_force_refresh = FALSE,
  keep_herbaria_downloads = FALSE,
  verbose = TRUE,
  highlight_palms = TRUE,
  plot_name = NULL,
  plot_code = NULL,
  team = NULL,
  language = c("en", "pt", "es", "fr", "ma", "pa"),
  embed_voucher_imgs = FALSE,
  dir = NULL,
  logos = NULL,
  header_row = NULL,
  colname_tagno = NULL,
  colname_stemgroup = NULL,
  colname_subplot = NULL,
  colname_subplot_t2 = NULL,
  colname_x = NULL,
  colname_y = NULL,
  colname_family = NULL,
  colname_species = NULL,
  colname_dbh = NULL,
  colname_cap = NULL,
  colname_voucher = NULL,
  colname_collected = NULL,
  colname_station = NULL,
  colname_census_year = NULL
)
</code></pre>


<h4>Arguments</h4>

<table>
<tr><td><code id="fp_file_path">fp_file_path</code></td>
<td>
<p>Character scalar. Path to the Excel file containing plot
data in ForestPlots.net field-sheet, Query Library, or MONITORA format.</p>
</td></tr>
<tr><td><code id="input_type">input_type</code></td>
<td>
<p>Input layout. One of <code>"field_sheet"</code>,
<code>"field_sheet_ti"</code>, <code>"fp_query_sheet"</code>, or <code>"monitora"</code>.</p>
</td></tr>
<tr><td><code id="vertex_coords">vertex_coords</code></td>
<td>
<p>Plot reference coordinates. Accepted inputs are a data
frame, a path to an Excel or CSV file, or a numeric vector of length 2.
Latitude and longitude columns are detected by name (for example
<code>lat</code>, <code>latitude</code>, <code>lon</code>, <code>long</code>, <code>longitude</code>).
For <code>"field_sheet"</code>, <code>"field_sheet_ti"</code>, and
<code>"fp_query_sheet"</code>, provide the four plot corners in the order
described in the &quot;Vertex order&quot; section. For <code>"monitora"</code>, provide a
single central latitude/longitude. A numeric vector of length 2 is
interpreted as <code>c(lat, lon)</code> unless named with <code>lat</code>/<code>latitude</code>
and <code>lon</code>/<code>longitude</code>. When several MONITORA stations are
requested, supply one center per station: a named list, a data frame with
one row per station (in the order of <code>station_name</code>), or a data frame
with a station column.</p>
</td></tr>
<tr><td><code id="plot_size">plot_size</code></td>
<td>
<p>Numeric scalar. Total plot size in hectares. Used for
non-MONITORA inputs.</p>
</td></tr>
<tr><td><code id="subplot_size">subplot_size</code></td>
<td>
<p>Numeric scalar. Side length of each subplot in meters.</p>
</td></tr>
<tr><td><code id="plot_width_m">plot_width_m</code></td>
<td>
<p>Optional numeric scalar. Plot width in meters for
non-MONITORA layouts. If omitted, dimensions are inferred from
<code>plot_size</code> and <code>subplot_size</code>.</p>
</td></tr>
<tr><td><code id="plot_length_m">plot_length_m</code></td>
<td>
<p>Optional numeric scalar. Plot length in meters for
non-MONITORA layouts. If one dimension is supplied, the other is derived
from <code>plot_size</code>.</p>
</td></tr>
<tr><td><code id="voucher_imgs">voucher_imgs</code></td>
<td>
<p>Character scalar or <code>NULL</code>. Directory containing
voucher image subfolders. Each subfolder must be named after a voucher
(matching ignores case, spaces, and punctuation, so <code>"GCO 123"</code> matches
a folder named <code>"GCO_123"</code>) and contain one or more image files.</p>
</td></tr>
<tr><td><code id="filename">filename</code></td>
<td>
<p>Character scalar. Basename for the output HTML file, without
extension.</p>
</td></tr>
<tr><td><code id="station_name">station_name</code></td>
<td>
<p>Character vector or <code>NULL</code>. For
<code>input_type = "monitora"</code>, the station(s) to map. When more than one
station is supplied, one HTML map is written per station.</p>
</td></tr>
<tr><td><code id="collector">collector</code></td>
<td>
<p>Character scalar or <code>NULL</code>. Optional fallback collector
name used when compact voucher codes are provided without an explicit
collector string.</p>
</td></tr>
<tr><td><code id="collector_map">collector_map</code></td>
<td>
<p>Named character vector or <code>NULL</code>. Optional mapping
used to expand voucher prefixes into full collector names before herbarium
matching, for example
<code>c("DC" = "D. Cardoso", "PWM" = "P. W. Moonlight")</code>.</p>
</td></tr>
<tr><td><code id="herbaria_lookup">herbaria_lookup</code></td>
<td>
<p>Logical. If <code>TRUE</code>, the function performs a local
herbarium lookup and adds herbarium image links to specimen popups when
available. Requires the suggested packages <span class="pkg">DBI</span> and <span class="pkg">duckdb</span> and
internet access; with <code>options(forplotR.offline = TRUE)</code> the lookup
is skipped with a warning and the map is built without the links.</p>
</td></tr>
<tr><td><code id="herbaria">herbaria</code></td>
<td>
<p>Character vector or <code>NULL</code>. Herbarium codes to use in
the herbarium lookup, for example <code>c("RB", "UPCB")</code>. When
<code>herbaria_lookup = TRUE</code>, this should be a non-empty vector.</p>
</td></tr>
<tr><td><code id="herbaria_force_refresh">herbaria_force_refresh</code></td>
<td>
<p>Logical. If <code>TRUE</code>, forces rebuilding the
local herbarium index and ignores any existing cached index.</p>
</td></tr>
<tr><td><code id="keep_herbaria_downloads">keep_herbaria_downloads</code></td>
<td>
<p>Logical. If <code>FALSE</code> (default), downloaded
DwC-A archives used during herbarium lookup are removed at the end of the run.
Set to <code>TRUE</code> to retain them on disk.</p>
</td></tr>
<tr><td><code id="verbose">verbose</code></td>
<td>
<p>Logical. If <code>TRUE</code>, prints detailed messages during
harmonization, herbarium lookup and related processing.</p>
</td></tr>
<tr><td><code id="highlight_palms">highlight_palms</code></td>
<td>
<p>Logical. If <code>TRUE</code>, Arecaceae individuals are
shown as a separate status category.</p>
</td></tr>
<tr><td><code id="plot_name">plot_name</code></td>
<td>
<p>Optional plot name. If provided, overrides the plot name
extracted from the input file metadata.</p>
</td></tr>
<tr><td><code id="plot_code">plot_code</code></td>
<td>
<p>Optional plot code. If provided, overrides the plot code
extracted from the input file metadata.</p>
</td></tr>
<tr><td><code id="team">team</code></td>
<td>
<p>Optional team or PI name. If provided, overrides the team
extracted from the input file metadata.</p>
</td></tr>
<tr><td><code id="language">language</code></td>
<td>
<p>Map interface language. One of <code>"en"</code> (English),
<code>"pt"</code> (Portuguese), <code>"es"</code> (Spanish), <code>"fr"</code> (French),
<code>"ma"</code> (Mandarin), or <code>"pa"</code> (Panará).</p>
</td></tr>
<tr><td><code id="embed_voucher_imgs">embed_voucher_imgs</code></td>
<td>
<p>Logical. If <code>TRUE</code>, voucher images are
embedded in the HTML file, so the map is a single file that can be shared
on its own (but may become large). If <code>FALSE</code> (default), images are
copied next to the HTML file and linked.</p>
</td></tr>
<tr><td><code id="dir">dir</code></td>
<td>
<p>Optional output directory, created if needed. If <code>NULL</code>
(default), the HTML file is written to a session temporary directory
(<code>tempdir()</code>), which is deleted when the R session ends; supply a path
to keep the map.</p>
</td></tr>
<tr><td><code id="logos">logos</code></td>
<td>
<p>Logos shown in the header of the map. A character vector that
may mix logo names (<code>"forplotR"</code>, <code>"jbrj"</code>, <code>"ci"</code>,
<code>"iakio"</code>, <code>"monitora"</code>, <code>"forestplots"</code>), presets
(<code>"default"</code>, <code>"panara"</code>, <code>"monitora"</code>,
<code>"forestplots"</code>) and paths to your own image files, as in
<code>forplot_balance()</code>. The first logo sits beside the plot name and the
others in a row below it. The default <code>NULL</code> shows the forplotR logo
alone; <code>FALSE</code> or <code>"none"</code> shows no logo.</p>
</td></tr>
<tr><td><code id="header_row">header_row</code></td>
<td>
<p>Row of the spreadsheet that holds the column names. The
default <code>NULL</code> finds it automatically (see <code>detect_header_row()</code>),
which copes with sheets that start with rows of plot metadata. Give a
number to force it.</p>
</td></tr>
<tr><td><code id="colname_tagno">colname_tagno</code>, <code id="colname_stemgroup">colname_stemgroup</code>, <code id="colname_subplot">colname_subplot</code>, <code id="colname_x">colname_x</code>, <code id="colname_y">colname_y</code>, <code id="colname_family">colname_family</code>, <code id="colname_species">colname_species</code>, <code id="colname_dbh">colname_dbh</code>, <code id="colname_voucher">colname_voucher</code>, <code id="colname_collected">colname_collected</code></td>
<td>
<p>Optional column names in the input file to map to the internal schema,
respectively: tree tag (<code>"New Tag No"</code>), stem group
(<code>"New Stem Grouping"</code>), subplot (<code>"T1"</code>; for MONITORA, the
subunit N/S/L/O), local X and Y coordinates (m), family, species
(<code>"Original determination"</code>), diameter in mm (<code>"D"</code>), voucher,
and collection status. The default <code>NULL</code> keeps automatic detection.
Matching ignores case, accents, and punctuation. A supplied column always
overrides automatic detection.</p>
</td></tr>
<tr><td><code id="colname_subplot_t2">colname_subplot_t2</code></td>
<td>
<p>MONITORA only. Column with the subplot number
within the subunit (<code>"N_parcela"</code>).</p>
</td></tr>
<tr><td><code id="colname_cap">colname_cap</code></td>
<td>
<p>MONITORA only. Column with circumference at breast height
in cm, which is converted to diameter. Ignored if <code>colname_dbh</code> is
supplied.</p>
</td></tr>
<tr><td><code id="colname_station">colname_station</code></td>
<td>
<p>MONITORA only. Column with the station name, used to
filter by <code>station_name</code> and as the plot code.</p>
</td></tr>
<tr><td><code id="colname_census_year">colname_census_year</code></td>
<td>
<p>MONITORA only. Column with the census year or
date. Only the most recent census is plotted.</p>
</td></tr>
</table>


<h4>Details</h4>

<p>Supported inputs include standard ForestPlots.net field sheets, Indigenous
Land field sheets, Query Library exports, and MONITORA layouts. Depending on
<code>input_type</code>, the function:
</p>

<ol>
<li><p> validates required arguments and reads the input table;
</p>
</li>
<li><p> harmonizes the data into a canonical internal schema, optionally
using the <code>colname_*</code> arguments to map non-standard column names;
</p>
</li>
<li><p> extracts plot metadata such as team, plot name, and plot code;
</p>
</li>
<li><p> converts local subplot coordinates to geographic coordinates using
either plot vertices or a MONITORA center point;
</p>
</li>
<li><p> builds plot and subplot overlays;
</p>
</li>
<li><p> colors specimen markers by collection status, with palms optionally
shown as a separate visual category;
</p>
</li>
<li><p> optionally embeds voucher image carousels in specimen popups;
</p>
</li>
<li><p> optionally performs a local herbarium lookup and adds herbarium image
links when available; and
</p>
</li>
<li><p> saves the final map as an HTML file.
</p>
</li></ol>

<p>Collection status is inferred from the canonical <code>Collected</code> column
after input harmonization. For some input types, this field is derived from
source-specific voucher or collection-status columns.
</p>


<h4>Value</h4>

<p>Invisibly returns the path to the generated HTML file, or a
character vector of paths when several MONITORA stations are mapped.
</p>


<h4>Vertex order</h4>

<p>For non-MONITORA inputs, <code>vertex_coords</code> must list the four plot
corners in this order, using the plot's local coordinate system:
</p>

<ol>
<li><p> origin, <code>(X = 0, Y = 0)</code>;
</p>
</li>
<li> <p><code>(X = 0, Y = plot_length_m)</code>;
</p>
</li>
<li> <p><code>(X = plot_width_m, Y = 0)</code>;
</p>
</li>
<li> <p><code>(X = plot_width_m, Y = plot_length_m)</code>.
</p>
</li></ol>

<p>A warning is issued when the distances between corners do not match the
plot dimensions, which usually means the corners are in a different order.
Coordinates are used exactly as given (decimal degrees, negative for south
and west).
</p>


<h4>Input types</h4>


<dl>
<dt><code>"field_sheet"</code></dt><dd><p>Standard ForestPlots.net field-sheet layout.</p>
</dd>
<dt><code>"field_sheet_ti"</code></dt><dd><p>Indigenous Land field-sheet layout: rows of
plot metadata, then a header that may be bilingual
(<code>"Name | Translation"</code>). Columns are recognised by name and, failing
that, by their fixed position in the template.</p>
</dd>
<dt><code>"fp_query_sheet"</code></dt><dd><p>ForestPlots.net Query Library export converted internally to a field-sheet-like schema.</p>
</dd>
<dt><code>"monitora"</code></dt><dd><p>MONITORA layout converted internally and plotted using MONITORA geometry.</p>
</dd>
</dl>



<h4>Side effects</h4>

<p>The function writes an HTML file named
<code>Results_&lt;ddMonYYYY&gt;_&lt;filename&gt;.html</code> in <code>dir</code> (the working
directory by default). When voucher images are linked rather than embedded, they are
copied to a <code>&lt;filename&gt;_vouchers</code> folder next to the HTML file; keep
both together when sharing the map. When <code>herbaria_lookup = TRUE</code>, it
may also build or refresh a local herbarium index from DwC-A downloads and
may remove downloaded archives at the end of the run depending on
<code>keep_herbaria_downloads</code>.
</p>


<h4>Author(s)</h4>

<p>Giulia Ottino &amp; Domingos Cardoso
</p>


<h4>Examples</h4>

<pre><code class='language-R'># Write the bundled RUS01 field sheet to a temporary Excel file
fp &lt;- file.path(tempdir(), "RUS01.xlsx")
openxlsx::write.xlsx(RUS01, fp)

# Plot corners, in order: (0,0), (0,length), (width,0), (width,length).
# Approximate coordinates, for illustration only.
corners &lt;- data.frame(
  Latitude  = c(-19.9000, -19.9009, -19.9000, -19.9009),
  Longitude = c(-40.5500, -40.5500, -40.5490, -40.5490)
)

html &lt;- forplot_map(
  fp,
  vertex_coords = corners,
  language = "pt",
  dir = tempdir(),
  verbose = FALSE
)

## Not run: 
# Look up vouchers in a JABOT herbarium (downloads a Darwin Core Archive)
forplot_map(
  fp,
  vertex_coords = corners,
  voucher_imgs = "path/to/voucher_imgs",
  collector = "G. C. Ottino",
  herbaria_lookup = TRUE,
  herbaria = "RB",
  dir = "path/to/output"
)

# Field sheet with non-standard column names
forplot_map(
  "my_plot.xlsx",
  vertex_coords = corners,
  colname_tagno = "Placa",
  colname_subplot = "Subparcela",
  colname_x = "Coord X",
  colname_y = "Coord Y",
  colname_family = "Familia",
  colname_species = "Especie",
  colname_dbh = "DAP_mm",
  colname_voucher = "Voucher"
)

## End(Not run)

</code></pre>
</div>
```

## [Balanço de coleta]{data-lang=pt}[Collection balance]{data-lang=en} {#grupo-balance}

### `forplot_balance()` {#forplot_balance}

<p class="rd-title">Generate forest plot specimen map and collection balance</p>

[Aplicação: Balanço de coleta]{data-lang=pt}[Application: Collection balance]{data-lang=en} · [→]({{LINK:balance}})

```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Generate specimen collection-balance maps and reports from
<a href="https://forestplots.net/">ForestPlots.net</a> or
<a href="https://www.gov.br/icmbio/pt-br/assuntos/monitoramento/programa-monitora">MONITORA program</a>
field data. The function reads plot data, standardizes coordinates and
specimen metadata, builds plot and subplot maps, and optionally exports
HTML/PDF reports and an Excel summary workbook.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>forplot_balance(
  fp_file_path = NULL,
  language = c("en", "pt", "es", "fr", "ma", "pa"),
  input_type = c("field_sheet", "field_sheet_ti", "fp_query_sheet", "monitora"),
  plot_size = 1,
  subplot_size = 10,
  plot_width_m = NULL,
  plot_length_m = NULL,
  highlight_palms = TRUE,
  station_name = NULL,
  plot_name = NULL,
  plot_code = NULL,
  plot_census_no = NULL,
  team = NULL,
  render_html = TRUE,
  render_pdf = TRUE,
  write_xlsx = TRUE,
  verbose = TRUE,
  dir = file.path(tempdir(), "Results_map_plot"),
  filename = "plot_specimen",
  logos = NULL,
  header_row = NULL,
  colname_tagno = NULL,
  colname_stemgroup = NULL,
  colname_subplot = NULL,
  colname_subplot_t2 = NULL,
  colname_x = NULL,
  colname_y = NULL,
  colname_family = NULL,
  colname_species = NULL,
  colname_dbh = NULL,
  colname_cap = NULL,
  colname_voucher = NULL,
  colname_collected = NULL,
  colname_station = NULL,
  colname_census_year = NULL
)
</code></pre>


<h4>Arguments</h4>

<table>
<tr><td><code id="fp_file_path">fp_file_path</code></td>
<td>
<p>Path to the input Excel file in ForestPlots.net
field-sheet, Query Library, or MONITORA format.</p>
</td></tr>
<tr><td><code id="language">language</code></td>
<td>
<p>Output language. One of <code>"en"</code> (English),
<code>"pt"</code> (Portuguese), <code>"es"</code> (Spanish), <code>"fr"</code> (French),
<code>"ma"</code> (Mandarin), or <code>"pa"</code> (Panará).</p>
</td></tr>
<tr><td><code id="input_type">input_type</code></td>
<td>
<p>Input layout. One of <code>"field_sheet"</code>,
<code>"field_sheet_ti"</code>, <code>"fp_query_sheet"</code>, or <code>"monitora"</code>.</p>
</td></tr>
<tr><td><code id="plot_size">plot_size</code></td>
<td>
<p>Total plot size in hectares. Used for <code>"field_sheet"</code>
and <code>"fp_query_sheet"</code> inputs. Ignored when
<code>input_type = "monitora"</code>.</p>
</td></tr>
<tr><td><code id="subplot_size">subplot_size</code></td>
<td>
<p>Side length of each subplot in meters.</p>
</td></tr>
<tr><td><code id="plot_width_m">plot_width_m</code></td>
<td>
<p>Plot width in meters. Used for <code>"field_sheet"</code> and
<code>"fp_query_sheet"</code> inputs. Ignored when
<code>input_type = "monitora"</code>.</p>
</td></tr>
<tr><td><code id="plot_length_m">plot_length_m</code></td>
<td>
<p>Plot length in meters. Used for <code>"field_sheet"</code> and
<code>"fp_query_sheet"</code> inputs. Ignored when
<code>input_type = "monitora"</code>.</p>
</td></tr>
<tr><td><code id="highlight_palms">highlight_palms</code></td>
<td>
<p>Logical. If <code>TRUE</code>, Arecaceae individuals are
highlighted in maps and treated as a separate visual status category.</p>
</td></tr>
<tr><td><code id="station_name">station_name</code></td>
<td>
<p>Optional station identifier used when
<code>input_type = "monitora"</code>. If a character vector of length greater than
1 is supplied, the function recursively generates one report per station,
appending the station identifier to <code>filename</code>.</p>
</td></tr>
<tr><td><code id="plot_name">plot_name</code></td>
<td>
<p>Optional plot name. If provided, overrides the plot name
extracted from the input file metadata.</p>
</td></tr>
<tr><td><code id="plot_code">plot_code</code></td>
<td>
<p>Optional plot code. If provided, overrides the plot code
extracted from the input file metadata.</p>
</td></tr>
<tr><td><code id="plot_census_no">plot_census_no</code></td>
<td>
<p>Optional census number. If provided, overrides the
census number extracted from a <code>"fp_query_sheet"</code> input. For field-sheet
inputs, the function falls back to <code>"1"</code> when no value is available.</p>
</td></tr>
<tr><td><code id="team">team</code></td>
<td>
<p>Optional team or PI name. If provided, overrides the team
extracted from the input file metadata.</p>
</td></tr>
<tr><td><code id="render_html">render_html</code></td>
<td>
<p>Logical. If <code>TRUE</code>, writes the field report as a
single self-contained HTML file (see <em>Field report</em>).</p>
</td></tr>
<tr><td><code id="render_pdf">render_pdf</code></td>
<td>
<p>Logical. If <code>TRUE</code>, prints the field report to PDF
(A4) with a headless Chrome, Chromium or Edge. Skipped with a warning when
no such browser is found.</p>
</td></tr>
<tr><td><code id="write_xlsx">write_xlsx</code></td>
<td>
<p>Logical. If <code>TRUE</code>, writes the Excel summary workbook.</p>
</td></tr>
<tr><td><code id="verbose">verbose</code></td>
<td>
<p>Logical. If <code>TRUE</code>, prints progress and diagnostic
messages during input harmonization, coordinate computation, map generation,
and report rendering.</p>
</td></tr>
<tr><td><code id="dir">dir</code></td>
<td>
<p>Output directory. A date-stamped subfolder in the format
<code>ddMonYYYY</code> is created inside this directory. The default writes to a
session temporary directory (<code>tempdir()</code>), which is deleted when the R
session ends; supply a path to keep the outputs.</p>
</td></tr>
<tr><td><code id="filename">filename</code></td>
<td>
<p>Basename for generated output files, without extension.</p>
</td></tr>
<tr><td><code id="logos">logos</code></td>
<td>
<p>Logos shown at the top of the HTML and PDF report. A character
vector that may mix logo names, presets and paths to your own image files
(PNG, SVG or JPEG), in the order they should appear. Logos shipped with the
package: <code>"forplotR"</code>, <code>"jbrj"</code> (Jardim Botânico do Rio de
Janeiro), <code>"ci"</code> (Conservação Internacional), <code>"iakio"</code>
(Associação Iakiô Panará), <code>"monitora"</code> (Programa MONITORA, ICMBio)
and <code>"forestplots"</code> (ForestPlots.net). Presets: <code>"default"</code> is
forplotR + JBRJ; <code>"panara"</code> adds CI and Iakiô; <code>"monitora"</code> and
<code>"forestplots"</code>, given alone, add that partner logo to the two
standard ones. The default <code>NULL</code> uses <code>"default"</code>, or
<code>"panara"</code> when <code>input_type = "field_sheet_ti"</code>; pass
<code>c("forplotR", "jbrj")</code> to keep only the two standard logos there.
<code>FALSE</code> or <code>"none"</code> leaves the report without logos. Logos keep
their proportions and share one height.</p>
</td></tr>
<tr><td><code id="header_row">header_row</code></td>
<td>
<p>Row of the spreadsheet that holds the column names. The
default <code>NULL</code> finds it automatically (see <code>detect_header_row()</code>),
which copes with sheets that start with rows of plot metadata. Give a
number to force it.</p>
</td></tr>
<tr><td><code id="colname_tagno">colname_tagno</code>, <code id="colname_stemgroup">colname_stemgroup</code>, <code id="colname_subplot">colname_subplot</code>, <code id="colname_x">colname_x</code>, <code id="colname_y">colname_y</code>, <code id="colname_family">colname_family</code>, <code id="colname_species">colname_species</code>, <code id="colname_dbh">colname_dbh</code>, <code id="colname_voucher">colname_voucher</code>, <code id="colname_collected">colname_collected</code></td>
<td>
<p>Optional column names in the input file to map to the internal schema,
respectively: tree tag (<code>"New Tag No"</code>), stem group
(<code>"New Stem Grouping"</code>), subplot (<code>"T1"</code>; for MONITORA, the
subunit N/S/L/O), local X and Y coordinates (m), family, species
(<code>"Original determination"</code>), diameter in mm (<code>"D"</code>), voucher,
and collection status. Use them when your file uses different column names.
The default <code>NULL</code> keeps automatic detection. Matching ignores case,
accents, and punctuation. A supplied column always overrides automatic
detection.</p>
</td></tr>
<tr><td><code id="colname_subplot_t2">colname_subplot_t2</code></td>
<td>
<p>MONITORA only. Column with the subplot number
within the subunit (<code>"N_parcela"</code>).</p>
</td></tr>
<tr><td><code id="colname_cap">colname_cap</code></td>
<td>
<p>MONITORA only. Column with circumference at breast height
in cm, which is converted to diameter. Ignored if <code>colname_dbh</code> is
supplied.</p>
</td></tr>
<tr><td><code id="colname_station">colname_station</code></td>
<td>
<p>MONITORA only. Column with the station name, used to
filter by <code>station_name</code> and as the plot code.</p>
</td></tr>
<tr><td><code id="colname_census_year">colname_census_year</code></td>
<td>
<p>MONITORA only. Column with the census year or
date. Only the most recent census is plotted.</p>
</td></tr>
</table>


<h4>Details</h4>

<p>Supported inputs include ForestPlots.net field sheets, Indigenous Land field
sheets, Query Library exports, and MONITORA layouts. Depending on the selected
<code>input_type</code>, the function:
</p>

<ol>
<li><p> validates arguments and output directories;
</p>
</li>
<li><p> reads and harmonizes the input table into a canonical internal schema;
</p>
</li>
<li><p> extracts or overrides plot metadata;
</p>
</li>
<li><p> cleans coordinates and diameter values and computes plot geometry;
</p>
</li>
<li><p> generates whole-plot and subplot-level maps, with optional palm highlighting;
</p>
</li>
<li><p> writes the field report (HTML) and optionally prints it to PDF;
</p>
</li>
<li><p> optionally writes an Excel workbook summarizing collection balance per subplot.
</p>
</li></ol>

<p>Collection status is inferred from the canonical <code>Collected</code> column
after input harmonization. For some input types, this field is derived from
source-specific voucher or collection-status columns.
</p>
<p>The function is primarily called for its side effects of writing reports and
summary files to disk.
</p>


<h4>Value</h4>

<p>Invisibly returns a list with paths to generated outputs:
</p>

<dl>
<dt>html_report</dt><dd><p>Path to the rendered HTML report, or <code>NULL</code> if not generated.</p>
</dd>
<dt>pdf_report</dt><dd><p>Path to the PDF report, or <code>NULL</code> if not generated
(including when no Chrome, Chromium or Edge browser is available).</p>
</dd>
<dt>xlsx_report</dt><dd><p>Path to the Excel summary workbook, or <code>NULL</code> if not generated.</p>
</dd>
<dt>output_dir</dt><dd><p>Directory where outputs were written.</p>
</dd>
</dl>

<p>When <code>input_type = "monitora"</code> and <code>station_name</code> has length greater
than 1, the function recursively processes each station and invisibly returns
<code>TRUE</code>.
</p>


<h4>Input types</h4>


<dl>
<dt><code>"field_sheet"</code></dt><dd><p>Standard ForestPlots.net field sheet.</p>
</dd>
<dt><code>"field_sheet_ti"</code></dt><dd><p>Indigenous Land field-sheet layout: rows of
plot metadata, then a header that may be bilingual
(<code>"Name | Translation"</code>). Columns are recognised by name and, failing
that, by their fixed position in the template.</p>
</dd>
<dt><code>"fp_query_sheet"</code></dt><dd><p>ForestPlots.net Query Library export, converted internally to field-sheet schema.</p>
</dd>
<dt><code>"monitora"</code></dt><dd><p>MONITORA layout, converted internally and plotted using MONITORA geometry.</p>
</dd>
</dl>



<h4>Field report</h4>

<p>The report is a single self-contained HTML file designed to be used in the
field, on a phone (offline) or printed. It contains a summary of the
collection balance with footnotes on how each number is computed, a
clickable grid of subplots coloured by what remains to collect, whole-plot
maps with the tag of every stem (all stems, with voucher, pending and, when
<code>highlight_palms = TRUE</code>, palms), a priority route, one A4 page per
subplot (map, tree table with stems pending collection first, and blank
columns for new DBH, status, voucher number and notes), a floristic and
phytosociological overview and a checklist appendix. The first page
carries the logos chosen with <code>logos</code>. Maps are inline SVG, so the file opens without internet. In a
browser the report has a search box for tags and subplots; tapping a stem on
a subplot map highlights its row in the table. MONITORA plots are drawn as
the cross of four arms of the protocol.
</p>
<p>The floristic and phytosociological overview follows Mueller-Dombois &amp;
Ellenberg (1974), with the subplot as the sampling unit for frequency. It
gives richness (species, genera, families), density and basal area per
hectare, Shannon <code class="reqn">H'</code>, Simpson <code class="reqn">1 - D</code> and Pielou <code class="reqn">J'</code>; the
families and species with the highest importance value (IVI = relative
density + relative frequency + relative dominance) as stacked bar charts;
the distribution of stems per diameter class; and the full tables of
phytosociological parameters of every family and species. A name used in
more than one family (e.g. &quot;Indet indet&quot;) is treated as one taxon per
family. The same charts are also saved as PNG files.
</p>
<p>The PDF report is the same HTML printed by a headless Chrome, Chromium or
Microsoft Edge, one A4 page per subplot. The browser is found automatically
or through the <code>FORPLOTR_CHROME</code> environment variable. When none is
available, the PDF is skipped with a warning; the HTML report can then be
printed to PDF from any browser.
</p>


<h4>Side effects</h4>

<p>The function creates output files on disk, including map images, an optional
HTML report, an optional PDF report, and an optional Excel workbook.
</p>


<h4>Author(s)</h4>

<p>Giulia Ottino &amp; Domingos Cardoso
</p>


<h4>Examples</h4>

<pre><code class='language-R'>
# Write the bundled RUS01 field sheet to a temporary Excel file
fp &lt;- file.path(tempdir(), "RUS01.xlsx")
openxlsx::write.xlsx(RUS01, fp)

# Field report (HTML) and Excel summary; set render_pdf = TRUE to also
# print the report to PDF with Chrome, Chromium or Edge
res &lt;- forplot_balance(
  fp,
  input_type = "field_sheet",
  render_pdf = FALSE,
  dir = tempdir(),
  verbose = FALSE
)
res$html_report
res$xlsx_report

# MONITORA data, one station
fm &lt;- file.path(tempdir(), "TUM.xlsx")
openxlsx::write.xlsx(TUM, fm)
forplot_balance(
  fm,
  input_type = "monitora",
  station_name = "EA-1",
  render_html = FALSE,
  render_pdf = FALSE,
  dir = tempdir(),
  verbose = FALSE
)


## Not run: 
# Field sheet with non-standard column names
forplot_balance(
  "my_plot.xlsx",
  input_type = "field_sheet",
  colname_tagno = "Placa",
  colname_subplot = "Subparcela",
  colname_x = "Coord X",
  colname_y = "Coord Y",
  colname_family = "Familia",
  colname_species = "Especie",
  colname_dbh = "DAP_mm",
  colname_collected = "Coletado",
  dir = "path/to/output"
)

## End(Not run)

</code></pre>
</div>
```

## [Organizar as fotos]{data-lang=pt}[Organise the photos]{data-lang=en} {#grupo-photos}

### `forplot_vouchers()` {#forplot_vouchers}

<p class="rd-title">Organize voucher image directories by updated identification</p>

[Aplicação: Organizar as fotos]{data-lang=pt}[Application: Organise the photos]{data-lang=en} · [→]({{LINK:photos}})

```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Organizes image folders of voucher specimens based on their
updated taxonomic identification provided in spreadsheet files compatible
with the input layouts already supported in the package workflow. The
function is designed to be safely rerun multiple times, adapting its
behavior according to the existing directory structure and to the selected
input type.
</p>
<p>Internally, the input is harmonized into the same canonical field-sheet
schema used elsewhere in the package. For <code>input_type = "fp_query_sheet"</code>
and <code>input_type = "monitora"</code>, the function relies on the existing internal
converters. For <code>input_type = "field_sheet_ti"</code>, it applies the same direct
positional remapping used in the package workflow for Indigenous Land /
Panará-style field sheets.
</p>
<p>On the <strong>first execution</strong>, the function reads voucher information from the
input file, (i) creates a main folder (default: <code>"voucher_imgs"</code>) if it does
not already exist, and (ii) for each voucher treated as collected, creates a
nested directory structure following the format <code>Family/Genus/Voucher</code>, where
voucher images can be stored.
</p>
<p>On <strong>subsequent executions</strong>, the function performs a reorganization step.
It scans the existing voucher directories inside <code>output_dir</code>, compares them
with the currently accepted taxonomic placement inferred from the harmonized
data, and identifies folders that may reflect outdated or incorrect genus
assignments. If a voucher is found inside a taxonomically outdated path, the
function attempts to move the files to the correct <code>Family/Genus/Voucher</code>
directory. If the destination folder already contains files, the function
avoids overwriting existing content and only moves files that are not already
present.
</p>
<p>Once files are moved (or verified), the function removes empty outdated
voucher directories and, when possible, also removes empty parent taxonomic
folders left behind by the reorganization. This ensures that the directory
tree remains synchronized with the most up-to-date taxonomic identification,
making voucher image organization robust, repeatable, and easy to maintain
over time.
</p>
<p>A voucher is treated as collected when the canonical <code>Collected</code> field
indicates a positive collection status, for example <code>"Sim"</code>, <code>"Yes"</code>,
<code>"Collected"</code>, <code>"Coletado"</code>, <code>"1"</code>, <code>"x"</code>, or similar values. As an
additional fallback, the function also treats a record as collected when a
non-empty voucher code is present after input harmonization, except when
<code>Collected</code> explicitly indicates a negative collection status.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>forplot_vouchers(
  fp_file_path = NULL,
  output_dir = file.path(tempdir(), "voucher_imgs"),
  input_type = c("field_sheet", "field_sheet_ti", "fp_query_sheet", "monitora"),
  station_name = NULL,
  verbose = TRUE,
  header_row = NULL
)
</code></pre>


<h4>Arguments</h4>

<table>
<tr><td><code id="fp_file_path">fp_file_path</code></td>
<td>
<p>Character. Path to the input Excel file containing data
in one of the supported plot-data layouts.</p>
</td></tr>
<tr><td><code id="output_dir">output_dir</code></td>
<td>
<p>Character. Root directory in which voucher image folders
will be organized. The default is a session temporary directory
(<code>tempdir()</code>), which is deleted when the R session ends; point it to your
voucher image folder to organize it in place.</p>
</td></tr>
<tr><td><code id="input_type">input_type</code></td>
<td>
<p>Character. Input layout. Must be one of <code>"field_sheet"</code>,
<code>"field_sheet_ti"</code>, <code>"fp_query_sheet"</code>, or <code>"monitora"</code>.</p>
</td></tr>
<tr><td><code id="station_name">station_name</code></td>
<td>
<p>Optional character or numeric. Station name or station
identifier used to filter MONITORA spreadsheets when applicable. Ignored
for the other input types.</p>
</td></tr>
<tr><td><code id="verbose">verbose</code></td>
<td>
<p>Logical. If <code>TRUE</code>, prints detailed messages during
processing.</p>
</td></tr>
<tr><td><code id="header_row">header_row</code></td>
<td>
<p>Row of the spreadsheet that holds the column names. The
default <code>NULL</code> finds it automatically (see <code>detect_header_row()</code>),
which copes with sheets that start with rows of plot metadata. Give a
number to force it.</p>
</td></tr>
</table>


<h4>Value</h4>

<p>Invisibly returns the harmonized field-sheet data frame used
internally to organize the voucher directories.
</p>


<h4>Author(s)</h4>

<p>Giulia Ottino &amp; Domingos Cardoso
</p>


<h4>Examples</h4>

<pre><code class='language-R'># Write the bundled RUS01 field sheet to a temporary Excel file
fp &lt;- file.path(tempdir(), "RUS01.xlsx")
openxlsx::write.xlsx(RUS01, fp)

# Create one folder per collected voucher, organized by family and species
img_dir &lt;- file.path(tempdir(), "voucher_imgs")
forplot_vouchers(fp, output_dir = img_dir, verbose = FALSE)
head(list.dirs(img_dir, recursive = FALSE))


# MONITORA spreadsheet, one station
fm &lt;- file.path(tempdir(), "TUM.xlsx")
openxlsx::write.xlsx(TUM, fm)
forplot_vouchers(
  fm,
  input_type = "monitora",
  station_name = "EA-1",
  output_dir = file.path(tempdir(), "voucher_imgs_tum"),
  verbose = FALSE
)


## Not run: 
# With your own files (not shipped with the package)
forplot_vouchers("my_query_export.xlsx", input_type = "fp_query_sheet",
                 output_dir = "path/to/voucher_imgs")

## End(Not run)

</code></pre>
</div>
```

## [Etiquetas para o herbário]{data-lang=pt}[Herbarium labels]{data-lang=en} {#grupo-labels}

### `forplot_sheets()` {#forplot_sheets}

<p class="rd-title">Fill empty herbarium spreadsheet from forestplots-formatted data</p>

[Aplicação: Etiquetas para o herbário]{data-lang=pt}[Application: Herbarium labels]{data-lang=en} · [→]({{LINK:labels}})

```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Function to process data collected in the <a href="https://forestplots.net/">Forestplots format</a>
and convert it into a herbarium format.
The default herbarium format is <a href="https://rb.jbrj.gov.br/v2/validarplanilha_externo.php">JABOT</a>,
but it also supports conversion to the <a href="https://herbaria.plants.ox.ac.uk/bol/brahms/support/conifers">Brahms</a>
and custom herbarium formats, where the user can specify the column names in
column_map list. The function performs the following steps: (i) Reads the input
forestplots field sheet template and herbarium datasets; (ii) Ensures all
required metadata (e.g., majorarea, minorarea, lat, long) is correctly
provided. When <code>input_type = "monitora"</code>, the function first converts the
MONITORA spreadsheet into a field-sheet-like data frame and infers plot-level
metadata (e.g., station, protected area, team, and census year) from the
corresponding columns in the input dataset; (iii) Processes taxonomic,
spatial, and additional metadata to fill the herbarium format sheet;
(iv) Generates a new xlsx file with the converted data, saved in a directory
named after the current date.
This function automatically converts field codes from the Rainfor protocol
(e.g., tree condition codes and light exposure codes) into their full
descriptive meanings, and incorporates them into the final herbarium notes.
For example, the code &quot;A&quot; is converted to &quot;alive normal&quot; (or &quot;arvore viva
normal&quot; in Portuguese). These translations are integrated into a standardized
descriptive text alongside other information extracted directly from the
forestplots sheet, such as DBH, field notes, and subplot coordinates.
For instance, a final note in English might read:
</p>
<p>&quot;Tree, 24.83cm DBH, with peeling bark, small buttress roots, bark with tiny
reddish plates, crown completely exposed to vertical and lateral light in a
45 degree curve. Individual #3 in the subplot 1, x = 1.5m, y = 2.5m.&quot;
</p>
<p>The phrases &quot;with peeling bark&quot; and &quot;crown completely exposed to vertical
and lateral light...&quot; are automatically generated from the Rainfor codes,
while phrases such as &quot;small buttress roots&quot; and &quot;bark with reddish plates&quot;
come from the original field notes recorded in the Forestplots sheet. The
conversion of Rainfor codes and the construction of this descriptive text
are supported in three languages: English, Portuguese, and Spanish, depending
on the value set in the <code>language</code> argument.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>forplot_sheets(
  fp_file_path = NULL,
  herb_file_path = NULL,
  input_type = c("forestplots", "monitora"),
  sheet = 1,
  header_row = NULL,
  station_name = NULL,
  language = "en",
  herbarium_format = "jabot",
  column_map = NULL,
  country = "Brazil",
  majorarea = NULL,
  minorarea = NULL,
  protectedarea = NULL,
  locnotes = NULL,
  project = NULL,
  collector = NULL,
  addcoll = NULL,
  lat = NULL,
  long = NULL,
  alt = NULL,
  add_census_notes = TRUE,
  validate_locality = TRUE,
  dir = file.path(tempdir(), "Results_herb_label"),
  filename = "plot_to_herb_sheet"
)
</code></pre>


<h4>Arguments</h4>

<table>
<tr><td><code id="fp_file_path">fp_file_path</code></td>
<td>
<p>File path to the input dataset. This can be either a
ForestPlots field sheet or a MONITORA spreadsheet, depending on the value of
<code>input_type</code>.</p>
</td></tr>
<tr><td><code id="herb_file_path">herb_file_path</code></td>
<td>
<p>File path of the herbarium empty template dataset.</p>
</td></tr>
<tr><td><code id="input_type">input_type</code></td>
<td>
<p>Type of input dataset. Options are &quot;forestplots&quot; (default)
and &quot;monitora&quot;. For <code>"monitora"</code>, the function converts the input table
to a forestplots-like structure before filling the herbarium template.</p>
</td></tr>
<tr><td><code id="sheet">sheet</code></td>
<td>
<p>Sheet index or name to read from the input Excel file.</p>
</td></tr>
<tr><td><code id="header_row">header_row</code></td>
<td>
<p>Row of the spreadsheet that holds the column names. The
default <code>NULL</code> finds it automatically (see <code>detect_header_row()</code>),
which copes with sheets that start with rows of plot metadata and with
bilingual column names. Give a number to force it.</p>
</td></tr>
<tr><td><code id="station_name">station_name</code></td>
<td>
<p>Optional station name or station number used to filter
MONITORA data before conversion. For <code>input_type = "monitora"</code>, this
value is matched against station-related columns in the input dataset.</p>
</td></tr>
<tr><td><code id="language">language</code></td>
<td>
<p>Language for output metadata. Default is &quot;en&quot;, options are
&quot;en&quot;, &quot;pt&quot; and &quot;es&quot;.</p>
</td></tr>
<tr><td><code id="herbarium_format">herbarium_format</code></td>
<td>
<p>Format of the herbarium dataset. Default is &quot;jabot&quot;,
additional options is &quot;brahms&quot;, &quot;custom&quot; herbarium format, where column names
must be specified by the user.</p>
</td></tr>
<tr><td><code id="column_map">column_map</code></td>
<td>
<p>Named list used when <code>herbarium_format = "custom"</code>.
It must map the output herbarium fields to the corresponding columns in the
custom herbarium template.</p>
</td></tr>
<tr><td><code id="country">country</code></td>
<td>
<p>Country where the data was collected. Default is &quot;Brazil&quot;.</p>
</td></tr>
<tr><td><code id="majorarea">majorarea</code></td>
<td>
<p>State where the data was collected.</p>
</td></tr>
<tr><td><code id="minorarea">minorarea</code></td>
<td>
<p>Municipality where the data was collected.</p>
</td></tr>
<tr><td><code id="protectedarea">protectedarea</code></td>
<td>
<p>Name of the protected area (if applicable). For
<code>input_type = "monitora"</code>, if <code>NULL</code>, the function attempts to
recover this value from the corresponding protected-area / plot-name columns
in the input dataset.</p>
</td></tr>
<tr><td><code id="locnotes">locnotes</code></td>
<td>
<p>Notes of the locality where the data was collected.</p>
</td></tr>
<tr><td><code id="project">project</code></td>
<td>
<p>Project name or description (if applicable). For
<code>input_type = "monitora"</code>, if <code>NULL</code>, the function attempts to
recover this value from the corresponding station / plot-code columns in the
input dataset.</p>
</td></tr>
<tr><td><code id="collector">collector</code></td>
<td>
<p>Main collector name. If <code>NULL</code>, the function attempts
to extract this information from the input dataset metadata. For
<code>input_type = "monitora"</code>, this information is inferred preferentially
from voucher-collector columns, and falls back to team-related columns when
needed.</p>
</td></tr>
<tr><td><code id="addcoll">addcoll</code></td>
<td>
<p>Character. Additional collector(s) name(s). If <code>NULL</code>,
the function attempts to extract this information from the input dataset
metadata. For <code>input_type = "monitora"</code>, this information is inferred
from team-related columns when available.</p>
</td></tr>
<tr><td><code id="lat">lat</code></td>
<td>
<p>Latitude in decimal degrees of the collection site.</p>
</td></tr>
<tr><td><code id="long">long</code></td>
<td>
<p>Longitude in decimal degrees of the collection site.</p>
</td></tr>
<tr><td><code id="alt">alt</code></td>
<td>
<p>Altitude in meters of the collection site. If <code>NULL</code>,
extract the altitude from geographic coordinates dataset. This requires
internet access and the suggested packages <span class="pkg">geodata</span> and <span class="pkg">terra</span>;
without them, or with <code>options(forplotR.offline = TRUE)</code>, <code>alt</code>
is left as <code>NA</code> with a warning.</p>
</td></tr>
<tr><td><code id="add_census_notes">add_census_notes</code></td>
<td>
<p>If <code>TRUE</code>, census notes will be included in the
herbarium sheet's notes. If <code>FALSE</code>, census notes will be omitted.</p>
</td></tr>
<tr><td><code id="validate_locality">validate_locality</code></td>
<td>
<p>If <code>TRUE</code> (default), validates whether the
coordinates fall within the provided administrative division (country/majorarea).
Needs internet access and the suggested packages <span class="pkg">geodata</span> and
<span class="pkg">terra</span>; without them, or with <code>options(forplotR.offline = TRUE)</code>,
the validation is skipped with a warning.</p>
</td></tr>
<tr><td><code id="dir">dir</code></td>
<td>
<p>Output directory. The file is saved within a subfolder named
after the current date. The default writes to a session temporary directory
(<code>tempdir()</code>), which is deleted when the R session ends; supply a path
to keep the output.</p>
</td></tr>
<tr><td><code id="filename">filename</code></td>
<td>
<p>Name of the output file. Default is <strong>plot_to_herb_sheet</strong>.</p>
</td></tr>
</table>


<h4>Value</h4>

<p>A data frame in herbarium format with the processed data from the
input dataset.
</p>


<h4>Author(s)</h4>

<p>Giulia Ottino &amp; Domingos Cardoso
</p>


<h4>Examples</h4>

<pre><code class='language-R'># Write the bundled RUS01 field sheet to a temporary Excel file
fp &lt;- file.path(tempdir(), "RUS01.xlsx")
openxlsx::write.xlsx(RUS01, fp)

# An empty JABOT herbarium template (column names only)
jabot_cols &lt;- c("family", "genus", "sp1", "number", "collector", "addcoll",
                "colldd", "collmm", "collyy", "country", "majorarea",
                "minorarea", "uc", "projeto", "locnotes", "latitude",
                "longitude", "altprof", "notes")
template &lt;- as.data.frame(matrix(character(0), ncol = length(jabot_cols),
                                 dimnames = list(NULL, jabot_cols)))
herb &lt;- file.path(tempdir(), "jabot_template.xlsx")
openxlsx::write.xlsx(template, herb)

# Supplying 'alt' and validate_locality = FALSE keeps the example offline
labels &lt;- forplot_sheets(
  fp_file_path = fp,
  herb_file_path = herb,
  input_type = "forestplots",
  majorarea = "ES",
  minorarea = "Santa Teresa",
  protectedarea = "REBIO Augusto Ruschi",
  collector = "G. C. Ottino",
  lat = -19.9,
  long = -40.55,
  alt = 800,
  validate_locality = FALSE,
  dir = tempdir()
)
head(labels[, c("family", "genus", "sp1", "number")])


# Without 'alt', elevation is extracted from WorldClim (internet required)
forplot_sheets(
  fp_file_path = fp,
  herb_file_path = herb,
  majorarea = "ES",
  minorarea = "Santa Teresa",
  lat = -19.9,
  long = -40.55,
  dir = tempdir()
)


</code></pre>
</div>
```

## [Conferir determinações]{data-lang=pt}[Check determinations]{data-lang=en} {#grupo-determinations}

### `forplot_crossdet()` {#forplot_crossdet}

<p class="rd-title">Cross-check inventory determinations against one selected JABOT herbarium</p>

[Aplicação: Conferir determinações]{data-lang=pt}[Application: Check determinations]{data-lang=en} · [→]({{LINK:determinations}})

```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Cross-checks voucher determinations from an inventory spreadsheet against
specimen records from one selected herbarium available in JABOT Darwin Core
Archive files.
</p>
<p>The function is intended for inventory workflows already supported in the
package, namely ForestPlots-style spreadsheets and MONITORA spreadsheets.
These input files are first converted to a common internal schema using the
package helper functions, and then matched to herbarium records using a
normalized collector-name + collector-number identity key.
</p>
<p>Matching is restricted to the herbarium informed in <code>herbaria</code>.
Therefore, unlike broader duplicate-based determination comparison routines,
this function focuses on checking whether an inventory voucher is already
present in one selected herbarium and, if so, whether the determination in
the inventory agrees with the determination currently available in JABOT for
that herbarium.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>forplot_crossdet(
  fp_file_path,
  input_type = c("field_sheet", "fp_query_sheet", "monitora"),
  herbaria,
  collector_fallback = NULL,
  collector_codes = NULL,
  station_name = NULL,
  sheet = NULL,
  path = NULL,
  only_collected = TRUE,
  save = FALSE,
  dir = file.path(tempdir(), "crossdet_plot"),
  filename = "crossdet_plot",
  dbdir = NULL,
  force_refresh = FALSE,
  verbose = FALSE,
  resource_map = NULL
)
</code></pre>


<h4>Arguments</h4>

<table>
<tr><td><code id="fp_file_path">fp_file_path</code></td>
<td>
<p>Character scalar. Path to the inventory Excel file.</p>
</td></tr>
<tr><td><code id="input_type">input_type</code></td>
<td>
<p>Character scalar. One of <code>"field_sheet"</code>,
<code>"fp_query_sheet"</code>, or <code>"monitora"</code>.</p>
</td></tr>
<tr><td><code id="herbaria">herbaria</code></td>
<td>
<p>Character scalar. One herbarium code to be checked in JABOT,
for example <code>"RB"</code>.</p>
</td></tr>
<tr><td><code id="collector_fallback">collector_fallback</code></td>
<td>
<p>Optional character scalar. Collector name used when
voucher strings contain only the collection number.</p>
</td></tr>
<tr><td><code id="collector_codes">collector_codes</code></td>
<td>
<p>Optional named character vector mapping compact
collector prefixes to full collector names. This is passed to
<code>.parse_census_identity()</code> and is useful when vouchers use compact
forms such as <code>"DC1234"</code>.</p>
</td></tr>
<tr><td><code id="station_name">station_name</code></td>
<td>
<p>Optional station filter passed to the MONITORA helper.
Ignored for non-MONITORA inputs.</p>
</td></tr>
<tr><td><code id="sheet">sheet</code></td>
<td>
<p>Optional worksheet selector passed to the spreadsheet reader
helper.</p>
</td></tr>
<tr><td><code id="path">path</code></td>
<td>
<p>Optional character scalar. Directory containing local JABOT
DwC-A folders with <code>occurrence.txt</code> files. If <code>NULL</code>, the
function uses the package cache directory and can automatically download
the required archive when needed.</p>
</td></tr>
<tr><td><code id="only_collected">only_collected</code></td>
<td>
<p>Logical. If <code>TRUE</code>, restricts the inventory side
to rows marked as collected and/or with non-empty voucher values.</p>
</td></tr>
<tr><td><code id="save">save</code></td>
<td>
<p>Logical. If <code>TRUE</code>, saves an Excel workbook with the result
sheets. Default <code>FALSE</code>: results are only returned.</p>
</td></tr>
<tr><td><code id="dir">dir</code></td>
<td>
<p>Character scalar. Output directory used when <code>save = TRUE</code>.
The default is a session temporary directory (<code>tempdir()</code>), which is
deleted when the R session ends; supply a path to keep the workbook.</p>
</td></tr>
<tr><td><code id="filename">filename</code></td>
<td>
<p>Character scalar. Output file name without extension.</p>
</td></tr>
<tr><td><code id="dbdir">dbdir</code></td>
<td>
<p>Character scalar or <code>NULL</code>. DuckDB file path. Use
<code>NULL</code> for an in-memory database. When <code>NULL</code>, the function may
also use the package cache DuckDB path if available.</p>
</td></tr>
<tr><td><code id="force_refresh">force_refresh</code></td>
<td>
<p>Logical. If <code>TRUE</code>, forces a fresh download of the
JABOT DwC-A archive instead of reusing cached files.</p>
</td></tr>
<tr><td><code id="verbose">verbose</code></td>
<td>
<p>Logical. If <code>TRUE</code>, prints progress messages during
archive discovery, download, loading, and matching.</p>
</td></tr>
<tr><td><code id="resource_map">resource_map</code></td>
<td>
<p>Optional named character vector overriding automatic IPT
resource discovery. Names should follow the pattern
<code>"HERBARIUM::source"</code>, for example <code>"RB::jabot"</code>.</p>
</td></tr>
</table>


<h4>Details</h4>

<p>The matching workflow is:
</p>

<ol>
<li><p> Read and standardize the inventory spreadsheet into the package's
common field-sheet-like structure.
</p>
</li>
<li><p> Extract and normalize voucher identity from the inventory using the
existing package helper <code>.parse_census_identity()</code>.
</p>
</li>
<li><p> Resolve local <code>occurrence.txt</code> files under <code>path</code>, or,
if needed, automatically discover and download the corresponding JABOT
DwC-A resource for the selected herbarium into a cache directory.
</p>
</li>
<li><p> Load the selected herbarium records into DuckDB.
</p>
</li>
<li><p> Build normalized collector-number keys for herbarium records.
</p>
</li>
<li><p> Match inventory vouchers to herbarium records by primary or fallback
identity keys.
</p>
</li>
<li><p> Normalize taxon names on both sides before comparison.
</p>
</li>
<li><p> Classify each match into a diagnostic category.
</p>
</li></ol>

<p>The function requires the suggested packages <span class="pkg">DBI</span> and <span class="pkg">duckdb</span>.
With <code>options(forplotR.offline = TRUE)</code> it never downloads data: it
works only with <code>occurrence.txt</code> files already available under
<code>path</code> or in the local cache.
</p>
<p>Determination comparison uses simplified canonical taxon strings. On both
inventory and herbarium sides, authorship is ignored for routine comparison.
Family-only records are treated as <code>"Indet indet"</code>. Genus-only records,
or records such as <code>"Inga"</code> and <code>"Inga indet"</code>, are normalized to
<code>"Inga indet"</code>. Cases with qualifiers such as <code>cf.</code>,
<code>aff.</code>, <code>subsp.</code>, <code>ssp.</code>, and <code>var.</code> are preserved in
the normalized comparison string when possible.
</p>
<p>On the herbarium side, canonical names are built preferentially from
structured Darwin Core fields (<code>genus</code>, <code>specificEpithet</code>,
<code>infraspecificEpithet</code>), with fallback to the best available scientific
name field. Family names are never reused as genus names during
normalization.
</p>
<p>The main diagnostic categories are:
</p>

<ul>
<li> <p><code>inventory_indet_herbarium_det</code>: the inventory is indeterminate
but the herbarium has a usable determination;
</p>
</li>
<li> <p><code>inventory_det_herbarium_indet</code>: the inventory is determined but
the herbarium record is indeterminate or lacks a usable determination;
</p>
</li>
<li> <p><code>same_determination</code>: inventory and herbarium agree after
normalization;
</p>
</li>
<li> <p><code>different_determination</code>: inventory and herbarium disagree
after normalization.
</p>
</li></ul>

<p>Records classified as <code>same_determination</code> are counted in the
diagnostics table but are omitted from the <code>matches</code> output sheet.
</p>
<p>This function works offline after download. If local DwC-A files are not
available, the function can automatically download the required JABOT archive
for the selected herbarium and then proceed locally.
</p>


<h4>Value</h4>

<p>A list with three elements:
</p>

<dl>
<dt>matches</dt><dd><p>A data frame with one row per matched inventory-herbarium
record that remains diagnostically relevant after normalization. Records
classified as <code>same_determination</code> are omitted from this table.</p>
</dd>
<dt>diagnostics</dt><dd><p>A summary table with counts and human-readable
interpretations of the diagnostic classes.</p>
</dd>
<dt>unmatched_inventory</dt><dd><p>Inventory rows with a usable voucher identity
that were not found in the selected herbarium.</p>
</dd>
</dl>



<h4>Author(s)</h4>

<p>Giulia Ottino &amp; Domingos Cardoso
</p>


<h4>Examples</h4>

<pre><code class='language-R'>## Not run: 
# Downloads the JABOT Darwin Core Archive of the selected herbarium
# (internet required; tens of MB on the first call, cached afterwards).
fp &lt;- file.path(tempdir(), "RUS01.xlsx")
openxlsx::write.xlsx(RUS01, fp)

out1 &lt;- forplot_crossdet(
  fp_file_path = fp,
  input_type = "field_sheet",
  herbaria = "RB",
  collector_fallback = "G. Ottino"
)

fm &lt;- file.path(tempdir(), "TUM.xlsx")
openxlsx::write.xlsx(TUM, fm)

out2 &lt;- forplot_crossdet(
  fp_file_path = fm,
  input_type = "monitora",
  herbaria = "RB",
  station_name = "EA-1",
  collector_fallback = "H. Medeiros",
  save = TRUE,
  dir = tempdir()
)

## End(Not run)


</code></pre>
</div>
```

## [Ler a planilha]{data-lang=pt}[Read the spreadsheet]{data-lang=en} {#grupo-formats}

### `detect_header_row()` {#detect_header_row}

<p class="rd-title">Detect the header row of a plot spreadsheet</p>

[Aplicação: Ler a planilha]{data-lang=pt}[Application: Read the spreadsheet]{data-lang=en} · [→]({{LINK:formats}})

```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Finds the row that holds the column names of a field sheet. Some templates,
such as the Indigenous Land (Panará) field sheet, start with one or more rows
of plot metadata (<code>"Plotcode | Kypa kukâri: ABC01"</code>) before the header.
The first <code>max_scan</code> rows are read as text and each one is scored by the
number of cells that match a column name known to the package (tag, stem
grouping, subplot, X, Y, family, species, diameter, POM, flag, height,
voucher, CAP and so on). Matching ignores case and accents, and accepts either
side of a bilingual label written as <code>"Name | Translation"</code>. Cells that
look like metadata (<code>"Label: value"</code>) count against the row.
</p>
<p>The row with the highest score wins, provided it has at least three known
column names; ties go to the first row. When no row qualifies, row 1 is
returned with a warning.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>detect_header_row(path, sheet = 1, max_scan = 20)
</code></pre>


<h4>Arguments</h4>

<table>
<tr><td><code id="path">path</code></td>
<td>
<p>Path to an Excel file (<code>.xlsx</code> or <code>.xls</code>).</p>
</td></tr>
<tr><td><code id="sheet">sheet</code></td>
<td>
<p>Worksheet name or index.</p>
</td></tr>
<tr><td><code id="max_scan">max_scan</code></td>
<td>
<p>Number of rows, from the top of the sheet, to examine.</p>
</td></tr>
</table>


<h4>Value</h4>

<p>A single integer: the row number of the header, counted from the
first row of the worksheet.
</p>


<h4>See Also</h4>

<p><code>read_plot_metadata()</code>, <code>read_plot_sheet()</code>
</p>


<h4>Examples</h4>

<pre><code class='language-R'># Blank template of the Panará field sheet: metadata labels on row 1,
# bilingual header on row 2
f &lt;- system.file("extdata", "panara_field_sheet_template.xlsx",
                 package = "forplotR")
detect_header_row(f)

</code></pre>
</div>
```

### `read_plot_metadata()` {#read_plot_metadata}

<p class="rd-title">Read the plot metadata written above the header of a field sheet</p>

[Aplicação: Ler a planilha]{data-lang=pt}[Application: Read the spreadsheet]{data-lang=en} · [→]({{LINK:formats}})

```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Reads every row above the header row and turns the cells written as
<code>"Label: value"</code> or <code>"Label | Translation: value"</code> into a list
with standard names. Labels are accepted in English, Portuguese or Panará
(for example <code>"Plotcode"</code>, <code>"Código da parcela"</code> or
<code>"Kypa kukâri"</code>); matching ignores case and accents.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>read_plot_metadata(path, sheet = 1, header_row = NULL)
</code></pre>


<h4>Arguments</h4>

<table>
<tr><td><code id="path">path</code></td>
<td>
<p>Path to an Excel file (<code>.xlsx</code> or <code>.xls</code>).</p>
</td></tr>
<tr><td><code id="sheet">sheet</code></td>
<td>
<p>Worksheet name or index.</p>
</td></tr>
<tr><td><code id="header_row">header_row</code></td>
<td>
<p>Row that holds the column names. The default <code>NULL</code>
finds it with <code>detect_header_row()</code>.</p>
</td></tr>
</table>


<h4>Value</h4>

<p>A list with:
</p>

<dl>
<dt>plot_code</dt><dd><p>Plot code, or <code>NA</code>.</p>
</dd>
<dt>plot_name</dt><dd><p>Plot name, or <code>NA</code>.</p>
</dd>
<dt>date</dt><dd><p>Census date as a <code>Date</code> (day/month/year is tried first),
or <code>NA</code>.</p>
</dd>
<dt>team</dt><dd><p>Character vector with one element per person; names separated
by commas, semicolons or <code>&amp;</code> are split.</p>
</dd>
<dt>census_no</dt><dd><p>Census number, or <code>NA</code>.</p>
</dd>
<dt>other</dt><dd><p>Named character vector with any other <code>"Label: value"</code>
cell found.</p>
</dd>
<dt>header_row</dt><dd><p>The header row that was used.</p>
</dd>
</dl>



<h4>See Also</h4>

<p><code>detect_header_row()</code>, <code>read_plot_sheet()</code>
</p>


<h4>Examples</h4>

<pre><code class='language-R'># A sheet with one metadata row above the header
f &lt;- tempfile(fileext = ".xlsx")
openxlsx::write.xlsx(
  data.frame(
    a = c("Plotcode | Kypa kukâri: ABC01", "New Tag No", "1"),
    b = c("Date | Haka: 26/11/2014", "T1", "1"),
    c = c("Team | Sâpêrãtê: Ana Souza, Bia Lima &amp; Caio Reis", "X", "2.5"),
    d = c(NA, "Y", "3")
  ),
  f, colNames = FALSE
)
meta &lt;- read_plot_metadata(f)
meta$plot_code
meta$date
meta$team
meta$header_row

</code></pre>
</div>
```

### `read_plot_sheet()` {#read_plot_sheet}

<p class="rd-title">Read a field sheet from its real header row</p>

[Aplicação: Ler a planilha]{data-lang=pt}[Application: Read the spreadsheet]{data-lang=en} · [→]({{LINK:formats}})

```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Reads a plot spreadsheet whose header may not be on the first row and whose
column names may be bilingual (<code>"Name | Translation"</code>). The header row
is found with <code>detect_header_row()</code>, the rows above it are read as plot
metadata with <code>read_plot_metadata()</code>, and the columns are renamed to the
names used throughout the package (<code>"New Tag No"</code>, <code>"T1"</code>,
<code>"X"</code>, <code>"Y"</code>, <code>"Family"</code>, <code>"Original determination"</code>,
<code>"D"</code>, <code>"POM"</code>, <code>"Flag1"</code>, <code>"Voucher"</code> and so on).
Columns that are not recognised keep the first side of their label.
</p>
<p>When two columns end up with the same name (for example <code>"D | Wy"</code> and
a helper column <code>"D"</code>), the first one in the sheet keeps the name and
the others get a numeric suffix (<code>"D_2"</code>); a message says so. Cells
holding formulas are read by their stored value.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>read_plot_sheet(path, sheet = 1, header_row = NULL, verbose = TRUE)
</code></pre>


<h4>Arguments</h4>

<table>
<tr><td><code id="path">path</code></td>
<td>
<p>Path to an Excel file (<code>.xlsx</code> or <code>.xls</code>).</p>
</td></tr>
<tr><td><code id="sheet">sheet</code></td>
<td>
<p>Worksheet name or index.</p>
</td></tr>
<tr><td><code id="header_row">header_row</code></td>
<td>
<p>Row that holds the column names. The default <code>NULL</code>
finds it automatically; give a number to force it.</p>
</td></tr>
<tr><td><code id="verbose">verbose</code></td>
<td>
<p>Logical. If <code>TRUE</code>, reports the header row, the metadata
that were read and any column that had to be renamed.</p>
</td></tr>
</table>


<h4>Value</h4>

<p>A data frame with one row per record (empty rows are dropped) and
three attributes:
</p>

<dl>
<dt>header_row</dt><dd><p>The header row that was used.</p>
</dd>
<dt>metadata</dt><dd><p>The list returned by <code>read_plot_metadata()</code>.</p>
</dd>
<dt>columns</dt><dd><p>A data frame describing each column: its position in the
sheet, the header as written, the name it received, the canonical
column it was recognised as (<code>NA</code> when not recognised) and, for a
repeated name, the column it duplicates.</p>
</dd>
</dl>



<h4>See Also</h4>

<p><code>detect_header_row()</code>, <code>read_plot_metadata()</code>
</p>


<h4>Examples</h4>

<pre><code class='language-R'># The blank Panará template has no trees yet, but shows how each
# bilingual header is named after reading
f &lt;- system.file("extdata", "panara_field_sheet_template.xlsx",
                 package = "forplotR")
tpl &lt;- read_plot_sheet(f)
attr(tpl, "header_row")
attr(tpl, "columns")[, c("position", "header", "column")]

</code></pre>
</div>
```

## [Dados de exemplo]{data-lang=pt}[Example data]{data-lang=en} {#grupo-start}

### `RUS01` {#RUS01}

<p class="rd-title">ForestPlots.net field sheet of plot RUS01 (REBIO Augusto Ruschi, Brazil)</p>



```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Census data of the 1-ha permanent plot RUS01 in the Reserva Biologica
Augusto Ruschi (Santa Teresa, Espirito Santo, Brazil; Atlantic Forest),
stored exactly as a ForestPlots.net standard field sheet: the first row of
the sheet holds plot metadata and the second row holds the column headers.
Write it to an Excel file with <code>openxlsx::write.xlsx()</code> to use it as
<code>fp_file_path</code> with <code>input_type = "field_sheet"</code> in every
<code>forplot_*()</code> function.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>data(RUS01)
</code></pre>


<h4>Format</h4>

<p>A data frame with 938 rows and 29 character columns. Column names
carry the plot metadata (<code>"Plotcode: RUS01"</code>,
<code>"Plot Name: REBIO Augusto Ruschi"</code>, <code>"Date: 26/11/2014"</code>,
<code>"Team: ..."</code>); the first row holds the field-sheet headers and the
remaining 937 rows are trees with DBH &gt;= 10 cm, distributed in 100
subplots of 10 x 10 m. Main fields:
</p>

<ul>
<li> <p><strong>New Tag No</strong>: Tree tag number.
</p>
</li>
<li> <p><strong>New Stem Grouping</strong>: Stem group identifier for multi-stemmed trees.
</p>
</li>
<li> <p><strong>T1</strong>: Subplot number (1&ndash;100).
</p>
</li>
<li> <p><strong>X, Y</strong>: Local coordinates within the subplot (m).
</p>
</li>
<li> <p><strong>Family, Original determination, Morphospecies</strong>: Taxonomic identification.
</p>
</li>
<li> <p><strong>D</strong>: Diameter at the point of measurement (mm).
</p>
</li>
<li> <p><strong>POM</strong>: Height of the point of measurement (mm).
</p>
</li>
<li> <p><strong>Flag1&ndash;Flag3, LI, CI</strong>: ForestPlots.net condition and light codes.
</p>
</li>
<li> <p><strong>Voucher, Silica, Collected</strong>: Voucher number and collection status.
</p>
</li>
<li> <p><strong>Census Notes</strong>: Free-text field notes.
</p>
</li></ul>



<h4>Source</h4>

<p>Field census by G. C. Ottino, D. Cardoso and collaborators
(November 2014).
</p>


<h4>Examples</h4>

<pre><code class='language-R'>dim(RUS01)
# Field-sheet headers are stored in the first row
unlist(RUS01[1, 1:8])

# Use it as an input file
fp &lt;- file.path(tempdir(), "RUS01.xlsx")
openxlsx::write.xlsx(RUS01, fp)

</code></pre>
</div>
```

### `TUM` {#TUM}

<p class="rd-title">MONITORA forest monitoring data from Parque Nacional Montanhas do Tumucumaque</p>



```{=html}
<div class="rd" lang="en">


<h4>Description</h4>

<p>Tree census data from three sampling stations (<code>"EA-1"</code>,
<code>"EA-2"</code>, <code>"EA-3"</code>) of the MONITORA biodiversity monitoring
program (ICMBio) in the Parque Nacional Montanhas do Tumucumaque (Amapa,
Brazil; Amazonia), in the original MONITORA spreadsheet layout. Write it to
an Excel file with <code>openxlsx::write.xlsx()</code> to use it as
<code>fp_file_path</code> with <code>input_type = "monitora"</code>.
</p>


<h4>Usage</h4>

<pre><code class='language-R'>data(TUM)
</code></pre>


<h4>Format</h4>

<p>A data frame with 1675 rows and 47 columns. Main fields:
</p>

<ul>
<li> <p><strong>CDUC, NOMEUC, bioma</strong>: Protected-area code, name and biome.
</p>
</li>
<li> <p><strong>N_estacao, Nome_estacao</strong>: Station number and name.
</p>
</li>
<li> <p><strong>N_UA</strong>: Sampling unit number.
</p>
</li>
<li> <p><strong>Data, Ano</strong>: Census date (Excel serial number) and year (2014&ndash;2021).
</p>
</li>
<li> <p><strong>nome_coletores</strong>: Field team.
</p>
</li>
<li> <p><strong>Subunidades, N_parcela</strong>: Subunit (Norte, Sul, Leste, Oeste) and
subplot number.
</p>
</li>
<li> <p><strong>N_arvore</strong>: Tree tag number.
</p>
</li>
<li> <p><strong>CAP_1&ndash;CAP_8, cap_tot</strong>: Circumference at breast height of each stem
and total (cm).
</p>
</li>
<li> <p><strong>altura</strong>: Tree height (m).
</p>
</li>
<li> <p><strong>arvore_morta</strong>: Whether the tree is dead.
</p>
</li>
<li> <p><strong>Familia, Genero, Especie</strong>: Taxonomic identification (column names
carry Portuguese accents in the data).
</p>
</li>
<li> <p><strong>individuo.coletado</strong>: Whether a voucher was collected.
</p>
</li>
<li> <p><strong>voucher/Coletor, voucher/numero, N.tombo</strong>: Voucher collector,
collector number and herbarium accession number.
</p>
</li>
<li> <p><strong>X, Y</strong>: Local coordinates within the subplot (m).
</p>
</li></ul>



<h4>Source</h4>

<p>MONITORA program, Instituto Chico Mendes de Conservacao da
Biodiversidade (ICMBio).
</p>


<h4>Examples</h4>

<pre><code class='language-R'>dim(TUM)
table(TUM$Nome_estacao)

</code></pre>
</div>
```

