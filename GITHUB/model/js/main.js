import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const canvas = document.querySelector("#product-canvas");
const statusEl = document.querySelector("#status");

const MM = 0.001;
const DIMENSIONS = {
  width: 38.6 * 25.4 * MM,
  depth: 20.9 * 25.4 * MM,
  height: 78.7 * 25.4 * MM
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(1.18, 1.18, 2.62);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setClearColor(0xffffff, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 1.45;
controls.maxDistance = 4.8;
controls.target.set(0, 0, DIMENSIONS.height * 0.48);
controls.update();

const cabinet = new THREE.Group();
cabinet.rotation.x = -Math.PI / 2;
scene.add(cabinet);

function seededNoise(index) {
  const value = Math.sin(index * 91.345 + 17.23) * 10000;
  return value - Math.floor(value);
}

function woodTexture(baseA, baseB, grainScale = 1) {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = 512;
  canvasTexture.height = 512;
  const ctx = canvasTexture.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, baseA);
  gradient.addColorStop(0.45, baseB);
  gradient.addColorStop(1, baseA);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 120; i += 1) {
    const x = seededNoise(i) * 512;
    ctx.strokeStyle = `rgba(83, 42, 14, ${0.035 + seededNoise(i + 100) * 0.09})`;
    ctx.lineWidth = (0.55 + seededNoise(i + 200) * 2.1) * grainScale;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + Math.sin(i) * 22, 150, x - Math.cos(i) * 18, 330, x + Math.sin(i * 0.7) * 24, 512);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.15, 4.4);
  return texture;
}

const goldWood = new THREE.MeshStandardMaterial({
  map: woodTexture("#c89b53", "#efd18a", 0.7),
  color: 0xe3ba72,
  roughness: 0.42,
  metalness: 0.16
});
const cedarWood = new THREE.MeshStandardMaterial({
  map: woodTexture("#b7632d", "#f1b36d", 0.85),
  color: 0xd28a45,
  roughness: 0.5,
  metalness: 0.02
});
const blackSide = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.56, metalness: 0.18 });
const darkSlot = new THREE.MeshStandardMaterial({ color: 0x221207, roughness: 0.75 });
const glass = new THREE.MeshPhysicalMaterial({
  color: 0x5a2d19,
  roughness: 0.08,
  metalness: 0,
  transmission: 0.42,
  thickness: 0.02,
  transparent: true,
  opacity: 0.38
});
const warmLight = new THREE.MeshBasicMaterial({ color: 0xffbd72 });
const blueLight = new THREE.MeshBasicMaterial({ color: 0x176cff });
const cigarLeaf = new THREE.MeshStandardMaterial({ color: 0x5a321c, roughness: 0.82 });
const cigarEnd = new THREE.MeshStandardMaterial({ color: 0xc69058, roughness: 0.9 });
const labelInk = new THREE.MeshBasicMaterial({ color: 0x2c1608 });
const redBand = new THREE.MeshStandardMaterial({ color: 0x7d1a25, roughness: 0.55, metalness: 0.04 });
const blackEmbossed = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.62, metalness: 0.22 });
const blackTrim = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.38, metalness: 0.34 });
const blackSatin = new THREE.MeshStandardMaterial({ color: 0x11100e, roughness: 0.44, metalness: 0.22 });
const warmGlow = new THREE.MeshBasicMaterial({ color: 0xffb36d, transparent: true, opacity: 0.58 });

function box(name, size, position, material, parent = cabinet, radius = 0.002) {
  const minSize = Math.min(size.x, size.y, size.z);
  const geometry = minSize > 0.01
    ? new RoundedBoxGeometry(size.x, size.y, size.z, 3, Math.min(radius, minSize * 0.35))
    : new THREE.BoxGeometry(size.x, size.y, size.z);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function textMaterial(text, options = {}) {
  const {
    width = 256,
    height = 96,
    background = "rgba(0, 0, 0, 0)",
    color = "#111111",
    font = "600 38px Arial",
    align = "center"
  } = options;
  const label = document.createElement("canvas");
  label.width = width;
  label.height = height;
  const ctx = label.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, align === "center" ? width / 2 : 16, height / 2);
  const texture = new THREE.CanvasTexture(label);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true });
}

function frontPlane(name, width, height, position, material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.rotation.x = Math.PI / 2;
  cabinet.add(mesh);
  return mesh;
}

function addEmbossedBackPanel(prefix, xCenter, bayWidth) {
  const panelY = DIMENSIONS.depth / 2 - 0.055;
  const panelZ = 1.055;
  box(`${prefix}_black_embossed_aluminum_back`, {
    x: bayWidth - 0.06,
    y: 0.012,
    z: 1.72
  }, {
    x: xCenter,
    y: panelY,
    z: panelZ
  }, blackEmbossed, cabinet, 0.003);

  for (let col = 0; col < 7; col += 1) {
    const x = xCenter - (bayWidth - 0.1) / 2 + col * ((bayWidth - 0.1) / 6);
    box(`${prefix}_embossed_vertical_rib_${col}`, {
      x: 0.003,
      y: 0.006,
      z: 1.66
    }, {
      x,
      y: panelY - 0.008,
      z: panelZ
    }, new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5, metalness: 0.28 }), cabinet, 0.001);
  }

  for (let row = 0; row < 18; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const x = xCenter - (bayWidth - 0.14) / 2 + col * ((bayWidth - 0.14) / 4);
      const z = 0.28 + row * 0.088;
      box(`${prefix}_small_emboss_tile_${row}_${col}`, {
        x: 0.026,
        y: 0.004,
        z: 0.014
      }, {
        x,
        y: panelY - 0.012,
        z
      }, new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.48, metalness: 0.18 }), cabinet, 0.002);
    }
  }
}

function cylinder(name, radius, length, position, material, rotation = { x: 0, y: 0, z: 0 }, parent = cabinet, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRoundedSlot(name, position, width, material) {
  const slot = box(name, { x: width, y: 0.006, z: 0.008 }, position, material);
  cylinder(`${name}_left_round`, 0.004, 0.007, { x: position.x - width / 2, y: position.y - 0.001, z: position.z }, material, { x: Math.PI / 2, y: 0, z: 0 });
  cylinder(`${name}_right_round`, 0.004, 0.007, { x: position.x + width / 2, y: position.y - 0.001, z: position.z }, material, { x: Math.PI / 2, y: 0, z: 0 });
  return slot;
}

function addRoundHoleGrid(prefix, xStart, y, zCenter, rows = 3, cols = 3) {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cylinder(`${prefix}_round_vent_${row}_${col}`, 0.0037, 0.006, {
        x: xStart + col * 0.018,
        y,
        z: zCenter + row * 0.016
      }, darkSlot, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 14);
    }
  }
}

function addDrawerFrontFromReference(prefix, xCenter, y, z, width) {
  const faceY = y - 0.006;
  const railHeight = 0.072;
  const endCapW = 0.052;

  box(`${prefix}_reference_front_board`, { x: width, y: 0.022, z: railHeight }, {
    x: xCenter,
    y,
    z: z + 0.045
  }, cedarWood, cabinet, 0.004);

  box(`${prefix}_left_high_ear`, { x: endCapW, y: 0.024, z: 0.112 }, {
    x: xCenter - width / 2 + endCapW / 2,
    y,
    z: z + 0.064
  }, cedarWood, cabinet, 0.007);
  box(`${prefix}_right_high_ear`, { x: endCapW, y: 0.024, z: 0.112 }, {
    x: xCenter + width / 2 - endCapW / 2,
    y,
    z: z + 0.064
  }, cedarWood, cabinet, 0.007);
  cylinder(`${prefix}_center_round_hump`, 0.04, 0.024, {
    x: xCenter,
    y,
    z: z + 0.092
  }, cedarWood, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 40);
  box(`${prefix}_hump_lower_mask`, { x: 0.09, y: 0.026, z: 0.04 }, {
    x: xCenter,
    y: y - 0.001,
    z: z + 0.057
  }, cedarWood, cabinet, 0.004);

  const rows = [z + 0.022, z + 0.045, z + 0.068];
  const leftRoundX = xCenter - width / 2 + 0.035;
  const rightRoundX = xCenter + width / 2 - 0.081;
  rows.forEach((rowZ, rowIndex) => {
    for (let col = 0; col < 3; col += 1) {
      cylinder(`${prefix}_left_round_hole_${rowIndex}_${col}`, 0.006, 0.007, {
        x: leftRoundX + col * 0.026,
        y: faceY,
        z: rowZ
      }, darkSlot, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 18);
      cylinder(`${prefix}_right_round_hole_${rowIndex}_${col}`, 0.006, 0.007, {
        x: rightRoundX + col * 0.026,
        y: faceY,
        z: rowZ
      }, darkSlot, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 18);
    }

    addRoundedSlot(`${prefix}_left_long_slot_${rowIndex}`, {
      x: xCenter - width * 0.245,
      y: faceY,
      z: rowZ
    }, 0.08, darkSlot);
    addRoundedSlot(`${prefix}_left_short_slot_${rowIndex}`, {
      x: xCenter - width * 0.085,
      y: faceY,
      z: rowZ
    }, 0.052, darkSlot);
    addRoundedSlot(`${prefix}_right_short_slot_${rowIndex}`, {
      x: xCenter + width * 0.085,
      y: faceY,
      z: rowZ
    }, 0.052, darkSlot);
    addRoundedSlot(`${prefix}_right_long_slot_${rowIndex}`, {
      x: xCenter + width * 0.245,
      y: faceY,
      z: rowZ
    }, 0.08, darkSlot);
  });

  for (const sx of [-1, 1]) {
    cylinder(`${prefix}_small_top_screw_${sx}`, 0.004, 0.006, {
      x: xCenter + sx * (width / 2 - 0.018),
      y: faceY,
      z: z + 0.083
    }, darkSlot, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 14);
  }
}

function addCigarStack(xCenter, shelfZ, count, rows) {
  const spacingX = 0.035;
  const spacingZ = 0.018;
  const rowCounts = Array.from({ length: rows }, (_, row) => Math.max(3, count - Math.abs(row - Math.floor(rows / 2))));
  rowCounts.forEach((rowCount, row) => {
    for (let i = 0; i < rowCount; i += 1) {
      const x = xCenter + (i - (rowCount - 1) / 2) * spacingX;
      const z = shelfZ + 0.034 + row * spacingZ;
      const y = -DIMENSIONS.depth / 2 + 0.14 + (row % 2) * 0.011;
      cylinder("visible_cigar_body", 0.009, 0.105, { x, y, z }, cigarLeaf, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 20);
      cylinder("visible_cigar_end", 0.0093, 0.002, { x, y: y - 0.054, z }, cigarEnd, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 20);
      if ((i + row) % 4 === 0) {
        cylinder("cigar_paper_band", 0.0098, 0.008, { x, y: y - 0.018, z }, redBand, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 20);
      }
    }
  });
}

function addCigarBox(xCenter, shelfZ, labelOffset = 0) {
  box("cedar_cigar_box", { x: 0.205, y: 0.096, z: 0.05 }, { x: xCenter + labelOffset, y: -DIMENSIONS.depth / 2 + 0.17, z: shelfZ + 0.047 }, cedarWood);
  box("box_front_label_plate", { x: 0.15, y: 0.004, z: 0.024 }, { x: xCenter + labelOffset, y: -DIMENSIONS.depth / 2 + 0.12, z: shelfZ + 0.053 }, goldWood);
  frontPlane("box_script_logo", 0.12, 0.026, {
    x: xCenter + labelOffset,
    y: -DIMENSIONS.depth / 2 + 0.117,
    z: shelfZ + 0.054
  }, textMaterial("Reserva", { width: 256, height: 64, color: "#4a1d08", font: "700 30px Georgia" }));
}

function addLoadedDisplayItems(prefix, xCenter, shelfZ, shelfWidth, pattern) {
  if (pattern === "top-full") {
    addCigarStack(xCenter, shelfZ, Math.max(7, Math.floor(shelfWidth / 0.036)), 4);
    return;
  }

  if (pattern === "split-cigars") {
    addCigarStack(xCenter - shelfWidth * 0.18, shelfZ, 5, 3);
    addCigarStack(xCenter + shelfWidth * 0.18, shelfZ, 5, 3);
    return;
  }

  if (pattern === "boxed") {
    addCigarBox(xCenter - shelfWidth * 0.08, shelfZ, 0);
    box(`${prefix}_thin_red_box`, { x: shelfWidth * 0.62, y: 0.095, z: 0.026 }, {
      x: xCenter + shelfWidth * 0.04,
      y: -DIMENSIONS.depth / 2 + 0.19,
      z: shelfZ + 0.02
    }, redBand, cabinet, 0.003);
    frontPlane(`${prefix}_gold_box_logo`, shelfWidth * 0.42, 0.018, {
      x: xCenter + shelfWidth * 0.02,
      y: -DIMENSIONS.depth / 2 + 0.139,
      z: shelfZ + 0.025
    }, textMaterial("CIGARS", { width: 220, height: 60, color: "#f1c97b", font: "700 25px Georgia" }));
    return;
  }

  if (pattern === "wood-case") {
    box(`${prefix}_long_wood_cigar_case`, { x: shelfWidth * 0.48, y: 0.11, z: 0.052 }, {
      x: xCenter,
      y: -DIMENSIONS.depth / 2 + 0.18,
      z: shelfZ + 0.045
    }, cedarWood, cabinet, 0.008);
    frontPlane(`${prefix}_case_script`, shelfWidth * 0.34, 0.024, {
      x: xCenter,
      y: -DIMENSIONS.depth / 2 + 0.122,
      z: shelfZ + 0.047
    }, textMaterial("Limited", { width: 220, height: 60, color: "#3b1708", font: "700 28px Georgia" }));
  }
}

function addBay(prefix, xCenter, bayWidth) {
  const shelfXs = bayWidth - 0.07;
  const shelfDepth = DIMENSIONS.depth - 0.18;
  const firstZ = 0.38;
  const spacing = 0.225;
  addEmbossedBackPanel(prefix, xCenter, bayWidth);

  for (let i = 0; i < 7; i += 1) {
    const z = firstZ + i * spacing;
    box(`${prefix}_solid_wood_drawer_floor_${i + 1}`, { x: shelfXs, y: shelfDepth, z: 0.02 }, { x: xCenter, y: -0.005, z }, cedarWood, cabinet, 0.003);
    box(`${prefix}_left_drawer_side_${i + 1}`, { x: 0.018, y: shelfDepth, z: 0.065 }, { x: xCenter - shelfXs / 2 + 0.01, y: -0.005, z: z + 0.04 }, cedarWood, cabinet, 0.003);
    box(`${prefix}_right_drawer_side_${i + 1}`, { x: 0.018, y: shelfDepth, z: 0.065 }, { x: xCenter + shelfXs / 2 - 0.01, y: -0.005, z: z + 0.04 }, cedarWood, cabinet, 0.003);
    box(`${prefix}_rear_drawer_back_${i + 1}`, { x: shelfXs, y: 0.018, z: 0.055 }, { x: xCenter, y: DIMENSIONS.depth / 2 - 0.095, z: z + 0.038 }, cedarWood, cabinet, 0.003);
    for (let slat = 0; slat < 10; slat += 1) {
      box(`${prefix}_visible_floor_slat_${i + 1}_${slat}`, { x: shelfXs - 0.055, y: 0.008, z: 0.008 }, {
        x: xCenter,
        y: -DIMENSIONS.depth / 2 + 0.16 + slat * 0.03,
        z: z + 0.014
      }, cedarWood, cabinet, 0.001);
    }
    addDrawerFrontFromReference(`${prefix}_drawer_front_${i + 1}`, xCenter, -DIMENSIONS.depth / 2 + 0.072, z, shelfXs - 0.025);

    box(`${prefix}_left_slide_bracket_${i + 1}`, { x: 0.03, y: 0.035, z: 0.075 }, {
      x: xCenter - shelfXs / 2 - 0.005,
      y: -DIMENSIONS.depth / 2 + 0.078,
      z: z + 0.04
    }, cedarWood, cabinet, 0.004);
    box(`${prefix}_right_slide_bracket_${i + 1}`, { x: 0.03, y: 0.035, z: 0.075 }, {
      x: xCenter + shelfXs / 2 + 0.005,
      y: -DIMENSIONS.depth / 2 + 0.078,
      z: z + 0.04
    }, cedarWood, cabinet, 0.004);

    const displayPattern = ["top-full", "top-full", "split-cigars", "split-cigars", "boxed", "wood-case", "empty"][i];
    if (displayPattern !== "empty") {
      addLoadedDisplayItems(`${prefix}_display_${i + 1}`, xCenter, z + 0.02, shelfXs, displayPattern);
    }
  }

  box(`${prefix}_lower_humidifier_block`, { x: shelfXs - 0.035, y: 0.12, z: 0.125 }, { x: xCenter, y: -DIMENSIONS.depth / 2 + 0.145, z: 0.18 }, cedarWood);
  box(`${prefix}_lower_faceplate`, { x: shelfXs - 0.07, y: 0.012, z: 0.085 }, { x: xCenter, y: -DIMENSIONS.depth / 2 + 0.078, z: 0.175 }, cedarWood);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      addRoundedSlot(`${prefix}_lower_module_louver_${row}_${col}`, {
        x: xCenter - (shelfXs - 0.115) / 2 + col * ((shelfXs - 0.115) / 8),
        y: -DIMENSIONS.depth / 2 + 0.066,
        z: 0.225 + row * 0.018
      }, 0.024, darkSlot);
    }
  }
  for (let dx of [-0.07, 0.07]) {
    cylinder(`${prefix}_brass_control_knob`, 0.018, 0.011, { x: xCenter + dx, y: -DIMENSIONS.depth / 2 + 0.067, z: 0.175 }, goldWood, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 32);
  }
  box(`${prefix}_center_water_tank_window`, { x: 0.028, y: 0.006, z: 0.07 }, { x: xCenter, y: -DIMENSIONS.depth / 2 + 0.064, z: 0.17 }, glass);
  frontPlane(`${prefix}_water_level_marks`, 0.05, 0.06, {
    x: xCenter,
    y: -DIMENSIONS.depth / 2 + 0.058,
    z: 0.17
  }, textMaterial("|||", { width: 120, height: 100, color: "#75543d", font: "700 44px Arial" }));
  box(`${prefix}_left_warm_led_strip`, { x: 0.012, y: 0.01, z: 1.58 }, { x: xCenter - bayWidth / 2 + 0.027, y: -DIMENSIONS.depth / 2 + 0.077, z: 1.05 }, warmLight);
  box(`${prefix}_right_warm_led_strip`, { x: 0.012, y: 0.01, z: 1.58 }, { x: xCenter + bayWidth / 2 - 0.027, y: -DIMENSIONS.depth / 2 + 0.077, z: 1.05 }, warmLight);
}

function addDisplay(xCenter) {
  const panelY = -DIMENSIONS.depth / 2 - 0.019;
  box("black_temperature_display_panel", { x: 0.205, y: 0.014, z: 0.052 }, { x: xCenter, y: panelY, z: 1.835 }, blackSide, cabinet, 0.004);
  box("blue_backlit_screen_glow", { x: 0.082, y: 0.004, z: 0.024 }, { x: xCenter + 0.025, y: panelY - 0.008, z: 1.838 }, blueLight, cabinet, 0.002);
  frontPlane("blue_temperature_digits", 0.082, 0.024, {
    x: xCenter + 0.025,
    y: panelY - 0.011,
    z: 1.838
  }, textMaterial("16 62", { width: 240, height: 72, color: "#dceeff", font: "700 34px monospace" }));

  const iconMaterial = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
  const iconXsLeft = [-0.087, -0.066, -0.045];
  const iconXsRight = [0.083, 0.104, 0.125];
  for (const sideXs of [iconXsLeft, iconXsRight]) {
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < sideXs.length; col += 1) {
        const px = xCenter + sideXs[col];
        const pz = 1.855 - row * 0.032;
        cylinder("white_touch_button_icon", 0.0028, 0.002, { x: px, y: panelY - 0.011, z: pz }, iconMaterial, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 12);
        if ((row + col) % 2 === 0) {
          addRoundedSlot("tiny_touch_icon_dash", { x: px, y: panelY - 0.012, z: pz - 0.009 }, 0.01, iconMaterial);
        }
      }
    }
  }
  box("display_lower_white_light_bar", { x: 0.17, y: 0.004, z: 0.006 }, { x: xCenter, y: panelY - 0.014, z: 1.792 }, new THREE.MeshBasicMaterial({ color: 0xfff3db }), cabinet, 0.002);
  box("display_top_glass_reflection", { x: 0.19, y: 0.003, z: 0.004 }, { x: xCenter, y: panelY - 0.014, z: 1.862 }, new THREE.MeshBasicMaterial({ color: 0x6b6b6b }), cabinet, 0.001);
}

function buildCabinet() {
  const W = DIMENSIONS.width;
  const D = DIMENSIONS.depth;
  const H = DIMENSIONS.height;
  const panel = 0.03;
  const frontY = -D / 2;
  const bayWidth = (W - panel * 3) / 2;
  const leftX = -W / 4;
  const rightX = W / 4;

  box("black_left_side_panel", { x: panel, y: D, z: H }, { x: -W / 2 + panel / 2, y: 0, z: H / 2 }, blackSide, cabinet, 0.005);
  box("black_right_side_panel", { x: panel, y: D, z: H }, { x: W / 2 - panel / 2, y: 0, z: H / 2 }, blackSide, cabinet, 0.005);
  box("black_back_panel", { x: W, y: panel, z: H }, { x: 0, y: D / 2 - panel / 2, z: H / 2 }, blackSide, cabinet, 0.004);
  box("black_top_panel", { x: W, y: D, z: panel }, { x: 0, y: 0, z: H - panel / 2 }, blackSide, cabinet, 0.004);
  box("black_bottom_panel", { x: W, y: D, z: panel }, { x: 0, y: 0, z: panel / 2 }, blackSide, cabinet, 0.004);
  box("black_right_side_visible_depth_face", { x: 0.028, y: D - 0.015, z: H - 0.035 }, { x: W / 2 + 0.002, y: 0.006, z: H / 2 }, blackSide, cabinet, 0.006);
  box("slim_black_top_slab_visible_from_above", { x: W + 0.006, y: D + 0.012, z: 0.018 }, {
    x: 0,
    y: 0.004,
    z: H + 0.006
  }, blackSatin, cabinet, 0.006);
  box("thin_rear_shadow_gap", { x: W - 0.04, y: 0.012, z: H - 0.05 }, {
    x: 0,
    y: D / 2 + 0.002,
    z: H / 2
  }, blackTrim, cabinet, 0.002);
  for (const sx of [-1, 1]) {
    box(`side_view_gold_front_return_${sx}`, { x: 0.024, y: 0.052, z: H - 0.1 }, {
      x: sx * (W / 2 - 0.012),
      y: -D / 2 - 0.028,
      z: H / 2
    }, goldWood, cabinet, 0.004);
  }

  box("cedar_inner_back_liner", { x: W - panel * 2, y: 0.012, z: H - 0.18 }, { x: 0, y: D / 2 - 0.04, z: H / 2 + 0.01 }, cedarWood);
  box("cedar_center_divider", { x: panel, y: D - 0.085, z: H - 0.13 }, { x: 0, y: 0.01, z: H / 2 + 0.02 }, cedarWood);

  box("gold_front_outer_left", { x: 0.044, y: 0.035, z: H }, { x: -W / 2 + 0.022, y: frontY - 0.012, z: H / 2 }, goldWood, cabinet, 0.004);
  box("gold_front_outer_right", { x: 0.044, y: 0.035, z: H }, { x: W / 2 - 0.022, y: frontY - 0.012, z: H / 2 }, goldWood, cabinet, 0.004);
  box("gold_front_top_rail", { x: W, y: 0.035, z: 0.052 }, { x: 0, y: frontY - 0.012, z: H - 0.026 }, goldWood, cabinet, 0.004);
  box("gold_front_bottom_vent_rail", { x: W, y: 0.037, z: 0.098 }, { x: 0, y: frontY - 0.012, z: 0.049 }, goldWood, cabinet, 0.004);
  box("gold_center_mullion", { x: 0.044, y: 0.04, z: H }, { x: 0, y: frontY - 0.016, z: H / 2 }, goldWood, cabinet, 0.004);

  for (const [side, x] of [["left", leftX], ["right", rightX]]) {
    const doorW = W / 2 - 0.052;
    box(`${side}_gold_door_outer_stile`, { x: 0.03, y: 0.04, z: H - 0.16 }, { x: x - doorW / 2 + 0.015, y: frontY - 0.026, z: H / 2 + 0.03 }, goldWood, cabinet, 0.004);
    box(`${side}_gold_door_inner_stile`, { x: 0.03, y: 0.04, z: H - 0.16 }, { x: x + doorW / 2 - 0.015, y: frontY - 0.026, z: H / 2 + 0.03 }, goldWood, cabinet, 0.004);
    box(`${side}_gold_door_top`, { x: doorW, y: 0.04, z: 0.04 }, { x, y: frontY - 0.026, z: H - 0.08 }, goldWood, cabinet, 0.004);
    box(`${side}_gold_door_bottom`, { x: doorW, y: 0.04, z: 0.045 }, { x, y: frontY - 0.026, z: 0.12 }, goldWood, cabinet, 0.004);
    box(`${side}_dark_glass_left_gasket`, { x: 0.01, y: 0.01, z: H - 0.245 }, { x: x - (doorW - 0.055) / 2, y: frontY - 0.055, z: H / 2 + 0.04 }, darkSlot, cabinet, 0.001);
    box(`${side}_dark_glass_right_gasket`, { x: 0.01, y: 0.01, z: H - 0.245 }, { x: x + (doorW - 0.055) / 2, y: frontY - 0.055, z: H / 2 + 0.04 }, darkSlot, cabinet, 0.001);
    box(`${side}_dark_glass_top_gasket`, { x: doorW - 0.055, y: 0.01, z: 0.01 }, { x, y: frontY - 0.055, z: H - 0.085 }, darkSlot, cabinet, 0.001);
    box(`${side}_dark_glass_bottom_gasket`, { x: doorW - 0.055, y: 0.01, z: 0.01 }, { x, y: frontY - 0.055, z: 0.16 }, darkSlot, cabinet, 0.001);
    box(`${side}_black_top_control_band`, { x: doorW - 0.08, y: 0.012, z: 0.07 }, { x, y: frontY - 0.06, z: H - 0.115 }, blackTrim, cabinet, 0.002);
    box(`${side}_tinted_glass_pane`, { x: doorW - 0.055, y: 0.006, z: H - 0.25 }, { x, y: frontY - 0.047, z: H / 2 + 0.035 }, glass, cabinet, 0.002);
    box(`${side}_inner_warm_header_light`, { x: doorW - 0.08, y: 0.008, z: 0.008 }, { x, y: frontY + 0.02, z: H - 0.16 }, warmLight, cabinet, 0.001);
    box(`${side}_soft_inner_amber_glow_panel`, { x: doorW - 0.11, y: 0.004, z: H - 0.36 }, {
      x,
      y: frontY + 0.034,
      z: H / 2 + 0.02
    }, warmGlow, cabinet, 0.001);
    addDisplay(x);
  }

  for (const x of [-0.024, 0.024]) {
    box("paired_brushed_gold_vertical_handle", { x: 0.018, y: 0.018, z: 0.58 }, { x, y: frontY - 0.069, z: 0.97 }, goldWood, cabinet, 0.012);
    box("handle_flat_front_highlight", { x: 0.006, y: 0.004, z: 0.49 }, { x, y: frontY - 0.082, z: 0.97 }, new THREE.MeshStandardMaterial({ color: 0xf3ce84, roughness: 0.28, metalness: 0.34 }), cabinet, 0.003);
  }

  addBay("left_bay", leftX, bayWidth);
  addBay("right_bay", rightX, bayWidth);

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 24; col += 1) {
      const x = -W / 2 + 0.045 + col * ((W - 0.09) / 23);
      addRoundedSlot(`bottom_grille_${row}_${col}`, { x, y: frontY - 0.033, z: 0.036 + row * 0.026 }, 0.018, darkSlot);
    }
  }
  for (let bay = 0; bay < 2; bay += 1) {
    const bayCenter = bay === 0 ? -W / 4 : W / 4;
    box(`black_recessed_vent_well_${bay}`, { x: W * 0.39, y: 0.018, z: 0.074 }, {
      x: bayCenter,
      y: frontY - 0.044,
      z: 0.043
    }, blackTrim, cabinet, 0.003);
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        addRoundedSlot(`front_deep_cooling_louver_${bay}_${row}_${col}`, {
          x: bayCenter - W * 0.16 + col * (W * 0.32 / 8),
          y: frontY - 0.057,
          z: 0.022 + row * 0.024
        }, 0.028, darkSlot);
      }
    }
  }
  cylinder("left_round_door_lock", 0.011, 0.006, { x: -W / 4, y: frontY - 0.036, z: 0.082 }, blackSide, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 24);
  cylinder("right_round_door_lock", 0.011, 0.006, { x: W / 4, y: frontY - 0.036, z: 0.082 }, blackSide, { x: Math.PI / 2, y: 0, z: 0 }, cabinet, 24);
  for (const x of [-W / 2 + 0.055, -0.055, 0.055, W / 2 - 0.055]) {
    cylinder("black_adjustable_front_foot", 0.018, 0.028, { x, y: frontY - 0.015, z: -0.014 }, blackSide, { x: 0, y: 0, z: 0 }, cabinet, 24);
    cylinder("soft_rubber_foot_pad", 0.021, 0.008, { x, y: frontY - 0.015, z: -0.033 }, blackTrim, { x: 0, y: 0, z: 0 }, cabinet, 24);
  }
}

buildCabinet();

const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
keyLight.position.set(3.4, 4.9, 3.8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);
scene.add(new THREE.HemisphereLight(0xffffff, 0xffe1b7, 1.15));

const plane = new THREE.Mesh(
  new THREE.CircleGeometry(1.05, 96),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.14, transparent: true })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.01;
plane.receiveShadow = true;
scene.add(plane);

function setStatus(message, hidden = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-hidden", hidden);
}

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeRenderer);
resizeRenderer();
setStatus("Estimated 980 W x 531 D x 1999 H mm", false);
setTimeout(() => setStatus("", true), 2800);
animate();
