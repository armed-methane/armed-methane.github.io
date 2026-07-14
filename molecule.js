window.createMethaneMolecule = function (canvas, options) {
  if (!canvas || typeof THREE === "undefined") {
    console.warn("createMethaneMolecule: missing canvas or THREE not loaded");
    return null;
  }

  const opts = Object.assign(
    {
      container: canvas.parentElement,
      driftRange: 1.0,
      driftBounded: true,
      driftEnabled: true,
      idleRotationSpeed: 0.35,
      onReady: null,
    },
    options || {}
  );

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const container = opts.container;
  let width = container.clientWidth || 300;
  let height = container.clientHeight || 300;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);

  const keyLight = new THREE.PointLight(0xffffff, 1.1, 20);
  keyLight.position.set(3, 3, 4);
  scene.add(keyLight);

  const fillLight = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffffff, 0.9, 20);
  rimLight.position.set(-4, -2, 3);
  scene.add(rimLight);

  const coolAccent = new THREE.PointLight(0xdbe9ff, 0.25, 20);
  coolAccent.position.set(0, 4, -3);
  scene.add(coolAccent);

  const warmAccent = new THREE.PointLight(0xffe3d9, 0.2, 20);
  warmAccent.position.set(-3, -3, -2);
  scene.add(warmAccent);

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const controls = {
    resize,
    enableDrift: () => {
      opts.driftEnabled = true;
    },
    stop: () => {},
  };

  function onPointerMove(e) {
    if (!opts.driftEnabled) return;
    if (opts.driftBounded) {
      const rect = container.getBoundingClientRect();
      const withinX = e.clientX >= rect.left && e.clientX <= rect.right;
      const withinY = e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!withinX || !withinY) return;
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = nx * opts.driftRange * 2;
      targetY = -ny * opts.driftRange * 2;
    } else {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      targetX = nx * opts.driftRange * 2;
      targetY = -ny * opts.driftRange * 2;
    }
  }

  if (!prefersReducedMotion) {
    window.addEventListener("mousemove", onPointerMove, { passive: true });
  }

  function resize() {
    width = container.clientWidth || width;
    height = container.clientHeight || height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener("resize", resize);
  function buildProceduralEnvMap() {
    const envScene = new THREE.Scene();
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, "#0a0c10");
      grad.addColorStop(0.45, "#1f2224");
      grad.addColorStop(0.55, "#dddddd");
      grad.addColorStop(0.62, "#1f2224");
      grad.addColorStop(1, "#000000");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(0, 40, 256, 4);
      ctx.fillRect(0, 130, 256, 6);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(0, 190, 256, 3);
    const tex = new THREE.CanvasTexture(c);
    const skyGeo = new THREE.SphereGeometry(20, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
    envScene.add(new THREE.Mesh(skyGeo, skyMat));
    return envScene;
  }

  function captureEnvMap(envScene) {
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    const cubeCamera = new THREE.CubeCamera(0.1, 50, cubeRenderTarget);
    cubeCamera.update(renderer, envScene);
    return cubeRenderTarget.texture;
  }

  function buildMolecule(envMap) {
    function chromeMaterial(color) {
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 1,
        roughness: envMap ? 0.08 : 0.2,
        envMap: envMap || null,
        envMapIntensity: 2.2,
      });
    }

    const molecule = new THREE.Group();
    scene.add(molecule);

    const carbonGeo = new THREE.SphereGeometry(0.72, 32, 32);
    molecule.add(new THREE.Mesh(carbonGeo, chromeMaterial(0x0a0c10)));

    const bondLength = 1.1;
    const positions = [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ].map((p) =>
      new THREE.Vector3(...p).normalize().multiplyScalar(bondLength)
    );

    const hydrogenGeo = new THREE.SphereGeometry(0.6, 28, 28);
    const hydrogenMat = chromeMaterial(0xe8eaed);
    const bondMat = chromeMaterial(0x0f1115);

    positions.forEach((pos) => {
      const hydrogen = new THREE.Mesh(hydrogenGeo, hydrogenMat);
      hydrogen.position.copy(pos);
      molecule.add(hydrogen);

      const bondGeo = new THREE.CylinderGeometry(0.17, 0.17, pos.length(), 12);
      const bond = new THREE.Mesh(bondGeo, bondMat);
      bond.position.copy(pos).multiplyScalar(0.5);
      bond.lookAt(pos);
      bond.rotateX(Math.PI / 2);
      molecule.add(bond);
    });

    const clock = new THREE.Clock();
    let running = true;
    controls.stop = () => {
      running = false;
    };

    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);

      if (!prefersReducedMotion) {
        currentX += (targetX - currentX) * Math.min(dt * 2.5, 1);
        currentY += (targetY - currentY) * Math.min(dt * 2.5, 1);
        molecule.position.set(currentX, currentY, 0);

        molecule.rotation.y += dt * opts.idleRotationSpeed;
        molecule.rotation.x += dt * (opts.idleRotationSpeed * 0.43);
      }

      renderer.render(scene, camera);
    }

    animate();
    if (typeof opts.onReady === "function") opts.onReady();
  }

  function startWithFallbackEnv(reason) {
    if (reason) console.warn("methane molecule: falling back —", reason);
    try {
      const envMap = captureEnvMap(buildProceduralEnvMap());
      buildMolecule(envMap);
    } catch (err) {
      console.error("methane molecule: env map capture failed, rendering flat", err);
      buildMolecule(null);
    }
  }

  try {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "chrome-swirl.png",
      (swirlTexture) => {
        try {
          swirlTexture.mapping = THREE.EquirectangularReflectionMapping;
          const envScene = new THREE.Scene();
          const skyGeo = new THREE.SphereGeometry(20, 32, 32);
          const skyMat = new THREE.MeshBasicMaterial({
            map: swirlTexture,
            side: THREE.BackSide,
          });
          envScene.add(new THREE.Mesh(skyGeo, skyMat));
          const envMap = captureEnvMap(envScene);
          buildMolecule(envMap);
        } catch (err) {
          startWithFallbackEnv(err.message);
        }
      },
      undefined,
      (err) => startWithFallbackEnv("texture load error (" + (err && err.message ? err.message : "unknown") + ")")
    );
  } catch (err) {
    startWithFallbackEnv(err.message);
  }

  return controls;
};

document.addEventListener("DOMContentLoaded", () => {
  const bannerCanvas = document.getElementById("moleculeCanvas");
  if (bannerCanvas) {
    window.__bannerMoleculeControls = window.createMethaneMolecule(bannerCanvas, {
      container: document.querySelector(".molecule-banner"),
      driftRange: 1.0,
      driftBounded: true,
      driftEnabled: false,
      idleRotationSpeed: 0.35,
    });
  } else {
    console.warn("methane molecule: #moleculeCanvas not found in DOM");
  }

  const heroCanvas = document.getElementById("heroMoleculeCanvas");
  if (heroCanvas) {
    window.__heroMoleculeControls = window.createMethaneMolecule(heroCanvas, {
      container: document.getElementById("heroMolecule"),
      driftRange: 0.5,
      driftBounded: false,
      idleRotationSpeed: 0.5,
    });
  } else {
    console.warn("methane molecule: #heroMoleculeCanvas not found in DOM");
  }
});
