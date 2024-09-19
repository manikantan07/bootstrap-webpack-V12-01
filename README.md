# bootstrap-webpack-V12-01

Bootstrap scss as single file and purged
	
Independent option for minify css if required("cssnano")
	
Option to add bootstrap modules as required option(accordion, tooltip, modal etc) in app.js
OR
es-module implimentation
	
Common js file for all pages which is included in app.js and bundled
	
Each pages have its own js file to reduce load

Run command : "generate-critical-css" for critical css and the copy of the real html files will be renamed as backup_*.html in dist folder

Added Pug for module based integration
