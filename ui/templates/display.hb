<!DOCTYPE html>

<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <!-- Stylesheets -->
  <link href="styles/bootstrap.min.css" rel="stylesheet" />
  <link href="styles/jquery.dataTables.min.css" rel="stylesheet" />
  <link href="styles/phosphor/index.css" rel="stylesheet" />
  <!-- Scripts -->
  <script type="text/javascript" src="scripts/two.min.js"></script>
  <script type="text/javascript" src="scripts/jquery.dataTables.min.js"></script>
  <script type="text/javascript" src="scripts/mqttws31.min.js"></script>
  <script type="text/javascript" src="scripts/js-signals.min.js"></script>
  <script type="text/javascript" src="scripts/crossroads.min.js"></script>
  <script type="text/javascript" src="libDeviceUIPlugin.js"></script>
  <script type="text/javascript" src="main.js"></script>
  <script type="text/javascript" src="mqtt-client.js"></script>
  <!-- Plugins -->
  {{#each pluginPaths}}
  <script type="text/javascript" src="{{src}}"></script>
  {{/each}}
</head>

<body>
</body>
</html>
