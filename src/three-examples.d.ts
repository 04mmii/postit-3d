// src/three-examples.d.ts
declare module "three/examples/jsm/renderers/CSS3DRenderer" {
  import { Object3D, Scene, Camera } from "three";
  export class CSS3DObject extends Object3D {
    constructor(element: HTMLElement);
    element: HTMLElement;
  }
  export class CSS3DSprite extends CSS3DObject {}
  export class CSS3DRenderer {
    domElement: HTMLElement;
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
  }
}

declare module "three/examples/jsm/controls/DragControls" {
  import { Camera, Object3D } from "three";
  export class DragControls {
    constructor(objects: Object3D[], camera: Camera, domElement: HTMLElement);
    addEventListener(
      type: "dragstart" | "drag" | "dragend" | "hoveron" | "hoveroff",
      listener: (event: any) => void
    ): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
    dispose(): void;
    transformGroup: boolean;
  }
}
