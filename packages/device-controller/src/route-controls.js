module.exports = exports = {};

const $ = require('jquery');
const _ = require('lodash');
const Backbone = require('backbone');
const THREE = require('three');
const {MeshLine, MeshLineMaterial} = require( 'three.meshline' );

const MicrodropAsync = require('@microdrop/async/MicrodropAsync');

const {FindAllNeighbours} = require('./electrode-controls');

function GenerateLineFromElectrodeIds(id1, id2, group, resolution) {
  const color = new THREE.Color("rgb(99, 246, 255)");
  const lineWidth = 0.2;
  const material = new MeshLineMaterial({color, lineWidth, resolution});

  var geometry = new THREE.Geometry();
  for (const [i, id] of [id1, id2].entries()) {
    const obj = _.filter(group.children, {name: id})[0];
    const point = new THREE.Vector3();
    point.setFromMatrixPosition(obj.matrixWorld);
    point.z = 1;
    geometry.vertices.push(point);
  }

  const line = new MeshLine();
  line.setGeometry(geometry)
  return new THREE.Mesh(line.geometry, material);
}

function GenerateLinesFromIds(ids, group) {
  const LABEL = "<RouteControls::GenerateLinesFromIds>";

  /* Create line from list of electrodeIds */
  const color = new THREE.Color("rgb(99, 246, 255)");
  const lineWidth = 0.2;

  const material = new MeshLineMaterial({color, lineWidth});
  const geometry = new THREE.Geometry();

  const addPoint = (name) => {
    const obj = _.filter(group.children, {name})[0];
    const point = new THREE.Vector3();
    point.setFromMatrixPosition(obj.matrixWorld);
    point.z = 1;
    geometry.vertices.push(point);
  }

  for (const [i, id] of ids.entries()){
    addPoint(id);
  }

  const line = new MeshLine();
  line.setGeometry(geometry)
  return new THREE.Mesh(line.geometry, material);
}

function RouteIsValid(localRoute, electrodeControls) {
  const objects = electrodeControls.electrodeObjects;
  let prev = localRoute.start;
  for (const [i, dir] of localRoute.path.entries()){
    const neighbours = electrodeControls.getNeighbours(prev);
    const id = _.invert(neighbours)[dir];
    if (!id) return false;
    prev = id;
  }
  return true;
}

class RouteControls extends MicrodropAsync.MqttClient {
  constructor(scene, camera, electrodeControls, container=null) {
    super();
    if (!container) container = document.body;

    electrodeControls.on("mousedown", this.drawRoute.bind(this));
    electrodeControls.on("mouseup", (e) => this.trigger("mouseup", e));
    electrodeControls.on("mouseover", (e) => this.trigger("mouseover", e));
    this.electrodeControls = electrodeControls;
    this.lines = [];
    this._scene = scene;
    this._container = container;
    this.model = new Backbone.Model({routes: []});
    this.model.on("change:routes", this.renderRoutes.bind(this));
  }
  listen() {
    this.onStateMsg("routes-model", "routes", this.renderRoutes.bind(this));
    this.bindPutMsg("routes-model", "route", "put-route");
  }
  get routes() {
    return _.cloneDeep(this.model.get("routes"));
  }
  async renderRoutes(routes) {
    const LABEL = "<RouteControls::renderRoutes>";
    console.log(LABEL, {routes});

    const lines = this.lines;

    const microdrop = new MicrodropAsync();
    const group = this.electrodeControls.svgGroup;

    // Reset all lines to not visited
    _.each(lines, (l)=>l.visited = false);

    // Iterate through all routes
    for (const [i, route] of routes.entries()) {

      // If line already exists for route, visit and then continue
      if (lines[route.uuid]) {
        lines[route.uuid].visited = true;
        continue;
      };

      // Otherwise get the electrodeIds from the route, and draw a new line
      const {ids} = await microdrop.device.electrodesFromPath(route);
      const line = GenerateLinesFromIds(ids, group);
      line.visited = true;
      line.uuid = route.uuid;
      lines[route.uuid] = line;
      this._scene.add(line);
    }

    // Remove all lines not visited from scene (as they must have been removed)
    for (const [i, line] of _.filter(lines, {visited: false}).entries()) {
      this.scene.remove(line);
      delete lines[line.uuid];
    }
  }

  addRoute(localRoute) {
    const route = _.cloneDeep(localRoute);
    if (RouteIsValid(localRoute, this.electrodeControls)) {
      const routes = _.clone(this.model.get("routes"));
      routes.push(localRoute);
      this.model.set("routes", routes);
    }
  }
  createLocalRoute(path) {
    const localRoute = new Object();
    localRoute.start = path[0];
    localRoute.path = [];
    for (var i=0;i<path.length;i++){
      if (i == 0) continue;
      const prev = path[i-1];
      const next = path[i];
      const neighbours = FindAllNeighbours(this.electrodeControls.svgGroup, prev);

      if (_.invert(neighbours)[next]) {
        localRoute.path.push(_.invert(neighbours)[next]);
      } else {
        // Path is invalid
        return undefined;
      }
    }
    return localRoute;
  }
  async drawRoute(e) {
    /* Draw a route starting with electrode that triggered this event*/
    const lines = [];
    const path = [];
    const routes = _.clone(this.model.get("routes"));
    const group = this.electrodeControls.svgGroup;
    const scene = this._scene;

    // Add start electrode
    var line = AddToPath(e.target.name, path, group);

    // Add all electrodes that are hovered over
    const mouseover = this.on("mouseover", (e) => {
      var line = AddToPath(e.target.name, path, group, lines);
      if (line) {lines.push(line); scene.add(line);}
    });

    // Add last electrode
    const mouseup = () => {
      return new Promise((resolve, reject) => {
        this.on("mouseup", (e) => {resolve(e);});
      });
    };
    e = await mouseup();
    AddToPath(e.target.name, path, group, lines);

    // Remove events
    this.off("mouseup");
    this.off("mouseover");

    // Remove lines from scene
    for (const [i, line] of lines.entries()){
      this._scene.remove(line);
    }

    const localRoute = this.createLocalRoute(path);

    if (path.length > 1) {
      this.trigger("put-route", localRoute);
      // const microdrop = new MicrodropAsync();

      // const routes = await microdrop.routes.putRoute(localRoute);
    }
  }
}

const AddToPath = (name, path, group) => {
  const prev = _.last(path);
  if (name == prev) return;
  let neighbours = [];
  if (prev != undefined)
    neighbours = FindAllNeighbours(group, prev);
  if (!_.invert(neighbours)[name] && prev != undefined) return;

  if (path.length > 0) {
    const line = GenerateLineFromElectrodeIds(prev, name, group);
    path.push(name);
    return line;
  }
  path.push(name);
  return undefined;
};

module.exports = {
  RouteControls: RouteControls,
  GenerateLineFromElectrodeIds: GenerateLineFromElectrodeIds,
  GenerateLinesFromIds: GenerateLinesFromIds,
  RouteIsValid: RouteIsValid
};