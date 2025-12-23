import { useEffect } from "react";
import * as THREE from "three";

export type LightingConfig = {
  ambient?: {
    color?: number;
    intensity?: number;
  };
  main?: {
    color?: number;
    intensity?: number;
    position?: [number, number, number];
    castShadow?: boolean;
    shadowMapSize?: number;
  };
  fill?: {
    color?: number;
    intensity?: number;
    position?: [number, number, number];
  };
};

const defaultConfig: LightingConfig = {
  ambient: {
    color: 0xfff8e7,
    intensity: 0.6,
  },
  main: {
    color: 0xffffff,
    intensity: 0.8,
    position: [-300, 400, 600],
    castShadow: true,
    shadowMapSize: 2048,
  },
  fill: {
    color: 0xffeedd,
    intensity: 0.3,
    position: [200, -100, 400],
  },
};

/**
 * Three.js 씬에 조명을 설정하는 커스텀 훅
 *
 * @param scene - Three.js Scene
 * @param config - 조명 설정 (선택적)
 * @returns 생성된 조명 객체들
 */
export function useLighting(
  scene: THREE.Scene | null,
  config: LightingConfig = defaultConfig
) {
  useEffect(() => {
    if (!scene) return;

    const lights: THREE.Light[] = [];

    // 환경광 (전체적으로 부드럽게)
    const ambientConfig = { ...defaultConfig.ambient, ...config.ambient };
    const ambientLight = new THREE.AmbientLight(
      ambientConfig.color,
      ambientConfig.intensity
    );
    scene.add(ambientLight);
    lights.push(ambientLight);

    // 메인 조명 (좌상단, 그림자 생성)
    const mainConfig = { ...defaultConfig.main, ...config.main };
    const mainLight = new THREE.DirectionalLight(
      mainConfig.color,
      mainConfig.intensity
    );
    mainLight.position.set(...(mainConfig.position as [number, number, number]));

    if (mainConfig.castShadow) {
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(
        mainConfig.shadowMapSize!,
        mainConfig.shadowMapSize!
      );
      mainLight.shadow.camera.near = 100;
      mainLight.shadow.camera.far = 2000;
      mainLight.shadow.camera.left = -800;
      mainLight.shadow.camera.right = 800;
      mainLight.shadow.camera.top = 600;
      mainLight.shadow.camera.bottom = -600;
      mainLight.shadow.bias = -0.001;
      mainLight.shadow.normalBias = 0.02;
    }
    scene.add(mainLight);
    lights.push(mainLight);

    // 보조 조명 (우하단, 부드러운 필)
    const fillConfig = { ...defaultConfig.fill, ...config.fill };
    const fillLight = new THREE.DirectionalLight(
      fillConfig.color,
      fillConfig.intensity
    );
    fillLight.position.set(...(fillConfig.position as [number, number, number]));
    scene.add(fillLight);
    lights.push(fillLight);

    return () => {
      lights.forEach((light) => {
        scene.remove(light);
        light.dispose();
      });
    };
  }, [scene, config]);
}
