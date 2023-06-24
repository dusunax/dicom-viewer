import * as THREE from "three";
import { Float32BufferAttribute } from "three";

import {
  LoadHandlerProps,
  LoadModelByFile,
  LoadModelBySrc,
} from "@/types/loader";

import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";

export default function usePlyViewer() {
  // ----------------------------------------------------------------
  // load handler & initialize
  // ----------------------------------------------------------------

  function initialize(container: HTMLDivElement) {
    const scW = window.innerWidth;
    const scH = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(scW, scH);

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    return { renderer, scene };
  }

  function loadHandler({
    container,
    file,
    DEFAULT_PLY_FILE_PATH,
    renderMode: renderType,
    mergeRange,
  }: LoadHandlerProps) {
    const { renderer, scene } = initialize(container);

    if (file === null) {
      loadPLYModelBySrc({
        renderer,
        container,
        scene,
        plyPath: DEFAULT_PLY_FILE_PATH,
        renderMode: renderType,
        mergeRange,
      });
    } else {
      loadPLYModelByFile({
        renderer,
        container,
        scene,
        modelFile: file,
        renderMode: renderType,
        mergeRange,
      });
    }

    return { renderer };
  }

  // ----------------------------------------------------------------
  // file loader
  // ----------------------------------------------------------------

  /** plyFile: ply model File을 load합니다. */
  function loadPLYModelByFile({
    renderer,
    container,
    scene,
    modelFile,
    renderMode: renderType,
    mergeRange = 1,
  }: LoadModelByFile) {
    console.log("파일 로더");
    const loader = new PLYLoader();

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        let plyData: string | ArrayBuffer = event.target.result;

        if (typeof plyData === "string") {
          const encoder = new TextEncoder();
          plyData = encoder.encode(plyData);
        }

        const plyDataUint8 = new Uint8Array(plyData);
        const geometry = loader.parse(plyDataUint8);

        const { mesh } =
          renderType === "standard"
            ? handleGeometry({ geometry })
            : handleTriMesh({ geometry, mergeRange });
        render({ renderer, container, scene, geometry, mesh });
        // reader.readAsArrayBuffer(plyFile);
      }
    };
  }

  /** plyPath: 경로의 ply model을 load합니다. */
  function loadPLYModelBySrc({
    renderer,
    container,
    scene,
    plyPath,
    renderMode: renderType,
    mergeRange = 1,
  }: LoadModelBySrc) {
    console.log("경로 로더");

    const loader = new PLYLoader();
    loader.load(plyPath, async (geometry) => {
      const { mesh } =
        renderType === "standard"
          ? handleGeometry({ geometry })
          : handleTriMesh({ geometry, mergeRange });

      render({ renderer, container, scene, geometry, mesh });
    });
  }

  // ----------------------------------------------------------------
  // handleGeometry
  // ----------------------------------------------------------------

  function handleGeometry({
    geometry,
  }: {
    geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
  }) {
    const positionAttribute = geometry.attributes.position;
    const normalAttribute = new Float32BufferAttribute(
      positionAttribute.count * 3,
      3
    );

    geometry.setAttribute("normal", normalAttribute);
    geometry.computeVertexNormals();

    geometry.center();

    geometry.computeBoundingBox();

    const material = new THREE.MeshStandardMaterial({
      color: "#fffcf1",
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.rotation.set(-(Math.PI / 4) * 2, (Math.PI / 4) * 2, Math.PI / 16);
    // Rotate by 45 degrees = Math.PI / 4

    return { mesh };
  }

  function handleTriMesh({
    geometry,
    mergeRange,
  }: {
    geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
    mergeRange: number;
  }) {
    const positionAttribute = geometry.attributes.position;
    const normalAttribute = new Float32BufferAttribute(
      positionAttribute.count * 3,
      3
    );

    geometry.setAttribute("normal", normalAttribute);
    geometry.computeVertexNormals();

    geometry.center();

    geometry.computeBoundingBox();

    geometry = BufferGeometryUtils.mergeVertices(geometry, mergeRange);

    const material = new THREE.MeshStandardMaterial({
      color: "#e8e2d3",
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const wireframe = new THREE.Mesh(geometry, wireframeMaterial);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.add(wireframe);

    mesh.rotation.set(-(Math.PI / 4) * 2, (Math.PI / 4) * 2, Math.PI / 16);
    // Rotate by 45 degrees = Math.PI / 4

    return { mesh };
  }

  // ----------------------------------------------------------------
  // handle render
  // - camera, light, control, render
  // ----------------------------------------------------------------

  function render({
    renderer,
    container,
    geometry,
    mesh,
    scene,
  }: {
    renderer: THREE.WebGLRenderer;
    container: any;
    geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
    mesh: THREE.Mesh<any>;
    scene: THREE.Scene;
  }) {
    let x, y, z, cameraZ;

    // setting boundingBox size
    if (geometry.boundingBox) {
      x = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      y = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      z = geometry.boundingBox.max.z - geometry.boundingBox.min.z;

      cameraZ = Math.max(x * 3, y * 3, z * 3);
    } else {
      x = y = z = 0;
      cameraZ = 1000;
    }

    const camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      1,
      3000
    );

    camera.position.set(x, y, cameraZ);
    camera.lookAt(mesh as any);

    // setting light
    var lightHolder = new THREE.Group();

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0).normalize();
    lightHolder.add(directionalLight);

    const light = new THREE.AmbientLight("#FFF", 0.3);
    lightHolder.add(light);

    scene.add(lightHolder);
    scene.add(mesh);

    const controls = new OrbitControls(camera, container);
    controls.enableZoom = true;
    // controls.autoRotate = true; // 자동 회전

    function animate() {
      requestAnimationFrame(animate);
      lightHolder.quaternion.copy(camera.quaternion);
      controls.update();

      renderer.clear();
      renderer.render(scene, camera);
    }

    animate();
  }

  return { initialize, loadHandler, loadPLYModelByFile, loadPLYModelBySrc };
}