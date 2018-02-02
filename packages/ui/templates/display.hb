<!DOCTYPE html>

<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <!-- Plugin Title -->
  <title>Microdrop</title>

  <!-- Stylesheets -->
  <link href="styles/phosphor/index.css" rel="stylesheet" />
  <!-- Scripts -->
  <script type="text/javascript" src="scripts/phosphor.web.js"></script>
  <!-- Plugins -->
  {{#each pluginPaths}}
  <script type="text/javascript" src="{{this}}"></script>
  {{/each}}
</head>
<body>
</body>
<script type="text/javascript" src="scripts/load-display.js"></script>
</html>
