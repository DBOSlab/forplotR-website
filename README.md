
<!-- README.md is generated from README.Rmd. Please edit that file -->

# forplotR <img src="inst/figures/forplotR_hex_sticker.png" align="right" alt="" width="120" />

<!-- badges: start -->

[![Codecov test
coverage](https://codecov.io/gh/DBOSlab/forplotR/graph/badge.svg)](https://app.codecov.io/gh/DBOSlab/forplotR)
[![Test
Coverage](https://github.com/DBOSlab/forplotR/actions/workflows/test-coverage.yaml/badge.svg)](https://github.com/DBOSlab/forplotR/actions/workflows/test-coverage.yaml)
[![CRAN
Downloads](https://cranlogs.r-pkg.org/badges/grand-total/forplotR)](https://cran.r-project.org/package=forplotR)
[![R-CMD-check](https://github.com/DBOSlab/forplotR/actions/workflows/R-CMD-check.yaml/badge.svg)](https://github.com/DBOSlab/forplotR/actions/workflows/R-CMD-check.yaml)
[![License:
MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
<!-- badges: end -->

`forplotR` is an R package for processing forest plot data, generating
herbarium-ready spreadsheets, organizing voucher folders, creating
spatial overviews of plot individuals, and visualizing plot maps
interactively.

## Installation

You can install the development version of `forplotR` from
[GitHub](https://github.com/DBOSlab/forplotR) with:

``` r
# install.packages("devtools")
devtools::install_github("DBOSlab/forplotR")
```

``` r
library(forplotR)
```

  

## Usage

Below are the description of the four main functions
(`fp_herb_converter`, `mk_voucher_dirs`, `plot_for_balance` and
`plot_html_map`) available in the package and how to use them.  

#### *1. `fp_herb_converter`*

This code is purposed to convert forest plot census data into a
herbarium spreadsheet format. The function reads a ForestPlots-format
field dataset and an empty herbarium template, and outputs a filled
herbarium data frame (and Excel file) with taxonomy, location, and
collector information. It ensures required metadata (location,
coordinates, etc.) are provided and adds any relevant notes (e.g.,
diameter, census notes) to the herbarium sheet. The default herbarium
format is JABOT, with support for BRAHMS or a custom format
(user-specified column mapping).

``` r
library(forplotR)

herbarium_df <- fp_herb_converter(
                       forestplots_file_path = NULL,
                       herb_file_path = NULL,
                       language = "en",
                       herbarium_format = "jabot",
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
                       dir = "Results_rainfor_herb",
                       filename = "rainfor_to_herb"
                 )
```

  
By specifying the `language` argument as “en”, “pt”, or “es”, the
function automatically translates Rainfor field codes (e.g., “A” for
tree condition, “5” for canopy exposure) into their full descriptive
meanings and embeds them in standardized herbarium notes.

These notes integrate both automatic code translations and manual field
observations. For example:

``` text
Tree, 24.83cm DBH, with peeling bark, small buttress roots, bark with tiny reddish plates, crown completely exposed to vertical and lateral light in a 45 degree curve. Individual #3 in the subplot 1, x = 1.5m, y = 2.5m.
```

In this output: - *“with peeling bark”* and *“crown completely
exposed…”* are automatically derived from Rainfor codes; - *“small
buttress roots”* and *“bark with tiny reddish plates”* are taken from
the field notes manually entered in the ForestPlots spreadsheet.

This process ensures clear, standardized and multilingual descriptions
for herbarium records, supporting integration across botanical
databases.

------------------------------------------------------------------------

#### *2. `mk_voucher_dirs`*

This function creates a folder structure for organizing voucher images
or files. It is especially useful for large projects where images of
herbarium specimens or field vouchers need to be grouped by collector,
number, or taxonomic name.

``` r
mk_voucher_dirs(input_df = my_dataframe,
                base_dir = "herbarium_vouchers",)
```

  

Each row in the input data frame generates a subdirectory like
`herbarium_vouchers/Family_name/Genus_name/Voucher_name`, making file
organization more efficient.

------------------------------------------------------------------------

#### *3. `plot_for_balance`*

This function plots the balance of taxonomic representation in the
herbarium dataset using bar plots. It helps assess the sampling effort
by family, genus, or species.

``` r
plot_for_balance(
     fp_file_path = "data/forestplot.xlsx",
     plot_size = 1,
     subplot_size = 10,
     highlight_palms = TRUE,
     dir = "Results_map_plot",
     filename = "plot_specimen"
)
```

  
The function generates A full PDF report with plot metadata and
navigable sections including subplot maps; an Excel spreadsheet with the
collection percentages (overall and per subplot) and tag numbers for
collected and not collected individuals.

------------------------------------------------------------------------

#### *4. `plot_html_map`*

This function creates an interactive HTML map using leaflet to visualize
collection localities. It is useful for reporting or exploring the
spatial distribution of vouchers.

``` r
plot_html_map(
     fp_file_path = "data/forestplot.xlsx",        
     vertex_coords = "data/vertex.xlsx",       
     map_type = "street",  
     voucher_imgs = "voucher_imgs",
     dir = "Results_plot_map_",              
     filename = "plot_map"                  
)
```

  
The function generates a standalone HTML file with markers for each
collection point and optional labels, which can be opened in any web
browser.

------------------------------------------------------------------------

## Documentation

Full function documentation and articles are available at the `forplotR`
[website](https://dboslab.github.io/forplotR-website/).  
  

## Citation

Ottino, G.C. & Cardoso, D. 2025. *forplotR*: Streamlined Forest Plot
Data Management and Visualization in R.
<https://github.com/dboslab/forplotR>
